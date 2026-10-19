import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { PipelineShowcase } from "@/components/workbench/PipelineShowcase";

export const metadata: Metadata = { title: "خط التحقق — المختبر الرياضي" };

export default function PipelinePage() {
  return (
    <>
      <Header cta={false} />
      <PipelineShowcase />
    </>
  );
}
