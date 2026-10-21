-- display names are public urls: earlo.be/c/<name>

do $$
declare
  rec record;
  base text;
  candidate text;
  n int;
begin
  for rec in
    select id, display_name, lastfm_username
    from public.profiles
    order by created_at
  loop
    base := lower(coalesce(rec.display_name, ''));
    base := substring(regexp_replace(base, '[^a-z0-9_-]+', '-', 'g') from 1 for 20);
    base := regexp_replace(regexp_replace(base, '[-_]{2,}', '-', 'g'), '^[-_]+|[-_]+$', '', 'g');
    if base !~ '^[a-z0-9][a-z0-9_-]{0,18}[a-z0-9]$' then
      base := substring(lower(regexp_replace(rec.lastfm_username, '[^a-z0-9_-]+', '', 'g')) from 1 for 20);
      base := regexp_replace(base, '^[-_]+|[-_]+$', '', 'g');
    end if;
    if base !~ '^[a-z0-9][a-z0-9_-]{0,18}[a-z0-9]$' then
      base := 'listener';
    end if;
    candidate := base;
    n := 2;
    while exists (
      select 1 from public.profiles
      where id <> rec.id and lower(display_name) = candidate
    ) loop
      candidate := substring(base from 1 for 16) || '-' || n::text;
      n := n + 1;
      exit when n > 50;
    end loop;
    update public.profiles set display_name = candidate where id = rec.id;
  end loop;
end $$;

alter table public.profiles alter column display_name set not null;

alter table public.profiles
  add constraint profiles_display_name_format
  check (display_name ~ '^[a-z0-9][a-z0-9_-]{0,18}[a-z0-9]$');

create unique index profiles_display_name_key on public.profiles (display_name);
