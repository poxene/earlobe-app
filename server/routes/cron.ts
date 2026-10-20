import { Router } from "express";
import { env } from "../env";
import { syncAllListeners } from "../services/gameSync";

export const cronRouter = Router();

//— supabase pg_cron calls this every 15 minutes once the api is reachable from the database
cronRouter.post("/sync", (req, res, next) => {
  const secret = req.header("x-cron-secret") ?? "";
  if (!env.cronSecret || secret !== env.cronSecret) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  void syncAllListeners()
    .then((listeners) => {
      res.json({ ok: true, listeners });
    })
    .catch(next);
});
