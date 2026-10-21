import { buildCharacter, type AlbumCover, type CharacterSheetModel, type ListenerRecord, type RelicView, type Stats } from "../../src/lib/game/character";
import type { MaterialStackView } from "../../src/lib/game/materials";
import { addStats, calculateDps, sumStats } from "../../src/lib/game/combat";
import { fightDps, parseStoredEffects } from "../../src/lib/game/effects";
import { treeEffects } from "../../src/lib/game/trees";
import { classById, classForFamily } from "../../src/lib/game/classes";
import { isRarity } from "../../src/lib/game/loot";
import { masteryTitle } from "../../src/lib/game/titles";
import { parseBody } from "../../src/lib/portrait/body";
import { DOLL_SLOTS, itemFits, pieceOf } from "../../src/lib/portrait/gear";
import { xpProgress } from "../../src/lib/game/xp";
import { isRecord } from "../../src/lib/isRecord";
import type { PortraitAlbum } from "../database";
import { getSupabase } from "../supabase";
import { parseRolls } from "./bonus";
import { fetchPlaycount } from "./lastfmClient";
import { topAlbums, topArtists } from "./listening";
import { readStacks } from "./materials";
import { getProfile, type ProfileRecord } from "./profiles";

const DAY_MS = 24 * 60 * 60 * 1000;
const SCROBBLE_TTL_MS = 10 * 60 * 1000;
const scrobbles = new Map<string, { count: number; at: number }>();

type StoredCharacter = {
  activeClass: string;
  subclass: string | null;
  unlockedClasses: string[];
  level: number;
  xp: number;
  stats: Stats;
  bonus: Stats;
  albums: AlbumCover[];
  echoes: number;
  unallocated: number;
  skills: string[];
  skillPicks: number;
  treeNodes: string[];
  legacyPoints: number;
  badges: string[];
  body: string;
};

type WeightRow = {
  family: string;
  hours30d: number;
  share: number;
  updatedAt: number;
};

export async function loadCharacterSheet(userId: string): Promise<CharacterSheetModel> {
  const profile = await getProfile(userId);
  if (!profile) throw new Error("unauthenticated");

  const existing = await readCharacter(userId);
  const weights = await readWeights(userId);
  const newest = weights.reduce((max, row) => Math.max(max, row.updatedAt), 0);
  const fresh = existing !== null && weights.length > 0 && Date.now() - newest < DAY_MS;
  if (!(existing && fresh)) {
    const [artists, albums] = await Promise.all([topArtists(userId, 50), topAlbums(userId, 12)]);
    const built = buildCharacter({
      displayName: profile.displayName,
      level: existing?.level ?? 1,
      xp: existing?.xp ?? 0,
      artists,
      albums,
      activeClass: existing?.activeClass ?? null,
      unlockedClasses: existing?.unlockedClasses ?? [],
    });
    await persistCharacter(userId, built, existing, weights);
  }
  return presentCharacter(userId);
}

async function persistCharacter(
  userId: string,
  built: ReturnType<typeof buildCharacter>,
  existing: StoredCharacter | null,
  weights: WeightRow[],
): Promise<void> {
  const supabase = getSupabase();
  const portrait = built.albums satisfies PortraitAlbum[];
  const keepStats = weights.some((row) => row.hours30d > 0);
  if (!existing) {
    const { error } = await supabase.from("characters").insert({
      user_id: userId,
      active_class: built.activeClass,
      subclass: built.subclass,
      unlocked_classes: built.unlockedClasses,
      level: 1,
      xp: 0,
      stat_str: built.stats.str,
      stat_agi: built.stats.agi,
      stat_int: built.stats.int,
      stat_wis: built.stats.wis,
      stat_cha: built.stats.cha,
      portrait,
      skill_picks: built.model.legacyPoints,
      legacy_points: built.model.legacyPoints,
      legacy_awarded: true,
      tree_nodes: [],
    });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("characters")
      .update({
        active_class: built.activeClass,
        subclass: built.subclass,
        unlocked_classes: mergeUnlocked(existing.unlockedClasses, built.unlockedClasses),
        portrait,
        ...(keepStats
          ? {}
          : {
              stat_str: built.stats.str,
              stat_agi: built.stats.agi,
              stat_int: built.stats.int,
              stat_wis: built.stats.wis,
              stat_cha: built.stats.cha,
            }),
      })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  }

  const hours = new Map(weights.map((row) => [row.family, row.hours30d]));
  const next = new Map<string, { share: number; hours: number }>();
  for (const row of built.genreShares) {
    next.set(row.family, { share: row.share, hours: hours.get(row.family) ?? 0 });
  }
  for (const [family, value] of hours) {
    if (value > 0 && !next.has(family)) next.set(family, { share: 0, hours: value });
  }
  const updatedAt = new Date().toISOString();
  const { error: deleteError } = await supabase.from("genre_weights").delete().eq("user_id", userId);
  if (deleteError) throw new Error(deleteError.message);
  const { error: insertError } = await supabase.from("genre_weights").insert(
    [...next.entries()].map(([family, row]) => ({
      user_id: userId,
      genre_family: family,
      hours_30d: row.hours,
      share: Math.min(1, Number(row.share.toFixed(6))),
      updated_at: updatedAt,
    })),
  );
  if (insertError) throw new Error(insertError.message);
}

export async function presentCharacter(userId: string): Promise<CharacterSheetModel> {
  const profile = await getProfile(userId);
  if (!profile) throw new Error("unauthenticated");
  const character = await readCharacter(userId);
  if (!character) throw new Error("unauthenticated");
  const [weights, relics, victories, escapes, record, stacks] = await Promise.all([
    readWeights(userId),
    readRelics(userId),
    countOutcomes(userId, "victory"),
    countOutcomes(userId, "escaped"),
    readRecord(userId),
    readStacks(userId),
  ]);
  return modelFromStored(profile, character, weights, relics, victories, escapes, { ...record, relics: relics.length }, stacks);
}

function modelFromStored(
  profile: ProfileRecord,
  character: StoredCharacter,
  weights: WeightRow[],
  relics: StoredRelic[],
  victories: number,
  escapes: number,
  record: ListenerRecord,
  stacks: MaterialStackView[],
): CharacterSheetModel {
  const useHours = weights.some((row) => row.hours30d > 0);
  const total = weights.reduce((sum, row) => sum + (useHours ? row.hours30d : row.share), 0) || 1;
  const ranked = [...weights].sort((a, b) => (useHours ? b.hours30d - a.hours30d : b.share - a.share));
  const active = classById(character.activeClass) ?? classForFamily("Unmapped");
  const progress = xpProgress(character.level, character.xp);
  const equipped = relics.filter((relic) => relic.equipped);
  const inventory = relics.filter((relic) => !relic.equipped);
  const tree = treeEffects(active.id, character.treeNodes);
  const stats = addStats(
    character.stats,
    sumStats([character.bonus, tree.bonus, ...equipped.map((relic) => relic.bonuses)]),
  );
  const slots = placeRelics(equipped);
  const thinHistory = character.albums.length === 0 && weights.every((row) => row.family === "Unmapped");

  return {
    displayName: profile.displayName,
    className: active.id,
    masteryTitle: masteryTitle(active.id, character.level),
    subclass: character.subclass,
    classColor: active.color,
    level: character.level,
    xp: character.xp,
    xpIntoLevel: progress.into,
    xpForNext: progress.span,
    xpFraction: progress.fraction,
    stats,
    dps: fightDps(
      calculateDps(stats),
      stats,
      equipped.flatMap((relic) => relic.effects),
      0,
    ),
    genres: ranked.slice(0, 5).map((row) => ({
      family: row.family,
      share: (useHours ? row.hours30d : row.share) / total,
      color: classForFamily(row.family).color,
    })),
    albums: character.albums,
    relics: slots,
    inventory,
    stacks,
    echoes: character.echoes,
    unallocatedPoints: character.unallocated,
    skills: character.skills,
    skillPicks: character.skillPicks,
    treeNodes: character.treeNodes,
    legacyPoints: character.legacyPoints,
    unlocked: character.unlockedClasses.flatMap((id) => {
      const entry = classById(id);
      return entry ? [{ id: entry.id, color: entry.color }] : [];
    }),
    switchReadyAt: null,
    victories,
    escapes,
    record,
    thinHistory,
    badges: character.badges,
    body: parseBody(character.body),
  };
}

async function readCharacter(userId: string): Promise<StoredCharacter | null> {
  const { data, error } = await getSupabase()
    .from("characters")
    .select(
      "active_class, subclass, unlocked_classes, level, xp, stat_str, stat_agi, stat_int, stat_wis, stat_cha, stat_bonus_str, stat_bonus_agi, stat_bonus_int, stat_bonus_wis, stat_bonus_cha, unallocated_points, echoes, badges, portrait, skills, skill_picks, tree_nodes, legacy_points, body",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    activeClass: data.active_class,
    subclass: data.subclass,
    unlockedClasses: data.unlocked_classes,
    level: data.level,
    xp: data.xp,
    stats: {
      str: data.stat_str,
      agi: data.stat_agi,
      int: data.stat_int,
      wis: data.stat_wis,
      cha: data.stat_cha,
    },
    albums: parseAlbums(data.portrait),
    bonus: {
      str: data.stat_bonus_str,
      agi: data.stat_bonus_agi,
      int: data.stat_bonus_int,
      wis: data.stat_bonus_wis,
      cha: data.stat_bonus_cha,
    },
    echoes: data.echoes,
    unallocated: data.unallocated_points,
    skills: data.skills ?? [],
    skillPicks: data.skill_picks,
    treeNodes: data.tree_nodes ?? [],
    legacyPoints: data.legacy_points,
    badges: data.badges ?? [],
    body: data.body,
  };
}

async function readWeights(userId: string): Promise<WeightRow[]> {
  const { data, error } = await getSupabase()
    .from("genre_weights")
    .select("genre_family, hours_30d, share, updated_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    family: row.genre_family,
    hours30d: Number(row.hours_30d),
    share: Number(row.share),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

type StoredRelic = RelicView & { equipped: boolean; equipSlot: number | null };

function placeRelics(equipped: StoredRelic[]): (RelicView | null)[] {
  const slots: (StoredRelic | null)[] = DOLL_SLOTS.map(() => null);
  for (const relic of equipped) {
    const index = relic.equipSlot;
    if (index != null && itemFits(pieceOf(relic), index) && !slots[index]) slots[index] = relic;
  }
  return slots.map((relic) => (relic ? viewOf(relic) : null));
}

function viewOf(relic: StoredRelic): RelicView {
  return {
    id: relic.id,
    name: relic.name,
    gearSlug: pieceOf(relic).slug,
    rarity: relic.rarity,
    monsterType: relic.monsterType,
    family: relic.family,
    color: relic.color,
    bonuses: relic.bonuses,
    affixes: relic.affixes,
    effects: relic.effects,
    cut: relic.cut,
  };
}

function mergeUnlocked(current: string[], generated: string[]): string[] {
  return [...new Set([...current, ...generated])];
}

async function readRelics(userId: string): Promise<StoredRelic[]> {
  const { data, error } = await getSupabase()
    .from("relics")
    .select("id, name, monster_type, genre_family, rarity, stat_bonuses, effects, equipped, equip_slot, gear_slug")
    .eq("user_id", userId)
    .order("acquired_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    if (!isRarity(row.rarity)) return [];
    const family = classForFamily(row.genre_family);
    const stored = parseStoredEffects(row.effects);
    return [
      {
        id: row.id,
        name: row.name,
        gearSlug: row.gear_slug ?? "",
        rarity: row.rarity,
        monsterType: row.monster_type,
        family: family.family,
        color: family.color,
        bonuses: parseBonus(row.stat_bonuses),
        affixes: parseRolls(row.stat_bonuses),
        effects: stored.effects,
        cut: stored.cut,
        equipped: row.equipped,
        equipSlot: row.equip_slot,
      },
    ];
  });
}

async function readRecord(userId: string): Promise<ListenerRecord> {
  const supabase = getSupabase();
  const [listens, echo, faded, artists, albums, finished] = await Promise.all([
    supabase.from("listening_events").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("encounters")
      .select("echo_depth")
      .eq("user_id", userId)
      .eq("outcome", "victory")
      .order("echo_depth", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("encounters").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("outcome", "faded"),
    supabase.from("codex_artists").select("artist_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("codex_albums").select("album_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("codex_albums").select("album_id", { count: "exact", head: true }).eq("user_id", userId).not("completed_at", "is", null),
  ]);
  for (const result of [listens, echo, faded, artists, albums, finished]) {
    if (result.error) throw new Error(result.error.message);
  }
  return {
    listens: (await scrobbleTotal(userId)) ?? listens.count ?? 0,
    highestEcho: echo.data?.echo_depth ?? 0,
    faded: faded.count ?? 0,
    artists: artists.count ?? 0,
    albums: albums.count ?? 0,
    albumsFinished: finished.count ?? 0,
    relics: 0,
  };
}

async function scrobbleTotal(userId: string): Promise<number | null> {
  const cached = scrobbles.get(userId);
  if (cached && Date.now() - cached.at < SCROBBLE_TTL_MS) return cached.count;
  try {
    const count = await fetchPlaycount(userId);
    if (count == null) return cached?.count ?? null;
    scrobbles.set(userId, { count, at: Date.now() });
    return count;
  } catch {
    return cached?.count ?? null;
  }
}

async function countOutcomes(userId: string, outcome: "victory" | "escaped"): Promise<number> {
  const { count, error } = await getSupabase()
    .from("encounters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("outcome", outcome);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function parseBonus(value: unknown): Stats {
  if (!isRecord(value)) return { str: 0, agi: 0, int: 0, wis: 0, cha: 0 };
  return {
    str: numberOf(value.str),
    agi: numberOf(value.agi),
    int: numberOf(value.int),
    wis: numberOf(value.wis),
    cha: numberOf(value.cha),
  };
}

function numberOf(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseAlbums(value: unknown): AlbumCover[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string") return [];
    return [
      {
        id: item.id,
        name: item.name,
        artistName: typeof item.artistName === "string" ? item.artistName : "",
        imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
      },
    ];
  });
}
