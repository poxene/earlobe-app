import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { ApiError } from "@/lib/api";
import { isRecord } from "@/lib/isRecord";
import { useTopArtists } from "@/hooks/useTopArtists";

export function Debug() {
  const query = useTopArtists();

  useEffect(() => {
    document.title = "Top artists — Earlo.be";
  }, []);

  const count = artistCount(query.data);
  const code = query.error instanceof ApiError ? query.error.code : null;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        <p className="text-[11px] tracking-[0.28em] text-zinc-500">DEBUG</p>
        <h1 className="mt-1 font-display text-5xl tracking-wide">Raw top artists</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Six months, straight from Last.fm{count !== null ? ` · ${count} artists` : ""}.
        </p>
        {query.isPending ? <p className="mt-8 text-zinc-300">Loading top artists.</p> : null}
        {code === "unauthenticated" || code === "reconnect_required" ? (
          <p className="mt-8 text-zinc-300">
            Last.fm needs you to sign in again.{" "}
            <a className="text-gold underline underline-offset-4" href="/auth/lastfm?reconnect=1">
              Reconnect
            </a>
          </p>
        ) : null}
        {query.isError && code !== "unauthenticated" && code !== "reconnect_required" ? (
          <p className="mt-8 text-zinc-300">Couldn't load top artists.</p>
        ) : null}
        {query.data ? (
          <pre className="mt-6 max-h-[70dvh] overflow-auto border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-zinc-300">
            {JSON.stringify(query.data, null, 2)}
          </pre>
        ) : null}
        <p className="mt-6 text-sm">
          <Link to="/" className="text-gold underline underline-offset-4">
            Back to the sheet
          </Link>
        </p>
      </main>
    </>
  );
}

function artistCount(data: unknown): number | null {
  if (!isRecord(data) || !isRecord(data.topartists)) return null;
  const artists = data.topartists.artist;
  if (Array.isArray(artists)) return artists.length;
  if (isRecord(artists)) return 1;
  return 0;
}
