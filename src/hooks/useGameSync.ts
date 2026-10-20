import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiSend } from "@/lib/api";
import type { CharacterSheetModel } from "@/lib/game/character";
import type { GameSnapshot } from "@/lib/game/snapshot";
import { isRecord } from "@/lib/isRecord";

export function useGameSync() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["sync"],
    queryFn: async () => {
      const body = await apiSend("/api/sync", "POST");
      if (!isSnapshot(body)) throw new Error("unexpected sync");
      queryClient.setQueryData(["character"], body.sheet);
      return body;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}

function isSnapshot(value: unknown): value is GameSnapshot {
  if (!isRecord(value) || !isRecord(value.sheet) || !Array.isArray(value.toasts) || !Array.isArray(value.battles)) {
    return false;
  }
  const sheet = value.sheet as CharacterSheetModel;
  return typeof sheet.displayName === "string" && typeof sheet.masteryTitle === "string";
}
