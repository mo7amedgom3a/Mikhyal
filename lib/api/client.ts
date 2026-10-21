/** Typed fetch wrapper for the v1 API. Errors surface as ApiClientError with the server envelope. */
import type { ApiError } from "@/lib/domain";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api/v1";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/**
 * Demo identity for the simulated backend: pages for teachers/parents act as the demo teacher or
 * parent without changing the student's cookie. A real backend replaces this with a session token.
 */
let actingAs: string | undefined;
export function actAs(userId?: string) {
  actingAs = userId;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: { ...(init.body === undefined ? {} : { "content-type": "application/json" }), ...(actingAs ? { "x-mikhyal-user": actingAs } : {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    credentials: "same-origin",
    signal: init.signal,
  });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err = (data as ApiError | null)?.error;
    throw new ApiClientError(res.status, err?.code ?? "internal", err?.message ?? `HTTP ${res.status}`, err?.details);
  }
  return data as T;
}

export const qs = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();
  return s ? `?${s}` : "";
};
