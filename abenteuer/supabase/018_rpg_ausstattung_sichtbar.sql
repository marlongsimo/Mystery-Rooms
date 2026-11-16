-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 018: Profilrahmen für andere sichtbar (Arena, Freunde)
-- Setzt Migration 003 (Freunde), 008 (Arena) und 017 (Ausstattung) voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent). Bitte UNVERÄNDERT ausführen.
--
-- NUR FÜR DAS RPG. Rein additiv: zwei neue Funktionen, keine Tabelle, nichts Vorhandenes wird geändert.
--
-- Was diese Migration bringt:
--   • rpg_arena_looks(Kampf): Profilbild und Profilrahmen beider Teilnehmer eines Arena-Kampfes – nur für die beiden
--     Teilnehmer selbst. Damit zeigt die Arena den Rahmen des Gegners in Aufstellung und Ergebnis.
--   • rpg_looks(Namen): Profilrahmen (und Profilbild) der genannten Konten – aber nur für einen selbst und für
--     bestätigte Freunde. Für alle anderen Namen kommt nichts zurück. Damit zeigen Taverne und Einladungen die Rahmen.
--   • Herausgegeben werden nur: Benutzername, Kennung des Profilbilds, Kennung des Rahmens. Kein Besitz, kein Kontostand,
--     kein Würfel.
--
-- Rückbau: 018_rpg_ausstattung_sichtbar_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.rpg_cosmetic_equipped') is null then raise exception 'Migration 018 braucht Migration 017 (Ausstattung). Bitte zuerst 017 ausführen.'; end if;
  if to_regprocedure('public.rpg_sind_freunde(uuid, uuid)') is null or to_regclass('public.rpg_arena_matches') is null then
    raise exception 'Migration 018 braucht die Freunde aus Migration 003 (rpg_sind_freunde) und die Arena aus Migration 008.';
  end if;
end $$;

-- Aussehen eines Kontos: Profilbild und Rahmen (nicht direkt aufrufbar)
create or replace function public.rpg_look_von(p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', p.handle, 'avatar', p.avatar_key,
    'rahmen', (select e.rahmen from public.rpg_cosmetic_equipped e where e.user_id = p.user_id))
  from public.rpg_profiles p where p.user_id = p_user;
$$;

-- Beide Teilnehmer eines Kampfes – nur für die Teilnehmer
create or replace function public.rpg_arena_looks(p_match_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id;
  if not found or v_uid is null or (v_m.host_id <> v_uid and v_m.guest_id is distinct from v_uid) then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  return jsonb_build_object('host', public.rpg_look_von(v_m.host_id), 'gast', case when v_m.guest_id is null then null else public.rpg_look_von(v_m.guest_id) end);
end;
$$;

-- Aussehen nach Benutzernamen: nur man selbst und bestätigte Freunde, höchstens 60 Namen je Aufruf
create or replace function public.rpg_looks(p_handles text[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or p_handles is null or cardinality(p_handles) = 0 then return '{}'::jsonb; end if;
  if cardinality(p_handles) > 60 then raise exception 'Zu viele Namen.'; end if;
  return coalesce((select jsonb_object_agg(p.handle, public.rpg_look_von(p.user_id))
    from public.rpg_profiles p
    where lower(p.handle) in (select lower(h) from unnest(p_handles) h) and (p.user_id = v_uid or public.rpg_sind_freunde(v_uid, p.user_id))), '{}'::jsonb);
end;
$$;

revoke all on function public.rpg_look_von(uuid), public.rpg_arena_looks(uuid), public.rpg_looks(text[]) from public, anon, authenticated;
grant execute on function public.rpg_arena_looks(uuid), public.rpg_looks(text[]) to authenticated;

commit;
