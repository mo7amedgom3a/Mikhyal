import type { ChecklistItem } from "../types";

export const STANDARD_CHECKLIST: ChecklistItem[] = [
  { id: "selected_relationship", label_ar: "اخترت العلاقة المناسبة", label_en: "Selected relevant relationship" },
  { id: "rearranged", label_ar: "رتّبت المعادلة صح", label_en: "Rearranged correctly" },
  { id: "substituted_with_units", label_ar: "عوّضت ومعاك الوحدات", label_en: "Substituted with units" },
  { id: "verified", label_ar: "تحققت من النتيجة", label_en: "Verified result" },
];

export const WITH_INTERMEDIATE: ChecklistItem[] = [
  STANDARD_CHECKLIST[0],
  { id: "intermediate", label_ar: "حسبت كمية وسيطة محتاجها", label_en: "Found the needed intermediate quantity" },
  ...STANDARD_CHECKLIST.slice(1),
];
