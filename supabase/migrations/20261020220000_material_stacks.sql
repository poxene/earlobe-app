create table public.material_stacks (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  quantity int not null check (quantity between 1 and 99),
  acquired_at timestamptz not null default now()
);

create index material_stacks_user_slug on public.material_stacks (user_id, slug);

alter table public.material_stacks enable row level security;

revoke all on table public.material_stacks from anon, authenticated;
