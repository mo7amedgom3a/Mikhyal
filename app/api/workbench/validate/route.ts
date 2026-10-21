// Legacy path kept for compatibility; use POST /api/v1/workbench/problems/{id}/validate.
import { z } from "zod";
import { WorkbenchValidateBody } from "@/lib/domain";
import { route } from "@/lib/server/http";
import { validateWorkbench } from "@/lib/server/services/grading";

export const POST = route(
  ({ body }) =>
    validateWorkbench(
      body.problem_id,
      body.steps.map((s) => ({ ...s, expression_ast: null, ast_version: "mathjson/1" as const })),
      { priorFailedAttempts: body.prior_failed_attempts, mastery: body.mastery },
    ),
  { body: WorkbenchValidateBody.extend({ problem_id: z.string() }) },
);
