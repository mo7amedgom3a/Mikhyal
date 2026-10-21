import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { TeacherDashboardPage } from "@/components/teach/TeacherDashboard";

export const metadata: Metadata = { title: "لوحة المدرّس — مِخيال" };

export default function TeachPage() {
  return (
    <>
      <Header cta={false} />
      <TeacherDashboardPage />
    </>
  );
}
