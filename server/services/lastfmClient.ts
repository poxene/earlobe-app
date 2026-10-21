import { env } from "../env";
import { ReconnectRequired } from "../errors";
import { isRecord } from "../../src/lib/isRecord";
import { lastfmImage } from "../../src/lib/music/mapLastfm";
import { lastfmSignature } from "./lastfmSign";
import { readSession, type LastfmSession } from "./lastfmSession";

const API = "https://ws.audioscrobbler.com/2.0/";
const GAP_MS = 220;

let nextAt = 0;

export async function exchangeSession(token: string): Promise<LastfmSession> {
  const body = await lastfmCall({ method: "auth.getSession", token });
  if (!isRecord(body) || !isRecord(body.session)) throw new Error("unexpected lastfm session");
  const username = body.session.name;
  const key = body.session.key;
  if (typeof username !== "string" || typeof key !== "string") throw new Error("unexpected lastfm session");
  return { username, key };
}

export async function fetchLastfmProfile(username: string): Promise<{
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}> {
  const body = await lastfmCall({ method: "user.getInfo", user: username });
  if (!isRecord(body) || !isRecord(body.user) || typeof body.user.name !== "string") {
    throw new Error("unexpected lastfm profile");
  }
  const realname = typeof body.user.realname === "string" ? body.user.realname.trim() : "";
  return {
    id: body.user.name,
    displayName: realname || body.user.name,
    avatarUrl: lastfmImage(body.user.image),
  };
}

export async function fetchPlaycount(userId: string): Promise<number | null> {
  const body = await callForUser(userId, "user.getInfo");
  if (!isRecord(body) || !isRecord(body.user)) return null;
  const count = Number(body.user.playcount);
  return Number.isFinite(count) && count >= 0 ? Math.round(count) : null;
}

export async function callForUser(userId: string, method: string, params: Record<string, string> = {}): Promise<unknown> {
  const session = await readSession(userId);
  if (!session) throw new ReconnectRequired();
  return lastfmCall({ ...params, method, user: session.username, sk: session.key });
}

export async function lastfmCall(params: Record<string, string>): Promise<unknown> {
  const query: Record<string, string> = { ...params, api_key: env.lastfmApiKey, format: "json" };
  const signed = { ...query };
  delete signed.format;
  query.api_sig = lastfmSignature(signed, env.lastfmSharedSecret);
  await pace();
  const url = new URL(API);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const body: unknown = await response.json().catch(() => null);
  if (isRecord(body) && (typeof body.error === "number" || typeof body.error === "string")) {
    const code = Number(body.error);
    if (code === 9 || code === 14 || code === 15) throw new ReconnectRequired();
    throw new Error(`lastfm_${code}`);
  }
  if (!response.ok || !isRecord(body)) throw new Error(`lastfm_http_${response.status}`);
  return body;
}

async function pace(): Promise<void> {
  const now = Date.now();
  const start = Math.max(now, nextAt);
  nextAt = start + GAP_MS;
  const delay = start - now;
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
}
