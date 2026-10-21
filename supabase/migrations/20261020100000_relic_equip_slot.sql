alter table public.relics
  add column equip_slot smallint check (equip_slot between 0 and 2);

with ranked as (
  select id, row_number() over (partition by user_id order by acquired_at) - 1 as slot
  from public.relics
  where equipped
)
update public.relics as relic
set equip_slot = ranked.slot
from ranked
where relic.id = ranked.id
  and ranked.slot < 3;

create unique index relics_one_per_slot
  on public.relics (user_id, equip_slot)
  where equipped and equip_slot is not null;
