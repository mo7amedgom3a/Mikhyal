/** Audience feature sheets: what each group gets, and where to see it. */
export type Audience = "students" | "instructors" | "parents";

export const AUDIENCES: Record<Audience, { title: string; pitch: string; href: string; cta: string; features: { icon: string; title: string; text: string; href?: string }[] }> = {
  students: {
    title: "للطلاب",
    pitch: "بتتعلم بالتجربة، وبتتقيّم على طريقة تفكيرك خطوة خطوة.",
    href: "/workbench/braking_001",
    cta: "جرّب المختبر الرياضي",
    features: [
      { icon: "Rocket", title: "مهمات تفاعلية", text: "تحدي ← توقع ← تجربة ← اكتشاف ← تطبيق ← تأمل، بتلميحات موجّهة وحل بيظهر خطوة خطوة.", href: "/learn" },
      { icon: "Sigma", title: "المختبر الرياضي", text: "بيقيّم الاستدلال مش الإجابة بس: كل خطوة رياضيًا وفيزيائيًا وتربويًا.", href: "/workbench" },
      { icon: "GitBranch", title: "مستكشف الحلول", text: "أكتر من طريق صحيح (زي «باستخدام الزمن» و«بدون الزمن») — ومش لازم تمشي بطريقة المدرّس.", href: "/workbench/braking_001" },
      { icon: "Layers", title: "ملاحظات على كل خطوة", text: "3 طبقات تحقق: صحة رياضية، ملاءمة فيزيائية، وصلة بالهدف — مع مسار التحقق كامل لو حابب تشوفه." },
      { icon: "Lightbulb", title: "تلميحات في وقتها", text: "مفاهيمي ← استراتيجي ← إجرائي ← تحقق. بتظهر لما تقف، ومابتحرقش الإجابة." },
      { icon: "RotateCcw", title: "أعد خطوة واحدة", text: "تقدر تعيد أي خطوة لوحدها؛ كل محاولة ليها معرّف مستقل (client_step_id) فمابتضيعش ولا بتتحسب مرتين." },
    ],
  },
  instructors: {
    title: "للمدرّسين",
    pitch: "شوف تفكير الفصل كله، وألّف حلول بأكتر من طريق.",
    href: "/teach",
    cta: "افتح لوحة المدرّس",
    features: [
      { icon: "Network", title: "تأليف جراف الحل", text: "مش شجرة قرارات: عقد كميات ومبادئ ومعادلات وتحويلات وقيم وسيطة وقيود وأهداف، بطرق بديلة.", href: "/teach#authoring-title" },
      { icon: "Waypoints", title: "مسارات تفكير الطلاب", text: "فين اختلف كل طالب عن الطرق المكتوبة — وإمتى لقى طريق جديد صحيح." },
      { icon: "Grid3x3", title: "لوحة صحة الخطوات", text: "نسبة الخطوات السليمة رياضيًا وفيزيائيًا وتربويًا لكل مرحلة في الفصل." },
      { icon: "TriangleAlert", title: "الأخطاء الشائعة القابلة للتصحيح", text: "أكتر الأخطاء تكرارًا، والتدخل اللي اتعمل، وكام طالب اتعافى بعده." },
      { icon: "SlidersHorizontal", title: "تلميحات وتدخلات لكل خطوة", text: "حدد 4 مستويات تلميح ونوع التدخل (توضيح، تلميح، تجربة) لكل عقدة." },
      { icon: "Layers", title: "خط تحقق شفاف", text: "كل حكم ليه أثر: المحلّل، الرموز، الوحدات، القيود، مطابقة الجراف، والقرار التربوي.", href: "/workbench/pipeline" },
    ],
  },
  parents: {
    title: "لأولياء الأمور",
    pitch: "مش بس «جاب كام»: ابنك بيفكر إزاي، وتتكلموا في إيه.",
    href: "/parents",
    cta: "شوف تقرير تجريبي",
    features: [
      { icon: "Gauge", title: "الإتقان حسب الظواهر", text: "تقدّم في الحركة، والظواهر الكهرومغناطيسية والحرارية والكمّية." },
      { icon: "ListChecks", title: "مهارات حل المسائل", text: "فهم، تمثيل، اختيار النموذج، تحويل جبري، وتحقق." },
      { icon: "Eye", title: "جودة التفكير", text: "زي: «عزل المتغيرات صح بس فاته قيد المجال» — مش مجرد درجة." },
      { icon: "MessageCircleHeart", title: "أسئلة للنقاش في البيت", text: "سؤال بسيط عن كل مهمة خلّصها، يفتح حوار من غير ما تحتاج تعرف الإجابة." },
    ],
  },
};
