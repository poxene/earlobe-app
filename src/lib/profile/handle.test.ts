import assert from "node:assert/strict";
import test from "node:test";
import { handleProblem, parseHandle, profilePath, slugifyHandle } from "./handle";

test("a display name is a lowercase url handle", () => {
  assert.equal(parseHandle("Taylor"), "taylor");
  assert.equal(parseHandle("  laura_2 "), "laura_2");
  assert.equal(profilePath("taylor"), "/c/taylor");
});

test("short, reserved, and messy names are refused", () => {
  assert.equal(parseHandle("a"), null);
  assert.equal(handleProblem("party"), "reserved");
  assert.equal(handleProblem("no spaces"), "invalid");
  assert.equal(slugifyHandle("Taylor Smith"), "taylor-smith");
  assert.equal(slugifyHandle("Admin"), null);
});
