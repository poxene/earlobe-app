import { parseEntityId } from "../../src/lib/music/lastfmIds";
import { asRecords, lastfmImage } from "../../src/lib/music/mapLastfm";
import { isRecord } from "../../src/lib/isRecord";
import { familiesForArtist } from "../../src/lib/music/normalize";
import { getSupabase } from "../supabase";
import { ReconnectRequired } from "../errors";
import { lastfmCall } from "./lastfmClient";

type CachedArtist = {
  name: string;
  genres: string[];
  followers: number;
  imageUrl: string | null;
};

export async function familiesForArtists(artistIds: string[]): Promise<string[]> {
  const cache = await loadArtists(artistIds);
  const primary = familiesForArtist(cache.get(artistIds[0] ?? "")?.genres ?? []);
  if (primary[0] !== "Unmapped") return primary;
  const guests = artistIds.slice(1).flatMap((id) => cache.get(id)?.genres ?? []);
  const featured = familiesForArtist(guests);
  return featured[0] !== "Unmapped" ? featured : primary;
}

export async function loadArtists(artistIds: string[]): Promise<Map<string, CachedArtist>> {
  const unique = [...new Set(artistIds.filter(Boolean))];
  const found = new Map<string, CachedArtist>();
  if (unique.length === 0) return found;
  const { data, error } = await getSupabase().from("artist_cache").select("*").in("artist_id", unique);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    found.set(row.artist_id, {
      name: row.name,
      genres: row.genres,
      followers: row.followers,
      imageUrl: row.image_url,
    });
  }
  const rows = [];
  for (const id of unique.filter((artistId) => !found.has(artistId))) {
    const name = artistName(id);
    if (!name) continue;
    try {
      const parsed = parseArtist(id, await lastfmCall({ method: "artist.getInfo", artist: name }));
      if (!parsed) continue;
      found.set(id, parsed.cached);
      rows.push(parsed.row);
    } catch (fetchError) {
      if (fetchError instanceof ReconnectRequired) throw fetchError;
    }
  }
  if (rows.length > 0) {
    const saved = await getSupabase().from("artist_cache").upsert(rows);
    if (saved.error) throw new Error(saved.error.message);
  }
  return found;
}

function parseArtist(id: string, payload: unknown): { cached: CachedArtist; row: {
  artist_id: string;
  name: string;
  genres: string[];
  followers: number;
  image_url: string | null;
  fetched_at: string;
} } | null {
  if (!isRecord(payload) || !isRecord(payload.artist) || typeof payload.artist.name !== "string") return null;
  const tags = isRecord(payload.artist.tags) ? asRecords(payload.artist.tags.tag) : [];
  const genres = tags.flatMap((tag) => (typeof tag.name === "string" ? [tag.name] : []));
  const stats = isRecord(payload.artist.stats) ? payload.artist.stats : null;
  const listeners = stats ? Number(stats.listeners) : 0;
  const cached: CachedArtist = {
    name: payload.artist.name,
    genres,
    followers: Number.isFinite(listeners) ? listeners : 0,
    imageUrl: lastfmImage(payload.artist.image, 160),
  };
  return {
    cached,
    row: {
      artist_id: id,
      name: cached.name,
      genres: cached.genres,
      followers: cached.followers,
      image_url: cached.imageUrl,
      fetched_at: new Date().toISOString(),
    },
  };
}

function artistName(id: string): string | null {
  const parsed = parseEntityId(id);
  if (!parsed || parsed.kind !== "artist") return null;
  return parsed.parts[0] ?? null;
}
