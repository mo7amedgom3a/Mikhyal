/** Mock parent report for one (fictional) student. */
export const CHILD = { name: "سلمى", grade: "تانية ثانوي", week: "الأسبوع 6" };

export const CATEGORY_MASTERY = [
  { id: "mechanics", label: "الحركة والقوى", mastery: 0.82, trend: +0.08 },
  { id: "electromagnetic", label: "ظواهر كهرومغناطيسية", mastery: 0.64, trend: +0.15 },
  { id: "thermal", label: "ظواهر حرارية", mastery: 0.71, trend: +0.05 },
  { id: "quantum", label: "ظواهر كمّية ونسبية", mastery: 0.38, trend: +0.12 },
];

export const SOLVER_SKILLS = [
  { id: "understand", label: "فهم المسألة", value: 0.86 },
  { id: "represent", label: "تمثيلها (رسم/رموز)", value: 0.72 },
  { id: "model", label: "اختيار النموذج الفيزيائي", value: 0.68 },
  { id: "translate", label: "التحويل الجبري والتعويض", value: 0.81 },
  { id: "verify", label: "التحقق من النتيجة", value: 0.47 },
];

export const INSIGHTS: { tone: "strength" | "watch"; title: string; detail: string; evidence: string }[] = [
  {
    tone: "strength",
    title: "بتعزل المتغيرات صح",
    detail: "في 9 من 10 خطوات «عزل متغير» التحويل كان مكافئ رياضيًا للخطوة اللي قبله.",
    evidence: "مهمة مسافة الفرملة · مهمة الاحتكاك",
  },
  {
    tone: "watch",
    title: "فاتها قيد المجال مرتين",
    detail: "عزلت المتغيرات صح، بس في $x^2 = 9$ كتبت $x = 3$ بس، ونسيت الحل التاني. بعد سؤال مِخيال رجعت وصلّحتها لوحدها.",
    evidence: "مختبر الأخطاء الدقيقة",
  },
  {
    tone: "strength",
    title: "لقت طريقة حل جديدة",
    detail: "حلت مسألة الفرملة بمتوسط السرعة × الزمن — طريقة صحيحة مش موجودة في الحل المكتوب، واتسجّلت للمدرّس.",
    evidence: "مسافة الفرملة",
  },
  {
    tone: "watch",
    title: "التحقق من الوحدات محتاج تعوّد",
    detail: "في التأثير الكهروضوئي طرحت إلكترون فولت من جول. التلميح التالت (التحقق) خلاها تلاحظ وتحوّل.",
    evidence: "التأثير الكهروضوئي",
  },
];

export const COMPLETED = [
  { title: "مسافة الفرملة", phenomenon: null, prompt: "لو العربية سرعتها اتضاعفت، مسافة الفرملة هتتضاعف ولا أكتر؟ ليه السواقين لازم يسيبوا مسافة أكبر على الطريق السريع؟" },
  { title: "التأثير الكهروضوئي", phenomenon: "photoelectric", prompt: "ليه الضوء الأحمر مهما كان قوي مايطلّعش إلكترونات من الصوديوم، والبنفسجي الضعيف يطلّع؟" },
  { title: "التمدد الحراري", phenomenon: "thermal-expansion", prompt: "ليه غطا البرطمان الحديد بيتفتح أسهل لو حطيناه تحت مية سخنة؟" },
  { title: "تحولات الحالة", phenomenon: "phase-transitions", prompt: "ليه المية في الحلة بتفضل 100 درجة مهما عليّنا النار وهي بتغلي؟" },
];

export const WEEK = { minutes: 214, missions: 4, steps: 63, validFirstTry: 0.71, hintsUsed: 9 };
