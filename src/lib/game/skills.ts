import type { Stats } from "@/lib/game/character";
import { isRecord } from "@/lib/isRecord";

export type SkillDef = {
  id: string;
  name: string;
  stat: keyof Stats;
  hit: number;
  seconds: number;
  echoes: number;
  gradeSteps: number;
  dropAdvantage: boolean;
  xpBonus: number;
  detail: string;
};

export const SKILL_COOLDOWN_MS = 60_000;

export type SkillCast = {
  damage: number;
  echoes: number;
  gradeSteps: number;
  dropAdvantage: boolean;
  xpBonus: number;
};

const CLASSES = [
  "Berserker",
  "Rogue",
  "Arcanist",
  "Warrior",
  "Bard",
  "Cleric",
  "Enchanter",
  "Ranger",
  "Monk",
  "Barbarian",
  "Wanderer",
] as const;

const BY_CLASS: Record<(typeof CLASSES)[number], SkillDef[]> = {
  Berserker: [
    skill("brk-breakdown", "Breakdown", "str", { hit: 0.16 }),
    skill("brk-drum", "War Drum", "str", { hit: 0.08, echoes: 4 }),
    skill("brk-downbeat", "Downbeat", "str", { hit: 0.1 }),
  ],
  Rogue: [
    skill("rog-pocket", "Pocket", "agi", { hit: 0.08, echoes: 5 }),
    skill("rog-offbeat", "Offbeat", "agi", { hit: 0.1, seconds: 2 }),
    skill("rog-rush", "Rush", "agi", { seconds: 8 }),
  ],
  Arcanist: [
    skill("arc-feedback", "Feedback", "int", { hit: 0.08, echoes: 6 }),
    skill("arc-overdrive", "Overdrive", "int", { hit: 0.12 }),
    skill("arc-signal", "Signal", "int", { hit: 0.05, echoes: 8 }),
  ],
  Warrior: [
    skill("war-breakdown", "Three Chords", "str", { hit: 0.14 }),
    skill("war-downbeat", "Downbeat", "str", { hit: 0.1 }),
    skill("war-bridge", "Bridge", "wis", { hit: 0.06, gradeSteps: 1 }),
  ],
  Bard: [
    skill("brd-spotlight", "Spotlight", "cha", { hit: 0.06, dropAdvantage: true }),
    skill("brd-room", "Hold the Room", "wis", { hit: 0.05, gradeSteps: 1 }),
    skill("brd-call", "Call and Response", "cha", { hit: 0.06, echoes: 4 }),
  ],
  Cleric: [
    skill("clr-hymn", "Hymn", "wis", { hit: 0.04, echoes: 8 }),
    skill("clr-room", "Hold the Room", "wis", { hit: 0.05, gradeSteps: 1 }),
    skill("clr-cadence", "Cadence", "wis", { hit: 0.09 }),
  ],
  Enchanter: [
    skill("enc-hook", "Hook", "cha", { hit: 0.08, xpBonus: 12 }),
    skill("enc-spotlight", "Spotlight", "cha", { hit: 0.06, dropAdvantage: true }),
    skill("enc-chorus", "Chorus", "cha", { hit: 0.11 }),
  ],
  Ranger: [
    skill("rng-backroad", "Backroad", "wis", { hit: 0.08, gradeSteps: 1 }),
    skill("rng-pocket", "Cache", "agi", { hit: 0.07, echoes: 4 }),
    skill("rng-downbeat", "Downbeat", "str", { hit: 0.1 }),
  ],
  Monk: [
    skill("mnk-still", "Stillness", "wis", { hit: 0.04, gradeSteps: 1 }),
    skill("mnk-breath", "Breath", "wis", { hit: 0.06, echoes: 6 }),
    skill("mnk-empty", "Empty Bar", "agi", { hit: 0.12 }),
  ],
  Barbarian: [
    skill("bar-breakdown", "Breakdown", "str", { hit: 0.16 }),
    skill("bar-rush", "Rush", "agi", { seconds: 8 }),
    skill("bar-spit", "Spit", "str", { hit: 0.12 }),
  ],
  Wanderer: [
    skill("wnd-downbeat", "Downbeat", "str", { hit: 0.1 }),
    skill("wnd-side", "Sidechain", "agi", { hit: 0.06, echoes: 3 }),
    skill("wnd-unmap", "Unmapped", "cha", { hit: 0.08, gradeSteps: 1 }),
  ],
};

const BY_ID = new Map<string, SkillDef>(Object.values(BY_CLASS).flat().map((entry) => [entry.id, entry]));

export function skillsForClass(classId: string): SkillDef[] {
  if (isClassId(classId)) return BY_CLASS[classId];
  return BY_CLASS.Wanderer;
}

export function classSignature(classId: string): SkillDef {
  const first = skillsForClass(classId)[0];
  if (!first) throw new Error("class has no skill");
  return first;
}

export function offersFor(classId: string, known: readonly string[]): SkillDef[] {
  const learned = new Set(known);
  return skillsForClass(classId).filter((entry) => !learned.has(entry.id));
}

export function skillById(id: string): SkillDef | undefined {
  return BY_ID.get(id);
}

export function castSkill(entry: SkillDef, input: { hpMax: number; dps: number }): SkillCast {
  return {
    damage: Math.max(1, Math.round(input.hpMax * entry.hit + input.dps * entry.seconds)),
    echoes: entry.echoes,
    gradeSteps: entry.gradeSteps,
    dropAdvantage: entry.dropAdvantage,
    xpBonus: entry.xpBonus,
  };
}

function skill(
  id: string,
  name: string,
  stat: keyof Stats,
  tune: Partial<Omit<SkillDef, "id" | "name" | "stat" | "detail">>,
): SkillDef {
  const hit = tune.hit ?? 0;
  const seconds = tune.seconds ?? 0;
  const echoes = tune.echoes ?? 0;
  const gradeSteps = tune.gradeSteps ?? 0;
  const dropAdvantage = tune.dropAdvantage ?? false;
  const xpBonus = tune.xpBonus ?? 0;
  return {
    id,
    name,
    stat,
    hit,
    seconds,
    echoes,
    gradeSteps,
    dropAdvantage,
    xpBonus,
    detail: skillDetail({ hit, seconds, echoes, gradeSteps, dropAdvantage, xpBonus }),
  };
}

function skillDetail(tune: {
  hit: number;
  seconds: number;
  echoes: number;
  gradeSteps: number;
  dropAdvantage: boolean;
  xpBonus: number;
}): string {
  const parts: string[] = [];
  if (tune.hit > 0 && tune.seconds > 0) {
    parts.push(`Deal ${Math.round(tune.hit * 100)}% of max health plus ${tune.seconds} seconds of your damage`);
  } else if (tune.hit > 0) {
    parts.push(`Deal ${Math.round(tune.hit * 100)}% of max health`);
  } else if (tune.seconds > 0) {
    parts.push(`Deal ${tune.seconds} seconds of your damage`);
  }
  if (tune.echoes > 0) parts.push(`${tune.echoes} extra gold on a kill`);
  if (tune.gradeSteps > 0) parts.push(`raise the grade by ${tune.gradeSteps}`);
  if (tune.dropAdvantage) parts.push("roll the drop twice");
  if (tune.xpBonus > 0) parts.push(`${tune.xpBonus} bonus XP`);
  return `${parts.join(". ")}.`;
}

export function cooldownLeft(readyAt: number | undefined, now: number): number {
  if (readyAt === undefined) return 0;
  return Math.max(0, readyAt - now);
}

export function parseCooldowns(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const cooldowns: Record<string, number> = {};
  for (const [id, readyAt] of Object.entries(value)) {
    if (typeof readyAt === "number" && Number.isFinite(readyAt)) cooldowns[id] = readyAt;
  }
  return cooldowns;
}

function isClassId(value: string): value is (typeof CLASSES)[number] {
  return (CLASSES as readonly string[]).includes(value);
}
