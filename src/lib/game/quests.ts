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

export function questProgress(
  objective: QuestObjective,
  listens: ListenFact[],
  albums: AlbumFact[],
): { current: number; target: number; completed: boolean } {
  if (objective.type === "discovery") {
    const done = albums.filter(
      (album) =>
        album.tracksTotal > 0 &&
        album.tracksPlayed >= album.tracksTotal &&
        objective.families.includes(album.family),
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
  return pack(ritualComplete(objective.trackIds, listens) ? 1 : 0, 1);
}

export function ritualComplete(trackIds: string[], listens: ListenFact[]): boolean {
  if (trackIds.length === 0) return false;
  const ordered = [...listens].sort((a, b) => a.playedAt.localeCompare(b.playedAt));
  let cursor = 0;
  for (const row of ordered) {
    if (row.trackId === trackIds[cursor]) {
      cursor += 1;
      if (cursor === trackIds.length) return true;
      continue;
    }
    if (cursor > 0) cursor = row.trackId === trackIds[0] ? 1 : 0;
  }
  return false;
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
      friendName: typeof value.friendName === "string" ? value.friendName : "a friend",
      friendId: typeof value.friendId === "string" ? value.friendId : "",
    };
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
