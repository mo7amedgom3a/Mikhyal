// Copies MathLive's fonts into public/ so the math editor works offline and without a CDN.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = `${root}node_modules/mathlive/fonts`;
const dest = `${root}public/mathlive/fonts`;
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log("mathlive fonts → public/mathlive/fonts");
}
