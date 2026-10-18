import katex from "katex";

/** KaTeX math, always isolated left-to-right inside RTL text. */
export function Tex({ children, block = false, className = "" }: { children: string; block?: boolean; className?: string }) {
  const html = katex.renderToString(children, { displayMode: block, throwOnError: false, strict: false });
  const Tag = block ? "div" : "span";
  return <Tag dir="ltr" className={`ltr ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
