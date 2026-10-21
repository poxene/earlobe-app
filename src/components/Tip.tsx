import { useId, useState, type ReactNode } from "react";

export function Tip({ label, text, className }: { label: ReactNode; text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        className={className ?? "text-xs tracking-[0.18em] text-zinc-400 underline decoration-white/20 decoration-dotted underline-offset-4"}
      >
        {label}
      </button>
      <span
        id={id}
        role="tooltip"
        className={`${open ? "block" : "hidden"} absolute left-0 top-full z-30 mt-1 w-60 border border-white/15 bg-ink p-2 text-left text-[11px] leading-relaxed tracking-normal text-zinc-300 normal-case group-hover:block`}
      >
        {text}
      </span>
    </span>
  );
}
