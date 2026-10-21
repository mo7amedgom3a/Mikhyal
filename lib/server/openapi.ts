/** OpenAPI 3.1 document generated from the zod registry and the endpoint table. */
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { registry, z } from "@/lib/domain/z";
import { ApiError } from "@/lib/domain";
import { ENDPOINTS } from "./endpoints";

let cached: ReturnType<OpenApiGeneratorV31["generateDocument"]> | null = null;

export function openApiDocument() {
  if (cached) return cached;
  for (const e of ENDPOINTS) {
    const params = [...e.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    registry.registerPath({
      method: e.method.toLowerCase() as "get",
      path: e.path,
      tags: [e.tag],
      summary: e.summary,
      description: e.roles ? `Roles: ${e.roles.join(", ")} (admin always allowed)` : undefined,
      request: {
        params: params.length ? z.object(Object.fromEntries(params.map((p) => [p, z.string()]))) : undefined,
        body: e.body ? { content: { "application/json": { schema: e.body } } } : undefined,
      },
      responses: {
        200: { description: "OK", content: e.response ? { "application/json": { schema: e.response } } : undefined },
        400: { description: "Validation error", content: { "application/json": { schema: ApiError } } },
        403: { description: "Forbidden", content: { "application/json": { schema: ApiError } } },
        404: { description: "Not found", content: { "application/json": { schema: ApiError } } },
      },
    });
  }
  cached = new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Mikhyal API (simulated backend)",
      version: "1.0.0",
      description:
        "Contract for the Mikhyal learning platform. Served by Next.js route handlers over an in-memory store seeded from the app's content. Demo auth: the mikhyal_user cookie or x-mikhyal-user header.",
    },
    servers: [{ url: "/api/v1" }],
  });
  return cached;
}
