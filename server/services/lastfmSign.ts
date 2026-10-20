import { createHash } from "node:crypto";

//— format and callback are not part of the signature. every other param is, in alpha order.
export function lastfmSignature(params: Record<string, string>, secret: string): string {
  const keys = Object.keys(params)
    .filter((key) => key !== "format" && key !== "callback")
    .sort();
  const raw = keys.map((key) => `${key}${params[key] ?? ""}`).join("") + secret;
  return createHash("md5").update(raw, "utf8").digest("hex");
}
