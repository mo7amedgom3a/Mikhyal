import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { LearningPath } from "@/components/lesson/LearningPath";

export const metadata: Metadata = { title: "مسار التعلم — مِخيال" };

export default function LearnPage() {
  return (
    <>
      <Header cta={false} />
      <LearningPath />
    </>
  );
}
