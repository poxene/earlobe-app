//— last.fm often has no art or length for a classical album. a public catalog can fill both when the title matches.

export type AlbumHit = {
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
};

export type TrackHit = {
  artistName?: string;
  collectionName?: string;
  trackName?: string;
  trackTimeMillis?: number;
};

const STOP = new Set(["the", "a", "an", "of", "and", "in", "op", "no", "vol"]);

export function enlargeArt(url: string): string {
  return url.replace(/\d+x\d+bb/, "600x600bb");
}

export function pickAlbumArt(rows: AlbumHit[], artist: string, album: string): string | null {
  for (const row of rows) {
    if (!row.artworkUrl100 || !row.collectionName) continue;
    if (!sameRelease(album, artist, row.collectionName, row.artistName ?? "")) continue;
    return enlargeArt(row.artworkUrl100);
  }
  return null;
}

export function pickTrackDuration(rows: TrackHit[], artist: string, track: string, album: string): number | null {
  let fallback: number | null = null;
  for (const row of rows) {
    const ms = heardLength(row);
    if (ms === null || !row.trackName || !sameTitle(track, row.trackName)) continue;
    if (album && row.collectionName && sameTitle(album, row.collectionName)) return ms;
    if (sharesName(artist, row.artistName ?? "", row.collectionName ?? "")) return ms;
    if (fallback === null) fallback = ms;
  }
  if (fallback !== null) return fallback;
  return looseVariation(rows, track);
}

export function searchTitle(track: string): string {
  return track
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looseVariation(rows: TrackHit[], track: string): number | null {
  const move = movement(track);
  if (!move) return null;
  const want = tokens(track);
  let best: { ms: number; shared: number } | null = null;
  for (const row of rows) {
    const ms = heardLength(row);
    if (ms === null || !row.trackName || movement(row.trackName) !== move) continue;
    const shared = want.filter((token) => tokens(row.trackName ?? "").includes(token)).length;
    if (shared < 4) continue;
    if (!best || shared > best.shared) best = { ms, shared };
  }
  return best?.ms ?? null;
}

function heardLength(row: TrackHit): number | null {
  const ms = row.trackTimeMillis;
  if (typeof ms !== "number" || ms < 5_000 || ms > 3 * 60 * 60 * 1000) return null;
  return Math.round(ms);
}

function movement(title: string): string | null {
  const match = norm(title).match(/\bvariation (\d+)\b/);
  return match?.[1] ? `variation ${match[1]}` : null;
}

function sameRelease(album: string, artist: string, collection: string, hitArtist: string): boolean {
  if (!sameTitle(album, collection)) return false;
  if (tokens(album).length >= 3) return true;
  return sharesName(artist, hitArtist, collection);
}

function sameTitle(left: string, right: string): boolean {
  const a = norm(left);
  const b = norm(right);
  if (!a || !b) return false;
  return a === b || tokens(a).join(" ") === tokens(b).join(" ");
}

function sharesName(artist: string, hitArtist: string, collection: string): boolean {
  const haystack = `${norm(hitArtist)} ${norm(collection)}`;
  return tokens(artist).some((token) => haystack.includes(token));
}

function tokens(value: string): string[] {
  return norm(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP.has(token));
}

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
