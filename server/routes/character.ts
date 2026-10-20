import { Router, type Response } from "express";
import { ReconnectRequired } from "../errors";
import { loadCharacterSheet } from "../services/characterSheet";
import { getProfile } from "../services/profiles";

export const apiRouter = Router();

apiRouter.get("/me", (req, res, next) => {
  void (async () => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    const profile = await getProfile(userId);
    if (!profile) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    res.json({ name: profile.displayName, avatarUrl: profile.avatarUrl ?? "" });
  })().catch(next);
});

apiRouter.get("/character", (req, res, next) => {
  void (async () => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    res.json(await loadCharacterSheet(userId));
  })().catch((error: unknown) => {
    if (sendFailure(res, error)) return;
    next(error);
  });
});

function sendFailure(res: Response, error: unknown): boolean {
  if (error instanceof ReconnectRequired || (error instanceof Error && error.message === "unauthenticated")) {
    res.status(401).json({ error: error instanceof ReconnectRequired ? "reconnect_required" : "unauthenticated" });
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
