import katex from "katex";

/** Shared macros so content authors and the tutor can use short, curriculum-style notation. */
const MACROS = {
  "\\unit": "\\,\\mathrm{#1}",
  "\\degree": "^{\\circ}",
  "\\vect": "\\vec{#1}",
};

/** KaTeX math, always isolated left-to-right inside RTL text. Rendered as a span so it is valid inside paragraphs. */
export function Tex({ children, block = false, className = "" }: { children: string; block?: boolean; className?: string }) {
  const html = katex.renderToString(children, { displayMode: block, throwOnError: false, strict: false, macros: { ...MACROS } });
  return <span dir="ltr" className={`ltr ${block ? "block overflow-x-auto overflow-y-hidden" : ""} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
