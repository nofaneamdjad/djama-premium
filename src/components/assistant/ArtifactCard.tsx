"use client";
import { Download, FileText, FileSpreadsheet, FileImage, File, CheckCircle2, Loader2, Eye, Pencil } from "lucide-react";
import type { ArtifactData } from "@/lib/ai/tool-registry";

const GOLD = "#c9a55a";

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function TypeIcon({ type }: { type: ArtifactData["type"] }) {
  switch (type) {
    case "docx":  return <FileText size={20} style={{ color: "#2563eb" }} />;
    case "xlsx":  return <FileSpreadsheet size={20} style={{ color: "#16a34a" }} />;
    case "pptx":  return <FileText size={20} style={{ color: "#ea580c" }} />;
    case "pdf":   return <FileText size={20} style={{ color: "#dc2626" }} />;
    case "image": return <FileImage size={20} style={{ color: GOLD }} />;
    default:      return <File size={20} style={{ color: "#6b7280" }} />;
  }
}

const TYPE_LABELS: Record<string, string> = {
  docx:  "Document Word",
  xlsx:  "Tableur Excel",
  pptx:  "Présentation",
  pdf:   "Document PDF",
  image: "Image",
  csv:   "Fichier CSV",
  txt:   "Texte",
};

function buildSubtitle(artifact: ArtifactData): string {
  const base = TYPE_LABELS[artifact.type] ?? artifact.type.toUpperCase();
  const meta = artifact.metadata ?? {};
  const parts: string[] = [];

  if (artifact.type === "xlsx") {
    const rows = typeof meta.rows === "number" ? meta.rows : null;
    if (rows) parts.push(`${rows} lignes`);
    const sheets = typeof meta.sheets === "number" && meta.sheets > 1 ? meta.sheets : null;
    if (sheets) parts.push(`${sheets} feuilles`);
  } else if (artifact.type === "docx") {
    const sec = typeof meta.sections === "number" ? meta.sections : null;
    if (sec) parts.push(`${sec} sections`);
  } else if (artifact.type === "pdf") {
    const pages = typeof meta.pages === "number" ? meta.pages : null;
    if (pages) parts.push(`${pages} pages`);
  } else if (artifact.type === "pptx") {
    const slides = typeof meta.slides === "number" ? meta.slides : null;
    if (slides) parts.push(`${slides} slides`);
    const pages2 = typeof meta.pages === "number" ? meta.pages : null;
    if (!slides && pages2) parts.push(`${pages2} slides`);
  } else if (artifact.type === "image") {
    const w = typeof meta.width === "number" ? meta.width : null;
    const h = typeof meta.height === "number" ? meta.height : null;
    if (w && h) parts.push(`${w}×${h} px`);
    const model = typeof meta.model === "string" ? meta.model : null;
    if (model) parts.push(model.charAt(0).toUpperCase() + model.slice(1));
  }

  return parts.length > 0 ? `${base} · ${parts.join(" · ")}` : base;
}

interface ArtifactCardProps {
  artifact: ArtifactData;
  steps?:   string[];
  isDark:   boolean;
  onEdit?:  (artifact: ArtifactData) => void;
}

export default function ArtifactCard({ artifact, steps, isDark, onEdit }: ArtifactCardProps) {
  const bg     = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const bdr    = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const tx     = isDark ? "#e8e2d6" : "#1a1a1a";
  const txMut  = isDark ? "#8a8070" : "#6b6b6b";
  const goldBg = `${GOLD}12`;
  const subtitle = buildSubtitle(artifact);

  return (
    <div
      className="rounded-xl mt-2 overflow-hidden"
      style={{ border: `1px solid ${bdr}`, background: bg }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: `1px solid ${bdr}` }}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: goldBg, border: `1px solid ${GOLD}20` }}>
          <TypeIcon type={artifact.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm leading-snug truncate" style={{ color: tx }}>
            {artifact.title}
          </div>
          <div className="text-xs mt-0.5" style={{ color: txMut }}>
            {subtitle}
            {artifact.file_size && (
              <> · {formatSize(artifact.file_size)}</>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
          <span className="text-xs" style={{ color: "#22c55e" }}>Généré</span>
        </div>
      </div>

      {/* Steps */}
      {steps && steps.length > 0 && (
        <div className="px-4 py-2.5 flex flex-wrap gap-2"
          style={{ borderBottom: `1px solid ${bdr}` }}>
          {steps.map((s, i) => (
            <span key={i} className="flex items-center gap-1 text-[0.62rem] px-2 py-1 rounded-full"
              style={{ background: `${GOLD}10`, color: `${GOLD}cc`, border: `1px solid ${GOLD}20` }}>
              <span style={{ color: GOLD, opacity: 0.6 }}>✓</span>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
        {/* Aperçu — disabled (future) */}
        <button
          disabled
          title="Aperçu en ligne (bientôt disponible)"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium opacity-40 cursor-not-allowed"
          style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tx, border: `1px solid ${bdr}` }}
        >
          <Eye size={12} />
          Aperçu
        </button>

        {/* Télécharger */}
        {artifact.download_url ? (
          <a
            href={artifact.download_url}
            download={artifact.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95"
            style={{ background: GOLD, color: "#0a0a0a" }}
          >
            <Download size={12} />
            Télécharger
          </a>
        ) : (
          <button
            disabled
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium opacity-50 cursor-not-allowed"
            style={{ background: GOLD, color: "#0a0a0a" }}
          >
            <Loader2 size={12} className="animate-spin" />
            Préparation…
          </button>
        )}

        {/* Modifier avec DJAMA AI */}
        <button
          onClick={() => onEdit?.(artifact)}
          disabled={!onEdit}
          title={onEdit ? "Modifier cet artefact avec DJAMA AI" : "Modification par IA (bientôt disponible)"}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
          style={{
            background: onEdit ? `${GOLD}15` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
            color: onEdit ? GOLD : txMut,
            border: `1px solid ${onEdit ? GOLD + "40" : bdr}`,
            opacity: onEdit ? 1 : 0.4,
            cursor: onEdit ? "pointer" : "not-allowed",
          }}
        >
          <Pencil size={12} />
          Modifier avec DJAMA AI
        </button>
      </div>
    </div>
  );
}
