import { randomUUID } from "node:crypto";
import { GENRE_FAMILIES } from "../../src/lib/music/normalize";
import { isRecord } from "../../src/lib/isRecord";
import { lastfmSearch, lastfmUrl } from "../../src/lib/music/lastfmIds";
import {
  MIN_ALBUM_TRACKS,
  parseObjective,
  questProgress,
  type AlbumFact,
  type ListenFact,
  type QuestObjective,
} from "../../src/lib/game/quests";
import { GameError } from "../errors";
import { getSupabase } from "../supabase";
import { albumForFamily, albumTrackIds, lesserKnownArtist } from "./listening";
import { awardXp, loadHero, saveHero, type Credit, type Hero } from "./hero";
import { partyIdFor, postFeed } from "./party";

type QuestRow = {
  id: string;
  type: string;
  title: string;
  description: string;
  objective: QuestObjective;
  xpReward: number;
  expiresAt: string;
  current: number;
  target: number;
  completedAt: string | null;
};

export async function listQuests(userId: string): Promise<QuestRow[]> {
  return loadQuestRows(userId);
}

export async function ensureQuests(hero: Hero): Promise<void> {
  const rows = await loadQuestRows(hero.userId);
  const active = rows.filter((row) => !row.completedAt && new Date(row.expiresAt).getTime() > Date.now());
  const expires = nextMonday();
  if (!active.some((row) => row.type === "discovery")) {
    await createDiscovery(hero.userId, expires);
  }
  const rotating = active.filter((row) => row.type === "deep_cut" || row.type === "ritual");
  if (rotating.length === 0) {
    const made = weekEven() ? await createDeepCut(hero.userId, expires) : await createRitual(hero.userId, expires);
    if (!made) await createRitual(hero.userId, expires);
  }
  const after = (await loadQuestRows(hero.userId)).filter(
    (row) => !row.completedAt && new Date(row.expiresAt).getTime() > Date.now(),
  );
  if (after.length >= 3) return;
  const party = await partyIdFor(hero.userId);
  if (party && !after.some((row) => row.type === "social")) {
    const social = await createSocial(hero.userId, expires);
    if (social) return;
  }
  if (after.some((row) => row.type === "deep_cut")) await createRitual(hero.userId, expires);
  else await createDeepCut(hero.userId, expires);
}

export async function evaluateQuests(hero: Hero, credit: Credit): Promise<{ title: string; xp: number }[]> {
  const rows = await loadQuestRows(hero.userId);
  const listens = await loadListens(hero.userId);
  const albums = await loadAlbums(hero.userId);
  const done: { title: string; xp: number }[] = [];
  for (const row of rows) {
    if (row.completedAt || new Date(row.expiresAt).getTime() <= Date.now()) continue;
    const progress = questProgress(row.objective, listens, albums);
    const saved = await getSupabase()
      .from("quest_progress")
      .upsert({
        user_id: hero.userId,
        quest_id: row.id,
        progress: { current: progress.current, target: progress.target },
        ...(progress.completed ? { completed_at: new Date().toISOString() } : {}),
      });
    if (saved.error) throw new Error(saved.error.message);
    if (!progress.completed) continue;
    const granted = awardXp(hero, row.xpReward, "quest", credit, `${row.title} — +${row.xpReward} XP`);
    if (row.objective.type === "deep_cut" && !hero.badges.includes("Deep Delver")) {
      hero.badges = [...hero.badges, "Deep Delver"];
    }
    if (row.objective.type === "social" && row.objective.friendId) {
      await grantOther(row.objective.friendId, row.xpReward);
    }
    await postFeed(hero.userId, "quest", { title: row.title });
    done.push({ title: row.title, xp: granted });
  }
  return done;
}

export async function rerollQuest(userId: string, questId: string): Promise<void> {
  const hero = await loadHero(userId);
  if (hero.echoes < 100) throw new GameError(409, "not_enough_echoes");
  const week = weekStart();
  const prior = await getSupabase().from("rerolls").select("week_start").eq("user_id", userId).maybeSingle();
  if (prior.error) throw new Error(prior.error.message);
  if (prior.data?.week_start === week) throw new GameError(409, "reroll_spent");
  const quest = await getSupabase().from("quests").select("id, type").eq("id", questId).eq("user_id", userId).maybeSingle();
  if (quest.error) throw new Error(quest.error.message);
  if (!quest.data || quest.data.type === "discovery") throw new GameError(404, "quest_not_found");
  const removed = await getSupabase().from("quests").delete().eq("id", questId);
  if (removed.error) throw new Error(removed.error.message);
  hero.echoes -= 100;
  const marked = await getSupabase().from("rerolls").upsert({ user_id: userId, week_start: week });
  if (marked.error) throw new Error(marked.error.message);
  await saveHero(hero);
  await ensureQuests(hero);
}

export async function beginTarget(userId: string, questId: string): Promise<{ url: string }> {
  const quest = await getSupabase()
    .from("quests")
    .select("objective")
    .eq("id", questId)
    .eq("user_id", userId)
    .maybeSingle();
  if (quest.error) throw new Error(quest.error.message);
  const objective = parseObjective(quest.data?.objective);
  if (!objective) throw new GameError(404, "quest_not_found");
  if (objective.type === "ritual") {
    return { url: lastfmUrl(objective.albumId) ?? lastfmSearch(objective.albumName) };
  }
  if (objective.type === "deep_cut") {
    return { url: lastfmUrl(objective.artistId) ?? lastfmSearch(objective.artistName) };
  }
  if (objective.type === "social") {
    return { url: lastfmUrl(objective.trackId) ?? lastfmSearch(objective.trackName) };
  }
  if (objective.seedAlbumId) {
    return { url: lastfmUrl(objective.seedAlbumId) ?? lastfmSearch(objective.seedLabel) };
  }
  return { url: lastfmSearch(objective.seedLabel) };
}

async function grantOther(userId: string, amount: number): Promise<void> {
  const hero = await loadHero(userId);
  const credit: Credit = { toasts: [], levelUp: null };
  awardXp(hero, amount, "quest", credit, null);
  await saveHero(hero);
}

async function createDiscovery(userId: string, expires: string): Promise<void> {
  const weights = await getSupabase().from("genre_weights").select("genre_family, hours_30d, share").eq("user_id", userId);
  if (weights.error) throw new Error(weights.error.message);
  const ranked = [...(weights.data ?? [])].sort(
    (a, b) => Number(b.hours_30d) - Number(a.hours_30d) || Number(b.share) - Number(a.share),
  );
  const top = new Set(ranked.slice(0, 5).map((row) => row.genre_family));
  const families = GENRE_FAMILIES.filter((family) => family !== "Unmapped" && !top.has(family));
  const label = families[0] ?? "Jazz";
  const seed = await albumForFamily(label);
  await insertQuest(userId, {
    type: "discovery",
    title: "New albums",
    description: `Finish 3 albums outside your top genres. ${label} is one place to start.`,
    xpReward: 150,
    expires,
    objective: { type: "discovery", families, target: 3, seedAlbumId: seed?.id ?? null, seedLabel: label },
  });
}

async function createDeepCut(userId: string, expires: string): Promise<boolean> {
  const known = await getSupabase().from("codex_artists").select("artist_id").eq("user_id", userId);
  if (known.error) throw new Error(known.error.message);
  const seen = new Set((known.data ?? []).map((row) => row.artist_id));
  const weights = await getSupabase()
    .from("genre_weights")
    .select("genre_family, share")
    .eq("user_id", userId)
    .order("share", { ascending: false });
  if (weights.error) throw new Error(weights.error.message);
  const families = (weights.data ?? [])
    .map((row) => row.genre_family)
    .filter((family) => family && family !== "Unmapped");
  const queries = families.length > 0 ? families.slice(0, 3) : ["Jazz"];
  const artist = await lesserKnownArtist(queries, seen);
  if (!artist) return false;
  await insertQuest(userId, {
    type: "deep_cut",
    title: "Lesser-known artist",
    description: `Play 5 tracks by ${artist.name} past the halfway mark. They have fewer than 100,000 listeners.`,
    xpReward: 100,
    expires,
    objective: { type: "deep_cut", artistId: artist.id, artistName: artist.name, target: 5 },
  });
  return true;
}

async function createRitual(userId: string, expires: string): Promise<boolean> {
  const recent = await getSupabase()
    .from("listening_events")
    .select("album_id, album_name")
    .eq("user_id", userId)
    .eq("legacy", false)
    .order("played_at", { ascending: false })
    .limit(10);
  if (recent.error) throw new Error(recent.error.message);
  const album = (recent.data ?? []).find((row) => row.album_id);
  if (!album?.album_id) return false;
  const trackIds = await albumTrackIds(album.album_id);
  if (trackIds.length < MIN_ALBUM_TRACKS) return false;
  await insertQuest(userId, {
    type: "ritual",
    title: "Full album",
    description: `Play ${album.album_name || "this album"} from the first track to the last without skipping.`,
    xpReward: 75,
    expires,
    objective: { type: "ritual", albumId: album.album_id, albumName: album.album_name || "the record", trackIds },
  });
  return true;
}

async function createSocial(userId: string, expires: string): Promise<boolean> {
  const partyId = await partyIdFor(userId);
  if (!partyId) return false;
  const members = await getSupabase().from("party_members").select("user_id").eq("party_id", partyId);
  if (members.error) throw new Error(members.error.message);
  const others = (members.data ?? []).map((row) => row.user_id).filter((id) => id !== userId);
  if (others.length === 0) return false;
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const theirs = await getSupabase()
    .from("listening_events")
    .select("user_id, track_id, track_name, artist_names, album_name, played_at")
    .in("user_id", others)
    .gte("played_at", since)
    .order("played_at", { ascending: false })
    .limit(30);
  if (theirs.error) throw new Error(theirs.error.message);
  const mine = await getSupabase().from("listening_events").select("track_id").eq("user_id", userId);
  if (mine.error) throw new Error(mine.error.message);
  const heard = new Set((mine.data ?? []).map((row) => row.track_id));
  const pick = (theirs.data ?? []).find((row) => !heard.has(row.track_id));
  if (!pick) return false;
  const profile = await getSupabase().from("profiles").select("display_name").eq("id", pick.user_id).maybeSingle();
  if (profile.error) throw new Error(profile.error.message);
  const friendName = profile.data?.display_name ?? "A friend";
  const artistName = (pick.artist_names ?? []).filter(Boolean).join(", ");
  const albumName = pick.album_name || "";
  const credit = trackCredit(artistName, albumName);
  await insertQuest(userId, {
    type: "social",
    title: "Party track",
    description: `${friendName} played ${pick.track_name}${credit ? ` ${credit}` : ""}. Play it past the halfway mark.`,
    xpReward: 50,
    expires,
    objective: {
      type: "social",
      trackId: pick.track_id,
      trackName: pick.track_name,
      artistName,
      albumName,
      friendName,
      friendId: pick.user_id,
    },
  });
  return true;
}

async function insertQuest(
  userId: string,
  quest: { type: string; title: string; description: string; xpReward: number; expires: string; objective: QuestObjective },
): Promise<void> {
  const id = randomUUID();
  const created = await getSupabase().from("quests").insert({
    id,
    user_id: userId,
    type: quest.type,
    title: quest.title,
    description: quest.description,
    objective: quest.objective,
    xp_reward: quest.xpReward,
    expires_at: quest.expires,
  });
  if (created.error) throw new Error(created.error.message);
  const progress = await getSupabase().from("quest_progress").insert({
    user_id: userId,
    quest_id: id,
    progress: { current: 0, target: quest.type === "discovery" ? 3 : quest.type === "deep_cut" ? 5 : 1 },
  });
  if (progress.error) throw new Error(progress.error.message);
}

async function loadQuestRows(userId: string): Promise<QuestRow[]> {
  const supabase = getSupabase();
  const quests = await supabase
    .from("quests")
    .select("id, type, title, description, objective, xp_reward, expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (quests.error) throw new Error(quests.error.message);
  const progress = await supabase.from("quest_progress").select("quest_id, progress, completed_at").eq("user_id", userId);
  if (progress.error) throw new Error(progress.error.message);
  const rows = (quests.data ?? []).flatMap((row) => {
    const objective = parseObjective(row.objective);
    if (!objective) return [];
    const state = progress.data?.find((item) => item.quest_id === row.id);
    const saved = isRecord(state?.progress) ? state.progress : {};
    return [
      {
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        objective,
        xpReward: row.xp_reward,
        expiresAt: row.expires_at,
        current: typeof saved.current === "number" ? saved.current : 0,
        target: typeof saved.target === "number" ? saved.target : 1,
        completedAt: state?.completed_at ?? null,
      },
    ];
  });
  return fillTrackCredits(rows);
}

function trackCredit(artistName: string, albumName: string): string {
  return [artistName ? `by ${artistName}` : "", albumName ? `on ${albumName}` : ""].filter(Boolean).join(" ");
}

async function fillTrackCredits(rows: QuestRow[]): Promise<QuestRow[]> {
  const missing = rows.flatMap((row) => {
    if (row.objective.type !== "social" || !row.objective.friendId) return [];
    if (row.objective.artistName && row.objective.albumName) return [];
    return [row];
  });
  if (missing.length === 0) return rows;
  const friendIds = [...new Set(missing.flatMap((row) => (row.objective.type === "social" ? [row.objective.friendId] : [])))];
  const trackIds = [...new Set(missing.flatMap((row) => (row.objective.type === "social" ? [row.objective.trackId] : [])))];
  const found = await getSupabase()
    .from("listening_events")
    .select("user_id, track_id, artist_names, album_name")
    .in("user_id", friendIds)
    .in("track_id", trackIds)
    .limit(40);
  if (found.error) throw new Error(found.error.message);
  return rows.map((row) => {
    const objective = row.objective;
    if (objective.type !== "social" || (objective.artistName && objective.albumName)) return row;
    const hit = (found.data ?? []).find((event) => event.user_id === objective.friendId && event.track_id === objective.trackId);
    if (!hit) return row;
    return {
      ...row,
      objective: {
        ...objective,
        artistName: objective.artistName || (hit.artist_names ?? []).filter(Boolean).join(", "),
        albumName: objective.albumName || hit.album_name || "",
      },
    };
  });
}

async function loadListens(userId: string): Promise<ListenFact[]> {
  const { data, error } = await getSupabase()
    .from("listening_events")
    .select("track_id, album_id, artist_ids, played_at")
    .eq("user_id", userId)
    .eq("legacy", false);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    trackId: row.track_id,
    albumId: row.album_id,
    artistIds: row.artist_ids,
    playedAt: row.played_at,
  }));
}

async function loadAlbums(userId: string): Promise<AlbumFact[]> {
  const { data, error } = await getSupabase()
    .from("codex_albums")
    .select("album_id, genre_family, tracks_played, tracks_total")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    albumId: row.album_id,
    family: row.genre_family,
    tracksPlayed: row.tracks_played,
    tracksTotal: row.tracks_total,
  }));
}

function nextMonday(date = new Date()): string {
  const start = new Date(`${weekStart(date)}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() + 7);
  return start.toISOString();
}

function weekStart(date = new Date()): string {
  const day = date.getUTCDay();
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - ((day + 6) % 7)));
  return monday.toISOString().slice(0, 10);
}

function weekEven(): boolean {
  return Math.floor(Date.now() / (7 * 86400000)) % 2 === 0;
}
