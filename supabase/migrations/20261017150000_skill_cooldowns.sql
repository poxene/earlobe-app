--— each skill can be cast again after a minute, including across echoes of the same song.

alter table public.encounters
  add column skill_cooldowns jsonb not null default '{}'::jsonb;
