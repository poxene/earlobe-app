import assert from "node:assert/strict";
import { test } from "node:test";
import { monsterForFamily } from "./bestiary";
import { GENRE_FAMILIES } from "../music/normalize";
import { materialCount, materialsForMonster, rollMaterialDrops, transmuteMonster } from "./materials";

test("each monster has three themed materials", () => {
  const monsters = new Set(GENRE_FAMILIES.map((family) => monsterForFamily(family).monster));
  assert.equal(monsters.size, GENRE_FAMILIES.length);
  for (const monster of monsters) {
    const kinds = materialsForMonster(monster);
    assert.equal(kinds.length, 3);
    assert.deepEqual(kinds.map((row) => row.tier).sort(), [0, 1, 2]);
    assert.equal(new Set(kinds.map((row) => row.slug)).size, 3);
  }
});

test("a kill drops only that monster's materials, and the same salt repeats", () => {
  const first = rollMaterialDrops({ monster: "Siren", tier: "standard", grade: "CLEAN", salt: "song" });
  const again = rollMaterialDrops({ monster: "Siren", tier: "standard", grade: "CLEAN", salt: "song" });
  assert.deepEqual(first, again);
  assert.equal(first.reduce((sum, row) => sum + row.quantity, 0), materialCount("standard", "CLEAN"));
  const allowed = new Set(materialsForMonster("Siren").map((row) => row.slug));
  assert.ok(first.every((row) => allowed.has(row.slug)));
  assert.equal(materialCount("boss", "FLAWLESS"), 4);
});

test("transmute picks the same monster every time for the same relics", () => {
  const relics = [
    { id: "b", monsterType: "Ogre" },
    { id: "a", monsterType: "Siren" },
  ];
  assert.equal(transmuteMonster(relics), transmuteMonster([...relics].reverse()));
  assert.ok(relics.some((row) => row.monsterType === transmuteMonster(relics)));
});
