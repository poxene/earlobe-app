import { isRecord } from "@/lib/isRecord";
import { pickImage } from "@/lib/music/images";
import type { AlbumCover } from "@/lib/game/character";

export function mapAlbumCovers(payload: unknown, limit = 4): AlbumCover[] {
  if (!isRecord(payload) || !Array.isArray(payload.items)) return [];

  const covers: AlbumCover[] = [];
  const seen = new Set<string>();

  for (const item of payload.items) {
    if (!isRecord(item) || !isRecord(item.album)) continue;
    const album = item.album;
    if (typeof album.id !== "string" || seen.has(album.id)) continue;
    seen.add(album.id);
    const artistName = artistNames(album.artists) || artistNames(item.artists);
    covers.push({
      id: album.id,
      name: typeof album.name === "string" ? album.name : "Untitled",
      artistName,
      imageUrl: pickImage(album.images),
    });
    if (covers.length >= limit) break;
  }

  return covers;
}

function artistNames(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .flatMap((artist) => (isRecord(artist) && typeof artist.name === "string" ? [artist.name] : []))
    .join(", ");
}
