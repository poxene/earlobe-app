import type { StatAffix, StatKey, Stats } from "@/lib/game/character";
import type { Grade, TrackTier } from "@/lib/game/combat";
import { monsterForFamily } from "@/lib/game/bestiary";
import type { Cut, EffectId, RelicEffect } from "@/lib/game/effects";
import { gearForSalt, relicTitle } from "@/lib/portrait/gear";

export const RARITIES = ["common", "magic", "rare", "legendary", "mythic"] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#f4f4f5",
  magic: "#4c8dff",
  rare: "#f5d76e",
  legendary: "#ff8a3d",
  mythic: "#ff4fd8",
};

export const RARITY_RANK: Record<Rarity, number> = {
  common: 0,
  magic: 1,
  rare: 2,
  legendary: 3,
  mythic: 4,
};

//— selling three of a tier pays the same as selling the one they become.
export const SELL_PRICE: Record<Rarity, number> = {
  common: 8,
  magic: 24,
  rare: 72,
  legendary: 216,
  mythic: 648,
};

const AFFIX_ROLL: Record<Rarity, { min: number; max: number; high: number }> = {
  common: { min: 1, max: 1, high: 3 },
  magic: { min: 1, max: 2, high: 4 },
  rare: { min: 2, max: 3, high: 5 },
  legendary: { min: 3, max: 5, high: 6 },
  mythic: { min: 6, max: 7, high: 8 },
};

//— legendary starts at 0.35% and is fed by the tier beneath it. it never reaches 1%.
const LEGENDARY_FLOOR = 0.0035;
const LEGENDARY_CAP = 0.009;
const STEP = 6;

export function isRarity(value: string): value is Rarity {
  return (RARITIES as readonly string[]).includes(value);
}

export function nextRarity(rarity: Rarity): Rarity | null {
  const index = RARITIES.indexOf(rarity);
  return RARITIES[index + 1] ?? null;
}

export function rarityChances(echoDepth: number): Record<Exclude<Rarity, "mythic">, number> {
  const depth = Math.max(0, Math.floor(echoDepth));
  let legendary = LEGENDARY_FLOOR;
  let rare = LEGENDARY_FLOOR * STEP;
  let magic = rare * STEP;
  let common = 1 - legendary - rare - magic;

  for (let index = 0; index < Math.min(depth, 15); index += 1) {
    const commonToMagic = common * 0.12;
    const magicToRare = magic * 0.14;
    const rareToLegendary = rare * 0.1;
    common -= commonToMagic;
    magic = magic + commonToMagic - magicToRare;
    rare = rare + magicToRare - rareToLegendary;
    legendary += rareToLegendary;
    if (legendary > LEGENDARY_CAP) {
      rare += legendary - LEGENDARY_CAP;
      legendary = LEGENDARY_CAP;
    }
  }

  const total = common + magic + rare + legendary;
  return {
    common: common / total,
    magic: magic / total,
    rare: rare / total,
    legendary: legendary / total,
  };
}

export function rarityFromRoll(roll: number, echoDepth: number): Exclude<Rarity, "mythic"> {
  const chances = rarityChances(echoDepth);
  const point = Math.min(0.999999, Math.max(0, roll));
  if (point < chances.common) return "common";
  if (point < chances.common + chances.magic) return "magic";
  if (point < chances.common + chances.magic + chances.rare) return "rare";
  return "legendary";
}

export function echoReward(grade: Grade, tier: TrackTier, echoDepth: number): number {
  const base = tier === "boss" ? 22 : tier === "elite" ? 14 : 8;
  const mult = grade === "FLAWLESS" ? 1.6 : grade === "CLEAN" ? 1 : 0.8;
  return Math.round(base * mult * (1 + echoDepth * 0.25));
}

//— bosses always drop. elites usually do. a standard track only drops on a flawless, or on a last-breath kill.
export function rollRelic(input: {
  genreFamily: string;
  tier: TrackTier;
  grade: Grade;
  echoDepth: number;
  flawlessLoot: boolean;
  roll: number;
  salt?: string;
  luck?: number;
}): RelicDraft | null {
  const boosted = input.grade === "FLAWLESS" || input.flawlessLoot;
  const chance =
    input.tier === "boss" ? 1 : input.tier === "elite" ? (boosted ? 0.7 : 0.4) : boosted ? 0.25 : 0;
  if (input.roll >= Math.min(1, chance + (input.luck ?? 0))) return null;

  const salt = input.salt ?? input.roll.toFixed(4);
  const rarity = rarityFromRoll(hash(`${salt}:rarity`) / 0x100000000, input.echoDepth);
  return draftRelic(input.genreFamily, rarity, salt);
}

export function craftRelic(input: { genreFamily: string; rarity: Rarity; salt: string }): RelicDraft {
  return draftRelic(input.genreFamily, input.rarity, input.salt);
}

export type RelicDraft = {
  name: string;
  gearSlug: string;
  monsterType: string;
  genreFamily: string;
  rarity: Rarity;
  bonuses: Stats;
  affixes: StatAffix[];
  cut: Cut;
  effects: RelicEffect[];
};

export function statBonusPayload(draft: Pick<RelicDraft, "bonuses" | "affixes">): Stats & { rolls: StatAffix[] } {
  return { ...draft.bonuses, rolls: draft.affixes };
}

function draftRelic(genreFamily: string, rarity: Rarity, salt: string): RelicDraft {
  const monster = monsterForFamily(genreFamily);
  const piece = gearForSalt(`${salt}:gear`);
  const rolled = rollAffixes(rarity, salt);
  return {
    name: relicTitle(monster.monster, piece),
    gearSlug: piece.slug,
    monsterType: monster.monster,
    genreFamily,
    rarity,
    bonuses: rolled.bonuses,
    affixes: rolled.affixes,
    cut: rolled.cut,
    effects: effectsFor(rarity, `${salt}:fx`),
  };
}

const KEYS = ["str", "agi", "int", "wis", "cha"] as const;
const EFFECT_IDS: EffectId[] = ["opening", "tempo", "signal", "poise", "room", "encore", "hoard"];

const EFFECT_COPY: Record<EffectId, { name: string; detail: (magnitude: number) => string }> = {
  opening: { name: "Opening hit", detail: (magnitude) => `Opening hit deals an extra ${magnitude}% of max health.` },
  tempo: { name: "Fight speed", detail: (magnitude) => `+${magnitude}% damage for the whole fight.` },
  signal: { name: "Bonus gold", detail: (magnitude) => `+${magnitude} gold on a kill.` },
  poise: { name: "Grade leeway", detail: (magnitude) => `Grades count an extra ${magnitude}% of the track as finished.` },
  room: { name: "Listen XP", detail: (magnitude) => `+${magnitude}% listen XP, and +${magnitude}% drop chance.` },
  encore: { name: "Echo damage", detail: (magnitude) => `+${magnitude}% damage against echoes.` },
  hoard: { name: "Gold payout", detail: (magnitude) => `Gold from kills is ${magnitude}% higher.` },
};

const MAGNITUDE: Record<EffectId, Record<Rarity, number>> = {
  opening: { common: 2, magic: 4, rare: 6, legendary: 10, mythic: 14 },
  tempo: { common: 3, magic: 6, rare: 8, legendary: 12, mythic: 16 },
  signal: { common: 1, magic: 1, rare: 2, legendary: 4, mythic: 6 },
  poise: { common: 1, magic: 1, rare: 2, legendary: 3, mythic: 5 },
  room: { common: 3, magic: 6, rare: 8, legendary: 12, mythic: 16 },
  encore: { common: 8, magic: 14, rare: 18, legendary: 28, mythic: 40 },
  hoard: { common: 10, magic: 18, rare: 25, legendary: 40, mythic: 60 },
};

function rollAffixes(rarity: Rarity, salt: string): { bonuses: Stats; affixes: StatAffix[]; cut: Cut } {
  const band = AFFIX_ROLL[rarity];
  const count = band.min + (band.max <= band.min ? 0 : hash(`${salt}:count`) % (band.max - band.min + 1));
  const affixes: StatAffix[] = [];
  for (let index = 0; index < count; index += 1) {
    affixes.push({
      stat: pickStat(hash(`${salt}:affix:${index}`)),
      amount: 1 + (hash(`${salt}:amount:${index}`) % band.high),
    });
  }
  const unique = new Set(affixes.map((row) => row.stat)).size;
  return {
    affixes,
    bonuses: sumAffixes(affixes),
    cut: unique >= 3 ? "attuned" : unique === 2 ? "split" : "focused",
  };
}

function pickStat(seed: number): StatKey {
  return KEYS[seed % KEYS.length] ?? "str";
}

function sumAffixes(affixes: readonly StatAffix[]): Stats {
  const bonuses: Stats = { str: 0, agi: 0, int: 0, wis: 0, cha: 0 };
  for (const row of affixes) bonuses[row.stat] += row.amount;
  return bonuses;
}

function effectsFor(rarity: Rarity, salt: string): RelicEffect[] {
  const count = rarity === "mythic" ? 3 : rarity === "rare" || rarity === "legendary" ? 2 : 1;
  return shuffle(EFFECT_IDS, hash(salt))
    .slice(0, count)
    .flatMap((id) => {
      const high = MAGNITUDE[id][rarity];
      const copy = EFFECT_COPY[id];
      const magnitude = 1 + (hash(`${salt}:${id}`) % high);
      return [{ id, name: copy.name, detail: copy.detail(magnitude), magnitude }];
    });
}

function shuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  let state = seed >>> 0;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swap = state % (index + 1);
    const left = copy[index];
    const right = copy[swap];
    if (left === undefined || right === undefined) continue;
    copy[index] = right;
    copy[swap] = left;
  }
  return copy;
}

function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return value;
}
