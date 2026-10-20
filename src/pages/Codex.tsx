import { useQuery } from "@tanstack/react-query";
import { Frame } from "@/components/Frame";
import { MonsterFigure } from "@/components/monsters/MonsterFigure";
import { apiGet } from "@/lib/api";
import { varietiesFor } from "@/lib/game/varieties";
import { isRecord } from "@/lib/isRecord";
import { useState } from "react";

type Codex = {
  artists: { id: string; name: string; imageUrl: string | null; genres: string[]; listens: number }[];
  albums: {
    id: string;
    name: string;
    artistName: string;
    imageUrl: string | null;
    color: string;
    tracksPlayed: number;
    tracksTotal: number;
    attuned: boolean;
  }[];
  genres: { family: string; className: string; color: string; hours: number; target: number; hidden: boolean }[];
  bestiary: {
    monster: string;
    family: string;
    color: string;
    encountered: number;
    defeated: number;
    escaped: number;
    bestGrade: string | null;
    seen: boolean;
    seenVarietyIds: string[];
  }[];
};

const TABS = ["Artists", "Albums", "Genres", "Bestiary"] as const;

export function CodexPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Artists");
  const query = useQuery({
    queryKey: ["codex"],
    queryFn: async () => {
      const body = await apiGet("/api/codex");
      if (!isCodex(body)) throw new Error("unexpected codex");
      return body;
    },
  });

  return (
    <Frame>
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        <p className="text-[11px] tracking-[0.35em] text-zinc-500">CODEX</p>
        <h1 className="mt-1 font-display text-6xl tracking-wide">Codex</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={name === tab ? "bg-gold px-3 py-1 text-sm text-ink" : "border border-white/15 px-3 py-1 text-sm text-zinc-300"}
            >
              {name}
            </button>
          ))}
        </div>
        {query.isPending ? <p className="mt-6 text-zinc-400">Loading.</p> : null}
        {query.isError ? <p className="mt-6 text-zinc-400">Couldn't load the codex.</p> : null}
        {query.data && tab === "Artists" ? <Artists rows={query.data.artists} /> : null}
        {query.data && tab === "Albums" ? <Albums rows={query.data.albums} /> : null}
        {query.data && tab === "Genres" ? <Genres rows={query.data.genres} /> : null}
        {query.data && tab === "Bestiary" ? <Bestiary rows={query.data.bestiary} /> : null}
      </main>
    </Frame>
  );
}

function Artists({ rows }: { rows: Codex["artists"] }) {
  if (rows.length === 0) return <Empty>No artists yet. A listen adds them.</Empty>;
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <li key={row.id} className="flex gap-3 border border-white/10 bg-panel/90 p-3">
          {row.imageUrl ? <img src={row.imageUrl} alt="" className="h-14 w-14 object-cover" /> : <div className="h-14 w-14 bg-white/5" />}
          <div>
            <p className="text-zinc-100">{row.name}</p>
            <p className="text-xs text-zinc-500">{row.listens} listens · {row.genres.slice(0, 2).join(", ") || "unmapped"}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Albums({ rows }: { rows: Codex["albums"] }) {
  if (rows.length === 0) return <Empty>No albums yet.</Empty>;
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <li key={row.id} className="flex gap-3 border border-white/10 bg-panel/90 p-3">
          {row.imageUrl ? <img src={row.imageUrl} alt="" className="h-14 w-14 object-cover" /> : <div className="h-14 w-14" style={{ background: row.color }} />}
          <div className="min-w-0">
            <p className="truncate text-zinc-100">{row.name}</p>
            <p className="truncate text-xs text-zinc-500">{row.artistName}</p>
            <p className="text-xs" style={{ color: row.color }}>
              {row.tracksPlayed}/{row.tracksTotal || "?"} {row.attuned ? "· Complete" : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Genres({ rows }: { rows: Codex["genres"] }) {
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <li key={row.family} className="border border-white/10 bg-panel/90 p-4">
          {row.hidden ? (
            <p className="font-display text-4xl text-zinc-600">?</p>
          ) : (
            <>
              <p style={{ color: row.color }}>{row.className}</p>
              <p className="text-sm text-zinc-400">{row.family}</p>
              <div className="mt-3 h-1.5 bg-white/10">
                <div className="h-full" style={{ width: `${Math.min(100, (row.hours / row.target) * 100)}%`, background: row.color }} />
              </div>
              <p className="mt-1 text-xs text-zinc-500">{row.hours.toFixed(1)} / {row.target} hours</p>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function Bestiary({ rows }: { rows: Codex["bestiary"] }) {
  return (
    <ul className="mt-6 grid gap-3">
      {rows.map((row) => {
        const varieties = varietiesFor(row.family);
        const seen = new Set(row.seenVarietyIds ?? []);
        return (
          <li key={row.monster} className="border border-white/10 bg-panel/90 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm tracking-[0.16em]" style={{ color: row.seen ? row.color : "#64748b" }}>
                {row.seen ? row.monster.toUpperCase() : "UNKNOWN"}
              </p>
              {row.seen ? (
                <p className="text-xs text-zinc-500">
                  {row.defeated} defeated · {row.escaped} escaped
                  {row.bestGrade ? ` · ${row.bestGrade}` : ""}
                </p>
              ) : null}
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {varieties.map((variety) => {
                const known = seen.has(variety.id);
                return (
                  <li key={variety.id} className={known ? "" : "opacity-30"}>
                    <div className="mx-auto h-28 w-full max-w-[7rem]">
                      <MonsterFigure
                        recipe={variety.recipe}
                        color={known ? row.color : "#64748b"}
                        title={known ? variety.name : "Not seen"}
                      />
                    </div>
                    <p className="mt-1 text-center text-xs text-zinc-300">{known ? variety.name : "?"}</p>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="mt-6 border border-white/10 bg-panel/80 px-4 py-4 text-sm text-zinc-400">{children}</p>;
}

function isCodex(value: unknown): value is Codex {
  return isRecord(value) && Array.isArray(value.artists) && Array.isArray(value.albums) && Array.isArray(value.genres) && Array.isArray(value.bestiary);
}
