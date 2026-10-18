import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SANDBOXES, getSandbox } from "@/lib/sandbox";
import { SandboxPlayer } from "@/components/sandbox/SandboxPlayer";

export function generateStaticParams() {
  return SANDBOXES.map((s) => ({ sandbox: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ sandbox: string }> }): Promise<Metadata> {
  const { sandbox } = await params;
  const s = getSandbox(sandbox);
  return { title: s ? `${s.title} — ملعب التجارب — مِخيال` : "مِخيال" };
}

export default async function SandboxPage({ params }: { params: Promise<{ sandbox: string }> }) {
  const { sandbox } = await params;
  if (!getSandbox(sandbox)) notFound();
  return <SandboxPlayer id={sandbox} />;
}
