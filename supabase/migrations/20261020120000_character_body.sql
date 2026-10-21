alter table public.characters
  add column body text not null default 'body6'
  check (body in ('body1', 'body2', 'body3', 'body4', 'body5', 'body6', 'body7', 'body8', 'body9', 'body10'));
