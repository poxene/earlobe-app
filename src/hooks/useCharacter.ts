import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { CharacterSheetModel } from "@/lib/game/character";
import { isRecord } from "@/lib/isRecord";

export function useCharacter() {
  return useQuery({
    queryKey: ["character"],
    queryFn: async () => {
      const body = await apiGet("/api/character");
      if (!isCharacterSheet(body)) throw new Error("unexpected character sheet");
      return body;
    },
    retry: false,
    staleTime: 30_000,
  });
}

function isCharacterSheet(value: unknown): value is CharacterSheetModel {
  if (!isRecord(value) || !isRecord(value.stats)) return false;
  return (
    typeof value.displayName === "string" &&
    typeof value.className === "string" &&
    typeof value.masteryTitle === "string" &&
    typeof value.echoes === "number" &&
    typeof value.unallocatedPoints === "number" &&
    typeof value.skillPicks === "number" &&
    Array.isArray(value.skills) &&
    (value.subclass === null || typeof value.subclass === "string") &&
    typeof value.classColor === "string" &&
    typeof value.level === "number" &&
    typeof value.dps === "number" &&
    typeof value.xpIntoLevel === "number" &&
    typeof value.xpForNext === "number" &&
    typeof value.xpFraction === "number" &&
    typeof value.stats.str === "number" &&
    typeof value.thinHistory === "boolean" &&
    Array.isArray(value.genres) &&
    Array.isArray(value.albums) &&
    Array.isArray(value.relics)
  );
}
