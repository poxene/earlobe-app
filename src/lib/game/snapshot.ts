import type { CharacterSheetModel } from "@/lib/game/character";
import type { Motif } from "@/lib/game/bestiary";
import type { NowPlaying } from "@/lib/music/provider";

export type ActiveFight = {
  monster: string;
  motif: Motif;
  family: string;
  color: string;
  hpMax: number;
  hpLeft: number;
  dps: number;
  durationMs: number;
  progressMs: number;
  echoDepth: number;
  trackName: string;
  artistName: string;
  albumName: string;
  trackId: string;
  albumImageUrl: string | null;
  observedAt: number;
  isPlaying: boolean;
  bonusDamage: number;
  skillId: string | null;
  skillCooldowns: Record<string, number>;
};

export type BattleRow = {
  id: string;
  monster: string;
  trackId: string;
  motif: Motif;
  color: string;
  family: string;
  outcome: string;
  grade: string | null;
  echoes: number;
  relicName: string | null;
  at: string;
};

export type PartyAlly = {
  userId: string;
  name: string;
  className: string;
  classColor: string;
  level: number;
  body: string;
  gear: (string | null)[];
  skillId: string;
};

export type GameToast = { id: string; message: string };

export type AwaySummary = {
  battles: number;
  victories: number;
  escapes: number;
  xp: number;
  echoes: number;
  relicName: string | null;
};

export type GameSnapshot = {
  nowPlaying: NowPlaying | null;
  fight: ActiveFight | null;
  battles: BattleRow[];
  toasts: GameToast[];
  levelUp: { level: number; unallocated: number } | null;
  unlocks: { classId: string; color: string }[];
  questCompletions: { title: string; xp: number }[];
  away: AwaySummary | null;
  sheet: CharacterSheetModel;
  allies: PartyAlly[];
};
