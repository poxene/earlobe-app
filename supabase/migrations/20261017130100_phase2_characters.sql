--— character sheet snapshot.
-- share is the phase-2 top-artist weight (0–1).
-- hours_30d stays 0 until listening sync fills the rolling window.

create table public.characters (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  active_class text not null,
  subclass text,
  unlocked_classes text[] not null default '{}',
  level int not null default 1 check (level >= 1),
  xp int not null default 0 check (xp >= 0),
  stat_str int not null check (stat_str between 1 and 100),
  stat_agi int not null check (stat_agi between 1 and 100),
  stat_int int not null check (stat_int between 1 and 100),
  stat_wis int not null check (stat_wis between 1 and 100),
  stat_cha int not null check (stat_cha between 1 and 100),
  unallocated_points int not null default 0 check (unallocated_points >= 0),
  portrait jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.genre_weights (
  user_id uuid not null references public.profiles (id) on delete cascade,
  genre_family text not null,
  hours_30d numeric not null default 0 check (hours_30d >= 0),
  share numeric not null default 0 check (share >= 0 and share <= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, genre_family)
);

alter table public.characters enable row level security;
alter table public.genre_weights enable row level security;

create policy characters_select_own
  on public.characters
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy genre_weights_select_own
  on public.genre_weights
  for select
  to authenticated
  using (auth.uid() = user_id);
