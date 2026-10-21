import { classById, classForFamily } from "@/lib/game/classes";
import { calculateDps } from "@/lib/game/combat";
import type { Cut, RelicEffect } from "@/lib/game/effects";
import { fightDps } from "@/lib/game/effects";
import { masteryTitle } from "@/lib/game/titles";
import type { BodyType } from "@/lib/portrait/body";
import { DOLL_SLOTS } from "@/lib/portrait/gear";
import { legacyGrant } from "@/lib/game/trees";
import { xpProgress } from "@/lib/game/xp";
import type { ProviderArtist } from "@/lib/music/provider";
import { familiesForArtist, GENRE_FAMILIES, type GenreFamily } from "@/lib/music/normalize";

export type Stats = {
  str: number;
  agi: number;
  int: number;
  wis: number;
  cha: number;
};

export type StatKey = keyof Stats;

export type StatAffix = {
  stat: StatKey;
  amount: number;
};

export function affixLines(relic: { bonuses: Stats; affixes?: readonly StatAffix[] }): StatAffix[] {
  if (relic.affixes && relic.affixes.length > 0) return [...relic.affixes];
  return (Object.entries(relic.bonuses) as [StatKey, number][])
    .filter(([, amount]) => amount > 0)
    .map(([stat, amount]) => ({ stat, amount }));
}

export type AlbumCover = {
  id: string;
  name: string;
  artistName: string;
  imageUrl: string | null;
};

export type GenreShare = {
  family: GenreFamily;
  share: number;
};

export type GenreBar = {
  family: string;
  share: number;
  color: string;
};

export type RelicView = {
  id: string;
  name: string;
  gearSlug: string;
  rarity: "common" | "magic" | "rare" | "legendary" | "mythic";
  monsterType: string;
  family: string;
  color: string;
  bonuses: Stats;
  affixes: StatAffix[];
  effects: RelicEffect[];
  cut: Cut | null;
};

export type UnlockedClassView = {
  id: string;
  color: string;
};

export type ListenerRecord = {
  listens: number;
  highestEcho: number;
  faded: number;
  artists: number;
  albums: number;
  albumsFinished: number;
  relics: number;
};

export const EMPTY_RECORD: ListenerRecord = {
  listens: 0,
  highestEcho: 0,
  faded: 0,
  artists: 0,
  albums: 0,
  albumsFinished: 0,
  relics: 0,
};

export type CharacterSheetModel = {
  displayName: string;
  className: string;
  masteryTitle: string;
  subclass: string | null;
  classColor: string;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNext: number;
  xpFraction: number;
  stats: Stats;
  dps: number;
  genres: GenreBar[];
  albums: AlbumCover[];
  relics: (RelicView | null)[];
  inventory: RelicView[];
  echoes: number;
  unallocatedPoints: number;
  skills: string[];
  skillPicks: number;
  treeNodes: string[];
  legacyPoints: number;
  unlocked: UnlockedClassView[];
  switchReadyAt: string | null;
  victories: number;
  escapes: number;
  record: ListenerRecord;
  thinHistory: boolean;
  badges: string[];
  body: BodyType;
};

export type BuiltCharacter = {
  model: CharacterSheetModel;
  activeClass: string;
  subclass: string | null;
  unlockedClasses: string[];
  stats: Stats;
  genreShares: GenreShare[];
  albums: AlbumCover[];
};

//— second family must be a real slice of the blend, not a single stray tag
export const SUBCLASS_MIN_SHARE = 0.15;

type RankedFamily = GenreShare & { weight: number };

export function buildCharacter(input: {
  displayName: string;
  level: number;
  xp: number;
  artists: ProviderArtist[];
  albums: AlbumCover[];
  victories?: number;
  escapes?: number;
  activeClass?: string | null;
  unlockedClasses?: string[];
}): BuiltCharacter {
  const ranked = rankFamilies(weightByFamily(input.artists));
  const genreShares = ranked.map(({ family, share }) => ({ family, share }));
  const grant = legacyGrant({ artistCount: input.artists.length, shares: genreShares });
  const primary = classForFamily(ranked[0]?.family ?? "Unmapped");
  const second = ranked[1];
  const subclass =
    second && second.family !== primary.family && second.share >= SUBCLASS_MIN_SHARE
      ? classForFamily(second.family).id
      : null;

  //— the generated primary is granted at attunement. a real slice of the old library unlocks its class too.
  const unlocked = new Set(input.unlockedClasses ?? []);
  for (const id of grant.classes) unlocked.add(id);
  const requested = input.activeClass ? classById(input.activeClass) : undefined;
  const active = requested && unlocked.has(requested.id) ? requested : primary;
  const stats = baseStats();
  const progress = xpProgress(input.level, input.xp);

  const model: CharacterSheetModel = {
    displayName: input.displayName,
    className: active.id,
    subclass,
    classColor: active.color,
    level: input.level,
    xp: input.xp,
    xpIntoLevel: progress.into,
    xpForNext: progress.span,
    xpFraction: progress.fraction,
    stats,
    dps: fightDps(calculateDps(stats), stats, [], 0),
    genres: genreShares.slice(0, 5).map((row) => ({
      family: row.family,
      share: row.share,
      color: classForFamily(row.family).color,
    })),
    albums: input.albums.slice(0, 4),
    relics: DOLL_SLOTS.map(() => null),
    inventory: [],
    echoes: 0,
    unallocatedPoints: 0,
    skills: [],
    skillPicks: grant.points,
    treeNodes: [],
    legacyPoints: grant.points,
    unlocked: [...unlocked].map((id) => {
      const entry = classById(id) ?? primary;
      return { id: entry.id, color: entry.color };
    }),
    switchReadyAt: null,
    masteryTitle: masteryTitle(active.id, input.level),
    victories: input.victories ?? 0,
    escapes: input.escapes ?? 0,
    record: EMPTY_RECORD,
    thinHistory: input.artists.length === 0,
    badges: [],
    body: "body6",
  };

  return {
    model,
    activeClass: active.id,
    subclass,
    unlockedClasses: [...unlocked],
    stats,
    genreShares,
    albums: model.albums,
  };
}

function weightByFamily(artists: ProviderArtist[]): Map<GenreFamily, number> {
  const totals = new Map<GenreFamily, number>();
  artists.forEach((artist, index) => {
    const weight = artists.length - index;
    const families = familiesForArtist(artist.genres);
    const slice = weight / families.length;
    for (const family of families) {
      totals.set(family, (totals.get(family) ?? 0) + slice);
    }
  });
  return totals;
}

function rankFamilies(weights: Map<GenreFamily, number>): RankedFamily[] {
  if (weights.size === 0) return [{ family: "Unmapped", share: 1, weight: 1 }];
  const total = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
  return [...weights.entries()]
    .map(([family, weight]) => ({ family, share: weight / total, weight }))
    .sort(
      (a, b) => b.weight - a.weight || GENRE_FAMILIES.indexOf(a.family) - GENRE_FAMILIES.indexOf(b.family),
    );
}

//— opening stats are 10. class vectors spend level-up points.
function baseStats(): Stats {
  return { str: 10, agi: 10, int: 10, wis: 10, cha: 10 };
}
