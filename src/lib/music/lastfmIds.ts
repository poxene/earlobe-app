//— last.fm identifies music by name. mbids are often empty, so the id is the normalized name.

const KINDS = new Set(["artist", "track", "album"]);

export function entityId(kind: "artist" | "track" | "album", ...parts: string[]): string {
  return `${kind}:${parts.map(slug).join("/")}`;
}

export function artistId(name: string): string {
  return entityId("artist", name);
}

export function trackId(artist: string, track: string): string {
  return entityId("track", artist, track);
}

export function albumId(artist: string, album: string): string {
  return entityId("album", artist, album);
}

export function parseEntityId(id: string): { kind: "artist" | "track" | "album"; parts: string[] } | null {
  const split = id.indexOf(":");
  if (split < 1) return null;
  const kind = id.slice(0, split);
  if (!KINDS.has(kind)) return null;
  const parts = id
    .slice(split + 1)
    .split("/")
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });
  if (parts.length === 0 || parts.some((part) => part.length === 0)) return null;
  if (kind === "artist" || kind === "track" || kind === "album") return { kind, parts };
  return null;
}

export function lastfmUrl(id: string): string | null {
  const parsed = parseEntityId(id);
  if (!parsed) return null;
  const [first, second] = parsed.parts;
  if (parsed.kind === "artist" && first) return `https://www.last.fm/music/${pathPart(first)}`;
  if (parsed.kind === "album" && first && second) {
    return `https://www.last.fm/music/${pathPart(first)}/${pathPart(second)}`;
  }
  if (parsed.kind === "track" && first && second) {
    return `https://www.last.fm/music/${pathPart(first)}/_/${pathPart(second)}`;
  }
  return null;
}

export function lastfmSearch(query: string): string {
  return `https://www.last.fm/search?q=${encodeURIComponent(query)}`;
}

function slug(value: string): string {
  return encodeURIComponent(value.trim().toLowerCase().replace(/\s+/g, " "));
}

function pathPart(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}
