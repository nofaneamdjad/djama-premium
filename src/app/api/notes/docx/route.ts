/**
 * POST /api/notes/docx — export un document Notes en .docx
 * Body: { note_id: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, TableRow, TableCell, Table, WidthType,
  BorderStyle, UnderlineType, ImageRun,
  Header, Footer, PageNumber,
} from "docx";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// ── Types JSON Tiptap ─────────────────────────────────────────────────────────
interface TNode {
  type:    string;
  text?:   string;
  attrs?:  Record<string, unknown>;
  marks?:  TMark[];
  content?: TNode[];
}
interface TMark { type: string; attrs?: Record<string, unknown>; }

// ── Convertir un noeud texte en TextRun ───────────────────────────────────────
function textRunFromNode(node: TNode): TextRun {
  const marks = node.marks ?? [];
  const hasMark = (t: string) => marks.some(m => m.type === t);
  const getMark = (t: string) => marks.find(m => m.type === t);

  const style = getMark("textStyle")?.attrs as Record<string,unknown> | undefined;
  const color  = (getMark("color")?.attrs?.color as string | undefined)?.replace("#","");
  const size   = style?.fontSize ? parseInt(String(style.fontSize)) * 2 : 24; // half-points

  return new TextRun({
    text:      node.text ?? "",
    bold:      hasMark("bold"),
    italics:   hasMark("italic"),
    underline: hasMark("underline") ? { type: UnderlineType.SINGLE } : undefined,
    strike:    hasMark("strike"),
    color:     color,
    size,
    font:      (style?.fontFamily as string | undefined),
    superScript: hasMark("superscript"),
    subScript:   hasMark("subscript"),
  });
}

// ── Convertir inline nodes en TextRuns ────────────────────────────────────────
function inlineToRuns(nodes: TNode[]): TextRun[] {
  return nodes.flatMap(n => {
    if (n.type === "text") return [textRunFromNode(n)];
    if (n.type === "hardBreak") return [new TextRun({ break: 1 })];
    return [];
  });
}

// ── Alignement ────────────────────────────────────────────────────────────────
function getAlign(attrs?: Record<string,unknown>): (typeof AlignmentType)[keyof typeof AlignmentType] {
  const a = attrs?.textAlign as string | undefined;
  if (a === "center")  return AlignmentType.CENTER;
  if (a === "right")   return AlignmentType.RIGHT;
  if (a === "justify") return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

// ── Convertir un noeud de premier niveau en Paragraph/Table ──────────────────
function nodeToDocx(node: TNode): (Paragraph | Table)[] {
  const children = node.content ?? [];

  switch (node.type) {
    case "paragraph":
      return [new Paragraph({
        children:  inlineToRuns(children),
        alignment: getAlign(node.attrs),
        spacing:   { after: 120 },
      })];

    case "heading": {
      const lvl = (node.attrs?.level as number) ?? 1;
      const headingLevel = ([
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
      ])[lvl - 1] ?? HeadingLevel.HEADING_1;
      return [new Paragraph({ children: inlineToRuns(children), heading: headingLevel, spacing: { before: 240, after: 120 } })];
    }

    case "blockquote":
      return children.flatMap(c => {
        const runs = (c.content ?? []).flatMap(n => n.type === "text" ? [textRunFromNode(n)] : []);
        return [new Paragraph({ children: runs, indent: { left: 720 }, spacing: { after: 120 } })];
      });

    case "bulletList":
    case "orderedList": {
      const items = children.filter(c => c.type === "listItem");
      return items.flatMap((item, idx) => {
        const runs = (item.content ?? []).flatMap(c => inlineToRuns(c.content ?? []));
        return [new Paragraph({
          children: [
            new TextRun({ text: node.type === "orderedList" ? `${idx + 1}. ` : "• " }),
            ...runs,
          ],
          indent: { left: 720 },
          spacing: { after: 80 },
        })];
      });
    }

    case "taskList": {
      return (children ?? []).flatMap(item => {
        const checked = item.attrs?.checked;
        const runs = (item.content ?? []).flatMap(c => inlineToRuns(c.content ?? []));
        return [new Paragraph({
          children: [new TextRun({ text: checked ? "☑ " : "☐ " }), ...runs],
          indent: { left: 360 },
          spacing: { after: 80 },
        })];
      });
    }

    case "horizontalRule":
      return [new Paragraph({
        children: [],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "cccccc" } },
        spacing: { after: 200 },
      })];

    case "hardBreak":
    case "pageBreak":
      return [new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true })];

    case "table": {
      const rows = children.filter(c => c.type === "tableRow");
      if (rows.length === 0) return [];
      const colCount = (rows[0].content ?? []).length;
      const colW     = Math.floor(9360 / colCount);
      const tRows = rows.map(row => {
        const cells = (row.content ?? []).map(cell => {
          const cellParas = (cell.content ?? []).flatMap(c => nodeToDocx(c) as Paragraph[]);
          return new TableCell({
            children: cellParas.length ? cellParas : [new Paragraph({ children: [] })],
            width: { size: colW, type: WidthType.DXA },
          });
        });
        return new TableRow({ children: cells });
      });
      return [new Table({
        rows: tRows,
        width: { size: 9360, type: WidthType.DXA },
      })];
    }

    case "image": {
      const src = node.attrs?.src as string | undefined;
      if (!src?.startsWith("data:image/")) return [];
      try {
        const match = src.match(/^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/i);
        if (!match) return [];
        const rawExt = match[1].toLowerCase();
        const imgType = (rawExt === "jpg" || rawExt === "jpeg") ? "jpg" : rawExt as "png" | "gif";
        const buf = Buffer.from(match[2], "base64");
        const w = Math.min(Math.max((node.attrs?.width as number) || 400, 50), 595);
        const h = Math.round(w * 0.75);
        return [new Paragraph({
          children: [new ImageRun({ data: buf, transformation: { width: w, height: h }, type: imgType })],
          spacing: { after: 120 },
        })];
      } catch { return []; }
    }

    case "codeBlock":
      return [new Paragraph({
        children: [new TextRun({ text: children.map(c=>c.text??"").join(""), font: "Courier New", size: 20 })],
        spacing: { after: 120 },
      })];

    default:
      return [];
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { note_id } = await req.json().catch(() => ({})) as { note_id?: string };
  if (!note_id) return NextResponse.json({ error: "note_id requis" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: note, error } = await admin
    .from("notes")
    .select("id, title, content, content_json, user_id")
    .eq("id", note_id)
    .single();

  if (error || !note) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  if (note.user_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Parse content + header/footer
  let docJson: { content?: TNode[]; header?: string; footer?: string } = { content: [] };
  let headerText = "";
  let footerText = "";
  if (note.content_json) {
    try {
      const parsed = JSON.parse(note.content_json as string);
      docJson = parsed.body ? parsed.body : parsed;
      headerText = (parsed.header as string) ?? "";
      footerText = (parsed.footer as string) ?? "";
    } catch { /**/ }
  }

  const children = docJson.content ?? [];
  const docChildren = children.flatMap(n => nodeToDocx(n));

  // En-tête DOCX (sur chaque page)
  const docHeader = headerText ? new Header({
    children: [new Paragraph({
      children: [new TextRun({ text: headerText, italics: true, color: "6b7280", size: 18 })],
      alignment: AlignmentType.LEFT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" } },
    })],
  }) : undefined;

  // Pied de page DOCX avec numéro de page
  const docFooter = new Footer({
    children: [new Paragraph({
      children: [
        ...(footerText ? [new TextRun({ text: footerText + "   ", italics: true, color: "6b7280", size: 18 })] : []),
        new TextRun({ children: ["Page ", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], color: "9ca3af", size: 16 }),
      ],
      alignment: AlignmentType.RIGHT,
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" } },
    })],
  });

  const doc = new Document({
    creator:     "DJAMA Doc",
    title:       note.title ?? "Document",
    description: "Exporté depuis DJAMA Doc",
    sections: [{
      headers: docHeader ? { default: docHeader } : undefined,
      footers: { default: docFooter },
      children: docChildren.length ? docChildren : [new Paragraph({ children: [] })],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  const safeName = (note.title ?? "document").replace(/[^a-z0-9\-_\s]/gi, "").trim() || "document";
  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safeName}.docx"`,
    },
  });
}
