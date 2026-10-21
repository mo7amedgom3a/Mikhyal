import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { AiStudio } from "@/components/ai/AiStudio";

export const metadata: Metadata = { title: "استوديو الذكاء الاصطناعي — مِخيال" };

export default function AiStudioPage() {
  return (
    <>
      <Header cta={false} />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <AiStudio />
      </main>
    </>
  );
}
