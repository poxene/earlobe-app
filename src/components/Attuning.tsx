import { Logo } from "@/components/Logo";

export function Attuning({ ritual }: { ritual: boolean }) {
  if (!ritual) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Logo />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="attune mb-10" aria-hidden="true">
        <div className="record" />
        <svg className="attune-rings" viewBox="0 0 144 144">
          <g className="attune-spin">
            <circle cx="72" cy="72" r="66" />
            <circle cx="72" cy="72" r="42" />
          </g>
          <g className="attune-spin attune-spin-back">
            <circle cx="72" cy="72" r="54" />
            <circle cx="72" cy="72" r="30" />
          </g>
        </svg>
      </div>
      <h1 className="font-display text-4xl tracking-wide text-gold md:text-5xl">Loading your listening history</h1>
      <p className="mt-3 max-w-sm text-zinc-400">This uses your Last.fm account.</p>
    </div>
  );
}
