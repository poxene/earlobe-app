//— the game never talks to a music service directly, only through this

export type ProviderArtist = {
  id: string;
  name: string;
  genres: string[];
  imageUrl: string | null;
  followerCount: number;
};

export type PlayRecord = {
  trackId: string;
  trackName: string;
  artistIds: string[];
  artistNames: string[];
  albumId: string;
  albumName: string;
  playedAt: string;
  durationMs: number;
  progressMs: number;
};

export type NowPlaying = {
  trackId: string;
  trackName: string;
  artistNames: string[];
  artistIds: string[];
  albumId: string;
  albumName: string;
  albumImageUrl: string | null;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
};

export type Device = {
  id: string | null;
  name: string;
  isActive: boolean;
  isRestricted: boolean;
};

export interface MusicProvider {
  getDisplayProfile(): Promise<{ name: string; avatarUrl: string }>;
  getTopArtists(limit: number): Promise<ProviderArtist[]>;
  //— raw payload for the phase 1 debug view. game systems should use getTopArtists
  getTopArtistsDebug(limit: number): Promise<unknown>;
  getRecentlyPlayed(limit: number): Promise<PlayRecord[]>;
  getCurrentlyPlaying(): Promise<NowPlaying | null>;
  startPlayback(contextUri: string): Promise<void>;
  getDevices(): Promise<Device[]>;
}

export class NotReadyError extends Error {
  constructor(method: string) {
    super(`${method} lands in a later phase`);
    this.name = "NotReadyError";
  }
}
