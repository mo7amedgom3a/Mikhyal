import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MissionPlayer } from "@/components/lesson/MissionPlayer";
import { catalog } from "@/lib/server/services/content";

// Server components read through the same services as the API (no self-HTTP at build time).
const missionBySlug = (slug: string) => catalog({ type: "mission", limit: 200 }).find((m) => m.slug === slug);

export function generateStaticParams() {
  return catalog({ type: "mission", limit: 200 }).map((m) => ({ missionId: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ missionId: string }> }): Promise<Metadata> {
  const { missionId } = await params;
  const m = missionBySlug(missionId);
  return { title: m ? `${m.title} — مِخيال` : "مِخيال" };
}

export default async function MissionPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  if (!missionBySlug(missionId)) notFound();
  return <MissionPlayer key={missionId} missionId={missionId} />;
}
