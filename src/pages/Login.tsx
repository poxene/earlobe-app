import { useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";

const LOGIN_ERRORS: Record<string, string> = {
  access_denied: "Last.fm login was cancelled.",
  state: "Login expired. Try again.",
  oauth: "Last.fm login failed.",
};

export function Login() {
  const [params] = useSearchParams();
  const code = params.get("error");
  const message = code ? (LOGIN_ERRORS[code] ?? LOGIN_ERRORS.oauth) : null;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-x-hidden px-6 py-16">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-[54%] rounded-full bg-[radial-gradient(circle,rgba(11,131,89,0.2),transparent_66%)]"
        aria-hidden="true"
      />
      <div className="relative flex w-full min-w-0 max-w-lg flex-col items-center text-center">
        <h1>
          <Logo size="lg" />
        </h1>
        <p className="mt-4 max-w-full text-balance font-logo text-lg font-light tracking-[0.08em] text-zinc-300 sm:text-xl sm:tracking-[0.12em]">
          level up your taste in music.
        </p>
        {message ? (
          <p className="mt-6 border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold-2" role="alert">
            {message}
          </p>
        ) : null}
        <a
          href="/auth/lastfm"
          className="mt-8 inline-flex items-center justify-center bg-gold px-8 py-3 text-sm font-semibold tracking-wide text-ink hover:bg-gold-2"
        >
          Connect Last.fm
        </a>
        <p className="mt-6 max-w-sm text-sm text-zinc-500">Last.fm is the source of your listening data.</p>
      </div>
    </main>
  );
}
