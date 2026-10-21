create table public.town_messages (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 240),
  created_at timestamptz not null default now()
);

create index town_messages_created_at on public.town_messages (created_at desc);

alter table public.town_messages enable row level security;

revoke all on table public.town_messages from anon, authenticated;
