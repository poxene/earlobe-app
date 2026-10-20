import { useGameSync } from "@/hooks/useGameSync";

export function useNowPlaying() {
  const sync = useGameSync();
  return {
    isPending: sync.isPending,
    isError: sync.isError,
    isSuccess: sync.isSuccess,
    data: sync.data ? sync.data.nowPlaying : undefined,
  };
}
