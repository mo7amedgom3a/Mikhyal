import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { TeacherDashboard } from "@/components/teach/TeacherDashboard";
import { buildClassReport } from "@/lib/mock/classroom";

export const metadata: Metadata = { title: "لوحة المدرّس — مِخيال" };

export default function TeachPage() {
  // Built once at build time: mock students run through the real validator.
  const report = buildClassReport();
  return (
    <>
      <Header cta={false} />
      <TeacherDashboard report={report} />
    </>
  );
}
