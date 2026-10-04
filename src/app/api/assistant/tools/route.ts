/**
 * POST /api/assistant/tools — DJAMA AI Tool Executor
 *
 * Reçoit un message + contexte DJAMA, route vers le bon outil,
 * exécute l'outil et retourne soit une réponse textuelle, soit un artefact.
 *
 * Phase 1 — outils implémentés :
 *   • create_document → génère un DOCX via Anthropic + docx library
 *   • chat  (fallback) → répond en texte via l'IA
 *
 * Sécurité :
 *   - Auth obligatoire
 *   - Rate limiting 20 req/h
 *   - Les fichiers uploadés sont traités comme données, jamais instructions système
 *   - Les clés providers restent côté serveur uniquement
 *   - Contenu LLM validé avant construction du fichier
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { routeIntent } from "@/lib/ai/intent-router";
import { getToolByName, type ArtifactData, type ToolName } from "@/lib/ai/tool-registry";
import { jsonrepair } from "jsonrepair";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import PptxGenJS from "pptxgenjs";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  TableRow, TableCell, Table, WidthType, BorderStyle,
  ShadingType, convertInchesToTwip, Footer, Header, PageNumber,
} from "docx";

export const runtime    = "nodejs";
export const dynamic    = "force-dynamic";
export const maxDuration = 60;

const DJAMA_GOLD         = "c9a55a";
const DJAMA_GOLD_HEADING = "8a6a28";

const THEME_COLORS: Record<string, { accent: string; heading: string }> = {
  professional: { accent: "1e40af", heading: "1e3a5f" },
  modern:       { accent: DJAMA_GOLD, heading: DJAMA_GOLD_HEADING },
  minimal:      { accent: "374151", heading: "111827" },
};

/* ── Auth ─────────────────────────────────────────────────────────────── */
async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  return (await sb.auth.getUser()).data.user;
}

/* ── Ensure djama-artifacts bucket exists (idempotent) ──────────────── */
async function ensureBucket() {
  const admin = createSupabaseAdmin();
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.find(b => b.name === "djama-artifacts")) {
    await admin.storage.createBucket("djama-artifacts", {
      public:           false,
      fileSizeLimit:    52428800, // 50 MB
      allowedMimeTypes: [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/pdf",
        "image/png", "image/jpeg", "image/webp",
        "text/csv", "text/plain",
      ],
    });
  }
}

/* ── Parse markdown inline (** gras **, * italique *) → TextRuns ─────── */
function parseInlineMarkdown(raw: string, baseColor?: string): TextRun[] {
  // Nettoie l'encodage HTML résiduel
  const text = raw
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  const runs: TextRun[] = [];
  // Pattern: **gras**, *italique*, ***gras+italique***
  const RE = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match: RegExpExecArray | null;
  while ((match = RE.exec(text)) !== null) {
    if (match[2]) {
      runs.push(new TextRun({ text: match[2], bold: true, italics: true, color: baseColor }));
    } else if (match[3]) {
      runs.push(new TextRun({ text: match[3], bold: true, color: baseColor }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4], italics: true, color: baseColor }));
    } else if (match[5]) {
      runs.push(new TextRun({ text: match[5], color: baseColor }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text, color: baseColor })];
}

/* ── DOCX element renderers ──────────────────────────────────────────── */
type DocxBlock = Paragraph | Table;

function elToDocx(el: Record<string, unknown>, colors: { accent: string; heading: string }): DocxBlock[] {
  switch (el.type as string) {
    case "heading": {
      const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
      const lvl = (el.level as number) ?? 1;
      const headColor = lvl <= 2 ? colors.heading : undefined;
      return [new Paragraph({
        children: parseInlineMarkdown(String(el.text ?? ""), headColor).map(r =>
          new TextRun({ ...r, bold: true })
        ),
        heading: levels[lvl - 1] ?? HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
        spacing: { before: 280, after: 120 },
      })];
    }
    case "paragraph": {
      const runs = parseInlineMarkdown(String(el.text ?? ""));
      if (el.bold) runs.forEach(r => Object.assign(r, { bold: true }));
      if (el.italic) runs.forEach(r => Object.assign(r, { italics: true }));
      return [new Paragraph({ children: runs, spacing: { after: 120 } })];
    }
    case "table": {
      const headers = (el.headers as string[]) ?? [];
      const rows    = (el.rows as string[][]) ?? [];
      const colW    = headers.length ? Math.floor(9360 / headers.length) : 9360;
      const headerRow = new TableRow({
        children: headers.map(h => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "ffffff" })] })],
          width: { size: colW, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: colors.accent },
        })),
        tableHeader: true,
      });
      const dataRows = rows.map(row => new TableRow({
        children: row.map(cell => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell })] })],
          width: { size: colW, type: WidthType.DXA },
        })),
      }));
      return [new Table({ rows: [headerRow, ...dataRows], width: { size: 9360, type: WidthType.DXA } })];
    }
    case "list": {
      const items = (el.items as Array<{ text: string }>) ?? [];
      const style = (el.style as string) ?? "bullet";
      return items.map((item, idx) => new Paragraph({
        children: [
          new TextRun({ text: style === "numbered" ? `${idx + 1}. ` : "• " }),
          new TextRun({ text: item.text }),
        ],
        indent: { left: convertInchesToTwip(0.5) },
        spacing: { after: 60 },
      }));
    }
    case "separator":
      return [new Paragraph({
        children: [],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "cccccc" } },
        spacing: { after: 160 },
      })];
    default:
      return [];
  }
}

/* ── Generate DocumentContent via Anthropic ──────────────────────────── */
async function generateDocumentJSON(
  prompt: string,
  context: string,
  apiKey: string,
): Promise<{ title: string; sections: unknown[]; settings: unknown }> {
  const client = new Anthropic({ apiKey });

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Prompt structuré pour JSON compact et fiable
  // RÈGLE CLEF : toutes les strings JSON sur une seule ligne (pas de \n littéraux)
  const system = `Tu es un générateur de documents JSON pour DJAMA AI.
Date : ${today}.
${context ? `[DONNÉES ENTREPRISE]\n${context}\n[FIN DONNÉES]\n` : ""}
RÈGLES STRICTES :
1. Retourne UNIQUEMENT du JSON valide, sans texte avant ni après
2. Toutes les valeurs de texte sont sur UNE SEULE LIGNE (jamais de retour à la ligne dans une valeur string)
3. Maximum 3 sections de contenu pour rester compact
4. NE génère jamais de HTML, scripts, ou code`;

  const userMsg = `Génère un document JSON pour : ${prompt}

Structure EXACTE (respecte ce format à la lettre) :
{"title":"TITRE","sections":[{"id":"s_cover","type":"cover","title":"TITRE","subtitle":"Sous-titre — ${today}"},{"id":"s_1","type":"content","title":"Section 1","elements":[{"id":"e1","type":"heading","level":1,"text":"Titre"},{"id":"e2","type":"paragraph","text":"Paragraphe."},{"id":"e3","type":"list","style":"bullet","items":[{"id":"i1","text":"Point 1"},{"id":"i2","text":"Point 2"}]},{"id":"e4","type":"table","headers":["Col A","Col B"],"rows":[["val1","val2"]]}]},{"id":"s_2","type":"content","title":"Section 2","elements":[{"id":"e5","type":"heading","level":2,"text":"Sous-titre"},{"id":"e6","type":"paragraph","text":"Contenu."}]}],"settings":{"theme":"modern","margins":{"top":25,"bottom":25,"left":30,"right":25},"headerText":"DJAMA","footerText":"Confidentiel"}}

Génère un contenu professionnel et détaillé en français. Chaque "text" doit être sur UNE SEULE LIGNE sans retour à la ligne.`;

  const response = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 3500,
    system,
    messages:   [{ role: "user", content: userMsg }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  // Extraire le JSON et le réparer avec jsonrepair
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Le modèle n'a pas retourné de JSON");

  let repaired: string;
  try {
    repaired = jsonrepair(jsonMatch[0]);
  } catch {
    throw new Error("JSON irrécupérable du modèle");
  }

  const parsed = JSON.parse(repaired) as { title: string; sections: unknown[]; settings: unknown };
  if (!parsed.title || !Array.isArray(parsed.sections)) {
    throw new Error("Structure JSON invalide après réparation");
  }
  return parsed;
}

/* ── Convert DocumentContent JSON → DOCX Buffer ─────────────────────── */
async function buildDocxBuffer(docData: { title: string; sections: unknown[]; settings: Record<string, unknown> }): Promise<Buffer> {
  const theme = (docData.settings?.theme as string) ?? "modern";
  const colors = THEME_COLORS[theme] ?? THEME_COLORS.modern;
  const margins = (docData.settings?.margins as Record<string, number>) ?? { top: 25, bottom: 25, left: 30, right: 25 };
  const mmToTwip = (mm: number) => Math.round(mm * 56.7);

  const allChildren: DocxBlock[] = [];

  for (const section of docData.sections as Array<Record<string, unknown>>) {
    if (section.type === "cover") {
      allChildren.push(new Paragraph({
        children: [new TextRun({ text: String(section.title ?? ""), bold: true, size: 56, color: colors.heading })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 400 },
      }));
      if (section.subtitle) {
        allChildren.push(new Paragraph({
          children: [new TextRun({ text: String(section.subtitle), size: 28, color: "6b7280" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        }));
      }
      allChildren.push(new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }));
    } else {
      if (section.title) {
        allChildren.push(new Paragraph({
          children: [new TextRun({ text: String(section.title), bold: true, size: 36, color: colors.heading })],
          heading: HeadingLevel.HEADING_1,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: colors.accent } },
          spacing: { before: 400, after: 200 },
        }));
      }
      for (const el of (section.elements as Array<Record<string, unknown>>) ?? []) {
        allChildren.push(...elToDocx(el, colors));
      }
    }
  }

  const headerText = String(docData.settings?.headerText ?? "DJAMA");
  const footerText = String(docData.settings?.footerText ?? "");

  const doc = new Document({
    creator:     "DJAMA AI",
    title:       docData.title,
    description: "Généré par DJAMA AI",
    sections: [{
      properties: {
        page: {
          margin: {
            top:    mmToTwip(margins.top),
            bottom: mmToTwip(margins.bottom),
            left:   mmToTwip(margins.left),
            right:  mmToTwip(margins.right),
          },
        },
      },
      headers: headerText ? {
        default: new Header({
          children: [new Paragraph({
            children: [new TextRun({ text: headerText, italics: true, color: "9ca3af", size: 18 })],
            alignment: AlignmentType.LEFT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" } },
          })],
        }),
      } : undefined,
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              ...(footerText ? [new TextRun({ text: `${footerText}   `, italics: true, color: "9ca3af", size: 16 })] : []),
              new TextRun({ children: ["Page ", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], color: "9ca3af", size: 16 }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" } },
          })],
        }),
      },
      children: allChildren.length ? allChildren : [new Paragraph({ children: [] })],
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

/* ── Execute create_document ─────────────────────────────────────────── */
async function executeCreateDocument(
  prompt: string,
  context: string,
  userId: string,
  convId: string | null,
  apiKey: string,
): Promise<ArtifactData> {
  const admin = createSupabaseAdmin();
  await ensureBucket();

  // 1. Génération du contenu par l'IA
  const docData = await generateDocumentJSON(prompt, context, apiKey);
  const settings = docData.settings as Record<string, unknown>;

  // 2. Construction du DOCX
  const buffer = await buildDocxBuffer({ ...docData, settings });

  // 3. Chemin stable dans Storage (userId/artifactId/filename)
  const artifactId  = crypto.randomUUID();
  const safeTitle   = docData.title.replace(/[^a-zA-Z0-9\-_\s]/g, "").trim().slice(0, 60) || "document";
  const fileName    = `${safeTitle}.docx`;
  const storagePath = `${userId}/${artifactId}/${fileName}`;

  // 4. Upload dans djama-artifacts
  const { error: uploadErr } = await admin.storage
    .from("djama-artifacts")
    .upload(storagePath, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: false,
    });
  if (uploadErr) throw new Error(`Upload Storage échoué : ${uploadErr.message}`);

  // 5. URL signée (1 heure)
  const { data: signed } = await admin.storage
    .from("djama-artifacts")
    .createSignedUrl(storagePath, 3600);
  const downloadUrl = signed?.signedUrl ?? "";

  // 6. Insertion en DB (optionnel — table peut ne pas exister encore)
  const admin2 = createSupabaseAdmin();
  await admin2
    .from("artifact_files")
    .insert({
      id:             artifactId,
      user_id:        userId,
      conversation_id: convId ?? undefined,
      artifact_type:  "docx",
      title:          docData.title,
      storage_bucket: "djama-artifacts",
      storage_path:   storagePath,
      file_name:      fileName,
      file_size:      buffer.length,
      mime_type:      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      metadata:       { sections: (docData.sections as unknown[]).length, theme: settings?.theme ?? "modern" },
    })
    .then(({ error: e }) => { if (e) console.warn("[tools/create_document] DB insert skipped:", e.message); });

  return {
    id:           artifactId,
    type:         "docx",
    title:        docData.title,
    file_name:    fileName,
    file_size:    buffer.length,
    mime_type:    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    download_url: downloadUrl,
    storage_bucket: "djama-artifacts",
    storage_path:  storagePath,
    metadata:     { sections: (docData.sections as unknown[]).length },
  };
}

/* ── Generate spreadsheet JSON from LLM ─────────────────────────────── */
async function generateSpreadsheetJSON(
  prompt: string,
  context: string,
  apiKey: string,
): Promise<{
  title: string;
  sheets: Array<{
    name: string;
    headers: Array<{ label: string; width?: number }>;
    rows: Array<Record<string, string | number | null>>;
    totals?: Record<string, string>;
  }>;
}> {
  const client = new Anthropic({ apiKey });
  const instruction = `Tu es un expert Excel. Génère un classeur financier en JSON strict.

DEMANDE: ${prompt}

RÈGLES ABSOLUES:
1. Retourne UNIQUEMENT du JSON valide, sans balises markdown, sans texte avant/après
2. Toutes les clés des lignes sont en snake_case ASCII sans accents (ex: "depenses", "resultat", "tresorerie")
3. Les colonnes "ca" et "depenses" ont des nombres réels pour chaque ligne (JAMAIS null)
4. Les colonnes "resultat", "marge", "tresorerie" ont null dans les lignes (calculées par formules Excel)
5. Les totals incluent TOUTES les colonnes avec des formules Excel commençant par "="
6. Max 15 lignes, noms de feuilles ≤20 chars

JSON EXACT À PRODUIRE (prends ce modèle et adapte avec des valeurs réalistes):
{
  "title": "Prévisionnel Financier 12 Mois",
  "sheets": [
    {
      "name": "Previsionnel",
      "headers": [
        {"label": "Mois", "width": 18},
        {"label": "CA (€)", "width": 14},
        {"label": "Depenses (€)", "width": 15},
        {"label": "Resultat (€)", "width": 14},
        {"label": "Marge (%)", "width": 12},
        {"label": "Tresorerie (€)", "width": 16}
      ],
      "rows": [
        {"mois": "Janvier", "ca": 15000, "depenses": 9200, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Fevrier", "ca": 16500, "depenses": 9800, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Mars", "ca": 18200, "depenses": 10500, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Avril", "ca": 17800, "depenses": 10200, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Mai", "ca": 19500, "depenses": 11000, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Juin", "ca": 21000, "depenses": 12500, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Juillet", "ca": 20500, "depenses": 12000, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Aout", "ca": 19800, "depenses": 11500, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Septembre", "ca": 22000, "depenses": 13000, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Octobre", "ca": 23500, "depenses": 14000, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Novembre", "ca": 24200, "depenses": 14500, "resultat": null, "marge": null, "tresorerie": null},
        {"mois": "Decembre", "ca": 25500, "depenses": 15200, "resultat": null, "marge": null, "tresorerie": null}
      ],
      "totals": {
        "mois": "TOTAL",
        "ca": "=SUM(B2:B13)",
        "depenses": "=SUM(C2:C13)",
        "resultat": "=SUM(D2:D13)",
        "marge": "=D14/B14",
        "tresorerie": "=F13"
      }
    }
  ]
}

IMPORTANT: adapte les valeurs "ca" et "depenses" selon la demande, mais garde EXACTEMENT cette structure.`;

  const resp = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [{ role: "user", content: instruction }],
  });
  const raw = resp.content[0].type === "text" ? resp.content[0].text : "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Pas de JSON valide dans la réponse LLM");
  const repaired = jsonrepair(jsonMatch[0]);
  return JSON.parse(repaired);
}

/* ── Build XLSX buffer deterministically ─────────────────────────────── */
async function buildXlsxBuffer(sheetData: {
  title: string;
  sheets: Array<{
    name: string;
    headers: Array<{ label: string; width?: number }>;
    rows: Array<Record<string, string | number | null>>;
    totals?: Record<string, string>;
  }>;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DJAMA AI";
  wb.created = new Date();

  const GOLD        = "C9A55A";
  const GOLD_LIGHT  = "F5EDD6";
  const DARK_TEXT   = "1A1A2E";
  const HEADER_BG   = "16213E";
  const ALT_ROW     = "F8F6F0";
  const TOTAL_BG    = "E8E0CC";

  for (const sheet of sheetData.sheets) {
    const ws = wb.addWorksheet(sheet.name, {
      pageSetup: { fitToPage: true, fitToWidth: 1 },
    });

    // Derive snake_case keys: strip accents, special chars → match LLM-generated keys
    const keys = sheet.headers.map((h) =>
      h.label.toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")   // strip diacritics: é→e, è→e…
        .replace(/[\s(€%)]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
    );

    // Detect column types from header labels
    const isCurrency = (key: string) => /ca|depense|resultat|tresorerie|revenu|charge|benefice|montant/i.test(key);
    const isPercent  = (key: string) => /marge|taux|pct|percent/i.test(key);
    const isDate     = (key: string) => /mois|date|periode/i.test(key);

    // Set column widths
    ws.columns = sheet.headers.map((h, i) => ({
      key: keys[i],
      width: h.width ?? 14,
    }));

    // Header row (row 1)
    const headerRow = ws.addRow(sheet.headers.map(h => h.label));
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + HEADER_BG } };
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF" + GOLD } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
      cell.border = {
        bottom: { style: "medium", color: { argb: "FF" + GOLD } },
      };
    });

    // Data rows
    sheet.rows.forEach((rowData, rowIdx) => {
      const excelRow = ws.addRow([]);
      const dataRowNum = rowIdx + 2; // header is row 1

      keys.forEach((key, colIdx) => {
        const cell = excelRow.getCell(colIdx + 1);
        const rawVal = rowData[key];

        // Determine if this cell should have a formula
        if (rawVal === null || rawVal === undefined) {
          // Generate formulas for computed columns
          const colLetter = String.fromCharCode(65 + colIdx);
          const caCol   = keys.findIndex(k => /^ca/.test(k));
          const depCol  = keys.findIndex(k => /depense/.test(k));
          const resCol  = keys.findIndex(k => /resultat/.test(k));
          const margeCol = keys.findIndex(k => /marge/.test(k));
          const tresoCol = keys.findIndex(k => /tresorerie/.test(k));
          const caLetter  = caCol  >= 0 ? String.fromCharCode(65 + caCol)  : "B";
          const depLetter = depCol >= 0 ? String.fromCharCode(65 + depCol) : "C";
          const resLetter = resCol >= 0 ? String.fromCharCode(65 + resCol) : "D";

          if (colIdx === resCol && resCol >= 0) {
            cell.value = { formula: `${caLetter}${dataRowNum}-${depLetter}${dataRowNum}` };
          } else if (colIdx === margeCol && margeCol >= 0 && resCol >= 0) {
            cell.value = { formula: `IF(${caLetter}${dataRowNum}<>0,${resLetter}${dataRowNum}/${caLetter}${dataRowNum},0)` };
          } else if (colIdx === tresoCol && tresoCol >= 0 && resCol >= 0) {
            if (dataRowNum === 2) {
              cell.value = { formula: `${resLetter}${dataRowNum}` };
            } else {
              const prevTresoLetter = String.fromCharCode(65 + tresoCol);
              cell.value = { formula: `${prevTresoLetter}${dataRowNum - 1}+${resLetter}${dataRowNum}` };
            }
          }
        } else {
          cell.value = typeof rawVal === "number" ? rawVal : String(rawVal);
        }

        // Number formats
        if (typeof rawVal === "number" || rawVal === null) {
          if (isDate(key)) {
            // no special format for month names
          } else if (isPercent(key)) {
            cell.numFmt = "0.0%";
          } else if (isCurrency(key)) {
            cell.numFmt = '#,##0\\ "€"';
          }
        }

        // Alternating row colors
        if ((rowIdx + 1) % 2 === 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + ALT_ROW } };
        }
        cell.font = { name: "Calibri", size: 10, color: { argb: "FF" + DARK_TEXT } };
        cell.alignment = { vertical: "middle", horizontal: typeof rawVal === "number" || rawVal === null ? "right" : "left" };
      });
    });

    // Totals row
    if (sheet.totals) {
      const totalRow = ws.addRow([]);
      const totalRowNum = sheet.rows.length + 2;

      keys.forEach((key, colIdx) => {
        const cell = totalRow.getCell(colIdx + 1);
        const formula = sheet.totals?.[key];

        if (formula && formula.startsWith("=")) {
          cell.value = { formula: formula.slice(1) };
        } else if (formula) {
          cell.value = formula;
        }

        if (isPercent(key)) {
          cell.numFmt = "0.0%";
        } else if (isCurrency(key)) {
          cell.numFmt = '#,##0\\ "€"';
        }

        cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + TOTAL_BG } };
        cell.font  = { name: "Calibri", size: 10, bold: true, color: { argb: "FF" + DARK_TEXT } };
        cell.border = {
          top:    { style: "medium", color: { argb: "FF" + GOLD } },
          bottom: { style: "thin",   color: { argb: "FF" + GOLD } },
        };
        cell.alignment = { vertical: "middle", horizontal: colIdx === 0 ? "left" : "right" };
      });

      // Freeze header row
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
    }

    // Freeze header when no totals row
    if (!sheet.totals) {
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/* ── Execute create_spreadsheet ──────────────────────────────────────── */
async function executeCreateSpreadsheet(
  prompt: string,
  context: string,
  userId: string,
  convId: string | null,
  apiKey: string,
): Promise<ArtifactData> {
  const admin = createSupabaseAdmin();
  await ensureBucket();

  // 1. LLM génère la structure JSON
  const sheetData = await generateSpreadsheetJSON(prompt, context, apiKey);

  // 2. Moteur déterministe construit le classeur avec formules réelles
  const buffer = await buildXlsxBuffer(sheetData);

  // 3. Chemin stable dans Storage
  const artifactId  = crypto.randomUUID();
  const safeTitle   = sheetData.title.replace(/[^a-zA-Z0-9\-_\s]/g, "").trim().slice(0, 60) || "classeur";
  const fileName    = `${safeTitle}.xlsx`;
  const storagePath = `${userId}/${artifactId}/${fileName}`;

  // 4. Upload
  const { error: uploadErr } = await admin.storage
    .from("djama-artifacts")
    .upload(storagePath, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: false,
    });
  if (uploadErr) throw new Error(`Upload Storage échoué : ${uploadErr.message}`);

  // 5. URL signée
  const { data: signed } = await admin.storage.from("djama-artifacts").createSignedUrl(storagePath, 3600);
  const downloadUrl = signed?.signedUrl ?? "";

  // 6. DB insert (optionnel)
  await admin
    .from("artifact_files")
    .insert({
      id: artifactId, user_id: userId, conversation_id: convId ?? undefined,
      artifact_type: "xlsx", title: sheetData.title,
      storage_bucket: "djama-artifacts", storage_path: storagePath,
      file_name: fileName, file_size: buffer.length,
      mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      metadata: { sheets: sheetData.sheets.length },
    })
    .then(({ error: e }) => { if (e) console.warn("[tools/create_spreadsheet] DB insert skipped:", e.message); });

  const totalRows = sheetData.sheets.reduce((acc, s) => acc + s.rows.length, 0);

  return {
    id: artifactId, type: "xlsx", title: sheetData.title,
    file_name: fileName, file_size: buffer.length,
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    download_url: downloadUrl,
    storage_bucket: "djama-artifacts", storage_path: storagePath,
    metadata: { sheets: sheetData.sheets.length, rows: totalRows, chart_support: false },
  };
}

/* ── Generate PDF JSON from LLM ─────────────────────────────────────── */
async function generatePdfJSON(
  prompt: string,
  _context: string,
  apiKey: string,
): Promise<{
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  sections: Array<{
    type: "cover" | "heading1" | "heading2" | "paragraph" | "table" | "list" | "divider";
    content?: string;
    rows?: string[][];
    items?: string[];
  }>;
}> {
  const client = new Anthropic({ apiKey });
  const instruction = `Tu es un expert rédactionnel. Génère un rapport PDF professionnel structuré en JSON.

DEMANDE: ${prompt}

RÈGLES:
1. Retourne UNIQUEMENT du JSON valide, sans balises markdown
2. La structure doit avoir: title, subtitle, author, date, sections[]
3. Types de sections: "cover" (1 seule), "heading1", "heading2", "paragraph", "table", "list", "divider"
4. Un tableau (type "table") a "rows": [["En-tête1","En-tête2",...], ["val1","val2",...], ...]
5. Une liste (type "list") a "items": ["point 1", "point 2", ...]
6. Chaque section "content" est un texte concis mais substantiel
7. Minimum 6 sections après la cover, pour faire un document de plusieurs pages

EXEMPLE DE STRUCTURE:
{
  "title": "Rapport DJAMA 2027",
  "subtitle": "Analyse complète de l'écosystème digital",
  "author": "DJAMA AI",
  "date": "Octobre 2026",
  "sections": [
    {"type": "cover"},
    {"type": "heading1", "content": "Introduction"},
    {"type": "paragraph", "content": "Texte introductif détaillé..."},
    {"type": "heading1", "content": "Analyse du marché"},
    {"type": "paragraph", "content": "Le marché..."},
    {"type": "table", "rows": [["Indicateur","Valeur","Évolution"],["CA","50 000 €","+15%"],["Clients","127","+8%"]]},
    {"type": "heading2", "content": "Tendances"},
    {"type": "list", "items": ["Tendance 1","Tendance 2","Tendance 3"]},
    {"type": "divider"},
    {"type": "heading1", "content": "Conclusion"},
    {"type": "paragraph", "content": "En conclusion..."}
  ]
}

Génère un rapport complet et professionnel adapté à la demande.`;

  const resp = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [{ role: "user", content: instruction }],
  });
  const raw = resp.content[0].type === "text" ? resp.content[0].text : "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Pas de JSON valide dans la réponse LLM");
  return JSON.parse(jsonrepair(jsonMatch[0]));
}

/* ── Build PDF buffer with PDFKit ────────────────────────────────────── */
async function buildPdfBuffer(doc: {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  sections: Array<{
    type: string;
    content?: string;
    rows?: string[][];
    items?: string[];
  }>;
}): Promise<{ buffer: Buffer; pages: number }> {
  return new Promise((resolve, reject) => {
    const GOLD     = "#c9a55a";
    const DARK     = "#16213e";
    const DARKTEXT = "#1a1a2e";
    const MUTED    = "#6b7280";
    const WHITE    = "#ffffff";
    const LIGHT    = "#f8f6f0";

    const pdf = new PDFDocument({
      size:    "A4",
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
      info: {
        Title:   doc.title,
        Author:  doc.author ?? "DJAMA AI",
        Subject: doc.subtitle ?? "",
        Creator: "DJAMA AI",
      },
    });

    const chunks: Buffer[] = [];
    pdf.on("data",  (c: Buffer) => chunks.push(c));
    pdf.on("error", reject);

    let pageCount = 0;

    // Track pages for numbering
    pdf.on("pageAdded", () => { pageCount++; });
    pageCount = 1; // first page added automatically

    const PW = Number(pdf.page.width);
    const ML = Number(pdf.options.margins?.left ?? 60);
    const MR = Number(pdf.options.margins?.right ?? 60);
    const CW = PW - ML - MR;

    const getPageH = () => Number(pdf.page.height);

    const addHeader = () => {
      pdf.save();
      pdf.rect(0, 0, PW, 40).fill(DARK);
      pdf.fillColor(GOLD).fontSize(8).font("Helvetica-Bold")
        .text("DJAMA AI", ML, 14)
        .fillColor(WHITE).fontSize(7).font("Helvetica")
        .text(doc.title, ML + 60, 15, { width: CW - 60, align: "right" });
      pdf.restore();
    };

    const addFooter = () => {
      const y = getPageH() - 40;
      pdf.save();
      pdf.moveTo(ML, y).lineTo(PW - MR, y).strokeColor(GOLD).lineWidth(0.5).stroke();
      pdf.fillColor(MUTED).fontSize(7).font("Helvetica")
        .text("Généré par DJAMA AI · djama.fr", ML, y + 6)
        .text(`Page ${pageCount}`, ML, y + 6, { width: CW, align: "right" });
      pdf.restore();
    };

    // Cover page
    pdf.rect(0, 0, PW, getPageH()).fill(DARK);
    // Gold accent bar left
    pdf.rect(0, 0, 8, getPageH()).fill(GOLD);
    // Title area
    const titleY = getPageH() * 0.35;
    pdf.fillColor(GOLD).fontSize(10).font("Helvetica").text("DJAMA AI", 60, titleY - 30);
    pdf.fillColor(WHITE).fontSize(28).font("Helvetica-Bold")
      .text(doc.title, 60, titleY, { width: CW });
    if (doc.subtitle) {
      pdf.fillColor(GOLD).fontSize(13).font("Helvetica")
        .text(doc.subtitle, 60, pdf.y + 16, { width: CW });
    }
    pdf.moveTo(60, pdf.y + 20).lineTo(60 + CW * 0.4, pdf.y + 20).strokeColor(GOLD).lineWidth(1.5).stroke();
    pdf.fillColor(WHITE).fontSize(9).font("Helvetica")
      .text(`${doc.author ?? "DJAMA AI"} · ${doc.date ?? new Date().toLocaleDateString("fr-FR")}`, 60, pdf.y + 30);
    addFooter();

    let isFirstContentSection = true;

    for (const section of doc.sections) {
      if (section.type === "cover") continue;

      // New page for each heading1 (except very first)
      if (section.type === "heading1") {
        if (isFirstContentSection) {
          pdf.addPage();
          pageCount++;
          isFirstContentSection = false;
        } else {
          pdf.addPage();
          pageCount++;
        }
        addHeader();
        pdf.moveDown(3);
        pdf.fillColor(DARK).fontSize(18).font("Helvetica-Bold")
          .text(section.content ?? "", ML, pdf.y, { width: CW });
        pdf.moveTo(ML, pdf.y + 6).lineTo(ML + CW, pdf.y + 6).strokeColor(GOLD).lineWidth(1).stroke();
        pdf.moveDown(1.5);
        addFooter();
        continue;
      }

      // Heading2
      if (section.type === "heading2") {
        // Check if we need a new page
        if (pdf.y > getPageH() - 140) { pdf.addPage(); pageCount++; addHeader(); pdf.moveDown(3); addFooter(); }
        pdf.fillColor(DARKTEXT).fontSize(13).font("Helvetica-Bold")
          .text(section.content ?? "", { width: CW });
        pdf.moveDown(0.8);
        continue;
      }

      // Paragraph
      if (section.type === "paragraph" && section.content) {
        if (pdf.y > getPageH() - 120) { pdf.addPage(); pageCount++; addHeader(); pdf.moveDown(3); addFooter(); }
        pdf.fillColor(DARKTEXT).fontSize(10).font("Helvetica")
          .text(section.content, { width: CW, lineGap: 3 });
        pdf.moveDown(1);
        continue;
      }

      // List
      if (section.type === "list" && section.items) {
        if (pdf.y > getPageH() - 120) { pdf.addPage(); pageCount++; addHeader(); pdf.moveDown(3); addFooter(); }
        for (const item of section.items) {
          pdf.fillColor(GOLD).fontSize(10).font("Helvetica-Bold").text("•", ML, pdf.y, { continued: false });
          pdf.fillColor(DARKTEXT).fontSize(10).font("Helvetica")
            .text(item, ML + 16, pdf.y - 10, { width: CW - 16, lineGap: 2 });
          pdf.moveDown(0.4);
        }
        pdf.moveDown(0.5);
        continue;
      }

      // Divider
      if (section.type === "divider") {
        pdf.moveDown(0.5);
        pdf.moveTo(ML, pdf.y).lineTo(ML + CW, pdf.y).strokeColor(GOLD).lineWidth(0.5).stroke();
        pdf.moveDown(1);
        continue;
      }

      // Table
      if (section.type === "table" && section.rows && section.rows.length > 0) {
        if (pdf.y > getPageH() - 160) { pdf.addPage(); pageCount++; addHeader(); pdf.moveDown(3); addFooter(); }
        const rows     = section.rows;
        const colCount = Math.max(...rows.map(r => r.length));
        const colW     = CW / colCount;
        const rowH     = 20;

        rows.forEach((row, ri) => {
          const isHeader = ri === 0;
          const startX   = ML;
          const startY   = pdf.y;

          if (isHeader) {
            pdf.rect(startX, startY, CW, rowH).fill(DARK);
          } else if (ri % 2 === 0) {
            pdf.rect(startX, startY, CW, rowH).fill(LIGHT);
          } else {
            pdf.rect(startX, startY, CW, rowH).fill(WHITE);
          }

          row.forEach((cell, ci) => {
            pdf.fillColor(isHeader ? GOLD : DARKTEXT)
              .fontSize(isHeader ? 8 : 9)
              .font(isHeader ? "Helvetica-Bold" : "Helvetica")
              .text(String(cell ?? ""), startX + ci * colW + 5, startY + 5, {
                width: colW - 10, lineBreak: false, ellipsis: true,
              });
          });

          pdf.moveTo(startX, startY + rowH)
            .lineTo(startX + CW, startY + rowH)
            .strokeColor(isHeader ? GOLD : "#e5e7eb")
            .lineWidth(isHeader ? 0.8 : 0.3)
            .stroke();

          pdf.y = startY + rowH;
          if (pdf.y > getPageH() - 120) {
            pdf.addPage(); pageCount++; addHeader(); pdf.moveDown(3); addFooter();
          }
        });
        pdf.moveDown(1.5);
      }
    }

    pdf.end();
    pdf.on("end", () => {
      resolve({ buffer: Buffer.concat(chunks), pages: pageCount });
    });
  });
}

/* ── Execute create_pdf ──────────────────────────────────────────────── */
async function executeCreatePdf(
  prompt: string,
  context: string,
  userId: string,
  convId: string | null,
  apiKey: string,
): Promise<ArtifactData> {
  const admin = createSupabaseAdmin();
  await ensureBucket();

  const docData = await generatePdfJSON(prompt, context, apiKey);
  const { buffer, pages } = await buildPdfBuffer(docData);

  const artifactId  = crypto.randomUUID();
  const safeTitle   = docData.title
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\-_\s]/g, "").trim().slice(0, 60) || "rapport";
  const fileName    = `${safeTitle}.pdf`;
  const storagePath = `${userId}/${artifactId}/${fileName}`;

  const { error: uploadErr } = await admin.storage
    .from("djama-artifacts")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadErr) throw new Error(`Upload PDF échoué : ${uploadErr.message}`);

  const { data: signed } = await admin.storage.from("djama-artifacts").createSignedUrl(storagePath, 3600);
  const downloadUrl = signed?.signedUrl ?? "";

  await admin
    .from("artifact_files")
    .insert({
      id: artifactId, user_id: userId, conversation_id: convId ?? undefined,
      artifact_type: "pdf", title: docData.title,
      storage_bucket: "djama-artifacts", storage_path: storagePath,
      file_name: fileName, file_size: buffer.length, mime_type: "application/pdf",
      metadata: { pages, sections: docData.sections.length },
    })
    .then(({ error: e }) => { if (e) console.warn("[tools/create_pdf] DB insert skipped:", e.message); });

  return {
    id: artifactId, type: "pdf", title: docData.title,
    file_name: fileName, file_size: buffer.length,
    mime_type: "application/pdf",
    download_url: downloadUrl,
    storage_bucket: "djama-artifacts", storage_path: storagePath,
    metadata: { pages, sections: docData.sections.length },
  };
}

/* ── Generate PPTX JSON from LLM ────────────────────────────────────── */
async function generatePptxJSON(
  prompt: string,
  _context: string,
  apiKey: string,
): Promise<{
  title: string;
  subtitle?: string;
  theme?: string;
  slides: Array<{
    layout: "cover" | "title_content" | "two_columns" | "bullets" | "table" | "closing";
    title?: string;
    subtitle?: string;
    content?: string;
    bullets?: string[];
    left?: string;
    right?: string;
    table?: { headers: string[]; rows: string[][] };
    notes?: string;
  }>;
}> {
  const client = new Anthropic({ apiKey });
  const instruction = `Tu es un expert PowerPoint. Génère une présentation professionnelle en JSON.

DEMANDE: ${prompt}

RÈGLES:
1. Retourne UNIQUEMENT du JSON valide, sans balises markdown
2. Minimum 10 slides, maximum 20 slides
3. Layouts disponibles: "cover" (1 seule, obligatoire en slide 1), "title_content", "bullets", "two_columns", "table", "closing" (1 seule, obligatoire en dernière)
4. Chaque slide a un "title" court (max 50 chars) et son contenu selon le layout
5. Les "bullets" sont des points concis (max 80 chars chacun)
6. Les tableaux ont "headers" et "rows" (max 5 colonnes, max 8 lignes)
7. "content" est un texte court descriptif (max 200 chars)

EXEMPLE:
{
  "title": "DJAMA — Présentation Investisseurs 2027",
  "subtitle": "L'écosystème digital pour entrepreneurs",
  "slides": [
    {"layout": "cover", "title": "DJAMA", "subtitle": "L'écosystème digital pour entrepreneurs"},
    {"layout": "title_content", "title": "Notre Vision", "content": "DJAMA révolutionne la gestion d'entreprise..."},
    {"layout": "bullets", "title": "Fonctionnalités Clés", "bullets": ["CRM intégré", "IA générative", "Facturation automatique", "Analyses temps réel"]},
    {"layout": "table", "title": "Métriques Clés", "table": {"headers": ["KPI","Valeur","Évolution"], "rows": [["Clients","1 250","+35%"],["CA","480 K€","+28%"]]}},
    {"layout": "two_columns", "title": "Avantages", "left": "Simple à utiliser\\nIA intégrée\\nTout-en-un", "right": "Scalable\\nSécurisé\\nAbordable"},
    {"layout": "closing", "title": "Rejoignez DJAMA", "subtitle": "contact@djama.fr · djama.fr"}
  ]
}

Génère une présentation complète et professionnelle adaptée à la demande.`;

  const resp = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [{ role: "user", content: instruction }],
  });
  const raw = resp.content[0].type === "text" ? resp.content[0].text : "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Pas de JSON PPTX valide dans la réponse LLM");
  return JSON.parse(jsonrepair(jsonMatch[0]));
}

/* ── Build PPTX buffer deterministically ────────────────────────────── */
async function buildPptxBuffer(prs: {
  title: string;
  subtitle?: string;
  slides: Array<{
    layout: string;
    title?: string;
    subtitle?: string;
    content?: string;
    bullets?: string[];
    left?: string;
    right?: string;
    table?: { headers: string[]; rows: string[][] };
    notes?: string;
  }>;
}): Promise<Buffer> {
  const GOLD   = "C9A55A";
  const DARK   = "16213E";
  const WHITE  = "FFFFFF";
  const LGRAY  = "F8F6F0";
  const MUTED  = "6B7280";
  const ACCENT = "E8E0CC";

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 16:9
  pptx.author = "DJAMA AI";
  pptx.title  = prs.title;
  pptx.subject = prs.subtitle ?? "";

  // Slide master (background + footer)
  pptx.defineSlideMaster({
    title: "DJAMA_MASTER",
    background: { color: LGRAY },
    objects: [
      { rect: { x: 0, y: "92%", w: "100%", h: "8%", fill: { color: DARK } } },
      { text: { text: "DJAMA AI", options: { x: 0.3, y: "93%", w: 2, h: "6%", color: GOLD, fontSize: 8, bold: true } } },
      { text: { text: prs.title, options: { x: 2.5, y: "93%", w: 7, h: "6%", color: WHITE, fontSize: 8, align: "right" } } },
    ],
    slideNumber: { x: "95%", y: "93%", color: WHITE, fontSize: 8 },
  });

  for (const slide of prs.slides) {
    const sl = pptx.addSlide({ masterName: slide.layout === "cover" ? undefined : "DJAMA_MASTER" });

    if (slide.layout === "cover") {
      sl.background = { color: DARK };
      // Gold bar left
      sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: "100%", fill: { color: GOLD }, line: { type: "none" } });
      // Title
      sl.addText(slide.title ?? prs.title, {
        x: 0.5, y: "30%", w: 8, h: 1.2,
        color: WHITE, fontSize: 36, bold: true, fontFace: "Calibri",
      });
      if (slide.subtitle ?? prs.subtitle) {
        sl.addText(slide.subtitle ?? prs.subtitle ?? "", {
          x: 0.5, y: "52%", w: 8, h: 0.7,
          color: GOLD, fontSize: 16, fontFace: "Calibri",
        });
      }
      // Gold divider line
      sl.addShape(pptx.ShapeType.line, { x: 0.5, y: "62%", w: 4, h: 0, line: { color: GOLD, width: 2 } });
      sl.addText("DJAMA AI · " + new Date().getFullYear(), {
        x: 0.5, y: "67%", w: 5, h: 0.4,
        color: MUTED, fontSize: 10, fontFace: "Calibri",
      });
      continue;
    }

    if (slide.layout === "closing") {
      sl.background = { color: DARK };
      sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: "100%", fill: { color: GOLD }, line: { type: "none" } });
      sl.addText(slide.title ?? "Merci", {
        x: 0.5, y: "35%", w: 9, h: 1.2,
        color: WHITE, fontSize: 32, bold: true, fontFace: "Calibri", align: "center",
      });
      if (slide.subtitle) {
        sl.addText(slide.subtitle, {
          x: 0.5, y: "55%", w: 9, h: 0.6,
          color: GOLD, fontSize: 14, fontFace: "Calibri", align: "center",
        });
      }
      continue;
    }

    // Slide header bar (gold)
    sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.7, fill: { color: DARK }, line: { type: "none" } });
    if (slide.title) {
      sl.addText(slide.title, {
        x: 0.3, y: 0.08, w: 9, h: 0.55,
        color: WHITE, fontSize: 18, bold: true, fontFace: "Calibri",
      });
    }

    if (slide.layout === "title_content" && slide.content) {
      sl.addText(slide.content, {
        x: 0.5, y: 1.0, w: 9, h: 4,
        color: "1A1A2E", fontSize: 14, fontFace: "Calibri",
        valign: "top", wrap: true,
      });
    }

    if (slide.layout === "bullets" && slide.bullets) {
      const bulletText = slide.bullets.map(b => `•  ${b}`).join("\n");
      sl.addText(bulletText, {
        x: 0.5, y: 1.0, w: 9, h: 4.5,
        color: "1A1A2E", fontSize: 16, fontFace: "Calibri",
        valign: "top", breakLine: true,
      });
    }

    if (slide.layout === "two_columns") {
      const leftLines  = (slide.left ?? "").split("\\n").map(t => ({ text: t, options: { breakLine: true } }));
      const rightLines = (slide.right ?? "").split("\\n").map(t => ({ text: t, options: { breakLine: true } }));
      // Left panel
      sl.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.9, w: 4.5, h: 4.5, fill: { color: ACCENT }, line: { color: GOLD, width: 1 } });
      sl.addText(leftLines, { x: 0.5, y: 1.0, w: 4.2, h: 4.3, color: "1A1A2E", fontSize: 14, fontFace: "Calibri", valign: "top" });
      // Right panel
      sl.addShape(pptx.ShapeType.rect, { x: 5.0, y: 0.9, w: 4.5, h: 4.5, fill: { color: ACCENT }, line: { color: GOLD, width: 1 } });
      sl.addText(rightLines, { x: 5.2, y: 1.0, w: 4.2, h: 4.3, color: "1A1A2E", fontSize: 14, fontFace: "Calibri", valign: "top" });
    }

    if (slide.layout === "table" && slide.table) {
      const { headers, rows } = slide.table;
      const tableRows = [
        headers.map(h => ({ text: h, options: { bold: true, color: GOLD, fill: { color: DARK } } })),
        ...rows.map((row, ri) => row.map(cell => ({
          text: cell,
          options: { color: "1A1A2E", fill: { color: ri % 2 === 0 ? WHITE : LGRAY } },
        }))),
      ];
      sl.addTable(tableRows, {
        x: 0.3, y: 1.0, w: 9.4, h: 4.5,
        fontSize: 12, fontFace: "Calibri",
        border: { type: "solid", color: GOLD, pt: 0.5 },
      });
    }

    if (slide.notes) {
      sl.addNotes(slide.notes);
    }
  }

  const buffer = await pptx.write({ outputType: "nodebuffer" }) as unknown as Buffer;
  return Buffer.from(buffer);
}

/* ── Execute create_presentation ─────────────────────────────────────── */
async function executeCreatePresentation(
  prompt: string,
  context: string,
  userId: string,
  convId: string | null,
  apiKey: string,
): Promise<ArtifactData> {
  const admin = createSupabaseAdmin();
  await ensureBucket();

  const prsData = await generatePptxJSON(prompt, context, apiKey);
  const buffer  = await buildPptxBuffer(prsData);

  const artifactId  = crypto.randomUUID();
  const safeTitle   = prsData.title
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\-_\s]/g, "").trim().slice(0, 60) || "presentation";
  const fileName    = `${safeTitle}.pptx`;
  const storagePath = `${userId}/${artifactId}/${fileName}`;

  const { error: uploadErr } = await admin.storage
    .from("djama-artifacts")
    .upload(storagePath, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      upsert: false,
    });
  if (uploadErr) throw new Error(`Upload PPTX échoué : ${uploadErr.message}`);

  const { data: signed } = await admin.storage.from("djama-artifacts").createSignedUrl(storagePath, 3600);
  const downloadUrl = signed?.signedUrl ?? "";

  await admin
    .from("artifact_files")
    .insert({
      id: artifactId, user_id: userId, conversation_id: convId ?? undefined,
      artifact_type: "pptx", title: prsData.title,
      storage_bucket: "djama-artifacts", storage_path: storagePath,
      file_name: fileName, file_size: buffer.length,
      mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      metadata: { slides: prsData.slides.length },
    })
    .then(({ error: e }) => { if (e) console.warn("[tools/create_presentation] DB insert skipped:", e.message); });

  return {
    id: artifactId, type: "pptx", title: prsData.title,
    file_name: fileName, file_size: buffer.length,
    mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    download_url: downloadUrl,
    storage_bucket: "djama-artifacts", storage_path: storagePath,
    metadata: { slides: prsData.slides.length },
  };
}

/* ── Generate Image via Pollinations.ai ─────────────────────────────── */
async function executeGenerateImage(
  prompt: string,
  context: string,
  userId: string,
  convId: string | null,
  apiKey: string,
): Promise<ArtifactData> {
  const admin = createSupabaseAdmin();
  await ensureBucket();

  // 1. Raffiner le prompt en anglais via LLM
  const client = new Anthropic({ apiKey });
  const refineRes = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system:     `Tu es un expert en génération d'images. Traduis et améliore la demande en un prompt anglais concis et précis pour un modèle de génération d'images (max 120 mots). Réponds UNIQUEMENT avec le prompt anglais, sans guillemets ni explication.`,
    messages:   [{ role: "user", content: prompt + (context ? `\n\nContexte : ${context}` : "") }],
  });
  const refinedPrompt = refineRes.content[0].type === "text" ? refineRes.content[0].text.trim() : prompt;

  // 2. Appel Pollinations.ai (Flux model, no API key needed)
  const encodedPrompt = encodeURIComponent(refinedPrompt);
  const seed = Math.floor(Math.random() * 99999);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&seed=${seed}&nologo=true&nofeed=true`;

  const imgResponse = await fetch(imageUrl, {
    headers: { "User-Agent": "DJAMA-AI/1.0" },
    signal: AbortSignal.timeout(60000),
  });
  if (!imgResponse.ok) throw new Error(`Pollinations.ai error ${imgResponse.status}`);

  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
  const contentType = imgResponse.headers.get("content-type") ?? "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

  // 3. Title from LLM output (first 60 chars of prompt)
  const title = prompt.slice(0, 60).replace(/^(génère|crée|fais|produis)\s+(une?|le|la)?\s*/i, "").trim() || "Image générée";

  // 4. Upload
  const artifactId  = crypto.randomUUID();
  const safeTitle   = title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9\-_\s]/g, "").trim().slice(0, 50) || "image";
  const fileName    = `${safeTitle}.${ext}`;
  const storagePath = `${userId}/${artifactId}/${fileName}`;

  const { error: uploadErr } = await admin.storage
    .from("djama-artifacts")
    .upload(storagePath, imageBuffer, { contentType, upsert: false });
  if (uploadErr) throw new Error(`Upload image échoué : ${uploadErr.message}`);

  const { data: signed } = await admin.storage.from("djama-artifacts").createSignedUrl(storagePath, 3600);
  const downloadUrl = signed?.signedUrl ?? "";

  await admin
    .from("artifact_files")
    .insert({
      id: artifactId, user_id: userId, conversation_id: convId ?? undefined,
      artifact_type: "image", title,
      storage_bucket: "djama-artifacts", storage_path: storagePath,
      file_name: fileName, file_size: imageBuffer.length,
      mime_type: contentType,
      metadata: { width: 1024, height: 1024, model: "flux", prompt: refinedPrompt },
    })
    .then(({ error: e }) => { if (e) console.warn("[tools/generate_image] DB insert skipped:", e.message); });

  return {
    id: artifactId, type: "image", title,
    file_name: fileName, file_size: imageBuffer.length,
    mime_type: contentType,
    download_url: downloadUrl,
    storage_bucket: "djama-artifacts", storage_path: storagePath,
    metadata: { width: 1024, height: 1024, model: "flux", prompt: refinedPrompt },
  };
}

/* ── Chat fallback ───────────────────────────────────────────────────── */
async function executeChat(
  prompt: string,
  context: string,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system:     context || "Tu es DJAMA AI, assistant professionnel. Réponds toujours en français.",
    messages:   [{ role: "user", content: prompt }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "Désolé, je n'ai pas pu répondre.";
}

/* ── Handler principal ───────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const body = await req.json().catch(() => ({})) as {
    prompt:          string;
    context?:        string;
    conversation_id?: string;
    memory?:         string;
  };

  const { prompt, context = "", conversation_id = null, memory } = body;
  if (!prompt?.trim()) return NextResponse.json({ error: "prompt requis" }, { status: 400 });

  const sysCtx = [
    context,
    memory?.trim() ? `[CONTEXTE MÉMORISÉ]\n${memory}\n[FIN CONTEXTE]` : "",
  ].filter(Boolean).join("\n\n");

  // Routage de l'intention
  const intent = routeIntent(prompt);

  /* ── Cas 1 : outil non tool → chat direct ── */
  if (intent.mode === "chat") {
    try {
      const text = await executeChat(prompt, sysCtx, apiKey);
      return NextResponse.json({ mode: "chat", text, modules: [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      return NextResponse.json({ mode: "error", text: "Erreur IA.", error: msg }, { status: 500 });
    }
  }

  /* ── Cas 2 : outil identifié ── */
  const toolDef = getToolByName(intent.tool!);

  // Outil non implémenté → réponse honnête
  if (!toolDef?.implemented) {
    const phase = toolDef?.comingSoonPhase ?? 99;
    const text = toolDef
      ? `Je vois que vous voulez **${toolDef.label.toLowerCase()}**. Cette fonctionnalité arrive en Phase ${phase} de DJAMA AI. Pour l'instant, je peux vous aider avec des questions sur votre activité, créer des documents Word, ou répondre à vos demandes conversationnelles.`
      : `Je n'ai pas encore cette capacité. Pour l'instant, je peux créer des documents Word, répondre à vos questions sur votre activité DJAMA, et vous aider à analyser vos données.`;
    return NextResponse.json({ mode: "stub", text, tool: intent.tool, coming_phase: phase });
  }

  /* ── Cas 3 : create_document (implémenté Phase 1) ── */
  if (intent.tool === "create_document") {
    const steps = [
      "Compréhension de la demande",
      "Génération du contenu",
      "Construction du document",
      "Mise en forme DOCX",
      "Sauvegarde",
    ];
    try {
      const artifact = await executeCreateDocument(
        prompt, sysCtx, user.id, conversation_id, apiKey,
      );
      const text = `Voici votre document **${artifact.title}** — ${artifact.metadata?.sections ?? ""} sections générées. Vous pouvez le télécharger ci-dessous ou me demander des modifications.`;
      return NextResponse.json({ mode: "tool", text, tool: "create_document", artifact, steps });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[tools/create_document]", msg);
      return NextResponse.json({ mode: "error", text: "Erreur lors de la génération du document.", error: msg }, { status: 500 });
    }
  }

  /* ── Cas 4 : create_spreadsheet (implémenté Phase 5) ── */
  if (intent.tool === "create_spreadsheet") {
    const steps = [
      "Compréhension de la demande",
      "Génération de la structure",
      "Construction du classeur",
      "Formules et styles Excel",
      "Sauvegarde",
    ];
    try {
      const artifact = await executeCreateSpreadsheet(
        prompt, sysCtx, user.id, conversation_id, apiKey,
      );
      const text = `Voici votre classeur **${artifact.title}** — ${artifact.metadata?.sheets ?? 1} feuille(s) avec formules Excel réelles. Vous pouvez le télécharger ci-dessous.`;
      return NextResponse.json({ mode: "tool", text, tool: "create_spreadsheet", artifact, steps });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[tools/create_spreadsheet]", msg);
      return NextResponse.json({ mode: "error", text: "Erreur lors de la génération du classeur.", error: msg }, { status: 500 });
    }
  }

  /* ── Cas 5 : create_pdf (implémenté Phase 3) ── */
  if (intent.tool === "create_pdf") {
    const steps = [
      "Compréhension de la demande",
      "Génération du contenu",
      "Mise en page PDF",
      "Styles et pagination",
      "Sauvegarde",
    ];
    try {
      const artifact = await executeCreatePdf(
        prompt, sysCtx, user.id, conversation_id, apiKey,
      );
      const text = `Voici votre document PDF **${artifact.title}** — ${artifact.metadata?.pages ?? "?"} pages. Vous pouvez le télécharger ci-dessous.`;
      return NextResponse.json({ mode: "tool", text, tool: "create_pdf", artifact, steps });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[tools/create_pdf]", msg);
      return NextResponse.json({ mode: "error", text: "Erreur lors de la génération du PDF.", error: msg }, { status: 500 });
    }
  }

  /* ── Cas 6 : create_presentation (implémenté Phase 6) ── */
  if (intent.tool === "create_presentation") {
    const steps = [
      "Compréhension de la demande",
      "Génération du contenu",
      "Construction des slides",
      "Design et styles DJAMA",
      "Sauvegarde",
    ];
    try {
      const artifact = await executeCreatePresentation(
        prompt, sysCtx, user.id, conversation_id, apiKey,
      );
      const text = `Voici votre présentation **${artifact.title}** — ${artifact.metadata?.slides ?? "?"} slides. Vous pouvez la télécharger ci-dessous.`;
      return NextResponse.json({ mode: "tool", text, tool: "create_presentation", artifact, steps });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[tools/create_presentation]", msg);
      return NextResponse.json({ mode: "error", text: "Erreur lors de la génération de la présentation.", error: msg }, { status: 500 });
    }
  }

  /* ── Cas 7 : generate_image (implémenté Phase 7) ── */
  if (intent.tool === "generate_image") {
    const steps = [
      "Compréhension de la demande",
      "Optimisation du prompt",
      "Génération de l'image",
      "Traitement de l'image",
      "Sauvegarde",
    ];
    try {
      const artifact = await executeGenerateImage(
        prompt, sysCtx, user.id, conversation_id, apiKey,
      );
      const text = `Voici votre image **${artifact.title}** — 1024×1024 px, générée avec Flux. Vous pouvez la télécharger ci-dessous.`;
      return NextResponse.json({ mode: "tool", text, tool: "generate_image", artifact, steps });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[tools/generate_image]", msg);
      return NextResponse.json({ mode: "error", text: "Erreur lors de la génération de l'image.", error: msg }, { status: 500 });
    }
  }

  /* ── Cas 8 : query_erp / create_invoice (chat avec contexte) ── */
  if (intent.tool === "query_erp" || intent.tool === "create_invoice") {
    try {
      const text = await executeChat(prompt, sysCtx, apiKey);
      return NextResponse.json({ mode: "chat", text, modules: [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      return NextResponse.json({ mode: "error", text: "Erreur IA.", error: msg }, { status: 500 });
    }
  }

  // Fallback chat
  try {
    const text = await executeChat(prompt, sysCtx, apiKey);
    return NextResponse.json({ mode: "chat", text, modules: [] });
  } catch {
    return NextResponse.json({ mode: "error", text: "Erreur IA.", error: "Erreur inconnue" }, { status: 500 });
  }
}
