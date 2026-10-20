import { Router, type Response } from "express";
import { GameError, ReconnectRequired } from "../errors";
import { allocatePoint, allocatePoints, castSkillOnFight, learnSkills, resetStats, setEquipped, switchClass } from "../services/actions";
import { sellRelic, upgradeRelics } from "../services/shop";
import { loadCodex } from "../services/codexRead";
import { syncListener } from "../services/gameSync";
import { createParty, joinParty, leaveParty, loadFeed, loadParty } from "../services/party";
import { beginQuest } from "../services/playback";
import { listQuests, rerollQuest } from "../services/questBoard";
import { isRecord } from "../../src/lib/isRecord";

export const gameRouter = Router();

gameRouter.post("/sync", (req, res, next) => {
  void act(req, res, next, async (userId) => syncListener(userId));
});

gameRouter.get("/codex", (req, res, next) => {
  void act(req, res, next, async (userId) => loadCodex(userId));
});

gameRouter.get("/quests", (req, res, next) => {
  void act(req, res, next, async (userId) => ({ quests: await listQuests(userId) }));
});

gameRouter.post("/quests/:id/begin", (req, res, next) => {
  void act(req, res, next, async (userId) => beginQuest(userId, req.params.id));
});

gameRouter.post("/quests/:id/reroll", (req, res, next) => {
  void act(req, res, next, async (userId) => {
    await rerollQuest(userId, req.params.id);
    return { ok: true };
  });
});

gameRouter.get("/party", (req, res, next) => {
  void act(req, res, next, async (userId) => ({ party: await loadParty(userId), feed: await loadFeed(userId) }));
});

gameRouter.post("/party", (req, res, next) => {
  void act(req, res, next, async (userId) => createParty(userId, text(req.body, "name")));
});

gameRouter.post("/party/join", (req, res, next) => {
  void act(req, res, next, async (userId) => {
    await joinParty(userId, text(req.body, "code"));
    return { ok: true };
  });
});

gameRouter.post("/party/leave", (req, res, next) => {
  void act(req, res, next, async (userId) => {
    await leaveParty(userId);
    return { ok: true };
  });
});

gameRouter.post("/character/allocate", (req, res, next) => {
  void act(req, res, next, async (userId) => {
    const grants = statGrants(req.body);
    if (grants) await allocatePoints(userId, grants);
    else await allocatePoint(userId, text(req.body, "stat"));
    return { ok: true };
  });
});

gameRouter.post("/character/skill", (req, res, next) => {
  void act(req, res, next, async (userId) => {
    const ids = skillIdList(req.body);
    await learnSkills(userId, ids ?? [text(req.body, "skillId")]);
    return { ok: true };
  });
});

gameRouter.post("/battle/skill", (req, res, next) => {
  void act(req, res, next, async (userId) => castSkillOnFight(userId, text(req.body, "skillId")));
});

gameRouter.post("/character/reset", (req, res, next) => {
  void act(req, res, next, async (userId) => {
    await resetStats(userId);
    return { ok: true };
  });
});

gameRouter.post("/character/class", (req, res, next) => {
  void act(req, res, next, async (userId) => {
    await switchClass(userId, text(req.body, "classId"));
    return { ok: true };
  });
});

gameRouter.post("/relics/:id/equip", (req, res, next) => {
  void act(req, res, next, async (userId) => {
    await setEquipped(userId, req.params.id, true);
    return { ok: true };
  });
});

gameRouter.post("/relics/:id/unequip", (req, res, next) => {
  void act(req, res, next, async (userId) => {
    await setEquipped(userId, req.params.id, false);
    return { ok: true };
  });
});

gameRouter.post("/shop/sell", (req, res, next) => {
  void act(req, res, next, async (userId) => sellRelic(userId, text(req.body, "relicId")));
});

gameRouter.post("/shop/upgrade", (req, res, next) => {
  void act(req, res, next, async (userId) => upgradeRelics(userId, idList(req.body)));
});

function act(
  req: import("express").Request,
  res: Response,
  next: import("express").NextFunction,
  run: (userId: string) => Promise<unknown>,
): void {
  void (async () => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    res.json(await run(userId));
  })().catch((error: unknown) => {
    if (error instanceof GameError) {
      res.status(error.status).json({ error: error.code });
      return;
    }
    if (error instanceof ReconnectRequired) {
      res.status(401).json({ error: "reconnect_required" });
      return;
    }
    next(error);
  });
}

function text(body: unknown, key: string): string {
  if (!isRecord(body) || typeof body[key] !== "string") return "";
  return body[key];
}

const STAT_NAMES = ["str", "agi", "int", "wis", "cha"] as const;

function statGrants(body: unknown): Partial<Record<(typeof STAT_NAMES)[number], number>> | null {
  if (!isRecord(body) || !isRecord(body.stats)) return null;
  const grants: Partial<Record<(typeof STAT_NAMES)[number], number>> = {};
  for (const stat of STAT_NAMES) {
    const value = body.stats[stat];
    if (value === undefined) continue;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) {
      throw new GameError(400, "unknown_stat");
    }
    if (value > 0) grants[stat] = value;
  }
  return grants;
}

function skillIdList(body: unknown): string[] | null {
  if (!isRecord(body) || !Array.isArray(body.skillIds)) return null;
  return body.skillIds.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function idList(body: unknown): string[] {
  if (!isRecord(body) || !Array.isArray(body.relicIds)) return [];
  return body.relicIds.filter((id): id is string => typeof id === "string" && id.length > 0);
}
