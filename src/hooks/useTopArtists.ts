import { useQuery } from "@tanstack/react-query";
import { music } from "@/lib/music/lastfm";

export function useTopArtists() {
  return useQuery({
    queryKey: ["top-artists", "debug"],
    queryFn: () => music.getTopArtistsDebug(50),
    retry: false,
    staleTime: 60_000,
  });
}
