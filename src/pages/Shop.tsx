import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Frame } from "@/components/Frame";
import { GoldAmount } from "@/components/Gold";
import { RelicCard } from "@/components/RelicCard";
import { useCharacter } from "@/hooks/useCharacter";
import { useGameSync } from "@/hooks/useGameSync";
import { ApiError, apiSend } from "@/lib/api";
import { isRecord } from "@/lib/isRecord";
import { nextRarity, RARITY_COLOR, SELL_PRICE, type Rarity } from "@/lib/game/loot";
import { TRANSMUTE_COST, transmuteMonster } from "@/lib/game/materials";

type Stall = "vendor" | "wizard" | "herbalist" | "blacksmith";

const STALL_TITLE: Record<Stall, string> = {
  vendor: "Vendor",
  wizard: "Wizard",
  herbalist: "Herbalist",
  blacksmith: "Blacksmith",
};

export function TownPage() {
  const character = useCharacter();
  const queryClient = useQueryClient();
  useGameSync();
  const [stall, setStall] = useState<Stall | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const sheet = character.data;
  const worn = new Set((sheet?.relics ?? []).flatMap((relic) => (relic ? [relic.id] : [])));
  const bag = (sheet?.inventory ?? []).filter((relic) => !worn.has(relic.id));
  const chosen = bag.filter((relic) => picked.includes(relic.id));
  const rarity = chosen[0]?.rarity;
  const same = rarity !== undefined && chosen.every((relic) => relic.rarity === rarity);
  const next = rarity ? nextRarity(rarity) : null;
  const ready = chosen.length === 3 && same && next !== null;
  const monster = transmuteMonster(chosen);
  const cost = rarity && rarity !== "mythic" ? TRANSMUTE_COST[rarity] : null;
  const held = (sheet?.stacks ?? []).filter((stack) => stack.monster === monster).reduce((sum, stack) => sum + stack.quantity, 0);
  const affordable = Boolean(sheet && cost && sheet.echoes >= cost.gold && held >= (cost?.materials ?? 0));

  function toggle(id: string, itemRarity: Rarity) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id);
      const held = bag.filter((relic) => current.includes(relic.id));
      if (held.some((relic) => relic.rarity !== itemRarity)) return [id];
      if (held.length >= 3) return current;
      return [...current, id];
    });
  }

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["character"] }),
      queryClient.invalidateQueries({ queryKey: ["sync"] }),
    ]);
  }

  async function sell(id: string) {
    try {
      const body = await apiSend("/api/shop/sell", "POST", { relicId: id });
      const price = isRecord(body) && typeof body.price === "number" ? body.price : 0;
      setPicked((current) => current.filter((entry) => entry !== id));
      setNote(`Sold for ${price} gold.`);
      await refresh();
    } catch (error) {
      setNote(error instanceof ApiError && error.code === "relic_equipped" ? "Unequip it first." : "Couldn't sell that.");
    }
  }

  async function turnIn() {
    if (chosen.length !== 3 || !next) return;
    try {
      const body = await apiSend("/api/shop/upgrade", "POST", { relicIds: chosen.map((relic) => relic.id) });
      const name = isRecord(body) && typeof body.name === "string" ? body.name : "New item";
      setPicked([]);
      setNote(`Received ${name}.`);
      await refresh();
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "";
      setNote(code === "not_enough_gold" ? "Not enough gold." : code === "not_enough_materials" ? "Not enough materials." : "Couldn't upgrade those items.");
    }
  }

  function leave() {
    setStall(null);
    setPicked([]);
    setNote("");
  }

  return (
    <Frame>
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        <p className="text-[11px] tracking-[0.35em] text-zinc-500">TOWN</p>
        <h1 className="mt-1 font-display text-6xl tracking-wide">{stall ? STALL_TITLE[stall] : "Town"}</h1>
        {stall ? (
          <button type="button" onClick={leave} className="mt-3 text-sm text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-100">
            Back to town
          </button>
        ) : (
          <p className="mt-3 max-w-xl text-sm text-zinc-400">Equipped relics stay on the character.</p>
        )}
        {sheet ? (
          <p className="mt-4 text-sm tracking-[0.16em]">
            <GoldAmount amount={sheet.echoes} labeled />
          </p>
        ) : null}
        {note ? <p className="mt-3 text-sm text-gold">{note}</p> : null}

        {stall === null ? (
          <ul className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <li>
                <StallButton title="Vendor" detail="Buys spare relics for gold." onClick={() => setStall("vendor")}>
                  <VendorFigure />
                </StallButton>
              </li>
              <li>
                <StallButton title="Wizard" detail="Turns three relics into one of the next rarity." onClick={() => setStall("wizard")}>
                  <WizardFigure />
                </StallButton>
              </li>
              <li>
                <StallButton title="Herbalist" detail="Herbs and tinctures." onClick={() => setStall("herbalist")}>
                  <HerbalistFigure />
                </StallButton>
              </li>
              <li>
                <StallButton title="Blacksmith" detail="Metalwork and repairs." onClick={() => setStall("blacksmith")}>
                  <BlacksmithFigure />
                </StallButton>
              </li>
          </ul>
        ) : null}

        {stall === "vendor" ? (
          bag.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">No spare relics. Equipped relics stay on the character.</p>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {bag.map((relic) => (
                <li key={relic.id}>
                  <RelicCard
                    relic={relic}
                    action={`Sell · ${SELL_PRICE[relic.rarity]} gold`}
                    onAction={() => void sell(relic.id)}
                  />
                </li>
              ))}
            </ul>
          )
        ) : null}

        {stall === "wizard" ? (
          <>
            <p className="mt-4 max-w-xl text-sm text-zinc-400">
              Choose three of the same rarity. The craft costs gold and materials from the monster it follows. Mythic relics are only made this way.
            </p>
            {ready && next && rarity && cost && monster ? (
              <>
                <p className="mt-4 text-sm text-zinc-300">
                  {cost.gold} gold and {cost.materials} {monster} materials. You have {held}.
                </p>
                <button
                  type="button"
                  disabled={!affordable}
                  onClick={() => void turnIn()}
                  className="mt-3 border border-gold/50 px-4 py-2 text-sm text-gold disabled:opacity-40"
                >
                  Turn in 3 {rarity} for a <span style={{ color: RARITY_COLOR[next] }}>{next}</span>
                </button>
              </>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">Choose three of the same rarity to turn them in.</p>
            )}
            {bag.length === 0 ? (
              <p className="mt-6 text-sm text-zinc-500">No spare relics to transmute.</p>
            ) : (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {bag.map((relic) => (
                  <li key={relic.id}>
                    <RelicCard
                      relic={relic}
                      selected={picked.includes(relic.id)}
                      onSelect={() => toggle(relic.id, relic.rarity)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}

        {stall === "herbalist" ? (
          <p className="mt-6 max-w-xl text-sm text-zinc-400">The herbalist is sorting the shelves. There is nothing to buy yet.</p>
        ) : null}
        {stall === "blacksmith" ? (
          <p className="mt-6 max-w-xl text-sm text-zinc-400">The blacksmith is banking the forge. There is nothing to commission yet.</p>
        ) : null}
      </main>
    </Frame>
  );
}

function StallButton({ title, detail, onClick, children }: { title: string; detail: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full w-full items-center gap-2 border border-white/10 bg-panel/80 px-2 py-1.5 text-left hover:border-gold/50"
    >
      {children}
      <span className="min-w-0">
        <span className="block font-display text-xl leading-none tracking-wide">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-zinc-500">{detail}</span>
      </span>
    </button>
  );
}

function VendorFigure() {
  return (
    <svg viewBox="0 0 80 100" className="h-9 w-7 shrink-0" aria-hidden>
      <circle cx="40" cy="90" r="12" fill="#14110e" />
      <path d="M16 48 C22 36 30 42 40 50 C50 42 58 36 64 48 L68 90 H12 Z" fill="#6b4423" />
      <path d="M28 50 L40 44 L52 50 L50 78 H30 Z" fill="#c4894a" opacity="0.45" />
      <circle cx="40" cy="28" r="14" fill="#e6c2a2" />
      <path d="M26 26 Q40 16 54 26" fill="#3d2914" />
      <circle cx="35" cy="29" r="1.6" fill="#1a140f" />
      <circle cx="45" cy="29" r="1.6" fill="#1a140f" />
      <circle cx="62" cy="64" r="7" fill="#e2b15a" stroke="#8a6420" strokeWidth="1.2" />
      <path d="M62 60.5v7M59.6 62.2h3.2a1.5 1.5 0 0 1 0 3h-2.2" fill="none" stroke="#6b4a16" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function WizardFigure() {
  return (
    <svg viewBox="0 0 80 100" className="h-9 w-7 shrink-0" aria-hidden>
      <circle cx="40" cy="90" r="12" fill="#14110e" />
      <path d="M22 52 L40 22 L58 52 L64 90 H16 Z" fill="#3a3168" />
      <path d="M33 24 L40 6 L47 24 Z" fill="#3a3168" />
      <circle cx="40" cy="14" r="2.4" fill="#e2b15a" />
      <circle cx="40" cy="38" r="11" fill="#e6c2a2" />
      <circle cx="36" cy="37" r="1.4" fill="#1a140f" />
      <circle cx="44" cy="37" r="1.4" fill="#1a140f" />
      <path d="M24 72 L12 96" stroke="#c9a15b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="12" cy="96" r="2.2" fill="#7ec8c8" />
    </svg>
  );
}

function HerbalistFigure() {
  return (
    <svg viewBox="0 0 80 100" className="h-9 w-7 shrink-0" aria-hidden>
      <circle cx="40" cy="90" r="12" fill="#14110e" />
      <path d="M18 50 C24 38 32 44 40 52 C48 44 56 38 62 50 L66 90 H14 Z" fill="#386641" />
      <circle cx="40" cy="30" r="13" fill="#e6c2a2" />
      <path d="M27 28 Q40 18 53 28" fill="#2d4a32" />
      <path d="M48 18 C54 8 62 16 58 26" fill="none" stroke="#6a994e" strokeWidth="2" />
      <circle cx="60" cy="14" r="3" fill="#a7c957" />
      <circle cx="35" cy="31" r="1.4" fill="#1a140f" />
      <circle cx="45" cy="31" r="1.4" fill="#1a140f" />
    </svg>
  );
}

function BlacksmithFigure() {
  return (
    <svg viewBox="0 0 80 100" className="h-9 w-7 shrink-0" aria-hidden>
      <circle cx="40" cy="90" r="12" fill="#14110e" />
      <path d="M18 48 H62 L66 90 H14 Z" fill="#3d2914" />
      <path d="M26 48 H54 L52 78 H28 Z" fill="#6b4423" />
      <circle cx="40" cy="30" r="13" fill="#e6c2a2" />
      <path d="M26 26 H54 V32 H26 Z" fill="#1a140f" />
      <circle cx="35" cy="32" r="1.4" fill="#1a140f" />
      <circle cx="45" cy="32" r="1.4" fill="#1a140f" />
      <path d="M58 58 H74 V64 H58 Z" fill="#9aa3a8" />
      <path d="M70 52 H76 V70 H70 Z" fill="#6b7280" />
    </svg>
  );
}
