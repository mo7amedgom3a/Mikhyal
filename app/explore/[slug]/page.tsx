import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { ExploreLesson } from "@/components/ai/ExploreLesson";

export const metadata: Metadata = { title: "استكشف — مِخيال" };

export default async function ExplorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <Header cta={false} />
      <main className="mx-auto max-w-[1100px] px-4 py-8">
        <ExploreLesson slug={slug} />
      </main>
    </>
  );
}
