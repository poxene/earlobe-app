import { parseEntityId } from "@/lib/music/lastfmIds";

export type DiscoveryObjective = {
  type: "discovery";
  families: string[];
  target: number;
  seedAlbumId: string | null;
  seedLabel: string;
};

export type DeepCutObjective = {
  type: "deep_cut";
  artistId: string;
  artistName: string;
  target: number;
};

export type RitualObjective = {
  type: "ritual";
  albumId: string;
  albumName: string;
  trackIds: string[];
};

export type SocialObjective = {
  type: "social";
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  friendName: string;
  friendId: string;
};

export type QuestObjective = DiscoveryObjective | DeepCutObjective | RitualObjective | SocialObjective;

export type ListenFact = {
  trackId: string;
  albumId: string;
  artistIds: string[];
  playedAt: string;
};

export type AlbumFact = {
  albumId: string;
  family: string;
  tracksPlayed: number;
  tracksTotal: number;
};

// A single or a short EP is not an album. Five tracks is the shortest release that can be finished.
export const MIN_ALBUM_TRACKS = 5;

export function albumHeard(tracksPlayed: number, tracksTotal: number): boolean {
  return tracksTotal > 0 && tracksPlayed >= tracksTotal;
}

export function albumFinished(tracksPlayed: number, tracksTotal: number): boolean {
  return tracksTotal >= MIN_ALBUM_TRACKS && albumHeard(tracksPlayed, tracksTotal);
}

export function questProgress(
  objective: QuestObjective,
  listens: ListenFact[],
  albums: AlbumFact[],
): { current: number; target: number; completed: boolean } {
  if (objective.type === "discovery") {
    const done = albums.filter(
      (album) => albumFinished(album.tracksPlayed, album.tracksTotal) && objective.families.includes(album.family),
    ).length;
    return pack(done, objective.target);
  }
  if (objective.type === "deep_cut") {
    const tracks = new Set(
      listens.filter((row) => row.artistIds.includes(objective.artistId)).map((row) => row.trackId),
    );
    return pack(tracks.size, objective.target);
  }
  if (objective.type === "social") {
    const heard = listens.some((row) => row.trackId === objective.trackId);
    return pack(heard ? 1 : 0, 1);
  }
  const reached = ritualReached(objective.trackIds, listens);
  const progress = pack(reached, objective.trackIds.length || 1);
  if (objective.trackIds.length < MIN_ALBUM_TRACKS) return { ...progress, completed: false };
  return progress;
}

export function ritualComplete(trackIds: string[], listens: ListenFact[]): boolean {
  return trackIds.length >= MIN_ALBUM_TRACKS && ritualReached(trackIds, listens) === trackIds.length;
}

export function ritualReached(trackIds: string[], listens: ListenFact[]): number {
  if (trackIds.length === 0) return 0;
  const ordered = [...listens].sort((a, b) => a.playedAt.localeCompare(b.playedAt));
  let cursor = 0;
  let best = 0;
  for (const row of ordered) {
    const expected = trackIds[cursor];
    if (expected && sameTrack(row.trackId, expected)) {
      cursor += 1;
      best = Math.max(best, cursor);
      if (cursor === trackIds.length) return trackIds.length;
      continue;
    }
    if (cursor > 0) {
      cursor = sameTrack(row.trackId, trackIds[0] ?? "") ? 1 : 0;
      best = Math.max(best, cursor);
    }
  }
  return best;
}

function sameTrack(a: string, b: string): boolean {
  if (a === b) return true;
  const left = foldedTrack(a);
  const right = foldedTrack(b);
  if (!left || !right) return false;
  return left.artist === right.artist && left.title === right.title;
}

function foldedTrack(id: string): { artist: string; title: string } | null {
  const parsed = parseEntityId(id);
  if (!parsed || parsed.kind !== "track" || parsed.parts.length < 2) return null;
  const artist = parsed.parts[0];
  if (!artist) return null;
  return { artist: foldTitle(artist), title: foldTitle(parsed.parts.slice(1).join("/")) };
}

function foldTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function pack(current: number, target: number): { current: number; target: number; completed: boolean } {
  const clamped = Math.min(target, current);
  return { current: clamped, target, completed: clamped >= target };
}

export function parseObjective(value: unknown): QuestObjective | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  if (value.type === "discovery" && Array.isArray(value.families)) {
    return {
      type: "discovery",
      families: value.families.filter((family): family is string => typeof family === "string"),
      target: typeof value.target === "number" ? value.target : 3,
      seedAlbumId: typeof value.seedAlbumId === "string" ? value.seedAlbumId : null,
      seedLabel: typeof value.seedLabel === "string" ? value.seedLabel : "new horizons",
    };
  }
  if (value.type === "deep_cut" && typeof value.artistId === "string" && typeof value.artistName === "string") {
    return { type: "deep_cut", artistId: value.artistId, artistName: value.artistName, target: 5 };
  }
  if (value.type === "ritual" && typeof value.albumId === "string" && Array.isArray(value.trackIds)) {
    return {
      type: "ritual",
      albumId: value.albumId,
      albumName: typeof value.albumName === "string" ? value.albumName : "the record",
      trackIds: value.trackIds.filter((id): id is string => typeof id === "string"),
    };
  }
  if (value.type === "social" && typeof value.trackId === "string") {
    return {
      type: "social",
      trackId: value.trackId,
      trackName: typeof value.trackName === "string" ? value.trackName : "a friend's track",
      artistName: typeof value.artistName === "string" ? value.artistName : "",
      albumName: typeof value.albumName === "string" ? value.albumName : "",
      friendName: typeof value.friendName === "string" ? value.friendName : "a friend",
      friendId: typeof value.friendId === "string" ? value.friendId : "",
    };
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
