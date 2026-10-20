import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGameSync } from "@/hooks/useGameSync";
import { Frame } from "@/components/Frame";
import { apiGet, apiSend } from "@/lib/api";
import { isRecord } from "@/lib/isRecord";

type Quest = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  current: number;
  target: number;
  completedAt: string | null;
  objective: { type: string };
};

export function QuestsPage() {
  const queryClient = useQueryClient();
  const sync = useGameSync();
  const [note, setNote] = useState("");
  const query = useQuery({
    queryKey: ["quests", sync.dataUpdatedAt],
    enabled: sync.isSuccess,
    queryFn: async () => {
      const body = await apiGet("/api/quests");
      if (!isRecord(body) || !Array.isArray(body.quests)) throw new Error("unexpected quests");
      return body.quests.filter(isQuest);
    },
  });

  async function begin(quest: Quest) {
    const body = await apiSend(`/api/quests/${quest.id}/begin`, "POST");
    if (isRecord(body) && typeof body.url === "string") {
      window.open(body.url, "_blank", "noopener,noreferrer");
      setNote("Opened on Last.fm. A scrobble counts after the track plays.");
      return;
    }
    setNote("Couldn't open that quest.");
  }

  async function reroll(id: string) {
    try {
      await apiSend(`/api/quests/${id}/reroll`, "POST");
      setNote("Quest replaced. 100 echoes spent.");
      await queryClient.invalidateQueries({ queryKey: ["quests"] });
    } catch {
      setNote("Reroll needs 100 echoes, and only once this week.");
    }
  }

  const rows = query.data ?? [];

  return (
    <Frame>
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        <p className="text-[11px] tracking-[0.35em] text-zinc-500">QUESTS</p>
        <h1 className="mt-1 font-display text-6xl tracking-wide">Quests</h1>
        {note ? <p className="mt-4 text-sm text-gold">{note}</p> : null}
        {query.isPending ? <p className="mt-6 text-zinc-400">Loading quests.</p> : null}
        {rows.length === 0 && query.isSuccess ? (
          <p className="mt-6 border border-white/10 bg-panel/80 px-4 py-4 text-sm text-zinc-400">No quests yet.</p>
        ) : null}
        <ul className="mt-6 grid gap-3">
          {rows.map((quest) => {
            const fraction = quest.target > 0 ? quest.current / quest.target : 0;
            return (
              <li key={quest.id} className="border border-white/10 bg-panel/90 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-3xl tracking-wide">{quest.title}</h2>
                    <p className="mt-1 max-w-xl text-sm text-zinc-300">{quest.description}</p>
                  </div>
                  <p className="text-sm text-gold">+{quest.xpReward} XP</p>
                </div>
                <div className="mt-4 h-1.5 bg-white/10">
                  <div className="h-full bg-gold" style={{ width: `${Math.min(1, fraction) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {quest.completedAt ? "Done" : `${quest.current} / ${quest.target}`}
                </p>
                {quest.completedAt ? null : (
                  <div className="mt-4 flex gap-3">
                    <button type="button" onClick={() => void begin(quest)} className="bg-gold px-4 py-2 text-sm font-semibold text-ink">
                      Begin
                    </button>
                    {quest.objective.type !== "discovery" ? (
                      <button type="button" onClick={() => void reroll(quest.id)} className="text-sm text-zinc-400 hover:text-zinc-100">
                        Reroll · 100 echoes
                      </button>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </Frame>
  );
}

function isQuest(value: unknown): value is Quest {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.xpReward === "number" &&
    typeof value.current === "number" &&
    typeof value.target === "number" &&
    isRecord(value.objective)
  );
}
