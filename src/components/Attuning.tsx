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
      <div className="record mb-10 h-36 w-36" aria-hidden="true" />
      <h1 className="font-display text-4xl tracking-wide text-gold md:text-5xl">Loading your listening history</h1>
      <p className="mt-3 max-w-sm text-zinc-400">This uses your Last.fm account.</p>
    </div>
  );
}
