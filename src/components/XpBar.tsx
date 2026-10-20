export function XpBar({
  into,
  span,
  fraction,
  color,
}: {
  into: number;
  span: number;
  fraction: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-[11px] tracking-[0.22em] text-zinc-500">
        <span>XP</span>
        <span className="tabular-nums text-zinc-300">
          {into} / {span}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden bg-white/10"
        role="progressbar"
        aria-label="Experience"
        aria-valuemin={0}
        aria-valuemax={span}
        aria-valuenow={into}
      >
        <div className="fill-bar h-full" style={{ width: `${fraction * 100}%`, background: color }} />
      </div>
    </div>
  );
}
