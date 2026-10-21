import type { StatVector } from "@/lib/game/classes";
import type { Stats } from "@/lib/game/character";

//— brief lists level 2 as 100, but floor(100 × n^1.5) matches levels 5, 10, and 20, so the formula wins.
// level 2 lands at 282 cumulative xp.

export const QUALIFY_RATIO = 0.5;
export const NEW_ARTIST_XP = 25;
export const NEW_GENRE_XP = 100;
export const ALBUM_COMPLETION_XP = 50;
export const ESCAPE_CONSOLATION_XP = 1;
export const POINTS_PER_LEVEL = 10;
export const FREE_POINTS_PER_LEVEL = 3;

export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= xp) level += 1;
  return level;
}

export function xpProgress(level: number, xp: number): { into: number; span: number; fraction: number } {
  const start = cumulativeXpForLevel(level);
  const next = cumulativeXpForLevel(level + 1);
  const span = Math.max(1, next - start);
  const into = Math.min(span, Math.max(0, xp - start));
  return { into, span, fraction: into / span };
}

export function qualifies(progressMs: number, durationMs: number): boolean {
  if (durationMs <= 0) return false;
  return progressMs / durationMs > QUALIFY_RATIO;
}

const LISTEN_BASE_MS = 3 * 60 * 1000;
const LISTEN_LENGTH_CAP = 4;

//— a three-minute song pays the base. a longer song pays more, up to four times, and a repeat of it still pays less.
export function repeatListenXp(priorListens: number, durationMs = LISTEN_BASE_MS): number {
  const base = priorListens <= 0 ? 10 : priorListens === 1 ? 5 : priorListens === 2 ? 2 : 1;
  const span = durationMs > 0 ? durationMs : LISTEN_BASE_MS;
  const scale = Math.min(LISTEN_LENGTH_CAP, Math.max(1, span / LISTEN_BASE_MS));
  return Math.max(1, Math.round(base * scale));
}

export function grantXp(xp: number, amount: number): { xp: number; granted: number } {
  if (amount <= 0) return { xp, granted: 0 };
  return { xp: xp + amount, granted: amount };
}

//— 7 of 10 points follow the active class. the other 3 wait for the player.
export function allocateLevelUps(levelsGained: number, vector: StatVector): { bonus: Stats; unallocated: number } {
  const bonus: Stats = { str: 0, agi: 0, int: 0, wis: 0, cha: 0 };
  let unallocated = 0;
  const autoPoints = POINTS_PER_LEVEL - FREE_POINTS_PER_LEVEL;
  for (let index = 0; index < levelsGained; index += 1) {
    unallocated += FREE_POINTS_PER_LEVEL;
    const slice = distributePoints(autoPoints, vector);
    bonus.str += slice.str;
    bonus.agi += slice.agi;
    bonus.int += slice.int;
    bonus.wis += slice.wis;
    bonus.cha += slice.cha;
  }
  return { bonus, unallocated };
}

export function respec(input: { level: number; legacyPoints: number }): { unallocated: number; skillPicks: number } {
  const levels = Math.max(0, input.level - 1);
  return {
    unallocated: levels * POINTS_PER_LEVEL,
    skillPicks: input.legacyPoints + levels,
  };
}

export function distributePoints(points: number, vector: StatVector): Stats {
  const keys = ["str", "agi", "int", "wis", "cha"] as const;
  const result: Stats = { str: 0, agi: 0, int: 0, wis: 0, cha: 0 };
  const exact = keys.map((key) => ({ key, value: points * vector[key] }));
  let used = 0;
  for (const row of exact) {
    result[row.key] = Math.floor(row.value);
    used += result[row.key];
  }
  const leftovers = exact
    .map((row) => ({ key: row.key, remainder: row.value - Math.floor(row.value) }))
    .sort((a, b) => b.remainder - a.remainder || keys.indexOf(a.key) - keys.indexOf(b.key));
  let left = points - used;
  for (const row of leftovers) {
    if (left <= 0) break;
    result[row.key] += 1;
    left -= 1;
  }
  return result;
}
