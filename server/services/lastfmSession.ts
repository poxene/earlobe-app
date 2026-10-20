import { env } from "../env";
import { ReconnectRequired } from "../errors";
import { getSupabase } from "../supabase";
import { decryptSecret, encryptSecret } from "./crypto";

export type LastfmSession = {
  username: string;
  key: string;
};

export async function saveSession(userId: string, session: LastfmSession): Promise<void> {
  const { error } = await getSupabase()
    .from("lastfm_sessions")
    .upsert({
      user_id: userId,
      session_key: encryptSecret(session.key, env.tokenEncryptionKey),
      username: session.username,
    });
  if (error) throw new Error(error.message);
}

export async function readSession(userId: string): Promise<LastfmSession | null> {
  const { data, error } = await getSupabase()
    .from("lastfm_sessions")
    .select("session_key, username")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  try {
    return { username: data.username, key: decryptSecret(data.session_key, env.tokenEncryptionKey) };
  } catch {
    throw new ReconnectRequired();
  }
}

export async function listSessionUserIds(): Promise<string[]> {
  const { data, error } = await getSupabase().from("lastfm_sessions").select("user_id");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.user_id);
}
