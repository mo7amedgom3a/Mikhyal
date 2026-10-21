/** Seed: subjects, units, concepts (knowledge graph), curriculum outcomes. */
import type { Concept, CurriculumOutcome, SubjectRecord, Unit } from "@/lib/domain";

export const SUBJECTS: SubjectRecord[] = [
  { id: "sbj_physics", key: "physics", title: "فيزياء", color: "#5146e8" },
  { id: "sbj_math", key: "math", title: "رياضيات", color: "#12a889" },
  { id: "sbj_applied", key: "applied", title: "رياضيات تطبيقية", color: "#f4b544" },
];

export const UNITS: Unit[] = [
  { id: "unt_mechanics", subjectId: "sbj_physics", title: "الحركة والقوى", order: 1, grade: 2, track: "science" },
  { id: "unt_electricity", subjectId: "sbj_physics", title: "الكهربية والمغناطيسية", order: 2, grade: 3, track: "science" },
  { id: "unt_thermal", subjectId: "sbj_physics", title: "الحرارة", order: 3, grade: 2, track: "science" },
  { id: "unt_modern", subjectId: "sbj_physics", title: "الفيزياء الحديثة", order: 4, grade: 3, track: "science" },
  { id: "unt_algebra", subjectId: "sbj_math", title: "الجبر والدوال", order: 1, grade: 1, track: "general" },
  { id: "unt_trig", subjectId: "sbj_math", title: "حساب المثلثات", order: 2, grade: 1, track: "general" },
  { id: "unt_vectors", subjectId: "sbj_applied", title: "المتجهات", order: 1, grade: 2, track: "math" },
  { id: "unt_statics", subjectId: "sbj_applied", title: "الاستاتيكا", order: 2, grade: 2, track: "math" },
];

type Row = [key: string, title: string, unit: string, prereqs?: string[], related?: string[]];

const ROWS: Row[] = [
  ["kinematics.deceleration", "التباطؤ والعجلة السالبة", "unt_mechanics"],
  ["kinematics.v2", "معادلة الحركة بدون زمن", "unt_mechanics", ["kinematics.deceleration"]],
  ["dynamics.netforce", "القوة المحصلة", "unt_mechanics", ["vectors.resultant"]],
  ["dynamics.newton2", "قانون نيوتن التاني", "unt_mechanics", ["dynamics.netforce", "kinematics.deceleration"]],
  ["circular.centripetal", "العجلة المركزية", "unt_mechanics", ["dynamics.newton2"]],
  ["circular.friction", "الاحتكاك في الحركة الدائرية", "unt_mechanics", ["circular.centripetal", "statics.friction"]],
  ["relativity.dilation", "تمدد الزمن", "unt_modern", ["kinematics.v2"]],
  ["electricity.closed-circuit", "الدائرة المغلقة", "unt_electricity"],
  ["electricity.series", "التوصيل على التوالي", "unt_electricity", ["electricity.closed-circuit"]],
  ["electricity.parallel", "التوصيل على التوازي", "unt_electricity", ["electricity.closed-circuit"], ["electricity.series"]],
  ["electricity.switch", "المفاتيح والتحكم", "unt_electricity", ["electricity.parallel"]],
  ["electricity.short", "قصر الدائرة", "unt_electricity", ["electricity.series"]],
  ["electricity.ohm", "قانون أوم", "unt_electricity", ["electricity.closed-circuit"]],
  ["em.magnetism", "المجال المغناطيسي لسلك", "unt_electricity", ["electricity.ohm"]],
  ["em.hall", "تأثير هول", "unt_electricity", ["em.magnetism"]],
  ["em.photoelectric", "التأثير الكهروضوئي", "unt_modern", ["electricity.ohm"]],
  ["thermal.expansion", "التمدد الحراري", "unt_thermal"],
  ["thermal.phase", "تحولات الحالة والحرارة الكامنة", "unt_thermal", ["thermal.expansion"]],
  ["thermal.entropy", "الإنتروبيا واتجاه الحرارة", "unt_thermal", ["thermal.phase"]],
  ["quantum.duality", "ازدواجية الموجة والجسيم", "unt_modern", ["em.photoelectric"]],
  ["quantum.tunneling", "النفق الكمّي", "unt_modern", ["quantum.duality"]],
  ["relativity.unruh", "تأثير أونرو", "unt_modern", ["quantum.duality", "relativity.dilation"]],
  ["algebra.quadratic.roots", "جذور الدالة التربيعية", "unt_algebra"],
  ["algebra.quadratic.vertex", "رأس القطع المكافئ", "unt_algebra", ["algebra.quadratic.roots"]],
  ["trig.tangent", "ظل الزاوية", "unt_trig"],
  ["trig.elevation", "زوايا الارتفاع", "unt_trig", ["trig.tangent"]],
  ["vectors.components", "تحليل المتجهات", "unt_vectors", ["trig.tangent"]],
  ["vectors.resultant", "محصلة قوتين", "unt_vectors", ["vectors.components"]],
  ["statics.equilibrium", "اتزان جسم", "unt_statics", ["vectors.resultant"]],
  ["statics.resolution", "تحليل الشد", "unt_statics", ["statics.equilibrium", "vectors.components"]],
  ["statics.lami", "قاعدة لامي", "unt_statics", ["statics.equilibrium"]],
  ["statics.moments", "العزوم", "unt_statics", ["statics.equilibrium"]],
  ["statics.friction", "الاحتكاك", "unt_statics", ["statics.equilibrium"]],
  ["statics.incline", "المستوى المائل", "unt_statics", ["statics.friction", "vectors.components"]],
];

const unitSubject = Object.fromEntries(UNITS.map((u) => [u.id, u.subjectId]));
export const conceptId = (key: string) => `cpt_${key}`;

export const CONCEPTS: Concept[] = ROWS.map(([key, title, unitId, prereqs = [], related = []]) => ({
  id: conceptId(key),
  key,
  title,
  description: "",
  subjectId: unitSubject[unitId],
  unitId,
  prerequisites: prereqs.map(conceptId),
  related: related.map(conceptId),
  bkt: { pInit: 0.15, pLearn: 0.2, pSlip: 0.1, pGuess: 0.2 },
}));

export const OUTCOMES: CurriculumOutcome[] = [
  { id: "out_phy2_mech_01", code: "PHY-2-MECH-01", statement: "يطبّق معادلات الحركة بعجلة منتظمة في مواقف حياتية", unitId: "unt_mechanics", conceptIds: [conceptId("kinematics.v2"), conceptId("kinematics.deceleration")], examWeight: 0.12 },
  { id: "out_phy2_mech_02", code: "PHY-2-MECH-02", statement: "يستخدم قانون نيوتن التاني مع القوة المحصلة", unitId: "unt_mechanics", conceptIds: [conceptId("dynamics.newton2"), conceptId("dynamics.netforce")], examWeight: 0.1 },
  { id: "out_phy3_elec_01", code: "PHY-3-ELEC-01", statement: "يحلل الدوائر الكهربية البسيطة باستخدام قانون أوم", unitId: "unt_electricity", conceptIds: [conceptId("electricity.ohm"), conceptId("electricity.series"), conceptId("electricity.parallel")], examWeight: 0.14 },
  { id: "out_phy3_mod_01", code: "PHY-3-MOD-01", statement: "يفسر التأثير الكهروضوئي بنموذج الفوتون", unitId: "unt_modern", conceptIds: [conceptId("em.photoelectric")], examWeight: 0.06 },
  { id: "out_phy2_th_01", code: "PHY-2-TH-01", statement: "يحسب التمدد الحراري والحرارة الكامنة", unitId: "unt_thermal", conceptIds: [conceptId("thermal.expansion"), conceptId("thermal.phase")], examWeight: 0.06 },
  { id: "out_mth1_alg_01", code: "MTH-1-ALG-01", statement: "يحدد رأس منحنى الدالة التربيعية وجذورها", unitId: "unt_algebra", conceptIds: [conceptId("algebra.quadratic.vertex"), conceptId("algebra.quadratic.roots")], examWeight: 0.08 },
  { id: "out_app2_st_01", code: "APP-2-ST-01", statement: "يحل مسائل اتزان جسم تحت تأثير عدة قوى", unitId: "unt_statics", conceptIds: [conceptId("statics.equilibrium"), conceptId("statics.lami"), conceptId("statics.resolution")], examWeight: 0.1 },
];
