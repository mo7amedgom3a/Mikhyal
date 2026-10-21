import { named, z } from "./z";

export const ApiError = named(
  "ApiError",
  z.object({
    error: z.object({
      code: z.enum(["bad_request", "unauthorized", "forbidden", "not_found", "conflict", "unprocessable", "internal"]),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
);
export type ApiError = z.infer<typeof ApiError>;

export const Page = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), total: z.number().int(), nextCursor: z.string().nullable() });
export type Page<T> = { items: T[]; total: number; nextCursor: string | null };

export const ListQuery = z.object({
  q: z.string().optional(),
  subject: z.string().optional(),
  concept: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;
