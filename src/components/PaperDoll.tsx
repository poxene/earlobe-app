import { useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { ItemIcon } from "@/components/portrait/ItemIcon";
import { MaterialMark } from "@/components/portrait/MaterialMark";
import { affixLines, type RelicView } from "@/lib/game/character";
import type { MaterialStackView } from "@/lib/game/materials";
import { DOLL_SLOTS, fittingSlots, itemFits, pieceOf, SLOT_LABEL, slotIndex, slotPhrase } from "@/lib/portrait/gear";
import { CUT_LINE, EFFECT_NAME, effectDetail } from "@/lib/game/effects";
import { RARITY_COLOR } from "@/lib/game/loot";

const MIME = "application/x-earlobe-relic";

export function PaperDoll({
  relics,
  inventory = [],
  stacks = [],
  showPack = true,
  onEquip,
  onUnequip,
  onSplit,
  onCombine,
}: {
  relics: readonly (RelicView | null)[];
  inventory?: readonly RelicView[];
  stacks?: readonly MaterialStackView[];
  showPack?: boolean;
  onEquip?: (id: string, slot: number) => Promise<void> | void;
  onUnequip?: (id: string) => Promise<void> | void;
  onSplit?: (id: string, quantity: number) => Promise<void> | void;
  onCombine?: (id: string) => Promise<void> | void;
}) {
  const [over, setOver] = useState<number | "pack" | null>(null);
  const [note, setNote] = useState("");
  const [tip, setTip] = useState<string | null>(null);
  const hoverArmed = useRef(true);
  const worn = relics;

  function silenceTips() {
    hoverArmed.current = false;
    setTip(null);
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }

  function armTipsAfterMove() {
    const arm = () => {
      hoverArmed.current = true;
    };
    window.addEventListener("pointermove", arm, { once: true });
  }

  async function dropOn(slot: number, event: DragEvent) {
    event.preventDefault();
    silenceTips();
    armTipsAfterMove();
    setOver(null);
    const id = readDrag(event);
    if (!id || !onEquip) return;
    const relic = [...worn, ...inventory].find((entry) => entry?.id === id);
    if (!relic) return;
    const piece = pieceOf(relic);
    if (!itemFits(piece, slot)) {
      setNote(`That relic sits on the ${slotPhrase(piece)}.`);
      return;
    }
    if (offhandBlocked(worn, slot, id)) {
      setNote("A two-handed weapon is using both hands.");
      return;
    }
    const already = worn.findIndex((entry) => entry?.id === id);
    if (already === slot) return;
    setNote("");
    try {
      await onEquip(id, slot);
    } catch {
      setNote("That slot didn't take the relic.");
    }
  }

  async function dropOnPack(event: DragEvent) {
    event.preventDefault();
    silenceTips();
    armTipsAfterMove();
    setOver(null);
    const id = readDrag(event);
    if (!id || !onUnequip) return;
    if (!worn.some((relic) => relic?.id === id)) return;
    setNote("");
    try {
      await onUnequip(id);
    } catch {
      setNote("Couldn't take that off.");
    }
  }

  return (
    <div className="contents">
      <div className="grid w-max grid-cols-3 gap-2 sm:col-span-2 sm:row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:self-center">
          {DOLL_SLOTS.map((slot, index) => {
            const relic = worn[index] ?? null;
            const label = SLOT_LABEL[slot];
            return (
              <div
                key={slot}
                className={`h-14 w-14 ${over === index ? "ring-1 ring-gold" : ""}`}
                onDragOver={(event) => {
                  if (!onEquip) return;
                  event.preventDefault();
                  setOver(index);
                }}
                onDragLeave={() => setOver((current) => (current === index ? null : current))}
                onDrop={(event) => void dropOn(index, event)}
              >
                {relic ? (
                  <ItemSquare
                    relic={relic}
                    label={label}
                    open={tip === relic.id}
                    draggable={Boolean(onUnequip)}
                    onHover={(open) => {
                      if (open && hoverArmed.current) setTip(relic.id);
                      else setTip((current) => (current === relic.id ? null : current));
                    }}
                    onDragStart={(event) => {
                      silenceTips();
                      writeDrag(event, relic.id);
                    }}
                    onDragEnd={() => {
                      silenceTips();
                      armTipsAfterMove();
                    }}
                    onClick={() => {
                      silenceTips();
                      armTipsAfterMove();
                      if (onUnequip) void onUnequip(relic.id);
                    }}
                  />
                ) : (
                  <span className="grid h-14 w-14 place-items-center border border-white/15 bg-ink/50 px-0.5 text-center text-[8px] leading-tight tracking-[0.12em] text-zinc-500">
                    {label.toUpperCase()}
                  </span>
                )}
              </div>
            );
          })}
      </div>
      {showPack ? (
      <div className="border-t border-white/10 pt-6 sm:col-span-2 sm:row-start-3 lg:col-span-3 lg:row-start-2">
      <p className="max-w-2xl text-sm text-zinc-400">
        Each relic fits one slot. Worn gear shows on the portrait. Materials from a kill stack here. Mythic items are only made in town.{" "}
        <Link to="/town" className="text-gold">
          Sell or upgrade extras in town.
        </Link>
      </p>
      <p className="mt-3 text-sm text-zinc-500">Hover a relic to read it. It only fits its own slot. Drop it on the pack to take it off.</p>
      {note ? <p className="mt-2 text-sm text-gold">{note}</p> : null}
      <h2 className="mt-6 text-[11px] tracking-[0.28em] text-zinc-500">INVENTORY</h2>
      <div
        className={`mt-4 min-h-16 border border-dashed p-2 ${over === "pack" ? "border-gold" : "border-white/15"}`}
        onDragOver={(event) => {
          if (!onUnequip) return;
          event.preventDefault();
          setOver("pack");
        }}
        onDragLeave={() => setOver((current) => (current === "pack" ? null : current))}
        onDrop={(event) => void dropOnPack(event)}
      >
        {inventory.length === 0 && stacks.length === 0 ? (
          <p className="px-2 py-3 text-sm text-zinc-500">Nothing in the pack. Drop worn gear here to take it off.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {inventory.map((relic) => (
              <li key={relic.id}>
                <ItemSquare
                  relic={relic}
                  open={tip === relic.id}
                  draggable={Boolean(onEquip)}
                  onHover={(open) => {
                    if (open && hoverArmed.current) setTip(relic.id);
                    else setTip((current) => (current === relic.id ? null : current));
                  }}
                  onDragStart={(event) => {
                    silenceTips();
                    writeDrag(event, relic.id);
                  }}
                  onDragEnd={() => {
                    silenceTips();
                    armTipsAfterMove();
                  }}
                  onClick={() => {
                    silenceTips();
                    armTipsAfterMove();
                    if (!onEquip) return;
                    const piece = pieceOf(relic);
                    const slots = fittingSlots(piece).filter((index) => !offhandBlocked(worn, index, relic.id));
                    const open = slots.find((index) => !worn[index]);
                    const target = open ?? slots[0];
                    if (target === undefined) {
                      setNote("A two-handed weapon is using both hands.");
                      return;
                    }
                    void onEquip(relic.id, target);
                  }}
                />
              </li>
            ))}
            {stacks.map((stack) => (
              <li key={stack.id}>
                <MaterialSquare
                  stack={stack}
                  open={tip === stack.id}
                  canCombine={stacks.some((other) => other.id !== stack.id && other.slug === stack.slug)}
                  onHover={(open) => {
                    if (open && hoverArmed.current) setTip(stack.id);
                    else setTip((current) => (current === stack.id ? null : current));
                  }}
                  onSplit={async (quantity) => {
                    silenceTips();
                    try {
                      await onSplit?.(stack.id, quantity);
                    } catch {
                      setNote("Couldn't split that stack.");
                    }
                  }}
                  onCombine={async () => {
                    silenceTips();
                    try {
                      await onCombine?.(stack.id);
                    } catch {
                      setNote("Couldn't combine those stacks.");
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
      ) : null}
    </div>
  );
}

function ItemSquare({
  relic,
  label,
  open,
  draggable,
  onHover,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  relic: RelicView;
  label?: string;
  open: boolean;
  draggable: boolean;
  onHover: (open: boolean) => void;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const lines = affixLines(relic);
  return (
    <span className="relative block h-14 w-14" onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      <button
        type="button"
        draggable={draggable}
        aria-label={label ? `${label}: ${relic.name}` : relic.name}
        className="grid h-14 w-14 place-items-center border bg-ink/60"
        style={{ borderColor: RARITY_COLOR[relic.rarity] }}
        onClick={onClick}
        onDragStart={(event) => {
          const tipNode = event.currentTarget.parentElement?.querySelector("[role='tooltip']");
          if (tipNode instanceof HTMLElement) tipNode.style.display = "none";
          onDragStart(event);
        }}
        onDragEnd={onDragEnd}
      >
        <ItemIcon slug={pieceOf(relic).slug} name={relic.name} size={36} />
      </button>
      {open ? (
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-40 mb-2 w-56 border border-white/15 bg-ink p-2 text-left shadow-lg"
      >
        <span className="block text-[10px] tracking-[0.16em]" style={{ color: RARITY_COLOR[relic.rarity] }}>
          {relic.rarity.toUpperCase()}
        </span>
        <span className="mt-0.5 block text-sm text-zinc-100">{relic.name}</span>
        {lines.map((row, index) => (
          <span key={`${row.stat}-${index}`} className="mt-1 block text-xs text-zinc-300">
            +{row.amount} {row.stat.toUpperCase()}
          </span>
        ))}
        {relic.cut ? <span className="mt-1 block text-xs text-zinc-400">{CUT_LINE[relic.cut]}</span> : null}
        {relic.effects.map((effect) => (
          <span key={effect.id} className="mt-1 block text-xs text-gold/90">
            {EFFECT_NAME[effect.id]}. {effectDetail(effect.detail)}
          </span>
        ))}
      </span>
      ) : null}
    </span>
  );
}

function MaterialSquare({
  stack,
  open,
  canCombine,
  onHover,
  onSplit,
  onCombine,
}: {
  stack: MaterialStackView;
  open: boolean;
  canCombine: boolean;
  onHover: (open: boolean) => void;
  onSplit: (quantity: number) => Promise<void> | void;
  onCombine: () => Promise<void> | void;
}) {
  const [take, setTake] = useState(Math.max(1, Math.floor(stack.quantity / 2)));
  const amount = Math.min(stack.quantity - 1, Math.max(1, take));
  return (
    <span className="relative block h-14 w-14" onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      <button
        type="button"
        aria-label={`${stack.name}, ${stack.quantity}`}
        className="grid h-14 w-14 place-items-center border bg-ink/60"
        style={{ borderColor: stack.color }}
      >
        <MaterialMark color={stack.color} tier={stack.tier} />
        <span className="absolute bottom-0.5 right-0.5 bg-ink/90 px-1 text-[10px] font-black leading-none text-zinc-100">{stack.quantity}</span>
      </button>
      {open ? (
        <span role="tooltip" className="absolute bottom-full left-0 z-40 mb-2 w-56 border border-white/15 bg-ink p-2 text-left shadow-lg">
          <span className="block text-[10px] tracking-[0.16em]" style={{ color: stack.color }}>
            {stack.monster.toUpperCase()}
          </span>
          <span className="mt-0.5 block text-sm text-zinc-100">{stack.name}</span>
          <span className="mt-1 block text-xs text-zinc-400">{stack.blurb}</span>
          <span className="mt-1 block text-xs text-zinc-300">Stack of {stack.quantity}</span>
          {stack.quantity > 1 ? (
            <span className="mt-2 flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={stack.quantity - 1}
                value={amount}
                aria-label={`Split ${stack.name}`}
                className="w-14 border border-white/15 bg-ink px-1 py-0.5 text-xs text-zinc-100"
                onChange={(event) => setTake(Number(event.target.value))}
                onClick={(event) => event.stopPropagation()}
              />
              <button type="button" className="border border-white/15 px-2 py-0.5 text-xs text-zinc-200" onClick={() => void onSplit(amount)}>
                Split
              </button>
            </span>
          ) : null}
          {canCombine ? (
            <button type="button" className="mt-2 block text-xs text-gold" onClick={() => void onCombine()}>
              Combine stacks
            </button>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

function offhandBlocked(worn: readonly (RelicView | null)[], slot: number, movingId: string): boolean {
  if (DOLL_SLOTS[slot] !== "offhand") return false;
  const main = worn[slotIndex("weapon")];
  return Boolean(main && main.id !== movingId && pieceOf(main).twoHanded);
}

function writeDrag(event: DragEvent, id: string) {
  event.dataTransfer.setData(MIME, id);
  event.dataTransfer.setData("text/plain", id);
  event.dataTransfer.effectAllowed = "move";
}

function readDrag(event: DragEvent): string {
  return event.dataTransfer.getData(MIME) || event.dataTransfer.getData("text/plain");
}
