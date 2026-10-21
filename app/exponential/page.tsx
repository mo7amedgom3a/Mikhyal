import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { ExponentialLesson } from "@/components/exponential/ExponentialLesson";

export const metadata: Metadata = {
  title: "الدوال الأسية واللوغاريتمية — مِخيال",
  description: "درس تفاعلي: خصائص الدوال الأسية، النمو والاضمحلال في البكتيريا والسكان والسيارات، اللوغاريتم ومقياسا ريختر والديسيبل.",
};

export default function ExponentialPage() {
  return (
    <>
      <Header cta={false} />
      <ExponentialLesson />
    </>
  );
}
