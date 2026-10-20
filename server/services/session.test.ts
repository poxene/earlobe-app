import assert from "node:assert/strict";
import { test } from "node:test";
import { openSession, sealSession, statesMatch } from "./session";

const SECRET = "test-secret";
const USER = "11111111-1111-4111-8111-111111111111";

test("opens a session it just sealed", () => {
  const now = 1_700_000_000_000;
  const token = sealSession(USER, SECRET, now);
  assert.equal(openSession(token, SECRET, now + 1000), USER);
});

test("rejects a tampered session and an expired one", () => {
  const now = 1_700_000_000_000;
  const token = sealSession(USER, SECRET, now);
  assert.equal(openSession(`${token}x`, SECRET, now), null);
  assert.equal(openSession(token, SECRET, now + 31 * 24 * 60 * 60 * 1000), null);
});

test("compares oauth state in constant time", () => {
  assert.equal(statesMatch("abc", "abc"), true);
  assert.equal(statesMatch("abc", "abd"), false);
  assert.equal(statesMatch(undefined, "abc"), false);
});
