const HANDLE = /^[a-z0-9][a-z0-9_-]{0,18}[a-z0-9]$/;

const RESERVED = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "battle",
  "c",
  "character",
  "codex",
  "debug",
  "earlobe",
  "earlo",
  "health",
  "login",
  "me",
  "party",
  "preview",
  "quest",
  "quests",
  "shop",
  "static",
  "town",
  "www",
]);

export function handleProblem(raw: string): "ok" | "reserved" | "invalid" {
  const name = raw.trim().toLowerCase();
  if (!HANDLE.test(name)) return "invalid";
  if (RESERVED.has(name)) return "reserved";
  return "ok";
}

export function parseHandle(raw: string): string | null {
  const name = raw.trim().toLowerCase();
  return handleProblem(name) === "ok" ? name : null;
}

export function slugifyHandle(raw: string): string | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 20)
    .replace(/[-_]+$/g, "");
  return parseHandle(cleaned);
}

export function profilePath(name: string): string {
  return `/c/${encodeURIComponent(name)}`;
}
