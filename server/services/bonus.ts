import type { StatAffix, StatKey, Stats } from "../../src/lib/game/character";
import { isRecord } from "../../src/lib/isRecord";

const STAT_KEYS: StatKey[] = ["str", "agi", "int", "wis", "cha"];

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

export function parseRolls(value: unknown): StatAffix[] {
  if (!isRecord(value) || !Array.isArray(value.rolls)) return [];
  return value.rolls.flatMap((row) => {
    if (!isRecord(row) || !isStatKey(row.stat) || typeof row.amount !== "number" || !Number.isInteger(row.amount) || row.amount <= 0) {
      return [];
    }
    return [{ stat: row.stat, amount: row.amount }];
  });
}

function isStatKey(value: unknown): value is StatKey {
  return typeof value === "string" && STAT_KEYS.some((key) => key === value);
}

function numberOf(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
