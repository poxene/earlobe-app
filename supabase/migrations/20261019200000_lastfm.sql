--— last.fm session keys replace spotify tokens. a session key does not expire.

alter table public.profiles rename column spotify_id to lastfm_username;
alter table public.profiles rename constraint profiles_spotify_id_key to profiles_lastfm_username_key;

drop table public.spotify_tokens;

create table public.lastfm_sessions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  session_key text not null,
  username text not null
);

create table public.track_cache (
  track_id text primary key,
  duration_ms integer not null,
  fetched_at timestamptz not null default now()
);

create table public.album_cache (
  album_id text primary key,
  track_ids text[] not null,
  fetched_at timestamptz not null default now()
);

alter table public.lastfm_sessions enable row level security;
alter table public.track_cache enable row level security;
alter table public.album_cache enable row level security;

revoke all on table public.lastfm_sessions from anon, authenticated;
revoke all on table public.track_cache from anon, authenticated;
revoke all on table public.album_cache from anon, authenticated;

create or replace function public.user_id_for_lastfm_email(target_email text)
returns uuid
language sql
security definer
set search_path = auth, public
as $$
  select id from auth.users where email = target_email limit 1;
$$;

revoke all on function public.user_id_for_lastfm_email(text) from public, anon, authenticated;
grant execute on function public.user_id_for_lastfm_email(text) to service_role;

drop function if exists public.user_id_for_spotify_email(text);
