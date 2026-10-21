export const DOLL_SLOTS = [
  "charm",
  "head",
  "amulet",
  "weapon",
  "chest",
  "offhand",
  "hands",
  "belt",
  "tool",
  "ring_1",
  "legs",
  "ring_2",
  "feet",
] as const;

export type EquipSlot = (typeof DOLL_SLOTS)[number];

export const SLOT_LABEL: Record<EquipSlot, string> = {
  charm: "Charm",
  head: "Head",
  amulet: "Amulet",
  weapon: "Weapon",
  chest: "Chest",
  offhand: "Offhand",
  hands: "Hands",
  belt: "Belt",
  tool: "Tool",
  ring_1: "Ring",
  legs: "Legs",
  ring_2: "Ring",
  feet: "Feet",
};

export type GearPiece = {
  slug: string;
  name: string;
  slot: EquipSlot;
  kind: "armor" | "weapon" | "tool";
  twoHanded: boolean;
  isFocus: boolean;
};

export const CATALOG: GearPiece[] = [
  { slug: "frayed_cap", name: "Frayed Cap", slot: "head", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "rat_king_hood", name: "Bone-Crowned Hood", slot: "head", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "canal_hood", name: "Canal Hood", slot: "head", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "hide_vest", name: "Hide Vest", slot: "chest", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "rat_king_hide", name: "Warren Hide", slot: "chest", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "scrap_wraps", name: "Scrap Wraps", slot: "hands", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "rat_king_wraps", name: "Gnawed Wraps", slot: "hands", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "canal_wraps", name: "Gelbound Wraps", slot: "hands", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "patchwork_greaves", name: "Patchwork Greaves", slot: "legs", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "rat_king_greaves", name: "Tail-Laced Greaves", slot: "legs", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "mud_boots", name: "Mud Boots", slot: "feet", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "rat_king_treads", name: "Sewer Treads", slot: "feet", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "canal_treads", name: "Moss-Slick Treads", slot: "feet", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "leather_belt", name: "Leather Belt", slot: "belt", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "rat_king_cinch", name: "Core-Buckled Cinch", slot: "belt", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "brass_ring", name: "Brass Ring", slot: "ring_1", kind: "armor", twoHanded: false, isFocus: false },
  { slug: "dagger", name: "Dagger", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "rusty_knife", name: "Rusty Knife", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "bone_shiv", name: "Bone Shiv", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "knotted_club", name: "Knotted Club", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "scrap_cleaver", name: "Scrap Cleaver", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "short_sword", name: "Short Sword", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "long_sword", name: "Long Sword", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "morning_star", name: "Morning Star", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "cleaver", name: "Cleaver", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "mace", name: "Mace", slot: "weapon", kind: "weapon", twoHanded: false, isFocus: false },
  { slug: "great_axe", name: "Great Axe", slot: "weapon", kind: "weapon", twoHanded: true, isFocus: false },
  { slug: "claymore", name: "Claymore", slot: "weapon", kind: "weapon", twoHanded: true, isFocus: false },
  { slug: "evening_star", name: "Evening Star", slot: "weapon", kind: "weapon", twoHanded: true, isFocus: false },
  { slug: "knotted_staff", name: "Knotted Staff", slot: "weapon", kind: "weapon", twoHanded: true, isFocus: true },
  { slug: "pitch_staff", name: "Pitch Staff", slot: "weapon", kind: "weapon", twoHanded: true, isFocus: true },
  { slug: "moon_staff", name: "Moon Staff", slot: "weapon", kind: "weapon", twoHanded: true, isFocus: true },
  { slug: "copper_staff", name: "Copper Staff", slot: "weapon", kind: "weapon", twoHanded: true, isFocus: true },
  { slug: "ash_wand", name: "Ash Wand", slot: "offhand", kind: "weapon", twoHanded: false, isFocus: true },
  { slug: "pitch_wand", name: "Pitch Wand", slot: "offhand", kind: "weapon", twoHanded: false, isFocus: true },
  { slug: "moon_wand", name: "Moon Wand", slot: "offhand", kind: "weapon", twoHanded: false, isFocus: true },
  { slug: "copper_wand", name: "Copper Wand", slot: "offhand", kind: "weapon", twoHanded: false, isFocus: true },
  { slug: "hatchet", name: "Hatchet", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
  { slug: "wooden_hatchet", name: "Wooden Hatchet", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
  { slug: "woodsman_axe", name: "Woodsman's Axe", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
  { slug: "wickerby_axe", name: "Calder's Edge", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
  { slug: "felling_axe", name: "Felling Axe", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
  { slug: "broadaxe", name: "Broadaxe", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
  { slug: "warden_axe", name: "Warden's Axe", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
  { slug: "lute", name: "Lute", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
  { slug: "flute", name: "Flute", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
  { slug: "hand_drum", name: "Hand Drum", slot: "tool", kind: "tool", twoHanded: false, isFocus: false },
];

const BY_SLUG = new Map(CATALOG.map((piece) => [piece.slug, piece]));

const LEGACY_SLOT: Record<number, EquipSlot> = { 0: "head", 1: "chest", 2: "belt" };

export function slotIndex(slot: EquipSlot): number {
  return DOLL_SLOTS.indexOf(slot);
}

export function gearBySlug(slug: string | null | undefined): GearPiece | null {
  if (!slug) return null;
  return BY_SLUG.get(slug) ?? null;
}

export function gearForSalt(salt: string): GearPiece {
  return pick(CATALOG, salt);
}

export function gearForLegacySlot(id: string, oldSlot: number): GearPiece {
  const slot = LEGACY_SLOT[oldSlot] ?? "head";
  return pick(
    CATALOG.filter((piece) => piece.slot === slot),
    id,
  );
}

function pick(list: GearPiece[], salt: string): GearPiece {
  const piece = list[hash(salt) % list.length];
  if (!piece) throw new Error("empty gear catalog");
  return piece;
}

export function itemFits(piece: GearPiece, index: number): boolean {
  const dest = DOLL_SLOTS[index];
  if (!dest) return false;
  if (piece.slot === dest) return true;
  return (piece.slot === "ring_1" || piece.slot === "ring_2") && (dest === "ring_1" || dest === "ring_2");
}

export function fittingSlots(piece: GearPiece): number[] {
  return DOLL_SLOTS.map((_, index) => index).filter((index) => itemFits(piece, index));
}

export function slotPhrase(piece: GearPiece): string {
  if (piece.slot === "ring_1" || piece.slot === "ring_2") return "ring";
  return SLOT_LABEL[piece.slot].toLowerCase();
}

export function relicTitle(monster: string, piece: GearPiece): string {
  return `${monster} ${piece.name}`;
}

export function itemIsStaff(piece: Pick<GearPiece, "slug" | "twoHanded" | "isFocus">): boolean {
  if (/staff/.test(piece.slug)) return true;
  return piece.twoHanded && piece.isFocus;
}

export function pieceOf(relic: { id: string; gearSlug?: string | null }): GearPiece {
  return gearBySlug(relic.gearSlug) ?? gearForSalt(relic.id);
}

function hash(id: string): number {
  let value = 0;
  for (let i = 0; i < id.length; i += 1) value = (value * 33 + id.charCodeAt(i)) >>> 0;
  return value;
}
