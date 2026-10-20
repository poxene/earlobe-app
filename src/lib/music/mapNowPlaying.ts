import { isRecord } from "@/lib/isRecord";
import { pickImage } from "@/lib/music/images";
import type { NowPlaying } from "@/lib/music/provider";

export function mapNowPlaying(payload: unknown): NowPlaying | null {
  if (!isRecord(payload) || !isRecord(payload.item)) return null;
  const item = payload.item;
  if (typeof item.name !== "string" || typeof item.id !== "string") return null;

  const album = isRecord(item.album) ? item.album : isRecord(item.show) ? item.show : null;
  const artistNames = namesFrom(item.artists);
  if (artistNames.length === 0 && album && typeof album.name === "string" && album !== item.album) {
    artistNames.push(album.name);
  }

  return {
    trackId: item.id,
    trackName: item.name,
    artistNames,
    artistIds: Array.isArray(item.artists)
      ? item.artists.flatMap((artist) => (isRecord(artist) && typeof artist.id === "string" ? [artist.id] : []))
      : [],
    albumId: album && typeof album.id === "string" ? album.id : "",
    albumName: album && typeof album.name === "string" ? album.name : "",
    albumImageUrl: album ? pickImage(album.images, 64) : null,
    durationMs: typeof item.duration_ms === "number" ? item.duration_ms : 0,
    progressMs: typeof payload.progress_ms === "number" ? payload.progress_ms : 0,
    isPlaying: payload.is_playing === true,
  };
}

function namesFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((artist) => (isRecord(artist) && typeof artist.name === "string" ? [artist.name] : []));
}
