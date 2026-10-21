export function EqualizerBars({ active, color, compact }: { active: boolean; color?: string; compact?: boolean }) {
  const size = compact ? " eq-sm" : "";
  return (
    <span className={`${active ? "eq eq-on" : "eq"}${size}`} style={{ ["--eq" as string]: color ?? "#d4a24e" }} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
