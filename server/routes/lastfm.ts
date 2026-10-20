import { Router } from "express";
import { ReconnectRequired } from "../errors";
import { currentTrack, topArtistsRaw } from "../services/listening";

export const lastfmRouter = Router();

lastfmRouter.get("/now-playing", (req, res, next) => {
  void (async () => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    res.json(await currentTrack(userId));
  })().catch((error: unknown) => {
    if (sendLastfmFailure(res, error)) return;
    next(error);
  });
});

lastfmRouter.get("/top-artists", (req, res, next) => {
  void (async () => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    res.json(await topArtistsRaw(userId, clampLimit(req.query.limit)));
  })().catch((error: unknown) => {
    if (sendLastfmFailure(res, error)) return;
    next(error);
  });
});

function clampLimit(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : 50;
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(50, Math.max(1, Math.floor(parsed)));
}

function sendLastfmFailure(res: import("express").Response, error: unknown): boolean {
  if (error instanceof ReconnectRequired) {
    res.status(401).json({ error: "reconnect_required" });
    return true;
  }
  if (error instanceof Error && error.name === "TimeoutError") {
    res.status(504).json({ error: "lastfm_timeout" });
    return true;
  }
  if (error instanceof Error) {
    console.error("[earlobe]", error.message);
    res.status(502).json({ error: "lastfm_unavailable" });
    return true;
  }
  return false;
}
