/** Single zod instance extended with OpenAPI metadata; every domain schema imports `z` from here. */
import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export { z };
export const registry = new OpenAPIRegistry();

/** Register a named component schema for the OpenAPI document and return it. */
export function named<T extends z.ZodTypeAny>(name: string, schema: T): T {
  return registry.register(name, schema);
}
