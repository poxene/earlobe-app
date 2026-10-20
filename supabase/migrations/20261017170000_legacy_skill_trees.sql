--— legacy points are spent on class trees. imported history does not level the listener.

alter table public.characters
  add column tree_nodes text[] not null default '{}',
  add column legacy_points int not null default 0 check (legacy_points >= 0),
  add column legacy_awarded boolean not null default false;

alter table public.listening_events
  add column legacy boolean not null default false;
