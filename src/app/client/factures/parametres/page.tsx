"use client";

/**
 * Paramètres de facturation — Style + règles par défaut + aperçu A4 live.
 * Les informations d'entreprise (identité, fiscal, banque) sont dans Mon entreprise.
 */

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import {
  Save, Check, Palette, Settings2, Hash, Calendar, Percent,
  Loader2, ChevronDown, ChevronRight, AlertCircle,
  ZoomIn, ZoomOut, Maximize2, X, ArrowLeft, Building2, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { DEMO_DATA } from "@/components/invoice/shared";
import type { PreviewData } from "@/components/invoice/shared";
import type { TemplateType } from "@/lib/pdf/types";

const GOLD = "#c9a55a";

// ─── Clés de paramètres ───────────────────────────────────────────────────────

const KEY_MAP = {
  color:            "brand.color",
  template:         "brand.template",
  prefix_facture:   "brand.prefix_facture",
  prefix_devis:     "brand.prefix_devis",
  delai_paiement:   "brand.delai_paiement",
  tva_default:      "brand.tva_default",
  devise:           "brand.devise",
  conditions_vente: "brand.conditions_vente",
  notes_defaut:     "brand.notes_defaut",
  // read-only pour la preview
  company_name:     "brand.company_name",
  logo_url:         "brand.logo_url",
} as const;

type SettingKey = keyof typeof KEY_MAP;

interface Settings {
  color:            string;
  template:         string;
  prefix_facture:   string;
  prefix_devis:     string;
  delai_paiement:   string;
  tva_default:      string;
  devise:           string;
  conditions_vente: string;
  notes_defaut:     string;
  company_name:     string;
  logo_url:         string;
}

const DEFAULTS: Settings = {
  color:            GOLD,
  template:         "min-ligne",
  prefix_facture:   "FAC-",
  prefix_devis:     "DEV-",
  delai_paiement:   "30",
  tva_default:      "20",
  devise:           "EUR",
  conditions_vente: "",
  notes_defaut:     "",
  company_name:     "",
  logo_url:         "",
};

// ─── Options ──────────────────────────────────────────────────────────────────

const COLOR_PRESETS = ["#6b7280","#ef4444","#c9a55a","#22c55e","#06b6d4","#6366f1","#f97316"];

const DEVISES = [
  { val: "EUR", label: "€  Euro"          },
  { val: "USD", label: "$  Dollar US"      },
  { val: "GBP", label: "£  Livre Sterling" },
  { val: "MAD", label: "MAD  Dirham"       },
  { val: "CHF", label: "CHF  Franc Suisse" },
  { val: "CAD", label: "CAD  Dollar CA"    },
];

type TabId = "style" | "facturation";

const TABS: { id: TabId; icon: React.ElementType; label: string }[] = [
  { id: "style",       icon: Palette,   label: "Style"       },
  { id: "facturation", icon: Settings2, label: "Facturation" },
];

// ─── Champs thème-aware ───────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = "text", hint, isDark, icon: Icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
  isDark: boolean; icon?: React.ElementType;
}) {
  const labelCol  = isDark ? "#9ca3af" : "#374151";
  const inputBg   = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const inputBd   = isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb";
  const inputText = isDark ? "#ffffff" : "#111827";
  const phCol     = isDark ? "rgba(255,255,255,0.22)" : "#9ca3af";
  const hintCol   = isDark ? "rgba(255,255,255,0.22)" : "#9ca3af";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>{label}</label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <Icon size={13} style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl py-2.5 text-sm outline-none transition ${Icon ? "pl-9 pr-4" : "px-4"}`}
          style={{
            background: inputBg,
            border: `1px solid ${inputBd}`,
            color: inputText,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}80`; }}
          onBlur={e => { e.currentTarget.style.borderColor = inputBd; }}
        />
        {/* Placeholder color via pseudo-element workaround */}
        <style>{`
          input::placeholder { color: ${phCol}; }
          textarea::placeholder { color: ${phCol}; }
        `}</style>
      </div>
      {hint && <p className="mt-1 text-xs" style={{ color: hintCol }}>{hint}</p>}
    </div>
  );
}

function SelectField({
  label, value, onChange, options, isDark,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { val: string; label: string }[]; isDark: boolean;
}) {
  const labelCol  = isDark ? "#9ca3af" : "#374151";
  const inputBg   = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const inputBd   = isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb";
  const inputText = isDark ? "#ffffff" : "#111827";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-4 py-2.5 text-sm outline-none transition"
          style={{ background: inputBg, border: `1px solid ${inputBd}`, color: inputText }}
        >
          {options.map(o => (
            <option key={o.val} value={o.val}
              style={{ background: isDark ? "#1a1f2e" : "#ffffff", color: inputText }}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }} />
      </div>
    </div>
  );
}

function TextareaField({
  label, value, onChange, placeholder, rows = 3, hint, isDark,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; hint?: string; isDark: boolean;
}) {
  const labelCol  = isDark ? "#9ca3af" : "#374151";
  const inputBg   = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const inputBd   = isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb";
  const inputText = isDark ? "#ffffff" : "#111827";
  const hintCol   = isDark ? "rgba(255,255,255,0.22)" : "#9ca3af";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: labelCol }}>{label}</label>
        {hint && <span className="text-xs" style={{ color: hintCol }}>{hint}</span>}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none transition"
        style={{ background: inputBg, border: `1px solid ${inputBd}`, color: inputText }}
        onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}80`; }}
        onBlur={e => { e.currentTarget.style.borderColor = inputBd; }}
      />
    </div>
  );
}

function SectionTitle({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <p className="pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{ color: isDark ? "rgba(255,255,255,0.28)" : "#9ca3af" }}>
      {children}
    </p>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ParametresFacturesPage() {
  const { isDark } = useTheme();

  const [tab,     setTab]     = useState<TabId>("style");
  const [s,       setS]       = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [zoom,       setZoom]       = useState(80);     // 50..150
  const [fullscreen, setFullscreen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"settings" | "preview">("settings");

  // ── Tokens couleur page ──────────────────────────────────────────────────────
  const pageBg      = isDark ? "#0f1117" : "#f3f4f6";
  const panelBg     = isDark ? "#0f1117" : "#ffffff";
  const topbarBg    = isDark ? "rgba(15,17,23,0.98)" : "rgba(255,255,255,0.98)";
  const topbarBd    = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecond  = isDark ? "rgba(255,255,255,0.45)" : "#6b7280";
  const divider     = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";
  const previewBg   = isDark ? "#1a1e2b" : "#dde3ef";
  const cardBg      = isDark ? "rgba(255,255,255,0.03)" : "#f9fafb";
  const cardBd      = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";

  const upd = (key: SettingKey) => (val: string) =>
    setS(prev => ({ ...prev, [key]: val }));

  // ── Chargement ───────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("user_settings")
      .select("key, value")
      .like("key", "brand.%")
      .then(({ data }) => {
        if (data?.length) {
          const map: Record<string, string> = {};
          data.forEach(r => { map[r.key as string] = (r.value as string) ?? ""; });
          setS(prev => {
            const next = { ...prev };
            for (const [local, dbKey] of Object.entries(KEY_MAP)) {
              if (dbKey in map) next[local as SettingKey] = map[dbKey];
            }
            return next;
          });
        }
        setLoading(false);
      });
  }, []);

  // ── Sauvegarde ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true); setSaved(false); setSaveErr("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveErr("Non authentifié."); setSaving(false); return; }

    // On ne sauvegarde que les champs éditables (pas company_name / logo_url qui sont read-only ici)
    const writableKeys = ["color","template","prefix_facture","prefix_devis","delai_paiement","tva_default","devise","conditions_vente","notes_defaut"] as const;
    const rows = writableKeys.map(local => ({
      user_id: user.id,
      key:     KEY_MAP[local],
      value:   s[local] ?? "",
    }));

    const { error } = await supabase
      .from("user_settings")
      .upsert(rows, { onConflict: "user_id,key" });

    setSaving(false);
    if (error) { setSaveErr("Erreur lors de la sauvegarde."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [s]);

  // ── Données de prévisualisation ──────────────────────────────────────────────
  const previewData: PreviewData = {
    type:           "invoice",
    reference:      `${s.prefix_facture || "FAC-"}2025-0001`,
    issue_date:     "2025-01-15",
    due_date:       "2025-02-15",
    client_name:    "Marie Dupont",
    client_email:   "marie@exemple.fr",
    client_company: "Société Exemple SAS",
    subject:        "Création site web premium",
    color:          s.color || GOLD,
    items:          DEMO_DATA.items,
    subtotal:       4200,
    tax_rate:       parseFloat(s.tva_default) || 20,
    tax_amount:     840,
    total:          5040,
    company: {
      name:     s.company_name || "Mon Entreprise",
      email:    "",
      website:  "",
      logoUrl:  s.logo_url ? s.logo_url : null,
      logoSize: "md",
    },
  };

  // ── Chargement ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ background: pageBg }}>
        <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: pageBg }}>

      {/* ── Barre supérieure ──────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-5 py-3"
        style={{ background: topbarBg, borderBottom: `1px solid ${topbarBd}` }}
      >
        {/* Retour */}
        <Link
          href="/client/factures"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition"
          style={{ color: textSecond }}
        >
          <ArrowLeft size={14} /> <span className="hidden sm:inline">Retour</span>
        </Link>

        {/* Onglets */}
        <div
          className="flex items-center gap-0.5 rounded-xl p-1"
          style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6", border: `1px solid ${divider}` }}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              style={
                tab === t.id
                  ? { background: isDark ? "rgba(255,255,255,0.09)" : "#ffffff", color: textPrimary, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { color: textSecond }
              }
            >
              <t.icon size={11} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Bouton enregistrer */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          style={
            saved
              ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }
              : { background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#0a0a0a" }
          }
        >
          {saved   ? <><Check size={13} /> Enregistré</>      :
           saving  ? <><Loader2 size={13} className="animate-spin" /> Enregistrement…</> :
                     <><Save size={13} /> Enregistrer</>}
        </button>
      </div>

      {/* ── Toggle mobile Paramètres / Aperçu ─────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-1 border-b px-4 py-2 sm:hidden"
        style={{ background: panelBg, borderColor: divider }}
      >
        {(["settings", "preview"] as const).map(panel => (
          <button
            key={panel}
            onClick={() => setMobilePanel(panel)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            style={
              mobilePanel === panel
                ? { background: isDark ? "rgba(255,255,255,0.09)" : "#f3f4f6", color: textPrimary, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { color: textSecond }
            }
          >
            {panel === "settings" ? "Paramètres" : "Aperçu en direct"}
          </button>
        ))}
      </div>

      {/* ── Erreur ──────────────────────────────────────────────────── */}
      {saveErr && (
        <div className="flex shrink-0 items-center gap-2 px-6 py-2 text-sm"
          style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle size={13} /> {saveErr}
        </div>
      )}

      {/* ── Corps principal ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Panneau formulaire (gauche fixe) ── */}
        <div
          className={`shrink-0 overflow-y-auto ${mobilePanel === "preview" ? "hidden sm:block" : ""}`}
          style={{
            width: 300,
            minWidth: 280,
            borderRight: `1px solid ${divider}`,
            background: panelBg,
            padding: "20px 20px 32px",
          }}
        >
          {/* Carte renvoi vers Mon entreprise */}
          <Link
            href="/client/factures/entreprise"
            className="mb-4 flex items-center justify-between rounded-xl p-3 transition"
            style={{ background: cardBg, border: `1px solid ${cardBd}` }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "rgba(201,165,90,0.12)", border: "1px solid rgba(201,165,90,0.25)" }}>
                <Building2 size={13} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: textPrimary }}>Mon entreprise</p>
                <p className="text-[10px]" style={{ color: textSecond }}>Identité · Fiscal · Banque</p>
              </div>
            </div>
            <ExternalLink size={11} style={{ color: textSecond }} />
          </Link>

          {/* ── STYLE ───────────────────────────────────────────────── */}
          {tab === "style" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold" style={{ color: textPrimary }}>Style des documents</h2>
                <p className="mt-0.5 text-xs" style={{ color: textSecond }}>Couleur d'accent et modèle appliqués par défaut.</p>
              </div>

              {/* Couleur */}
              <div>
                <SectionTitle isDark={isDark}>Couleur principale</SectionTitle>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {COLOR_PRESETS.map(hex => (
                    <button key={hex}
                      onClick={() => upd("color")(hex)}
                      className="relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: hex, borderColor: s.color === hex ? "#ffffff" : "transparent" }}>
                      {s.color === hex && (
                        <Check size={12} className="absolute inset-0 m-auto"
                          style={{ color: parseInt(hex.slice(1), 16) > 0x888888 ? "#333" : "#fff" }} />
                      )}
                    </button>
                  ))}
                  {/* Couleur personnalisée */}
                  <div className="relative">
                    <div
                      className="h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        background: COLOR_PRESETS.includes(s.color)
                          ? "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"
                          : s.color,
                        borderColor: !COLOR_PRESETS.includes(s.color) ? "#ffffff" : "rgba(255,255,255,0.2)",
                      }}
                      onClick={() => document.getElementById("colorPickerParam")?.click()}
                    />
                    <input id="colorPickerParam" type="color" value={s.color}
                      onChange={e => upd("color")(e.target.value)}
                      className="absolute inset-0 h-0 w-0 opacity-0 pointer-events-none" />
                  </div>
                </div>
                <p className="mt-2 text-xs font-mono" style={{ color: textSecond }}>{s.color}</p>
              </div>

              {/* Modèle — lien vers galerie */}
              <div>
                <SectionTitle isDark={isDark}>Modèle de document</SectionTitle>
                <Link
                  href="/client/factures/modeles"
                  className="mt-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition"
                  style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.22)", color: GOLD }}
                >
                  <span>Changer de modèle (galerie 24)</span>
                  <ChevronRight size={14} />
                </Link>
                {s.template && (
                  <p className="mt-1.5 text-xs" style={{ color: textSecond }}>
                    Modèle actuel : <span className="font-mono">{s.template}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── FACTURATION ─────────────────────────────────────────── */}
          {tab === "facturation" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold" style={{ color: textPrimary }}>Paramètres de facturation</h2>
                <p className="mt-0.5 text-xs" style={{ color: textSecond }}>Règles appliquées par défaut à tous les nouveaux documents.</p>
              </div>

              {/* Numérotation */}
              <div className="space-y-3">
                <SectionTitle isDark={isDark}>Numérotation</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Préfixe facture" value={s.prefix_facture}
                    onChange={upd("prefix_facture")} placeholder="FAC-"
                    icon={Hash} hint="Ex : FAC-2025-0001" isDark={isDark} />
                  <Field label="Préfixe devis" value={s.prefix_devis}
                    onChange={upd("prefix_devis")} placeholder="DEV-"
                    icon={Hash} hint="Ex : DEV-2025-0001" isDark={isDark} />
                </div>
              </div>

              {/* Valeurs par défaut */}
              <div className="space-y-3">
                <SectionTitle isDark={isDark}>Valeurs par défaut</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Délai paiement (j)" value={s.delai_paiement}
                    onChange={upd("delai_paiement")} placeholder="30"
                    icon={Calendar} type="number" isDark={isDark} />
                  <Field label="TVA défaut (%)" value={s.tva_default}
                    onChange={upd("tva_default")} placeholder="20"
                    icon={Percent} type="number" isDark={isDark} />
                </div>
                <SelectField label="Devise" value={s.devise}
                  onChange={upd("devise")} options={DEVISES} isDark={isDark} />
              </div>

              {/* CGV */}
              <div className="space-y-3">
                <SectionTitle isDark={isDark}>Textes par défaut</SectionTitle>
                <TextareaField
                  label="Conditions générales de vente"
                  value={s.conditions_vente} onChange={upd("conditions_vente")}
                  placeholder="Paiement à 30 jours net. Pénalités en cas de retard…"
                  rows={4} hint="Pré-rempli sur chaque document" isDark={isDark} />
                <TextareaField
                  label="Notes par défaut"
                  value={s.notes_defaut} onChange={upd("notes_defaut")}
                  placeholder="Merci de votre confiance…"
                  rows={2} isDark={isDark} />
              </div>
            </div>
          )}
        </div>

        {/* ── Flèche de séparation ── */}
        <div
          className="hidden shrink-0 items-center justify-center lg:flex"
          style={{ width: 28, background: panelBg, borderRight: `1px solid ${divider}` }}
        >
          <ChevronRight size={16} style={{ color: isDark ? "rgba(255,255,255,0.12)" : "#d1d5db" }} />
        </div>

        {/* ── Panneau aperçu (droite flexible) ── */}
        <div className={`flex-1 flex-col overflow-hidden ${mobilePanel === "settings" ? "hidden sm:flex" : "flex"}`}>
          {/* Barre de contrôle aperçu */}
          <div
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-2"
            style={{ background: panelBg, borderBottom: `1px solid ${divider}` }}
          >
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: textSecond }}>
              Aperçu en direct
            </span>

            <div className="flex items-center gap-1">
              {/* Boutons zoom rapide */}
              {[50, 75, 100, 125].map(z => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className="rounded px-2 py-1 text-xs font-mono font-semibold transition"
                  style={
                    zoom === z
                      ? { background: "rgba(201,165,90,0.15)", color: GOLD }
                      : { color: textSecond }
                  }
                >
                  {z}%
                </button>
              ))}

              {/* - / + */}
              <button
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                disabled={zoom <= 50}
                className="flex h-6 w-6 items-center justify-center rounded transition disabled:opacity-30"
                style={{ color: textSecond }}
              >
                <ZoomOut size={12} />
              </button>
              <span className="w-10 text-center text-xs font-mono" style={{ color: textSecond }}>
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(150, z + 10))}
                disabled={zoom >= 150}
                className="flex h-6 w-6 items-center justify-center rounded transition disabled:opacity-30"
                style={{ color: textSecond }}
              >
                <ZoomIn size={12} />
              </button>

              {/* Plein écran */}
              <button
                onClick={() => setFullscreen(true)}
                className="ml-1 flex h-6 w-6 items-center justify-center rounded transition"
                style={{ color: textSecond }}
                title="Plein écran"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          </div>

          {/* Zone aperçu scrollable */}
          <div
            className="flex-1 overflow-auto"
            style={{ background: previewBg }}
          >
            <div
              style={{
                minHeight: "100%",
                display: "flex",
                justifyContent: "center",
                padding: 24,
              }}
            >
              {/* Le conteneur de zoom : width = zoom% de la zone disponible */}
              <div
                style={{
                  width: `${zoom}%`,
                  minWidth: 280,
                  maxWidth: zoom <= 100 ? undefined : "none",
                  flexShrink: 0,
                  borderRadius: 8,
                  overflow: "hidden",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
                }}
              >
                <InvoiceTemplate
                  type={(s.template as TemplateType) || "min-ligne"}
                  data={previewData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal plein écran ──────────────────────────────────────────── */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: isDark ? "#0a0d14" : "#dde3ef" }}
        >
          {/* Barre de contrôle fullscreen */}
          <div
            className="flex shrink-0 items-center justify-between gap-4 px-6 py-3"
            style={{ background: isDark ? "rgba(15,17,23,0.98)" : "rgba(255,255,255,0.98)", borderBottom: `1px solid ${divider}` }}
          >
            <span className="text-sm font-bold" style={{ color: textPrimary }}>Aperçu plein écran</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} disabled={zoom <= 50}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition disabled:opacity-30"
                style={{ color: textSecond, background: cardBg, border: `1px solid ${cardBd}` }}>
                <ZoomOut size={13} />
              </button>
              <span className="w-12 text-center text-sm font-mono font-bold" style={{ color: textPrimary }}>
                {zoom}%
              </span>
              <button onClick={() => setZoom(z => Math.min(150, z + 10))} disabled={zoom >= 150}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition disabled:opacity-30"
                style={{ color: textSecond, background: cardBg, border: `1px solid ${cardBd}` }}>
                <ZoomIn size={13} />
              </button>
              <button onClick={() => setFullscreen(false)}
                className="ml-2 flex h-7 w-7 items-center justify-center rounded-lg transition"
                style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <X size={14} />
              </button>
            </div>
          </div>
          {/* Contenu fullscreen */}
          <div className="flex-1 overflow-auto" style={{ background: isDark ? "#1a1e2b" : "#dde3ef" }}>
            <div style={{ minHeight: "100%", display: "flex", justifyContent: "center", padding: 32 }}>
              <div style={{
                width: `${zoom}%`,
                minWidth: 400,
                maxWidth: 1000,
                flexShrink: 0,
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 16px 60px rgba(0,0,0,0.5)",
              }}>
                <InvoiceTemplate
                  type={(s.template as TemplateType) || "min-ligne"}
                  data={previewData}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
