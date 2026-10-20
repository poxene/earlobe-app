import { isRecord } from "@/lib/isRecord";
import { pickImage } from "@/lib/music/images";

export type HistoryPlay = {
  trackId: string;
  trackName: string;
  artistIds: string[];
  artistNames: string[];
  albumId: string;
  albumName: string;
  albumImageUrl: string | null;
  playedAt: string;
  durationMs: number;
  tracksTotal: number;
};

export function mapRecentlyPlayed(payload: unknown): HistoryPlay[] {
  if (!isRecord(payload) || !Array.isArray(payload.items)) return [];
  return payload.items.flatMap((item) => {
    if (!isRecord(item) || !isRecord(item.track) || typeof item.played_at !== "string") return [];
    const track = item.track;
    if (typeof track.id !== "string" || typeof track.name !== "string") return [];
    const album = isRecord(track.album) ? track.album : null;
    const artists = Array.isArray(track.artists) ? track.artists.filter(isRecord) : [];
    return [
      {
        trackId: track.id,
        trackName: track.name,
        artistIds: artists.flatMap((artist) => (typeof artist.id === "string" ? [artist.id] : [])),
        artistNames: artists.flatMap((artist) => (typeof artist.name === "string" ? [artist.name] : [])),
        albumId: album && typeof album.id === "string" ? album.id : "",
        albumName: album && typeof album.name === "string" ? album.name : "",
        albumImageUrl: album ? pickImage(album.images, 64) : null,
        playedAt: item.played_at,
        durationMs: typeof track.duration_ms === "number" ? track.duration_ms : 0,
        tracksTotal: album && typeof album.total_tracks === "number" ? album.total_tracks : 0,
      },
    ];
  });
}
