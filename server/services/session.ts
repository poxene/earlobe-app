import { createHmac, timingSafeEqual } from "node:crypto";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function sealSession(userId: string, secret: string, now = Date.now()): string {
  const exp = now + THIRTY_DAYS_MS;
  const body = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function openSession(token: string, secret: string, now = Date.now()): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  if (!userId || !expStr || !sig) return null;
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^\d+$/.test(expStr)) return null;
  const exp = Number(expStr);
  if (exp < now) return null;
  const expected = createHmac("sha256", secret).update(`${userId}.${expStr}`).digest("base64url");
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) return null;
  return userId;
}

export function statesMatch(expected: string | undefined, received: string | undefined): boolean {
  if (!expected || !received) return false;
  const actualBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
  if (actualBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(actualBuf, receivedBuf);
}
