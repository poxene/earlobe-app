import type { AlbumCover } from "@/lib/game/character";
import { isRecord } from "@/lib/isRecord";
import { albumId, artistId, trackId } from "@/lib/music/lastfmIds";
import type { ProviderArtist } from "@/lib/music/provider";

export type LastfmTrack = {
  trackId: string;
  trackName: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  imageUrl: string | null;
  playedAt: string | null;
  nowPlaying: boolean;
};

const IMAGE_WIDTH: Record<string, number> = {
  small: 34,
  medium: 64,
  large: 174,
  extralarge: 300,
  mega: 600,
};

export function mapLastfmTopArtists(payload: unknown): ProviderArtist[] {
  return artistRecords(payload, "topartists").flatMap((artist) => {
    const name = text(artist.name);
    if (!name) return [];
    return [
      {
        id: artistId(name),
        name,
        genres: [],
        imageUrl: lastfmImage(artist.image),
        followerCount: 0,
      },
    ];
  });
}

export function mapLastfmAlbums(payload: unknown, root: "topalbums" | "albums"): AlbumCover[] {
  const covers: AlbumCover[] = [];
  const seen = new Set<string>();
  for (const album of childRecords(payload, root, "album")) {
    const name = text(album.name);
    const artistName = named(album.artist);
    if (!name || !artistName) continue;
    const id = albumId(artistName, name);
    if (seen.has(id)) continue;
    seen.add(id);
    covers.push({ id, name, artistName, imageUrl: lastfmImage(album.image) });
  }
  return covers;
}

export function mapLastfmRecent(payload: unknown): { nowPlaying: LastfmTrack | null; history: LastfmTrack[] } {
  const tracks = childRecords(payload, "recenttracks", "track").flatMap(mapTrack);
  return {
    nowPlaying: tracks.find((track) => track.nowPlaying) ?? null,
    history: tracks.filter((track) => !track.nowPlaying && track.playedAt),
  };
}

export function lastfmImage(images: unknown, targetWidth = 300): string | null {
  if (!Array.isArray(images)) return null;
  const parsed = images.flatMap((image) => {
    if (!isRecord(image) || typeof image["#text"] !== "string" || image["#text"].length === 0) return [];
    const size = typeof image.size === "string" ? image.size : "large";
    return [{ url: image["#text"], width: IMAGE_WIDTH[size] ?? targetWidth }];
  });
  if (parsed.length === 0) return null;
  const ranked = [...parsed].sort((a, b) => Math.abs(a.width - targetWidth) - Math.abs(b.width - targetWidth));
  return ranked[0]?.url ?? null;
}

export function asRecords(value: unknown): Record<string, unknown>[] {
  const items = Array.isArray(value) ? value : isRecord(value) ? [value] : [];
  return items.filter(isRecord);
}

function mapTrack(track: Record<string, unknown>): LastfmTrack[] {
  const trackName = text(track.name);
  const artistName = named(track.artist);
  if (!trackName || !artistName) return [];
  const albumName = named(track.album);
  const attr = isRecord(track["@attr"]) ? track["@attr"] : null;
  return [
    {
      trackId: trackId(artistName, trackName),
      trackName,
      artistId: artistId(artistName),
      artistName,
      albumId: albumName ? albumId(artistName, albumName) : "",
      albumName,
      imageUrl: lastfmImage(track.image, 300),
      playedAt: playedAt(track.date),
      nowPlaying: attr?.nowplaying === "true",
    },
  ];
}

function playedAt(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const uts = typeof value.uts === "string" ? Number(value.uts) : typeof value.uts === "number" ? value.uts : NaN;
  if (!Number.isFinite(uts) || uts <= 0) return null;
  return new Date(uts * 1000).toISOString();
}

function artistRecords(payload: unknown, root: string): Record<string, unknown>[] {
  return childRecords(payload, root, "artist");
}

function childRecords(payload: unknown, root: string, child: string): Record<string, unknown>[] {
  if (!isRecord(payload) || !isRecord(payload[root])) return [];
  return asRecords(payload[root][child]);
}

function named(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!isRecord(value)) return "";
  if (typeof value["#text"] === "string") return value["#text"].trim();
  if (typeof value.name === "string") return value.name.trim();
  return "";
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
