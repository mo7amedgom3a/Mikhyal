import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { SequencesLesson } from "@/components/sequences/SequencesLesson";

export const metadata: Metadata = {
  title: "المتتاليات الحسابية والصيغة الارتدادية — مِخيال",
  description: "درس تفاعلي: ابنِ المتتالية الحسابية بالصيغة الارتدادية، قارنها بصيغة الحد العام، وتدرّب على تمارين الكتاب.",
};

export default function SequencesPage() {
  return (
    <>
      <Header cta={false} />
      <SequencesLesson />
    </>
  );
}
