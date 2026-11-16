-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN.
-- Stellt eine von Hand umgeschriebene, fehlerhafte Fassung des Serverkampfs nach (andere Parameter, andere Spalten,
-- Suche mit falschem Spaltennamen). Migration 015 muss danach trotzdem sauber einspielen und alles ersetzen.
create table public.rpg_arena_fights (match_id uuid primary key references public.rpg_arena_matches(id) on delete cascade, version integer not null default 0, state jsonb);
create table public.rpg_arena_search_srv (match_id uuid primary key, user_id uuid not null, seen_at timestamptz not null default now(), schnitt numeric);
create function public.rpg_arena_search_server() returns jsonb language plpgsql security definer set search_path = public as $$
begin perform 1 from public.rpg_arena_matches m where m.schnitt > 0; return '{}'::jsonb; end $$;
create function public.rpg_arena_fight(p_match_id uuid, p_version integer default 0) returns text language sql as $$ select 'alt'::text $$;
create function public.rpg_arena_srv_end(p_match_id uuid) returns boolean language sql as $$ select true $$;
create function public.rpg_arena_srv_end(p_match_id uuid, p_sieger integer, p_grund text) returns boolean language sql as $$ select true $$;
create function public.rpg_arena_srv_load(p_match_id uuid) returns jsonb language sql as $$ select '{}'::jsonb $$;
grant execute on function public.rpg_arena_srv_end(uuid), public.rpg_arena_srv_load(uuid) to authenticated;
