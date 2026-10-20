import { isRecord } from "@/lib/isRecord";
import { pickImage } from "@/lib/music/images";
import type { ProviderArtist } from "@/lib/music/provider";

export function mapTopArtists(payload: unknown): ProviderArtist[] {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new Error("unexpected top artists payload");
  }

  const artists = payload.items.flatMap((item): ProviderArtist[] => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string") return [];
    const genres = Array.isArray(item.genres)
      ? item.genres.filter((genre): genre is string => typeof genre === "string")
      : [];
    const followerCount =
      isRecord(item.followers) && typeof item.followers.total === "number" ? item.followers.total : 0;
    return [
      {
        id: item.id,
        name: item.name,
        genres,
        imageUrl: pickImage(item.images),
        followerCount,
      },
    ];
  });

  if (payload.items.length > 0 && artists.length === 0) {
    throw new Error("unexpected top artists payload");
  }

  return artists;
}
