import type { AlbumCover } from "../../src/lib/game/character";
import { isRecord } from "../../src/lib/isRecord";
import { albumId, parseEntityId, trackId } from "../../src/lib/music/lastfmIds";
import { asRecords, mapLastfmAlbums, mapLastfmRecent, mapLastfmTopArtists, type LastfmTrack } from "../../src/lib/music/mapLastfm";
import type { HistoryPlay } from "../../src/lib/music/mapHistory";
import type { NowPlaying, ProviderArtist } from "../../src/lib/music/provider";
import { getSupabase } from "../supabase";
import { loadArtists } from "./catalog";
import { cachedCover, coverFor, usableImage } from "./coverArt";
import { callForUser, lastfmCall } from "./lastfmClient";

//— a scrobble means the track was heard. when last.fm has no duration, three minutes still qualifies.
const FALLBACK_MS = 180_000;

const FAMILY_TAGS: Record<string, string> = {
  Metal: "metal",
  "Hip-hop": "hip-hop",
  Electronic: "electronic",
  Rock: "rock",
  Jazz: "jazz",
  Classical: "classical",
  Pop: "pop",
  "Folk / Country": "folk",
  "Ambient / Lo-fi": "ambient",
  Punk: "punk",
};

type AlbumListing = {
  ids: string[];
  durations: Map<string, number>;
};

const albums = new Map<string, AlbumListing>();
const missingAlbums = new Set<string>();
const knownDurations = new Map<string, number>();
const unknownDurations = new Set<string>();

export async function topArtists(userId: string, limit: number): Promise<ProviderArtist[]> {
  const payload = await callForUser(userId, "user.getTopArtists", { period: "6month", limit: String(limit) });
  const mapped = mapLastfmTopArtists(payload);
  const cache = await loadArtists(mapped.map((artist) => artist.id));
  return mapped.map((artist) => {
    const cached = cache.get(artist.id);
    if (!cached) return artist;
    return {
      ...artist,
      genres: cached.genres,
      followerCount: cached.followers,
      imageUrl: artist.imageUrl ?? cached.imageUrl,
    };
  });
}

export async function topArtistsRaw(userId: string, limit: number): Promise<unknown> {
  return callForUser(userId, "user.getTopArtists", { period: "6month", limit: String(limit) });
}

export async function topAlbums(userId: string, limit: number): Promise<AlbumCover[]> {
  const payload = await callForUser(userId, "user.getTopAlbums", { period: "1month", limit: String(limit) });
  return mapLastfmAlbums(payload, "topalbums").slice(0, limit);
}

export async function currentTrack(userId: string): Promise<NowPlaying | null> {
  return (await listenerActivity(userId)).nowPlaying;
}

//— one recent-tracks call feeds the live fight and the scrobble ledger.
export async function listenerActivity(
  userId: string,
): Promise<{ nowPlaying: NowPlaying | null; history: HistoryPlay[] }> {
  const payload = await callForUser(userId, "user.getRecentTracks", { limit: "50" });
  const mapped = mapLastfmRecent(payload);
  const lead = mapped.nowPlaying ?? mapped.history[0];
  if (lead?.albumName && !usableImage(lead.imageUrl)) await coverFor(lead.artistName, lead.albumName);
  const history: HistoryPlay[] = [];
  for (const track of mapped.history) {
    if (!track.playedAt) continue;
    const listing = track.albumName ? await rememberAlbum(track.artistName, track.albumName) : null;
    history.push({
      trackId: track.trackId,
      trackName: track.trackName,
      artistIds: [track.artistId],
      artistNames: [track.artistName],
      albumId: track.albumId,
      albumName: track.albumName,
      albumImageUrl: albumImage(track),
      playedAt: track.playedAt,
      durationMs: await durationFor(track, listing),
      tracksTotal: listing?.ids.length ?? 0,
    });
  }
  const nowPlaying = mapped.nowPlaying ? await toNowPlaying(userId, mapped.nowPlaying) : null;
  return { nowPlaying, history };
}

export async function albumTrackIds(id: string): Promise<string[]> {
  const parsed = parseEntityId(id);
  const artist = parsed?.kind === "album" ? parsed.parts[0] : undefined;
  const album = parsed?.kind === "album" ? parsed.parts[1] : undefined;
  if (!artist || !album) return [];
  const listing = await rememberAlbum(artist, album);
  return listing?.ids ?? [];
}

export async function albumForFamily(family: string): Promise<{ id: string } | null> {
  const tag = FAMILY_TAGS[family] ?? "jazz";
  try {
    const payload = await lastfmCall({ method: "tag.getTopAlbums", tag, limit: "5" });
    const album = mapLastfmAlbums(payload, "albums")[0];
    return album ? { id: album.id } : null;
  } catch {
    return null;
  }
}

export async function lesserKnownArtist(
  families: string[],
  seen: Set<string>,
): Promise<{ id: string; name: string } | null> {
  let checks = 0;
  for (const family of families) {
    const tag = FAMILY_TAGS[family] ?? family.toLowerCase();
    for (const page of ["15", "40"]) {
      if (checks >= 6) return null;
      let found: { id: string; name: string }[] = [];
      try {
        found = mapLastfmTopArtists(await lastfmCall({ method: "tag.getTopArtists", tag, page, limit: "10" }));
      } catch {
        continue;
      }
      for (const artist of found) {
        if (seen.has(artist.id) || checks >= 6) continue;
        checks += 1;
        const cached = await loadArtists([artist.id]);
        const listeners = cached.get(artist.id)?.followers ?? 0;
        if (listeners <= 0 || listeners >= 100_000) continue;
        return { id: artist.id, name: artist.name };
      }
    }
  }
  return null;
}

async function toNowPlaying(userId: string, track: LastfmTrack): Promise<NowPlaying> {
  const listing = track.albumName ? await rememberAlbum(track.artistName, track.albumName) : null;
  const durationMs = await durationFor(track, listing);
  return {
    trackId: track.trackId,
    trackName: track.trackName,
    artistNames: [track.artistName],
    artistIds: [track.artistId],
    albumId: track.albumId,
    albumName: track.albumName,
    albumImageUrl: albumImage(track),
    durationMs,
    progressMs: await progressFromEncounter(userId, track.trackId, durationMs),
    isPlaying: true,
  };
}

async function durationFor(track: LastfmTrack, listing: AlbumListing | null): Promise<number> {
  const listed = listing?.durations.get(track.trackId);
  if (listed && listed > 0) return listed;
  const cached = knownDurations.get(track.trackId) ?? (await readDuration(track.trackId));
  if (cached && cached > 0) return cached;
  if (unknownDurations.has(track.trackId)) return FALLBACK_MS;
  try {
    const payload = await lastfmCall({ method: "track.getInfo", artist: track.artistName, track: track.trackName });
    const duration = trackDurationMs(payload);
    if (duration > 0) {
      await writeDuration(track.trackId, duration);
      return duration;
    }
  } catch {
    //— fall through to the stand-in duration
  }
  unknownDurations.add(track.trackId);
  return FALLBACK_MS;
}

//— last.fm reports that a track is playing, not where the playhead is. the open fight is the clock.
async function progressFromEncounter(userId: string, trackIdValue: string, durationMs: number): Promise<number> {
  const { data, error } = await getSupabase()
    .from("encounters")
    .select("started_at")
    .eq("user_id", userId)
    .eq("track_id", trackIdValue)
    .is("resolved_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.started_at) return 0;
  const elapsed = Date.now() - new Date(data.started_at).getTime();
  const progress = Math.max(0, elapsed);
  return durationMs > 0 ? Math.min(durationMs, progress) : progress;
}

async function rememberAlbum(artistName: string, albumName: string): Promise<AlbumListing | null> {
  const id = albumId(artistName, albumName);
  if (missingAlbums.has(id)) return null;
  const memorized = albums.get(id);
  if (memorized) return memorized;
  const cached = await readAlbum(id);
  if (cached) {
    albums.set(id, cached);
    return cached;
  }
  try {
    const payload = await lastfmCall({ method: "album.getInfo", artist: artistName, album: albumName });
    const listing = parseAlbum(payload, artistName);
    if (!listing) {
      missingAlbums.add(id);
      return null;
    }
    await writeAlbum(id, listing);
    albums.set(id, listing);
    return listing;
  } catch {
    missingAlbums.add(id);
    return null;
  }
}

function albumImage(track: LastfmTrack): string | null {
  return usableImage(track.imageUrl) ?? (track.albumName ? cachedCover(track.artistName, track.albumName) : null);
}

function parseAlbum(payload: unknown, artistName: string): AlbumListing | null {
  if (!isRecord(payload) || !isRecord(payload.album)) return null;
  const tracks = isRecord(payload.album.tracks) ? asRecords(payload.album.tracks.track) : [];
  const ids: string[] = [];
  const durationById = new Map<string, number>();
  for (const track of tracks) {
    const name = typeof track.name === "string" ? track.name.trim() : "";
    if (!name) continue;
    const artist = isRecord(track.artist) && typeof track.artist.name === "string" ? track.artist.name : artistName;
    const id = trackId(artist, name);
    ids.push(id);
    const seconds = typeof track.duration === "number" ? track.duration : Number(track.duration);
    if (Number.isFinite(seconds) && seconds > 0) durationById.set(id, Math.round(seconds * 1000));
  }
  if (ids.length === 0) return null;
  return { ids, durations: durationById };
}

function trackDurationMs(payload: unknown): number {
  if (!isRecord(payload) || !isRecord(payload.track)) return 0;
  const duration = Number(payload.track.duration);
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 0;
}

async function readDuration(trackIdValue: string): Promise<number | null> {
  const { data, error } = await getSupabase()
    .from("track_cache")
    .select("duration_ms")
    .eq("track_id", trackIdValue)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.duration_ms <= 0) return null;
  knownDurations.set(trackIdValue, data.duration_ms);
  return data.duration_ms;
}

async function writeDuration(trackIdValue: string, durationMs: number): Promise<void> {
  knownDurations.set(trackIdValue, durationMs);
  const saved = await getSupabase().from("track_cache").upsert({
    track_id: trackIdValue,
    duration_ms: durationMs,
    fetched_at: new Date().toISOString(),
  });
  if (saved.error) throw new Error(saved.error.message);
}

async function readAlbum(id: string): Promise<AlbumListing | null> {
  const { data, error } = await getSupabase().from("album_cache").select("track_ids").eq("album_id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.track_ids.length === 0) return null;
  const durationById = new Map<string, number>();
  const rows = await getSupabase().from("track_cache").select("track_id, duration_ms").in("track_id", data.track_ids);
  if (rows.error) throw new Error(rows.error.message);
  for (const row of rows.data ?? []) {
    if (row.duration_ms > 0) durationById.set(row.track_id, row.duration_ms);
  }
  return { ids: data.track_ids, durations: durationById };
}

async function writeAlbum(id: string, listing: AlbumListing): Promise<void> {
  const now = new Date().toISOString();
  const tracks = [...listing.durations.entries()].map(([trackIdValue, durationMs]) => ({
    track_id: trackIdValue,
    duration_ms: durationMs,
    fetched_at: now,
  }));
  if (tracks.length > 0) {
    const savedTracks = await getSupabase().from("track_cache").upsert(tracks);
    if (savedTracks.error) throw new Error(savedTracks.error.message);
    for (const track of tracks) knownDurations.set(track.track_id, track.duration_ms);
  }
  const saved = await getSupabase().from("album_cache").upsert({
    album_id: id,
    track_ids: listing.ids,
    fetched_at: now,
  });
  if (saved.error) throw new Error(saved.error.message);
}
