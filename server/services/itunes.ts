import { isRecord } from "../../src/lib/isRecord";
import { pickAlbumArt, pickTrackDuration, searchTitle, type AlbumHit, type TrackHit } from "../../src/lib/music/catalogMatch";

const SEARCH = "https://itunes.apple.com/search";

export async function albumArt(artist: string, album: string): Promise<string | null> {
  const rows = await search(`${artist} ${album}`, "album");
  return pickAlbumArt(rows.filter(isAlbum), artist, album);
}

export async function trackDuration(artist: string, track: string, album: string): Promise<number | null> {
  const rows = await search(`${artist} ${searchTitle(track)}`, "song");
  return pickTrackDuration(rows.filter(isTrack), artist, track, album);
}

async function search(term: string, entity: "album" | "song"): Promise<Record<string, unknown>[]> {
  const url = new URL(SEARCH);
  url.searchParams.set("term", term);
  url.searchParams.set("entity", entity);
  url.searchParams.set("limit", "8");
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return [];
  const body: unknown = await response.json().catch(() => null);
  if (!isRecord(body) || !Array.isArray(body.results)) return [];
  return body.results.filter(isRecord);
}

function isAlbum(row: Record<string, unknown>): row is AlbumHit & Record<string, unknown> {
  return typeof row.collectionName === "string";
}

function isTrack(row: Record<string, unknown>): row is TrackHit & Record<string, unknown> {
  return typeof row.trackName === "string";
}
