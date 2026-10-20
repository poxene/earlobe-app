--— skills chosen on level up, and relic effects beyond flat stats.
-- existing listeners get one unspent skill choice per level they already earned.

alter table public.characters
  add column skills text[] not null default '{}',
  add column skill_picks int not null default 0 check (skill_picks >= 0);

update public.characters
set skill_picks = greatest(level - 1, 0)
where cardinality(skills) = 0
  and skill_picks = 0
  and level > 1;

alter table public.relics
  add column effects jsonb not null default '[]'::jsonb;

alter table public.encounters
  add column bonus_damage int not null default 0 check (bonus_damage >= 0),
  add column skill_id text,
  add column echo_bonus int not null default 0 check (echo_bonus >= 0),
  add column grade_bump int not null default 0 check (grade_bump >= 0),
  add column drop_advantage boolean not null default false,
  add column xp_bonus int not null default 0 check (xp_bonus >= 0);
