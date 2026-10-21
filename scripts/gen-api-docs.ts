/**
 * Writes docs/backend/api.md from the endpoint table (run after changing lib/server/endpoints.ts):
 *   npx tsx scripts/gen-api-docs.ts
 */
import { writeFileSync } from "node:fs";
import { ENDPOINTS } from "../lib/server/endpoints";

const tags = [...new Set(ENDPOINTS.map((e) => e.tag))];
const schemaName = (s: unknown) => ((s as { _def?: { openapi?: { _internal?: { refId?: string } } } })?._def?.openapi?._internal?.refId ?? (s ? "inline" : "—"));
let md = `# Mikhyal API v1 (simulated backend)

Base URL: \`/api/v1\`. JSON in, JSON out. Errors use one envelope:

\`\`\`json
{ "error": { "code": "bad_request | unauthorized | forbidden | not_found | conflict | unprocessable | internal", "message": "…", "details": [] } }
\`\`\`

- **Contract:** \`GET /api/v1/openapi.json\` (OpenAPI 3.1, generated from the zod schemas in \`lib/domain\`).
- **Demo auth:** \`POST /auth/demo-login {role}\` sets the \`mikhyal_user\` cookie; or send \`x-mikhyal-user: <userId>\`. Default identity is the demo student. Demo ids: \`usr_student_salma\`, \`usr_teacher_hoda\`, \`usr_parent_ahmed\`, \`usr_admin\`.
- **Ids or slugs:** content endpoints accept the id (\`msn_braking\`) or the slug (\`braking\`).
- **Lists:** \`?q=&type=&subject=&concept=&status=&cursor=&limit=\` → \`{ items, total, nextCursor }\`.

${ENDPOINTS.length} endpoints. Source of truth: \`lib/server/endpoints.ts\` → handlers in \`lib/server/routes.ts\` → services in \`lib/server/services/*\`.
`;
for (const t of tags) {
  md += `\n## ${t}\n\n| Method | Path | Summary | Roles | Body | Response |\n|---|---|---|---|---|---|\n`;
  for (const e of ENDPOINTS.filter((x) => x.tag === t))
    md += `| ${e.method} | \`${e.path}\` | ${e.summary} | ${e.roles?.join(", ") ?? "any"} | ${e.body ? schemaName(e.body) : "—"} | ${e.response ? schemaName(e.response) : "JSON"} |\n`;
}
md += `
## Example flows

**A student works through a mission**

\`\`\`http
GET  /api/v1/missions/braking                      → { mission, exam, equations, simulation }
POST /api/v1/sessions {"contentId":"msn_braking","mode":"discovery"}   → Session
POST /api/v1/missions/braking/predict {"choiceId":"double"}            → { correct:false, diagnosis:{ errorType:"conceptual", … } }
POST /api/v1/missions/braking/check-equation {"input":"v^2 = u^2 - 2as"} → { status:"correct", next:{ kind:"advance", … } }
POST /api/v1/sessions/{id}/events {"events":[{ "contentId":"braking","step":"discover","kind":"equation_attempt","correct":true,
      "evidence":{"conceptKeys":["kinematics.v2"],"correct":true,"hintsUsed":0},"at":1760000000000 }]}  → { learner }
POST /api/v1/sessions/{id}/complete                → { session, learner }
GET  /api/v1/me/recommendations                    → adaptive next activities
\`\`\`

**A teacher builds a lesson from a template and publishes it**

\`\`\`http
GET   /api/v1/templates
POST  /api/v1/studio/drafts {"templateId":"tpl_discovery_lesson","slots":{…}}  → StudioDraft (with validation issues)
PATCH /api/v1/studio/drafts/{id} {"content":{…}}                               → StudioDraft (re-validated)
POST  /api/v1/studio/drafts/{id}/publish {"note":"v1"}                         → { content, version }
POST  /api/v1/classes/cls_3_2/assignments {"contentId":"msn_…","contentType":"mission","mode":"discovery"}
\`\`\`

**AI-assisted authoring**

\`\`\`http
POST /api/v1/ai/generations {"kind":"lesson","prompt":"…","conceptIds":["cpt_dynamics.newton2"]} → AIGenerationJob (202)
GET  /api/v1/ai/generations/{id}                                                                   → { job, draft }
\`\`\`
`;
writeFileSync("docs/backend/api.md", md);
console.log("wrote docs/backend/api.md");
