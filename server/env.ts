import "dotenv/config";

function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`missing env: ${names.join(" or ")}`);
}

function readEncryptionKey(): Buffer {
  const key = Buffer.from(readEnv("TOKEN_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes of base64");
  }
  return key;
}

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:5173";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  frontendOrigin,
  sessionSecret: readEnv("SESSION_SECRET"),
  tokenEncryptionKey: readEncryptionKey(),
  supabaseUrl: readEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  cronSecret: process.env.CRON_SECRET ?? "",
  lastfmApiKey: readEnv("LASTFM_API_KEY"),
  lastfmSharedSecret: readEnv("LASTFM_SHARED_SECRET"),
  lastfmCallbackUrl: process.env.LASTFM_CALLBACK_URL ?? `${frontendOrigin}/auth/lastfm/callback`,
};
