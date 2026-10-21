/** Classrooms, assignments, parent links and the dashboard reports. */
import type { Assignment, ClassReport, Classroom, ParentReport, User } from "@/lib/domain";
import { buildClassReport } from "@/lib/mock/classroom";
import { CATEGORY_MASTERY, CHILD, COMPLETED, INSIGHTS, SOLVER_SKILLS, WEEK } from "@/lib/mock/family";
import { db, newId, nowIso } from "../db/store";
import { badRequest, forbidden, notFound, requireRole } from "../http";
import { learnerModel } from "./learner";

export function listClasses(user: User): Classroom[] {
  const s = db();
  if (user.role === "teacher") return s.classrooms.list((c) => c.teacherId === user.id);
  if (user.role === "student") {
    const ids = s.enrollments.list((e) => e.studentId === user.id).map((e) => e.classroomId);
    return s.classrooms.list((c) => ids.includes(c.id));
  }
  if (user.role === "admin") return s.classrooms.list();
  return [];
}

export function getClass(user: User, id: string) {
  const s = db();
  const c = s.classrooms.get(id);
  if (!c) throw notFound(`classroom ${id}`);
  const isMember = s.enrollments.list((e) => e.classroomId === id && e.studentId === user.id).length > 0;
  if (c.teacherId !== user.id && !isMember && user.role !== "admin") throw forbidden();
  const students = s.enrollments.list((e) => e.classroomId === id).map((e) => s.users.get(e.studentId)!);
  return { classroom: c, students, assignments: s.assignments.list((a) => a.classroomId === id) };
}

export function createClass(user: User, input: { name: string; grade: number }) {
  requireRole(user, "teacher");
  const c: Classroom = { id: newId("cls"), name: input.name, grade: input.grade, teacherId: user.id, joinCode: `MKH-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, createdAt: nowIso() };
  return db().classrooms.insert(c);
}

function ownClass(user: User, id: string) {
  const c = db().classrooms.get(id);
  if (!c) throw notFound(`classroom ${id}`);
  if (c.teacherId !== user.id && user.role !== "admin") throw forbidden("only the class teacher can do this");
  return c;
}

export function addStudent(user: User, classId: string, studentId: string) {
  ownClass(user, classId);
  const st = db().users.get(studentId);
  if (!st || st.role !== "student") throw badRequest("studentId must be a student");
  const existing = db().enrollments.list((e) => e.classroomId === classId && e.studentId === studentId)[0];
  return existing ?? db().enrollments.insert({ id: newId("enr"), classroomId: classId, studentId, joinedAt: nowIso() });
}

export function createAssignment(user: User, classId: string, input: Omit<Assignment, "id" | "classroomId" | "createdAt">) {
  ownClass(user, classId);
  const s = db();
  const exists = s.missions.get(input.contentId) ?? s.labs.get(input.contentId) ?? s.workbench.get(input.contentId) ?? s.phenomena.get(input.contentId) ?? s.exams.get(input.contentId);
  if (!exists) throw badRequest(`unknown content ${input.contentId}`);
  return s.assignments.insert({ ...input, id: newId("asg"), classroomId: classId, createdAt: nowIso() });
}

/** Class report for the workbench assignment. Mock students run through the real validator. */
export function classReport(user: User, classId: string, contentId = "wbp_braking_001"): ClassReport {
  const c = ownClass(user, classId);
  const r = buildClassReport();
  return {
    classroomId: c.id,
    contentId,
    problemId: r.problemId,
    students: r.students.map((st, i) => ({ ...st, studentId: `mock_${i + 1}` })),
    heatmap: r.heatmap,
    misconceptions: r.misconceptions,
    routes: r.routes,
    generatedAt: nowIso(),
    source: "mock",
  };
}

export function studentReasoning(user: User, classId: string, studentId: string) {
  const report = classReport(user, classId);
  const s = report.students.find((x) => x.studentId === studentId);
  if (!s) throw notFound(`student ${studentId}`);
  return s;
}

export function children(user: User) {
  requireRole(user, "parent");
  return db()
    .parentLinks.list((l) => l.parentId === user.id)
    .map((l) => ({ link: l, child: db().users.get(l.studentId)! }));
}

/** Parent report: mock narrative, with mastery bars blended from the live learner model when available. */
export function parentReport(user: User, childId: string): ParentReport {
  const link = db().parentLinks.list((l) => l.studentId === childId && (l.parentId === user.id || user.role === "admin"))[0];
  if (!link && user.id !== childId) throw forbidden("not linked to this student");
  const child = db().users.get(childId);
  if (!child) throw notFound(`student ${childId}`);
  const live = learnerModel(childId);
  const prefixes: Record<string, string[]> = { mechanics: ["kinematics", "dynamics", "circular", "statics", "vectors"], electromagnetic: ["electricity", "em."], thermal: ["thermal"], quantum: ["quantum", "relativity"] };
  const hasLive = Object.keys(live.concepts).length > 0;
  return {
    child: { id: child.id, name: child.name, grade: CHILD.grade, week: CHILD.week },
    week: WEEK,
    categoryMastery: CATEGORY_MASTERY.map((c) => {
      const vals = Object.entries(live.concepts)
        .filter(([k]) => (prefixes[c.id] ?? []).some((p) => k.startsWith(p)))
        .map(([, v]) => v.mastery);
      return vals.length ? { ...c, mastery: vals.reduce((a, b) => a + b, 0) / vals.length } : c;
    }),
    solverSkills: SOLVER_SKILLS,
    insights: INSIGHTS,
    discussionPrompts: COMPLETED,
    source: hasLive ? "live" : "mock",
  };
}
