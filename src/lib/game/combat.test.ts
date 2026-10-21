import assert from "node:assert/strict";
import { test } from "node:test";
import { liveFightOutcome, monsterHp, progressOnClock, resolveChain, trackTier, ledgerOutcome, calculateDps } from "./combat";
import { fightDps, openingDamage } from "./effects";
import { echoReward, rollRelic } from "./loot";

test("a three-minute track at modest dps is a clean kill and a dying echo", () => {
  const fights = resolveChain({ durationMs: 180_000, msPlayed: 180_000, dps: 13, skipped: false });
  assert.equal(fights[0]?.outcome, "victory");
  assert.equal(fights[0]?.grade, "CLEAN");
  assert.equal(fights[1]?.outcome, "escaped");
  assert.equal(fights[1]?.echoDepth, 1);
  assert.ok((fights[1]?.hpMax ?? 0) > (fights[0]?.hpMax ?? 0));
});

test("a kill already on the clock is a victory even if the saved playhead is behind", () => {
  const startedAtMs = 1_000_000;
  const progressMs = progressOnClock({
    startedAtMs,
    anchorMs: 0,
    durationMs: 180_000,
    storedProgressMs: 40_000,
    nowMs: startedAtMs + 50_000,
  });
  assert.equal(progressMs, 50_000);
  assert.equal(liveFightOutcome({ progressMs, anchorMs: 0, killMs: 45_000, durationMs: 180_000 }), "victory");
  assert.equal(liveFightOutcome({ progressMs: 20_000, anchorMs: 0, killMs: 45_000, durationMs: 180_000 }), "escaped");
});

test("a fresh character finishes every track as the song ends", () => {
  const fresh = { str: 10, agi: 10, int: 10, wis: 10, cha: 10 };
  const dps = fightDps(calculateDps(fresh), fresh, [], 0);
  for (const durationMs of [180_000, 465_000, 600_000]) {
    const hpMax = monsterHp(durationMs, 0);
    const opening = openingDamage(hpMax, fresh, []);
    const killMs = ((hpMax - opening) / dps) * 1000;
    assert.equal(liveFightOutcome({ progressMs: durationMs, anchorMs: 0, killMs, durationMs }), "victory");
    const remaining = Math.abs(1 - killMs / durationMs);
    assert.ok(remaining < 0.01, `song and health diverged by ${remaining}`);
  }
});

test("finishing a song a few seconds short of the kill is still a victory", () => {
  assert.equal(
    liveFightOutcome({ progressMs: 180_000, anchorMs: 0, killMs: 184_000, durationMs: 180_000 }),
    "victory",
  );
  assert.equal(
    liveFightOutcome({ progressMs: 180_000, anchorMs: 0, killMs: 210_000, durationMs: 180_000 }),
    "victory",
  );
  assert.equal(
    liveFightOutcome({ progressMs: 180_000, anchorMs: 0, killMs: 210_000, durationMs: 180_000, echoDepth: 1 }),
    "escaped",
  );
  assert.equal(
    liveFightOutcome({ progressMs: 90_000, anchorMs: 0, killMs: 100_000, durationMs: 180_000 }),
    "escaped",
  );
});

test("a skip is an escape with no echo", () => {
  const fights = resolveChain({ durationMs: 180_000, msPlayed: 20_000, dps: 30, skipped: true });
  assert.equal(fights.length, 1);
  assert.equal(fights[0]?.outcome, "escaped");
  assert.equal(ledgerOutcome(0, "escaped"), "escaped");
  assert.equal(ledgerOutcome(1, "escaped"), "faded");
});

test("a long song is a boss for loot and has the same health rate", () => {
  assert.equal(trackTier(600_000).name, "boss");
  assert.equal(trackTier(400_000).name, "elite");
  const standardPerSecond = monsterHp(180_000, 0) / 180;
  const bossPerSecond = monsterHp(600_000, 0) / 600;
  assert.ok(Math.abs(bossPerSecond - standardPerSecond) < 0.05);
  const relic = rollRelic({
    genreFamily: "Metal",
    tier: "boss",
    grade: "CLEAN",
    echoDepth: 0,
    flawlessLoot: false,
    roll: 0.99,
  });
  assert.ok(relic);
  assert.notEqual(relic?.rarity, "mythic");
  assert.equal(relic?.name.startsWith("Demon "), true);
  assert.equal(echoReward("FLAWLESS", "boss", 0), 35);
});

test("a standard track drops nothing unless the kill was flawless", () => {
  const missed = rollRelic({
    genreFamily: "Rock",
    tier: "standard",
    grade: "CLEAN",
    echoDepth: 0,
    flawlessLoot: false,
    roll: 0,
  });
  assert.equal(missed, null);
});
