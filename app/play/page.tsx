import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { PlaygroundIndex } from "@/components/sandbox/PlaygroundIndex";

export const metadata: Metadata = { title: "ملعب التجارب — مِخيال" };

export default function PlayPage() {
  return (
    <>
      <Header cta={false} />
      <PlaygroundIndex />
    </>
  );
}
