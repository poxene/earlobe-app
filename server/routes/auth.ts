import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { Router } from "express";
import { env } from "../env";
import {
  SESSION_COOKIE,
  STATE_COOKIE,
  clearCookie,
  readCookie,
  serializeCookie,
} from "../services/cookies";
import { exchangeSession, fetchLastfmProfile } from "../services/lastfmClient";
import { saveSession } from "../services/lastfmSession";
import { upsertProfile } from "../services/profiles";
import { sealSession } from "../services/session";

const TEN_MINUTES = 10 * 60;
const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const authRouter = Router();

authRouter.get("/lastfm", beginLastfmLogin);
authRouter.get("/lastfm/callback", (req, res, next) => {
  void finishLastfmLogin(req, res).catch(next);
});
authRouter.post("/logout", logout);

export function beginLastfmLogin(_req: Request, res: Response): void {
  const state = randomBytes(16).toString("base64url");
  const url = new URL("https://www.last.fm/api/auth/");
  url.searchParams.set("api_key", env.lastfmApiKey);
  url.searchParams.set("cb", env.lastfmCallbackUrl);
  res.append("Set-Cookie", stateCookie(state));
  res.redirect(url.toString());
}

export async function finishLastfmLogin(req: Request, res: Response): Promise<void> {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;
  const expected = readCookie(req.header("cookie"), STATE_COOKIE);
  res.append("Set-Cookie", clearCookie(STATE_COOKIE, secureCookie()));

  if (!expected) {
    res.redirect(loginErrorRedirect("state"));
    return;
  }
  if (!token) {
    res.redirect(loginErrorRedirect("access_denied"));
    return;
  }

  try {
    const session = await exchangeSession(token);
    const profile = await fetchLastfmProfile(session.username);
    const userId = await upsertProfile(profile);
    await saveSession(userId, session);
    res.append("Set-Cookie", sessionCookie(userId));
    res.redirect(`${env.frontendOrigin}/`);
  } catch (error) {
    console.error("[earlobe] last.fm login failed", error instanceof Error ? error.message : "unknown");
    res.redirect(loginErrorRedirect("oauth"));
  }
}

function logout(_req: Request, res: Response): void {
  res.append("Set-Cookie", clearCookie(SESSION_COOKIE, secureCookie()));
  res.json({ ok: true });
}

function secureCookie(): boolean {
  return env.nodeEnv === "production";
}

function stateCookie(state: string): string {
  return serializeCookie(STATE_COOKIE, state, { maxAgeSec: TEN_MINUTES, secure: secureCookie() });
}

function sessionCookie(userId: string): string {
  return serializeCookie(SESSION_COOKIE, sealSession(userId, env.sessionSecret), {
    maxAgeSec: THIRTY_DAYS,
    secure: secureCookie(),
  });
}

function loginErrorRedirect(code: string): string {
  const safe = code === "access_denied" || code === "state" ? code : "oauth";
  return `${env.frontendOrigin}/?error=${safe}`;
}
