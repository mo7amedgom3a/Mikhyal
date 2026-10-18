"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { MathfieldElement } from "mathlive";

export interface MathFieldHandle {
  insert: (latex: string) => void;
  focus: () => void;
  toggleKeyboard: () => void;
}

/**
 * Visual LaTeX editor (MathLive). Fractions, roots, powers, subscripts and Greek letters are
 * typed or inserted in place; the value is LaTeX. Loaded lazily so the rest of the page stays light.
 */
export const MathField = forwardRef<
  MathFieldHandle,
  { value: string; onChange: (latex: string) => void; onSubmit: () => void; ariaLabel: string; onUnavailable?: () => void }
>(function MathField({ value, onChange, onSubmit, ariaLabel, onUnavailable }, ref) {
  const el = useRef<MathfieldElement>(null);
  const [ready, setReady] = useState(false);
  const handlers = useRef({ onChange, onSubmit });
  useEffect(() => {
    handlers.current = { onChange, onSubmit };
  }, [onChange, onSubmit]);

  useEffect(() => {
    let alive = true;
    import("mathlive")
      .then(({ MathfieldElement }) => {
        MathfieldElement.fontsDirectory = "/mathlive/fonts";
        MathfieldElement.soundsDirectory = null;
        if (alive) setReady(true);
      })
      .catch(() => onUnavailable?.());
    return () => {
      alive = false;
    };
  }, [onUnavailable]);

  useEffect(() => {
    const mf = el.current;
    if (!ready || !mf) return;
    mf.mathVirtualKeyboardPolicy = "manual";
    mf.smartFence = true;
    mf.smartSuperscript = true;
    const onInput = () => handlers.current.onChange(mf.value);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handlers.current.onSubmit();
      }
    };
    mf.addEventListener("input", onInput);
    mf.addEventListener("keydown", onKey, { capture: true });
    return () => {
      mf.removeEventListener("input", onInput);
      mf.removeEventListener("keydown", onKey, { capture: true });
    };
  }, [ready]);

  // Keep the field in sync when the value changes from outside (mode switch, reset).
  useEffect(() => {
    const mf = el.current;
    if (ready && mf && mf.value !== value) mf.setValue(value, { silenceNotifications: true });
  }, [ready, value]);

  useImperativeHandle(ref, () => ({
    insert: (latex) => {
      const mf = el.current;
      if (!mf) return;
      mf.insert(latex, { selectionMode: "placeholder", focus: true });
      handlers.current.onChange(mf.value);
    },
    focus: () => el.current?.focus(),
    toggleKeyboard: () => {
      el.current?.focus();
      const kb = window.mathVirtualKeyboard;
      if (!kb) return;
      if (kb.visible) kb.hide();
      else kb.show();
    },
  }));

  if (!ready) {
    return <div className="min-h-14 animate-pulse rounded-[14px] border-2 border-input bg-muted" aria-hidden />;
  }
  return (
    <math-field
      ref={el}
      dir="ltr"
      aria-label={ariaLabel}
      className="block min-h-14 w-full rounded-[14px] border-2 border-input bg-surface px-3 py-2 text-[22px] text-ink outline-none transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30"
    />
  );
});
