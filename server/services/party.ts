import { randomUUID } from "node:crypto";
import { classById } from "../../src/lib/game/classes";
import { classSignature } from "../../src/lib/game/skills";
import type { PartyAlly } from "../../src/lib/game/snapshot";
import { DOLL_SLOTS } from "../../src/lib/portrait/gear";
import { GameError } from "../errors";
import { getSupabase } from "../supabase";

export const PARTY_LIMIT = 3;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function partyIdFor(userId: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("party_members")
    .select("party_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.party_id ?? null;
}

export async function postFeed(
  userId: string,
  type: string,
  payload: { [key: string]: string | number | null },
): Promise<void> {
  const partyId = await partyIdFor(userId);
  if (!partyId) return;
  const { error } = await getSupabase().from("feed_events").insert({
    id: randomUUID(),
    party_id: partyId,
    user_id: userId,
    type,
    payload,
  });
  if (error) throw new Error(error.message);
}

export async function loadParty(userId: string): Promise<{
  id: string;
  name: string;
  inviteCode: string;
  members: {
    userId: string;
    name: string;
    className: string;
    level: number;
    trackName: string | null;
    artistName: string | null;
    silent: boolean;
  }[];
} | null> {
  const partyId = await partyIdFor(userId);
  if (!partyId) return null;
  const supabase = getSupabase();
  const party = await supabase.from("parties").select("id, name, invite_code").eq("id", partyId).maybeSingle();
  if (party.error) throw new Error(party.error.message);
  if (!party.data) return null;
  const members = await supabase.from("party_members").select("user_id").eq("party_id", partyId);
  if (members.error) throw new Error(members.error.message);
  const ids = (members.data ?? []).map((row) => row.user_id);
  const [profiles, characters, presence] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", ids),
    supabase.from("characters").select("user_id, active_class, level").in("user_id", ids),
    supabase.from("presence").select("user_id, track_name, artist_name, updated_at").in("user_id", ids),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  if (characters.error) throw new Error(characters.error.message);
  if (presence.error) throw new Error(presence.error.message);
  const now = Date.now();
  return {
    id: party.data.id,
    name: party.data.name,
    inviteCode: party.data.invite_code,
    members: ids.map((id) => {
      const profile = profiles.data?.find((row) => row.id === id);
      const character = characters.data?.find((row) => row.user_id === id);
      const here = presence.data?.find((row) => row.user_id === id);
      const fresh = here ? now - new Date(here.updated_at).getTime() < 2 * 60 * 1000 : false;
      return {
        userId: id,
        name: profile?.display_name ?? "Listener",
        className: character?.active_class ?? "Wanderer",
        level: character?.level ?? 1,
        trackName: fresh ? (here?.track_name ?? null) : null,
        artistName: fresh ? (here?.artist_name ?? null) : null,
        silent: !fresh || !here?.track_name,
      };
    }),
  };
}

export async function createParty(userId: string, name: string): Promise<{ inviteCode: string }> {
  if (await partyIdFor(userId)) throw new GameError(409, "already_in_party");
  const supabase = getSupabase();
  const inviteCode = Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)] ?? "A").join(
    "",
  );
  const id = randomUUID();
  const created = await supabase.from("parties").insert({
    id,
    name: name.trim().slice(0, 40) || "The back room",
    invite_code: inviteCode,
  });
  if (created.error) throw new Error(created.error.message);
  const joined = await supabase.from("party_members").insert({ party_id: id, user_id: userId });
  if (joined.error) throw new Error(joined.error.message);
  return { inviteCode };
}

export async function joinParty(userId: string, code: string): Promise<void> {
  if (await partyIdFor(userId)) throw new GameError(409, "already_in_party");
  const supabase = getSupabase();
  const party = await supabase
    .from("parties")
    .select("id")
    .eq("invite_code", code.trim().toUpperCase())
    .maybeSingle();
  if (party.error) throw new Error(party.error.message);
  if (!party.data) throw new GameError(404, "unknown_code");
  const members = await supabase
    .from("party_members")
    .select("user_id", { count: "exact", head: true })
    .eq("party_id", party.data.id);
  if (members.error) throw new Error(members.error.message);
  if ((members.count ?? 0) >= PARTY_LIMIT) throw new GameError(409, "party_full");
  const joined = await supabase.from("party_members").insert({ party_id: party.data.id, user_id: userId });
  if (joined.error) throw new Error(joined.error.message);
}

export async function leaveParty(userId: string): Promise<void> {
  const partyId = await partyIdFor(userId);
  if (!partyId) return;
  const supabase = getSupabase();
  const removed = await supabase.from("party_members").delete().eq("user_id", userId);
  if (removed.error) throw new Error(removed.error.message);
  const left = await supabase.from("party_members").select("user_id").eq("party_id", partyId);
  if (left.error) throw new Error(left.error.message);
  if ((left.data ?? []).length === 0) {
    const dropped = await supabase.from("parties").delete().eq("id", partyId);
    if (dropped.error) throw new Error(dropped.error.message);
  }
}

export async function loadBattleAllies(userId: string): Promise<PartyAlly[]> {
  const partyId = await partyIdFor(userId);
  if (!partyId) return [];
  const supabase = getSupabase();
  const members = await supabase
    .from("party_members")
    .select("user_id, joined_at")
    .eq("party_id", partyId)
    .order("joined_at", { ascending: true });
  if (members.error) throw new Error(members.error.message);
  const ids = (members.data ?? []).map((row) => row.user_id).filter((id) => id !== userId).slice(0, PARTY_LIMIT - 1);
  if (ids.length === 0) return [];
  const [profiles, characters, relics] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", ids),
    supabase.from("characters").select("user_id, active_class, level, body").in("user_id", ids),
    supabase.from("relics").select("user_id, gear_slug, equip_slot, equipped").in("user_id", ids).eq("equipped", true),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  if (characters.error) throw new Error(characters.error.message);
  if (relics.error) throw new Error(relics.error.message);
  return ids.map((id) => {
    const profile = profiles.data?.find((row) => row.id === id);
    const character = characters.data?.find((row) => row.user_id === id);
    const className = character?.active_class ?? "Wanderer";
    const gear: (string | null)[] = DOLL_SLOTS.map(() => null);
    for (const relic of relics.data ?? []) {
      if (relic.user_id !== id || relic.equip_slot == null) continue;
      if (relic.equip_slot < 0 || relic.equip_slot >= gear.length) continue;
      gear[relic.equip_slot] = relic.gear_slug;
    }
    return {
      userId: id,
      name: profile?.display_name ?? "Listener",
      className,
      classColor: classById(className)?.color ?? "#64748b",
      level: character?.level ?? 1,
      body: character?.body ?? "body6",
      gear,
      skillId: classSignature(className).id,
    };
  });
}

export async function loadFeed(userId: string): Promise<{ id: string; type: string; text: string; at: string }[]> {
  const partyId = await partyIdFor(userId);
  if (!partyId) return [];
  const supabase = getSupabase();
  const events = await supabase
    .from("feed_events")
    .select("id, user_id, type, payload, created_at")
    .eq("party_id", partyId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (events.error) throw new Error(events.error.message);
  const ids = [...new Set((events.data ?? []).map((row) => row.user_id))];
  const profiles = await supabase.from("profiles").select("id, display_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  if (profiles.error) throw new Error(profiles.error.message);
  return (events.data ?? []).map((row) => {
    const name = profiles.data?.find((profile) => profile.id === row.user_id)?.display_name ?? "Someone";
    return { id: row.id, type: row.type, text: feedText(name, row.type, row.payload), at: row.created_at };
  });
}

function feedText(name: string, type: string, payload: unknown): string {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const text = (key: string) => (typeof record[key] === "string" ? record[key] : "");
  if (type === "artist") return `${name} discovered ${text("artist")}`;
  if (type === "quest") return `${name} completed ${text("title")}`;
  if (type === "unlock") return `${name} unlocked ${text("className")}`;
  if (type === "battle") return `${name} slew a ${text("monster")} (${text("grade")})`;
  if (type === "listen") return `${name} is listening to ${text("track")}`;
  return `${name} stirred the room`;
}
