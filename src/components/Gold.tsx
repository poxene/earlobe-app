export function GoldMark({ className = "h-3.5 w-3.5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6.2" fill="#e2b15a" stroke="#8a6420" strokeWidth="1.1" />
      <circle cx="8" cy="8" r="4.3" fill="none" stroke="#f6dd9a" strokeWidth="0.8" />
      <path
        d="M8 4.4v7.2M6.2 6h2.7a1.4 1.4 0 0 1 0 2.8H6.5a1.4 1.4 0 0 0 0 2.8H10"
        fill="none"
        stroke="#6b4a16"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GoldAmount({
  amount,
  labeled = false,
  className = "",
}: {
  amount: number;
  labeled?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 text-gold ${className}`}>
      <GoldMark />
      <span>
        {amount.toLocaleString()}
        {labeled ? " gold" : ""}
      </span>
    </span>
  );
}
