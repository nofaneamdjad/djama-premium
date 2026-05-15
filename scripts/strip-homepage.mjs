import { readFileSync, writeFileSync } from "fs";

function stripComments(src) {
  const len = src.length;
  let out = "";
  let i = 0;

  while (i < len) {
    if (src[i] === '"') {
      const start = i++;
      while (i < len && src[i] !== '"') { if (src[i] === "\\") i++; i++; }
      i++;
      out += src.slice(start, i);
      continue;
    }
    if (src[i] === "'") {
      const start = i++;
      while (i < len && src[i] !== "'") { if (src[i] === "\\") i++; i++; }
      i++;
      out += src.slice(start, i);
      continue;
    }
    if (src[i] === "`") {
      const start = i++;
      while (i < len && src[i] !== "`") { if (src[i] === "\\") i++; i++; }
      i++;
      out += src.slice(start, i);
      continue;
    }
    if (src[i] === "{" && src[i+1] === "/" && src[i+2] === "*") {
      i += 3;
      while (i < len) { if (src[i] === "*" && src[i+1] === "/" && src[i+2] === "}") { i += 3; break; } i++; }
      if (src[i] === "\n") i++;
      continue;
    }
    if (src[i] === "/" && src[i+1] === "*") {
      i += 2;
      while (i < len) { if (src[i] === "*" && src[i+1] === "/") { i += 2; break; } i++; }
      if (src[i] === "\n") i++;
      continue;
    }
    if (src[i] === "/" && src[i+1] === "/") {
      while (i < len && src[i] !== "\n") i++;
      continue;
    }
    out += src[i++];
  }

  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/^[^\S\n]+$/gm, "");
  out = out.replace(/[ \t]+$/gm, "");
  return out;
}

const file = "src/app/page.tsx";
const original = readFileSync(file, "utf8");
const stripped = stripComments(original);
if (stripped !== original) {
  writeFileSync(file, stripped, "utf8");
  console.log("✓  src/app/page.tsx modifié");
} else {
  console.log("—  src/app/page.tsx : rien à supprimer");
}
