"use client";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NumericInput({ value, onChange, onSubmit, placeholder, disabled }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string; disabled?: boolean }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex gap-2"
    >
      <Input dir="ltr" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label="الإجابة مع الوحدة" className="font-latin text-lg" />
      <Button type="submit" disabled={disabled || !value.trim()}>
        <Check />
        تحقّق
      </Button>
    </form>
  );
}
