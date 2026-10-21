/** Seed: demo users, a classroom, parent link, assignments, authoring templates. */
import type { Assignment, Classroom, Enrollment, ParentLink, Template, User } from "@/lib/domain";

const T0 = "2026-09-01T08:00:00.000Z";

export const DEMO_USERS = {
  student: "usr_student_salma",
  teacher: "usr_teacher_hoda",
  parent: "usr_parent_ahmed",
  admin: "usr_admin",
} as const;

export const USERS: User[] = [
  { id: "usr_system", role: "admin", name: "مِخيال", locale: "ar-EG", createdAt: T0 },
  { id: DEMO_USERS.admin, role: "admin", name: "مدير المنصة", locale: "ar-EG", createdAt: T0 },
  { id: DEMO_USERS.student, role: "student", name: "سلمى", grade: 2, locale: "ar-EG", createdAt: T0 },
  { id: "usr_student_youssef", role: "student", name: "يوسف", grade: 2, locale: "ar-EG", createdAt: T0 },
  { id: "usr_student_mariam", role: "student", name: "مريم", grade: 2, locale: "ar-EG", createdAt: T0 },
  { id: DEMO_USERS.teacher, role: "teacher", name: "أ. هدى", locale: "ar-EG", createdAt: T0 },
  { id: DEMO_USERS.parent, role: "parent", name: "أحمد (ولي أمر سلمى)", locale: "ar-EG", createdAt: T0 },
];

export const CLASSROOMS: Classroom[] = [{ id: "cls_3_2", name: "فصل 3/2 — فيزياء", teacherId: DEMO_USERS.teacher, grade: 2, joinCode: "MKH-32", createdAt: T0 }];

export const ENROLLMENTS: Enrollment[] = [DEMO_USERS.student, "usr_student_youssef", "usr_student_mariam"].map((s, i) => ({
  id: `enr_${i + 1}`,
  classroomId: "cls_3_2",
  studentId: s,
  joinedAt: T0,
}));

export const PARENT_LINKS: ParentLink[] = [{ id: "pln_1", parentId: DEMO_USERS.parent, studentId: DEMO_USERS.student, relation: "father" }];

export const ASSIGNMENTS: Assignment[] = [
  { id: "asg_1", classroomId: "cls_3_2", contentId: "wbp_braking_001", contentType: "workbench", mode: "discovery", dueAt: "2026-10-30T20:00:00.000Z", createdAt: T0 },
  { id: "asg_2", classroomId: "cls_3_2", contentId: "msn_newton", contentType: "mission", mode: "discovery", createdAt: T0 },
  { id: "asg_3", classroomId: "cls_3_2", contentId: "lab_circuits", contentType: "lab", mode: "discovery", createdAt: T0 },
];

export const TEMPLATES: Template[] = [
  {
    id: "tpl_discovery_lesson",
    kind: "lesson",
    contentType: "mission",
    title: "درس اكتشاف (الحلقة الكاملة)",
    description: "تحدي ← توقع ← تجربة ← اكتشاف ← تطبيق ← تأمل، بنتيجة تجربة معرّفة بقواعد (من غير كود).",
    slots: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "story", label: "قصة التحدي", type: "text", required: true },
      { key: "goal", label: "المطلوب", type: "text", required: true },
      { key: "conceptKey", label: "المفهوم", type: "concept", required: true },
      { key: "relation", label: "العلاقة المكتشفة (target = expr)", type: "latex", required: true },
      { key: "params", label: "متغيرات التجربة", type: "param_list", required: true },
      { key: "success", label: "شرط النجاح", type: "text", required: true },
    ],
    skeleton: {
      type: "mission",
      title: "{{title}}",
      tagline: "{{goal}}",
      icon: "FlaskConical",
      subject: "physics",
      challenge: { story: "{{story}}", goal: "{{goal}}" },
      prediction: { question: "تتوقع إيه؟", options: [{ id: "a", label: "يزيد" }, { id: "b", label: "يقل" }, { id: "c", label: "مايتغيرش" }], correctId: "a", reveal: "", rules: [] },
      experiment: { instruction: "حرّك المتغيرات واضغط «شغّل».", params: "{{params}}", outcome: { kind: "rules", readouts: [], success: "{{success}}", messages: [{ when: "true", text: "جرّب تاني." }] } },
      discovery: { prompt: "اكتب العلاقة اللي لاحظتها.", latex: "{{relation}}", derivation: [], wrongRelations: [], forbiddenSymbols: {} },
      hints: {},
    },
  },
  {
    id: "tpl_rules_lab",
    kind: "lab",
    contentType: "mission",
    title: "معمل بارامتري سريع",
    description: "محاكاة بمنزلقات وقراءات ورسم بياني، كل حاجة معرّفة بتعبيرات رياضية (OutcomeSpec rules).",
    slots: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "params", label: "المتغيرات", type: "param_list", required: true },
      { key: "readouts", label: "القراءات (label/expr/unit)", type: "text", required: true },
      { key: "success", label: "شرط النجاح", type: "text", required: true },
    ],
    skeleton: { type: "mission", title: "{{title}}", experiment: { params: "{{params}}", outcome: { kind: "rules", readouts: "{{readouts}}", success: "{{success}}", messages: [] } } },
  },
  {
    id: "tpl_exam",
    kind: "exam",
    contentType: "exam",
    title: "امتحان بنظام المنهج",
    description: "أسئلة اختيار من متعدد ورقمية بوقت، مع قواعد تشخيص لكل اختيار غلط.",
    slots: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "timeLimitSec", label: "الوقت (ثانية)", type: "number", required: true, default: 300 },
    ],
    skeleton: { type: "exam", title: "{{title}}", timeLimitSec: "{{timeLimitSec}}", questions: [] },
  },
  {
    id: "tpl_workbench",
    kind: "workbench",
    contentType: "workbench",
    title: "مسألة متعددة الخطوات بجراف حل",
    description: "رموز ومعطيات وقوانين ونموذج فيزيائي وجراف حل بأكتر من مسار، يتقيّم بالمختبر الرياضي.",
    slots: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "goal", label: "الكمية المطلوبة", type: "text", required: true },
    ],
    skeleton: { type: "workbench", title: "{{title}}", spec: { goal: "{{goal}}", symbols: {}, knowns: {}, truth: {}, principles: [], graph: { nodes: [], edges: [], paths: [] } } },
  },
  {
    id: "tpl_visualization",
    kind: "visualization",
    contentType: "visualization",
    title: "رسم بياني تفاعلي",
    description: "دالة أو منحنى مربوط بمتغيرات المحاكاة (Mafs plot2d).",
    slots: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "expr", label: "y = f(x)", type: "latex", required: true },
    ],
    skeleton: { type: "visualization", title: "{{title}}", componentId: "vcp_plot2d", bindings: { y: "{{expr}}" } },
  },
];
