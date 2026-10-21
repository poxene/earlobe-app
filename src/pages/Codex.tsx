import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Frame } from "@/components/Frame";
import { MonsterFigure } from "@/components/monsters/MonsterFigure";
import { apiGet } from "@/lib/api";
import { classForFamily } from "@/lib/game/classes";
import { varietiesFor } from "@/lib/game/varieties";
import { isRecord } from "@/lib/isRecord";
import { familiesForArtist, GENRE_FAMILIES, type GenreFamily } from "@/lib/music/normalize";

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
  genres: { family: string | null; className: string | null; color: string | null; hours: number; target: number; hidden: boolean }[];
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

const ARTIST_ROWS = 5;

function Artists({ rows }: { rows: Codex["artists"] }) {
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [columns, setColumns] = useState(2);
  const grid = useRef<HTMLUListElement>(null);
  const sorted = useMemo(() => {
    return rows
      .map((row) => ({ ...row, family: familiesForArtist(row.genres)[0] ?? "Unmapped" }))
      .sort((a, b) => GENRE_FAMILIES.indexOf(a.family) - GENRE_FAMILIES.indexOf(b.family) || a.name.localeCompare(b.name));
  }, [rows]);

  useEffect(() => {
    const node = grid.current;
    if (!node) return;
    const measure = () => {
      const count = getComputedStyle(node).gridTemplateColumns.split(" ").filter(Boolean).length;
      setColumns(Math.max(1, count));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [sorted.length]);

  const pageSize = columns * ARTIST_ROWS;
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = showAll ? sorted : sorted.slice(current * pageSize, current * pageSize + pageSize);

  useEffect(() => {
    setPage((value) => Math.min(value, pages - 1));
  }, [pages]);

  if (rows.length === 0) return <Empty>No artists yet. A listen adds them.</Empty>;

  return (
    <div className="mt-6">
      <ul ref={grid} className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((row) => (
          <ArtistCard key={row.id} row={row} />
        ))}
      </ul>
      {sorted.length > pageSize ? (
        <ArtistPager
          page={current}
          pages={pages}
          from={showAll ? 1 : current * pageSize + 1}
          to={showAll ? sorted.length : current * pageSize + visible.length}
          total={sorted.length}
          showAll={showAll}
          onPage={setPage}
          onToggle={() => {
            setShowAll((value) => !value);
            setPage(0);
          }}
        />
      ) : null}
    </div>
  );
}

function ArtistCard({ row }: { row: Codex["artists"][number] & { family: GenreFamily } }) {
  const color = classForFamily(row.family).color;
  return (
    <li className="flex min-w-0 items-center gap-2 border border-white/10 border-l-2 bg-panel/90 px-2 py-1.5" style={{ borderLeftColor: color }}>
      {row.imageUrl ? (
        <img src={row.imageUrl} alt="" className="h-8 w-8 shrink-0 object-cover" />
      ) : (
        <div className="h-8 w-8 shrink-0 bg-white/5" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm text-zinc-100">{row.name}</p>
        <p className="truncate text-[11px] text-zinc-500">
          {row.family} · {row.listens}
        </p>
      </div>
    </li>
  );
}

function ArtistPager({
  page,
  pages,
  from,
  to,
  total,
  showAll,
  onPage,
  onToggle,
}: {
  page: number;
  pages: number;
  from: number;
  to: number;
  total: number;
  showAll: boolean;
  onPage: (page: number) => void;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-zinc-500">
        {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {showAll ? null : (
          <>
            <PagerButton disabled={page === 0} onClick={() => onPage(page - 1)}>
              Prev
            </PagerButton>
            {pageWindow(page, pages).map((entry, index) =>
              entry === "gap" ? (
                <span key={`gap-${index}`} className="px-1 text-xs text-zinc-600">
                  …
                </span>
              ) : (
                <PagerButton key={entry} current={entry === page} onClick={() => onPage(entry)}>
                  {entry + 1}
                </PagerButton>
              ),
            )}
            <PagerButton disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
              Next
            </PagerButton>
          </>
        )}
        <button type="button" onClick={onToggle} className="ml-1 border border-white/15 px-2 py-1 text-xs text-zinc-300 hover:text-zinc-100">
          {showAll ? "Show pages" : "Show all"}
        </button>
      </div>
    </div>
  );
}

function PagerButton({
  children,
  onClick,
  disabled,
  current,
}: {
  children: number | string;
  onClick: () => void;
  disabled?: boolean;
  current?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-w-7 border px-2 py-1 text-xs disabled:opacity-40 ${current ? "border-gold bg-gold text-ink" : "border-white/15 text-zinc-300 hover:text-zinc-100"}`}
    >
      {children}
    </button>
  );
}

function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index);
  const wanted = [0, total - 1, current - 1, current, current + 1].filter((page) => page >= 0 && page < total);
  const unique = [...new Set(wanted)].sort((a, b) => a - b);
  const window: (number | "gap")[] = [];
  for (const page of unique) {
    const previous = window[window.length - 1];
    if (typeof previous === "number" && page - previous > 1) window.push("gap");
    window.push(page);
  }
  return window;
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

const GENRE_REVEAL_HOURS = 1;

function Genres({ rows }: { rows: Codex["genres"] }) {
  return (
    <div className="mt-6">
      <p className="max-w-xl text-sm text-zinc-400">
        Classes are unlocked by listening to their respective genres. After an hour, the genre and its color show the way to five.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map((row, index) => (
          <li key={row.className ?? `locked-${index}`} className="border border-white/10 bg-panel/90 p-4">
            {row.hidden || !row.className || !row.color ? (
              row.hours >= GENRE_REVEAL_HOURS ? (
                <>
                  <p className="text-sm text-zinc-500">Locked</p>
                  {row.family ? <p style={{ color: row.color ?? undefined }}>{row.family}</p> : null}
                  <div className="mt-3 h-1.5 bg-white/10">
                    <div
                      className="h-full"
                      style={{ width: `${Math.min(100, (row.hours / row.target) * 100)}%`, background: row.color ?? "#71717a" }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {row.hours.toFixed(1)} / {row.target} hours
                  </p>
                </>
              ) : (
                <p className="font-display text-4xl text-zinc-600">?</p>
              )
            ) : (
              <>
                <p style={{ color: row.color }}>{row.className}</p>
                <p className="text-sm text-zinc-400">{row.family}</p>
                <div className="mt-3 h-1.5 bg-white/10">
                  <div className="h-full" style={{ width: `${Math.min(100, (row.hours / row.target) * 100)}%`, background: row.color }} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {row.hours.toFixed(1)} / {row.target} hours
                </p>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
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
