import type { Stats } from "@/lib/game/character";

//— relics modify stats before this runs.
// web playback sdk stays out of mvp. quest begin buttons use the provider, not an embedded player.

export type Grade = "FLAWLESS" | "CLEAN" | "DOWN TO THE WIRE";
export type Outcome = "victory" | "escaped";
export type TrackTier = "standard" | "elite" | "boss";

export type FightResult = {
  echoDepth: number;
  hpMax: number;
  outcome: Outcome;
  grade: Grade | null;
  killMs: number | null;
  remainingFraction: number | null;
};

export function calculateDps(stats: Stats): number {
  const power =
    stats.str * 0.35 + stats.agi * 0.25 + stats.int * 0.2 + stats.wis * 0.1 + stats.cha * 0.1;
  return 8 + power * 0.15;
}

export function trackTier(durationMs: number): { name: TrackTier; scalar: number } {
  const seconds = durationMs / 1000;
  if (seconds >= 600) return { name: "boss", scalar: 1.3 };
  if (seconds >= 360) return { name: "elite", scalar: 1.15 };
  return { name: "standard", scalar: 1 };
}

export function monsterHp(durationMs: number, echoDepth: number): number {
  const seconds = Math.max(1, durationMs / 1000);
  const density = 10 + echoDepth * 2;
  return Math.round(seconds * density * trackTier(durationMs).scalar);
}

export function addStats(base: Stats, extra: Partial<Stats>): Stats {
  return {
    str: clampStat(base.str + (extra.str ?? 0)),
    agi: clampStat(base.agi + (extra.agi ?? 0)),
    int: clampStat(base.int + (extra.int ?? 0)),
    wis: clampStat(base.wis + (extra.wis ?? 0)),
    cha: clampStat(base.cha + (extra.cha ?? 0)),
  };
}

export function sumStats(rows: Partial<Stats>[]): Stats {
  return rows.reduce<Stats>(
    (total, row) => ({
      str: total.str + (row.str ?? 0),
      agi: total.agi + (row.agi ?? 0),
      int: total.int + (row.int ?? 0),
      wis: total.wis + (row.wis ?? 0),
      cha: total.cha + (row.cha ?? 0),
    }),
    { str: 0, agi: 0, int: 0, wis: 0, cha: 0 },
  );
}

//— a finished listen resolves the whole echo chain. a skip is one escape and nothing else.
export function resolveChain(input: {
  durationMs: number;
  msPlayed: number;
  dps: number;
  skipped: boolean;
  openingFraction?: number;
  encoreFraction?: number;
}): FightResult[] {
  if (input.skipped || input.durationMs <= 0 || input.dps <= 0) {
    return [openResult(0, monsterHp(Math.max(input.durationMs, 1000), 0))];
  }

  const fights: FightResult[] = [];
  let elapsed = 0;
  let depth = 0;
  while (depth < 8 && elapsed < input.msPlayed) {
    const hpMax = monsterHp(input.durationMs, depth);
    const rate = depth > 0 ? 1 + (input.encoreFraction ?? 0) : 1;
    const dps = input.dps * rate;
    const shaved = Math.min(hpMax - 1, Math.max(0, Math.round(hpMax * (input.openingFraction ?? 0))));
    const killMs = ((hpMax - shaved) / dps) * 1000;
    const timeLeft = input.msPlayed - elapsed;
    if (killMs >= timeLeft) {
      fights.push(openResult(depth, hpMax));
      break;
    }
    const endAt = elapsed + killMs;
    const remaining = 1 - endAt / input.durationMs;
    const grade: Grade = remaining > 0.5 ? "FLAWLESS" : remaining >= 0.1 ? "CLEAN" : "DOWN TO THE WIRE";
    fights.push({
      echoDepth: depth,
      hpMax,
      outcome: "victory",
      grade,
      killMs,
      remainingFraction: remaining,
    });
    elapsed = endAt;
    //— the last 10% pays the flawless loot bonus instead of spawning an 8-second echo
    if (remaining <= 0.1) break;
    depth += 1;
  }
  return fights;
}

export function liveMonsterState(input: {
  durationMs: number;
  progressMs: number;
  dps: number;
  echoDepth: number;
}): { hpMax: number; hpLeft: number; fraction: number } {
  const hpMax = monsterHp(input.durationMs, input.echoDepth);
  const hpLeft = Math.max(0, hpMax - input.dps * (input.progressMs / 1000));
  return { hpMax, hpLeft, fraction: hpMax > 0 ? hpLeft / hpMax : 0 };
}

//— last.fm has no playhead. the fight clock is time since this encounter spawned, and a later sync must not forget it.
export function progressOnClock(input: {
  startedAtMs: number;
  anchorMs: number;
  durationMs: number;
  storedProgressMs: number;
  nowMs: number;
}): number {
  const sinceSpawn = Math.max(0, input.nowMs - input.startedAtMs);
  const clock = input.anchorMs + sinceSpawn;
  const capped = input.durationMs > 0 ? Math.min(input.durationMs, clock) : clock;
  return Math.max(0, input.storedProgressMs, capped);
}

//— a monster at 0 hp is a kill, including one that died before the halfway mark. leaving early without the kill is the escape.
export function liveFightOutcome(input: { progressMs: number; anchorMs: number; killMs: number }): Outcome {
  const fought = Math.max(0, input.progressMs - input.anchorMs);
  if (Number.isFinite(input.killMs) && fought >= input.killMs) return "victory";
  return "escaped";
}

export function ledgerOutcome(echoDepth: number, outcome: Outcome): "victory" | "escaped" | "faded" {
  //— an echo that runs out of song faded with the record. a skip, or a root fight that gets away, is an escape.
  if (outcome === "escaped" && echoDepth > 0) return "faded";
  return outcome;
}

function openResult(echoDepth: number, hpMax: number): FightResult {
  return {
    echoDepth,
    hpMax,
    outcome: "escaped",
    grade: null,
    killMs: null,
    remainingFraction: null,
  };
}

function clampStat(value: number): number {
  return Math.min(100, Math.max(1, Math.round(value)));
}
