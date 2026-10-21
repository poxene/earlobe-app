import { ItemIcon } from "@/components/portrait/ItemIcon";
import { Tip } from "@/components/Tip";
import { pieceOf } from "@/lib/portrait/gear";
import { affixLines, type RelicView } from "@/lib/game/character";
import { CUT_LINE, EFFECT_NAME, effectDetail } from "@/lib/game/effects";
import { RARITY_COLOR } from "@/lib/game/loot";

export function RelicCard({
  relic,
  action,
  onAction,
  selected = false,
  onSelect,
}: {
  relic: RelicView;
  action?: string;
  onAction?: () => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const rarityColor = RARITY_COLOR[relic.rarity];
  return (
    <article
      className={`flex gap-3 border bg-ink/40 p-3 ${selected ? "border-gold" : "border-white/10"} ${onSelect ? "cursor-pointer" : ""}`}
      onClick={onSelect}
    >
      <ItemIcon slug={pieceOf(relic).slug} name={relic.name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] tracking-[0.18em]" style={{ color: rarityColor }}>
          {relic.rarity.toUpperCase()}
        </p>
        <p className="truncate text-sm" style={{ color: rarityColor }}>
          {relic.name}
        </p>
        <ul className="mt-1 space-y-0.5">
          {affixLines(relic).map((row, index) => (
            <li key={`${row.stat}-${index}`} className="text-xs text-zinc-400">
              +{row.amount} {row.stat.toUpperCase()}
            </li>
          ))}
        </ul>
        {relic.cut ? <p className="mt-1 text-[11px] text-zinc-500">{CUT_LINE[relic.cut]}</p> : null}
        {(relic.effects ?? []).map((effect) => (
          <p key={effect.id} className="mt-1 text-xs text-gold/90">
            <Tip label={EFFECT_NAME[effect.id]} text={effectDetail(effect.detail)} className="text-xs text-gold/90" />
          </p>
        ))}
        <div className="mt-2 flex gap-3">
          {onSelect ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect();
              }}
              className="text-xs tracking-wide text-zinc-300 hover:text-zinc-100"
            >
              {selected ? "Chosen" : "Choose"}
            </button>
          ) : null}
          {action && onAction ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAction();
              }}
              className="text-xs tracking-wide text-gold hover:text-gold-2"
            >
              {action}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

