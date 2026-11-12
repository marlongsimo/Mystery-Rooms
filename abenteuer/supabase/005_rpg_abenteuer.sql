-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 005: Das Abenteuer einer Kampagne mitgeben
-- Setzt Migration 001–004 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG. Keine neue Tabelle, keine neue Spalte, keine Daten werden gelöscht.
-- Die Spalte rpg_campaigns.adventure_slug gibt es seit Migration 001; neu ist nur:
--   • rpg_claim_table liefert zusätzlich 'abenteuer' – ein Tisch-Gerät weiß damit,
--     welches Abenteuer gewählt wurde (vorher zeigte es das zuletzt dort gewählte).
--   • rpg_set_adventure: Host oder Tisch dürfen das Abenteuer einer Kampagne ändern,
--     solange noch nichts gespeichert ist (Version 0) – für eine leere Kampagne,
--     die für ein anderes Abenteuer wiederverwendet wird.
--
-- Rückbau: 005_rpg_abenteuer_rueckbau.sql
-- =====================================================================

begin;

create or replace function public.rpg_claim_table(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_l public.rpg_links%rowtype; v_c public.rpg_campaigns%rowtype;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  v_l := public.rpg_link_von(p_token);
  if v_l.id is null or v_l.art <> 'tisch' then raise exception 'Dieser Tisch-Link ist abgelaufen oder ungültig.'; end if;
  select * into v_c from public.rpg_campaigns where id = v_l.campaign_id;
  if v_c.status in ('abgeschlossen', 'archiviert') then raise exception 'Diese Kampagne ist beendet.'; end if;
  if not public.rpg_ist_host(v_c.id) then
    update public.rpg_campaign_members set member_status = 'ausgetreten', left_at = now() where campaign_id = v_c.id and role = 'tisch' and user_id <> auth.uid();
    insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name) values (v_c.id, auth.uid(), 'tisch', 'Spieltisch')
    on conflict (campaign_id, user_id) do update set role = 'tisch', member_status = 'aktiv', left_at = null, display_name = 'Spieltisch';
  end if;
  update public.rpg_links set revoked_at = now() where id = v_l.id; -- Tisch-Links gelten einmal
  return jsonb_build_object('campaign_id', v_c.id, 'titel', v_c.title, 'difficulty', v_c.difficulty, 'version', v_c.current_version, 'status', v_c.status,
    'abenteuer', v_c.adventure_slug);
end;
$$;

create or replace function public.rpg_set_adventure(p_campaign_id uuid, p_adventure text)
returns text language plpgsql security definer set search_path = public as $$
declare v_c public.rpg_campaigns%rowtype;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if not (public.rpg_ist_host(p_campaign_id) or public.rpg_ist_tisch(p_campaign_id)) then raise exception 'Nur der Host oder der Spieltisch kann das Abenteuer ändern.'; end if;
  if p_adventure is null or p_adventure !~ '^[a-z0-9-]{2,40}$' then raise exception 'Unbekanntes Abenteuer.'; end if;
  select * into v_c from public.rpg_campaigns where id = p_campaign_id for update;
  if v_c.current_version > 0 then raise exception 'Das Abenteuer lässt sich nur vor dem ersten Speichern ändern.'; end if;
  update public.rpg_campaigns set adventure_slug = p_adventure, updated_at = now() where id = p_campaign_id;
  return p_adventure;
end;
$$;

revoke all on function public.rpg_claim_table(text), public.rpg_set_adventure(uuid, text) from public, anon;
grant execute on function public.rpg_claim_table(text), public.rpg_set_adventure(uuid, text) to authenticated;

commit;
