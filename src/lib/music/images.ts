import { isRecord } from "@/lib/isRecord";

export function pickImage(images: unknown, targetWidth = 320): string | null {
  if (!Array.isArray(images)) return null;
  const parsed = images.flatMap((image) => {
    if (!isRecord(image) || typeof image.url !== "string") return [];
    const width = typeof image.width === "number" ? image.width : targetWidth;
    return [{ url: image.url, width }];
  });
  if (parsed.length === 0) return null;
  const ranked = [...parsed].sort(
    (a, b) => Math.abs(a.width - targetWidth) - Math.abs(b.width - targetWidth),
  );
  return ranked[0]?.url ?? null;
}
