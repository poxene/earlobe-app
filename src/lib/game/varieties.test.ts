import assert from "node:assert/strict";
import { test } from "node:test";
import { varietiesFor, varietyFor } from "./varieties";

test("each genre has three stable varieties", () => {
  const metal = varietiesFor("Metal");
  assert.equal(metal.length, 3);
  assert.equal(varietyFor("Metal", "track-9").id, varietyFor("Metal", "track-9").id);
  const seen = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((seed) => varietyFor("Rock", seed).id));
  assert.ok(seen.size > 1);
  assert.equal(varietyFor("nope", "x").canon, "Mimic");
});
