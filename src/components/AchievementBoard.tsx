import { achievementsFor, type AchievementView, type StageMark } from "@/lib/game/achievements";
import type { Rarity } from "@/lib/game/loot";

const MARK: Record<StageMark, string> = {
  earned: "h-1.5 w-1.5 rounded-full bg-gold",
  current: "h-2 w-2 rounded-full border border-gold bg-gold/40",
  ahead: "h-1.5 w-1.5 rounded-full bg-white/15",
};

export function AchievementBoard({
  listens,
  victories,
  highestEcho,
  albumsFinished,
  relics,
}: {
  listens: number;
  victories: number;
  highestEcho: number;
  albumsFinished: number;
  relics: readonly ({ id: string; rarity: Rarity; gearSlug?: string | null } | null)[];
}) {
  const cards = achievementsFor({ listens, victories, highestEcho, albumsFinished, relics });
  const started = cards.filter((card) => card.earned).length;

  return (
    <div>
      <h2 className="text-[11px] tracking-[0.28em] text-zinc-500">ACHIEVEMENTS</h2>
      <p className="mt-2 text-sm text-zinc-400">
        {started} of {cards.length} started.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {cards.map((card) => (
          <AchievementCard key={card.id} card={card} />
        ))}
      </ul>
    </div>
  );
}

function AchievementCard({ card }: { card: AchievementView }) {
  return (
    <li className={`border px-3 py-3 ${card.earned ? "border-gold/50 bg-gold/5" : "border-white/10"}`}>
      <p className="text-[10px] tracking-[0.18em] text-zinc-500">{card.name.toUpperCase()}</p>
      <p className={`mt-1 font-display text-3xl leading-none ${card.earned ? "text-gold" : "text-zinc-300"}`}>{card.title}</p>
      <p className="mt-1 text-xs text-zinc-400">{card.detail}</p>
      <ol className="mt-3 flex flex-wrap items-center gap-1">
        {card.marks.map((mark) => (
          <li key={mark.label} title={mark.label} className={MARK[mark.state]} />
        ))}
      </ol>
    </li>
  );
}
