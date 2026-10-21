import assert from "node:assert/strict";
import { test } from "node:test";
import { achievementsFor, nextScrobbleMark, SCROBBLE_MARKS } from "./achievements";
import type { Rarity } from "./loot";
import { DOLL_SLOTS, slotIndex, type EquipSlot } from "../portrait/gear";

const NAMED = [50, 100, 250, 500, 1_000, 1_500, 2_000, 2_500, 5_000, 7_500, 10_000];

const empty = {
  listens: 0,
  victories: 0,
  highestEcho: 0,
  albumsFinished: 0,
  relics: DOLL_SLOTS.map(() => null),
};

test("scrobble milestones include the named counts and keep climbing", () => {
  for (const count of NAMED) assert.ok(SCROBBLE_MARKS.includes(count));
  assert.ok(SCROBBLE_MARKS.includes(10_000_000));
  const sorted = [...SCROBBLE_MARKS].sort((a, b) => a - b);
  assert.deepEqual(SCROBBLE_MARKS, sorted);
  assert.equal(new Set(SCROBBLE_MARKS).size, SCROBBLE_MARKS.length);
  assert.equal(nextScrobbleMark(1_000), 1_500);
  assert.equal(nextScrobbleMark(SCROBBLE_MARKS.at(-1)!), null);
});

test("scrobbles are one staged card, and the next mark is the current stage", () => {
  const card = achievementsFor({ ...empty, listens: 1_200 }).find((row) => row.id === "scrobbles");
  assert.ok(card);
  assert.equal(card.title, "1,000");
  assert.equal(card.detail, "1,200 / 1,500");
  assert.equal(card.marks.filter((mark) => mark.state === "earned").at(-1)?.label, "1,000");
  assert.equal(card.marks.find((mark) => mark.state === "current")?.label, "1,500");
  assert.equal(card.marks.length, SCROBBLE_MARKS.length);
});

test("legendary gear in every slot earns that stage and points at mythic", () => {
  const relics: ({ id: string; rarity: Rarity; gearSlug: string } | null)[] = DOLL_SLOTS.map(() => null);
  const fill = (slot: EquipSlot, slug: string) => {
    relics[slotIndex(slot)] = { id: slot, rarity: "legendary", gearSlug: slug };
  };
  fill("head", "frayed_cap");
  fill("weapon", "claymore");
  fill("chest", "hide_vest");
  fill("hands", "scrap_wraps");
  fill("belt", "leather_belt");
  fill("tool", "lute");
  fill("ring_1", "brass_ring");
  fill("legs", "patchwork_greaves");
  fill("ring_2", "brass_ring");
  fill("feet", "mud_boots");
  const card = achievementsFor({ ...empty, relics }).find((row) => row.id === "gear");
  assert.ok(card);
  assert.equal(card.title, "Legendary");
  assert.equal(card.detail, "0 / 11 mythic");
  assert.equal(card.marks.find((mark) => mark.state === "current")?.label, "Mythic");
  assert.equal(card.marks.filter((mark) => mark.state === "earned").at(-1)?.label, "Legendary");
});

test("an empty pack is still on the first gear stage", () => {
  const card = achievementsFor(empty).find((row) => row.id === "gear");
  assert.ok(card);
  assert.equal(card.earned, false);
  assert.equal(card.title, "Dressed");
  assert.equal(card.marks[0]?.state, "current");
});
