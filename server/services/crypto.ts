import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

//— tokens are sealed before they touch postgres. losing the key means a reconnect, not a leak.

const ALGORITHM = "aes-256-gcm";

export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

export function decryptSecret(payload: string, key: Buffer): string {
  const packed = Buffer.from(payload, "base64url");
  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const ciphertext = packed.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
