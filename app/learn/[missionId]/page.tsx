import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MISSIONS, getMission } from "@/lib/missions";
import { MissionPlayer } from "@/components/lesson/MissionPlayer";

export function generateStaticParams() {
  return MISSIONS.map((m) => ({ missionId: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ missionId: string }> }): Promise<Metadata> {
  const { missionId } = await params;
  const m = getMission(missionId);
  return { title: m ? `${m.title} — مِخيال` : "مِخيال" };
}

export default async function MissionPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  if (!getMission(missionId)) notFound();
  return <MissionPlayer key={missionId} missionId={missionId} />;
}
