"use client";
/**
 * Paramètres Factures & Devis — Interface à 4 onglets + aperçu live.
 * Enregistre dans site_settings (clés brand.*).
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Save, Check, Building2, Mail, Phone, Globe,
  ImagePlus, FileText, Landmark, Palette, Settings2,
  Hash, Calendar, Percent, Loader2, ChevronDown, ChevronRight,
  Shield, CreditCard, X, AlertCircle, ZoomIn, ZoomOut, Move,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { LogoDragResize, DEFAULT_LOGO_TRANSFORM } from "@/components/invoice/LogoDragResize";
import type { LogoTransform } from "@/components/invoice/LogoDragResize";
import { DEMO_DATA } from "@/components/invoice/shared";
import type { PreviewData } from "@/components/invoice/shared";
import type { TemplateType } from "@/lib/pdf/types";
import { TEMPLATE_INFO } from "@/lib/pdf/pdfThemes";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = "#c9a55a";

/** Mapping clé locale → clé site_settings */
const KEY_MAP = {
  name:             "brand.company_name",
  email:            "brand.email",
  phone:            "brand.phone",
  website:          "brand.website",
  address:          "brand.address",
  postal_code:      "brand.postal_code",
  city:             "brand.city",
  country:          "brand.country",
  logoUrl:          "brand.logo_url",
  siret:            "brand.siret",
  vat_number:       "brand.vat_number",
  forme_juridique:  "brand.forme_juridique",
  capital_social:   "brand.capital_social",
  ape:              "brand.ape",
  iban:             "brand.iban",
  bic:              "brand.bic",
  garantie:         "brand.garantie",
  mentions_legales: "brand.mentions_legales",
  color:            "brand.color",
  template:         "brand.template",
  prefix_facture:   "brand.prefix_facture",
  prefix_devis:     "brand.prefix_devis",
  delai_paiement:   "brand.delai_paiement",
  tva_default:      "brand.tva_default",
  devise:           "brand.devise",
  conditions_vente: "brand.conditions_vente",
  notes_defaut:     "brand.notes_defaut",
} as const;

type SettingKey = keyof typeof KEY_MAP;

interface AllSettings {
  name:             string;
  email:            string;
  phone:            string;
  website:          string;
  address:          string;
  postal_code:      string;
  city:             string;
  country:          string;
  logoUrl:          string;
  siret:            string;
  vat_number:       string;
  forme_juridique:  string;
  capital_social:   string;
  ape:              string;
  iban:             string;
  bic:              string;
  garantie:         string;
  mentions_legales: string;
  color:            string;
  template:         string;
  prefix_facture:   string;
  prefix_devis:     string;
  delai_paiement:   string;
  tva_default:      string;
  devise:           string;
  conditions_vente: string;
  notes_defaut:     string;
}

const DEFAULTS: AllSettings = {
  name:             "",
  email:            "",
  phone:            "",
  website:          "",
  address:          "",
  postal_code:      "",
  city:             "",
  country:          "",
  logoUrl:          "",
  siret:            "",
  vat_number:       "",
  forme_juridique:  "",
  capital_social:   "",
  ape:              "",
  iban:             "",
  bic:              "",
  garantie:         "",
  mentions_legales: "",
  color:            GOLD,
  template:         "modern",
  prefix_facture:   "FAC-",
  prefix_devis:     "DEV-",
  delai_paiement:   "30",
  tva_default:      "20",
  devise:           "EUR",
  conditions_vente: "",
  notes_defaut:     "",
};

const TABS = [
  { id: "entetes",   icon: Building2, label: "En-têtes",  short: "En-têtes"  },
  { id: "pieds",     icon: FileText,  label: "Pieds",     short: "Pieds"     },
  { id: "style",     icon: Palette,   label: "Style",     short: "Style"     },
  { id: "documents", icon: Settings2, label: "Documents", short: "Docs"      },
] as const;
type TabId = typeof TABS[number]["id"];

const COLOR_PRESETS = [
  "#6b7280", // gris
  "#ef4444", // rouge
  "#c9a55a", // or DJAMA
  "#22c55e", // vert
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#f97316", // orange
];

const FORMES_JURIDIQUES = [
  { val: "",                 label: "— Choisir —"       },
  { val: "EI",               label: "EI"                 },
  { val: "EIRL",             label: "EIRL"               },
  { val: "EURL",             label: "EURL"               },
  { val: "SARL",             label: "SARL"               },
  { val: "SAS",              label: "SAS"                },
  { val: "SASU",             label: "SASU"               },
  { val: "SA",               label: "SA"                 },
  { val: "SNC",              label: "SNC"                },
  { val: "Auto-entrepreneur",label: "Auto-entrepreneur"  },
  { val: "Profession libérale",label:"Profession libérale"},
  { val: "Autre",            label: "Autre"              },
];

const DEVISES = [
  { val: "EUR", label: "€  Euro"           },
  { val: "USD", label: "$  Dollar US"       },
  { val: "GBP", label: "£  Livre Sterling"  },
  { val: "MAD", label: "MAD  Dirham"        },
  { val: "CHF", label: "CHF  Franc Suisse"  },
  { val: "CAD", label: "CAD  Dollar CA"     },
];

// ─── Micro-composants ─────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, icon: Icon, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ElementType; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.7rem] font-medium text-white/40">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <Icon size={13} className="text-white/25" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-white/[0.09] bg-white/[0.04] py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/[0.15] focus:border-[#c9a55a]/45 focus:ring-2 focus:ring-[#c9a55a]/10 ${Icon ? "pl-9 pr-4" : "px-4"}`}
        />
      </div>
      {hint && <p className="mt-1 text-[0.6rem] text-white/20">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { val: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.7rem] font-medium text-white/40">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition hover:border-white/[0.15] focus:border-[#c9a55a]/45"
        >
          {options.map(o => (
            <option key={o.val} value={o.val} style={{ background: "#181c28" }}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
      </div>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; hint?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[0.7rem] font-medium text-white/40">{label}</label>
        {hint && <span className="text-[0.6rem] text-white/25">{hint}</span>}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/[0.15] focus:border-[#c9a55a]/45 focus:ring-2 focus:ring-[#c9a55a]/10"
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="pb-2 pt-1 text-[0.62rem] font-bold uppercase tracking-widest text-white/25">
      {children}
    </p>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function ParametresFacturesPage() {
  const [tab,           setTab]           = useState<TabId>("entetes");
  const [s,             setS]             = useState<AllSettings>(DEFAULTS);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [saveErr,       setSaveErr]       = useState("");
  const [logoTransform, setLogoTransform] = useState<LogoTransform>(DEFAULT_LOGO_TRANSFORM);
  const [headerZoom,    setHeaderZoom]    = useState(1.0);   // 0.7 → 2.0
  const logoRef = useRef<HTMLInputElement>(null);

  /** Met à jour un champ */
  const upd = (key: SettingKey) => (val: string) =>
    setS(prev => ({ ...prev, [key]: val }));

  /** Charge depuis site_settings */
  useEffect(() => {
    supabase
      .from("site_settings")
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
          // Logo transform (JSON séparé)
          if (map["brand.logo_transform"]) {
            try { setLogoTransform(JSON.parse(map["brand.logo_transform"])); }
            catch { /* ignore */ }
          }
        }
        setLoading(false);
      });
  }, []);

  /** Sauvegarde vers site_settings */
  async function handleSave() {
    setSaving(true); setSaved(false); setSaveErr("");

    // 1. Supprimer les anciennes clés brand.* (RLS protège par user_id)
    const { error: delErr } = await supabase
      .from("site_settings")
      .delete()
      .like("key", "brand.%");

    if (delErr) {
      setSaveErr("Erreur lors de la mise à jour (delete).");
      setSaving(false); return;
    }

    // 2. Insérer les nouvelles valeurs
    const rows = [
      ...Object.entries(KEY_MAP).map(([local, dbKey]) => ({
        key:   dbKey,
        value: s[local as SettingKey] ?? "",
      })),
      { key: "brand.logo_transform", value: JSON.stringify(logoTransform) },
    ];

    const { error: insErr } = await supabase.from("site_settings").insert(rows);

    setSaving(false);
    if (insErr) {
      // Fallback : upsert si l'insert échoue (clé déjà présente)
      const { error: upsErr } = await supabase
        .from("site_settings")
        .upsert(rows, { onConflict: "key" });
      if (upsErr) { setSaveErr("Erreur lors de la sauvegarde."); return; }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  /** Upload logo (base64) */
  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => upd("logoUrl")(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /** Données de prévisualisation dérivées des réglages */
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
      name:     s.name    || "Mon Entreprise",
      email:    s.email   || "",
      website:  s.website || "",
      logoUrl:  s.logoUrl || null,
      logoSize: "md",
    },
  };

  // ── Chargement ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117]">
        <Loader2 size={22} className="animate-spin text-[#c9a55a]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f1117]">

      {/* ── Barre supérieure ─────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0f1117]/98 px-5 py-3 backdrop-blur">

        {/* Retour */}
        <Link href="/client/factures"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/45 transition hover:bg-white/[0.05] hover:text-white/80">
          <ArrowLeft size={14} /> Retour
        </Link>

        {/* Onglets */}
        <div className="flex items-center gap-0.5 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.03] p-1 scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.68rem] font-semibold transition sm:px-3 ${
                tab === t.id
                  ? "bg-white/[0.09] text-white shadow-sm"
                  : "text-white/35 hover:text-white/60"
              }`}>
              <t.icon size={11} />
              <span className="hidden xs:inline sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Bouton enregistrer */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            saved
              ? "border border-green-500/25 bg-green-500/10 text-green-400"
              : "text-[#0a0a0a]"
          }`}
          style={saved ? {} : { background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
        >
          {saved   ? <><Check size={13} /> Enregistré</> :
           saving  ? <><Loader2 size={13} className="animate-spin" /> Enregistrement…</> :
                     <><Save size={13} /> Enregistrer</>}
        </motion.button>
      </div>

      {/* ── Message d'erreur ─────────────────────────────────────── */}
      <AnimatePresence>
        {saveErr && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-b border-red-500/20 bg-red-500/10">
            <div className="flex items-center gap-2 px-6 py-2 text-sm text-red-400">
              <AlertCircle size={13} /> {saveErr}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contenu principal ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Panneau formulaire (gauche) ── */}
        <div className="w-full shrink-0 overflow-y-auto border-r border-white/[0.07] px-5 py-6 sm:w-[440px] sm:px-8 sm:py-7">
          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.18 }}>

              {/* ── EN-TÊTES ──────────────────────────────────────── */}
              {tab === "entetes" && (
                <div className="space-y-4">
                  <div className="mb-2">
                    <h2 className="text-[0.95rem] font-bold text-white">En-tête du document</h2>
                    <p className="mt-0.5 text-xs text-white/30">Informations affichées en haut de chaque facture et devis.</p>
                  </div>

                  <Field label="Nom de l'entreprise" value={s.name} onChange={upd("name")}
                    placeholder="Ma Société SAS" icon={Building2} />

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email de contact" value={s.email} onChange={upd("email")}
                      placeholder="contact@masociete.fr" icon={Mail} type="email" />
                    <Field label="Téléphone" value={s.phone} onChange={upd("phone")}
                      placeholder="+33 1 23 45 67" icon={Phone} type="tel" />
                  </div>

                  <Field label="Site internet" value={s.website} onChange={upd("website")}
                    placeholder="www.masociete.fr" icon={Globe} />

                  <Field label="Adresse (rue)" value={s.address} onChange={upd("address")}
                    placeholder="12 rue des Lilas" icon={Building2} />
                  <div className="grid grid-cols-[100px_1fr] gap-3">
                    <Field label="Code postal" value={s.postal_code} onChange={upd("postal_code")}
                      placeholder="75001" />
                    <Field label="Ville" value={s.city} onChange={upd("city")}
                      placeholder="Paris" />
                  </div>
                  <Field label="Pays" value={s.country} onChange={upd("country")}
                    placeholder="France" />

                  {/* Logo */}
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <p className="mb-3 text-[0.7rem] font-medium text-white/40">Logo ou image de marque</p>
                    <div className="flex items-center gap-4">
                      {s.logoUrl ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/[0.1] bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.logoUrl} alt="logo" className="h-full w-full object-contain p-1.5" />
                          <button onClick={() => upd("logoUrl")("")}
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white/70 transition hover:text-white">
                            <X size={9} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => logoRef.current?.click()}
                          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/[0.15] bg-white/[0.02] transition hover:border-white/30 hover:bg-white/[0.04]">
                          <ImagePlus size={16} className="text-white/25" />
                        </button>
                      )}
                      <div>
                        <button onClick={() => logoRef.current?.click()}
                          className="text-sm font-semibold text-[#c9a55a] transition hover:opacity-75">
                          {s.logoUrl ? "Remplacer le logo" : "Ajouter un logo"}
                        </button>
                        <p className="mt-0.5 text-[0.62rem] text-white/25">PNG, JPG, SVG • max 2 Mo</p>
                        <p className="text-[0.6rem] text-white/20">Visible dans l'en-tête des documents</p>
                      </div>
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
                  </div>

                  {/* ── Aperçu de l'en-tête zoomable ─────────────────── */}
                  <div className="overflow-hidden rounded-xl border border-white/[0.07]">
                    {/* Barre titre + contrôles zoom */}
                    <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.02] px-3 py-2">
                      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white/30">
                        Aperçu de l&apos;en-tête
                      </p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setHeaderZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
                          disabled={headerZoom <= 0.5}
                          className="flex h-5 w-5 items-center justify-center rounded text-white/40 transition hover:bg-white/[0.07] hover:text-white/70 disabled:opacity-30">
                          <ZoomOut size={11} />
                        </button>
                        <span className="w-9 text-center text-[0.6rem] text-white/25">
                          {Math.round(headerZoom * 100)}%
                        </span>
                        <button onClick={() => setHeaderZoom(z => Math.min(2.5, parseFloat((z + 0.25).toFixed(2))))}
                          disabled={headerZoom >= 2.5}
                          className="flex h-5 w-5 items-center justify-center rounded text-white/40 transition hover:bg-white/[0.07] hover:text-white/70 disabled:opacity-30">
                          <ZoomIn size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Zone de prévisualisation — affiche la partie haute de la facture */}
                    <div style={{ height: 175, overflow: "hidden", background: "#d4d8e0", position: "relative" }}>
                      {/* Conteneur à largeur variable = zoom réel (pas CSS transform) */}
                      <div style={{
                        position: "absolute",
                        top: 0, left: 0,
                        width: `${Math.round(380 * headerZoom)}px`,
                        minWidth: "100%",
                      }}>
                        <InvoiceTemplate
                          type={(s.template as TemplateType) || "modern"}
                          data={previewData}
                        />
                      </div>
                    </div>

                    {/* Hint drag → aperçu droite */}
                    {s.logoUrl && (
                      <div className="flex items-center gap-2 border-t border-white/[0.05] px-3 py-1.5">
                        <Move size={10} className="text-[#c9a55a]/60" />
                        <p className="text-[0.6rem] text-white/25">
                          Glissez et redimensionnez le logo dans l&apos;aperçu complet →
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PIEDS DE PAGE ─────────────────────────────────── */}
              {tab === "pieds" && (
                <div className="space-y-5">
                  <div className="mb-2">
                    <h2 className="text-[0.95rem] font-bold text-white">Pied de page</h2>
                    <p className="mt-0.5 text-xs text-white/30">Mentions légales et coordonnées bancaires répétées sur chaque document.</p>
                  </div>

                  {/* Immatriculation */}
                  <div className="space-y-3">
                    <SectionTitle>Immatriculation</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="SIRET" value={s.siret} onChange={upd("siret")}
                        placeholder="XXX XXX XXX XXXXX" icon={Hash} />
                      <Field label="Code APE / NAF" value={s.ape} onChange={upd("ape")}
                        placeholder="XXXXA" />
                    </div>
                    <Field label="N° TVA intracommunautaire" value={s.vat_number} onChange={upd("vat_number")}
                      placeholder="FR XX XXX XXX XXX" icon={FileText} />
                  </div>

                  {/* Société */}
                  <div className="space-y-3">
                    <SectionTitle>Société</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField label="Forme juridique" value={s.forme_juridique}
                        onChange={upd("forme_juridique")} options={FORMES_JURIDIQUES} />
                      <Field label="Capital social" value={s.capital_social}
                        onChange={upd("capital_social")} placeholder="10 000 €" />
                    </div>
                  </div>

                  {/* Coordonnées bancaires */}
                  <div className="space-y-3">
                    <SectionTitle>Coordonnées bancaires</SectionTitle>
                    <Field label="IBAN" value={s.iban} onChange={upd("iban")}
                      placeholder="FR76 0000 0000 0000 0000 0000 000" icon={Landmark} />
                    <Field label="BIC / SWIFT" value={s.bic} onChange={upd("bic")}
                      placeholder="XXXXXXXX" icon={CreditCard} />
                  </div>

                  {/* Garantie */}
                  <Field label="Garantie et assureur" value={s.garantie} onChange={upd("garantie")}
                    placeholder="Nom de l'assureur — Numéro de contrat" icon={Shield} />

                  {/* Mentions légales */}
                  <TextareaField label="Mentions légales personnalisées" value={s.mentions_legales}
                    onChange={upd("mentions_legales")}
                    placeholder="Texte libre affiché en bas de chaque document…" rows={3}
                    hint="Pied de page libre" />
                </div>
              )}

              {/* ── STYLE ─────────────────────────────────────────── */}
              {tab === "style" && (
                <div className="space-y-6">
                  <div className="mb-2">
                    <h2 className="text-[0.95rem] font-bold text-white">Style des documents</h2>
                    <p className="mt-0.5 text-xs text-white/30">Couleur et modèle appliqués par défaut à vos nouveaux documents.</p>
                  </div>

                  {/* Couleur */}
                  <div>
                    <SectionTitle>Couleur principale</SectionTitle>
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {COLOR_PRESETS.map(hex => (
                        <button key={hex} onClick={() => upd("color")(hex)}
                          className="relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                          style={{ background: hex, borderColor: s.color === hex ? "#fff" : "transparent" }}>
                          {s.color === hex && (
                            <Check size={12}
                              className="absolute inset-0 m-auto drop-shadow"
                              style={{ color: parseInt(hex.slice(1), 16) > 0x888888 ? "#333" : "#fff" }} />
                          )}
                        </button>
                      ))}
                      {/* Couleur personnalisée */}
                      <div className="relative" title="Couleur personnalisée">
                        <div
                          className="h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            background: COLOR_PRESETS.includes(s.color)
                              ? "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"
                              : s.color,
                            borderColor: !COLOR_PRESETS.includes(s.color) ? "#fff" : "rgba(255,255,255,0.2)",
                          }}
                          onClick={() => document.getElementById("colorPicker")?.click()}
                        />
                        <input id="colorPicker" type="color" value={s.color}
                          onChange={e => upd("color")(e.target.value)}
                          className="absolute inset-0 h-0 w-0 opacity-0 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Modèle */}
                  <div>
                    <SectionTitle>Modèle de document</SectionTitle>
                    <div className="space-y-2 pt-1">
                      {TEMPLATE_INFO.map(tpl => (
                        <button key={tpl.id} onClick={() => upd("template")(tpl.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                            s.template === tpl.id
                              ? "border-[#c9a55a]/40 bg-[#c9a55a]/[0.07]"
                              : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
                          }`}>
                          {/* Swatch couleur */}
                          <div className="h-7 w-7 shrink-0 rounded-md border border-white/[0.12]"
                            style={{ backgroundColor: tpl.headerColor }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">{tpl.label}</p>
                            <p className="truncate text-[0.62rem] text-white/30">{tpl.description}</p>
                          </div>
                          {/* Badge */}
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] font-bold"
                            style={{ color: tpl.badge.textColor, background: tpl.badge.bgColor }}>
                            {tpl.badge.label}
                          </span>
                          {s.template === tpl.id && (
                            <Check size={13} className="shrink-0 text-[#c9a55a]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── DEVIS & FACTURES ──────────────────────────────── */}
              {tab === "documents" && (
                <div className="space-y-5">
                  <div className="mb-2">
                    <h2 className="text-[0.95rem] font-bold text-white">Devis & Factures</h2>
                    <p className="mt-0.5 text-xs text-white/30">Paramètres par défaut à la création d'un nouveau document.</p>
                  </div>

                  {/* Numérotation */}
                  <div className="space-y-3">
                    <SectionTitle>Numérotation automatique</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Préfixe facture" value={s.prefix_facture} onChange={upd("prefix_facture")}
                        placeholder="FAC-" icon={Hash}
                        hint={"Ex : FAC-2025-0001"} />
                      <Field label="Préfixe devis" value={s.prefix_devis} onChange={upd("prefix_devis")}
                        placeholder="DEV-" icon={Hash}
                        hint={"Ex : DEV-2025-0001"} />
                    </div>
                  </div>

                  {/* Défauts */}
                  <div className="space-y-3">
                    <SectionTitle>Valeurs par défaut</SectionTitle>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Délai paiement (j)" value={s.delai_paiement} onChange={upd("delai_paiement")}
                        placeholder="30" icon={Calendar} type="number" />
                      <Field label="TVA défaut (%)" value={s.tva_default} onChange={upd("tva_default")}
                        placeholder="20" icon={Percent} type="number" />
                      <SelectField label="Devise" value={s.devise}
                        onChange={upd("devise")} options={DEVISES} />
                    </div>
                  </div>

                  {/* CGV */}
                  <TextareaField label="Conditions générales de vente"
                    value={s.conditions_vente} onChange={upd("conditions_vente")}
                    placeholder={"Paiement à 30 jours net. En cas de retard, pénalités de 3× le taux d'intérêt légal…"}
                    rows={4} hint="Pré-rempli sur chaque document" />

                  {/* Notes par défaut */}
                  <TextareaField label="Notes par défaut"
                    value={s.notes_defaut} onChange={upd("notes_defaut")}
                    placeholder="Merci de votre confiance. Paiement par virement bancaire uniquement."
                    rows={2} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Flèche ─────────────────────────────────────────────── */}
        <div className="hidden sm:flex shrink-0 flex-col items-center justify-center px-3">
          <ChevronRight size={22} className="text-white/12" />
        </div>

        {/* ── Panneau aperçu (droite) ─────────────────────────────── */}
        <div className="hidden sm:flex sm:flex-1 flex-col overflow-hidden bg-[#090c12]">
          <p className="shrink-0 border-b border-white/[0.05] px-6 py-3 text-[0.62rem] font-bold uppercase tracking-widest text-white/20">
            Aperçu en direct
          </p>
          <div className="flex flex-1 items-start justify-center overflow-y-auto p-6">
            {/* wrapper overflow:visible pour que les poignées LogoDragResize ne soient pas clippées */}
            <div className="relative w-full max-w-[400px]">
              <div className="overflow-hidden rounded-xl shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
                <InvoiceTemplate
                  type={(s.template as TemplateType) || "modern"}
                  data={s.logoUrl
                    ? { ...previewData, company: { ...previewData.company, logoUrl: null } }
                    : previewData}
                />
              </div>
              {/* Overlay logo drag & resize */}
              {s.logoUrl && (
                <LogoDragResize
                  src={s.logoUrl}
                  transform={logoTransform}
                  onChange={setLogoTransform}
                  onReset={() => setLogoTransform(DEFAULT_LOGO_TRANSFORM)}
                />
              )}
            </div>
          </div>
          {/* Hint sous le panneau */}
          {s.logoUrl && (
            <p className="shrink-0 pb-4 text-center text-[0.58rem] text-white/18">
              <Move size={9} className="mr-1 inline" />
              Glissez · Poignées pour redimensionner · Verrou ratio
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
