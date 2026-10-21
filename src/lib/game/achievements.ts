import { RARITY_RANK, type Rarity } from "@/lib/game/loot";
import { DOLL_SLOTS, pieceOf, slotIndex } from "@/lib/portrait/gear";

export type StageMark = "earned" | "current" | "ahead";

export type AchievementView = {
  id: string;
  name: string;
  title: string;
  detail: string;
  earned: boolean;
  complete: boolean;
  marks: { state: StageMark; label: string }[];
};

type WornRelic = { id: string; rarity: Rarity; gearSlug?: string | null } | null;

const EARLY = [50, 100, 250, 500];
const STEPS = [1, 1.5, 2, 2.5, 5, 7.5, 10];

export const SCROBBLE_MARKS: number[] = buildMarks();

const GEAR_SLOTS = DOLL_SLOTS.filter((slot) => slot !== "charm" && slot !== "amulet");

const GEAR_STAGES: { label: string; min: number }[] = [
  { label: "Dressed", min: 0 },
  { label: "Magic", min: 1 },
  { label: "Rare", min: 2 },
  { label: "Legendary", min: 3 },
  { label: "Mythic", min: 4 },
];

function buildMarks(): number[] {
  const marks = [...EARLY];
  for (let base = 1_000; base <= 1_000_000; base *= 10) {
    for (const step of STEPS) marks.push(base * step);
  }
  return [...new Set(marks)].sort((a, b) => a - b);
}

export function nextScrobbleMark(listens: number): number | null {
  const heard = Math.max(0, Math.floor(listens));
  return SCROBBLE_MARKS.find((count) => count > heard) ?? null;
}

export function achievementsFor(input: {
  listens: number;
  victories: number;
  highestEcho: number;
  albumsFinished: number;
  relics: readonly WornRelic[];
}): AchievementView[] {
  return [
    ladder({
      id: "scrobbles",
      name: "Scrobbles",
      value: input.listens,
      stages: SCROBBLE_MARKS.map((count) => ({ label: count.toLocaleString(), at: count })),
      toward: (current, next) => `${Math.floor(current).toLocaleString()} / ${next.toLocaleString()}`,
      done: "Every scrobble stage is earned.",
    }),
    gearCard(input.relics),
    ladder({
      id: "victories",
      name: "Victories",
      value: input.victories,
      stages: [1, 10, 25, 50, 100, 250, 500, 1_000].map((count) => ({ label: count.toLocaleString(), at: count })),
      toward: (current, next) => `${Math.floor(current).toLocaleString()} / ${next.toLocaleString()}`,
      done: "Every victory stage is earned.",
    }),
    ladder({
      id: "echoes",
      name: "Echoes",
      value: input.highestEcho,
      stages: [1, 3, 5, 10, 15, 25].map((count) => ({ label: String(count), at: count })),
      toward: (current, next) => `${Math.floor(current).toLocaleString()} / ${next.toLocaleString()}`,
      done: "Every echo stage is earned.",
    }),
    ladder({
      id: "albums",
      name: "Albums",
      value: input.albumsFinished,
      stages: [1, 5, 10, 25, 50, 100].map((count) => ({ label: count.toLocaleString(), at: count })),
      toward: (current, next) => `${Math.floor(current).toLocaleString()} / ${next.toLocaleString()} finished`,
      done: "Every album stage is earned.",
    }),
  ];
}

function ladder(input: {
  id: string;
  name: string;
  value: number;
  stages: { label: string; at: number }[];
  toward: (current: number, next: number) => string;
  done: string;
}): AchievementView {
  const value = Math.max(0, input.value);
  const earned = input.stages.filter((stage) => value >= stage.at);
  const next = input.stages.find((stage) => value < stage.at) ?? null;
  const current = earned.at(-1) ?? null;
  return {
    id: input.id,
    name: input.name,
    title: current?.label ?? next?.label ?? input.name,
    detail: next ? input.toward(value, next.at) : input.done,
    earned: current !== null,
    complete: next === null,
    marks: input.stages.map((stage) => ({
      label: stage.label,
      state: value >= stage.at ? "earned" : stage === next ? "current" : "ahead",
    })),
  };
}

function gearCard(relics: readonly WornRelic[]): AchievementView {
  const ranks = gearRanks(relics);
  const total = ranks.length;
  const met = (min: number) => ranks.filter((rank) => rank >= min).length;
  const earned = GEAR_STAGES.filter((stage) => met(stage.min) === total);
  const next = GEAR_STAGES.find((stage) => met(stage.min) < total) ?? null;
  const current = earned.at(-1) ?? null;
  const phrase = next?.label === "Dressed" ? "filled" : (next?.label.toLowerCase() ?? "");
  return {
    id: "gear",
    name: "Gear",
    title: current?.label ?? "Dressed",
    detail: next ? `${met(next.min)} / ${total} ${phrase}` : "Every gear slot is mythic.",
    earned: current !== null,
    complete: next === null,
    marks: GEAR_STAGES.map((stage) => ({
      label: stage.label,
      state: met(stage.min) === total ? "earned" : stage === next ? "current" : "ahead",
    })),
  };
}

function gearRanks(relics: readonly WornRelic[]): number[] {
  const weapon = relics[slotIndex("weapon")] ?? null;
  const coversOffhand = weapon ? pieceOf(weapon).twoHanded : false;
  return GEAR_SLOTS.map((slot) => {
    if (slot === "offhand" && coversOffhand && weapon) return RARITY_RANK[weapon.rarity];
    const relic = relics[slotIndex(slot)] ?? null;
    if (!relic) return -1;
    return RARITY_RANK[relic.rarity];
  });
}
