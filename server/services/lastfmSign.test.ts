import assert from "node:assert/strict";
import { test } from "node:test";
import { lastfmSignature } from "./lastfmSign";

test("signs params in alpha order and ignores format", () => {
  const signature = lastfmSignature(
    { token: "tok", method: "auth.getSession", api_key: "key", format: "json" },
    "secret",
  );
  assert.equal(signature, "04e870be4bb79756721b7bc1937fe83d");
});
