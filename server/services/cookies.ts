export const SESSION_COOKIE = "earlobe_session";
export const STATE_COOKIE = "earlobe_oauth_state";

export function serializeCookie(
  name: string,
  value: string,
  options: { maxAgeSec: number; secure: boolean },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${options.secure ? "None" : "Lax"}`,
    `Max-Age=${options.maxAgeSec}`,
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie(name: string, secure: boolean): string {
  return serializeCookie(name, "", { maxAgeSec: 0, secure });
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
