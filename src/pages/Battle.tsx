import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CombatBars } from "@/components/CombatBars";
import { Frame } from "@/components/Frame";
import { MonsterFigure } from "@/components/monsters/MonsterFigure";
import { useGameSync } from "@/hooks/useGameSync";
import { ApiError, apiSend } from "@/lib/api";
import type { AlbumCover } from "@/lib/game/character";
import type { ActiveFight, BattleRow } from "@/lib/game/snapshot";
import { isRecord } from "@/lib/isRecord";
import { cooldownLeft, skillById } from "@/lib/game/skills";
import { varietyFor } from "@/lib/game/varieties";

export function BattlePage() {
  const sync = useGameSync();
  const fight = sync.data?.fight ?? null;
  const sheet = sync.data?.sheet;
  const variety = fight ? varietyFor(fight.family, fight.trackId) : null;

  return (
    <Frame>
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        <p className="text-[11px] tracking-[0.35em] text-zinc-500">BATTLE</p>
        <h1 className="mt-1 text-balance font-display text-5xl leading-none tracking-wide md:text-6xl">
          {fight?.trackName ?? "No fight"}
        </h1>
        {fight && variety && sheet ? (
          <Stage
            fight={fight}
            varietyName={variety.name}
            canon={variety.canon}
            recipe={variety.recipe}
            listenerName={sheet.displayName}
            className={sheet.className}
            classColor={sheet.classColor}
            albums={sheet.albums}
          />
        ) : (
          <p className="mt-6 border border-white/10 bg-panel/80 px-4 py-8 text-center text-sm text-zinc-400">
            Nothing is playing. Start a track to start a fight.
          </p>
        )}
        {fight && sheet ? <Skills fight={fight} known={sheet.skills} onCast={() => void sync.refetch()} /> : null}
        {fight?.bonusDamage ? (
          <p className="mt-3 text-center text-xs text-zinc-500">{fight.bonusDamage} bonus damage so far.</p>
        ) : null}
        {fight ? <CombatBars fight={fight} /> : null}
        <Log rows={sync.data?.battles ?? []} />
        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link to="/" className="underline decoration-white/20 underline-offset-4 hover:text-zinc-300">
            Back to the sheet
          </Link>
        </p>
      </main>
    </Frame>
  );
}

function Stage({
  fight,
  varietyName,
  canon,
  recipe,
  listenerName,
  className,
  classColor,
  albums,
}: {
  fight: ActiveFight;
  varietyName: string;
  canon: string;
  recipe: ReturnType<typeof varietyFor>["recipe"];
  listenerName: string;
  className: string;
  classColor: string;
  albums: AlbumCover[];
}) {
  const sleeves = Array.from({ length: 4 }, (_, index) => albums[index] ?? null);
  return (
    <section className="relative mt-6 overflow-hidden border border-white/10 bg-panel/90 px-3 py-6 md:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(circle at 70% 40%, ${fight.color}33, transparent 55%)` }}
      />
      <div className="relative">
        <div className="grid grid-cols-2 items-end gap-2">
          <div className={`mx-auto w-full max-w-[11rem] ${fight.isPlaying ? "listener-on" : ""}`}>
            <div
              className="grid aspect-square grid-cols-2 overflow-hidden"
              style={{ boxShadow: `0 0 28px ${classColor}66` }}
            >
              {sleeves.map((album, index) => (
                <div key={album?.id ?? `empty-${index}`} className="bg-ink">
                  {album?.imageUrl ? (
                    <img src={album.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ background: `linear-gradient(145deg, ${classColor}, #0a0a0f)` }} />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 truncate text-center font-display text-3xl tracking-wide">{listenerName}</p>
            <p className="truncate text-center text-xs tracking-[0.16em]" style={{ color: classColor }}>
              {className.toUpperCase()}
            </p>
          </div>
          <div className="mx-auto w-full max-w-[12rem]">
            <div className={`h-56 ${fight.isPlaying ? "creature creature-on" : "creature"}`}>
              <MonsterFigure recipe={recipe} color={fight.color} echo={fight.echoDepth > 0} title={fight.trackName} />
            </div>
            <p className="mt-3 truncate text-center font-display text-3xl tracking-wide">{fight.trackName}</p>
            <p className="truncate text-center text-xs tracking-[0.16em]" style={{ color: fight.color }}>
              {varietyName.toUpperCase()}
              {canon !== varietyName ? <span className="text-zinc-500"> · {canon.toUpperCase()}</span> : null}
              {fight.echoDepth > 0 ? <span className="text-zinc-500"> · ECHO {fight.echoDepth}</span> : null}
            </p>
          </div>
        </div>
        <div className={`strike ${fight.isPlaying ? "strike-on" : ""}`} style={{ ["--strike" as string]: fight.color }} />
      </div>
    </section>
  );
}

function Skills({ fight, known, onCast }: { fight: ActiveFight; known: string[]; onCast: () => void }) {
  const [note, setNote] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [localReady, setLocalReady] = useState<Record<string, number>>({});
  const learned = known.flatMap((id) => {
    const entry = skillById(id);
    return entry ? [entry] : [];
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setLocalReady({});
  }, [fight.trackId]);

  async function cast(id: string) {
    try {
      const body = await apiSend("/api/battle/skill", "POST", { skillId: id });
      const name = isRecord(body) && typeof body.name === "string" ? body.name : "Skill";
      const damage = isRecord(body) && typeof body.damage === "number" ? body.damage : 0;
      const readyAt = isRecord(body) && typeof body.readyAt === "number" ? body.readyAt : 0;
      if (readyAt > 0) setLocalReady((current) => ({ ...current, [id]: readyAt }));
      setNote(`${name} dealt ${damage}.`);
      onCast();
    } catch (error) {
      setNote(
        error instanceof ApiError && error.code === "skill_cooling"
          ? "That skill is on cooldown."
          : "Couldn't use that skill.",
      );
    }
  }

  if (learned.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        No skills yet.{" "}
        <Link to="/" className="text-gold">
          Learn one on the character sheet.
        </Link>
      </p>
    );
  }

  return (
    <section className="mt-4">
      <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">SKILLS</h2>
      <p className="mt-2 text-sm text-zinc-400">Each skill can be used again after 60 seconds.</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-3">
        {learned.map((entry) => {
          const readyAt = Math.max(fight.skillCooldowns?.[entry.id] ?? 0, localReady[entry.id] ?? 0);
          const left = cooldownLeft(readyAt, now);
          const seconds = Math.ceil(left / 1000);
          return (
            <li key={entry.id}>
              <button
                type="button"
                disabled={left > 0}
                onClick={() => void cast(entry.id)}
                className="w-full border border-white/15 px-3 py-2 text-left disabled:opacity-40"
              >
                <span className="text-sm text-zinc-100">{entry.name}</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {seconds > 0 ? `${seconds}s` : entry.detail}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {note ? <p className="mt-2 text-sm text-gold">{note}</p> : null}
    </section>
  );
}

function Log({ rows }: { rows: BattleRow[] }) {
  return (
    <section className="mt-6">
      <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">BATTLE LOG</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No finished fights yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10 border border-white/10">
          {rows.map((row) => {
            const variety = varietyFor(row.family, row.trackId);
            return (
              <li key={row.id} className="flex items-center gap-3 px-2 py-2">
                <div className="h-14 w-12 shrink-0">
                  <MonsterFigure recipe={variety.recipe} color={row.color} title={variety.name} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-100">{variety.name}</p>
                  <p className="text-xs text-zinc-500">
                    {row.outcome === "victory" ? row.grade : row.outcome === "faded" ? "SONG ENDED" : "ESCAPED"}
                    {row.echoes > 0 ? ` · ${row.echoes} echoes` : ""}
                    {row.relicName ? ` · ${row.relicName}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
