"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Briefcase,
  Star,
  MousePointerClick,
  Layout,
  Mail,
  Save,
  Loader2,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Toast = { id: number; msg: string; ok: boolean };

// ---------------------------------------------------------------------------
// Metadata maps
// ---------------------------------------------------------------------------

const LABEL_MAP: Record<string, string> = {
  "hero.badge":                    "Badge / Label",
  "hero.title1":                   "Titre — ligne 1",
  "hero.title2":                   "Titre — ligne 2",
  "hero.subtitle":                 "Sous-titre",
  "section.services.title":        "Titre section Services",
  "section.services.subtitle":     "Sous-titre Services",
  "section.realisations.title":    "Titre section Réalisations",
  "section.realisations.subtitle": "Sous-titre Réalisations",
  "cta.final.title1":              "CTA — Titre ligne 1",
  "cta.final.title2":              "CTA — Titre ligne 2",
  "cta.final.subtitle":            "CTA — Sous-titre",
  "footer.tagline":                "Tagline footer",
  "contact.page.title":            "Titre page contact",
  "contact.page.subtitle":         "Sous-titre page contact",
};

const SECTION_MAP: Record<string, string> = {
  "hero.badge":                    "hero",
  "hero.title1":                   "hero",
  "hero.title2":                   "hero",
  "hero.subtitle":                 "hero",
  "section.services.title":        "services",
  "section.services.subtitle":     "services",
  "section.realisations.title":    "realisations",
  "section.realisations.subtitle": "realisations",
  "cta.final.title1":              "cta_final",
  "cta.final.title2":              "cta_final",
  "cta.final.subtitle":            "cta_final",
  "footer.tagline":                "footer",
  "contact.page.title":            "contact_page",
  "contact.page.subtitle":         "contact_page",
};

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sparkles,
  Briefcase,
  Star,
  MousePointerClick,
  Layout,
  Mail,
};

type Field = {
  key: string;
  label: string;
  textarea: boolean;
  placeholder: string;
};

type Section = {
  id: string;
  title: string;
  icon: string;
  color: string;
  fields: Field[];
};

const SECTIONS: Section[] = [
  {
    id: "hero",
    title: "Hero — Page d'accueil",
    icon: "Sparkles",
    color: "#c9a55a",
    fields: [
      { key: "hero.badge",    label: "Badge / Label",   textarea: false, placeholder: "🚀 Nouveau · Services DJAMA" },
      { key: "hero.title1",  label: "Titre — ligne 1", textarea: false, placeholder: "Créons ensemble" },
      { key: "hero.title2",  label: "Titre — ligne 2", textarea: false, placeholder: "votre présence digitale" },
      { key: "hero.subtitle",label: "Sous-titre",       textarea: true,  placeholder: "Sites web, applications, outils pro..." },
    ],
  },
  {
    id: "services",
    title: "Section Services",
    icon: "Briefcase",
    color: "#60a5fa",
    fields: [
      { key: "section.services.title",    label: "Titre section", textarea: false, placeholder: "Nos services" },
      { key: "section.services.subtitle", label: "Sous-titre",    textarea: true,  placeholder: "Des solutions complètes..." },
    ],
  },
  {
    id: "realisations",
    title: "Section Réalisations",
    icon: "Star",
    color: "#a78bfa",
    fields: [
      { key: "section.realisations.title",    label: "Titre section", textarea: false, placeholder: "Nos réalisations" },
      { key: "section.realisations.subtitle", label: "Sous-titre",    textarea: true,  placeholder: "Des projets concrets..." },
    ],
  },
  {
    id: "cta_final",
    title: "CTA Final (bas de page)",
    icon: "MousePointerClick",
    color: "#4ade80",
    fields: [
      { key: "cta.final.title1",   label: "Titre — ligne 1", textarea: false, placeholder: "Prêt à démarrer" },
      { key: "cta.final.title2",   label: "Titre — ligne 2", textarea: false, placeholder: "votre projet ?" },
      { key: "cta.final.subtitle", label: "Sous-titre",       textarea: true,  placeholder: "Discutons de vos besoins..." },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    icon: "Layout",
    color: "#f9a826",
    fields: [
      { key: "footer.tagline", label: "Tagline footer", textarea: true, placeholder: "Création digitale & accompagnement professionnel." },
    ],
  },
  {
    id: "contact_page",
    title: "Page Contact",
    icon: "Mail",
    color: "#34d399",
    fields: [
      { key: "contact.page.title",    label: "Titre page contact", textarea: false, placeholder: "Parlons de votre projet" },
      { key: "contact.page.subtitle", label: "Sous-titre",          textarea: true,  placeholder: "Réponse sous 24h..." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminContenu() {
  const [values, setValues]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [saving, setSaving]   = useState<string | null>(null);
  const [toasts, setToasts]   = useState<Toast[]>([]);

  // -------------------------------------------------------------------------
  // Load
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbErr } = await supabase
          .from("site_settings")
          .select("*")
          .order("section")
          .order("key");
        if (dbErr) throw dbErr;
        const map: Record<string, string> = {};
        (data ?? []).forEach((r: { key: string; value: string }) => {
          map[r.key] = r.value;
        });
        if (!cancelled) setValues(map);
      } catch (err) {
        console.error("[AdminContenu]", err);
        if (!cancelled) setError("Impossible de charger le contenu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // -------------------------------------------------------------------------
  // Toast helper
  // -------------------------------------------------------------------------

  function addToast(msg: string, ok: boolean) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, ok }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  // -------------------------------------------------------------------------
  // Save section
  // -------------------------------------------------------------------------

  async function saveSection(sectionId: string) {
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section) return;
    setSaving(sectionId);
    try {
      const keys = section.fields.map(f => f.key);
      const updates = keys.map(key =>
        supabase
          .from("site_settings")
          .upsert(
            {
              key,
              value: values[key] ?? "",
              label: LABEL_MAP[key] ?? key,
              section: SECTION_MAP[key] ?? "content",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          )
      );
      const results = await Promise.all(updates);
      const failed = results.filter(r => r.error);
      if (failed.length > 0) {
        console.error("[AdminContenu] upsert errors:", failed.map(r => r.error));
        addToast("Erreur lors de la sauvegarde.", false);
      } else {
        addToast(`"${section.title}" sauvegardé avec succès.`, true);
      }
    } catch (err) {
      console.error("[AdminContenu] saveSection:", err);
      addToast("Erreur inattendue lors de la sauvegarde.", false);
    } finally {
      setSaving(null);
    }
  }

  // -------------------------------------------------------------------------
  // Field update
  // -------------------------------------------------------------------------

  function updateValue(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#09090b] space-y-6 p-0">

      {/* ------------------------------------------------------------------ */}
      {/* Toast stack                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-5 py-3 text-[0.84rem] font-semibold shadow-2xl ${
              t.ok
                ? "bg-[rgba(74,222,128,0.15)] text-[#4ade80] border border-[rgba(74,222,128,0.2)]"
                : "bg-[rgba(248,113,113,0.12)] text-[#f87171] border border-[rgba(248,113,113,0.18)]"
            }`}
          >
            {t.ok ? <Check size={14} /> : <X size={14} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Contenu du site</h1>
          <p className="mt-1 text-[0.8rem] text-white/35">Textes visibles sur le site public</p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            supabase
              .from("site_settings")
              .select("*")
              .order("section")
              .order("key")
              .then(({ data, error: dbErr }) => {
                if (dbErr) {
                  setError("Impossible de charger le contenu.");
                  setLoading(false);
                  return;
                }
                const map: Record<string, string> = {};
                (data ?? []).forEach((r: { key: string; value: string }) => {
                  map[r.key] = r.value;
                });
                setValues(map);
                setLoading(false);
              });
          }}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#18181c] px-3.5 py-2.5 text-[0.8rem] text-white/40 hover:text-white/70 disabled:opacity-40 transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                         */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-5 py-4 text-[0.84rem] text-[#f87171]">
          <X size={15} />
          {error}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Loading spinner                                                      */}
      {/* ------------------------------------------------------------------ */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#c9a55a]" />
        </div>
      ) : (
        /* --------------------------------------------------------------- */
        /* Section cards                                                     */
        /* --------------------------------------------------------------- */
        <div className="space-y-5">
          {SECTIONS.map(section => {
            const Icon = ICON_MAP[section.icon];
            const isSaving = saving === section.id;

            return (
              <div
                key={section.id}
                className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-6"
              >
                {/* Card header */}
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${section.color}18` }}
                  >
                    {Icon && (
                      <Icon
                        size={15}
                        className="shrink-0"
                      />
                    )}
                  </div>
                  <h2 className="text-[0.9rem] font-bold text-white">{section.title}</h2>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/30">
                        {field.label}
                      </label>
                      {field.textarea ? (
                        <textarea
                          rows={3}
                          value={values[field.key] ?? ""}
                          placeholder={field.placeholder}
                          onChange={e => updateValue(field.key, e.target.value)}
                          className="w-full resize-none rounded-xl border border-white/[0.07] bg-[#0f0f12] px-4 py-3 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-[rgba(201,165,90,0.4)] focus:ring-0"
                        />
                      ) : (
                        <input
                          type="text"
                          value={values[field.key] ?? ""}
                          placeholder={field.placeholder}
                          onChange={e => updateValue(field.key, e.target.value)}
                          className="w-full rounded-xl border border-white/[0.07] bg-[#0f0f12] px-4 py-3 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-[rgba(201,165,90,0.4)] focus:ring-0"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Save button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => saveSection(section.id)}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-[rgba(201,165,90,0.12)] px-5 py-2.5 text-[0.82rem] font-bold text-[#c9a55a] transition-all hover:bg-[rgba(201,165,90,0.2)] disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Sauvegarde…
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        Sauvegarder {section.title.split(" —")[0]}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
