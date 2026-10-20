import type { GenreFamily } from "@/lib/music/normalize";

export type Motif =
  | "horns"
  | "hex"
  | "dagger"
  | "ring"
  | "spiral"
  | "fist"
  | "wave"
  | "claw"
  | "eye"
  | "star"
  | "shard";

export type MonsterDef = {
  monster: string;
  motif: Motif;
  family: GenreFamily;
};

export const MONSTERS: Record<GenreFamily, MonsterDef> = {
  Metal: { monster: "Demon", motif: "horns", family: "Metal" },
  Electronic: { monster: "Construct", motif: "hex", family: "Electronic" },
  "Hip-hop": { monster: "Shadowblade", motif: "dagger", family: "Hip-hop" },
  Classical: { monster: "Celestial Guardian", motif: "ring", family: "Classical" },
  Jazz: { monster: "Trickster Fae", motif: "spiral", family: "Jazz" },
  Rock: { monster: "Ogre", motif: "fist", family: "Rock" },
  Pop: { monster: "Siren", motif: "wave", family: "Pop" },
  "Folk / Country": { monster: "Dire Beast", motif: "claw", family: "Folk / Country" },
  "Ambient / Lo-fi": { monster: "Voidling", motif: "eye", family: "Ambient / Lo-fi" },
  Punk: { monster: "Rioter Gremlin", motif: "star", family: "Punk" },
  Unmapped: { monster: "Mimic", motif: "shard", family: "Unmapped" },
};

export function monsterForFamily(family: string): MonsterDef {
  if (family in MONSTERS) return MONSTERS[family as GenreFamily];
  return MONSTERS.Unmapped;
}
