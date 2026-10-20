import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { decryptSecret, encryptSecret } from "./crypto";

test("encrypts and decrypts a refresh token", () => {
  const key = randomBytes(32);
  const sealed = encryptSecret("refresh-token", key);
  assert.notEqual(sealed, "refresh-token");
  assert.equal(decryptSecret(sealed, key), "refresh-token");
});

test("rejects a tampered payload", () => {
  const key = randomBytes(32);
  const sealed = encryptSecret("refresh-token", key);
  const packed = Buffer.from(sealed, "base64url");
  const last = packed.length - 1;
  const byte = packed[last] ?? 0;
  packed[last] = byte ^ 1;
  assert.throws(() => decryptSecret(packed.toString("base64url"), key));
});
