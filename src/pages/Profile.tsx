import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Frame } from "@/components/Frame";
import { PaperDoll } from "@/components/PaperDoll";
import { ListenerPortrait } from "@/components/portrait/ListenerPortrait";
import { Tip } from "@/components/Tip";
import { ApiError, apiGet } from "@/lib/api";
import { AchievementBoard } from "@/components/AchievementBoard";
import { EMPTY_RECORD, type Stats } from "@/lib/game/character";
import { statTooltip } from "@/lib/game/effects";
import { skillById } from "@/lib/game/skills";
import { isRecord } from "@/lib/isRecord";
import type { PublicProfile } from "@/lib/profile/public";

const STAT_ROWS: { key: keyof Stats; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "agi", label: "AGI" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

export function ProfilePage() {
  const { name = "" } = useParams();
  const query = useQuery({
    queryKey: ["profile", name.toLowerCase()],
    queryFn: async () => {
      const body = await apiGet(`/api/c/${encodeURIComponent(name)}`);
      if (!isProfile(body)) throw new Error("unexpected profile");
      return body;
    },
    enabled: name.length > 0,
    retry: false,
  });

  const missing = query.error instanceof ApiError && query.error.code === "unknown_profile";

  return (
    <Frame>
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        {query.isPending ? <p className="mt-6 text-zinc-400">Loading profile.</p> : null}
        {missing ? (
          <p className="mt-6 border border-white/10 bg-panel/80 px-4 py-4 text-sm text-zinc-400">No listener by that name.</p>
        ) : null}
        {query.isError && !missing ? <p className="mt-6 text-sm text-gold">Couldn't load that profile.</p> : null}
        {query.data ? <ProfileView profile={query.data} /> : null}
      </main>
    </Frame>
  );
}

function ProfileView({ profile }: { profile: PublicProfile }) {
  const worn = profile.relics.flatMap((relic) => relic?.effects ?? []);
  const record = profile.record ?? EMPTY_RECORD;
  const skills = profile.skills.flatMap((id) => {
    const entry = skillById(id);
    return entry ? [entry] : [];
  });
  const rows = [
    { label: "Listens", value: record.listens.toLocaleString() },
    { label: "Victories", value: profile.victories.toLocaleString() },
    { label: "Escapes", value: profile.escapes.toLocaleString() },
    { label: "Faded", value: record.faded.toLocaleString() },
    { label: "Highest echo", value: record.highestEcho.toLocaleString() },
    { label: "Artists", value: record.artists.toLocaleString() },
    { label: "Albums", value: record.albums.toLocaleString() },
    { label: "Albums finished", value: record.albumsFinished.toLocaleString() },
    { label: "Relics", value: record.relics.toLocaleString() },
  ];

  return (
    <>
      <p className="mb-3 text-[11px] tracking-[0.35em] text-zinc-500">LISTENER</p>
      <section className="border border-white/10 border-t-gold bg-panel/90 p-4 md:p-8">
        <div className="grid items-start gap-6 sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[220px_auto_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-8">
          <div className="sm:col-start-1 sm:row-start-1">
            <ListenerPortrait color={profile.classColor} name={profile.displayName} relics={profile.relics} body={profile.body} size={220} />
          </div>
          <div className="min-w-0 sm:col-start-2 sm:row-start-1 lg:col-start-3">
            <h1 className="break-words font-display text-5xl leading-none tracking-wide md:text-7xl">{profile.displayName}</h1>
            <p className="mt-3 text-sm text-zinc-500">earlo.be/c/{profile.displayName}</p>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-2" style={{ color: profile.classColor }}>
                <i className="h-2 w-2 rounded-full" style={{ background: profile.classColor }} />
                Level {profile.level} {profile.className}
              </span>
              {profile.subclass ? <span className="tracking-normal text-zinc-400 normal-case">Subclass · {profile.subclass}</span> : null}
            </p>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.28em] text-zinc-500">LEVEL</p>
                <p className="font-display text-6xl leading-none">{String(profile.level).padStart(2, "0")}</p>
              </div>
              <div className="border border-gold/50 px-4 py-2 text-center">
                <p className="font-display text-4xl leading-none text-gold">{profile.dps.toFixed(1)}</p>
                <p className="text-[10px] tracking-[0.28em] text-gold/80">DPS</p>
              </div>
            </div>
          </div>
          <PaperDoll relics={profile.relics} showPack={false} />
          {profile.badges.length > 0 ? (
            <p className="text-xs tracking-[0.16em] text-gold sm:col-span-2 lg:col-span-3">{profile.badges.join(" · ").toUpperCase()}</p>
          ) : null}
        </div>
      </section>

      <section className="mt-4 border border-white/10 bg-panel/90 p-4 md:p-6">
        <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">ATTRIBUTES</h2>
        <ul className="mt-4 space-y-3">
          {STAT_ROWS.map((row) => {
            const value = profile.stats[row.key];
            const tip = statTooltip(row.key, value, worn);
            return (
              <li key={row.key} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
                <Tip label={row.label} text={`${tip.name}. ${tip.line}`} />
                <div className="h-1.5 overflow-hidden bg-white/10">
                  <div className="fill-bar h-full" style={{ width: `${Math.min(100, value)}%`, background: profile.classColor }} />
                </div>
                <span className="text-right font-display text-2xl leading-none tabular-nums">{value}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-4 border border-white/10 bg-panel/90 p-4 md:p-6">
        <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">SKILLS</h2>
        {skills.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No skills yet.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {skills.map((entry) => (
              <li key={entry.id} className="border border-white/15 px-3 py-2">
                <span className="text-sm text-zinc-100">{entry.name}</span>
                <span className="mt-1 block text-xs text-zinc-500">{entry.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 border border-white/10 bg-panel/90 p-4 md:p-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">RECORD</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              {rows.map((row) => (
                <div key={row.label}>
                  <dt className="text-[11px] tracking-[0.18em] text-zinc-500">{row.label.toUpperCase()}</dt>
                  <dd className="mt-1 font-display text-3xl leading-none">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">GENRE WEIGHT</h2>
            <ul className="mt-4 space-y-3">
              {profile.genres.map((genre) => (
                <li key={genre.family}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span>{genre.family}</span>
                    <span className="tabular-nums text-zinc-400">{Math.round(genre.share * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden bg-white/10">
                    <div className="fill-bar h-full" style={{ width: `${genre.share * 100}%`, background: genre.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-4 border border-white/10 bg-panel/90 p-4 md:p-6">
        <AchievementBoard
          listens={record.listens}
          victories={profile.victories}
          highestEcho={record.highestEcho}
          albumsFinished={record.albumsFinished}
          relics={profile.relics}
        />
      </section>

      <p className="mt-8 text-center text-xs text-zinc-600">
        <Link to="/party" className="underline decoration-white/20 underline-offset-4 hover:text-zinc-300">
          Back to the party
        </Link>
      </p>
    </>
  );
}

function isProfile(value: unknown): value is PublicProfile {
  if (!isRecord(value)) return false;
  if (typeof value.displayName !== "string" || typeof value.className !== "string" || typeof value.classColor !== "string") return false;
  if (typeof value.level !== "number" || typeof value.dps !== "number" || typeof value.body !== "string") return false;
  if (value.subclass !== null && typeof value.subclass !== "string") return false;
  if (!isStats(value.stats) || !isRecord(value.record) || !Array.isArray(value.relics) || !Array.isArray(value.skills)) return false;
  if (!Array.isArray(value.genres) || typeof value.victories !== "number" || typeof value.escapes !== "number") return false;
  if (!Array.isArray(value.badges)) return false;
  return true;
}

function isStats(value: unknown): value is Stats {
  if (!isRecord(value)) return false;
  return ["str", "agi", "int", "wis", "cha"].every((key) => typeof value[key] === "number");
}
