import { useEffect, useState } from "react";
import { EqualizerBars } from "@/components/EqualizerBars";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { useGameSync } from "@/hooks/useGameSync";
import type { NowPlaying } from "@/lib/music/provider";

export function NowPlayingDock({ expanded = false }: { expanded?: boolean }) {
  const query = useNowPlaying();
  const sync = useGameSync();
  const fight = sync.data?.fight ?? null;
  const track = query.data;

  if (query.isPending) return <Quiet label="NOW PLAYING" note="Checking Last.fm." />;
  if (query.isError) return <Quiet label="QUIET" note="Couldn't reach Last.fm." />;
  if (!track) return <Quiet label="QUIET" note="Nothing is playing." />;

  const color = fight && fight.trackId === track.trackId ? fight.color : "#d4a24e";
  return <PlayingTrack track={track} color={color} expanded={expanded} />;
}

function PlayingTrack({ track, color, expanded }: { track: NowPlaying; color: string; expanded: boolean }) {
  const progress = useSmoothedProgress(track);
  const fraction = track.durationMs > 0 ? Math.min(1, progress / track.durationMs) : 0;
  const artists = track.artistNames.join(", ");

  return (
    <aside className="w-36 shrink-0 self-end sm:w-52">
      {expanded ? <Cover url={track.albumImageUrl} large /> : null}
      <p className="flex items-center gap-1.5 whitespace-nowrap text-[10px] tracking-[0.14em]" style={{ color }}>
        <EqualizerBars active={track.isPlaying} color={color} />
        {track.isPlaying ? "NOW PLAYING" : "PAUSED"}
      </p>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        {expanded ? null : <Cover url={track.albumImageUrl} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-zinc-100" title={track.trackName}>
            {track.trackName}
          </p>
          <p className="truncate text-[11px] text-zinc-500" title={artists || track.albumName}>
            {artists || track.albumName}
          </p>
          <Progress fraction={fraction} color={color} progress={progress} durationMs={track.durationMs} />
        </div>
      </div>
    </aside>
  );
}

function Cover({ url, large = false }: { url: string | null; large?: boolean }) {
  const frame = large ? "mb-2 aspect-square w-full" : "h-8 w-8 shrink-0";
  if (!url) return <div className={`${frame} bg-white/5`} />;
  return <img src={url} alt="" className={`${frame} object-cover`} />;
}

function Progress({
  fraction,
  color,
  progress,
  durationMs,
}: {
  fraction: number;
  color: string;
  progress: number;
  durationMs: number;
}) {
  return (
    <div
      className="mt-1 h-0.5 overflow-hidden bg-white/10"
      role="progressbar"
      aria-label="Track progress"
      aria-valuemin={0}
      aria-valuemax={durationMs}
      aria-valuenow={Math.round(progress)}
    >
      <div className="h-full" style={{ width: `${fraction * 100}%`, background: color }} />
    </div>
  );
}

function Quiet({ label, note }: { label: string; note: string }) {
  return (
    <aside className="w-36 shrink-0 self-end sm:w-52">
      <p className="shrink-0 whitespace-nowrap text-[10px] tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-xs text-zinc-500">{note}</p>
    </aside>
  );
}

function useSmoothedProgress(track: NowPlaying): number {
  const [progress, setProgress] = useState(track.progressMs);

  useEffect(() => {
    setProgress(track.progressMs);
    if (!track.isPlaying) return;
    const started = performance.now();
    const base = track.progressMs;
    const id = window.setInterval(() => {
      setProgress(Math.min(track.durationMs || Number.POSITIVE_INFINITY, base + performance.now() - started));
    }, 500);
    return () => window.clearInterval(id);
  }, [track.trackId, track.progressMs, track.isPlaying, track.durationMs]);

  return progress;
}
