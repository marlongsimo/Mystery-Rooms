/*
 * MYSTERY ROOMS – Multiplayer-Kern (spielunabhängig)
 *
 * Verbindet ein Escape-Room-Spiel über Supabase mit einer gemeinsamen Sitzung.
 * Kennt kein einziges Rätsel: Welches Spiel gemeint ist, steht nur im gameSlug.
 *
 * Benötigt (in dieser Reihenfolge geladen):
 *   platform/multiplayer/vendor/supabase-js-2.45.4.js   → window.supabase
 *   platform/multiplayer/mp-config.js                   → window.MR_MULTIPLAYER_CONFIG
 *
 * Verwendete Datenbankfunktionen (vorhanden in Supabase, Signaturen geprüft):
 *   create_game_session(p_game_slug, p_player_name, p_max_players)
 *   join_game_session(p_room_code, p_player_name)
 *   start_game_session(p_session_id)
 *   leave_game_session(p_session_id)
 *   set_session_state(p_session_id, p_state_key, p_state) → neue Revision
 * Gelesen wird über die Tabellen game_sessions, session_players und session_state;
 * was ein Spieler sehen und ändern darf, regeln die RLS-Richtlinien der Datenbank.
 *
 * Gemeinsamer Zustand: set_session_state ersetzt den ganzen Eintrag und prüft keine
 * Version. Damit gleichzeitige Änderungen nicht verloren gehen, wird immer
 * gelesen → zusammengeführt → geschrieben. Die Zusammenführung ist eine reine
 * Vereinigung (Listen, Wahrheitswerte, Zahlen wachsen nur). Geht trotzdem eine
 * Änderung verloren, weil zwei Geräte exakt gleichzeitig schreiben, bemerkt das
 * betroffene Gerät beim nächsten Abgleich, dass sein Stand fehlt, und schreibt erneut.
 */
(() => {
  "use strict";

  /* ---------- Zusammenführen ---------- */
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const keyOf = (v) => (isObj(v) && "id" in v ? "id:" + v.id : JSON.stringify(v));
  const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  function merge(a, b) {
    if (a === undefined || a === null) return clone(b);
    if (b === undefined || b === null) return clone(a);
    if (Array.isArray(a) && Array.isArray(b)) {
      const seen = new Set(a.map(keyOf)), out = clone(a);
      for (const x of b) { const k = keyOf(x); if (!seen.has(k)) { seen.add(k); out.push(clone(x)); } }
      return out;
    }
    if (isObj(a) && isObj(b)) {
      const out = clone(a);
      for (const k of Object.keys(b)) out[k] = merge(a[k], b[k]);
      return out;
    }
    if (typeof a === "boolean" && typeof b === "boolean") return a || b;
    if (typeof a === "number" && typeof b === "number") return Math.max(a, b);
    // Sonstige Werte: eindeutige Wahl, damit zwei Geräte nicht endlos hin- und herschreiben
    return JSON.stringify(a) >= JSON.stringify(b) ? clone(a) : clone(b);
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const ident = (x) => x;
  /** Enthält `big` bereits alles aus `small`? */
  const contains = (big, small, normalize = ident) => same(normalize(merge(big, small)), normalize(clone(big)));

  /* ---------- Sicherheitsprüfung des Schlüssels ---------- */
  function assertPublicKey(key) {
    if (!key) throw new Error("Supabase ist nicht konfiguriert (platform/multiplayer/mp-config.js).");
    if (/^sb_secret_/i.test(key) || /service_role/i.test(key)) throw new Error("Im Browser darf nur der Publishable Key stehen – niemals ein Secret- oder Service-Role-Key.");
    if (/^eyJ/.test(key)) { // ältere JWT-Schlüssel: nur „anon“ ist zulässig
      try { const role = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role; if (role !== "anon") throw 0; }
      catch (e) { throw new Error("Im Browser darf nur der öffentliche Schlüssel stehen."); }
    }
  }

  const friendly = (err, fallback) => {
    const m = (err && (err.message || err.error_description)) || "";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Keine Verbindung zum Server. Bitte prüfe die Internetverbindung.";
    if (/anonymous.*disabled/i.test(m)) return "Anonyme Anmeldung ist im Supabase-Projekt ausgeschaltet.";
    return m || fallback;
  };

  /* ---------- Client ---------- */
  const POLL_MS = 4000;

  class Client {
    constructor(opts) {
      const cfg = window.MR_MULTIPLAYER_CONFIG || {};
      this.url = opts.supabaseUrl || cfg.supabaseUrl;
      this.key = opts.supabasePublishableKey || cfg.supabasePublishableKey;
      assertPublicKey(this.key);
      if (!opts.gameSlug) throw new Error("gameSlug fehlt.");
      this.gameSlug = opts.gameSlug;
      this.maxPlayers = Number(opts.maxPlayers) || 4;
      this.storeKey = "mr_mp_session_v1:" + this.gameSlug;
      this.handlers = {};
      this.session = null;   // { session_id, room_code, game_slug, max_players, status, is_host }
      this.user = null;
      this.players = [];
      this.rev = {};         // zuletzt gesehene Revision je state_key
      this.states = {};      // zuletzt gesehener Inhalt je state_key
      this.queue = Promise.resolve();
      this._db = null; this.channel = null; this.timer = null;
    }

    on(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); return () => { this.handlers[ev] = this.handlers[ev].filter((f) => f !== fn); }; }
    emit(ev, ...args) { (this.handlers[ev] || []).slice().forEach((f) => { try { f(...args); } catch (e) { console.error("[Multiplayer]", e); } }); }

    get db() {
      if (this._db) return this._db;
      if (!window.supabase || !window.supabase.createClient) throw new Error("Die Supabase-Bibliothek wurde nicht geladen.");
      this._db = window.supabase.createClient(this.url, this.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
      this._db.auth.onAuthStateChange((_e, s) => { if (s && s.access_token) this._db.realtime.setAuth(s.access_token); });
      return this._db;
    }

    /** Anonyme Anmeldung; die Sitzung bleibt im Browser gespeichert (Neuladen). */
    async ensureUser() {
      const { data } = await this.db.auth.getSession();
      let s = data && data.session;
      if (!s) {
        const r = await this.db.auth.signInAnonymously();
        if (r.error) throw new Error(friendly(r.error, "Anmeldung fehlgeschlagen."));
        s = r.data.session;
      }
      this.user = s.user;
      this.db.realtime.setAuth(s.access_token);
      return s.user;
    }

    _remember() { try { localStorage.setItem(this.storeKey, JSON.stringify({ session_id: this.session.session_id, room_code: this.session.room_code })); } catch (e) { /* privat */ } }
    _forget() { try { localStorage.removeItem(this.storeKey); } catch (e) { /* privat */ } }
    _adopt(data, isHost) {
      this.session = {
        session_id: data.session_id || data.id, room_code: data.room_code, game_slug: data.game_slug,
        max_players: data.max_players || this.maxPlayers, status: data.status || "waiting", is_host: Boolean(isHost),
      };
      this.rev = {}; this.states = {};
      this._remember();
      return this.session;
    }

    async create(playerName) {
      await this.ensureUser();
      const { data, error } = await this.db.rpc("create_game_session", { p_game_slug: this.gameSlug, p_player_name: playerName, p_max_players: this.maxPlayers });
      if (error) throw new Error(friendly(error, "Die Sitzung konnte nicht erstellt werden."));
      this._adopt(data, true);
      await this.refresh();
      await this.fetchStates().catch(() => {});
      this.watch();
      return this.session;
    }

    async join(code, playerName) {
      await this.ensureUser();
      const { data, error } = await this.db.rpc("join_game_session", { p_room_code: code, p_player_name: playerName });
      if (error) throw new Error(friendly(error, "Beitritt fehlgeschlagen. Bitte prüfe den Code."));
      if (data.game_slug && data.game_slug !== this.gameSlug) throw new Error("Dieser Code gehört zu einem anderen Escape Room.");
      this._adopt(data, data.is_host);
      await this.refresh();
      await this.fetchStates().catch(() => {}); // z. B. wer schon „bereit“ ist
      this.watch();
      return this.session;
    }

    async start() {
      if (!this.session) return;
      const { error } = await this.db.rpc("start_game_session", { p_session_id: this.session.session_id });
      if (error) throw new Error(friendly(error, "Das Spiel konnte nicht gestartet werden."));
      this._setStatus("running");
    }

    async leave() {
      const s = this.session;
      if (s) {
        const { error } = await this.db.rpc("leave_game_session", { p_session_id: s.session_id });
        if (error && !/geschlossen|nicht.*Teilnehmer/i.test(error.message || "")) throw new Error(friendly(error, "Die Sitzung konnte nicht verlassen werden."));
      }
      this._drop();
    }

    /** Lokale Sitzung vergessen, ohne die Datenbank zu ändern. */
    _drop() { this.unwatch(); this._forget(); this.session = null; this.players = []; this.rev = {}; this.states = {}; }

    /**
     * Nach dem Neuladen: gespeicherte Sitzung wiederfinden. Ein Wieder-Beitreten ist
     * nach dem Start serverseitig gesperrt – Mitglieder lesen ihre Sitzung einfach weiter.
     * Ergebnis: Sitzung | { closed: true } | null
     */
    async restore() {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(this.storeKey) || "null"); } catch (e) { /* defekt */ }
      if (!saved || !saved.session_id) return null;
      await this.ensureUser();
      const { data, error } = await this.db.from("game_sessions").select("id, game_slug, room_code, status, max_players").eq("id", saved.session_id).maybeSingle();
      if (error) throw new Error(friendly(error, "Die Sitzung konnte nicht geladen werden."));
      if (!data || data.status === "closed") { this._drop(); return data ? { closed: true, room_code: data.room_code } : null; }
      this.session = { session_id: data.id, room_code: data.room_code, game_slug: data.game_slug, max_players: data.max_players, status: data.status, is_host: false };
      await this.refresh();
      const me = this.players.find((p) => p.user_id === this.user.id);
      if (!me) { this._drop(); return null; }
      this.session.is_host = me.is_host;
      this.watch();
      return this.session;
    }

    async refresh() {
      if (!this.session) return;
      const sid = this.session.session_id;
      const [pl, gs] = await Promise.all([
        this.db.from("session_players").select("user_id, player_name, is_host, joined_at").eq("session_id", sid).order("joined_at", { ascending: true }),
        this.db.from("game_sessions").select("status").eq("id", sid).maybeSingle(),
      ]);
      if (!this.session || this.session.session_id !== sid) return;
      if (!pl.error) {
        const before = JSON.stringify(this.players);
        this.players = pl.data || [];
        if (JSON.stringify(this.players) !== before) this.emit("players", this.players);
        if (this.user && this.players.length && !this.players.some((p) => p.user_id === this.user.id)) return this._lost("Du bist nicht mehr Teil dieser Sitzung.");
      }
      if (!gs.error) {
        if (!gs.data) return this._lost("Diese Sitzung gibt es nicht mehr.");
        this._setStatus(gs.data.status);
      }
    }

    _setStatus(status) {
      if (!this.session || this.session.status === status) return;
      this.session.status = status;
      this.emit("status", status, this.session);
      if (status === "closed") this._lost("Der Host hat die Sitzung beendet.");
    }
    _lost(reason) { const s = this.session; this._drop(); this.emit("lost", reason, s); }

    /* ---------- gemeinsamer Zustand ---------- */
    async fetchStates() {
      if (!this.session) return [];
      const sid = this.session.session_id;
      const { data, error } = await this.db.from("session_state").select("state_key, state, revision, updated_by").eq("session_id", sid);
      if (error) throw new Error(friendly(error, "Spielstand konnte nicht geladen werden."));
      if (!this.session || this.session.session_id !== sid) return [];
      (data || []).forEach((row) => this._ingest(row));
      return data || [];
    }
    _ingest(row) {
      if (!row || row.state_key == null) return;
      if ((this.rev[row.state_key] || 0) >= row.revision) return;
      this.rev[row.state_key] = row.revision;
      this.states[row.state_key] = row.state;
      this.emit("state", row);
    }

    /** Teilt `local` unter `key`: lesen → vereinigen → schreiben, bis der Server alles enthält. */
    writeMerged(key, local, normalize = ident) {
      const job = this.queue.then(() => this._writeMerged(key, local, normalize));
      this.queue = job.catch(() => {});
      return job;
    }
    async _writeMerged(key, local, normalize) {
      // Schreiben zwei Geräte im selben Augenblick, überschreibt das zweite das erste –
      // ohne dass das erste es an seiner Revision erkennen kann. Deshalb wird nach jedem
      // Schreiben nach einer kurzen, zufälligen Pause nachgelesen: Fehlt etwas, geht es
      // in die nächste Runde. Zusätzlich prüft sync() bei jedem empfangenen Stand erneut.
      for (let attempt = 0; attempt < 8; attempt++) {
        if (!this.session) return null;
        const sid = this.session.session_id;
        const { data, error } = await this.db.from("session_state").select("state, revision, updated_by").eq("session_id", sid).eq("state_key", key).maybeSingle();
        if (error) throw new Error(friendly(error, "Spielstand konnte nicht gelesen werden."));
        if (data) this._ingest({ ...data, state_key: key });
        const base = data ? data.state : null;
        const merged = normalize(merge(base, local));
        if (data && same(merged, normalize(clone(base)))) return base; // Server hat schon alles
        const res = await this.db.rpc("set_session_state", { p_session_id: sid, p_state_key: key, p_state: merged });
        if (res.error) throw new Error(friendly(res.error, "Spielstand konnte nicht gespeichert werden."));
        this._ingest({ state_key: key, state: merged, revision: Number(res.data), updated_by: this.user && this.user.id });
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 400 * (attempt + 1)));
      }
      return null;
    }

    /** Eintrag, den nur dieses Gerät schreibt (z. B. eigene Position). */
    async writeOwn(key, value) {
      if (!this.session) return;
      const { data, error } = await this.db.rpc("set_session_state", { p_session_id: this.session.session_id, p_state_key: key, p_state: value });
      if (error) throw new Error(friendly(error, "Position konnte nicht gespeichert werden."));
      this._ingest({ state_key: key, state: value, revision: Number(data), updated_by: this.user && this.user.id });
    }

    /* ---------- Echtzeit + Abgleich ---------- */
    watch() {
      this.unwatch();
      if (!this.session) return;
      const sid = this.session.session_id;
      try {
        this.channel = this.db.channel("mr-session-" + sid)
          .on("postgres_changes", { event: "*", schema: "public", table: "session_players", filter: "session_id=eq." + sid }, () => this.refresh().catch(() => {}))
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_sessions", filter: "id=eq." + sid }, (p) => { if (p.new && p.new.status) this._setStatus(p.new.status); })
          .on("postgres_changes", { event: "*", schema: "public", table: "session_state", filter: "session_id=eq." + sid }, (p) => { if (p.new && p.new.state_key) this._ingest(p.new); })
          .subscribe((st) => this.emit("connection", st));
      } catch (e) { this.channel = null; }
      // Sicherheitsnetz: regelmäßiger Abgleich, falls Echtzeit-Ereignisse ausbleiben
      const tick = () => {
        if (!this.session || document.hidden) return;
        // auch während der Wartephase: dort stehen z. B. die Bereitschaftsmeldungen
        this.refresh().then(() => this.session && this.fetchStates()).catch((e) => this.emit("error", e));
      };
      this.timer = setInterval(tick, POLL_MS);
      this._vis = () => { if (!document.hidden) tick(); };
      document.addEventListener("visibilitychange", this._vis);
    }
    unwatch() {
      if (this.channel && this._db) this._db.removeChannel(this.channel);
      this.channel = null;
      clearInterval(this.timer); this.timer = null;
      if (this._vis) document.removeEventListener("visibilitychange", this._vis);
      this._vis = null;
    }

    /* ---------- Bereitschaft vor dem Start (eigener Eintrag je Spieler, wie die Position) ---------- */
    async setReady(on = true) { if (this.user) await this.writeOwn("ready:" + this.user.id, { ready: Boolean(on), at: Date.now() }); }
    isReady(userId) { const s = this.states["ready:" + userId]; return Boolean(s && s.ready); }

    playerName(userId) { const p = this.players.find((x) => x.user_id === userId); return p ? p.player_name : null; }
  }

  /**
   * Verbindet einen laufenden Spielstand mit der Sitzung.
   * game: {
   *   exportShared()        → gemeinsamer Teil des lokalen Spielstands
   *   applyShared(state, byName) → Server-Stand in den lokalen Spielstand übernehmen
   *   normalize(state)      → optional, z. B. verbrauchte Gegenstände entfernen
   *   position()            → optional, eigene Position { room, roomName, view }
   *   onTeam(list)          → optional, Positionen der anderen Spieler
   * }
   */
  function sync(client, game, { key = "shared", posPrefix = "pos:" } = {}) {
    const normalize = game.normalize || ident;
    let lastPushed = null, lastPos = null, timer = null, stopped = false;
    const team = () => {
      if (!game.onTeam || !client.session) return;
      const list = client.players.filter((p) => !client.user || p.user_id !== client.user.id).map((p) => ({
        name: p.player_name, isHost: p.is_host, pos: client.states[posPrefix + p.user_id] || null,
      }));
      game.onTeam(list);
    };
    const push = () => {
      if (stopped || !client.session) return;
      const local = normalize(game.exportShared());
      const json = JSON.stringify(local);
      const remote = client.states[key];
      if (json !== lastPushed || (remote && !contains(remote, local, normalize))) {
        lastPushed = json;
        client.writeMerged(key, local, normalize).catch((e) => { lastPushed = null; client.emit("error", e); });
      }
      if (game.position && client.user) {
        const pos = game.position();
        const pj = JSON.stringify(pos);
        if (pj !== lastPos) { lastPos = pj; client.writeOwn(posPrefix + client.user.id, { ...pos, name: client.playerName(client.user.id) }).catch(() => { lastPos = null; }); }
      }
    };
    const offs = [
      client.on("state", (row) => {
        if (row.state_key === key) {
          const byName = row.updated_by && client.user && row.updated_by !== client.user.id ? client.playerName(row.updated_by) : null;
          game.applyShared(row.state, byName);
          // Fehlt auf dem Server etwas, das hier schon erreicht wurde (z. B. weil zwei
          // Geräte gleichzeitig schrieben), wird es erneut geschickt.
          if (!contains(row.state, normalize(game.exportShared()), normalize)) changed();
        } else if (row.state_key.startsWith(posPrefix)) team();
      }),
      client.on("players", team),
    ];
    function changed() { if (stopped) return; clearTimeout(timer); timer = setTimeout(push, 250); }
    const ready = client.fetchStates().then(() => { push(); team(); });
    return {
      ready,
      changed,
      flush: push,
      stop() { stopped = true; clearTimeout(timer); offs.forEach((off) => off()); },
    };
  }

  window.MRMultiplayer = {
    connect: (opts) => new Client(opts),
    sync,
    merge, contains,
    version: 1,
  };
})();
