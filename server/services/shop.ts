import { randomUUID } from "node:crypto";
import { craftRelic, isRarity, nextRarity, SELL_PRICE, statBonusPayload, type Rarity } from "../../src/lib/game/loot";
import { GameError } from "../errors";
import { getSupabase } from "../supabase";
import { loadHero, saveHero } from "./hero";

export async function sellRelic(userId: string, relicId: string): Promise<{ price: number; echoes: number }> {
  const row = await loadOwned(userId, [relicId]);
  const relic = row[0];
  if (!relic) throw new GameError(404, "relic_not_found");
  if (relic.equipped) throw new GameError(409, "relic_equipped");
  const removed = await getSupabase()
    .from("relics")
    .delete()
    .eq("id", relic.id)
    .eq("user_id", userId)
    .eq("equipped", false)
    .select("id");
  if (removed.error) throw new Error(removed.error.message);
  if (!removed.data?.length) throw new GameError(409, "relic_equipped");
  const hero = await loadHero(userId);
  hero.echoes += SELL_PRICE[relic.rarity];
  await saveHero(hero);
  return { price: SELL_PRICE[relic.rarity], echoes: hero.echoes };
}

export async function upgradeRelics(
  userId: string,
  relicIds: string[],
): Promise<{ name: string; rarity: Rarity; echoes: number }> {
  const ids = [...new Set(relicIds)];
  if (ids.length !== 3) throw new GameError(400, "need_three");
  const rows = await loadOwned(userId, ids);
  if (rows.length !== 3) throw new GameError(404, "relic_not_found");
  if (rows.some((row) => row.equipped)) throw new GameError(409, "relic_equipped");
  const rarity = rows[0]?.rarity;
  if (!rarity || rows.some((row) => row.rarity !== rarity)) throw new GameError(409, "mixed_rarity");
  const next = nextRarity(rarity);
  if (!next) throw new GameError(409, "mythic_final");
  const salt = [...ids].sort().join(":");
  const picked = rows[hash(salt) % rows.length] ?? rows[0];
  if (!picked) throw new GameError(404, "relic_not_found");
  const crafted = craftRelic({ genreFamily: picked.genre_family, rarity: next, salt });
  const id = randomUUID();
  const inserted = await getSupabase().from("relics").insert({
    id,
    user_id: userId,
    name: crafted.name,
    gear_slug: crafted.gearSlug,
    monster_type: crafted.monsterType,
    genre_family: crafted.genreFamily,
    rarity: crafted.rarity,
    stat_bonuses: statBonusPayload(crafted),
    effects: { cut: crafted.cut, list: crafted.effects },
  });
  if (inserted.error) throw new Error(inserted.error.message);
  const removed = await getSupabase()
    .from("relics")
    .delete()
    .in("id", ids)
    .eq("user_id", userId)
    .eq("equipped", false)
    .select("id");
  if (removed.error || (removed.data?.length ?? 0) !== 3) {
    await getSupabase().from("relics").delete().eq("id", id).eq("user_id", userId);
    if (removed.error) throw new Error(removed.error.message);
    throw new GameError(409, "relic_equipped");
  }
  const hero = await loadHero(userId);
  return { name: crafted.name, rarity: crafted.rarity, echoes: hero.echoes };
}

type Owned = { id: string; rarity: Rarity; genre_family: string; equipped: boolean };

async function loadOwned(userId: string, ids: string[]): Promise<Owned[]> {
  const { data, error } = await getSupabase()
    .from("relics")
    .select("id, rarity, genre_family, equipped")
    .eq("user_id", userId)
    .in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    if (!isRarity(row.rarity)) return [];
    return [{ id: row.id, rarity: row.rarity, genre_family: row.genre_family, equipped: row.equipped }];
  });
}

function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) value = (value * 33 + seed.charCodeAt(index)) >>> 0;
  return value;
}
