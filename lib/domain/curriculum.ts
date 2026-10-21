/** Curriculum and knowledge graph: what a student is supposed to come to understand. */
import { idOf, Subject } from "./common";
import { named, z } from "./z";

export const SubjectRecord = named(
  "Subject",
  z.object({
    id: idOf("subject"),
    key: Subject,
    title: z.string(),
    color: z.string(),
  }),
);
export type SubjectRecord = z.infer<typeof SubjectRecord>;

export const Unit = named(
  "Unit",
  z.object({
    id: idOf("unit"),
    subjectId: idOf("subject"),
    title: z.string(),
    order: z.number().int(),
    /** Egyptian secondary grade (1–3) and track. */
    grade: z.number().int().min(1).max(3),
    track: z.enum(["general", "science", "math", "baccalaureate"]).default("science"),
  }),
);
export type Unit = z.infer<typeof Unit>;

/** Bayesian Knowledge Tracing parameters for one concept. */
export const BktParams = z.object({
  pInit: z.number().min(0).max(1),
  pLearn: z.number().min(0).max(1),
  pSlip: z.number().min(0).max(1),
  pGuess: z.number().min(0).max(1),
});

/** A node of the knowledge graph. `key` is the stable tag used by content and the learner model. */
export const Concept = named(
  "Concept",
  z.object({
    id: idOf("concept"),
    key: z.string().openapi({ example: "kinematics.braking" }),
    title: z.string(),
    description: z.string().default(""),
    subjectId: idOf("subject"),
    unitId: idOf("unit"),
    prerequisites: z.array(idOf("concept")),
    related: z.array(idOf("concept")),
    bkt: BktParams,
  }),
);
export type Concept = z.infer<typeof Concept>;

/** A syllabus learning outcome (Egyptian curriculum / exam blueprint). */
export const CurriculumOutcome = named(
  "CurriculumOutcome",
  z.object({
    id: idOf("outcome"),
    code: z.string().openapi({ example: "PHY-2-MECH-03" }),
    statement: z.string(),
    unitId: idOf("unit"),
    conceptIds: z.array(idOf("concept")),
    examWeight: z.number().min(0).max(1),
  }),
);
export type CurriculumOutcome = z.infer<typeof CurriculumOutcome>;

export const KnowledgeEdge = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(["prerequisite", "related", "uses_equation", "taught_by", "assessed_by"]),
});

/** Graph view joining concepts, equations and content. */
export const KnowledgeGraph = named(
  "KnowledgeGraph",
  z.object({
    nodes: z.array(z.object({ id: z.string(), kind: z.enum(["concept", "equation", "content"]), label: z.string(), subject: Subject.optional() })),
    edges: z.array(KnowledgeEdge),
  }),
);
export type KnowledgeGraph = z.infer<typeof KnowledgeGraph>;
