import { useEffect, useState } from "react";
import { EqualizerBars } from "@/components/EqualizerBars";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { useGameSync } from "@/hooks/useGameSync";
import type { NowPlaying } from "@/lib/music/provider";

export function NowPlayingBar() {
  const query = useNowPlaying();
  const sync = useGameSync();
  const fight = sync.data?.fight ?? null;

  return (
    <section className="mx-auto mb-2 w-full max-w-5xl px-4 md:px-8">
      {query.isPending ? <QuietLine>Checking Last.fm.</QuietLine> : null}
      {query.isError ? <QuietLine>Couldn't reach Last.fm.</QuietLine> : null}
      {query.isSuccess && query.data === null ? <QuietLine>Nothing is playing.</QuietLine> : null}
      {query.data ? (
        <PlayingTrack
          track={query.data}
          color={fight && fight.trackId === query.data.trackId ? fight.color : "#d4a24e"}
        />
      ) : null}
    </section>
  );
}

function PlayingTrack({ track, color }: { track: NowPlaying; color: string }) {
  const progress = useSmoothedProgress(track);
  const fraction = track.durationMs > 0 ? Math.min(1, progress / track.durationMs) : 0;
  const artists = track.artistNames.join(", ");

  return (
    <div className="flex items-center gap-3 border border-white/10 bg-panel/90 p-3">
      {track.albumImageUrl ? (
        <img
          src={track.albumImageUrl}
          alt=""
          className="h-14 w-14 shrink-0 object-cover"
        />
      ) : (
        <div className="h-14 w-14 shrink-0 bg-white/5" />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[11px] tracking-[0.22em]" style={{ color }}>
          <EqualizerBars active={track.isPlaying} color={color} />
          {track.isPlaying ? "NOW PLAYING" : "PAUSED"}
        </p>
        <p className="truncate text-base text-zinc-100">{track.trackName}</p>
        <p className="truncate text-sm text-zinc-400">{artists || track.albumName}</p>
        <div
          className="mt-2 h-1 overflow-hidden bg-white/10"
          role="progressbar"
          aria-label="Track progress"
          aria-valuemin={0}
          aria-valuemax={track.durationMs}
          aria-valuenow={Math.round(progress)}
        >
          <div className="h-full" style={{ width: `${fraction * 100}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function QuietLine({ children }: { children: string }) {
  return <p className="border border-white/10 bg-panel/80 px-3 py-3 text-sm text-zinc-400">{children}</p>;
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
