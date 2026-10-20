import { isGenreFamily, type GenreFamily } from "@/lib/music/normalize";

export type StatVector = {
  str: number;
  agi: number;
  int: number;
  wis: number;
  cha: number;
};

export type ClassDef = {
  id: string;
  family: GenreFamily;
  color: string;
  vector: StatVector;
};

export const CLASSES: Record<GenreFamily, ClassDef> = {
  Metal: {
    id: "Berserker",
    family: "Metal",
    color: "#c1121f",
    vector: { str: 0.5, agi: 0.2, int: 0.05, wis: 0.05, cha: 0.2 },
  },
  "Hip-hop": {
    id: "Rogue",
    family: "Hip-hop",
    color: "#d4a24e",
    vector: { str: 0.15, agi: 0.4, int: 0.15, wis: 0.05, cha: 0.25 },
  },
  Electronic: {
    id: "Arcanist",
    family: "Electronic",
    color: "#00e5ff",
    vector: { str: 0.05, agi: 0.15, int: 0.55, wis: 0.15, cha: 0.1 },
  },
  Rock: {
    id: "Warrior",
    family: "Rock",
    color: "#ff6b35",
    vector: { str: 0.35, agi: 0.25, int: 0.1, wis: 0.1, cha: 0.2 },
  },
  Jazz: {
    id: "Bard",
    family: "Jazz",
    color: "#4361ee",
    vector: { str: 0.1, agi: 0.2, int: 0.2, wis: 0.15, cha: 0.35 },
  },
  Classical: {
    id: "Cleric",
    family: "Classical",
    color: "#f4f1de",
    vector: { str: 0.1, agi: 0.05, int: 0.25, wis: 0.5, cha: 0.1 },
  },
  Pop: {
    id: "Enchanter",
    family: "Pop",
    color: "#ff2e93",
    vector: { str: 0.05, agi: 0.15, int: 0.15, wis: 0.1, cha: 0.55 },
  },
  "Folk / Country": {
    id: "Ranger",
    family: "Folk / Country",
    color: "#386641",
    vector: { str: 0.25, agi: 0.3, int: 0.1, wis: 0.25, cha: 0.1 },
  },
  "Ambient / Lo-fi": {
    id: "Monk",
    family: "Ambient / Lo-fi",
    color: "#b8a9e8",
    vector: { str: 0.15, agi: 0.25, int: 0.1, wis: 0.4, cha: 0.1 },
  },
  Punk: {
    id: "Barbarian",
    family: "Punk",
    color: "#a3e635",
    vector: { str: 0.45, agi: 0.3, int: 0.05, wis: 0.05, cha: 0.15 },
  },
  Unmapped: {
    id: "Wanderer",
    family: "Unmapped",
    color: "#64748b",
    vector: { str: 0.2, agi: 0.2, int: 0.2, wis: 0.2, cha: 0.2 },
  },
};

const BY_ID = new Map<string, ClassDef>(Object.values(CLASSES).map((entry) => [entry.id, entry]));

export function classForFamily(family: string): ClassDef {
  if (isGenreFamily(family)) return CLASSES[family];
  return CLASSES.Unmapped;
}

export function classById(id: string): ClassDef | undefined {
  return BY_ID.get(id);
}
