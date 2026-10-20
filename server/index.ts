import "./types";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./env";
import { requireAuth } from "./middleware/requireAuth";
import { apiRouter } from "./routes/character";
import { cronRouter } from "./routes/cron";
import { authRouter } from "./routes/auth";
import { gameRouter } from "./routes/game";
import { lastfmRouter } from "./routes/lastfm";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);

app.use("/api/cron", cronRouter);
app.use("/api/lastfm", requireAuth, lastfmRouter);
app.use("/api", requireAuth, gameRouter);
app.use("/api", requireAuth, apiRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[earlobe]", error instanceof Error ? error.message : "unknown");
  if (res.headersSent) return;
  res.status(500).json({ error: "server_error" });
});

app.listen(env.port, () => {
  console.log(`[earlobe] api listening on ${env.port}`);
});
