import type { MaterialTier } from "@/lib/game/materials";

export function MaterialMark({ color, tier }: { color: string; tier: MaterialTier }) {
  return (
    <svg viewBox="0 0 16 16" className="h-8 w-8" aria-hidden>
      {tier === 0 ? <path d="M3.2 11.2 5.4 5.2h2.2L9.6 8.4 8.8 13H4.2Z" fill={color} /> : null}
      {tier === 1 ? <path d="M8 1.8 12.2 8 8 14.2 3.8 8Z" fill={color} /> : null}
      {tier === 2 ? (
        <path d="M8 1.2 9.7 5.8 14.6 6.2 10.8 9.2 12 14 8 11.4 4 14 5.2 9.2 1.4 6.2 6.3 5.8Z" fill={color} />
      ) : null}
    </svg>
  );
}
