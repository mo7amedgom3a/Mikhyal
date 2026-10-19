import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { PhenomenonView } from "@/components/phenomena/PhenomenonView";
import { getPhenomenon, PHENOMENA } from "@/lib/phenomena";

export function generateStaticParams() {
  return PHENOMENA.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = getPhenomenon((await params).id);
  return { title: p ? `${p.title} — مِخيال` : "الظواهر — مِخيال" };
}

export default async function PhenomenonPage({ params }: { params: Promise<{ id: string }> }) {
  const m = getPhenomenon((await params).id);
  if (!m) notFound();
  return (
    <>
      <Header cta={false} />
      <PhenomenonView module={m} />
    </>
  );
}
