import { randomUUID } from "node:crypto";
import { craftRelic, isRarity, nextRarity, SELL_PRICE, statBonusPayload, type Rarity } from "../../src/lib/game/loot";
import { TRANSMUTE_COST, transmuteMonster } from "../../src/lib/game/materials";
import { GameError } from "../errors";
import { getSupabase } from "../supabase";
import { loadHero, saveHero } from "./hero";
import { takeMaterials } from "./materials";

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
): Promise<{ name: string; rarity: Rarity; echoes: number; gold: number; materials: number; monster: string }> {
  const ids = [...new Set(relicIds)];
  if (ids.length !== 3) throw new GameError(400, "need_three");
  const rows = await loadOwned(userId, ids);
  if (rows.length !== 3) throw new GameError(404, "relic_not_found");
  if (rows.some((row) => row.equipped)) throw new GameError(409, "relic_equipped");
  const rarity = rows[0]?.rarity;
  if (!rarity || rows.some((row) => row.rarity !== rarity)) throw new GameError(409, "mixed_rarity");
  const next = nextRarity(rarity);
  if (!next || rarity === "mythic") throw new GameError(409, "mythic_final");
  const monster = transmuteMonster(rows.map((row) => ({ id: row.id, monsterType: row.monster_type })));
  const cost = TRANSMUTE_COST[rarity];
  if (!monster) throw new GameError(404, "relic_not_found");
  const hero = await loadHero(userId);
  if (hero.echoes < cost.gold) throw new GameError(409, "not_enough_gold");
  const restore = await takeMaterials(userId, monster, cost.materials);
  const salt = [...ids].sort().join(":");
  const picked = [...rows].sort((a, b) => a.id.localeCompare(b.id))[hash(salt) % rows.length] ?? rows[0];
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
  if (inserted.error) {
    await restore();
    throw new Error(inserted.error.message);
  }
  const removed = await getSupabase()
    .from("relics")
    .delete()
    .in("id", ids)
    .eq("user_id", userId)
    .eq("equipped", false)
    .select("id");
  if (removed.error || (removed.data?.length ?? 0) !== 3) {
    await getSupabase().from("relics").delete().eq("id", id).eq("user_id", userId);
    await restore();
    if (removed.error) throw new Error(removed.error.message);
    throw new GameError(409, "relic_equipped");
  }
  hero.echoes -= cost.gold;
  await saveHero(hero);
  return { name: crafted.name, rarity: crafted.rarity, echoes: hero.echoes, gold: cost.gold, materials: cost.materials, monster };
}

type Owned = { id: string; rarity: Rarity; genre_family: string; monster_type: string; equipped: boolean };

async function loadOwned(userId: string, ids: string[]): Promise<Owned[]> {
  const { data, error } = await getSupabase()
    .from("relics")
    .select("id, rarity, genre_family, monster_type, equipped")
    .eq("user_id", userId)
    .in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    if (!isRarity(row.rarity)) return [];
    return [{ id: row.id, rarity: row.rarity, genre_family: row.genre_family, monster_type: row.monster_type, equipped: row.equipped }];
  });
}

function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) value = (value * 33 + seed.charCodeAt(index)) >>> 0;
  return value;
}
