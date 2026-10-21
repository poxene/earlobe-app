import assert from "node:assert/strict";
import { test } from "node:test";
import { CLASSES } from "./classes";
import { resolveChain } from "./combat";
import { dropLuck, echoPayout, fightDps, openingFraction, settleGrade } from "./effects";
import { craftRelic, nextRarity, rarityChances, rarityFromRoll, rollRelic, SELL_PRICE } from "./loot";
import { castSkill, cooldownLeft, offersFor, skillById, skillsForClass, SKILL_COOLDOWN_MS } from "./skills";

const ZERO = { str: 0, agi: 0, int: 0, wis: 0, cha: 0 };

test("strength opens the fight and agility speeds it", () => {
  const slow = { ...ZERO, str: 10, agi: 10 };
  const fast = { ...ZERO, str: 80, agi: 80 };
  assert.ok(openingFraction(fast, []) > openingFraction(slow, []));
  assert.ok(fightDps(10, fast, [], 0) > fightDps(10, slow, [], 0));
});

test("an opening hit shortens the kill without changing a fight that has none", () => {
  const plain = resolveChain({ durationMs: 180_000, msPlayed: 180_000, dps: 13, skipped: false });
  const opened = resolveChain({
    durationMs: 180_000,
    msPlayed: 180_000,
    dps: 13,
    skipped: false,
    openingFraction: 0.2,
  });
  assert.equal(plain[0]?.grade, "CLEAN");
  assert.ok((opened[0]?.killMs ?? 0) < (plain[0]?.killMs ?? 0));
});

test("poise can lift a wire kill to clean, and a skill can lift it again", () => {
  assert.equal(settleGrade(0.09, { ...ZERO, wis: 0 }, [], 0), "DOWN TO THE WIRE");
  assert.equal(settleGrade(0.09, { ...ZERO, wis: 40 }, [], 0), "CLEAN");
  assert.equal(settleGrade(0.09, ZERO, [], 1), "CLEAN");
  assert.equal(settleGrade(0.4, ZERO, [], 1), "FLAWLESS");
});

test("intellect and hoard both raise a kill's echoes", () => {
  const base = echoPayout(8, ZERO, [], 0);
  const minded = echoPayout(8, { ...ZERO, int: 30 }, [], 0);
  const hoarded = echoPayout(8, ZERO, [{ id: "hoard", name: "Hoard", detail: "", magnitude: 50 }], 0);
  assert.equal(base, 8);
  assert.equal(minded, 10);
  assert.equal(hoarded, 12);
});

test("charm makes an ordinary kill able to drop", () => {
  const missed = rollRelic({
    genreFamily: "Rock",
    tier: "standard",
    grade: "CLEAN",
    echoDepth: 0,
    flawlessLoot: false,
    roll: 0,
  });
  const lucky = rollRelic({
    genreFamily: "Rock",
    tier: "standard",
    grade: "CLEAN",
    echoDepth: 0,
    flawlessLoot: false,
    roll: 0,
    luck: dropLuck({ ...ZERO, cha: 50 }, []),
  });
  assert.equal(missed, null);
  assert.ok(lucky);
});

test("the same salt always cuts the same relic, and salts disagree", () => {
  const once = rollRelic({
    genreFamily: "Metal",
    tier: "boss",
    grade: "CLEAN",
    echoDepth: 0,
    flawlessLoot: false,
    roll: 0.99,
    salt: "track-a",
  });
  const twice = rollRelic({
    genreFamily: "Metal",
    tier: "boss",
    grade: "CLEAN",
    echoDepth: 0,
    flawlessLoot: false,
    roll: 0.99,
    salt: "track-a",
  });
  assert.equal(once?.name.startsWith("Demon "), true);
  assert.notEqual(once?.rarity, "mythic");
  assert.ok((once?.effects.length ?? 0) >= 1);
  assert.deepEqual(once, twice);
  const shapes = new Set<string>();
  for (let index = 0; index < 24; index += 1) {
    const relic = rollRelic({
      genreFamily: "Metal",
      tier: "boss",
      grade: "CLEAN",
      echoDepth: 0,
      flawlessLoot: false,
      roll: 0,
      salt: `track-${index}`,
    });
    shapes.add(`${relic?.cut}:${relic?.effects.map((effect) => effect.id).join(",")}:${JSON.stringify(relic?.bonuses)}`);
  }
  assert.ok(shapes.size > 1);
});

test("each affix rolls its own stat, and rarer items roll more of them", () => {
  const counts = (rarity: "common" | "magic" | "rare" | "legendary" | "mythic", salt: string) =>
    craftRelic({ genreFamily: "Hip-hop", rarity, salt }).affixes.length;
  const commonStats = new Set<string>();
  const commonAmounts = new Set<number>();
  const magicCounts = new Set<number>();
  const rareCounts = new Set<number>();
  const legendaryCounts = new Set<number>();
  for (let index = 0; index < 40; index += 1) {
    const common = craftRelic({ genreFamily: "Hip-hop", rarity: "common", salt: `common-${index}` });
    assert.equal(common.affixes.length, 1);
    const row = common.affixes[0];
    assert.ok(row);
    assert.ok(row.amount >= 1 && row.amount <= 3);
    assert.equal(common.bonuses[row.stat], row.amount);
    commonStats.add(row.stat);
    commonAmounts.add(row.amount);
    magicCounts.add(counts("magic", `magic-${index}`));
    rareCounts.add(counts("rare", `rare-${index}`));
    legendaryCounts.add(counts("legendary", `legendary-${index}`));
    const again = craftRelic({ genreFamily: "Hip-hop", rarity: "common", salt: `common-${index}` });
    assert.deepEqual(again.affixes, common.affixes);
  }
  assert.ok(commonStats.size > 1);
  assert.ok(commonAmounts.size > 1);
  assert.deepEqual([...magicCounts].sort(), [1, 2]);
  assert.deepEqual([...rareCounts].sort(), [2, 3]);
  assert.deepEqual([...legendaryCounts].sort(), [3, 4, 5]);

  let repeated = false;
  const mythicCounts = new Set<number>();
  for (let index = 0; index < 24; index += 1) {
    const relic = craftRelic({ genreFamily: "Metal", rarity: "mythic", salt: `mythic-${index}` });
    mythicCounts.add(relic.affixes.length);
    assert.ok(relic.affixes.every((row) => row.amount >= 1 && row.amount <= 8));
    const seen = new Map<string, number>();
    for (const row of relic.affixes) seen.set(row.stat, (seen.get(row.stat) ?? 0) + 1);
    if ([...seen.values()].some((count) => count > 1)) repeated = true;
    const total = relic.affixes.reduce((sum, row) => sum + (row.stat === "int" ? row.amount : 0), 0);
    assert.equal(relic.bonuses.int, total);
  }
  assert.deepEqual([...mythicCounts].sort(), [6, 7]);
  assert.equal(repeated, true);
});

test("legendaries stay under one percent, and deeper echoes shift the table up", () => {
  const floor = rarityChances(0);
  const high = rarityChances(8);
  assert.ok(floor.legendary < 0.01);
  assert.ok(high.legendary < 0.01);
  assert.ok(high.legendary >= floor.legendary);
  assert.ok(high.rare + high.legendary > floor.rare + floor.legendary);
  assert.ok(high.common < floor.common);
  const sum = high.common + high.magic + high.rare + high.legendary;
  assert.ok(Math.abs(sum - 1) < 1e-9);
  assert.equal(rarityFromRoll(0, 0), "common");
  assert.equal(rarityFromRoll(0.999, 0), "legendary");
  for (let depth = 0; depth < 12; depth += 1) {
    for (let roll = 0; roll < 1; roll += 0.05) assert.notEqual(rarityFromRoll(roll, depth), "mythic");
  }
  const made = craftRelic({ genreFamily: "Metal", rarity: "mythic", salt: "three-idols" });
  assert.equal(made.name.startsWith("Demon "), true);
  assert.equal(made.name.includes("Myth"), false);
  assert.equal(made.effects.length, 3);
  assert.equal(nextRarity("legendary"), "mythic");
  assert.equal(nextRarity("mythic"), null);
  assert.equal(SELL_PRICE.magic, SELL_PRICE.common * 3);
  assert.equal(SELL_PRICE.mythic, SELL_PRICE.legendary * 3);
});

test("every class offers three skills, and a cast spends health", () => {
  for (const entry of Object.values(CLASSES)) {
    const rows = skillsForClass(entry.id);
    assert.equal(rows.length, 3);
    assert.equal(new Set(rows.map((row) => row.id)).size, 3);
  }
  const known = offersFor("Wanderer", []).map((row) => row.id);
  assert.equal(offersFor("Wanderer", [known[0] ?? ""]).length, 2);
  const downbeat = skillById("wnd-downbeat");
  assert.ok(downbeat);
  const cast = castSkill(downbeat, { hpMax: 1000, dps: 10 });
  assert.equal(cast.damage, 100);
  assert.equal(cooldownLeft(1_000 + SKILL_COOLDOWN_MS, 1_000), SKILL_COOLDOWN_MS);
  assert.equal(cooldownLeft(1_000, 1_000 + SKILL_COOLDOWN_MS), 0);
});
