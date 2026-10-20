import type { GenreFamily } from "@/lib/music/normalize";
import { monsterForFamily } from "@/lib/game/bestiary";

export type BodyKind = "hulk" | "wisp" | "beast" | "knight" | "imp" | "serpent";
export type HeadKind = "horns" | "mask" | "crown" | "hood" | "eye" | "plain";
export type ArmKind = "claws" | "blades" | "fists" | "wings" | "none";
export type ExtraKind = "halo" | "tail" | "spikes" | "shards" | "none";

export type Recipe = {
  body: BodyKind;
  head: HeadKind;
  arms: ArmKind;
  extra: ExtraKind;
};

export type Variety = {
  id: string;
  name: string;
  family: GenreFamily;
  canon: string;
  recipe: Recipe;
};

const TABLE: Record<GenreFamily, Variety[]> = {
  Metal: [
    variety("metal-demon", "Horned Demon", "Metal", { body: "hulk", head: "horns", arms: "claws", extra: "spikes" }),
    variety("metal-imp", "Cinder Imp", "Metal", { body: "imp", head: "horns", arms: "claws", extra: "tail" }),
    variety("metal-cantor", "Grave Cantor", "Metal", { body: "knight", head: "hood", arms: "blades", extra: "halo" }),
  ],
  Electronic: [
    variety("elec-hex", "Hex Construct", "Electronic", { body: "knight", head: "eye", arms: "none", extra: "shards" }),
    variety("elec-coil", "Coil Wisp", "Electronic", { body: "wisp", head: "eye", arms: "none", extra: "shards" }),
    variety("elec-relay", "Relay Beast", "Electronic", { body: "beast", head: "mask", arms: "claws", extra: "shards" }),
  ],
  "Hip-hop": [
    variety("hop-blade", "Shadowblade", "Hip-hop", { body: "knight", head: "mask", arms: "blades", extra: "none" }),
    variety("hop-saint", "Alley Saint", "Hip-hop", { body: "wisp", head: "hood", arms: "blades", extra: "tail" }),
    variety("hop-chain", "Chain Imp", "Hip-hop", { body: "imp", head: "hood", arms: "fists", extra: "spikes" }),
  ],
  Classical: [
    variety("class-guard", "Celestial Guardian", "Classical", { body: "knight", head: "crown", arms: "blades", extra: "halo" }),
    variety("class-choir", "Choir Saint", "Classical", { body: "wisp", head: "crown", arms: "wings", extra: "halo" }),
    variety("class-hound", "Marble Hound", "Classical", { body: "beast", head: "crown", arms: "claws", extra: "none" }),
  ],
  Jazz: [
    variety("jazz-fae", "Trickster Fae", "Jazz", { body: "imp", head: "mask", arms: "claws", extra: "tail" }),
    variety("jazz-smoke", "Smoke Dancer", "Jazz", { body: "serpent", head: "mask", arms: "wings", extra: "none" }),
    variety("jazz-note", "Blue Note", "Jazz", { body: "wisp", head: "hood", arms: "none", extra: "halo" }),
  ],
  Rock: [
    variety("rock-ogre", "Pit Ogre", "Rock", { body: "hulk", head: "horns", arms: "fists", extra: "spikes" }),
    variety("rock-amp", "Amp Golem", "Rock", { body: "knight", head: "eye", arms: "fists", extra: "shards" }),
    variety("rock-road", "Road Beast", "Rock", { body: "beast", head: "horns", arms: "claws", extra: "tail" }),
  ],
  Pop: [
    variety("pop-siren", "Siren", "Pop", { body: "serpent", head: "crown", arms: "wings", extra: "none" }),
    variety("pop-chorus", "Chorus Wisp", "Pop", { body: "wisp", head: "crown", arms: "wings", extra: "halo" }),
    variety("pop-heart", "Heartshade", "Pop", { body: "imp", head: "mask", arms: "none", extra: "tail" }),
  ],
  "Folk / Country": [
    variety("folk-dire", "Dire Beast", "Folk / Country", { body: "beast", head: "horns", arms: "claws", extra: "tail" }),
    variety("folk-stag", "Briar Stag", "Folk / Country", { body: "hulk", head: "horns", arms: "none", extra: "spikes" }),
    variety("folk-wolf", "Hollow Wolf", "Folk / Country", { body: "beast", head: "hood", arms: "claws", extra: "none" }),
  ],
  "Ambient / Lo-fi": [
    variety("amb-void", "Voidling", "Ambient / Lo-fi", { body: "wisp", head: "eye", arms: "none", extra: "halo" }),
    variety("amb-drift", "Drift Mote", "Ambient / Lo-fi", { body: "imp", head: "eye", arms: "wings", extra: "none" }),
    variety("amb-watch", "Pale Watcher", "Ambient / Lo-fi", { body: "knight", head: "eye", arms: "none", extra: "halo" }),
  ],
  Punk: [
    variety("punk-gremlin", "Rioter Gremlin", "Punk", { body: "imp", head: "horns", arms: "fists", extra: "spikes" }),
    variety("punk-rat", "Spike Rat", "Punk", { body: "beast", head: "plain", arms: "claws", extra: "spikes" }),
    variety("punk-goblin", "Stage Goblin", "Punk", { body: "imp", head: "mask", arms: "fists", extra: "tail" }),
  ],
  Unmapped: [
    variety("unk-mimic", "Mimic", "Unmapped", { body: "imp", head: "mask", arms: "claws", extra: "shards" }),
    variety("unk-face", "Faceless", "Unmapped", { body: "wisp", head: "plain", arms: "none", extra: "shards" }),
    variety("unk-patch", "Patchwork", "Unmapped", { body: "hulk", head: "hood", arms: "fists", extra: "tail" }),
  ],
};

const BY_ID = new Map<string, Variety>(Object.values(TABLE).flat().map((entry) => [entry.id, entry]));

export function varietiesFor(family: string): Variety[] {
  const canon = monsterForFamily(family);
  return TABLE[canon.family];
}

export function varietyById(id: string): Variety | undefined {
  return BY_ID.get(id);
}

export function varietyFor(family: string, seed: string): Variety {
  const rows = varietiesFor(family);
  const picked = rows[hash(seed) % rows.length] ?? rows[0];
  if (!picked) throw new Error(`no varieties for ${family}`);
  return picked;
}

function variety(id: string, name: string, family: GenreFamily, recipe: Recipe): Variety {
  return { id, name, family, canon: monsterForFamily(family).monster, recipe };
}

function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return value;
}
