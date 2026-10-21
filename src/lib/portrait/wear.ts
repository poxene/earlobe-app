export type WearFamily = "cap" | "hood" | "vest" | "boots" | "belt";

export type WearPalette = {
  main: string;
  light: string;
  accent?: string;
};

export type WornLook = {
  family: WearFamily;
  palette: WearPalette;
  mark?: "bone" | "gem" | "moss";
};

const CLOTH: WearPalette = { main: "#6a5848", light: "#8a7460" };
const HIDE: WearPalette = { main: "#7a5230", light: "#9a6a40" };
const WARREN: WearPalette = { main: "#6e5a4a", light: "#8a7360", accent: "#ebe0c4" };
const CANAL: WearPalette = { main: "#3a9a6a", light: "#4a7a3a", accent: "#6fd4a0" };
const MOSS_HIDE: WearPalette = { main: "#6e5a4a", light: "#8a7360", accent: "#4a7a3a" };
const MUD: WearPalette = { main: "#4a3424", light: "#6a4a30" };
const TREADS: WearPalette = { main: "#5a4638", light: "#8a7360" };
const BELT: WearPalette = { main: "#6b4226", light: "#8a5732", accent: "#c9a227" };
const CINCH: WearPalette = { main: "#5a4638", light: "#8a7360", accent: "#6fd4a0" };

const HEAD: Record<string, WornLook> = {
  frayed_cap: { family: "cap", palette: CLOTH },
  rat_king_hood: { family: "hood", palette: WARREN, mark: "bone" },
  canal_hood: { family: "hood", palette: CANAL, mark: "gem" },
};

const CHEST: Record<string, WornLook> = {
  hide_vest: { family: "vest", palette: HIDE },
  rat_king_hide: { family: "vest", palette: MOSS_HIDE, mark: "moss" },
};

const FEET: Record<string, WornLook> = {
  mud_boots: { family: "boots", palette: MUD },
  rat_king_treads: { family: "boots", palette: TREADS },
  canal_treads: { family: "boots", palette: CANAL },
};

const BELT_ITEMS: Record<string, WornLook> = {
  leather_belt: { family: "belt", palette: BELT },
  rat_king_cinch: { family: "belt", palette: CINCH },
};

function fallbackHead(slug: string): WornLook {
  return {
    family: /hood|cowl|helm/.test(slug) ? "hood" : "cap",
    palette: CLOTH,
  };
}

export function wearFor(slot: "head" | "chest" | "feet" | "belt", slug: string | null | undefined): WornLook | null {
  if (!slug) return null;
  if (slot === "head") return HEAD[slug] ?? fallbackHead(slug);
  if (slot === "chest") return CHEST[slug] ?? { family: "vest", palette: HIDE };
  if (slot === "belt") return BELT_ITEMS[slug] ?? { family: "belt", palette: BELT };
  return FEET[slug] ?? { family: "boots", palette: MUD };
}
