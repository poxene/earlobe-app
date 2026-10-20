import type { Stats } from "../../src/lib/game/character";
import { isRecord } from "../../src/lib/isRecord";

export function parseBonus(value: unknown): Stats {
  if (!isRecord(value)) return { str: 0, agi: 0, int: 0, wis: 0, cha: 0 };
  return {
    str: numberOf(value.str),
    agi: numberOf(value.agi),
    int: numberOf(value.int),
    wis: numberOf(value.wis),
    cha: numberOf(value.cha),
  };
}

function numberOf(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
