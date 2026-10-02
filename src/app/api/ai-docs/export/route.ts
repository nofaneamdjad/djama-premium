/**
 * POST /api/ai-docs/export — Export DOCX ou PDF d'un artifact DJAMA AI Docs
 * Body: { artifactId: string, format: "docx" | "pdf" }
 *
 * Le DOCX préserve : titres, paragraphes, gras/italique, listes, tableaux,
 * couleurs thème, séparateurs, sauts de page, marges, callouts, citations.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  TableRow, TableCell, Table, WidthType, BorderStyle, Footer, Header, PageNumber,
  ShadingType, convertInchesToTwip,
} from "docx";
import type {
  ArtifactContent, DocumentContent, DocumentElement, DocumentSection,
  HeadingElement, ParagraphElement, TableElement, ListElement,
  CalloutElement, QuoteElement,
} from "@/lib/artifacts/types";
import { isDocumentContent } from "@/lib/artifacts/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// ── Couleurs thème ─────────────────────────────────────────────────────────────
const THEME_COLORS: Record<string, { accent: string; heading: string }> = {
  professional: { accent: "1e40af", heading: "1e3a5f" },
  modern:       { accent: "7c3aed", heading: "4c1d95" },
  minimal:      { accent: "374151", heading: "111827" },
  academic:     { accent: "065f46", heading: "064e3b" },
};

// ── Convertir alignement ───────────────────────────────────────────────────────
function toAlign(a?: string) {
  if (a === "center")  return AlignmentType.CENTER;
  if (a === "right")   return AlignmentType.RIGHT;
  if (a === "justify") return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

// ── Élément → Paragraphs/Tables Word ──────────────────────────────────────────
function elementToDocx(el: DocumentElement, colors: { accent: string; heading: string }): (Paragraph | Table)[] {
  switch (el.type) {
    case "heading": {
      const e = el as HeadingElement;
      const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
      return [new Paragraph({
        children: [new TextRun({ text: e.text, bold: true, color: e.level <= 2 ? colors.heading : undefined })],
        heading: levels[e.level - 1] ?? HeadingLevel.HEADING_1,
        alignment: toAlign(e.align),
        spacing: { before: 280, after: 120 },
      })];
    }
    case "paragraph": {
      const e = el as ParagraphElement;
      return [new Paragraph({
        children: [new TextRun({ text: e.text, bold: e.bold, italics: e.italic })],
        alignment: toAlign(e.align),
        indent: e.indent ? { left: convertInchesToTwip(e.indent * 0.5) } : undefined,
        spacing: { after: 120 },
      })];
    }
    case "table": {
      const e = el as TableElement;
      const colCount = e.headers.length;
      const colW = Math.floor(9360 / colCount);
      const headerRow = new TableRow({
        children: e.headers.map(h => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "ffffff" })] })],
          width: { size: colW, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: colors.accent },
        })),
        tableHeader: true,
      });
      const dataRows = e.rows.map(row => new TableRow({
        children: row.map(cell => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell })] })],
          width: { size: colW, type: WidthType.DXA },
        })),
      }));
      const tbl = new Table({ rows: [headerRow, ...dataRows], width: { size: 9360, type: WidthType.DXA } });
      const result: (Paragraph | Table)[] = [tbl];
      if (e.caption) result.push(new Paragraph({
        children: [new TextRun({ text: e.caption, italics: true, size: 18, color: "6b7280" })],
        spacing: { after: 120 },
      }));
      return result;
    }
    case "list": {
      const e = el as ListElement;
      return e.items.map((item, idx) => new Paragraph({
        children: [
          new TextRun({ text: e.style === "numbered" ? `${idx + 1}. ` : e.style === "checkbox" ? (item.checked ? "☑ " : "☐ ") : "• " }),
          new TextRun({ text: item.text, strike: e.style === "checkbox" && !!item.checked }),
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
    case "page_break":
      return [new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true })];
    case "callout": {
      const e = el as CalloutElement;
      const iconMap = { info: "ℹ️ ", warning: "⚠️ ", success: "✅ ", tip: "💡 " };
      const colorMap = { info: "1d4ed8", warning: "b45309", success: "065f46", tip: "6d28d9" };
      const runs: TextRun[] = [];
      if (e.title) runs.push(new TextRun({ text: `${iconMap[e.variant]}${e.title}: `, bold: true, color: colorMap[e.variant] }));
      else runs.push(new TextRun({ text: iconMap[e.variant], bold: true }));
      runs.push(new TextRun({ text: e.text, color: colorMap[e.variant] }));
      return [new Paragraph({
        children: runs,
        indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: colorMap[e.variant] } },
        spacing: { before: 120, after: 120 },
      })];
    }
    case "quote": {
      const e = el as QuoteElement;
      const items: TextRun[] = [new TextRun({ text: `"${e.text}"`, italics: true })];
      if (e.author) items.push(new TextRun({ text: `\n— ${e.author}`, size: 18, color: "9ca3af" }));
      return [new Paragraph({
        children: items,
        indent: { left: convertInchesToTwip(0.75) },
        border: { left: { style: BorderStyle.SINGLE, size: 8, color: "d1d5db" } },
        spacing: { after: 120 },
      })];
    }
    default:
      return [];
  }
}

// ── Section → blocs Word ───────────────────────────────────────────────────────
function sectionToDocx(section: DocumentSection, colors: { accent: string; heading: string }): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  if (section.type === "cover") {
    result.push(new Paragraph({
      children: [new TextRun({ text: section.title ?? "Sans titre", bold: true, size: 56, color: colors.heading })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 400 },
    }));
    if (section.subtitle) result.push(new Paragraph({
      children: [new TextRun({ text: section.subtitle, size: 28, color: "6b7280" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }));
    result.push(new Paragraph({ children: [], pageBreakBefore: true }));
  } else {
    if (section.title) result.push(new Paragraph({
      children: [new TextRun({ text: section.title, bold: true, size: 36, color: colors.heading })],
      heading: HeadingLevel.HEADING_1,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: colors.accent } },
      spacing: { before: 400, after: 200 },
    }));
    for (const el of section.elements) {
      result.push(...elementToDocx(el, colors));
    }
  }
  return result;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { artifactId?: string; format?: string };
  if (!body.artifactId) return NextResponse.json({ error: "artifactId requis" }, { status: 400 });

  const admin = createSupabaseAdmin();

  // Résoudre org
  const { data: membership } = await admin.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  const orgId = membership?.organization_id;
  if (!orgId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Charger artifact
  const { data: art } = await admin.from("artifacts")
    .select("*").eq("id", body.artifactId).eq("organization_id", orgId).maybeSingle();
  if (!art) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (!isDocumentContent(art.content as ArtifactContent)) {
    return NextResponse.json({ error: "Export disponible uniquement pour les documents" }, { status: 400 });
  }

  const content = art.content as DocumentContent;
  const theme   = content.settings.theme ?? "professional";
  const colors  = THEME_COLORS[theme] ?? THEME_COLORS.professional;
  const margins = content.settings.margins ?? { top: 25, bottom: 25, left: 25, right: 25 };
  const mmToTwip = (mm: number) => Math.round(mm * 56.7);

  const format = body.format ?? "docx";

  if (format === "docx") {
    const allChildren: (Paragraph | Table)[] = [];
    for (const section of content.sections) {
      allChildren.push(...sectionToDocx(section, colors));
    }

    const docxFile = new Document({
      creator:     "DJAMA AI Docs",
      title:       art.title,
      description: `Exporté depuis DJAMA AI Docs`,
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
        headers: content.settings.headerText ? {
          default: new Header({
            children: [new Paragraph({
              children: [new TextRun({ text: content.settings.headerText, italics: true, color: "9ca3af", size: 18 })],
              alignment: AlignmentType.LEFT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" } },
            })],
          }),
        } : undefined,
        footers: {
          default: new Footer({
            children: [new Paragraph({
              children: [
                ...(content.settings.footerText ? [new TextRun({ text: `${content.settings.footerText}   `, italics: true, color: "9ca3af", size: 16 })] : []),
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

    const buffer = await Packer.toBuffer(docxFile);
    const safeName = (art.title ?? "document").replace(/[^a-z0-9\-_\s]/gi, "").trim() || "document";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    });
  }

  // PDF — génération via HTML + navigation headless (serveur-side)
  // Pour l'instant on retourne une erreur claire ; le PDF sera implémenté côté client
  // via window.print() sur le DocumentRenderer stylé pour l'impression
  return NextResponse.json({
    error: "Export PDF : utilisez le bouton d'impression dans l'aperçu (Ctrl+P → Enregistrer en PDF)",
    hint: "pdf_via_print"
  }, { status: 501 });
}
