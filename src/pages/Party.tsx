import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGameSync } from "@/hooks/useGameSync";
import { Frame } from "@/components/Frame";
import { apiGet, apiSend } from "@/lib/api";
import { classById } from "@/lib/game/classes";
import { isRecord } from "@/lib/isRecord";

type Member = {
  userId: string;
  name: string;
  className: string;
  level: number;
  trackName: string | null;
  artistName: string | null;
  silent: boolean;
};

type Party = { id: string; name: string; inviteCode: string; members: Member[] };
type FeedItem = { id: string; text: string };

export function PartyPage() {
  const queryClient = useQueryClient();
  useGameSync();
  const [name, setName] = useState("Party");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const query = useQuery({
    queryKey: ["party"],
    queryFn: async () => {
      const body = await apiGet("/api/party");
      if (!isRecord(body)) throw new Error("unexpected party");
      return {
        party: isParty(body.party) ? body.party : null,
        feed: Array.isArray(body.feed) ? body.feed.filter(isFeed) : [],
      };
    },
    refetchInterval: 30_000,
  });

  async function create() {
    const body = await apiSend("/api/party", "POST", { name });
    if (isRecord(body) && typeof body.inviteCode === "string") setNote(`Invite code ${body.inviteCode}`);
    await queryClient.invalidateQueries({ queryKey: ["party"] });
  }

  async function join() {
    try {
      await apiSend("/api/party/join", "POST", { code });
      setNote("You're in.");
      await queryClient.invalidateQueries({ queryKey: ["party"] });
    } catch {
      setNote("That invite code doesn't match a party.");
    }
  }

  async function leave() {
    await apiSend("/api/party/leave", "POST");
    await queryClient.invalidateQueries({ queryKey: ["party"] });
  }

  const party = query.data?.party ?? null;

  return (
    <Frame>
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        <p className="text-[11px] tracking-[0.35em] text-zinc-500">PARTY</p>
        <h1 className="mt-1 font-display text-6xl tracking-wide">{party?.name ?? "Party"}</h1>
        {note ? <p className="mt-3 text-sm text-gold">{note}</p> : null}
        {query.isPending ? <p className="mt-6 text-zinc-400">Loading party.</p> : null}
        {party ? (
          <>
            <p className="mt-4 text-sm tracking-[0.2em] text-gold">CODE {party.inviteCode}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {party.members.map((member) => {
                const color = classById(member.className)?.color ?? "#64748b";
                return (
                  <li key={member.userId} className="border border-white/10 bg-panel/90 p-4">
                    <p className="font-display text-3xl tracking-wide">{member.name}</p>
                    <p className="text-sm" style={{ color }}>
                      {member.className} · L{String(member.level).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      {member.silent ? "Silent" : `${member.trackName}${member.artistName ? ` — ${member.artistName}` : ""}`}
                    </p>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={() => void leave()} className="mt-6 text-sm text-zinc-400 hover:text-zinc-100">
              Leave party
            </button>
            <h2 className="mt-10 text-[11px] tracking-[0.28em] text-zinc-500">FEED</h2>
            {(query.data?.feed.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No recent activity.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {query.data?.feed.map((item) => (
                  <li key={item.id} className="border border-white/10 px-3 py-2 text-sm text-zinc-300">
                    {item.text}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : query.isSuccess ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <form
              className="border border-white/10 bg-panel/90 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void create();
              }}
            >
              <h2 className="text-sm tracking-[0.18em] text-zinc-400">CREATE A PARTY</h2>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-3 w-full border border-white/15 bg-ink px-3 py-2 text-zinc-100"
                maxLength={40}
              />
              <button type="submit" className="mt-3 bg-gold px-4 py-2 text-sm font-semibold text-ink">
                Create
              </button>
            </form>
            <form
              className="border border-white/10 bg-panel/90 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void join();
              }}
            >
              <h2 className="text-sm tracking-[0.18em] text-zinc-400">JOIN WITH A CODE</h2>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                className="mt-3 w-full border border-white/15 bg-ink px-3 py-2 uppercase tracking-[0.2em] text-zinc-100"
                maxLength={6}
              />
              <button type="submit" className="mt-3 bg-gold px-4 py-2 text-sm font-semibold text-ink">
                Join
              </button>
            </form>
          </div>
        ) : null}
      </main>
    </Frame>
  );
}

function isParty(value: unknown): value is Party {
  return isRecord(value) && typeof value.name === "string" && typeof value.inviteCode === "string" && Array.isArray(value.members);
}

function isFeed(value: unknown): value is FeedItem {
  return isRecord(value) && typeof value.id === "string" && typeof value.text === "string";
}
