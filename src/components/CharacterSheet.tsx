import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GoldAmount, GoldMark } from "@/components/Gold";
import { PaperDoll } from "@/components/PaperDoll";
import { BodyChip, ListenerPortrait } from "@/components/portrait/ListenerPortrait";
import { Tip } from "@/components/Tip";
import { XpBar } from "@/components/XpBar";
import { EMPTY_RECORD, type CharacterSheetModel, type Stats } from "@/lib/game/character";
import { addStats, calculateDps, sumStats } from "@/lib/game/combat";
import { dpsTooltip, echoTooltip, fightDps, statTooltip } from "@/lib/game/effects";
import { canSpend, nodeById, nodeOwned, nodesForClass, purchasable, treeEffects, withoutPending } from "@/lib/game/trees";
import { BODY_TYPES, bodyName, type BodyType } from "@/lib/portrait/body";

const STAT_ROWS: { key: keyof Stats; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "agi", label: "AGI" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

const EMPTY_STATS: Stats = { str: 0, agi: 0, int: 0, wis: 0, cha: 0 };

type SheetTab = "stats" | "skills" | "advanced";

const SHEET_TABS: { id: SheetTab; label: string }[] = [
  { id: "stats", label: "Attributes" },
  { id: "skills", label: "Skills" },
  { id: "advanced", label: "Stats" },
];

export function CharacterSheet({
  sheet,
  onApplyStats,
  onEquip,
  onUnequip,
  onSwitchClass,
  onApplySkills,
  onReset,
  onBody,
}: {
  sheet: CharacterSheetModel;
  onApplyStats?: (grants: Stats) => Promise<void> | void;
  onEquip?: (id: string, slot: number) => Promise<void> | void;
  onUnequip?: (id: string) => Promise<void> | void;
  onSwitchClass?: (id: string) => void;
  onApplySkills?: (skillIds: string[]) => Promise<void> | void;
  onReset?: () => void;
  onBody?: (body: BodyType) => Promise<void> | void;
}) {
  const [draft, setDraft] = useState<Stats>(EMPTY_STATS);
  const [pending, setPending] = useState<string[]>([]);
  const [problem, setProblem] = useState("");
  const applying = useRef(false);
  const pendingNodes = pending.filter((id) => id !== "bank");
  const stagedBonus = treeEffects(sheet.className, pendingNodes).bonus;
  const stats = addStats(sheet.stats, sumStats([draft, stagedBonus]));
  const worn = sheet.relics.flatMap((relic) => relic?.effects ?? []);
  const dps = fightDps(calculateDps(stats), stats, worn, 0);
  const spent = draft.str + draft.agi + draft.int + draft.wis + draft.cha;
  const pointsLeft = Math.max(0, sheet.unallocatedPoints - spent);
  const picksLeft = Math.max(0, sheet.skillPicks - pending.length);
  const [tab, setTab] = useState<SheetTab>("stats");

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
      <p className="mb-3 text-[11px] tracking-[0.35em] text-zinc-500">CHARACTER</p>
      <section className="border border-white/10 border-t-gold bg-panel/90 p-4 md:p-8">
        <div className="grid items-start gap-6 sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[220px_auto_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-8">
          <div className="sm:col-start-1 sm:row-start-1">
            <ListenerPortrait color={sheet.classColor} name={sheet.displayName} relics={sheet.relics} body={sheet.body} size={220} />
            <BodyPicker body={sheet.body} onPick={onBody} />
          </div>

          <div className="min-w-0 sm:col-start-2 sm:row-start-1 lg:col-start-3">
            <p className="text-[11px] tracking-[0.28em] text-gold">LISTENER</p>
            <h1 className="mt-1 break-words font-display text-5xl leading-none tracking-wide md:text-7xl">
              {sheet.displayName}
            </h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-2" style={{ color: sheet.classColor }}>
                <i className="h-2 w-2 rounded-full" style={{ background: sheet.classColor }} />
                Level {sheet.level} {sheet.className}
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
                    label={
                      <span className="inline-flex items-center gap-1">
                        <GoldMark className="h-3 w-3" />
                        {sheet.echoes.toLocaleString()} GOLD
                      </span>
                    }
                    text={echoTooltip(stats, worn)}
                    className="inline-flex items-center text-[10px] tracking-[0.16em] text-gold"
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
          <PaperDoll relics={sheet.relics} inventory={sheet.inventory} onEquip={onEquip} onUnequip={onUnequip} />
          {sheet.badges.length > 0 ? (
            <p className="text-xs tracking-[0.16em] text-gold sm:col-span-2 lg:col-span-3">{sheet.badges.join(" · ").toUpperCase()}</p>
          ) : null}
        </div>
      </section>

      <SheetTabs
        tab={tab}
        onTab={setTab}
        alerts={{ stats: pointsLeft > 0, skills: picksLeft > 0 }}
      />
      <div
        role="tabpanel"
        id={`sheet-panel-${tab}`}
        aria-labelledby={`sheet-tab-${tab}`}
        className="border border-white/10 bg-panel/90 p-4 md:p-6"
      >
        {tab === "stats" ? (
          <>
          <ul className="space-y-3">
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
                  disabled={entry.id === sheet.className}
                  onClick={() => onSwitchClass(entry.id)}
                  className="border border-white/15 px-2 py-1 text-xs tracking-wide disabled:opacity-40"
                  style={{ color: entry.color }}
                >
                  {entry.id}
                </button>
              ))}
            </div>
          ) : null}
          </>
        ) : null}
        {tab === "skills" ? (
          <SkillTree
            sheet={sheet}
            pending={pending}
            picksLeft={picksLeft}
            problem={problem}
            onToggle={onApplySkills ? toggleSkill : undefined}
            onApply={pending.length > 0 ? () => void applySkills() : undefined}
          />
        ) : null}
        {tab === "advanced" ? <Advanced sheet={sheet} /> : null}
      </div>

      <p className="mt-8 text-center text-xs text-zinc-600">
        <Link to="/debug" className="underline decoration-white/20 underline-offset-4 hover:text-zinc-300">
          Raw top artists
        </Link>
      </p>
    </main>
  );
}

function Advanced({ sheet }: { sheet: CharacterSheetModel }) {
  const record = sheet.record ?? EMPTY_RECORD;
  const rows = [
    { label: "Listens", value: record.listens.toLocaleString() },
    { label: "Victories", value: sheet.victories.toLocaleString() },
    { label: "Escapes", value: sheet.escapes.toLocaleString() },
    { label: "Faded", value: record.faded.toLocaleString() },
    { label: "Highest echo", value: record.highestEcho.toLocaleString() },
    { label: "Gold", value: <GoldAmount amount={sheet.echoes} /> },
    { label: "Legacy points", value: sheet.legacyPoints.toLocaleString() },
    { label: "Artists", value: record.artists.toLocaleString() },
    { label: "Albums", value: record.albums.toLocaleString() },
    { label: "Albums finished", value: record.albumsFinished.toLocaleString() },
    { label: "Relics", value: record.relics.toLocaleString() },
  ];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div>
        <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">RECORD</h2>
        <p className="mt-2 text-sm text-zinc-400">Listens are your Last.fm scrobbles. The highest echo is the deepest victory.</p>
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
          {sheet.genres.map((genre) => (
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
    <div>
      <p className="text-sm text-zinc-400">
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
    </div>
  );
}

function SheetTabs({
  tab,
  onTab,
  alerts,
}: {
  tab: SheetTab;
  onTab: (tab: SheetTab) => void;
  alerts: Partial<Record<SheetTab, boolean>>;
}) {
  return (
    <div role="tablist" aria-label="Character" className="mt-4 flex flex-wrap border border-white/10 border-b-0 bg-panel/90">
      {SHEET_TABS.map((entry) => {
        const selected = tab === entry.id;
        const alert = alerts[entry.id];
        return (
          <button
            key={entry.id}
            type="button"
            role="tab"
            id={`sheet-tab-${entry.id}`}
            aria-selected={selected}
            aria-controls={`sheet-panel-${entry.id}`}
            onClick={() => onTab(entry.id)}
            className={`relative px-5 py-3 text-[11px] tracking-[0.28em] ${selected ? "text-gold" : "text-zinc-500 hover:text-zinc-200"}`}
          >
            {entry.label.toUpperCase()}
            {alert ? <i className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle" aria-hidden /> : null}
            {selected ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-gold" /> : null}
          </button>
        );
      })}
    </div>
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

function BodyPicker({ body, onPick }: { body: BodyType; onPick?: (body: BodyType) => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function pick(next: BodyType) {
    if (next === body || !onPick) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await onPick(next);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto mt-3 max-w-[220px]" ref={root}>
      <button
        type="button"
        className="flex w-full items-center gap-2 border border-white/15 bg-ink/40 px-2 py-1 text-left text-xs tracking-wide text-zinc-200"
        disabled={busy || !onPick}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Body: ${bodyName(body)}`}
        onClick={() => setOpen((value) => !value)}
      >
        <BodyChip body={body} />
        <span>{bodyName(body)}</span>
      </button>
      {open ? (
        <div className="absolute left-0 z-30 mt-1 max-h-64 w-full overflow-auto border border-white/15 bg-ink" role="listbox" aria-label="Body">
          {BODY_TYPES.map((row) => (
            <button
              key={row.slug}
              type="button"
              role="option"
              aria-selected={row.slug === body}
              className={`flex w-full items-center gap-2 px-2 py-1 text-left text-xs hover:bg-white/5 ${row.slug === body ? "text-gold" : "text-zinc-200"}`}
              disabled={busy}
              onClick={() => void pick(row.slug)}
            >
              <BodyChip body={row.slug} />
              <span>{row.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
