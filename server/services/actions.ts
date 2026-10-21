import { classById } from "../../src/lib/game/classes";
import { parseBody } from "../../src/lib/portrait/body";
import { DOLL_SLOTS, gearBySlug, gearForSalt, itemFits, slotIndex } from "../../src/lib/portrait/gear";
import { castSkill, parseCooldowns, skillById, SKILL_COOLDOWN_MS } from "../../src/lib/game/skills";
import { canSpend, nodeById, purchasable } from "../../src/lib/game/trees";
import { respec } from "../../src/lib/game/xp";
import { GameError } from "../errors";
import { getSupabase } from "../supabase";
import { loadHero, saveHero } from "./hero";

const STATS = ["str", "agi", "int", "wis", "cha"] as const;
type StatName = (typeof STATS)[number];

export async function allocatePoint(userId: string, stat: string): Promise<void> {
  if (!STATS.includes(stat as StatName)) throw new GameError(400, "unknown_stat");
  await allocatePoints(userId, { [stat]: 1 });
}

export async function allocatePoints(userId: string, grants: Partial<Record<StatName, number>>): Promise<void> {
  const hero = await loadHero(userId);
  let spent = 0;
  const next = { ...hero.bonus };
  for (const stat of STATS) {
    const amount = grants[stat] ?? 0;
    if (!Number.isInteger(amount) || amount < 0 || amount > 100) throw new GameError(400, "unknown_stat");
    spent += amount;
    next[stat] += amount;
  }
  if (spent === 0) return;
  if (spent > hero.unallocated) throw new GameError(409, "no_points");
  hero.bonus = next;
  hero.unallocated -= spent;
  await saveHero(hero);
}

export async function switchClass(userId: string, classId: string): Promise<void> {
  const hero = await loadHero(userId);
  const entry = classById(classId);
  if (!entry || !hero.unlocked.includes(entry.id)) throw new GameError(409, "class_locked");
  if (entry.id === hero.activeClass) return;
  hero.activeClass = entry.id;
  await saveHero(hero);
}

export async function setEquipped(userId: string, relicId: string, equipped: boolean, slot?: number): Promise<void> {
  const supabase = getSupabase();
  const relic = await supabase
    .from("relics")
    .select("id, equipped, equip_slot, gear_slug")
    .eq("id", relicId)
    .eq("user_id", userId)
    .maybeSingle();
  if (relic.error) throw new Error(relic.error.message);
  if (!relic.data) throw new GameError(404, "relic_not_found");
  if (!equipped) {
    const saved = await supabase.from("relics").update({ equipped: false, equip_slot: null }).eq("id", relicId).eq("user_id", userId);
    if (saved.error) throw new Error(saved.error.message);
    return;
  }
  const piece = gearBySlug(relic.data.gear_slug) ?? gearForSalt(relic.data.id);
  const worn = await supabase.from("relics").select("id, equip_slot, gear_slug").eq("user_id", userId).eq("equipped", true);
  if (worn.error) throw new Error(worn.error.message);
  const others = (worn.data ?? []).filter((row) => row.id !== relicId);
  const open = slot ?? fittingOpen(piece, others.map((row) => row.equip_slot));
  if (open === undefined || !itemFits(piece, open)) throw new GameError(409, "wrong_slot");
  const weapon = slotIndex("weapon");
  const offhand = slotIndex("offhand");
  if (open === offhand) {
    const main = others.find((row) => row.equip_slot === weapon);
    const mainPiece = main ? gearBySlug(main.gear_slug) : null;
    if (mainPiece?.twoHanded) throw new GameError(409, "offhand_blocked");
  }
  if (piece.twoHanded && open === weapon) {
    const blocked = others.find((row) => row.equip_slot === offhand);
    if (blocked) {
      const cleared = await supabase.from("relics").update({ equipped: false, equip_slot: null }).eq("id", blocked.id).eq("user_id", userId);
      if (cleared.error) throw new Error(cleared.error.message);
    }
  }
  const occupant = others.find((row) => row.equip_slot === open);
  const fromSlot = relic.data.equip_slot;
  if (occupant && relic.data.equipped && fromSlot !== null && fromSlot !== open) {
    const occupantPiece = gearBySlug(occupant.gear_slug) ?? gearForSalt(occupant.id);
    const parked = await supabase.from("relics").update({ equip_slot: null }).eq("id", relicId).eq("user_id", userId);
    if (parked.error) throw new Error(parked.error.message);
    if (itemFits(occupantPiece, fromSlot)) {
      const swapped = await supabase.from("relics").update({ equip_slot: fromSlot }).eq("id", occupant.id).eq("user_id", userId);
      if (swapped.error) throw new Error(swapped.error.message);
    } else {
      const cleared = await supabase.from("relics").update({ equipped: false, equip_slot: null }).eq("id", occupant.id).eq("user_id", userId);
      if (cleared.error) throw new Error(cleared.error.message);
    }
  } else if (occupant) {
    const cleared = await supabase
      .from("relics")
      .update({ equipped: false, equip_slot: null })
      .eq("id", occupant.id)
      .eq("user_id", userId);
    if (cleared.error) throw new Error(cleared.error.message);
  }
  const saved = await supabase.from("relics").update({ equipped: true, equip_slot: open, gear_slug: piece.slug }).eq("id", relicId).eq("user_id", userId);
  if (saved.error) throw new Error(saved.error.message);
}

function fittingOpen(piece: ReturnType<typeof gearForSalt>, taken: (number | null)[]): number | undefined {
  const used = new Set(taken);
  return DOLL_SLOTS.map((_, index) => index).find((index) => itemFits(piece, index) && !used.has(index));
}

export async function resetStats(userId: string): Promise<void> {
  const row = await getSupabase().from("characters").select("level, legacy_points").eq("user_id", userId).maybeSingle();
  if (row.error) throw new Error(row.error.message);
  if (!row.data) throw new GameError(404, "no_character");
  const next = respec({ level: row.data.level, legacyPoints: row.data.legacy_points });
  const saved = await getSupabase()
    .from("characters")
    .update({
      stat_bonus_str: 0,
      stat_bonus_agi: 0,
      stat_bonus_int: 0,
      stat_bonus_wis: 0,
      stat_bonus_cha: 0,
      unallocated_points: next.unallocated,
      skills: [],
      tree_nodes: [],
      skill_picks: next.skillPicks,
    })
    .eq("user_id", userId);
  if (saved.error) throw new Error(saved.error.message);
}

export async function learnSkill(userId: string, skillId: string): Promise<void> {
  await learnSkills(userId, [skillId]);
}

export async function learnSkills(userId: string, skillIds: string[]): Promise<void> {
  if (skillIds.length === 0) return;
  if (skillIds.length > 40) throw new GameError(400, "skill_unavailable");
  const hero = await loadHero(userId);
  for (const skillId of skillIds) applyLearn(hero, skillId);
  await saveHero(hero);
}

function applyLearn(hero: Awaited<ReturnType<typeof loadHero>>, skillId: string): void {
  if (hero.skillPicks <= 0) throw new GameError(409, "no_skill_pick");
  if (skillId === "bank") {
    if (purchasable(hero.unlocked, hero.treeNodes, hero.skills).length > 0) throw new GameError(409, "skill_waiting");
    hero.unallocated += 1;
    hero.skillPicks -= 1;
    return;
  }
  const node = nodeById(skillId);
  if (!node || !canSpend(node, hero.unlocked, hero.treeNodes, hero.skills)) throw new GameError(409, "skill_unavailable");
  hero.treeNodes = [...hero.treeNodes, node.id];
  if (node.skillId && !hero.skills.includes(node.skillId)) hero.skills = [...hero.skills, node.skillId];
  hero.skillPicks -= 1;
}

export async function castSkillOnFight(userId: string, skillId: string): Promise<{ name: string; damage: number; readyAt: number }> {
  const hero = await loadHero(userId);
  const entry = skillById(skillId);
  if (!entry || !hero.skills.includes(entry.id)) throw new GameError(409, "skill_unknown");
  const cooldownKey = entry.id;
  const supabase = getSupabase();
  const open = await supabase
    .from("encounters")
    .select("id, hp_max, dps_at_fight, bonus_damage, skill_cooldowns, echo_bonus, grade_bump, drop_advantage, xp_bonus")
    .eq("user_id", userId)
    .is("resolved_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (open.error) throw new Error(open.error.message);
  if (!open.data) throw new GameError(409, "no_fight");
  const cooldowns = parseCooldowns(open.data.skill_cooldowns);
  const readyAt = cooldowns[cooldownKey] ?? 0;
  if (readyAt > Date.now()) throw new GameError(409, "skill_cooling");
  const cast = castSkill(entry, { hpMax: open.data.hp_max, dps: Number(open.data.dps_at_fight) });
  const nextReady = Date.now() + SKILL_COOLDOWN_MS;
  const saved = await supabase
    .from("encounters")
    .update({
      bonus_damage: open.data.bonus_damage + cast.damage,
      skill_id: entry.id,
      skill_cooldowns: { ...cooldowns, [cooldownKey]: nextReady },
      echo_bonus: open.data.echo_bonus + cast.echoes,
      grade_bump: open.data.grade_bump + cast.gradeSteps,
      drop_advantage: open.data.drop_advantage || cast.dropAdvantage,
      xp_bonus: open.data.xp_bonus + cast.xpBonus,
    })
    .eq("id", open.data.id)
    .is("resolved_at", null)
    .select("id");
  if (saved.error) throw new Error(saved.error.message);
  if (!saved.data?.length) throw new GameError(409, "no_fight");
  return { name: entry.name, damage: cast.damage, readyAt: nextReady };
}

export async function setBody(userId: string, body: string): Promise<void> {
  const next = parseBody(body);
  if (next !== body) throw new GameError(400, "bad_body");
  const { error } = await getSupabase().from("characters").update({ body: next }).eq("user_id", userId);
  if (error) throw new Error(error.message);
}
