--— the old ladder was common / rare / epic. rare was the middle drop, epic was the old ceiling.
--— neither was a sub-1% legendary, so they step onto magic and rare.

update public.relics set rarity = 'magic' where rarity = 'rare';
update public.relics set rarity = 'rare' where rarity = 'epic';
