import assert from "node:assert/strict";
import { test } from "node:test";
import { familyFromGenreTag } from "./normalize";

test("maps messy tags without letting rock swallow baroque", () => {
  assert.equal(familyFromGenreTag("black metal"), "Metal");
  assert.equal(familyFromGenreTag("baroque"), "Classical");
  assert.equal(familyFromGenreTag("punk rock"), "Rock");
  assert.equal(familyFromGenreTag("post-punk"), "Punk");
  assert.equal(familyFromGenreTag("indie rock"), "Rock");
  assert.equal(familyFromGenreTag("escape room"), "Unmapped");
  assert.equal(familyFromGenreTag("drum and bass"), "Electronic");
  assert.equal(familyFromGenreTag("k-pop"), "Pop");
  assert.equal(familyFromGenreTag("singer-songwriter"), "Folk / Country");
  assert.equal(familyFromGenreTag("lo-fi"), "Ambient / Lo-fi");
  assert.equal(familyFromGenreTag("bebop"), "Jazz");
  assert.equal(familyFromGenreTag("alternative metal"), "Metal");
  assert.equal(familyFromGenreTag("alternative dance"), "Electronic");
  assert.equal(familyFromGenreTag("indietronica"), "Electronic");
  assert.equal(familyFromGenreTag("australian electropop"), "Electronic");
  assert.equal(familyFromGenreTag("dance pop"), "Pop");
  assert.equal(familyFromGenreTag("melodic house"), "Electronic");
});
