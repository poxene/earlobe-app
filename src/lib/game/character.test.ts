import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCharacter } from "./character";
import { DOLL_SLOTS } from "../portrait/gear";
import { calculateDps } from "./combat";
import { cumulativeXpForLevel } from "./xp";
import type { ProviderArtist } from "../music/provider";

function artist(name: string, genres: string[]): ProviderArtist {
  return { id: name, name, genres, imageUrl: null, followerCount: 0 };
}

test("a pure metal listener becomes a berserker with base stats of 10", () => {
  const built = buildCharacter({
    displayName: "Listener",
    level: 1,
    xp: 0,
    artists: [artist("Anvil", ["thrash metal"])],
    albums: [],
  });
  assert.equal(built.model.className, "Berserker");
  assert.equal(built.model.subclass, null);
  assert.deepEqual(built.stats, { str: 10, agi: 10, int: 10, wis: 10, cha: 10 });
  const power = 10 * 0.35 + 10 * 0.25 + 10 * 0.2 + 10 * 0.1 + 10 * 0.1;
  assert.ok(Math.abs(calculateDps(built.stats) - (8 + power * 0.15)) < 1e-9);
});

test("an empty library is a wanderer", () => {
  const built = buildCharacter({
    displayName: "Listener",
    level: 1,
    xp: 0,
    artists: [],
    albums: [],
  });
  assert.equal(built.model.className, "Wanderer");
  assert.equal(built.model.thinHistory, true);
  assert.deepEqual(built.stats, { str: 10, agi: 10, int: 10, wis: 10, cha: 10 });
});

test("a second family under 15% does not become a subclass", () => {
  const artists = [
    ...Array.from({ length: 7 }, (_, index) => artist(`metal-${index}`, ["metal"])),
    artist("one-jazz", ["bebop"]),
  ];
  const built = buildCharacter({
    displayName: "Listener",
    level: 1,
    xp: 0,
    artists,
    albums: [],
  });
  assert.equal(built.model.className, "Berserker");
  assert.equal(built.model.subclass, null);
});

test("hip-hop as a real second voice unlocks the rogue subclass label", () => {
  const artists = [
    ...Array.from({ length: 6 }, (_, index) => artist(`metal-${index}`, ["metal"])),
    ...Array.from({ length: 3 }, (_, index) => artist(`rap-${index}`, ["hip hop"])),
    artist("jazz-1", ["jazz"]),
  ];
  const built = buildCharacter({
    displayName: "Listener",
    level: 1,
    xp: 0,
    artists,
    albums: [],
  });
  assert.equal(built.model.className, "Berserker");
  assert.equal(built.model.subclass, "Rogue");
  assert.equal(built.model.xpForNext, cumulativeXpForLevel(2));
  assert.equal(built.model.relics.length, DOLL_SLOTS.length);
});

test("split tags share one artist's weight", () => {
  const built = buildCharacter({
    displayName: "Listener",
    level: 1,
    xp: 0,
    artists: [artist("both", ["metal", "rap"])],
    albums: [],
  });
  assert.equal(built.model.className, "Berserker");
  assert.equal(built.model.subclass, "Rogue");
});

test("level curve matches the published milestones", () => {
  assert.equal(cumulativeXpForLevel(5), 1118);
  assert.equal(cumulativeXpForLevel(10), 3162);
  assert.equal(cumulativeXpForLevel(20), 8944);
  assert.equal(cumulativeXpForLevel(2), 282);
});
