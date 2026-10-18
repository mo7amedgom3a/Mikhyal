import { Fragment } from "react";
import { Tex } from "./Tex";

// $$…$$ and \[…\] are display math; $…$ and \(…\) are inline. Non-greedy, never across a blank $.
const MATH = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;

export function hasMath(text: string): boolean {
  MATH.lastIndex = 0;
  return MATH.test(text);
}

/**
 * Renders Arabic (or any) text that embeds LaTeX. Math is always isolated left-to-right
 * so equations keep their order inside right-to-left sentences.
 */
export function MathText({ children, className }: { children: string; className?: string }) {
  const parts = children.split(MATH);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        if (part.startsWith("$$")) return <Tex key={i} block className="my-2">{part.slice(2, -2)}</Tex>;
        if (part.startsWith("\\[")) return <Tex key={i} block className="my-2">{part.slice(2, -2)}</Tex>;
        if (part.startsWith("\\(")) return <Tex key={i}>{part.slice(2, -2)}</Tex>;
        return <Tex key={i}>{part.slice(1, -1)}</Tex>;
      })}
    </span>
  );
}
