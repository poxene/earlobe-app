import { randomUUID } from "node:crypto";
import { classForFamily } from "../../src/lib/game/classes";
import { familiesForArtist } from "../../src/lib/music/normalize";
import { GameError } from "../errors";
import { getSupabase } from "../supabase";

const ONLINE_MS = 2 * 60 * 1000;
const CHAT_GAP_MS = 2 * 1000;
const CHAT_LIMIT = 40;

export type TownListener = {
  name: string;
  className: string;
  level: number;
  trackName: string | null;
  artistName: string | null;
  trackColor: string | null;
};

export type TownMessage = {
  id: string;
  name: string;
  body: string;
  at: string;
};

export async function loadTown(userId: string): Promise<{ online: TownListener[]; messages: TownMessage[] }> {
  const [online, messages] = await Promise.all([loadOnline(userId), loadMessages()]);
  return { online, messages };
}

export async function postTownMessage(userId: string, raw: string): Promise<TownMessage> {
  const body = raw.replace(/\s+/g, " ").trim();
  if (!body || body.length > 240) throw new GameError(400, "chat_invalid");
  const supabase = getSupabase();
  const last = await supabase
    .from("town_messages")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last.error) throw new Error(last.error.message);
  if (last.data && Date.now() - new Date(last.data.created_at).getTime() < CHAT_GAP_MS) {
    throw new GameError(429, "chat_fast");
  }
  const id = randomUUID();
  const created = await supabase.from("town_messages").insert({ id, user_id: userId, body });
  if (created.error) throw new Error(created.error.message);
  const profile = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  if (profile.error) throw new Error(profile.error.message);
  return { id, name: profile.data?.display_name ?? "Listener", body, at: new Date().toISOString() };
}

async function loadOnline(userId: string): Promise<TownListener[]> {
  const since = new Date(Date.now() - ONLINE_MS).toISOString();
  const supabase = getSupabase();
  const here = await supabase
    .from("presence")
    .select("user_id, track_name, artist_name")
    .gte("updated_at", since);
  if (here.error) throw new Error(here.error.message);
  const ids = (here.data ?? []).map((row) => row.user_id);
  if (ids.length === 0) return [];
  const [profiles, characters] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", ids),
    supabase.from("characters").select("user_id, active_class, level").in("user_id", ids),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  if (characters.error) throw new Error(characters.error.message);
  const online = ids.flatMap((id) => {
    const profile = profiles.data?.find((row) => row.id === id);
    const character = characters.data?.find((row) => row.user_id === id);
    const presence = here.data?.find((row) => row.user_id === id);
    if (!profile || !presence) return [];
    return [
      {
        userId: id,
        name: profile.display_name,
        className: character?.active_class ?? "Wanderer",
        level: character?.level ?? 1,
        trackName: presence.track_name,
        artistName: presence.artist_name,
        self: id === userId,
      },
    ];
  });
  online.sort((a, b) => Number(b.self) - Number(a.self) || a.name.localeCompare(b.name));
  const colors = await trackColors(online);
  return online.map((listener) => ({
    name: listener.name,
    className: listener.className,
    level: listener.level,
    trackName: listener.trackName,
    artistName: listener.artistName,
    trackColor: colors.get(listener.userId) ?? null,
  }));
}

async function trackColors(
  listeners: { userId: string; trackName: string | null; artistName: string | null }[],
): Promise<Map<string, string>> {
  const playing = listeners.flatMap((listener) => (listener.trackName ? [listener] : []));
  const colors = new Map<string, string>();
  if (playing.length === 0) return colors;
  const supabase = getSupabase();
  const fights = await supabase
    .from("encounters")
    .select("user_id, track_name, genre_family, started_at")
    .in("user_id", playing.map((listener) => listener.userId))
    .in("track_name", [...new Set(playing.map((listener) => listener.trackName ?? ""))])
    .order("started_at", { ascending: false });
  if (fights.error) throw new Error(fights.error.message);
  const fought = new Map<string, string>();
  for (const row of fights.data ?? []) {
    const key = `${row.user_id}\n${row.track_name}`;
    if (!fought.has(key)) fought.set(key, row.genre_family);
  }
  const missed = playing.filter((listener) => !fought.has(`${listener.userId}\n${listener.trackName}`));
  const genres = await genresByArtist(missed.flatMap((listener) => artistNames(listener.artistName)));
  for (const listener of playing) {
    const family = fought.get(`${listener.userId}\n${listener.trackName}`) ?? familyFromArtists(listener.artistName, genres);
    if (family) colors.set(listener.userId, classForFamily(family).color);
  }
  return colors;
}

async function genresByArtist(names: string[]): Promise<Map<string, string[]>> {
  const unique = [...new Set(names)];
  const found = new Map<string, string[]>();
  if (unique.length === 0) return found;
  const cache = await getSupabase().from("artist_cache").select("name, genres").in("name", unique);
  if (cache.error) throw new Error(cache.error.message);
  for (const row of cache.data ?? []) {
    if (!found.has(row.name)) found.set(row.name, row.genres);
  }
  return found;
}

function familyFromArtists(artistName: string | null, genres: Map<string, string[]>): string | null {
  const names = artistNames(artistName);
  if (!names.some((name) => genres.has(name))) return null;
  const primary = familiesForArtist(genres.get(names[0] ?? "") ?? []);
  if (primary[0] !== "Unmapped") return primary[0] ?? null;
  const guests = names.slice(1).flatMap((name) => genres.get(name) ?? []);
  const featured = familiesForArtist(guests);
  const picked = primary[0] !== "Unmapped" ? primary[0] : featured[0];
  return picked ?? null;
}

function artistNames(value: string | null): string[] {
  if (!value) return [];
  return value.split(", ").map((name) => name.trim()).filter((name) => name.length > 0);
}

async function loadMessages(): Promise<TownMessage[]> {
  const supabase = getSupabase();
  const rows = await supabase
    .from("town_messages")
    .select("id, user_id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(CHAT_LIMIT);
  if (rows.error) throw new Error(rows.error.message);
  const ids = [...new Set((rows.data ?? []).map((row) => row.user_id))];
  const profiles = await supabase.from("profiles").select("id, display_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  if (profiles.error) throw new Error(profiles.error.message);
  return (rows.data ?? [])
    .slice()
    .reverse()
    .map((row) => ({
      id: row.id,
      name: profiles.data?.find((profile) => profile.id === row.user_id)?.display_name ?? "Listener",
      body: row.body,
      at: row.created_at,
    }));
}
