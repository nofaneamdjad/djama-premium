"use client";

import React from "react";
import type {
  DocumentContent, DocumentSection, DocumentElement,
  HeadingElement, ParagraphElement, TableElement, ListElement,
  CalloutElement, QuoteElement,
} from "@/lib/artifacts/types";

interface Props {
  content: DocumentContent;
  scale?: number; // pour zoom
}

// ── Thèmes ────────────────────────────────────────────────────────────────────
const themes: Record<string, { accent: string; coverBg: string; headingColor: string }> = {
  professional: { accent: "#1e40af", coverBg: "#1e3a5f", headingColor: "#1e3a5f" },
  modern:       { accent: "#7c3aed", coverBg: "#4c1d95", headingColor: "#4c1d95" },
  minimal:      { accent: "#374151", coverBg: "#1f2937", headingColor: "#111827" },
  academic:     { accent: "#065f46", coverBg: "#064e3b", headingColor: "#064e3b" },
};

// ── Élément : Heading ─────────────────────────────────────────────────────────
function RenderHeading({ el, themeColor }: { el: HeadingElement; themeColor: string }) {
  const base = "font-bold leading-tight";
  const sizeMap: Record<number, string> = {
    1: "text-2xl mt-8 mb-4",
    2: "text-xl mt-6 mb-3",
    3: "text-lg mt-4 mb-2",
    4: "text-base mt-3 mb-1",
  };
  const alignMap: Record<string, string> = {
    center: "text-center", right: "text-right", justify: "text-justify", left: "text-left",
  };
  const style: React.CSSProperties = { color: el.level <= 2 ? themeColor : "inherit" };
  const cls = [base, sizeMap[el.level] ?? "text-base", alignMap[el.align ?? "left"] ?? ""].join(" ");
  const Tag = (`h${el.level}` as "h1" | "h2" | "h3" | "h4");
  return <Tag className={cls} style={style}>{el.text}</Tag>;
}

// ── Élément : Paragraph ───────────────────────────────────────────────────────
function RenderParagraph({ el }: { el: ParagraphElement }) {
  const alignMap: Record<string, string> = {
    center: "text-center", right: "text-right", justify: "text-justify", left: "text-left",
  };
  const style: React.CSSProperties = {
    fontWeight: el.bold ? "bold" : undefined,
    fontStyle:  el.italic ? "italic" : undefined,
    paddingLeft: el.indent ? `${el.indent * 1.5}rem` : undefined,
  };
  return (
    <p className={`mb-3 leading-relaxed text-sm ${alignMap[el.align ?? "left"] ?? ""}`} style={style}>
      {el.text}
    </p>
  );
}

// ── Élément : Table ───────────────────────────────────────────────────────────
function RenderTable({ el, accent }: { el: TableElement; accent: string }) {
  return (
    <div className="my-4 overflow-x-auto">
      {el.caption && <p className="text-xs text-gray-500 italic mb-1">{el.caption}</p>}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ backgroundColor: el.headerStyle !== "minimal" ? accent : "transparent" }}>
            {el.headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold border border-gray-300"
                style={{ color: el.headerStyle !== "minimal" ? "#fff" : "inherit" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {el.rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border border-gray-200 text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Élément : List ────────────────────────────────────────────────────────────
function RenderList({ el }: { el: ListElement }) {
  if (el.style === "checkbox") {
    return (
      <ul className="my-3 space-y-1 ml-2">
        {el.items.map(item => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-base">{item.checked ? "☑" : "☐"}</span>
            <span className={item.checked ? "line-through text-gray-400" : "text-gray-700"}>{item.text}</span>
          </li>
        ))}
      </ul>
    );
  }
  const Tag = el.style === "numbered" ? "ol" : "ul";
  const markerClass = el.style === "numbered" ? "list-decimal" : "list-disc";
  return (
    <Tag className={`my-3 ml-6 space-y-1 ${markerClass} text-sm`}>
      {el.items.map(item => (
        <li key={item.id} className="text-gray-700 leading-relaxed">{item.text}</li>
      ))}
    </Tag>
  );
}

// ── Élément : Callout ─────────────────────────────────────────────────────────
function RenderCallout({ el }: { el: CalloutElement }) {
  const variantMap = {
    info:    { bg: "bg-blue-50", border: "border-blue-400", icon: "ℹ️",  text: "text-blue-900" },
    warning: { bg: "bg-amber-50", border: "border-amber-400", icon: "⚠️", text: "text-amber-900" },
    success: { bg: "bg-green-50", border: "border-green-400", icon: "✅", text: "text-green-900" },
    tip:     { bg: "bg-purple-50", border: "border-purple-400", icon: "💡", text: "text-purple-900" },
  };
  const v = variantMap[el.variant] ?? variantMap.info;
  return (
    <div className={`my-4 p-4 rounded-lg border-l-4 ${v.bg} ${v.border}`}>
      {el.title && <p className={`font-semibold text-sm mb-1 ${v.text}`}>{v.icon} {el.title}</p>}
      <p className={`text-sm ${v.text}`}>{!el.title && `${v.icon} `}{el.text}</p>
    </div>
  );
}

// ── Élément : Quote ───────────────────────────────────────────────────────────
function RenderQuote({ el }: { el: QuoteElement }) {
  return (
    <blockquote className="my-4 pl-4 border-l-4 border-gray-300 italic text-gray-600">
      <p className="text-sm leading-relaxed">{el.text}</p>
      {el.author && <cite className="block text-xs text-gray-400 mt-1 not-italic">— {el.author}</cite>}
    </blockquote>
  );
}

// ── Dispatcher d'éléments ─────────────────────────────────────────────────────
function RenderElement({ el, accent }: { el: DocumentElement; accent: string }) {
  switch (el.type) {
    case "heading":    return <RenderHeading el={el} themeColor={accent} />;
    case "paragraph":  return <RenderParagraph el={el} />;
    case "table":      return <RenderTable el={el} accent={accent} />;
    case "list":       return <RenderList el={el} />;
    case "callout":    return <RenderCallout el={el} />;
    case "quote":      return <RenderQuote el={el} />;
    case "separator":  return <hr className="my-6 border-gray-200" />;
    case "page_break": return <div className="page-break my-4 border-t-2 border-dashed border-gray-300 pt-2 text-xs text-gray-400 text-center">— Saut de page —</div>;
    case "image":      return (
      <div className="my-4 flex flex-col items-center gap-2">
        <div className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 text-sm">
          🖼 {el.alt || "Image"}
        </div>
        {el.caption && <p className="text-xs text-gray-500 italic">{el.caption}</p>}
      </div>
    );
    default: return null;
  }
}

// ── Section Cover ─────────────────────────────────────────────────────────────
function RenderCover({ section, theme }: { section: DocumentSection; theme: typeof themes[string] }) {
  return (
    <div className="min-h-[280px] rounded-lg mb-8 flex flex-col justify-center items-center text-white p-10 text-center"
      style={{ background: `linear-gradient(135deg, ${theme.coverBg}, ${theme.accent})` }}>
      {section.title && <h1 className="text-3xl font-bold mb-4 leading-tight">{section.title}</h1>}
      {section.subtitle && <p className="text-lg opacity-90 leading-relaxed">{section.subtitle}</p>}
      {section.elements.map(el => (
        <div key={el.id} className="text-sm opacity-75 mt-2">
          {el.type === "paragraph" && (el as ParagraphElement).text}
        </div>
      ))}
    </div>
  );
}

// ── Section normale ───────────────────────────────────────────────────────────
function RenderSection({ section, theme }: { section: DocumentSection; theme: typeof themes[string] }) {
  if (section.type === "cover") return <RenderCover section={section} theme={theme} />;

  return (
    <section className="mb-8">
      {section.title && (
        <h2 className="text-xl font-bold mb-4 pb-2 border-b-2" style={{ color: theme.headingColor, borderColor: theme.accent }}>
          {section.title}
        </h2>
      )}
      {section.elements.map(el => (
        <RenderElement key={el.id} el={el} accent={theme.accent} />
      ))}
    </section>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function DocumentRenderer({ content, scale = 1 }: Props) {
  const themeName = content.settings.theme ?? "professional";
  const theme = themes[themeName] ?? themes.professional;
  const fontFamily = content.settings.font === "mono" ? "monospace"
    : content.settings.font === "sans-serif" ? "system-ui, sans-serif"
    : "Georgia, 'Times New Roman', serif";

  return (
    <div
      className="bg-white shadow-lg mx-auto"
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: `${content.settings.margins?.top ?? 25}mm ${content.settings.margins?.right ?? 25}mm ${content.settings.margins?.bottom ?? 25}mm ${content.settings.margins?.left ?? 25}mm`,
        fontFamily,
        fontSize: `${content.settings.fontSize ?? 12}pt`,
        lineHeight: content.settings.lineSpacing ?? 1.6,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      {/* En-tête de page */}
      {content.settings.headerText && (
        <div className="text-xs text-gray-400 italic pb-3 mb-4 border-b border-gray-100">
          {content.settings.headerText}
        </div>
      )}

      {/* Sections */}
      {content.sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-300">
          <p className="text-4xl mb-4">📄</p>
          <p className="text-sm">Le document apparaîtra ici</p>
        </div>
      ) : (
        content.sections.map(section => (
          <RenderSection key={section.id} section={section} theme={theme} />
        ))
      )}

      {/* Pied de page */}
      {content.settings.footerText && (
        <div className="text-xs text-gray-400 italic pt-3 mt-4 border-t border-gray-100 text-right">
          {content.settings.footerText}
        </div>
      )}
    </div>
  );
}
