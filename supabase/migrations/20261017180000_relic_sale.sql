--— a sold relic leaves the fight record, and the fight keeps its grade and echoes.
alter table public.encounters drop constraint encounters_relic_id_fkey;
alter table public.encounters
  add constraint encounters_relic_id_fkey
  foreign key (relic_id) references public.relics (id) on delete set null;
