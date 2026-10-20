--— profiles and encrypted spotify tokens. the api uses the service role; clients never read tokens.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  spotify_id text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.spotify_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null
);

alter table public.profiles enable row level security;
alter table public.spotify_tokens enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

revoke all on table public.spotify_tokens from anon, authenticated;

--— recover an auth user if profile insert failed after createUser
create or replace function public.user_id_for_spotify_email(target_email text)
returns uuid
language sql
security definer
set search_path = auth, public
as $$
  select id from auth.users where email = target_email limit 1;
$$;

revoke all on function public.user_id_for_spotify_email(text) from public, anon, authenticated;
grant execute on function public.user_id_for_spotify_email(text) to service_role;
