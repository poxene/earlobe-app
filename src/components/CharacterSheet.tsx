import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { RelicCard } from "@/components/RelicCard";
import { Tip } from "@/components/Tip";
import { XpBar } from "@/components/XpBar";
import type { AlbumCover, CharacterSheetModel, Stats } from "@/lib/game/character";
import { addStats, calculateDps, sumStats } from "@/lib/game/combat";
import { dpsTooltip, echoTooltip, fightDps, statTooltip } from "@/lib/game/effects";
import { canSpend, nodeById, nodeOwned, nodesForClass, purchasable, treeEffects, withoutPending } from "@/lib/game/trees";

const STAT_ROWS: { key: keyof Stats; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "agi", label: "AGI" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

const EMPTY_STATS: Stats = { str: 0, agi: 0, int: 0, wis: 0, cha: 0 };

export function CharacterSheet({
  sheet,
  onApplyStats,
  onEquip,
  onUnequip,
  onSwitchClass,
  onApplySkills,
  onReset,
}: {
  sheet: CharacterSheetModel;
  onApplyStats?: (grants: Stats) => Promise<void> | void;
  onEquip?: (id: string) => void;
  onUnequip?: (id: string) => void;
  onSwitchClass?: (id: string) => void;
  onApplySkills?: (skillIds: string[]) => Promise<void> | void;
  onReset?: () => void;
}) {
  const [draft, setDraft] = useState<Stats>(EMPTY_STATS);
  const [pending, setPending] = useState<string[]>([]);
  const [problem, setProblem] = useState("");
  const applying = useRef(false);
  const sleeves = Array.from({ length: 4 }, (_, index) => sheet.albums[index] ?? null);
  const pendingNodes = pending.filter((id) => id !== "bank");
  const stagedBonus = treeEffects(sheet.className, pendingNodes).bonus;
  const stats = addStats(sheet.stats, sumStats([draft, stagedBonus]));
  const worn = sheet.relics.flatMap((relic) => relic?.effects ?? []);
  const dps = fightDps(calculateDps(stats), stats, worn, 0);
  const spent = draft.str + draft.agi + draft.int + draft.wis + draft.cha;
  const pointsLeft = Math.max(0, sheet.unallocatedPoints - spent);
  const picksLeft = Math.max(0, sheet.skillPicks - pending.length);

  function addPoint(stat: keyof Stats) {
    setProblem("");
    setDraft((current) => {
      const used = current.str + current.agi + current.int + current.wis + current.cha;
      if (!onApplyStats || used >= sheet.unallocatedPoints) return current;
      if (sheet.stats[stat] + current[stat] + stagedBonus[stat] >= 100) return current;
      return { ...current, [stat]: current[stat] + 1 };
    });
  }

  function removePoint(stat: keyof Stats) {
    setProblem("");
    setDraft((current) => (current[stat] > 0 ? { ...current, [stat]: current[stat] - 1 } : current));
  }

  async function applyStats() {
    if (applying.current || spent === 0 || !onApplyStats) return;
    applying.current = true;
    const grants = draft;
    setDraft(EMPTY_STATS);
    setProblem("");
    try {
      await onApplyStats(grants);
    } catch {
      setDraft(grants);
      setProblem("Couldn't apply those points.");
    } finally {
      applying.current = false;
    }
  }

  async function applySkills() {
    if (applying.current || pending.length === 0 || !onApplySkills) return;
    applying.current = true;
    const ids = pending;
    setPending([]);
    setProblem("");
    try {
      await onApplySkills(ids);
    } catch {
      setPending(ids);
      setProblem("Couldn't apply those skills.");
    } finally {
      applying.current = false;
    }
  }

  function toggleSkill(id: string) {
    setProblem("");
    setPending((current) => {
      if (current.includes(id)) return withoutPending(current, id);
      const nodes = [...sheet.treeNodes, ...current.filter((entry) => entry !== "bank")];
      const skills = [
        ...sheet.skills,
        ...current.flatMap((entry) => {
          const node = nodeById(entry);
          return node?.skillId ? [node.skillId] : [];
        }),
      ];
      const classIds = sheet.unlocked.map((entry) => entry.id);
      if (id === "bank") {
        if (current.length >= sheet.skillPicks) return current;
        if (purchasable(classIds, nodes, skills).length > 0) return current;
        return [...current, id];
      }
      const node = nodeById(id);
      if (!node || current.length >= sheet.skillPicks) return current;
      if (!canSpend(node, classIds, nodes, skills)) return current;
      return [...current, id];
    });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
      <p className="mb-3 text-[11px] tracking-[0.35em] text-zinc-500">CHARACTER SHEET</p>
      <section className="border border-white/10 border-t-gold bg-panel/90 p-4 md:p-8">
        <div className="grid items-start gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10">
          <div>
            <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden shadow-[0_0_40px_rgba(212,162,78,0.16)] md:mx-0">
              <div className="grid h-full grid-cols-2">
                {sleeves.map((album, index) => (
                  <Sleeve key={album?.id ?? `empty-${index}`} album={album} color={sheet.classColor} index={index} />
                ))}
              </div>
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(160deg, ${sheet.classColor}99, transparent 52%, #0a0a0fcc)`,
                }}
              />
              <div className="pointer-events-none absolute inset-2 border border-white/25" />
            </div>
            <p className="mt-3 text-center text-xs tracking-wide text-zinc-400 md:text-left">
              <span className="font-display text-2xl text-zinc-100">{sheet.victories}</span> victories
              <span className="mx-2 text-gold">·</span>
              <span className="font-display text-2xl text-zinc-100">{sheet.escapes}</span> escapes
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] tracking-[0.28em] text-gold">LISTENER</p>
            <h1 className="mt-1 break-words font-display text-5xl leading-none tracking-wide md:text-7xl">
              {sheet.displayName}
            </h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tracking-[0.18em] uppercase">
              <span className="inline-flex items-center gap-2" style={{ color: sheet.classColor }}>
                <i className="h-2 w-2 rounded-full" style={{ background: sheet.classColor }} />
                {sheet.className}
              </span>
              {sheet.subclass ? (
                <span className="tracking-normal text-zinc-400 normal-case">Subclass · {sheet.subclass}</span>
              ) : (
                <span className="tracking-normal text-zinc-500 normal-case">No subclass yet</span>
              )}
            </p>
            {sheet.thinHistory ? (
              <p className="mt-2 max-w-xl text-sm text-gold/90">
                Not enough listening history yet. You stay a Wanderer until a genre takes the lead.
              </p>
            ) : null}

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.28em] text-zinc-500">LEVEL</p>
                <p className="font-display text-6xl leading-none">{String(sheet.level).padStart(2, "0")}</p>
              </div>
              <div className="border border-gold/50 px-4 py-2 text-center">
                <p className="font-display text-4xl leading-none text-gold">{dps.toFixed(1)}</p>
                <Tip label="DPS" text={dpsTooltip(stats, worn)} className="text-[10px] tracking-[0.28em] text-gold/80" />
                <p className="mt-1">
                  <Tip
                    label={`${sheet.echoes} ECHOES`}
                    text={echoTooltip(stats, worn)}
                    className="text-[10px] tracking-[0.16em] text-zinc-500"
                  />
                </p>
              </div>
            </div>
            <div className="mt-6">
              <XpBar
                into={sheet.xpIntoLevel}
                span={sheet.xpForNext}
                fraction={sheet.xpFraction}
                color={sheet.classColor}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="border border-white/10 bg-panel/90 p-4 md:p-6">
          <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">STATS</h2>
          <ul className="mt-4 space-y-3">
            {STAT_ROWS.map((row) => (
              <li key={row.key}>
                <StatBar
                  label={row.label}
                  value={stats[row.key]}
                  color={sheet.classColor}
                  tip={statTooltip(row.key, stats[row.key], worn)}
                  onAdd={onApplyStats && pointsLeft > 0 && stats[row.key] < 100 ? () => addPoint(row.key) : undefined}
                  onRemove={draft[row.key] > 0 ? () => removePoint(row.key) : undefined}
                />
              </li>
            ))}
          </ul>
          {pointsLeft > 0 ? (
            <p className="mt-3 text-sm text-gold">{pointsLeft} unspent stat points.</p>
          ) : null}
          {spent > 0 ? (
            <button
              type="button"
              onClick={() => void applyStats()}
              className="mt-3 border border-gold/50 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
            >
              Apply
            </button>
          ) : null}
          {problem ? <p className="mt-3 text-sm text-gold">{problem}</p> : null}
          {onReset ? (
            <ResetStats
              onReset={() => {
                setDraft(EMPTY_STATS);
                setPending([]);
                setProblem("");
                onReset();
              }}
            />
          ) : null}
          {onSwitchClass && sheet.unlocked.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {sheet.unlocked.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  disabled={entry.id === sheet.className || Boolean(sheet.switchReadyAt)}
                  onClick={() => onSwitchClass(entry.id)}
                  className="border border-white/15 px-2 py-1 text-xs tracking-wide disabled:opacity-40"
                  style={{ color: entry.color }}
                >
                  {entry.id}
                </button>
              ))}
            </div>
          ) : null}
          {sheet.switchReadyAt ? (
            <p className="mt-2 text-xs text-zinc-500">Class change cools down in a day.</p>
          ) : null}
        </section>
        <section className="border border-white/10 bg-panel/90 p-4 md:p-6">
          <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">GENRE WEIGHT</h2>
          <ul className="mt-4 space-y-3">
            {sheet.genres.map((genre) => (
              <li key={genre.family}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span>{genre.family}</span>
                  <span className="tabular-nums text-zinc-400">{Math.round(genre.share * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden bg-white/10">
                  <div
                    className="fill-bar h-full"
                    style={{ width: `${genre.share * 100}%`, background: genre.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <SkillTree
        sheet={sheet}
        pending={pending}
        picksLeft={picksLeft}
        problem={problem}
        onToggle={onApplySkills ? toggleSkill : undefined}
        onApply={pending.length > 0 ? () => void applySkills() : undefined}
      />

      <section className="mt-4 border border-white/10 bg-panel/90 p-4 md:p-6">
        <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">RELICS</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Three equip slots. Drops add stats and an effect. Rare and legendary items have two effects. Mythic items are only made in the shop.{" "}
          <Link to="/shop" className="text-gold">
            Sell or upgrade extras in the shop.
          </Link>
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {sheet.relics.map((relic, index) =>
            relic ? (
              <li key={relic.id}>
                <RelicCard relic={relic} action={onUnequip ? "Unequip" : undefined} onAction={onUnequip ? () => onUnequip(relic.id) : undefined} />
              </li>
            ) : (
              <li
                key={`open-${index}`}
                className="flex aspect-square flex-col items-center justify-center gap-2 border border-dashed border-gold/35 text-zinc-500"
              >
                <SlotMark />
                <span className="text-[10px] tracking-[0.2em] uppercase">Open</span>
              </li>
            ),
          )}
        </ul>
        {sheet.badges.length > 0 ? (
          <p className="mt-4 text-xs tracking-[0.16em] text-gold">{sheet.badges.join(" · ").toUpperCase()}</p>
        ) : null}
        {sheet.inventory.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {sheet.inventory.map((relic) => (
              <li key={relic.id}>
                <RelicCard relic={relic} action={onEquip ? "Equip" : undefined} onAction={onEquip ? () => onEquip(relic.id) : undefined} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <p className="mt-8 text-center text-xs text-zinc-600">
        <Link to="/debug" className="underline decoration-white/20 underline-offset-4 hover:text-zinc-300">
          Raw top artists
        </Link>
      </p>
    </main>
  );
}

function Sleeve({ album, color, index }: { album: AlbumCover | null; color: string; index: number }) {
  const wash = index % 2 === 0 ? color : "#d4a24e";
  return (
    <div
      className="relative min-h-0 bg-ink"
      style={album?.imageUrl ? undefined : { background: `linear-gradient(145deg, ${wash}, #0a0a0f 72%)` }}
    >
      {album?.imageUrl ? (
        <img
          src={album.imageUrl}
          alt={album.artistName ? `${album.name} — ${album.artistName}` : album.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-end p-2">
          <span className="text-[10px] uppercase leading-tight tracking-wider text-white/80">
            {album?.name ?? "Empty"}
          </span>
        </div>
      )}
    </div>
  );
}

function ResetStats({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          setArmed(false);
          onReset();
        }}
        className="border border-white/15 px-3 py-2 text-xs tracking-wide text-zinc-300"
      >
        {armed ? "Click again. Listening history stays." : "Reset stats"}
      </button>
      <p className="mt-2 text-xs text-zinc-500">
        Puts stat points and skills back. Legacy points and listening history stay.
      </p>
    </div>
  );
}

function SkillTree({
  sheet,
  pending,
  picksLeft,
  problem,
  onToggle,
  onApply,
}: {
  sheet: CharacterSheetModel;
  pending: string[];
  picksLeft: number;
  problem: string;
  onToggle?: (id: string) => void;
  onApply?: () => void;
}) {
  const [classId, setClassId] = useState(sheet.className);
  const shown = sheet.unlocked.some((entry) => entry.id === classId) ? classId : sheet.className;
  const nodes = nodesForClass(shown);
  const columns: (typeof nodes)[] = [];
  for (let index = 0; index < nodes.length; index += 3) columns.push(nodes.slice(index, index + 3));
  const classIds = sheet.unlocked.map((entry) => entry.id);
  const stagedNodes = pending.filter((id) => id !== "bank");
  const stagedSkills = pending.flatMap((id) => {
    const node = nodeById(id);
    return node?.skillId ? [node.skillId] : [];
  });
  const ownedNodes = [...sheet.treeNodes, ...stagedNodes];
  const ownedSkills = [...sheet.skills, ...stagedSkills];
  const open = purchasable(classIds, ownedNodes, ownedSkills);

  return (
    <section className="mt-4 border border-white/10 bg-panel/90 p-4 md:p-6">
      <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">SKILL TREE</h2>
      <p className="mt-2 text-sm text-zinc-400">
        {sheet.legacyPoints > 0
          ? `${sheet.legacyPoints} legacy ${sheet.legacyPoints === 1 ? "point" : "points"} from your listening history. `
          : ""}
        Points buy nodes. They do not change base stats. Bonuses apply only while that class is active.
      </p>
      <p className="mt-2 text-sm text-gold">{picksLeft} unspent.</p>
      {sheet.unlocked.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {sheet.unlocked.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setClassId(entry.id)}
              className={`border px-2 py-1 text-xs tracking-wide ${shown === entry.id ? "border-gold text-gold" : "border-white/15 text-zinc-400"}`}
            >
              {entry.id}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {columns.map((column) => (
          <ol key={column[0]?.id ?? "branch"} className="space-y-2">
            {column.map((node) => {
              const staged = pending.includes(node.id);
              const owned = nodeOwned(node, sheet.treeNodes, sheet.skills);
              const ready = canSpend(node, classIds, ownedNodes, ownedSkills);
              const interactive = Boolean(onToggle) && (staged || (ready && picksLeft > 0));
              return (
                <li key={node.id}>
                  <button
                    type="button"
                    disabled={!interactive}
                    onClick={() => onToggle?.(node.id)}
                    className={`w-full border px-3 py-2 text-left transition-colors ${owned ? "border-gold/50" : staged ? "border-gold bg-gold/10 hover:bg-gold/20" : ready ? "border-white/20 hover:border-gold hover:bg-white/5" : "border-white/10 opacity-50"}`}
                  >
                    <span className={`text-sm ${owned || staged || ready ? "text-zinc-100" : "text-zinc-500"}`}>{node.name}</span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {owned ? "Learned. " : staged ? "Pending. " : ""}
                      {node.detail}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ))}
      </div>
      {onApply ? (
        <button
          type="button"
          onClick={onApply}
          className="mt-4 border border-gold/50 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
        >
          Apply
        </button>
      ) : null}
      {picksLeft > 0 && open.length === 0 && onToggle ? (
        <button type="button" onClick={() => onToggle("bank")} className="mt-4 block text-sm text-gold hover:text-gold-2">
          Every available node is learned. Convert this point into a stat point.
        </button>
      ) : null}
      {problem ? <p className="mt-3 text-sm text-gold">{problem}</p> : null}
    </section>
  );
}

function StatBar({
  label,
  value,
  color,
  tip,
  onAdd,
  onRemove,
}: {
  label: string;
  value: number;
  color: string;
  tip: { name: string; line: string };
  onAdd?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_2.5rem_auto] items-center gap-3">
      <Tip label={label} text={`${tip.name}. ${tip.line}`} />
      <div
        className="h-1.5 overflow-hidden bg-white/10"
        role="meter"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className="fill-bar h-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-right font-display text-2xl leading-none tabular-nums">{value}</span>
      <span className="flex items-center gap-1">
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="grid h-8 w-8 place-items-center border border-white/20 text-lg leading-none text-zinc-300 transition-colors hover:border-zinc-100 hover:bg-zinc-100 hover:text-ink"
            aria-label={`Remove one ${label}`}
          >
            −
          </button>
        ) : null}
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="grid h-8 w-8 place-items-center border border-gold/40 text-lg leading-none text-gold transition-colors hover:border-gold hover:bg-gold hover:text-ink"
            aria-label={`Add one ${label}`}
          >
            +
          </button>
        ) : (
          <span className="h-8 w-8" />
        )}
      </span>
    </div>
  );
}

function SlotMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 2 L26 14 L14 26 L2 14 Z" fill="none" stroke="#d4a24e" strokeWidth="1.25" />
    </svg>
  );
}
