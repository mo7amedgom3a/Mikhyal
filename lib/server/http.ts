/** Route-handler plumbing for the simulated backend: validation, errors, demo auth, roles. */
import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import type { ApiError, Role, User } from "@/lib/domain";
import { db } from "./db/store";
import { DEMO_USERS } from "./seed/people";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: ApiError["error"]["code"],
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, "not_found", `${what} not found`);
export const forbidden = (why = "not allowed for this role") => new HttpError(403, "forbidden", why);
export const badRequest = (why: string, details?: unknown) => new HttpError(400, "bad_request", why, details);

export const USER_COOKIE = "mikhyal_user";

/** Demo auth: `x-mikhyal-user` header, then the `mikhyal_user` cookie, else the demo student. */
export function currentUser(req: Request): User {
  const header = req.headers.get("x-mikhyal-user");
  const cookie = req.headers.get("cookie")?.match(new RegExp(`(?:^|; )${USER_COOKIE}=([^;]+)`))?.[1];
  const id = header ?? (cookie ? decodeURIComponent(cookie) : DEMO_USERS.student);
  const user = db().users.get(id);
  if (!user) throw new HttpError(401, "unauthorized", "unknown user");
  return user;
}

export function requireRole(user: User, ...roles: Role[]) {
  if (!roles.includes(user.role) && user.role !== "admin") throw forbidden(`requires role: ${roles.join(" | ")}`);
}

type Params = Record<string, string>;
interface Ctx<B, Q> {
  req: Request;
  params: Params;
  body: B;
  query: Q;
  user: () => User;
}

/**
 * Wrap a handler: parse JSON body and query with zod, run, serialise the result, and map
 * errors to the ApiError envelope.
 */
export function route<B = undefined, Q = Record<string, string>>(
  handler: (ctx: Ctx<B, Q>) => unknown | Promise<unknown>,
  opts: { body?: z.ZodType<B, z.ZodTypeDef, unknown>; query?: z.ZodType<Q, z.ZodTypeDef, unknown>; status?: number } = {},
) {
  return async (req: Request, context: { params: Promise<Params> }) => {
    try {
      const params = (await context?.params) ?? {};
      let body = undefined as B;
      if (opts.body) {
        let raw: unknown;
        try {
          raw = await req.json();
        } catch {
          throw badRequest("body must be JSON");
        }
        body = opts.body.parse(raw);
      }
      const rawQuery = Object.fromEntries(new URL(req.url).searchParams.entries());
      const query = (opts.query ? opts.query.parse(rawQuery) : rawQuery) as Q;
      let cached: User | undefined;
      const result = await handler({ req, params, body, query, user: () => (cached ??= currentUser(req)) });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true }, { status: opts.status ?? 200 });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: { code: e.code, message: e.message, details: e.details } } satisfies ApiError, { status: e.status });
  if (e instanceof ZodError)
    return NextResponse.json({ error: { code: "bad_request", message: "validation failed", details: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } } satisfies ApiError, { status: 400 });
  console.error("api error", e);
  return NextResponse.json({ error: { code: "internal", message: "internal error" } } satisfies ApiError, { status: 500 });
}

export function page<T>(items: T[], query: { cursor?: string; limit?: number }) {
  const start = query.cursor ? Number(query.cursor) || 0 : 0;
  const limit = query.limit ?? 100;
  const slice = items.slice(start, start + limit);
  return { items: slice, total: items.length, nextCursor: start + limit < items.length ? String(start + limit) : null };
}
