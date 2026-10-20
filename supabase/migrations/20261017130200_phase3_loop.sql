--— listening, combat, codex, quests, and party.
-- quests carry user_id because every objective is personal.
-- listening_events.source_key dedupes a live session against the later history row.
-- artist_cache is catalog data, not a player's rows.

alter table public.characters
  add column echoes int not null default 0 check (echoes >= 0),
  add column stat_bonus_str int not null default 0 check (stat_bonus_str >= 0),
  add column stat_bonus_agi int not null default 0 check (stat_bonus_agi >= 0),
  add column stat_bonus_int int not null default 0 check (stat_bonus_int >= 0),
  add column stat_bonus_wis int not null default 0 check (stat_bonus_wis >= 0),
  add column stat_bonus_cha int not null default 0 check (stat_bonus_cha >= 0),
  add column class_switched_at timestamptz,
  add column last_seen_at timestamptz,
  add column stats_refreshed_at timestamptz,
  add column listening_xp_today int not null default 0 check (listening_xp_today >= 0),
  add column listening_xp_day date,
  add column badges text[] not null default '{}';

create table public.listening_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id text not null,
  track_name text not null,
  artist_ids text[] not null default '{}',
  artist_names text[] not null default '{}',
  album_id text not null default '',
  album_name text not null default '',
  album_image_url text,
  played_at timestamptz not null,
  ms_played int not null,
  duration_ms int not null,
  genre_families text[] not null default '{Unmapped}',
  xp_awarded int not null default 0,
  source_key text not null,
  unique (user_id, source_key)
);

create index listening_events_user_played on public.listening_events (user_id, played_at desc);

create table public.artist_cache (
  artist_id text primary key,
  name text not null,
  genres text[] not null default '{}',
  followers int not null default 0,
  image_url text,
  fetched_at timestamptz not null default now()
);

create table public.codex_artists (
  user_id uuid not null references public.profiles (id) on delete cascade,
  artist_id text not null,
  name text not null,
  image_url text,
  genres text[] not null default '{}',
  discovered_at timestamptz not null default now(),
  listen_count int not null default 1,
  primary key (user_id, artist_id)
);

create table public.codex_albums (
  user_id uuid not null references public.profiles (id) on delete cascade,
  album_id text not null,
  name text not null,
  artist_name text not null default '',
  image_url text,
  genre_family text not null default 'Unmapped',
  tracks_total int not null default 0,
  tracks_played int not null default 0,
  completed_at timestamptz,
  xp_awarded boolean not null default false,
  primary key (user_id, album_id)
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  description text not null,
  objective jsonb not null,
  xp_reward int not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.quest_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  quest_id uuid not null references public.quests (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  primary key (user_id, quest_id)
);

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.party_members (
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id),
  unique (user_id)
);

create table public.feed_events (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.relics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  monster_type text not null,
  genre_family text not null,
  rarity text not null,
  stat_bonuses jsonb not null,
  equipped boolean not null default false,
  acquired_at timestamptz not null default now()
);

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id text not null,
  track_name text not null default '',
  album_image_url text,
  monster_type text not null,
  genre_family text not null,
  hp_max int not null,
  dps_at_fight numeric not null,
  echo_depth int not null default 0,
  outcome text,
  grade text,
  loot_echoes int not null default 0,
  relic_id uuid references public.relics (id),
  duration_ms int not null,
  progress_ms int not null default 0,
  anchor_ms int not null default 0,
  source_key text not null,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  skipped boolean not null default false,
  unique (user_id, source_key, echo_depth)
);

create index encounters_open on public.encounters (user_id) where resolved_at is null;

create table public.bestiary (
  user_id uuid not null references public.profiles (id) on delete cascade,
  monster_type text not null,
  encountered int not null default 0,
  defeated int not null default 0,
  escaped int not null default 0,
  best_grade text,
  fastest_kill_sec int,
  primary key (user_id, monster_type)
);

create table public.presence (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  track_name text,
  artist_name text,
  image_url text,
  updated_at timestamptz not null default now()
);

create table public.rerolls (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  week_start date not null
);

alter table public.listening_events enable row level security;
alter table public.artist_cache enable row level security;
alter table public.codex_artists enable row level security;
alter table public.codex_albums enable row level security;
alter table public.quests enable row level security;
alter table public.quest_progress enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.feed_events enable row level security;
alter table public.relics enable row level security;
alter table public.encounters enable row level security;
alter table public.bestiary enable row level security;
alter table public.presence enable row level security;
alter table public.rerolls enable row level security;

create policy listening_select_own on public.listening_events for select to authenticated using (auth.uid() = user_id);
create policy codex_artists_select_own on public.codex_artists for select to authenticated using (auth.uid() = user_id);
create policy codex_albums_select_own on public.codex_albums for select to authenticated using (auth.uid() = user_id);
create policy quests_select_own on public.quests for select to authenticated using (auth.uid() = user_id);
create policy quest_progress_select_own on public.quest_progress for select to authenticated using (auth.uid() = user_id);
create policy relics_select_own on public.relics for select to authenticated using (auth.uid() = user_id);
create policy encounters_select_own on public.encounters for select to authenticated using (auth.uid() = user_id);
create policy bestiary_select_own on public.bestiary for select to authenticated using (auth.uid() = user_id);
create policy presence_select_own on public.presence for select to authenticated using (auth.uid() = user_id);
create policy rerolls_select_own on public.rerolls for select to authenticated using (auth.uid() = user_id);

create policy parties_select_member on public.parties for select to authenticated
  using (exists (
    select 1 from public.party_members member
    where member.party_id = parties.id and member.user_id = auth.uid()
  ));

create policy party_members_select_mate on public.party_members for select to authenticated
  using (exists (
    select 1 from public.party_members mine
    where mine.party_id = party_members.party_id and mine.user_id = auth.uid()
  ));

create policy feed_select_party on public.feed_events for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.party_members mine
      where mine.party_id = feed_events.party_id and mine.user_id = auth.uid()
    )
  );

--— pg_cron should call POST /api/cron/sync every 15 minutes.
-- local containers cannot reach the host api without extra network wiring, so the schedule lives with the deploy.
