import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Frame } from "@/components/Frame";
import { GoldAmount } from "@/components/Gold";
import { RelicCard } from "@/components/RelicCard";
import { useCharacter } from "@/hooks/useCharacter";
import { useGameSync } from "@/hooks/useGameSync";
import { ApiError, apiSend } from "@/lib/api";
import { isRecord } from "@/lib/isRecord";
import { nextRarity, RARITY_COLOR, SELL_PRICE, type Rarity } from "@/lib/game/loot";

export function ShopPage() {
  const character = useCharacter();
  const queryClient = useQueryClient();
  useGameSync();
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
    } catch {
      setNote("Couldn't upgrade those items.");
    }
  }

  return (
    <Frame>
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        <p className="text-[11px] tracking-[0.35em] text-zinc-500">SHOP</p>
        <h1 className="mt-1 font-display text-6xl tracking-wide">Shop</h1>
        <p className="mt-3 max-w-xl text-sm text-zinc-400">
          Sell extra items for gold. Turn in 3 of one rarity for 1 of the next rarity. Mythic items are only made this way. Equipped items stay on the character.
        </p>
        {sheet ? (
          <p className="mt-4 text-sm tracking-[0.16em]">
            <GoldAmount amount={sheet.echoes} labeled />
          </p>
        ) : null}
        {note ? <p className="mt-3 text-sm text-gold">{note}</p> : null}
        {ready && next && rarity ? (
          <button type="button" onClick={() => void turnIn()} className="mt-4 border border-gold/50 px-4 py-2 text-sm text-gold">
            Turn in 3 {rarity} for a <span style={{ color: RARITY_COLOR[next] }}>{next}</span>
          </button>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">Choose three of the same rarity to turn them in.</p>
        )}
        {bag.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500">No extra items. Equipped items stay on the character sheet.</p>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {bag.map((relic) => (
              <li key={relic.id}>
                <RelicCard
                  relic={relic}
                  selected={picked.includes(relic.id)}
                  onSelect={() => toggle(relic.id, relic.rarity)}
                  action={`Sell · ${SELL_PRICE[relic.rarity]} gold`}
                  onAction={() => void sell(relic.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </Frame>
  );
}
