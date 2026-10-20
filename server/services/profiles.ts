import { getSupabase } from "../supabase";

export type ListenerIdentity = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ProfileRecord = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export async function upsertProfile(identity: ListenerIdentity): Promise<string> {
  if (!/^[A-Za-z0-9_-]{1,30}$/.test(identity.id)) {
    throw new Error("unexpected lastfm username");
  }

  const supabase = getSupabase();
  const displayName = identity.displayName?.trim() || "Listener";
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("lastfm_username", identity.id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  if (existing) {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, avatar_url: identity.avatarUrl })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return existing.id;
  }

  const email = `${identity.id}@listeners.earlo.be`;
  const userId = await ensureAuthUser(email, identity.id);
  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    lastfm_username: identity.id,
    display_name: displayName,
    avatar_url: identity.avatarUrl,
  });
  if (!insertError) return userId;

  const { data: raced, error: raceError } = await supabase
    .from("profiles")
    .select("id")
    .eq("lastfm_username", identity.id)
    .maybeSingle();
  if (raceError) throw new Error(raceError.message);
  if (raced) return raced.id;
  throw new Error(insertError.message);
}

export async function getProfile(userId: string): Promise<ProfileRecord | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    displayName: data.display_name?.trim() || "Listener",
    avatarUrl: data.avatar_url,
  };
}

async function ensureAuthUser(email: string, username: string): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { lastfm_username: username },
  });
  if (!error && data.user) return data.user.id;

  const { data: recovered, error: recoverError } = await supabase.rpc("user_id_for_lastfm_email", {
    target_email: email,
  });
  if (recoverError) throw new Error(recoverError.message);
  if (typeof recovered === "string" && recovered) return recovered;
  throw new Error(error?.message ?? "auth user was not created");
}
