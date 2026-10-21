import { Router } from "express";
import { GameError } from "../errors";
import { loadPublicProfile } from "../services/publicProfile";

export const publicRouter = Router();

publicRouter.get("/c/:name", (req, res, next) => {
  const name = req.params.name ?? "";
  void (async () => {
    res.json(await loadPublicProfile(name));
  })().catch((error: unknown) => {
    if (error instanceof GameError) {
      res.status(error.status).json({ error: error.code });
      return;
    }
    next(error);
  });
});
