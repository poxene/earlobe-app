export function EqualizerBars({ active, color }: { active: boolean; color?: string }) {
  return (
    <span className={active ? "eq eq-on" : "eq"} style={{ ["--eq" as string]: color ?? "#d4a24e" }} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
