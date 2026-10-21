import type { Grade, TrackTier } from "@/lib/game/combat";
import type { Rarity } from "@/lib/game/loot";

export const STACK_CAP = 99;

export type MaterialTier = 0 | 1 | 2;

export type MaterialDef = {
  slug: string;
  name: string;
  monster: string;
  blurb: string;
  tier: MaterialTier;
  color: string;
};

export type MaterialDrop = {
  slug: string;
  name: string;
  quantity: number;
};

export type MaterialStackView = {
  id: string;
  slug: string;
  name: string;
  monster: string;
  blurb: string;
  color: string;
  tier: MaterialTier;
  quantity: number;
};

const MATERIALS: readonly MaterialDef[] = [
  { slug: "demon-cinder", name: "Cinder", monster: "Demon", blurb: "Warm ash shaken out of a demon's hide.", tier: 0, color: "#c1121f" },
  { slug: "demon-brimstone", name: "Brimstone", monster: "Demon", blurb: "A yellow crumb that still smells like a match.", tier: 1, color: "#e85d04" },
  { slug: "demon-horn", name: "Horn Chip", monster: "Demon", blurb: "A black curl broken from a demon's horn.", tier: 2, color: "#6b2d3c" },
  { slug: "construct-coil", name: "Scrap Coil", monster: "Construct", blurb: "Copper wound off a construct's joint.", tier: 0, color: "#00e5ff" },
  { slug: "construct-filament", name: "Glass Filament", monster: "Construct", blurb: "A thread of lit glass from a construct's chest.", tier: 1, color: "#7cf6ff" },
  { slug: "construct-core", name: "Core Shard", monster: "Construct", blurb: "A cracked piece of a construct's heart.", tier: 2, color: "#3d5a80" },
  { slug: "shadow-cloth", name: "Shade Cloth", monster: "Shadowblade", blurb: "Cloth that stays dark even in daylight.", tier: 0, color: "#d4a24e" },
  { slug: "shadow-ink", name: "Ink Vial", monster: "Shadowblade", blurb: "A stoppered drop of a shadowblade's ink.", tier: 1, color: "#6b4f2a" },
  { slug: "shadow-flake", name: "Blade Flake", monster: "Shadowblade", blurb: "A thin flake off a shadowblade's edge.", tier: 2, color: "#f0d7a2" },
  { slug: "celestial-dust", name: "Hymn Dust", monster: "Celestial Guardian", blurb: "Pale dust that hums if you hold it still.", tier: 0, color: "#f4f1de" },
  { slug: "celestial-filing", name: "Halo Filing", monster: "Celestial Guardian", blurb: "A bright shaving from a guardian's halo.", tier: 1, color: "#e6d3a3" },
  { slug: "celestial-salt", name: "Star Salt", monster: "Celestial Guardian", blurb: "Coarse salt that glitters like a night sky.", tier: 2, color: "#c9b8ff" },
  { slug: "fae-pollen", name: "Pollen", monster: "Trickster Fae", blurb: "Gold dust from a fae's sleeve.", tier: 0, color: "#4361ee" },
  { slug: "fae-ribbon", name: "Trick Ribbon", monster: "Trickster Fae", blurb: "A knot of ribbon that will not stay tied.", tier: 1, color: "#8ecae6" },
  { slug: "fae-seed", name: "Spiral Seed", monster: "Trickster Fae", blurb: "A seed curled into the fae's spiral mark.", tier: 2, color: "#b8f2e6" },
  { slug: "ogre-stone", name: "Knuckle Stone", monster: "Ogre", blurb: "A smooth stone worked out of an ogre's fist.", tier: 0, color: "#ff6b35" },
  { slug: "ogre-hide", name: "Hide Scrap", monster: "Ogre", blurb: "A stiff scrap of ogre hide.", tier: 1, color: "#bc6c25" },
  { slug: "ogre-marrow", name: "Marrow", monster: "Ogre", blurb: "A pale stick of ogre marrow.", tier: 2, color: "#f4e1c1" },
  { slug: "siren-glass", name: "Sea Glass", monster: "Siren", blurb: "A worn green pebble from a siren's tide.", tier: 0, color: "#ff2e93" },
  { slug: "siren-scale", name: "Scale", monster: "Siren", blurb: "One pink scale, still a little wet.", tier: 1, color: "#ff8fab" },
  { slug: "siren-pearl", name: "Pearl Chip", monster: "Siren", blurb: "A chip of pearl from a siren's throat.", tier: 2, color: "#f7e1ea" },
  { slug: "beast-fur", name: "Coarse Fur", monster: "Dire Beast", blurb: "A tuft of fur from a dire beast.", tier: 0, color: "#386641" },
  { slug: "beast-fang", name: "Fang", monster: "Dire Beast", blurb: "A short fang, yellow at the root.", tier: 1, color: "#a7c957" },
  { slug: "beast-claw", name: "Claw Tip", monster: "Dire Beast", blurb: "The snapped tip of a dire beast's claw.", tier: 2, color: "#dad7cd" },
  { slug: "void-dust", name: "Hush Dust", monster: "Voidling", blurb: "Dust that makes the air around it quieter.", tier: 0, color: "#b8a9e8" },
  { slug: "void-eye", name: "Glass Eye", monster: "Voidling", blurb: "A cloudy eye that does not blink.", tier: 1, color: "#6c584c" },
  { slug: "void-mote", name: "Void Mote", monster: "Voidling", blurb: "A dark speck that is heavier than it looks.", tier: 2, color: "#2b2d42" },
  { slug: "gremlin-nail", name: "Bent Nail", monster: "Rioter Gremlin", blurb: "A nail a gremlin worried between its teeth.", tier: 0, color: "#a3e635" },
  { slug: "gremlin-spark", name: "Spark Plug", monster: "Rioter Gremlin", blurb: "A plug that still throws a small spark.", tier: 1, color: "#65a30d" },
  { slug: "gremlin-cap", name: "Noise Cap", monster: "Rioter Gremlin", blurb: "A cap that pops if you squeeze it.", tier: 2, color: "#ecfccb" },
  { slug: "mimic-wax", name: "Wax Lump", monster: "Mimic", blurb: "Soft wax a mimic used to fake a seam.", tier: 0, color: "#64748b" },
  { slug: "mimic-flake", name: "Mirror Flake", monster: "Mimic", blurb: "A flake of mirror from a mimic's lid.", tier: 1, color: "#94a3b8" },
  { slug: "mimic-coin", name: "False Coin", monster: "Mimic", blurb: "A coin that looks like gold until it bends.", tier: 2, color: "#e2b15a" },
];

const BY_SLUG = new Map(MATERIALS.map((row) => [row.slug, row]));
const BY_MONSTER = new Map<string, MaterialDef[]>();
for (const row of MATERIALS) {
  const list = BY_MONSTER.get(row.monster) ?? [];
  list.push(row);
  BY_MONSTER.set(row.monster, list);
}

const DROP_WEIGHT = [60, 30, 10];

export const TRANSMUTE_COST: Record<Exclude<Rarity, "mythic">, { gold: number; materials: number }> = {
  common: { gold: 20, materials: 4 },
  magic: { gold: 50, materials: 8 },
  rare: { gold: 120, materials: 14 },
  legendary: { gold: 320, materials: 20 },
};

export function materialBySlug(slug: string): MaterialDef | null {
  return BY_SLUG.get(slug) ?? null;
}

export function materialsForMonster(monster: string): MaterialDef[] {
  return BY_MONSTER.get(monster) ?? [];
}

export function materialCount(tier: TrackTier, grade: Grade): number {
  const base = tier === "boss" ? 3 : tier === "elite" ? 2 : 1;
  return grade === "FLAWLESS" ? base + 1 : base;
}

export function rollMaterialDrops(input: { monster: string; tier: TrackTier; grade: Grade; salt: string }): MaterialDrop[] {
  const kinds = [...materialsForMonster(input.monster)].sort((a, b) => a.tier - b.tier);
  if (kinds.length === 0) return [];
  const totals = new Map<string, number>();
  const count = materialCount(input.tier, input.grade);
  for (let index = 0; index < count; index += 1) {
    const kind = pickWeighted(kinds, hash(`${input.salt}:${index}`));
    totals.set(kind.slug, (totals.get(kind.slug) ?? 0) + 1);
  }
  return [...totals].flatMap(([slug, quantity]) => {
    const kind = kinds.find((row) => row.slug === slug);
    return kind ? [{ slug, name: kind.name, quantity }] : [];
  });
}

export function transmuteMonster(relics: readonly { id: string; monsterType: string }[]): string | null {
  if (relics.length === 0) return null;
  const ordered = [...relics].sort((a, b) => a.id.localeCompare(b.id));
  const salt = ordered.map((row) => row.id).join(":");
  const picked = ordered[hash(salt) % ordered.length];
  return picked?.monsterType ?? null;
}

function pickWeighted(kinds: MaterialDef[], seed: number): MaterialDef {
  let total = 0;
  for (let index = 0; index < kinds.length; index += 1) total += DROP_WEIGHT[index] ?? 10;
  let point = seed % total;
  for (let index = 0; index < kinds.length; index += 1) {
    point -= DROP_WEIGHT[index] ?? 10;
    const kind = kinds[index];
    if (point < 0 && kind) return kind;
  }
  const last = kinds[kinds.length - 1];
  if (!last) throw new Error("missing material");
  return last;
}

function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) value = (value * 33 + seed.charCodeAt(index)) >>> 0;
  return value;
}
