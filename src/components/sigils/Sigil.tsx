import type { Motif } from "@/lib/game/bestiary";

export function Sigil({ motif, color, size = 48 }: { motif: Motif; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <MotifShape motif={motif} color={color} />
    </svg>
  );
}

function MotifShape({ motif, color }: { motif: Motif; color: string }) {
  const stroke = { fill: "none" as const, stroke: color, strokeWidth: 1.6 };
  if (motif === "horns") {
    return (
      <>
        <path d="M14 36 L24 8 L28 20 L18 36 Z" fill={color} />
        <path d="M34 36 L24 8 L20 20 L30 36 Z" fill={color} opacity="0.7" />
      </>
    );
  }
  if (motif === "hex") {
    return <polygon points="24,6 40,15 40,33 24,42 8,33 8,15" {...stroke} />;
  }
  if (motif === "dagger") {
    return <path d="M30 8 C18 14 14 22 18 36 C22 28 26 22 34 18 Z" fill={color} />;
  }
  if (motif === "ring") {
    return (
      <>
        <circle cx="24" cy="24" r="14" {...stroke} />
        <circle cx="24" cy="24" r="4" fill={color} />
      </>
    );
  }
  if (motif === "spiral") {
    return <path d="M24 24 m0 -4 a4 4 0 1 1 -1 8 a8 8 0 1 0 2 -15 a12 12 0 1 1 -3 23" {...stroke} />;
  }
  if (motif === "fist") {
    return <rect x="12" y="12" width="24" height="24" fill={color} />;
  }
  if (motif === "wave") {
    return <path d="M6 30 C14 18 18 18 24 26 C30 34 34 34 42 22" {...stroke} />;
  }
  if (motif === "claw") {
    return (
      <>
        <path d="M14 40 L18 10" {...stroke} />
        <path d="M24 40 L24 8" {...stroke} />
        <path d="M34 40 L30 10" {...stroke} />
      </>
    );
  }
  if (motif === "eye") {
    return (
      <>
        <ellipse cx="24" cy="24" rx="16" ry="10" {...stroke} />
        <circle cx="24" cy="24" r="4" fill="none" stroke={color} strokeWidth="1.6" />
      </>
    );
  }
  if (motif === "star") {
    return <polygon points="24,6 28,18 42,18 31,27 35,40 24,32 13,40 17,27 6,18 20,18" fill={color} />;
  }
  return <polygon points="24,6 40,20 30,42 12,34" fill={color} />;
}
