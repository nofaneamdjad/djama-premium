"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import { Check, Layers, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TEMPLATE_CATALOG, TEMPLATE_FAMILIES } from "@/lib/pdf/pdfThemes";
import type { TemplateFamily, TemplateType } from "@/lib/pdf/types";

const GOLD = "#c9a55a";
const SETTING_KEY = "brand.template";

// ─── Mini aperçu SVG ──────────────────────────────────────────────────────────

function TemplatePreviewSvg({
  headerBg,
  bodyBg,
  accentColor,
  headerTextColor,
  tableHeaderBg,
  tableHeaderText,
}: {
  headerBg: string;
  bodyBg: string;
  accentColor: string;
  headerTextColor: string;
  tableHeaderBg: string;
  tableHeaderText: string;
}) {
  return (
    <svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Fond document */}
      <rect width="160" height="110" fill={bodyBg} />
      {/* Header */}
      <rect width="160" height="30" fill={headerBg} />
      {/* Ligne d'accent (simulée) */}
      <rect x="8" y="34" width="2" height="20" fill={accentColor} opacity="0.6" rx="1" />
      {/* Nom société */}
      <rect x="8" y="8" width="60" height="4" fill={headerTextColor} opacity="0.9" rx="1" />
      <rect x="8" y="15" width="40" height="2.5" fill={headerTextColor} opacity="0.4" rx="1" />
      {/* Réf (droite) */}
      <rect x="110" y="8" width="42" height="3" fill={headerTextColor} opacity="0.6" rx="1" />
      <rect x="118" y="13.5" width="34" height="2" fill={headerTextColor} opacity="0.35" rx="1" />
      {/* Bloc client */}
      <rect x="14" y="37" width="38" height="2.5" fill={accentColor} opacity="0.5" rx="1" />
      <rect x="14" y="41.5" width="52" height="2" fill="#808080" opacity="0.3" rx="1" />
      <rect x="14" y="45" width="44" height="2" fill="#808080" opacity="0.25" rx="1" />
      {/* Objet */}
      <rect x="14" y="53" width="132" height="6" fill={accentColor} opacity="0.08" rx="1" />
      <rect x="16" y="55.5" width="60" height="2" fill="#808080" opacity="0.4" rx="1" />
      {/* En-tête tableau */}
      <rect x="14" y="63" width="132" height="7" fill={tableHeaderBg} rx="1" />
      <rect x="17" y="65.5" width="20" height="2" fill={tableHeaderText} opacity="0.7" rx="1" />
      <rect x="90" y="65.5" width="18" height="2" fill={tableHeaderText} opacity="0.7" rx="1" />
      <rect x="124" y="65.5" width="18" height="2" fill={tableHeaderText} opacity="0.7" rx="1" />
      {/* Lignes tableau */}
      <rect x="14" y="72" width="132" height="0.5" fill="#808080" opacity="0.15" />
      <rect x="17" y="74" width="50" height="2" fill="#808080" opacity="0.3" rx="1" />
      <rect x="92" y="74" width="14" height="2" fill="#808080" opacity="0.3" rx="1" />
      <rect x="124" y="74" width="18" height="2" fill="#808080" opacity="0.3" rx="1" />
      <rect x="14" y="78" width="132" height="0.5" fill="#808080" opacity="0.15" />
      <rect x="17" y="80" width="44" height="2" fill="#808080" opacity="0.25" rx="1" />
      <rect x="92" y="80" width="12" height="2" fill="#808080" opacity="0.25" rx="1" />
      <rect x="124" y="80" width="18" height="2" fill="#808080" opacity="0.25" rx="1" />
      {/* Total */}
      <rect x="100" y="88" width="46" height="8" fill={tableHeaderBg} rx="1" />
      <rect x="103" y="90.5" width="20" height="2" fill={tableHeaderText} opacity="0.6" rx="1" />
      <rect x="130" y="90.5" width="14" height="2" fill={tableHeaderText} opacity="0.8" rx="1" />
      {/* Footer */}
      <rect x="0" y="104" width="160" height="6" fill={headerBg} opacity="0.7" />
      <rect x="30" y="106" width="100" height="1.5" fill={headerTextColor} opacity="0.3" rx="1" />
    </svg>
  );
}

// ─── Carte modèle ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  isActive,
  isSaving,
  isDark,
  onSelect,
}: {
  template: typeof TEMPLATE_CATALOG[0];
  isActive: boolean;
  isSaving: boolean;
  isDark: boolean;
  onSelect: (id: TemplateType) => void;
}) {
  const cardBg     = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const cardBorder = isActive
    ? `${GOLD}`
    : isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecond  = isDark ? "rgba(255,255,255,0.45)" : "#6b7280";

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-xl transition-all duration-150 cursor-pointer hover:scale-[1.02]"
      style={{
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        boxShadow: isActive
          ? `0 0 0 3px rgba(201,165,90,0.18), 0 2px 8px rgba(0,0,0,0.12)`
          : isDark
            ? "0 1px 4px rgba(0,0,0,0.3)"
            : "0 1px 4px rgba(0,0,0,0.06)",
      }}
      onClick={() => !isSaving && onSelect(template.id)}
    >
      {/* Badge actif */}
      {isActive && (
        <div
          className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: GOLD, color: "#fff" }}
        >
          <Check size={9} strokeWidth={3} />
          Par défaut
        </div>
      )}

      {/* Aperçu visuel */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 110,
          background: template.previewBg,
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6"}`,
        }}
      >
        <TemplatePreviewSvg
          headerBg={template.previewBg}
          bodyBg={
            template.previewBg === "#ffffff" || template.previewBg === "#fefdf8" || template.previewBg === "#f8f9fb" || template.previewBg === "#f8fdf8"
              ? (isDark ? "#1a1a2a" : "#f9fafb")
              : template.previewBg
          }
          accentColor={template.previewColor}
          headerTextColor={template.previewColor}
          tableHeaderBg={template.previewBg === "#ffffff" || template.previewBg.startsWith("#f")
            ? template.previewColor
            : template.previewBg}
          tableHeaderText={
            template.previewBg === "#ffffff" || template.previewBg.startsWith("#f8") || template.previewBg.startsWith("#fe")
              ? "#ffffff"
              : template.previewColor
          }
        />
      </div>

      {/* Infos */}
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold leading-tight" style={{ color: textPrimary }}>
            {template.label}
          </span>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={{
              color: template.badge.textColor,
              background: template.badge.bgColor,
            }}
          >
            {template.badge.label}
          </span>
        </div>
        <p className="text-[11px] leading-snug" style={{ color: textSecond }}>
          {template.description}
        </p>

        {/* Bouton choisir */}
        <button
          className="mt-1 w-full rounded-lg py-1.5 text-xs font-semibold transition-all"
          style={
            isActive
              ? { background: "rgba(201,165,90,0.12)", color: GOLD, border: `1px solid rgba(201,165,90,0.3)` }
              : {
                  background: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb",
                  color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"}`,
                }
          }
          onClick={(e) => { e.stopPropagation(); !isSaving && onSelect(template.id); }}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Sauvegarde…
            </span>
          ) : isActive ? (
            <span className="flex items-center justify-center gap-1">
              <Check size={10} strokeWidth={3} /> Modèle actuel
            </span>
          ) : (
            "Choisir ce modèle"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ModelesPage() {
  const { isDark } = useTheme();

  const [activeTemplate, setActiveTemplate]   = useState<TemplateType>("min-ligne");
  const [savingId, setSavingId]               = useState<string | null>(null);
  const [savedId, setSavedId]                 = useState<string | null>(null);
  const [filterFamily, setFilterFamily]       = useState<TemplateFamily | "all">("all");
  const [loading, setLoading]                 = useState(true);

  // Tokens couleur
  const pageBg       = isDark ? "bg-[#0f1117]"                 : "bg-gray-50";
  const textPrimary  = isDark ? "#ffffff"                       : "#111827";
  const textSecond   = isDark ? "rgba(255,255,255,0.40)"        : "#6b7280";
  const cardBg       = isDark ? "rgba(255,255,255,0.03)"        : "#ffffff";
  const cardBorder   = isDark ? "rgba(255,255,255,0.07)"        : "#e5e7eb";
  const chipActive   = { bg: GOLD,                   text: "#fff" };
  const chipInactive = {
    bg:   isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
    text: isDark ? "rgba(255,255,255,0.55)" : "#6b7280",
    border: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
  };

  // Charger le template par défaut
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_settings")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", SETTING_KEY)
        .maybeSingle();

      if (data?.value) setActiveTemplate(data.value as TemplateType);
      setLoading(false);
    })();
  }, []);

  const handleSelect = useCallback(async (id: TemplateType) => {
    if (id === activeTemplate) return;
    setSavingId(id);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingId(null); return; }

    await supabase.from("user_settings").upsert(
      { user_id: user.id, key: SETTING_KEY, value: id },
      { onConflict: "user_id,key" }
    );

    setActiveTemplate(id);
    setSavingId(null);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2500);
  }, [activeTemplate]);

  // Filtrage
  const filtered = filterFamily === "all"
    ? TEMPLATE_CATALOG
    : TEMPLATE_CATALOG.filter(t => t.family === filterFamily);

  return (
    <div className={`min-h-full ${pageBg}`}>
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">

        {/* En-tête */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "rgba(201,165,90,0.12)", border: "1px solid rgba(201,165,90,0.25)" }}
              >
                <Layers size={14} style={{ color: GOLD }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: textPrimary }}>
                Galerie des modèles
              </h1>
            </div>
            <p className="text-sm" style={{ color: textSecond }}>
              {TEMPLATE_CATALOG.length} modèles en {TEMPLATE_FAMILIES.length} familles — cliquez pour définir votre modèle par défaut
            </p>
          </div>

          {/* Badge confirmation sauvegarde */}
          {savedId && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: "rgba(201,165,90,0.12)", color: GOLD, border: "1px solid rgba(201,165,90,0.3)" }}
            >
              <Check size={11} strokeWidth={3} />
              Modèle sauvegardé
            </div>
          )}
        </div>

        {/* Filtres famille */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            className="rounded-full px-3 py-1 text-xs font-semibold transition"
            style={
              filterFamily === "all"
                ? { background: chipActive.bg, color: chipActive.text }
                : { background: chipInactive.bg, color: chipInactive.text, border: `1px solid ${chipInactive.border}` }
            }
            onClick={() => setFilterFamily("all")}
          >
            Tous ({TEMPLATE_CATALOG.length})
          </button>
          {TEMPLATE_FAMILIES.map(f => (
            <button
              key={f.id}
              className="rounded-full px-3 py-1 text-xs font-semibold transition"
              style={
                filterFamily === f.id
                  ? { background: chipActive.bg, color: chipActive.text }
                  : { background: chipInactive.bg, color: chipInactive.text, border: `1px solid ${chipInactive.border}` }
              }
              onClick={() => setFilterFamily(f.id)}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Grille */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: GOLD }} />
          </div>
        ) : (
          <>
            {/* Regroupement par famille si "Tous" */}
            {filterFamily === "all" ? (
              <div className="space-y-10">
                {TEMPLATE_FAMILIES.map(family => {
                  const familyTemplates = TEMPLATE_CATALOG.filter(t => t.family === family.id);
                  return (
                    <div key={family.id}>
                      {/* Titre famille */}
                      <div className="mb-3 flex items-center gap-3">
                        <span className="text-sm font-bold" style={{ color: textPrimary }}>
                          {family.label}
                        </span>
                        <div className="flex-1 h-px" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6" }} />
                        <span className="text-xs" style={{ color: textSecond }}>
                          {family.count} modèles
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {familyTemplates.map(t => (
                          <TemplateCard
                            key={t.id}
                            template={t}
                            isActive={t.id === activeTemplate}
                            isSaving={savingId === t.id}
                            isDark={isDark}
                            onSelect={handleSelect}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    isActive={t.id === activeTemplate}
                    isSaving={savingId === t.id}
                    isDark={isDark}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Info bas de page */}
        <div
          className="mt-8 rounded-xl p-4 flex items-start gap-3"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(201,165,90,0.12)" }}
          >
            <Layers size={12} style={{ color: GOLD }} />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: textSecond }}>
            Le modèle sélectionné est utilisé par défaut pour toutes vos nouvelles factures et devis.
            Vous pouvez le changer à tout moment dans les Paramètres ou lors de la création d'un document.
          </p>
        </div>

      </div>
    </div>
  );
}
