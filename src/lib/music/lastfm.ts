import { apiGet } from "@/lib/api";
import { isRecord } from "@/lib/isRecord";
import { mapLastfmTopArtists } from "@/lib/music/mapLastfm";
import {
  NotReadyError,
  type Device,
  type MusicProvider,
  type NowPlaying,
  type PlayRecord,
  type ProviderArtist,
} from "@/lib/music/provider";

export class LastfmMusicProvider implements MusicProvider {
  async getDisplayProfile(): Promise<{ name: string; avatarUrl: string }> {
    const body = await apiGet("/api/me");
    if (!isRecord(body) || typeof body.name !== "string") {
      throw new Error("unexpected profile");
    }
    return {
      name: body.name,
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : "",
    };
  }

  async getTopArtists(limit: number): Promise<ProviderArtist[]> {
    return mapLastfmTopArtists(await this.getTopArtistsDebug(limit));
  }

  async getTopArtistsDebug(limit: number): Promise<unknown> {
    const clamped = Math.min(50, Math.max(1, Math.floor(limit)));
    return apiGet(`/api/lastfm/top-artists?limit=${clamped}`);
  }

  getRecentlyPlayed(_limit: number): Promise<PlayRecord[]> {
    throw new NotReadyError("getRecentlyPlayed");
  }

  async getCurrentlyPlaying(): Promise<NowPlaying | null> {
    const body = await apiGet("/api/lastfm/now-playing");
    return parseNowPlaying(body);
  }

  //— last.fm records plays. it does not start them.
  startPlayback(_contextUri: string): Promise<void> {
    throw new NotReadyError("startPlayback");
  }

  getDevices(): Promise<Device[]> {
    throw new NotReadyError("getDevices");
  }
}

export const music: MusicProvider = new LastfmMusicProvider();

function parseNowPlaying(body: unknown): NowPlaying | null {
  if (!isRecord(body) || typeof body.trackId !== "string" || typeof body.trackName !== "string") return null;
  return {
    trackId: body.trackId,
    trackName: body.trackName,
    artistNames: strings(body.artistNames),
    artistIds: strings(body.artistIds),
    albumId: typeof body.albumId === "string" ? body.albumId : "",
    albumName: typeof body.albumName === "string" ? body.albumName : "",
    albumImageUrl: typeof body.albumImageUrl === "string" ? body.albumImageUrl : null,
    durationMs: typeof body.durationMs === "number" ? body.durationMs : 0,
    progressMs: typeof body.progressMs === "number" ? body.progressMs : 0,
    isPlaying: body.isPlaying === true,
  };
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
