import { beginTarget } from "./questBoard";

export async function beginQuest(userId: string, questId: string): Promise<{ mode: "link"; url: string }> {
  const target = await beginTarget(userId, questId);
  return { mode: "link", url: target.url };
}
