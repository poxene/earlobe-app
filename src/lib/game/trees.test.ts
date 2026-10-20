import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCharacter } from "./character";
import { canSpend, legacyGrant, nodesForClass, purchasable, treeEffects, withoutPending, LEGACY_POINT_CAP } from "./trees";
import type { ProviderArtist } from "../music/provider";

function artist(name: string, genres: string[]): ProviderArtist {
  return { id: name, name, genres, imageUrl: null, followerCount: 0 };
}

test("a library grants a few legacy points and does not raise the class base", () => {
  const empty = legacyGrant({ artistCount: 0, shares: [{ family: "Unmapped", share: 1 }] });
  assert.equal(empty.points, 0);
  assert.deepEqual(empty.classes, ["Wanderer"]);

  const metal = legacyGrant({
    artistCount: 40,
    shares: [
      { family: "Metal", share: 0.7 },
      { family: "Rock", share: 0.2 },
      { family: "Jazz", share: 0.1 },
    ],
  });
  assert.equal(metal.points, 3);
  assert.deepEqual(metal.classes.sort(), ["Berserker", "Warrior"].sort());

  const broad = legacyGrant({
    artistCount: 50,
    shares: [
      { family: "Metal", share: 0.2 },
      { family: "Rock", share: 0.2 },
      { family: "Jazz", share: 0.2 },
      { family: "Pop", share: 0.2 },
      { family: "Punk", share: 0.2 },
    ],
  });
  assert.equal(broad.points, LEGACY_POINT_CAP);
  assert.equal(broad.classes.length, 5);

  const built = buildCharacter({
    displayName: "Listener",
    level: 1,
    xp: 0,
    artists: [artist("Anvil", ["thrash metal"])],
    albums: [],
  });
  assert.deepEqual(built.stats, { str: 10, agi: 10, int: 10, wis: 10, cha: 10 });
  assert.equal(built.model.level, 1);
  assert.equal(built.model.xp, 0);
  assert.equal(built.model.legacyPoints, 1);
});

test("a class tree is three branches, and a point cannot skip ahead", () => {
  const nodes = nodesForClass("Wanderer");
  assert.equal(nodes.length, 9);
  const cap = nodes.find((node) => node.id === "wnd-downbeat");
  const press = nodes.find((node) => node.id === "wnd-downbeat:press");
  const ink = nodes.find((node) => node.id === "wnd-downbeat:ink");
  assert.ok(cap && press && ink);
  assert.equal(canSpend(cap, ["Wanderer"], [], []), false);
  assert.equal(canSpend(press, ["Wanderer"], [], []), false);
  assert.equal(canSpend(ink, ["Wanderer"], [], []), true);
  assert.equal(canSpend(press, ["Wanderer"], [ink.id], []), true);
  assert.equal(canSpend(cap, ["Wanderer"], [ink.id, press.id], []), true);
  assert.equal(purchasable(["Wanderer"], [], ["wnd-downbeat"]).some((node) => node.id === "wnd-downbeat"), false);
  const worn = treeEffects("Wanderer", [ink.id, press.id]);
  assert.equal(worn.bonus.str, 1);
  assert.equal(worn.echoes, 1);
  assert.equal(treeEffects("Berserker", [ink.id]).bonus.str, 0);
  assert.deepEqual(withoutPending([ink.id, press.id, cap.id, "bank"], ink.id), ["bank"]);
});
