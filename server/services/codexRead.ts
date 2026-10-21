import { MONSTERS } from "../../src/lib/game/bestiary";
import { albumHeard } from "../../src/lib/game/quests";
import { classForFamily } from "../../src/lib/game/classes";
import { GENRE_FAMILIES } from "../../src/lib/music/normalize";
import { varietyFor, varietiesFor } from "../../src/lib/game/varieties";
import { getSupabase } from "../supabase";
import { coverFor, rememberedCover, usableImage } from "./coverArt";

const UNLOCK_HOURS = 5;
const REVEAL_HOURS = 1;

export async function loadCodex(userId: string) {
  const supabase = getSupabase();
  const [artists, albums, weights, bestiary, character, encounters] = await Promise.all([
    supabase
      .from("codex_artists")
      .select("artist_id, name, image_url, genres, discovered_at, listen_count")
      .eq("user_id", userId)
      .order("discovered_at", { ascending: false }),
    supabase
      .from("codex_albums")
      .select("album_id, name, artist_name, image_url, genre_family, tracks_played, tracks_total, completed_at")
      .eq("user_id", userId)
      .order("name"),
    supabase.from("genre_weights").select("genre_family, hours_30d").eq("user_id", userId),
    supabase.from("bestiary").select("monster_type, encountered, defeated, escaped, best_grade, fastest_kill_sec").eq("user_id", userId),
    supabase.from("characters").select("active_class, unlocked_classes").eq("user_id", userId).maybeSingle(),
    supabase.from("encounters").select("genre_family, track_id").eq("user_id", userId),
  ]);
  for (const result of [artists, albums, weights, bestiary, character, encounters]) {
    if (result.error) throw new Error(result.error.message);
  }
  const hours = new Map((weights.data ?? []).map((row) => [row.genre_family, Number(row.hours_30d)]));
  const unlocked = new Set(character.data?.unlocked_classes ?? []);
  const seenVarieties = new Set(
    (encounters.data ?? []).map((row) => varietyFor(row.genre_family, row.track_id).id),
  );
  return {
    artists: (artists.data ?? []).map((row) => ({
      id: row.artist_id,
      name: row.name,
      imageUrl: row.image_url,
      genres: row.genres,
      discoveredAt: row.discovered_at,
      listens: row.listen_count,
    })),
    albums: (await fillAlbumCovers(userId, albums.data ?? [])).map((row) => ({
      id: row.album_id,
      name: row.name,
      artistName: row.artist_name,
      imageUrl: row.image_url,
      family: row.genre_family,
      color: classForFamily(row.genre_family).color,
      tracksPlayed: row.tracks_played,
      tracksTotal: row.tracks_total,
      attuned: albumHeard(row.tracks_played, row.tracks_total),
    })),
    genres: GENRE_FAMILIES.map((family) => {
      const entry = classForFamily(family);
      const listened = hours.get(family) ?? 0;
      const known = unlocked.has(entry.id) || entry.id === (character.data?.active_class ?? "");
      const revealed = known || listened >= REVEAL_HOURS;
      return {
        family: revealed ? family : null,
        className: known ? entry.id : null,
        color: revealed ? entry.color : null,
        hours: listened,
        target: UNLOCK_HOURS,
        unlocked: unlocked.has(entry.id),
        hidden: !known,
      };
    }),
    bestiary: Object.values(MONSTERS).map((monster) => {
      const row = bestiary.data?.find((item) => item.monster_type === monster.monster);
      return {
        monster: monster.monster,
        motif: monster.motif,
        family: monster.family,
        color: classForFamily(monster.family).color,
        encountered: row?.encountered ?? 0,
        defeated: row?.defeated ?? 0,
        escaped: row?.escaped ?? 0,
        bestGrade: row?.best_grade ?? null,
        fastestKillSec: row?.fastest_kill_sec ?? null,
        seen: (row?.encountered ?? 0) > 0,
        seenVarietyIds: varietiesFor(monster.family)
          .map((entry) => entry.id)
          .filter((id) => seenVarieties.has(id)),
      };
    }),
  };
}

async function fillAlbumCovers<T extends { album_id: string; name: string; artist_name: string; image_url: string | null }>(
  userId: string,
  rows: T[],
): Promise<T[]> {
  const supabase = getSupabase();
  let lookups = 0;
  const filled: T[] = [];
  for (const row of rows) {
    let image = usableImage(row.image_url);
    if (!image) {
      const remembered = rememberedCover(row.artist_name, row.name);
      if (remembered !== undefined) image = remembered;
      else if (lookups < 4) {
        lookups += 1;
        image = await coverFor(row.artist_name, row.name);
        if (image) {
          const saved = await supabase
            .from("codex_albums")
            .update({ image_url: image })
            .eq("user_id", userId)
            .eq("album_id", row.album_id);
          if (saved.error) throw new Error(saved.error.message);
        }
      }
    }
    filled.push({ ...row, image_url: image });
  }
  return filled;
}
