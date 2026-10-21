import { isRecord } from "../../src/lib/isRecord";
import { albumArt } from "./itunes";

const AGENT = "earlo.be/1.0 (https://earlo.be)";
const PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

const cache = new Map<string, string | null>();
let chain: Promise<void> = Promise.resolve();

export function usableImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes(PLACEHOLDER)) return null;
  return url;
}

export function cachedCover(artist: string, album: string): string | null {
  if (!artist.trim() || !album.trim()) return null;
  return cache.get(keyOf(artist, album)) ?? null;
}

export function rememberedCover(artist: string, album: string): string | null | undefined {
  if (!artist.trim() || !album.trim()) return null;
  const key = keyOf(artist, album);
  if (!cache.has(key)) return undefined;
  return cache.get(key) ?? null;
}

export async function coverFor(artist: string, album: string): Promise<string | null> {
  if (!artist.trim() || !album.trim()) return null;
  const key = keyOf(artist, album);
  if (cache.has(key)) return cache.get(key) ?? null;
  const run = chain.then(async () => {
    if (cache.has(key)) return cache.get(key) ?? null;
    try {
      const found = await lookup(artist.trim(), album.trim());
      if (found.settled) cache.set(key, found.url);
      return found.url;
    } catch {
      return null;
    } finally {
      await wait(1100);
    }
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function lookup(artist: string, album: string): Promise<{ url: string | null; settled: boolean }> {
  let catalog: string | null = null;
  let catalogSettled = false;
  try {
    catalog = await releaseArt(artist, album);
    catalogSettled = true;
  } catch {
    catalogSettled = false;
  }
  if (catalog) return { url: catalog, settled: true };
  try {
    const found = await albumArt(artist, album);
    if (found || catalogSettled) return { url: found, settled: true };
    return { url: null, settled: false };
  } catch {
    return { url: null, settled: false };
  }
}

async function releaseArt(artist: string, album: string): Promise<string | null> {
  const search = new URL("https://musicbrainz.org/ws/2/release-group");
  search.searchParams.set("query", `releasegroup:"${lucene(album)}" AND artist:"${lucene(artist)}"`);
  search.searchParams.set("fmt", "json");
  search.searchParams.set("limit", "1");
  const response = await fetch(search, {
    headers: { "User-Agent": AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 503 || response.status === 429) throw new Error("musicbrainz busy");
  if (!response.ok) return null;
  const id = releaseGroupId(await response.json());
  if (!id) return null;
  const art = `https://coverartarchive.org/release-group/${id}/front-250`;
  const probe = await fetch(art, {
    method: "GET",
    redirect: "manual",
    headers: { "User-Agent": AGENT },
    signal: AbortSignal.timeout(8000),
  });
  if (probe.status === 404) return null;
  if (probe.ok || (probe.status >= 300 && probe.status < 400)) return art;
  if (probe.status === 503 || probe.status === 429) throw new Error("cover art busy");
  return null;
}

function releaseGroupId(body: unknown): string | null {
  if (!isRecord(body)) return null;
  const groups = body["release-groups"];
  if (!Array.isArray(groups) || !isRecord(groups[0]) || typeof groups[0].id !== "string") return null;
  const score = typeof groups[0].score === "number" ? groups[0].score : 100;
  if (score < 90) return null;
  return groups[0].id;
}

function lucene(value: string): string {
  return value.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, "\\$&");
}

function keyOf(artist: string, album: string): string {
  return `${artist.trim().toLowerCase()}\n${album.trim().toLowerCase()}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
