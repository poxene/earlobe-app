import type { NextFunction, Request, Response } from "express";
import { env } from "../env";
import { SESSION_COOKIE, readCookie } from "../services/cookies";
import { openSession } from "../services/session";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = readCookie(req.header("cookie"), SESSION_COOKIE);
  const userId = token ? openSession(token, env.sessionSecret) : null;
  if (!userId) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  req.userId = userId;
  next();
}
