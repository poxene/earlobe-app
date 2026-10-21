import { randomUUID } from "node:crypto";
import { monsterForFamily } from "../../src/lib/game/bestiary";
import { classForFamily } from "../../src/lib/game/classes";
import {
  monsterHp,
  trackTier,
  ledgerOutcome,
  liveFightOutcome,
  progressOnClock,
  type FightResult,
  type Grade,
} from "../../src/lib/game/combat";
import { dropLuck, echoPayout, openingDamage, settleGrade } from "../../src/lib/game/effects";
import { parseCooldowns } from "../../src/lib/game/skills";
import { treeEffects } from "../../src/lib/game/trees";
import { echoReward, RARITY_RANK, rollRelic, statBonusPayload, type RelicDraft } from "../../src/lib/game/loot";
import { rollMaterialDrops } from "../../src/lib/game/materials";
import type { HistoryPlay } from "../../src/lib/music/mapHistory";
import type { NowPlaying } from "../../src/lib/music/provider";
import {
  ESCAPE_CONSOLATION_XP,
  NEW_ARTIST_XP,
  ALBUM_COMPLETION_XP,
  qualifies,
  repeatListenXp,
} from "../../src/lib/game/xp";
import type { ActiveFight, AwaySummary, BattleRow, GameSnapshot } from "../../src/lib/game/snapshot";
import { ReconnectRequired } from "../errors";
import { getSupabase } from "../supabase";
import { familiesForArtists, loadArtists } from "./catalog";
import { presentCharacter, loadCharacterSheet } from "./characterSheet";
import { grantMaterials } from "./materials";
import { awardXp, heroDps, heroStats, loadHero, saveHero, type Credit, type Hero } from "./hero";
import { albumTrackIds, listenerActivity } from "./listening";
import { loadBattleAllies, postFeed } from "./party";
import { ensureQuests, evaluateQuests } from "./questBoard";
import { listSessionUserIds } from "./lastfmSession";
import { ritualComplete, type ListenFact } from "../../src/lib/game/quests";

const DAY_MS = 86_400_000;
const AWAY_MS = 15 * 60 * 1000;
const UNLOCK_HOURS = 5;

type Heard = {
  trackId: string;
  albumId: string;
  artistIds: string[];
  playedAt: string;
  msPlayed: number;
  durationMs: number;
  families: string[];
  xpAwarded: number;
  legacy: boolean;
};

type OpenFight = {
  id: string;
  trackId: string;
  trackName: string;
  image: string | null;
  monster: string;
  family: string;
  hpMax: number;
  dps: number;
  echoDepth: number;
  durationMs: number;
  progressMs: number;
  anchorMs: number;
  startedAt: string;
  sourceKey: string;
  bonusDamage: number;
  skillId: string | null;
  echoBonus: number;
  gradeBump: number;
  dropAdvantage: boolean;
  xpBonus: number;
  skillCooldowns: Record<string, number>;
};

export async function syncListener(userId: string): Promise<GameSnapshot> {
  await loadCharacterSheet(userId);
  const hero = await loadHero(userId);
  const credit: Credit = { toasts: [], levelUp: null };
  const unlocks: GameSnapshot["unlocks"] = [];
  const activity = await readActivity(userId);
  const playing = activity.nowPlaying;
  const history = activity.history;
  const heard = await loadHeard(userId);
  const knownArtists = new Set(await knownArtistIds(userId));

  await tickLive(hero, playing, heard, knownArtists, credit);
  for (const play of [...history].reverse()) {
    await ingestHistory(hero, play, heard, knownArtists, credit);
  }
  await refreshHours(hero, heard, credit, unlocks);
  await ensureQuests(hero);
  const questCompletions = await evaluateQuests(hero, credit);

  const away = await awaySummary(hero);
  hero.lastSeen = new Date().toISOString();
  await saveHero(hero);
  await writePresence(userId, playing);

  return {
    nowPlaying: playing,
    fight: await activeFight(userId, playing),
    battles: await recentBattles(userId),
    toasts: credit.toasts,
    levelUp: credit.levelUp,
    unlocks,
    questCompletions,
    away,
    sheet: await presentCharacter(userId),
    allies: await loadBattleAllies(userId),
  };
}

export async function syncAllListeners(): Promise<number> {
  const userIds = await listSessionUserIds();
  let count = 0;
  for (const userId of userIds) {
    try {
      await syncListener(userId);
      count += 1;
    } catch (syncError) {
      console.error("[earlobe] sync skipped", syncError instanceof Error ? syncError.message : "unknown");
    }
  }
  return count;
}

async function ingestHistory(
  hero: Hero,
  play: HistoryPlay,
  heard: Heard[],
  knownArtists: Set<string>,
  credit: Credit,
): Promise<void> {
  if (play.durationMs <= 0 || alreadyHeard(heard, play.trackId, play.playedAt, play.durationMs)) return;
  const families = await familiesForArtists(play.artistIds);
  const source = `history:${play.playedAt}:${play.trackId}`;
  //— recently-played has no progress. a play from before the account is history. a play after it still pays.
  await recordListen(hero, {
    trackId: play.trackId,
    trackName: play.trackName,
    artistIds: play.artistIds,
    artistNames: play.artistNames,
    albumId: play.albumId,
    albumName: play.albumName,
    albumImageUrl: play.albumImageUrl,
    playedAt: play.playedAt,
    msPlayed: play.durationMs,
    durationMs: play.durationMs,
    families,
    tracksTotal: play.tracksTotal,
    source,
    legacy: new Date(play.playedAt).getTime() < new Date(hero.joinedAt).getTime(),
  }, heard, knownArtists, credit);
}

async function tickLive(
  hero: Hero,
  playing: NowPlaying | null,
  heard: Heard[],
  knownArtists: Set<string>,
  credit: Credit,
): Promise<void> {
  const open = await loadOpen(hero.userId);
  if (open && (!playing || playing.trackId !== open.trackId)) {
    const progressMs = clockProgress(open);
    const killMs = timeToKill(open);
    if (liveFightOutcome({ progressMs, anchorMs: open.anchorMs, killMs, durationMs: open.durationMs, echoDepth: open.echoDepth }) === "victory") {
      const remaining = 1 - (open.anchorMs + killMs) / Math.max(open.durationMs, 1);
      await closeFight(hero, { ...open, progressMs }, {
        echoDepth: open.echoDepth,
        hpMax: open.hpMax,
        outcome: "victory",
        grade: graded(open, remaining),
        killMs,
        remainingFraction: remaining,
      }, credit);
    } else {
      const faded = ledgerOutcome(open.echoDepth, "escaped") === "faded";
      await closeFight(hero, { ...open, progressMs }, {
        echoDepth: open.echoDepth,
        hpMax: open.hpMax,
        outcome: "escaped",
        grade: null,
        killMs: null,
        remainingFraction: null,
      }, credit);
      if (!faded) awardXp(hero, ESCAPE_CONSOLATION_XP, "listening", credit, null);
    }
  } else if (open && playing) {
    await pressFight(hero, open, playing, credit);
  }

  const still = await loadOpen(hero.userId);
  const sameTrack = Boolean(open && playing && open.trackId === playing.trackId);
  if (playing && !still && !sameTrack && !(await wonThisTrack(hero.userId, playing.trackId))) {
    await spawnFight(hero, playing, 0, playing.progressMs, sessionKey(playing));
  }
  if (playing && qualifies(playing.progressMs, playing.durationMs) && !alreadyHeard(heard, playing.trackId, playedAtFrom(playing), playing.durationMs)) {
    const families = await familiesForArtists(playing.artistIds);
    await recordListen(hero, {
      trackId: playing.trackId,
      trackName: playing.trackName,
      artistIds: playing.artistIds,
      artistNames: playing.artistNames,
      albumId: playing.albumId,
      albumName: playing.albumName,
      albumImageUrl: playing.albumImageUrl,
      playedAt: playedAtFrom(playing),
      msPlayed: playing.progressMs,
      durationMs: playing.durationMs,
      families,
    tracksTotal: 0,
    source: `live:${sessionKey(playing)}`,
    legacy: false,
  }, heard, knownArtists, credit);
  }
}

async function pressFight(hero: Hero, open: OpenFight, playing: NowPlaying, credit: Credit): Promise<void> {
  const progressMs = clockProgress(open, playing.progressMs);
  const killMs = timeToKill(open);
  if (liveFightOutcome({ progressMs, anchorMs: open.anchorMs, killMs, durationMs: open.durationMs, echoDepth: open.echoDepth }) !== "victory") {
    const saved = await getSupabase()
      .from("encounters")
      .update({ progress_ms: progressMs })
      .eq("id", open.id);
    if (saved.error) throw new Error(saved.error.message);
    return;
  }
  const killAt = open.anchorMs + killMs;
  const remaining = 1 - killAt / Math.max(open.durationMs, 1);
  await closeFight(hero, { ...open, progressMs }, {
    echoDepth: open.echoDepth,
    hpMax: open.hpMax,
    outcome: "victory",
    grade: graded(open, remaining),
    killMs,
    remainingFraction: remaining,
  }, credit);
  if (remaining > 0.1 && playing.isPlaying) {
    await spawnFight(hero, playing, open.echoDepth + 1, progressMs, open.sourceKey, open.skillCooldowns);
  }
}

async function spawnFight(
  hero: Hero,
  playing: NowPlaying,
  echoDepth: number,
  anchorMs: number,
  sourceKey: string,
  skillCooldowns: Record<string, number> = {},
): Promise<void> {
  const families = await familiesForArtists(playing.artistIds);
  const family = families[0] ?? "Unmapped";
  const monster = monsterForFamily(family);
  const hpMax = monsterHp(playing.durationMs, echoDepth);
  const stats = heroStats(hero);
  const inserted = await getSupabase().from("encounters").insert({
    id: randomUUID(),
    user_id: hero.userId,
    track_id: playing.trackId,
    track_name: playing.trackName,
    album_image_url: playing.albumImageUrl,
    monster_type: monster.monster,
    genre_family: family,
    hp_max: hpMax,
    dps_at_fight: heroDps(hero, echoDepth),
    bonus_damage: openingDamage(hpMax, stats, hero.effects),
    echo_depth: echoDepth,
    duration_ms: playing.durationMs,
    progress_ms: playing.progressMs,
    anchor_ms: anchorMs,
    source_key: sourceKey,
    skill_cooldowns: skillCooldowns,
  });
  if (inserted.error && inserted.error.code !== "23505") throw new Error(inserted.error.message);
}

async function closeFight(hero: Hero, open: OpenFight, fight: FightResult, credit: Credit): Promise<void> {
  const draft = await lootFor(hero, fight, open.durationMs, open.family, open.trackId, {
    echoes: open.echoBonus,
    advantage: open.dropAdvantage,
  });
  if (fight.outcome === "victory" && open.xpBonus > 0) {
    awardXp(hero, open.xpBonus, "listening", credit, null);
  }
  const saved = await getSupabase()
    .from("encounters")
    .update({
      outcome: ledgerOutcome(fight.echoDepth, fight.outcome),
      grade: fight.grade,
      loot_echoes: draft.echoes,
      relic_id: draft.relicId,
      resolved_at: new Date().toISOString(),
      progress_ms: open.progressMs,
    })
    .eq("id", open.id);
  if (saved.error) throw new Error(saved.error.message);
  hero.echoes += draft.echoes;
  await bumpBestiary(hero.userId, open.monster, fight);
  if (fight.outcome === "victory" && fight.grade) {
    await postFeed(hero.userId, "battle", { monster: open.monster, grade: fight.grade });
    if (draft.relicName) {
      credit.toasts.push({ id: randomUUID(), message: `${draft.relicName} dropped.` });
    }
    const drops = rollMaterialDrops({
      monster: monsterForFamily(open.family).monster,
      tier: trackTier(open.durationMs).name,
      grade: fight.grade,
      salt: open.id,
    });
    if (drops.length > 0) {
      await grantMaterials(hero.userId, drops);
      const line = drops.map((drop) => `${drop.name} ×${drop.quantity}`).join(", ");
      credit.toasts.push({ id: randomUUID(), message: `${line} dropped.` });
    }
  }
}

async function lootFor(
  hero: Hero,
  fight: FightResult,
  durationMs: number,
  family: string,
  trackId: string,
  riders: { echoes: number; advantage: boolean } = { echoes: 0, advantage: false },
): Promise<{ echoes: number; relicId: string | null; relicName: string | null }> {
  if (fight.outcome !== "victory" || !fight.grade) return { echoes: 0, relicId: null, relicName: null };
  const tier = trackTier(durationMs).name;
  const stats = heroStats(hero);
  const echoes = echoPayout(echoReward(fight.grade, tier, fight.echoDepth), stats, hero.effects, riders.echoes) + treeEffects(hero.activeClass, hero.treeNodes).echoes;
  const relic = chooseRelic(hero, fight, durationMs, family, trackId, riders.advantage);
  if (!relic) return { echoes, relicId: null, relicName: null };
  const id = randomUUID();
  const inserted = await getSupabase().from("relics").insert({
    id,
    user_id: hero.userId,
    name: relic.name,
    gear_slug: relic.gearSlug,
    monster_type: relic.monsterType,
    genre_family: relic.genreFamily,
    rarity: relic.rarity,
    stat_bonuses: statBonusPayload(relic),
    effects: { cut: relic.cut, list: relic.effects },
  });
  if (inserted.error) throw new Error(inserted.error.message);
  return { echoes, relicId: id, relicName: relic.name };
}

function chooseRelic(
  hero: Hero,
  fight: FightResult,
  durationMs: number,
  family: string,
  trackId: string,
  advantage: boolean,
): RelicDraft | null {
  const draw = (mark: string) =>
    rollRelic({
      genreFamily: family,
      tier: trackTier(durationMs).name,
      grade: fight.grade ?? "CLEAN",
      echoDepth: fight.echoDepth,
      flawlessLoot: (fight.remainingFraction ?? 1) <= 0.1,
      roll: Math.random(),
      salt: `${trackId}:${fight.echoDepth}:${mark}:${Math.random().toFixed(6)}`,
      luck: dropLuck(heroStats(hero), hero.effects),
    });
  const first = draw("a");
  if (!advantage) return first;
  const second = draw("b");
  if (!first) return second;
  if (!second) return first;
  return RARITY_RANK[second.rarity] > RARITY_RANK[first.rarity] ? second : first;
}

function clockProgress(open: OpenFight, reportedMs = open.progressMs): number {
  return progressOnClock({
    startedAtMs: new Date(open.startedAt).getTime(),
    anchorMs: open.anchorMs,
    durationMs: open.durationMs,
    storedProgressMs: Math.max(open.progressMs, reportedMs),
    nowMs: Date.now(),
  });
}

function timeToKill(open: OpenFight): number {
  const hp = Math.max(1, open.hpMax - open.bonusDamage);
  return open.dps > 0 ? (hp / open.dps) * 1000 : Number.POSITIVE_INFINITY;
}

function graded(open: OpenFight, remaining: number): Grade {
  return settleGrade(remaining, open.gradeBump);
}

async function recordListen(
  hero: Hero,
  play: {
    trackId: string;
    trackName: string;
    artistIds: string[];
    artistNames: string[];
    albumId: string;
    albumName: string;
    albumImageUrl: string | null;
    playedAt: string;
    msPlayed: number;
    durationMs: number;
    families: string[];
    tracksTotal: number;
    source: string;
    legacy: boolean;
  },
  heard: Heard[],
  knownArtists: Set<string>,
  credit: Credit,
): Promise<void> {
  const prior = heard.filter(
    (row) => row.trackId === play.trackId && !row.legacy && row.playedAt.slice(0, 10) === play.playedAt.slice(0, 10),
  ).length;
  const inserted = await getSupabase().from("listening_events").insert({
    id: randomUUID(),
    user_id: hero.userId,
    track_id: play.trackId,
    track_name: play.trackName,
    artist_ids: play.artistIds,
    artist_names: play.artistNames,
    album_id: play.albumId,
    album_name: play.albumName,
    album_image_url: play.albumImageUrl,
    played_at: play.playedAt,
    ms_played: play.msPlayed,
    duration_ms: play.durationMs,
    genre_families: play.families,
    xp_awarded: 0,
    source_key: play.source,
    legacy: play.legacy,
  });
  if (inserted.error) {
    if (inserted.error.code === "23505") return;
    throw new Error(inserted.error.message);
  }
  heard.push({
    trackId: play.trackId,
    albumId: play.albumId,
    artistIds: play.artistIds,
    playedAt: play.playedAt,
    msPlayed: play.msPlayed,
    durationMs: play.durationMs,
    families: play.families,
    xpAwarded: 0,
    legacy: play.legacy,
  });
  if (play.legacy) return;
  const granted = awardXp(hero, repeatListenXp(prior), "listening", credit, null);
  const marked = await getSupabase()
    .from("listening_events")
    .update({ xp_awarded: granted })
    .eq("user_id", hero.userId)
    .eq("source_key", play.source);
  if (marked.error) throw new Error(marked.error.message);
  const row = heard.find((item) => item.trackId === play.trackId && item.playedAt === play.playedAt);
  if (row) row.xpAwarded = granted;
  await noteArtists(hero, play, knownArtists, credit);
  if (play.albumId) await noteAlbum(hero, play, heard, credit);
}

async function noteArtists(
  hero: Hero,
  play: { artistIds: string[]; artistNames: string[] },
  knownArtists: Set<string>,
  credit: Credit,
): Promise<void> {
  const cache = await loadArtists(play.artistIds);
  for (const [index, artistId] of play.artistIds.entries()) {
    const cached = cache.get(artistId);
    const name = cached?.name ?? play.artistNames[index] ?? "Unknown artist";
    if (!knownArtists.has(artistId)) {
      const created = await getSupabase().from("codex_artists").insert({
        user_id: hero.userId,
        artist_id: artistId,
        name,
        image_url: cached?.imageUrl ?? null,
        genres: cached?.genres ?? [],
      });
      if (created.error && created.error.code !== "23505") throw new Error(created.error.message);
      if (!created.error) {
        knownArtists.add(artistId);
        awardXp(hero, NEW_ARTIST_XP, "listening", credit, `New artist discovered: ${name} +${NEW_ARTIST_XP} XP`);
        await postFeed(hero.userId, "artist", { artist: name });
      }
    } else {
      const current = await getSupabase()
        .from("codex_artists")
        .select("listen_count")
        .eq("user_id", hero.userId)
        .eq("artist_id", artistId)
        .maybeSingle();
      if (current.error) throw new Error(current.error.message);
      const updated = await getSupabase()
        .from("codex_artists")
        .update({ listen_count: (current.data?.listen_count ?? 1) + 1 })
        .eq("user_id", hero.userId)
        .eq("artist_id", artistId);
      if (updated.error) throw new Error(updated.error.message);
    }
  }
}

async function noteAlbum(
  hero: Hero,
  play: {
    albumId: string;
    albumName: string;
    artistNames: string[];
    albumImageUrl: string | null;
    families: string[];
    tracksTotal: number;
    trackId: string;
  },
  heard: Heard[],
  credit: Credit,
): Promise<void> {
  const tracks = new Set(heard.filter((row) => row.albumId === play.albumId).map((row) => row.trackId));
  const existing = await getSupabase()
    .from("codex_albums")
    .select("tracks_total, tracks_played, xp_awarded, completed_at")
    .eq("user_id", hero.userId)
    .eq("album_id", play.albumId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  const total = Math.max(play.tracksTotal, existing.data?.tracks_total ?? 0);
  const row = {
    user_id: hero.userId,
    album_id: play.albumId,
    name: play.albumName || "Untitled",
    artist_name: play.artistNames[0] ?? "",
    image_url: play.albumImageUrl,
    genre_family: play.families[0] ?? "Unmapped",
    tracks_total: total,
    tracks_played: tracks.size,
    completed_at: total > 0 && tracks.size >= total ? (existing.data?.completed_at ?? new Date().toISOString()) : null,
    xp_awarded: existing.data?.xp_awarded ?? false,
  };
  const saved = await getSupabase().from("codex_albums").upsert(row);
  if (saved.error) throw new Error(saved.error.message);
  if (!row.xp_awarded && total > 0 && tracks.size >= total) {
    const ordered = await albumTrackIds(play.albumId);
    const listens: ListenFact[] = heard
      .filter((item) => item.albumId === play.albumId)
      .map((item) => ({ trackId: item.trackId, albumId: item.albumId, artistIds: item.artistIds, playedAt: item.playedAt }));
    if (ordered.length > 0 && ritualComplete(ordered, listens)) {
      awardXp(hero, ALBUM_COMPLETION_XP, "listening", credit, `${play.albumName} finished. +${ALBUM_COMPLETION_XP} XP`);
      const marked = await getSupabase()
        .from("codex_albums")
        .update({ xp_awarded: true })
        .eq("user_id", hero.userId)
        .eq("album_id", play.albumId);
      if (marked.error) throw new Error(marked.error.message);
    }
  }
}

async function refreshHours(
  hero: Hero,
  heard: Heard[],
  credit: Credit,
  unlocks: GameSnapshot["unlocks"],
): Promise<void> {
  const since = Date.now() - 30 * DAY_MS;
  const totals = new Map<string, number>();
  for (const row of heard) {
    if (new Date(row.playedAt).getTime() < since || !qualifies(row.msPlayed, row.durationMs)) continue;
    const families = row.families.length > 0 ? row.families : ["Unmapped"];
    const slice = row.msPlayed / families.length;
    for (const family of families) totals.set(family, (totals.get(family) ?? 0) + slice);
  }
  const existing = await getSupabase().from("genre_weights").select("genre_family, hours_30d, share").eq("user_id", hero.userId);
  if (existing.error) throw new Error(existing.error.message);
  const previous = new Map((existing.data ?? []).map((row) => [row.genre_family, Number(row.hours_30d)]));
  const families = new Set<string>([...totals.keys(), ...(existing.data ?? []).map((row) => row.genre_family)]);
  const now = new Date().toISOString();
  for (const family of families) {
    const hours = (totals.get(family) ?? 0) / 3_600_000;
    const share = Number((existing.data ?? []).find((row) => row.genre_family === family)?.share ?? 0);
    const saved = await getSupabase().from("genre_weights").upsert({
      user_id: hero.userId,
      genre_family: family,
      hours_30d: hours,
      share,
      updated_at: now,
    });
    if (saved.error) throw new Error(saved.error.message);
    const entry = classForFamily(family);
    const prior = previous.get(family) ?? 0;
    if (prior < UNLOCK_HOURS && hours >= UNLOCK_HOURS && !hero.unlocked.includes(entry.id)) {
      hero.unlocked = [...hero.unlocked, entry.id];
      credit.toasts.push({ id: randomUUID(), message: `${entry.id} unlocked.` });
      unlocks.push({ classId: entry.id, color: entry.color });
      await postFeed(hero.userId, "unlock", { className: entry.id });
    }
  }
}

async function awaySummary(hero: Hero): Promise<AwaySummary | null> {
  if (!hero.lastSeen) return null;
  const gap = Date.now() - new Date(hero.lastSeen).getTime();
  if (gap < AWAY_MS) return null;
  const supabase = getSupabase();
  const fights = await supabase
    .from("encounters")
    .select("outcome, loot_echoes, relic_id, echo_depth")
    .eq("user_id", hero.userId)
    .gte("resolved_at", hero.lastSeen);
  if (fights.error) throw new Error(fights.error.message);
  const rows = fights.data ?? [];
  const xpRows = await supabase
    .from("listening_events")
    .select("xp_awarded")
    .eq("user_id", hero.userId)
    .gte("played_at", hero.lastSeen);
  if (xpRows.error) throw new Error(xpRows.error.message);
  const xp = (xpRows.data ?? []).reduce((sum, row) => sum + row.xp_awarded, 0);
  if (rows.length === 0 && xp === 0) return null;
  const relicId = rows.find((row) => row.relic_id)?.relic_id;
  let relicName: string | null = null;
  if (relicId) {
    const relic = await supabase.from("relics").select("name").eq("id", relicId).maybeSingle();
    relicName = relic.data?.name ?? null;
  }
  return {
    battles: rows.filter((row) => row.echo_depth === 0).length,
    victories: rows.filter((row) => row.outcome === "victory").length,
    escapes: rows.filter((row) => row.outcome === "escaped").length,
    xp,
    echoes: rows.reduce((sum, row) => sum + row.loot_echoes, 0),
    relicName,
  };
}

async function activeFight(userId: string, playing: NowPlaying | null): Promise<ActiveFight | null> {
  const open = await loadOpen(userId);
  if (!open || !playing || playing.trackId !== open.trackId) return null;
  const monster = monsterForFamily(open.family);
  const fought = Math.max(0, playing.progressMs - open.anchorMs);
  const hpLeft = Math.max(0, open.hpMax - open.bonusDamage - open.dps * (fought / 1000));
  return {
    monster: open.monster,
    motif: monster.motif,
    family: open.family,
    color: classForFamily(open.family).color,
    hpMax: open.hpMax,
    hpLeft,
    dps: open.dps,
    durationMs: open.durationMs,
    progressMs: playing.progressMs,
    echoDepth: open.echoDepth,
    trackName: open.trackName,
    artistName: playing.artistNames.filter(Boolean).join(", "),
    albumName: playing.albumName,
    trackId: open.trackId,
    albumImageUrl: open.image,
    observedAt: Date.now(),
    isPlaying: playing.isPlaying,
    bonusDamage: open.bonusDamage,
    skillId: open.skillId,
    skillCooldowns: open.skillCooldowns,
  };
}

async function recentBattles(userId: string): Promise<BattleRow[]> {
  const { data, error } = await getSupabase()
    .from("encounters")
    .select("id, track_id, monster_type, genre_family, outcome, grade, loot_echoes, relic_id, resolved_at")
    .eq("user_id", userId)
    .not("resolved_at", "is", null)
    .order("resolved_at", { ascending: false })
    .limit(8);
  if (error) throw new Error(error.message);
  const relicIds = (data ?? []).flatMap((row) => (row.relic_id ? [row.relic_id] : []));
  const relics = relicIds.length
    ? await getSupabase().from("relics").select("id, name").in("id", relicIds)
    : { data: [], error: null };
  if (relics.error) throw new Error(relics.error.message);
  return (data ?? []).map((row) => {
    const monster = monsterForFamily(row.genre_family);
    return {
      id: row.id,
      monster: row.monster_type,
      trackId: row.track_id,
      motif: monster.motif,
      color: classForFamily(row.genre_family).color,
      family: row.genre_family,
      outcome: row.outcome ?? "escaped",
      grade: row.grade,
      echoes: row.loot_echoes,
      relicName: relics.data?.find((relic) => relic.id === row.relic_id)?.name ?? null,
      at: row.resolved_at ?? new Date().toISOString(),
    };
  });
}

async function loadOpen(userId: string): Promise<OpenFight | null> {
  const { data, error } = await getSupabase()
    .from("encounters")
    .select(
      "id, track_id, track_name, album_image_url, monster_type, genre_family, hp_max, dps_at_fight, echo_depth, duration_ms, progress_ms, anchor_ms, started_at, source_key, bonus_damage, skill_id, echo_bonus, grade_bump, drop_advantage, xp_bonus, skill_cooldowns",
    )
    .eq("user_id", userId)
    .is("resolved_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    trackId: data.track_id,
    trackName: data.track_name,
    image: data.album_image_url,
    monster: data.monster_type,
    family: data.genre_family,
    hpMax: data.hp_max,
    dps: Number(data.dps_at_fight),
    echoDepth: data.echo_depth,
    durationMs: data.duration_ms,
    progressMs: data.progress_ms,
    anchorMs: data.anchor_ms,
    startedAt: data.started_at,
    sourceKey: data.source_key,
    bonusDamage: data.bonus_damage,
    skillId: data.skill_id,
    echoBonus: data.echo_bonus,
    gradeBump: data.grade_bump,
    dropAdvantage: data.drop_advantage,
    xpBonus: data.xp_bonus,
    skillCooldowns: parseCooldowns(data.skill_cooldowns),
  };
}

async function loadHeard(userId: string): Promise<Heard[]> {
  const since = new Date(Date.now() - 40 * DAY_MS).toISOString();
  const { data, error } = await getSupabase()
    .from("listening_events")
    .select("track_id, album_id, artist_ids, played_at, ms_played, duration_ms, genre_families, xp_awarded, legacy")
    .eq("user_id", userId)
    .gte("played_at", since);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    trackId: row.track_id,
    albumId: row.album_id,
    artistIds: row.artist_ids,
    playedAt: row.played_at,
    msPlayed: row.ms_played,
    durationMs: row.duration_ms,
    families: row.genre_families,
    xpAwarded: row.xp_awarded,
    legacy: row.legacy,
  }));
}

async function knownArtistIds(userId: string): Promise<string[]> {
  const { data, error } = await getSupabase().from("codex_artists").select("artist_id").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.artist_id);
}

function alreadyHeard(heard: Heard[], trackId: string, playedAt: string, durationMs: number): boolean {
  const at = new Date(playedAt).getTime();
  //— a scrobble lands at the end of the track, after the live row was stamped at the start.
  const windowMs = Math.max(3 * 60 * 1000, durationMs + 2 * 60 * 1000);
  return heard.some((row) => row.trackId === trackId && Math.abs(new Date(row.playedAt).getTime() - at) < windowMs);
}

async function readActivity(userId: string): Promise<{ nowPlaying: NowPlaying | null; history: HistoryPlay[] }> {
  try {
    return await listenerActivity(userId);
  } catch (error) {
    if (error instanceof ReconnectRequired) throw error;
    return { nowPlaying: null, history: [] };
  }
}

async function writePresence(userId: string, playing: NowPlaying | null): Promise<void> {
  const saved = await getSupabase().from("presence").upsert({
    user_id: userId,
    track_name: playing?.isPlaying ? playing.trackName : null,
    artist_name: playing?.isPlaying ? playing.artistNames.join(", ") : null,
    image_url: playing?.albumImageUrl ?? null,
    updated_at: new Date().toISOString(),
  });
  if (saved.error) throw new Error(saved.error.message);
}

async function bumpBestiary(userId: string, monster: string, fight: FightResult): Promise<void> {
  const supabase = getSupabase();
  const current = await supabase
    .from("bestiary")
    .select("encountered, defeated, escaped, best_grade, fastest_kill_sec")
    .eq("user_id", userId)
    .eq("monster_type", monster)
    .maybeSingle();
  if (current.error) throw new Error(current.error.message);
  const row = current.data;
  const killSec = fight.killMs === null ? null : Math.round(fight.killMs / 1000);
  const saved = await supabase.from("bestiary").upsert({
    user_id: userId,
    monster_type: monster,
    encountered: (row?.encountered ?? 0) + 1,
    defeated: (row?.defeated ?? 0) + (fight.outcome === "victory" ? 1 : 0),
    escaped: (row?.escaped ?? 0) + (fight.outcome === "escaped" && fight.echoDepth === 0 ? 1 : 0),
    best_grade: betterGrade(row?.best_grade ?? null, fight.grade),
    fastest_kill_sec: fastest(row?.fastest_kill_sec ?? null, fight.outcome === "victory" ? killSec : null),
  });
  if (saved.error) throw new Error(saved.error.message);
}

function betterGrade(current: string | null, next: Grade | null): string | null {
  const rank: Record<string, number> = { "DOWN TO THE WIRE": 1, CLEAN: 2, FLAWLESS: 3 };
  if (!next) return current;
  if (!current || (rank[next] ?? 0) > (rank[current] ?? 0)) return next;
  return current;
}

function fastest(current: number | null, next: number | null): number | null {
  if (next === null) return current;
  if (current === null) return next;
  return Math.min(current, next);
}

async function wonThisTrack(userId: string, trackId: string): Promise<boolean> {
  const since = new Date(Date.now() - 90_000).toISOString();
  const { data, error } = await getSupabase()
    .from("encounters")
    .select("id")
    .eq("user_id", userId)
    .eq("track_id", trackId)
    .eq("echo_depth", 0)
    .eq("outcome", "victory")
    .gte("resolved_at", since)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

function sessionKey(playing: NowPlaying): string {
  const start = Date.now() - playing.progressMs;
  return `live:${playing.trackId}:${Math.floor(start / 60_000)}`;
}

function playedAtFrom(playing: NowPlaying): string {
  return new Date(Date.now() - playing.progressMs).toISOString();
}
