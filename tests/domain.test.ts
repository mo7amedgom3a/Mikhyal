import { describe, expect, it } from "vitest";
import * as D from "@/lib/domain";
import { resetDb } from "@/lib/server/db/store";

const store = resetDb();
const SCHEMAS = {
  users: D.User,
  classrooms: D.Classroom,
  enrollments: D.Enrollment,
  parentLinks: D.ParentLink,
  assignments: D.Assignment,
  subjects: D.SubjectRecord,
  units: D.Unit,
  concepts: D.Concept,
  outcomes: D.CurriculumOutcome,
  quantities: D.Quantity,
  equations: D.Equation,
  misconceptions: D.Misconception,
  simulations: D.SimulationEngine,
  visualComponents: D.VisualComponent,
  missions: D.Mission,
  exams: D.Exam,
  labs: D.Lab,
  phenomena: D.Phenomenon,
  workbench: D.WorkbenchProblem,
  templates: D.Template,
} as const;

describe("seeded store matches the domain schemas", () => {
  it.each(Object.entries(SCHEMAS))("%s", (name, schema) => {
    const rows = store[name as keyof typeof SCHEMAS].list();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const r = schema.safeParse(row);
      if (!r.success) throw new Error(`${name}/${(row as { id: string }).id}: ${r.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    }
  });
});

describe("referential integrity", () => {
  const has = (col: { get(id: string): unknown }, id: string) => !!col.get(id);
  it("content references resolve", () => {
    const problems: string[] = [];
    const check = (ok: boolean, msg: string) => ok || problems.push(msg);
    for (const kind of ["missions", "labs", "phenomena", "workbench", "exams"] as const)
      for (const c of store[kind].list()) for (const cid of c.conceptIds) check(has(store.concepts, cid), `${c.id} → ${cid}`);
    for (const m of store.missions.list()) {
      check(has(store.exams, m.examId), `${m.id} exam`);
      check(has(store.simulations, m.experiment.simulationId), `${m.id} sim`);
      for (const e of m.equationIds) check(has(store.equations, e), `${m.id} → ${e}`);
      if (m.reflection.nextMissionId) check(has(store.missions, m.reflection.nextMissionId), `${m.id} next`);
      if (m.reflection.labId) check(has(store.labs, m.reflection.labId), `${m.id} lab`);
    }
    for (const p of store.phenomena.list()) {
      check(has(store.simulations, p.simulationId), `${p.id} sim`);
      if (p.workbenchProblemId) check(has(store.workbench, p.workbenchProblemId), `${p.id} wb`);
    }
    for (const l of store.labs.list()) for (const lv of l.levels) for (const cid of lv.conceptIds) check(has(store.concepts, cid), `${l.id}/${lv.id} → ${cid}`);
    for (const e of store.equations.list()) for (const q of e.quantityIds) check(has(store.quantities, q), `${e.id} → ${q}`);
    for (const s of store.simulations.list()) for (const v of s.visualComponentIds) check(has(store.visualComponents, v), `${s.id} → ${v}`);
    for (const m of store.misconceptions.list()) check(!!store.missions.get(m.sourceId), `${m.id} source`);
    for (const c of store.concepts.list()) for (const p of [...c.prerequisites, ...c.related]) check(has(store.concepts, p), `${c.id} → ${p}`);
    for (const a of store.assignments.list()) check(!!(store.missions.get(a.contentId) ?? store.labs.get(a.contentId) ?? store.workbench.get(a.contentId) ?? store.phenomena.get(a.contentId)), `${a.id} content`);
    expect(problems).toEqual([]);
  });

  it("the prerequisite graph is acyclic", () => {
    const state = new Map<string, number>();
    const visit = (id: string): boolean => {
      if (state.get(id) === 1) return false;
      if (state.get(id) === 2) return true;
      state.set(id, 1);
      const ok = store.concepts.get(id)!.prerequisites.every(visit);
      state.set(id, 2);
      return ok;
    };
    expect(store.concepts.list().every((c) => visit(c.id))).toBe(true);
  });
});
