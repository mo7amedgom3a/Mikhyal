import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { ParentReport } from "@/components/parents/ParentReport";

export const metadata: Metadata = { title: "تقرير ولي الأمر — مِخيال" };

export default function ParentsPage() {
  return (
    <>
      <Header cta={false} />
      <ParentReport />
    </>
  );
}
