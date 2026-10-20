import { classById } from "../../src/lib/game/classes";
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
  const row = await getSupabase().from("characters").select("class_switched_at").eq("user_id", userId).maybeSingle();
  if (row.error) throw new Error(row.error.message);
  if (row.data?.class_switched_at) {
    const ready = new Date(row.data.class_switched_at).getTime() + 86_400_000;
    if (ready > Date.now()) throw new GameError(409, "class_cooldown");
  }
  hero.activeClass = entry.id;
  await saveHero(hero);
  const stamped = await getSupabase()
    .from("characters")
    .update({ class_switched_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (stamped.error) throw new Error(stamped.error.message);
}

export async function setEquipped(userId: string, relicId: string, equipped: boolean): Promise<void> {
  const supabase = getSupabase();
  const relic = await supabase.from("relics").select("id").eq("id", relicId).eq("user_id", userId).maybeSingle();
  if (relic.error) throw new Error(relic.error.message);
  if (!relic.data) throw new GameError(404, "relic_not_found");
  if (equipped) {
    const worn = await supabase
      .from("relics")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("equipped", true);
    if (worn.error) throw new Error(worn.error.message);
    if ((worn.count ?? 0) >= 3) throw new GameError(409, "slots_full");
  }
  const saved = await supabase.from("relics").update({ equipped }).eq("id", relicId).eq("user_id", userId);
  if (saved.error) throw new Error(saved.error.message);
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
  const readyAt = cooldowns[entry.id] ?? 0;
  if (readyAt > Date.now()) throw new GameError(409, "skill_cooling");
  const cast = castSkill(entry, { hpMax: open.data.hp_max, dps: Number(open.data.dps_at_fight) });
  const nextReady = Date.now() + SKILL_COOLDOWN_MS;
  const saved = await supabase
    .from("encounters")
    .update({
      bonus_damage: open.data.bonus_damage + cast.damage,
      skill_id: entry.id,
      skill_cooldowns: { ...cooldowns, [entry.id]: nextReady },
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
