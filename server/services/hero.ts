import { randomUUID } from "node:crypto";
import type { Stats } from "../../src/lib/game/character";
import { classById, CLASSES } from "../../src/lib/game/classes";
import { addStats, calculateDps, sumStats } from "../../src/lib/game/combat";
import { fightDps, listenXpMultiplier, parseStoredEffects, type RelicEffect } from "../../src/lib/game/effects";
import { legacyGrant, treeEffects } from "../../src/lib/game/trees";
import { allocateLevelUps, grantXp, levelForXp } from "../../src/lib/game/xp";
import type { GameToast } from "../../src/lib/game/snapshot";
import { getSupabase } from "../supabase";
import { parseBonus } from "./bonus";

export type Hero = {
  userId: string;
  activeClass: string;
  unlocked: string[];
  level: number;
  xp: number;
  stats: Stats;
  bonus: Stats;
  relicBonus: Stats;
  effects: RelicEffect[];
  skills: string[];
  skillPicks: number;
  treeNodes: string[];
  joinedAt: string;
  xpRate: number;
  echoes: number;
  unallocated: number;
  listeningToday: number;
  listeningDay: string | null;
  lastSeen: string | null;
  statsRefreshedAt: string | null;
  badges: string[];
};

export type Credit = {
  toasts: GameToast[];
  levelUp: { level: number; unallocated: number } | null;
};

export function heroStats(hero: Hero): Stats {
  const tree = treeEffects(hero.activeClass, hero.treeNodes);
  return addStats(hero.stats, sumStats([hero.bonus, hero.relicBonus, tree.bonus]));
}

export function heroDps(hero: Hero, echoDepth = 0): number {
  const stats = heroStats(hero);
  return fightDps(calculateDps(stats), stats, hero.effects, echoDepth);
}

export async function loadHero(userId: string): Promise<Hero> {
  const supabase = getSupabase();
  const [{ data, error }, relics] = await Promise.all([
    supabase
      .from("characters")
      .select(
        "active_class, unlocked_classes, level, xp, stat_str, stat_agi, stat_int, stat_wis, stat_cha, stat_bonus_str, stat_bonus_agi, stat_bonus_int, stat_bonus_wis, stat_bonus_cha, echoes, unallocated_points, listening_xp_today, listening_xp_day, last_seen_at, stats_refreshed_at, badges, skills, skill_picks, tree_nodes, legacy_points, legacy_awarded, created_at",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("relics").select("stat_bonuses, effects, equipped").eq("user_id", userId).eq("equipped", true),
  ]);
  if (error) throw new Error(error.message);
  if (relics.error) throw new Error(relics.error.message);
  if (!data) throw new Error("unauthenticated");
  const today = utcDay();
  const stats = {
    str: data.stat_str,
    agi: data.stat_agi,
    int: data.stat_int,
    wis: data.stat_wis,
    cha: data.stat_cha,
  };
  const bonus = {
    str: data.stat_bonus_str,
    agi: data.stat_bonus_agi,
    int: data.stat_bonus_int,
    wis: data.stat_bonus_wis,
    cha: data.stat_bonus_cha,
  };
  const effects = (relics.data ?? []).flatMap((row) => parseStoredEffects(row.effects).effects);
  const worn = addStats(stats, sumStats([bonus, ...((relics.data ?? []).map((row) => parseBonus(row.stat_bonuses)))]));
  const legacy = data.legacy_awarded ? null : await claimLegacy(userId, data.unlocked_classes, data.skill_picks);
  return {
    userId,
    activeClass: data.active_class,
    unlocked: legacy?.unlocked ?? data.unlocked_classes,
    level: data.level,
    xp: data.xp,
    stats,
    bonus,
    relicBonus: sumStats((relics.data ?? []).map((row) => parseBonus(row.stat_bonuses))),
    effects,
    skills: data.skills ?? [],
    skillPicks: legacy?.skillPicks ?? data.skill_picks,
    treeNodes: data.tree_nodes ?? [],
    joinedAt: data.created_at,
    xpRate: listenXpMultiplier(worn, effects),
    echoes: data.echoes,
    unallocated: data.unallocated_points,
    listeningToday: data.listening_xp_day === today ? data.listening_xp_today : 0,
    listeningDay: today,
    lastSeen: data.last_seen_at,
    statsRefreshedAt: data.stats_refreshed_at,
    badges: data.badges ?? [],
  };
}

async function claimLegacy(
  userId: string,
  unlocked: string[],
  skillPicks: number,
): Promise<{ unlocked: string[]; skillPicks: number }> {
  const weights = await getSupabase().from("genre_weights").select("genre_family, share").eq("user_id", userId);
  if (weights.error) throw new Error(weights.error.message);
  const shares = (weights.data ?? []).map((row) => ({ family: row.genre_family, share: Number(row.share) }));
  const established = shares.some((row) => row.family !== "Unmapped" && row.share > 0);
  const grant = legacyGrant({ artistCount: established ? 20 : 0, shares });
  const classes = [...new Set([...unlocked, ...grant.classes])];
  const picks = skillPicks + grant.points;
  const saved = await getSupabase()
    .from("characters")
    .update({
      skill_picks: picks,
      legacy_points: grant.points,
      legacy_awarded: true,
      unlocked_classes: classes,
    })
    .eq("user_id", userId);
  if (saved.error) throw new Error(saved.error.message);
  return { unlocked: classes, skillPicks: picks };
}

export async function saveHero(hero: Hero): Promise<void> {
  const { error } = await getSupabase()
    .from("characters")
    .update({
      active_class: hero.activeClass,
      unlocked_classes: hero.unlocked,
      level: hero.level,
      xp: hero.xp,
      stat_str: hero.stats.str,
      stat_agi: hero.stats.agi,
      stat_int: hero.stats.int,
      stat_wis: hero.stats.wis,
      stat_cha: hero.stats.cha,
      stat_bonus_str: hero.bonus.str,
      stat_bonus_agi: hero.bonus.agi,
      stat_bonus_int: hero.bonus.int,
      stat_bonus_wis: hero.bonus.wis,
      stat_bonus_cha: hero.bonus.cha,
      echoes: hero.echoes,
      unallocated_points: hero.unallocated,
      skills: hero.skills,
      skill_picks: hero.skillPicks,
      tree_nodes: hero.treeNodes,
      listening_xp_today: hero.listeningToday,
      listening_xp_day: hero.listeningDay,
      last_seen_at: hero.lastSeen,
      stats_refreshed_at: hero.statsRefreshedAt,
      badges: hero.badges,
    })
    .eq("user_id", hero.userId);
  if (error) throw new Error(error.message);
}

export function awardXp(hero: Hero, amount: number, kind: "listening" | "quest", credit: Credit, toast: string | null): number {
  const before = hero.level;
  const scaled = kind === "listening" ? Math.round(amount * hero.xpRate) : amount;
  const next = grantXp(hero.xp, scaled);
  hero.xp = next.xp;
  hero.level = levelForXp(hero.xp);
  if (hero.level > before) {
    const vector = classById(hero.activeClass)?.vector ?? CLASSES.Unmapped.vector;
    const gained = allocateLevelUps(hero.level - before, vector);
    hero.bonus = {
      str: hero.bonus.str + gained.bonus.str,
      agi: hero.bonus.agi + gained.bonus.agi,
      int: hero.bonus.int + gained.bonus.int,
      wis: hero.bonus.wis + gained.bonus.wis,
      cha: hero.bonus.cha + gained.bonus.cha,
    };
    hero.unallocated += gained.unallocated;
    hero.skillPicks += hero.level - before;
    credit.levelUp = { level: hero.level, unallocated: hero.unallocated };
    credit.toasts.push({
      id: randomUUID(),
      message: `Level ${String(hero.level).padStart(2, "0")}.`,
    });
  }
  if (toast && next.granted > 0) credit.toasts.push({ id: randomUUID(), message: toast });
  return next.granted;
}

export function utcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
