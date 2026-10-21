alter table public.relics add column if not exists gear_slug text;

alter table public.relics drop constraint if exists relics_equip_slot_check;

alter table public.relics
  add constraint relics_equip_slot_check check (equip_slot between 0 and 12);
