-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 021: Codes für Seelensplitter
-- Setzt Migration 006 (Codes, Admins) und 008 (Währung: rpg_wallet) voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent). Bitte UNVERÄNDERT ausführen.
--
-- NUR FÜR DAS RPG. Es wird nichts gelöscht; vorhandene Codes bleiben, wie sie sind (sie schalten weiter alle Helden frei).
--
-- Was diese Migration bringt:
--   • Ein Code kann statt der Helden eine Menge Seelensplitter bringen (Spalte rpg_unlock_codes.waehrung, 1 bis 5000;
--     leer = wie bisher alle Helden).
--   • rpg_admin_create_code bekommt dafür einen fünften Parameter p_waehrung (leer = Helden-Code). Die Fassung mit vier
--     Parametern wird durch diese ersetzt; Aufrufe ohne den neuen Parameter funktionieren weiter.
--   • rpg_admin_codes nennt je Code, was er bringt ('waehrung').
--   • rpg_redeem_unlock_code schreibt bei einem Splitter-Code den Betrag gut und meldet 'waehrung' und den neuen
--     Kontostand zurück. Alles andere (Versuchssperre, einmal je Konto, Ablauf, Höchstzahl, „nur für“) gilt unverändert.
--
-- Rückbau: 021_rpg_splitter_codes_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.rpg_unlock_codes') is null or to_regprocedure('public.rpg_ist_admin()') is null then raise exception 'Migration 021 braucht Migration 006 (Codes und Admins).'; end if;
  if to_regclass('public.rpg_wallet') is null then raise exception 'Migration 021 braucht Migration 008 (Seelensplitter: rpg_wallet).'; end if;
end $$;

alter table public.rpg_unlock_codes add column if not exists waehrung integer check (waehrung is null or waehrung between 1 and 5000);

-- Einlösen (Fassung aus Migration 006, ergänzt um Splitter-Codes)
create or replace function public.rpg_redeem_unlock_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_k public.rpg_unlock_codes%rowtype; v_vorher integer; v_stand integer;
begin
  if not public.rpg_sammlung_konto() then raise exception 'Codes kann nur ein Spielerkonto einlösen.'; end if;
  delete from public.rpg_unlock_attempts where at < now() - interval '1 day';
  if (select count(*) from public.rpg_unlock_attempts where user_id = v_uid and at > now() - interval '1 hour') >= 10 then
    raise exception 'Zu viele Versuche. Bitte in einer Stunde noch einmal.';
  end if;
  select * into v_k from public.rpg_unlock_codes where code_hash = public.rpg_link_hash(p_code) for update;
  if not found then
    -- kein Fehler werfen: sonst würde der Fehlversuch mit zurückgerollt und die Sperre griffe nie
    insert into public.rpg_unlock_attempts (user_id) values (v_uid);
    return jsonb_build_object('fehler', 'Dieser Code ist ungültig.');
  end if;
  if exists (select 1 from public.rpg_unlock_redemptions where code_id = v_k.id and user_id = v_uid) then
    raise exception 'Diesen Code hast du schon eingelöst.';
  end if;
  if v_k.for_user is not null and v_k.for_user <> v_uid then raise exception 'Dieser Code ist für ein anderes Konto bestimmt.'; end if;
  if not v_k.active then raise exception 'Dieser Code ist nicht mehr gültig.'; end if;
  if v_k.expires_at < now() then raise exception 'Dieser Code ist abgelaufen.'; end if;
  if v_k.uses >= v_k.max_uses then raise exception 'Dieser Code wurde schon so oft eingelöst wie möglich.'; end if;
  if v_k.waehrung is not null then
    -- Splitter-Code: Betrag gutschreiben, an der Heldensammlung ändert sich nichts
    insert into public.rpg_wallet (user_id, betrag) values (v_uid, v_k.waehrung)
      on conflict (user_id) do update set betrag = public.rpg_wallet.betrag + excluded.betrag, updated_at = now()
      returning betrag into v_stand;
    insert into public.rpg_unlock_redemptions (code_id, user_id) values (v_k.id, v_uid);
    update public.rpg_unlock_codes set uses = uses + 1 where id = v_k.id;
    return jsonb_build_object('waehrung', v_k.waehrung, 'kontostand', v_stand, 'bezeichnung', v_k.label);
  end if;
  select count(*) into v_vorher from public.rpg_hero_collection where user_id = v_uid;
  insert into public.rpg_hero_collection (user_id, hero_id, quelle) select v_uid, hero_id, 'code' from public.rpg_hero_catalog on conflict do nothing;
  -- offene Startrunde ist damit erledigt
  update public.rpg_hero_offers set status = 'verfallen' where user_id = v_uid and art = 'start' and status = 'offen';
  insert into public.rpg_unlock_redemptions (code_id, user_id) values (v_k.id, v_uid);
  update public.rpg_unlock_codes set uses = uses + 1 where id = v_k.id;
  return jsonb_build_object('neu', (select count(*) from public.rpg_hero_collection where user_id = v_uid) - v_vorher,
    'gesamt', (select count(*) from public.rpg_hero_catalog), 'bezeichnung', v_k.label);
end;
$$;

-- Code anlegen (Fassung aus Migration 006, ergänzt um p_waehrung: leer = alle Helden, sonst so viele Seelensplitter)
drop function if exists public.rpg_admin_create_code(text, text, integer, integer);
create or replace function public.rpg_admin_create_code(p_label text, p_fuer text default null, p_max_uses integer default 1, p_valid_days integer default 90, p_waehrung integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_fuer uuid; v_handle text; v_code text; v_max integer; v_tage integer;
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins können Codes anlegen.'; end if;
  if coalesce(trim(p_label), '') = '' then raise exception 'Bitte eine Bezeichnung angeben.'; end if;
  if p_waehrung is not null and p_waehrung not between 1 and 5000 then raise exception 'Ein Code kann 1 bis 5000 Seelensplitter bringen.'; end if;
  if (select count(*) from public.rpg_unlock_codes where created_by = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Höchstens 20 neue Codes pro Tag.';
  end if;
  if coalesce(trim(p_fuer), '') <> '' then
    select p.user_id, p.handle into v_fuer, v_handle from public.rpg_profiles p where lower(p.handle) = lower(trim(p_fuer));
    if v_fuer is null or not public.rpg_ist_konto(v_fuer) then raise exception 'Ein Konto „%“ gibt es nicht.', trim(p_fuer); end if;
  end if;
  v_max := case when v_fuer is not null then 1 else least(100, greatest(1, coalesce(p_max_uses, 1))) end;
  v_tage := least(365, greatest(1, coalesce(p_valid_days, 90)));
  loop
    v_code := public.rpg_neuer_code();
    exit when not exists (select 1 from public.rpg_unlock_codes where code_hash = public.rpg_link_hash(v_code));
  end loop;
  insert into public.rpg_unlock_codes (code_hash, label, max_uses, expires_at, for_user, created_by, waehrung)
  values (public.rpg_link_hash(v_code), left(trim(p_label), 80), v_max, now() + make_interval(days => v_tage), v_fuer, v_uid, p_waehrung);
  return jsonb_build_object('code', v_code, 'bezeichnung', left(trim(p_label), 80), 'nur_fuer', v_handle, 'hoechstens', v_max,
    'gueltig_bis', now() + make_interval(days => v_tage), 'waehrung', p_waehrung);
end;
$$;

-- Die neuesten 200 Codes (Fassung aus Migration 006, ergänzt um 'waehrung')
create or replace function public.rpg_admin_codes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins sehen die Code-Übersicht.'; end if;
  return coalesce((select jsonb_agg(x order by x.angelegt desc) from (
    select k.id, k.label as bezeichnung, fp.handle as nur_fuer, k.uses as eingeloest, k.max_uses as hoechstens, k.expires_at as gueltig_bis,
      k.active as aktiv, k.created_at as angelegt, cp.handle as angelegt_von, k.waehrung
    from public.rpg_unlock_codes k
    left join public.rpg_profiles fp on fp.user_id = k.for_user
    left join public.rpg_profiles cp on cp.user_id = k.created_by
    order by k.created_at desc limit 200) x), '[]'::jsonb);
end;
$$;

revoke all on function public.rpg_redeem_unlock_code(text), public.rpg_admin_create_code(text, text, integer, integer, integer), public.rpg_admin_codes() from public, anon;
grant execute on function public.rpg_redeem_unlock_code(text), public.rpg_admin_create_code(text, text, integer, integer, integer), public.rpg_admin_codes() to authenticated;

commit;
