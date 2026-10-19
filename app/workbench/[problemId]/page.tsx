import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { Workbench } from "@/components/workbench/Workbench";
import { getWorkbenchProblem, WORKBENCH_PROBLEMS } from "@/lib/workbench/problems";

export function generateStaticParams() {
  return WORKBENCH_PROBLEMS.map((p) => ({ problemId: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ problemId: string }> }): Promise<Metadata> {
  const p = getWorkbenchProblem((await params).problemId);
  return { title: p ? `${p.title} — المختبر الرياضي` : "المختبر الرياضي" };
}

export default async function WorkbenchPage({ params }: { params: Promise<{ problemId: string }> }) {
  const problem = getWorkbenchProblem((await params).problemId);
  if (!problem) notFound();
  return (
    <>
      <Header cta={false} />
      <Workbench problem={problem} />
    </>
  );
}
