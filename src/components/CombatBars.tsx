import { useEffect, useState } from "react";
import type { ActiveFight } from "@/lib/game/snapshot";

export function CombatBars({ fight }: { fight: ActiveFight }) {
  const now = useClock(fight.isPlaying);
  const elapsed = fight.isPlaying ? Math.max(0, now - fight.observedAt) : 0;
  const progress = Math.min(fight.durationMs, fight.progressMs + elapsed);
  const hpLeft = Math.max(0, fight.hpLeft - fight.dps * (elapsed / 1000));
  const hpFraction = fight.hpMax > 0 ? hpLeft / fight.hpMax : 0;
  const trackFraction = fight.durationMs > 0 ? progress / fight.durationMs : 0;

  return (
    <section className="mt-4 border border-white/10 bg-panel/90 p-4">
      <Bar label="Monster HP" value={hpFraction} color={fight.color} detail={`${Math.ceil(hpLeft)} / ${fight.hpMax}`} />
      <Bar label="Track" value={trackFraction} color={fight.color} detail={fight.isPlaying ? "playing" : "paused"} />
    </section>
  );
}

function Bar({ label, value, color, detail }: { label: string; value: number; color: string; detail: string }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[10px] tracking-[0.16em] text-zinc-500">
        <span>{label.toUpperCase()}</span>
        <span className="tracking-normal text-zinc-400">{detail}</span>
      </div>
      <div className="h-2 overflow-hidden bg-white/10">
        <div className="h-full" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function useClock(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [running]);
  return now;
}
