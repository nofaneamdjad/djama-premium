/**
 * strip-comments.mjs
 * Supprime tous les commentaires TSX/TS du dossier client DJAMA.
 * Usage : node scripts/strip-comments.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOTS = [
  "src/app/client",
  "src/components/client",
  "src/hooks",
  "src/lib/schemas",
];

/**
 * Retire les commentaires d'un fichier TSX/TS en respectant le contenu des strings.
 * Traite :
 *   - Commentaires JSX   {\/\* ... \*\/}
 *   - Commentaires bloc  \/\* ... \*\/
 *   - Commentaires ligne // ... (standalone ou trailing)
 *
 * Préserve :
 *   - Le contenu des strings " ' `
 *   - Les URLs dans les attributs ("https://...")
 *   - La directive "use client"
 */
function stripComments(src) {
  const len = src.length;
  let out = "";
  let i = 0;

  while (i < len) {
    // ── Strings double-quote ──────────────────────────
    if (src[i] === '"') {
      const start = i++;
      while (i < len && src[i] !== '"') {
        if (src[i] === "\\") i++; // skip escaped char
        i++;
      }
      i++; // closing "
      out += src.slice(start, i);
      continue;
    }

    // ── Strings single-quote ──────────────────────────
    if (src[i] === "'") {
      const start = i++;
      while (i < len && src[i] !== "'") {
        if (src[i] === "\\") i++;
        i++;
      }
      i++;
      out += src.slice(start, i);
      continue;
    }

    // ── Template literals ─────────────────────────────
    if (src[i] === "`") {
      const start = i++;
      while (i < len && src[i] !== "`") {
        if (src[i] === "\\") i++;
        i++;
      }
      i++;
      out += src.slice(start, i);
      continue;
    }

    // ── JSX comment  {/* ... */} ──────────────────────
    if (src[i] === "{" && src[i + 1] === "/" && src[i + 2] === "*") {
      // Skip until */}
      i += 3;
      while (i < len) {
        if (src[i] === "*" && src[i + 1] === "/" && src[i + 2] === "}") {
          i += 3;
          break;
        }
        i++;
      }
      // Eat the newline that follows if the whole line was a comment
      if (src[i] === "\n") i++;
      continue;
    }

    // ── Block comment  /* ... */ ──────────────────────
    if (src[i] === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < len) {
        if (src[i] === "*" && src[i + 1] === "/") {
          i += 2;
          break;
        }
        i++;
      }
      // Eat the newline if the line is now empty
      if (src[i] === "\n") i++;
      continue;
    }

    // ── Line comment  // ... ──────────────────────────
    if (src[i] === "/" && src[i + 1] === "/") {
      // Skip to end of line
      while (i < len && src[i] !== "\n") i++;
      // Eat newline if previous char was also a newline (avoid blank line)
      // We keep the newline so we don't join lines together
      continue;
    }

    out += src[i++];
  }

  // ── Post-process: collapse 3+ blank lines → 1 blank line ─
  out = out.replace(/\n{3,}/g, "\n\n");

  // ── Remove lines containing only whitespace ───────────────
  out = out.replace(/^[^\S\n]+$/gm, "");

  // ── Remove trailing whitespace per line ───────────────────
  out = out.replace(/[ \t]+$/gm, "");

  return out;
}

// ── Walk directories ──────────────────────────────────────────────────────────
function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if ([".tsx", ".ts"].includes(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

// ── Main ──────────────────────────────────────────────────────────────────────
let total = 0;
let changed = 0;

for (const root of ROOTS) {
  let files;
  try {
    files = walk(root);
  } catch {
    continue;
  }

  for (const file of files) {
    const original = readFileSync(file, "utf8");
    const stripped = stripComments(original);
    total++;

    if (stripped !== original) {
      writeFileSync(file, stripped, "utf8");
      changed++;
      console.log(`✓  ${file.replace(process.cwd() + "/", "")}`);
    }
  }
}

console.log(`\n${changed}/${total} fichiers modifiés.`);
