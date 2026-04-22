"use client";
/**
 * TemplateSelector — Sélecteur de template avec thumbnails live.
 *
 * Affiche 5 cartes cliquables, chacune contenant un aperçu miniature
 * du template rendu avec les vraies données ou des données de démo.
 *
 * Props :
 *   value      Template actuellement sélectionné
 *   onChange   Callback quand l'utilisateur change de template
 *   data       Données à utiliser dans les thumbnails (optionnel — démo si absent)
 *
 * Usage :
 *   <TemplateSelector value={form.template} onChange={v => setForm(f => ({...f, template: v}))} />
 */

import { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import type { TemplateType }  from "@/lib/pdf/types";
import { TEMPLATE_INFO }      from "@/lib/pdf/pdfThemes";
import { InvoiceTemplate }    from "./InvoiceTemplate";
import { DEMO_DATA }          from "./shared";
import type { PreviewData }   from "./shared";

export interface TemplateSelectorProps {
  value:    TemplateType;
  onChange: (t: TemplateType) => void;
  /** Données réelles pour les previews. Si absent → données de démo */
  data?:    PreviewData;
}

// ── Thumbnail miniature (rendu dans une carte) ────────────────────────────────

function TemplateThumbnail({ type, data }: { type: TemplateType; data: PreviewData }) {
  return (
    // Container A4 simulé à l'échelle (595px → ~120px de large)
    <div className="w-full overflow-hidden rounded-lg border border-white/[0.08]" style={{ aspectRatio: "595/842" }}>
      <div
        style={{
          width:     595,
          height:    842,
          transform: "scale(0.202)",
          transformOrigin: "top left",
        }}
      >
        <InvoiceTemplate type={type} data={data} />
      </div>
    </div>
  );
}

// ── Preview plein écran ───────────────────────────────────────────────────────

function FullPreviewModal({
  type,
  data,
  onClose,
}: {
  type:    TemplateType;
  data:    PreviewData;
  onClose: () => void;
}) {
  const info = TEMPLATE_INFO.find(t => t.id === type)!;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-white/[0.1] bg-[#0f0f12] shadow-2xl overflow-hidden">
        {/* Barre */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
          <div>
            <p className="text-[0.88rem] font-black text-white">{info.label}</p>
            <p className="text-[0.7rem] text-white/35">{info.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Preview scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-xl overflow-hidden rounded-xl border border-white/[0.07] bg-white shadow-lg">
            {/* Container A4 simulé à ~85% de largeur */}
            <div style={{ width: 595, transformOrigin: "top left" }}>
              <InvoiceTemplate type={type} data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function TemplateSelector({ value, onChange, data }: TemplateSelectorProps) {
  const previewData = data ?? DEMO_DATA;
  const [fullPreview, setFullPreview] = useState<TemplateType | null>(null);

  return (
    <>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">
            Modèle de document
          </label>
          <span className="text-[0.68rem] text-white/20">
            {TEMPLATE_INFO.find(t => t.id === value)?.label}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {TEMPLATE_INFO.map(info => {
            const selected = value === info.id;
            return (
              <div
                key={info.id}
                className={[
                  "group relative cursor-pointer rounded-2xl border-2 transition-all duration-200",
                  selected
                    ? "border-[#c9a55a] shadow-[0_0_0_1px_rgba(201,165,90,0.3)]"
                    : "border-white/[0.07] hover:border-white/[0.2]",
                ].join(" ")}
                onClick={() => onChange(info.id)}
              >
                {/* Thumbnail */}
                <div className="p-1.5">
                  <TemplateThumbnail type={info.id} data={previewData} />
                </div>

                {/* Label */}
                <div className="pb-2 px-1.5 text-center">
                  <p className={`text-[0.64rem] font-bold truncate ${selected ? "text-[#c9a55a]" : "text-white/50 group-hover:text-white/75"}`}>
                    {info.label}
                  </p>
                </div>

                {/* Badge sélectionné */}
                {selected && (
                  <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c9a55a]">
                    <Check size={10} className="text-[#0f0f12]" strokeWidth={3} />
                  </div>
                )}

                {/* Bouton aperçu */}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFullPreview(info.id); }}
                  className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-white/[0.12] bg-black/60 px-2 py-0.5 text-[0.56rem] font-bold text-white/60 opacity-0 backdrop-blur-sm transition-all duration-150 hover:bg-black/80 hover:text-white group-hover:opacity-100"
                >
                  <Eye size={8} /> Aperçu
                </button>
              </div>
            );
          })}
        </div>

        {/* Description du template sélectionné */}
        <p className="text-[0.67rem] text-white/22 italic">
          {TEMPLATE_INFO.find(t => t.id === value)?.description}
        </p>
      </div>

      {/* Modal plein écran */}
      {fullPreview && (
        <FullPreviewModal
          type={fullPreview}
          data={previewData}
          onClose={() => setFullPreview(null)}
        />
      )}
    </>
  );
}
