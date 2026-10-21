# Mikhyal API v1 (simulated backend)

Base URL: `/api/v1`. JSON in, JSON out. Errors use one envelope:

```json
{ "error": { "code": "bad_request | unauthorized | forbidden | not_found | conflict | unprocessable | internal", "message": "…", "details": [] } }
```

- **Contract:** `GET /api/v1/openapi.json` (OpenAPI 3.1, generated from the zod schemas in `lib/domain`).
- **Demo auth:** `POST /auth/demo-login {role}` sets the `mikhyal_user` cookie; or send `x-mikhyal-user: <userId>`. Default identity is the demo student. Demo ids: `usr_student_salma`, `usr_teacher_hoda`, `usr_parent_ahmed`, `usr_admin`.
- **Ids or slugs:** content endpoints accept the id (`msn_braking`) or the slug (`braking`).
- **Lists:** `?q=&type=&subject=&concept=&status=&cursor=&limit=` → `{ items, total, nextCursor }`.

83 endpoints. Source of truth: `lib/server/endpoints.ts` → handlers in `lib/server/routes.ts` → services in `lib/server/services/*`.

## Meta

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/health` | Liveness and store counts | any | — | JSON |
| GET | `/openapi.json` | This OpenAPI document | any | — | JSON |

## Auth

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| POST | `/auth/demo-login` | Switch the demo identity (student / teacher / parent / admin); sets the mikhyal_user cookie | any | DemoLoginBody | JSON |
| GET | `/me` | Current user | any | — | User |

## Curriculum

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/subjects` | Subjects | any | — | JSON |
| GET | `/curriculum` | Subjects, units and syllabus outcomes | any | — | JSON |
| GET | `/concepts` | Concepts (knowledge-graph nodes) | any | — | JSON |
| GET | `/concepts/{id}` | Concept with prerequisites, unlocks, equations, misconceptions, outcomes and content | any | — | JSON |
| GET | `/knowledge-graph` | Concepts, equations and content with typed edges | any | — | KnowledgeGraph |
| GET | `/equations` | Equation registry | any | — | JSON |
| GET | `/equations/{id}` | Equation with its quantities and concepts | any | — | JSON |
| GET | `/quantities` | Physical quantities (symbol, unit, dimension) | any | — | JSON |
| GET | `/misconceptions` | Misconception catalog with detectors and interventions | any | — | JSON |

## Catalog

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/catalog` | Unified content catalog (filter by type, subject, concept, q) | any | — | JSON |
| GET | `/templates` | Authoring templates | any | — | JSON |
| GET | `/simulations` | Simulation engines (params, observables, visual components) | any | — | JSON |
| GET | `/simulations/{id}` | Simulation engine detail | any | — | JSON |
| GET | `/visual-components` | Visual component library | any | — | JSON |

## Content

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/missions` | Missions (6-step learning loop) | any | — | JSON |
| GET | `/missions/{id}` | Mission with its exam, equations and simulation (id or slug) | any | — | JSON |
| GET | `/labs` | Constructive sandbox labs | any | — | JSON |
| GET | `/labs/{id}` | Lab with levels and goals | any | — | JSON |
| GET | `/phenomena` | Phenomena modules (type = category) | any | — | JSON |
| GET | `/phenomena/{id}` | Phenomenon with its simulation | any | — | JSON |
| GET | `/workbench/problems` | Mathematical Workbench problems | any | — | JSON |
| GET | `/workbench/problems/{id}` | Workbench problem with its solution graph | any | — | JSON |
| GET | `/exams/{id}` | Exam (curriculum-style, timed) | any | — | JSON |

## Grading

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| POST | `/missions/{id}/predict` | Grade a prediction choice; returns a diagnosis for known misconceptions | any | PredictBody | JSON |
| POST | `/missions/{id}/check-equation` | Check a discovered relation symbolically | any | CheckInputBody | JSON |
| POST | `/missions/{id}/check-answer` | Check a numeric answer with units | any | CheckInputBody | JSON |
| POST | `/phenomena/{id}/check-answer` | Check a phenomenon mission answer | any | CheckInputBody | JSON |
| POST | `/exams/{id}/submit` | Grade an exam attempt with per-question diagnoses | any | ExamSubmitBody | JSON |
| POST | `/workbench/problems/{id}/validate` | Validate a sequence of reasoning steps (math / physics / pedagogy) | any | WorkbenchValidateBody | JSON |
| GET | `/workbench/subtle` | Subtle-error showcase cases with their analysis | any | — | JSON |
| POST | `/workbench/subtle/analyze` | Analyze a subtle-error case under an assumption | any | SubtleAnalyzeBody | JSON |
| POST | `/outcomes/evaluate` | Evaluate a declarative (rules) experiment outcome | any | OutcomeEvaluateBody | JSON |

## Runtime

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| POST | `/sessions` | Start a learning session | any | StartSessionBody | Session |
| GET | `/sessions/{id}` | Session with its events | any | — | JSON |
| POST | `/sessions/{id}/events` | Append learning events (updates the learner model) | any | EventsBody | JSON |
| POST | `/sessions/{id}/complete` | Complete a session | any | — | JSON |
| POST | `/tutor` | Socratic tutor reply (rules, or Claude when configured) | any | TutorBody | TutorReply |

## Learner

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/me/learner-model` | My learner model (BKT mastery, errors, progress) | any | — | LearnerModel |
| POST | `/me/events` | Append learning events outside a session | any | EventsBody | JSON |
| GET | `/me/progress` | Mission mastery and lab progress | any | — | JSON |
| GET | `/me/recommendations` | Adaptive next activities | any | — | JSON |
| GET | `/me/dashboard` | Student dashboard read model | any | — | StudentDashboard |
| PUT | `/me/labs/{labId}/progress` | Save solved lab levels | any | LabProgressBody | JSON |
| POST | `/me/missions/{id}/complete` | Mark a mission complete | any | — | JSON |

## Teacher

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/classes` | My classrooms | any | — | JSON |
| POST | `/classes` | Create a classroom | teacher | CreateClassBody | Classroom |
| GET | `/classes/{id}` | Classroom with students and assignments | any | — | JSON |
| POST | `/classes/{id}/students` | Enroll a student | teacher | AddStudentBody | JSON |
| POST | `/classes/{id}/assignments` | Assign content | teacher | CreateAssignmentBody | Assignment |
| GET | `/classes/{id}/report` | Class reasoning report (step validity, misconceptions, routes) | teacher | — | ClassReport |
| GET | `/classes/{id}/students/{studentId}/reasoning` | One student's reasoning path | teacher | — | JSON |

## Parent

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/me/children` | Linked children | parent | — | JSON |
| GET | `/children/{id}/report` | Parent report: mastery, reasoning quality, discussion prompts | parent | — | ParentReport |

## Studio

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/studio/drafts` | My drafts | teacher | — | JSON |
| POST | `/studio/drafts` | Create a draft from a template, from scratch, or by forking content | teacher | CreateDraftBody | StudioDraft |
| GET | `/studio/drafts/{id}` | Draft | teacher | — | StudioDraft |
| PATCH | `/studio/drafts/{id}` | Update a draft (re-validates) | teacher | UpdateDraftBody | StudioDraft |
| DELETE | `/studio/drafts/{id}` | Delete a draft | teacher | — | JSON |
| POST | `/studio/drafts/{id}/validate` | Validate a draft against the content schema and domain rules | teacher | — | StudioDraft |
| POST | `/studio/drafts/{id}/publish` | Publish a draft as a new content version | teacher | PublishBody | JSON |
| GET | `/content/{id}/versions` | Published versions of a content item | any | — | JSON |
| POST | `/studio/solution-graphs/validate` | Validate a solution graph (cycles, reachability, formulas) | teacher | GraphValidateBody | JSON |

## AI

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| POST | `/ai/generations` | Generate a lesson / lab / exam / visualization draft | teacher | AIGenerationRequest | AIGenerationJob |
| GET | `/ai/generations/{id}` | Generation job with its draft | teacher | — | JSON |

## AI agents

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/ai/tools` | Tools the advisor and generator agents can call | any | — | JSON |
| GET | `/ai/libraries` | Rendering / maths / physics libraries available to generated UI | any | — | JSON |
| POST | `/ai/runs` | Run the advisor or generator agent (tool calls + message + generated UI) | any | RunRequest | AgentRun |
| GET | `/ai/runs/{id}` | Agent run transcript | any | — | AgentRun |
| GET | `/ai/runs/{id}/stream` | Server-sent events replaying the run step by step (?speed=) | any | — | JSON |
| POST | `/ai/tools/{name}/invoke` | Invoke one tool directly (debugging / studio) | any | ToolInvokeBody | JSON |

## Generated lessons

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/lessons` | Lessons published by the generator | any | — | JSON |
| GET | `/lessons/{slug}` | Generated lesson (UI spec) with the run that produced it | any | — | JSON |

## Knowledge base

| Method | Path | Summary | Roles | Body | Response |
|---|---|---|---|---|---|
| GET | `/topics` | Knowledge-base topics | any | — | JSON |
| GET | `/topics/{slug}` | Topic outline, timeline and FAQ | any | — | Topic |
| GET | `/elements` | Element data (Z, N, shells, radii, isotopes) | any | — | JSON |
| GET | `/elements/{symbol}` | One element | any | — | ElementRecord |
| GET | `/atom-models` | How the atom was imagined: historical models in order | any | — | JSON |
| GET | `/particles` | Proton, neutron, electron: charge, mass, location | any | — | JSON |
| GET | `/datasets/{id}` | Experimental dataset (e.g. dst_geiger_marsden_1913) | any | — | Dataset |

## Example flows

**A student works through a mission**

```http
GET  /api/v1/missions/braking                      → { mission, exam, equations, simulation }
POST /api/v1/sessions {"contentId":"msn_braking","mode":"discovery"}   → Session
POST /api/v1/missions/braking/predict {"choiceId":"double"}            → { correct:false, diagnosis:{ errorType:"conceptual", … } }
POST /api/v1/missions/braking/check-equation {"input":"v^2 = u^2 - 2as"} → { status:"correct", next:{ kind:"advance", … } }
POST /api/v1/sessions/{id}/events {"events":[{ "contentId":"braking","step":"discover","kind":"equation_attempt","correct":true,
      "evidence":{"conceptKeys":["kinematics.v2"],"correct":true,"hintsUsed":0},"at":1760000000000 }]}  → { learner }
POST /api/v1/sessions/{id}/complete                → { session, learner }
GET  /api/v1/me/recommendations                    → adaptive next activities
```

**A teacher builds a lesson from a template and publishes it**

```http
GET   /api/v1/templates
POST  /api/v1/studio/drafts {"templateId":"tpl_discovery_lesson","slots":{…}}  → StudioDraft (with validation issues)
PATCH /api/v1/studio/drafts/{id} {"content":{…}}                               → StudioDraft (re-validated)
POST  /api/v1/studio/drafts/{id}/publish {"note":"v1"}                         → { content, version }
POST  /api/v1/classes/cls_3_2/assignments {"contentId":"msn_…","contentType":"mission","mode":"discovery"}
```

**AI-assisted authoring**

```http
POST /api/v1/ai/generations {"kind":"lesson","prompt":"…","conceptIds":["cpt_dynamics.newton2"]} → AIGenerationJob (202)
GET  /api/v1/ai/generations/{id}                                                                   → { job, draft }
```
