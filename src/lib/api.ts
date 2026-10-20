import { isRecord } from "@/lib/isRecord";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiGet(path: string): Promise<unknown> {
  const response = await fetch(path, { credentials: "include" });
  return readBody(response);
}

export async function apiPost(path: string, body?: unknown): Promise<unknown> {
  return apiSend(path, "POST", body);
}

export async function apiSend(path: string, method: "POST" | "PUT", body?: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readBody(response);
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    const code = isRecord(body) && typeof body.error === "string" ? body.error : "request_failed";
    throw new ApiError(response.status, code);
  }
  return body;
}
