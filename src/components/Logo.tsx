const SIZES = {
  sm: "text-4xl",
  md: "text-5xl",
  lg: "text-5xl sm:text-6xl md:text-[4.5rem]",
} as const;

export function Logo({ size = "md" }: { size?: keyof typeof SIZES }) {
  return (
    <span className={`inline-flex font-logo font-bold leading-none tracking-[0.04em] ${SIZES[size]}`}>
      <span className="text-zinc-100">ear</span>
      <span className="text-lobe">lo</span>
      <span className="text-zinc-100">.</span>
      <span className="text-lobe">be</span>
    </span>
  );
}
