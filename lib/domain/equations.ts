/** Physical quantities and equations: the shared vocabulary of missions, labs, phenomena and the Workbench. */
import { idOf, Latex, MathExpr } from "./common";
import { named, z } from "./z";

export const Quantity = named(
  "Quantity",
  z.object({
    id: idOf("quantity"),
    symbol: z.string().openapi({ description: "Symbol as used in expressions", example: "a" }),
    tex: Latex,
    name: z.string(),
    /** SI unit understood by mathjs ("" for dimensionless). */
    unit: z.string(),
    dimension: z.string().openapi({ example: "L T^-2" }),
    domain: z.tuple([z.number(), z.number()]).optional(),
    sign: z.enum(["positive", "nonnegative", "negative", "any"]).default("any"),
  }),
);
export type Quantity = z.infer<typeof Quantity>;

export const Equation = named(
  "Equation",
  z.object({
    id: idOf("equation"),
    name: z.string(),
    latex: Latex,
    /** Explicit relation, e.g. "s = u*t + a*t^2/2". */
    relation: MathExpr,
    quantityIds: z.array(idOf("quantity")),
    conceptIds: z.array(idOf("concept")),
    assumptions: z.array(z.string()),
    /** Equations this one can be derived from. */
    derivedFrom: z.array(idOf("equation")),
  }),
);
export type Equation = z.infer<typeof Equation>;
