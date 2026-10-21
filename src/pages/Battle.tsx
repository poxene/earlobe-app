import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CombatBars } from "@/components/CombatBars";
import { GoldAmount } from "@/components/Gold";
import { ListenerPortrait } from "@/components/portrait/ListenerPortrait";
import { Frame } from "@/components/Frame";
import { MonsterFigure } from "@/components/monsters/MonsterFigure";
import { useGameSync } from "@/hooks/useGameSync";
import { ApiError, apiSend } from "@/lib/api";
import type { RelicView } from "@/lib/game/character";
import type { ActiveFight, BattleRow, PartyAlly } from "@/lib/game/snapshot";
import { isRecord } from "@/lib/isRecord";
import { cooldownLeft, skillById } from "@/lib/game/skills";
import { varietyFor } from "@/lib/game/varieties";
import { profilePath } from "@/lib/profile/handle";

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
        {fight && (fight.artistName || fight.albumName) ? (
          <p className="mt-2 text-sm text-zinc-400">
            {fight.artistName ? <span>by {fight.artistName}</span> : null}
            {fight.artistName && fight.albumName ? " " : null}
            {fight.albumName ? <span>on {fight.albumName}</span> : null}
          </p>
        ) : null}
        {fight && variety && sheet ? (
          <Stage
            fight={fight}
            varietyName={variety.name}
            canon={variety.canon}
            recipe={variety.recipe}
            listenerName={sheet.displayName}
            className={sheet.className}
            classColor={sheet.classColor}
            level={sheet.level}
            relics={sheet.relics}
            body={sheet.body}
            allies={sync.data?.allies ?? []}
          />
        ) : (
          <p className="mt-6 border border-white/10 bg-panel/80 px-4 py-8 text-center text-sm text-zinc-400">
            Nothing is playing. Start a track to start a fight.
          </p>
        )}
        {fight && sheet ? (
          <Skills fight={fight} known={sheet.skills} allies={sync.data?.allies ?? []} onCast={() => void sync.refetch()} />
        ) : null}
        {fight?.bonusDamage ? (
          <p className="mt-3 text-center text-xs text-zinc-500">{fight.bonusDamage} bonus damage so far.</p>
        ) : null}
        {fight ? <CombatBars fight={fight} onBreak={() => void sync.refetch()} /> : null}
        <Log rows={sync.data?.battles ?? []} />
        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link to="/" className="underline decoration-white/20 underline-offset-4 hover:text-zinc-300">
            Back to the character
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
  level,
  relics,
  body,
  allies,
}: {
  fight: ActiveFight;
  varietyName: string;
  canon: string;
  recipe: ReturnType<typeof varietyFor>["recipe"];
  listenerName: string;
  className: string;
  classColor: string;
  level: number;
  relics: (RelicView | null)[];
  body: string;
  allies: PartyAlly[];
}) {
  return (
    <section className="relative mt-6 overflow-hidden border border-white/10 bg-panel/90 px-3 py-6 md:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(circle at 70% 40%, ${fight.color}33, transparent 55%)` }}
      />
      <div className="relative">
        <div className="grid grid-cols-2 items-end gap-4">
          <div className="min-w-0">
            <div className={`flex items-end ${allies.length > 0 ? "justify-end" : "justify-center"}`}>
              {allies.length > 0 ? (
                <div className="z-0 -mr-5 mb-1 flex items-end">
                  {allies.map((ally) => (
                    <div key={ally.userId} className="w-16 sm:w-[4.5rem]">
                      <Link
                        to={profilePath(ally.name)}
                        className="relative z-20 block truncate text-center text-[10px] tracking-wide hover:underline"
                        style={{ color: ally.classColor }}
                      >
                        {ally.name}
                      </Link>
                      <ListenerPortrait
                        color={ally.classColor}
                        name={ally.name}
                        relics={ally.gear.map((slug) => (slug ? { gearSlug: slug } : null))}
                        body={ally.body}
                        size={68}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="relative z-10 h-[182px] w-[168px] shrink-0">
                <div className={`absolute inset-0 ${fight.isPlaying ? "listener-on" : ""}`}>
                  <ListenerPortrait
                    color={classColor}
                    name={listenerName}
                    relics={relics}
                    body={body}
                    size={168}
                    attacking={fight.isPlaying}
                  />
                </div>
              </div>
            </div>
            <div className={`stage-still ${allies.length > 0 ? "ml-auto w-[168px]" : ""}`}>
              <Link
                to={profilePath(listenerName)}
                className="mt-3 block text-balance text-center font-display text-3xl leading-tight tracking-wide hover:text-gold"
              >
                {listenerName}
              </Link>
              <p className="text-balance text-center text-xs" style={{ color: classColor }}>
                Level {level} {className}
              </p>
            </div>
          </div>
          <div className="min-w-0">
            <div className={fight.isPlaying ? "creature creature-on" : "creature"}>
              <div className="mx-auto h-56 w-full max-w-[12rem]">
                <MonsterFigure recipe={recipe} color={fight.color} echo={fight.echoDepth > 0} title={fight.trackName} />
              </div>
              <p className="mt-3 text-balance text-center font-display text-3xl leading-tight tracking-wide">{fight.trackName}</p>
              <p className="text-balance text-center text-xs tracking-[0.16em]" style={{ color: fight.color }}>
                {varietyName.toUpperCase()}
              </p>
              {canon !== varietyName ? (
                <p className="text-balance text-center text-xs tracking-[0.16em] text-zinc-500">{canon.toUpperCase()}</p>
              ) : null}
              {fight.echoDepth > 0 ? (
                <p className="text-center text-xs tracking-[0.16em] text-zinc-500">ECHO {fight.echoDepth}</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className={`strike ${fight.isPlaying ? "strike-on" : ""}`} style={{ ["--strike" as string]: fight.color }} />
      </div>
    </section>
  );
}

function Skills({
  fight,
  known,
  allies,
  onCast,
}: {
  fight: ActiveFight;
  known: string[];
  allies: PartyAlly[];
  onCast: () => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [localReady, setLocalReady] = useState<Record<string, number>>({});
  const learned = known.flatMap((id) => {
    const entry = skillById(id);
    return entry ? [entry] : [];
  });
  const borrowed = allies.flatMap((ally) => {
    const entry = skillById(ally.skillId);
    return entry ? [{ ally, entry }] : [];
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setLocalReady({});
  }, [fight.trackId]);

  async function cast(id: string, allyId?: string) {
    const key = allyId ? `${id}:${allyId}` : id;
    try {
      const body = await apiSend("/api/battle/skill", "POST", allyId ? { skillId: id, allyId } : { skillId: id });
      const name = isRecord(body) && typeof body.name === "string" ? body.name : "Skill";
      const damage = isRecord(body) && typeof body.damage === "number" ? body.damage : 0;
      const readyAt = isRecord(body) && typeof body.readyAt === "number" ? body.readyAt : 0;
      if (readyAt > 0) setLocalReady((current) => ({ ...current, [key]: readyAt }));
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

  if (learned.length === 0 && borrowed.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        No skills yet.{" "}
        <Link to="/" className="text-gold">
          Learn one on the character.
        </Link>
      </p>
    );
  }

  return (
    <section className="mt-4">
      <p className="text-sm text-zinc-400">Each skill can be used again after 60 seconds.</p>
      {learned.length > 0 ? (
      <>
      <h2 className="mt-3 text-[11px] tracking-[0.28em] text-zinc-500">SKILLS</h2>
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
      </>
      ) : null}
      {borrowed.length > 0 ? (
        <>
          <h2 className="mt-4 text-[11px] tracking-[0.28em] text-zinc-500">PARTY</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-3">
            {borrowed.map(({ ally, entry }) => {
              const key = `${entry.id}:${ally.userId}`;
              const readyAt = Math.max(fight.skillCooldowns?.[key] ?? 0, localReady[key] ?? 0);
              const left = cooldownLeft(readyAt, now);
              const seconds = Math.ceil(left / 1000);
              return (
                <li key={ally.userId} className="border border-white/15">
                  <button
                    type="button"
                    disabled={left > 0}
                    onClick={() => void cast(entry.id, ally.userId)}
                    className="w-full px-3 py-2 text-left disabled:opacity-40"
                  >
                    <span className="text-sm text-zinc-100">{entry.name}</span>
                    <span className="mt-1 block text-xs text-zinc-500">{seconds > 0 ? `${seconds}s` : entry.detail}</span>
                  </button>
                  <p className="px-3 pb-2 text-xs" style={{ color: ally.classColor }}>
                    <Link to={profilePath(ally.name)} className="hover:underline">
                      {ally.name}
                    </Link>
                    <span> · {ally.className}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
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
                    {row.echoes > 0 ? (
                      <>
                        {" · "}
                        <GoldAmount amount={row.echoes} labeled />
                      </>
                    ) : null}
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
