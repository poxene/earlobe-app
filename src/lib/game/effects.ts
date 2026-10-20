import type { Stats } from "@/lib/game/character";
import { calculateDps } from "@/lib/game/combat";
import type { Grade } from "@/lib/game/combat";
import { isRecord } from "@/lib/isRecord";

//— stats keep their share of damage. each one also does a job the others do not.

export type EffectId = "opening" | "tempo" | "signal" | "poise" | "room" | "encore" | "hoard";

export const EFFECT_NAME: Record<EffectId, string> = {
  opening: "Opening hit",
  tempo: "Fight speed",
  signal: "Bonus echoes",
  poise: "Grade leeway",
  room: "Listen XP",
  encore: "Echo damage",
  hoard: "Echo payout",
};

export type RelicEffect = {
  id: EffectId;
  name: string;
  detail: string;
  magnitude: number;
};

export type Cut = "attuned" | "focused" | "split" | "wild";

export const CUT_LINE: Record<Cut, string> = {
  attuned: "Stats follow this class.",
  focused: "All of the stats go to one attribute.",
  split: "Stats are split across two attributes.",
  wild: "Stats go to this class's lowest attribute.",
};

const GRADES: Grade[] = ["DOWN TO THE WIRE", "CLEAN", "FLAWLESS"];

export function openingFraction(stats: Stats, effects: RelicEffect[]): number {
  const gear = sumMagnitude(effects, "opening") / 100;
  return Math.min(0.45, stats.str / 2000 + gear);
}

export function tempoRate(stats: Stats, effects: RelicEffect[], echoDepth: number): number {
  const encore = echoDepth > 0 ? sumMagnitude(effects, "encore") / 100 : 0;
  return 1 + stats.agi / 400 + sumMagnitude(effects, "tempo") / 100 + encore;
}

export function encoreFraction(effects: RelicEffect[]): number {
  return sumMagnitude(effects, "encore") / 100;
}

export function fightDps(base: number, stats: Stats, effects: RelicEffect[], echoDepth: number): number {
  return base * tempoRate(stats, effects, echoDepth);
}

export function openingDamage(hpMax: number, stats: Stats, effects: RelicEffect[]): number {
  return Math.min(hpMax - 1, Math.round(hpMax * openingFraction(stats, effects)));
}

export function listenXpMultiplier(stats: Stats, effects: RelicEffect[]): number {
  return 1 + stats.cha / 400 + sumMagnitude(effects, "room") / 100;
}

export function dropLuck(stats: Stats, effects: RelicEffect[]): number {
  return Math.min(0.2, stats.cha / 500 + sumMagnitude(effects, "room") / 100);
}

export function poiseFraction(stats: Stats, effects: RelicEffect[]): number {
  return stats.wis / 2000 + sumMagnitude(effects, "poise") / 100;
}

export function echoPayout(base: number, stats: Stats, effects: RelicEffect[], extra: number): number {
  const hoard = 1 + sumMagnitude(effects, "hoard") / 100;
  const signal = sumMagnitude(effects, "signal") + Math.floor(stats.int / 15);
  return Math.max(0, Math.round(base * hoard) + signal + extra);
}

export function gradeForRemaining(remaining: number): Grade {
  if (remaining > 0.5) return "FLAWLESS";
  if (remaining >= 0.1) return "CLEAN";
  return "DOWN TO THE WIRE";
}

export function bumpGrade(grade: Grade, steps: number): Grade {
  const index = GRADES.indexOf(grade);
  const next = GRADES[Math.min(GRADES.length - 1, Math.max(0, index + steps))];
  return next ?? grade;
}

export function settleGrade(remaining: number, stats: Stats, effects: RelicEffect[], steps: number): Grade {
  return bumpGrade(gradeForRemaining(remaining + poiseFraction(stats, effects)), steps);
}

export function statTooltip(stat: keyof Stats, value: number, effects: RelicEffect[]): { name: string; line: string } {
  if (stat === "str") {
    const gear = sumMagnitude(effects, "opening");
    const pct = (value / 20 + gear).toFixed(1);
    return {
      name: "Strength",
      line: `35% of damage. The opening hit deals ${pct}% of the monster's max health.`,
    };
  }
  if (stat === "agi") {
    const gear = sumMagnitude(effects, "tempo");
    const encore = sumMagnitude(effects, "encore");
    return {
      name: "Agility",
      line: `25% of damage. Fight speed +${(value / 4 + gear).toFixed(1)}%.${encore > 0 ? ` Echo damage +${encore}%.` : ""}`,
    };
  }
  if (stat === "int") {
    const gear = sumMagnitude(effects, "signal");
    const echoes = Math.floor(value / 15) + gear;
    return {
      name: "Intellect",
      line: `20% of damage. Kills grant ${echoes} extra echoes.`,
    };
  }
  if (stat === "wis") {
    const gear = sumMagnitude(effects, "poise");
    return {
      name: "Wisdom",
      line: `10% of damage. Grades count an extra ${(value / 20 + gear).toFixed(1)}% of the track as finished.`,
    };
  }
  const room = sumMagnitude(effects, "room");
  return {
    name: "Charm",
    line: `10% of damage. Listen XP +${(value / 4 + room).toFixed(1)}%. Drop chance +${(value / 5 + room).toFixed(1)}%.`,
  };
}

export function dpsTooltip(stats: Stats, effects: RelicEffect[]): string {
  const base = calculateDps(stats);
  const paced = fightDps(base, stats, effects, 0);
  return `Damage per second while the track plays. Stats contribute ${base.toFixed(1)}. Agility and fight-speed items bring it to ${paced.toFixed(1)}.`;
}

export function echoTooltip(stats: Stats, effects: RelicEffect[]): string {
  const extra = Math.floor(stats.int / 15) + sumMagnitude(effects, "signal");
  const hoard = sumMagnitude(effects, "hoard");
  return `Echoes from a kill. Intellect and bonus-echo items add ${extra}.${hoard > 0 ? ` Echo payout items add ${hoard}%.` : ""}`;
}

export function parseStoredEffects(value: unknown): { cut: Cut | null; effects: RelicEffect[] } {
  if (Array.isArray(value)) return { cut: null, effects: value.flatMap(parseEffect) };
  if (!isRecord(value)) return { cut: null, effects: [] };
  const cut = isCut(value.cut) ? value.cut : null;
  const list = Array.isArray(value.list) ? value.list.flatMap(parseEffect) : [];
  return { cut, effects: list };
}

export function sumMagnitude(effects: RelicEffect[], id: EffectId): number {
  return effects.reduce((total, effect) => (effect.id === id ? total + effect.magnitude : total), 0);
}

function parseEffect(value: unknown): RelicEffect[] {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return [];
  if (!isEffectId(value.id) || typeof value.detail !== "string" || typeof value.magnitude !== "number") return [];
  return [{ id: value.id, name: value.name, detail: value.detail, magnitude: value.magnitude }];
}

function isEffectId(value: string): value is EffectId {
  return ["opening", "tempo", "signal", "poise", "room", "encore", "hoard"].includes(value);
}

function isCut(value: unknown): value is Cut {
  return value === "attuned" || value === "focused" || value === "split" || value === "wild";
}
