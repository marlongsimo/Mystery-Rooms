/* Mythara – Service Worker (nur für /abenteuer/).
 * Zweck: Installation als App und schnelle Bilder, auch bei wackligem Netz.
 *  - Bilder und Schriften: sofort aus dem Speicher, im Hintergrund aufgefrischt.
 *  - Seiten, Skripte, Stile: immer zuerst aus dem Netz (nie veraltet), der Speicher hilft nur ohne Netz.
 *  - Alles andere (Supabase, fremde Adressen, Schreibzugriffe) bleibt unberührt. */
const VERSION = "mythara-v1", BILDER = VERSION + "-bilder", SEITEN = VERSION + "-seiten";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("mythara-") && !k.startsWith(VERSION)) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", (e) => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  const bereich = new URL(self.registration.scope).pathname, portal = bereich.replace(/abenteuer\/$/, "portal/");
  if (!u.pathname.startsWith(bereich) && !u.pathname.startsWith(portal)) return;
  if (/\.(webp|png|jpe?g|svg|woff2)$/i.test(u.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(BILDER), da = await c.match(r);
      const netz = fetch(r).then((a) => { if (a.ok) c.put(r, a.clone()); return a; });
      if (da) { e.waitUntil(netz.catch(() => {})); return da; }
      return netz;
    })());
    return;
  }
  e.respondWith((async () => {
    const c = await caches.open(SEITEN);
    try { const a = await fetch(r); if (a.ok) c.put(r, a.clone()); return a; }
    catch (fehler) { const da = (await c.match(r)) || (r.mode === "navigate" ? await c.match(r, { ignoreSearch: true }) : null); if (da) return da; throw fehler; }
  })());
});
