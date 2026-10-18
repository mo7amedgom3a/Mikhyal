"use client";

export function NumericInput({ value, onChange, onSubmit, placeholder, disabled }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string; disabled?: boolean }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex gap-2"
    >
      <input
        dir="ltr"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="الإجابة مع الوحدة"
        className="min-h-12 flex-1 rounded-[14px] border-2 border-line-strong bg-surface px-4 font-latin text-lg text-ink placeholder:text-ink-3 focus:border-primary"
      />
      <button type="submit" disabled={disabled || !value.trim()} className="btn btn-primary">
        تحقّق
      </button>
    </form>
  );
}
