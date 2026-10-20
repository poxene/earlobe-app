import assert from "node:assert/strict";
import { test } from "node:test";
import { allocateLevelUps, grantXp, levelForXp, qualifies, repeatListenXp, respec } from "./xp";
import { CLASSES } from "./classes";

test("a track counts only after half its runtime", () => {
  assert.equal(qualifies(50_000, 100_000), false);
  assert.equal(qualifies(50_001, 100_000), true);
});

test("repeat listens pay less, then floor at 1", () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(repeatListenXp), [10, 5, 2, 1, 1]);
});

test("a reset gives level points back and keeps legacy skill points", () => {
  assert.deepEqual(respec({ level: 2, legacyPoints: 4 }), { unallocated: 10, skillPicks: 5 });
  assert.deepEqual(respec({ level: 1, legacyPoints: 0 }), { unallocated: 0, skillPicks: 0 });
});

test("xp keeps scaling with no daily cap", () => {
  const granted = grantXp(500, 150);
  assert.equal(granted.granted, 150);
  assert.equal(granted.xp, 650);
});

test("level 2 is the formula, and a berserker level-up keeps three points free", () => {
  assert.equal(levelForXp(281), 1);
  assert.equal(levelForXp(282), 2);
  const gained = allocateLevelUps(1, CLASSES.Metal.vector);
  const spent = gained.bonus.str + gained.bonus.agi + gained.bonus.int + gained.bonus.wis + gained.bonus.cha;
  assert.equal(spent, 7);
  assert.equal(gained.unallocated, 3);
  assert.equal(gained.bonus.str, 4);
});
