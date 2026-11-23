"use client";

/**
 * Mon entreprise — Refonte complète v2.
 * - GOLD officiel #FFB900
 * - Dirty state + barre de sauvegarde sticky
 * - Score de complétude
 * - Logo manager amélioré (bg toggle clair/sombre, suppression confirmée)
 * - Bouton « Prévisualiser sur une facture »
 * - Bouton « Restaurer »
 * - Avertissement beforeUnload
 * - Mode clair via CSS variables (remplacement du hack de classe)
 *
 * Stockage : user_settings + org_settings via clés brand.*
 * Backward compat : brand.siret / brand.ape / brand.vat_number conservés.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import {
  Building2, Mail, Phone, Globe, Hash, Shield, Landmark,
  FileText, ImagePlus, Save, Check, ChevronDown, Loader2,
  X, AlertCircle, Info, CreditCard, Percent, Upload, Search,
  MapPin, Smartphone, Eye, RotateCcw, Sun, Moon, Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  COUNTRY_LIST, getCountryConfig, inferCountryCode,
  type CountryConfig,
} from "@/lib/i18n/countries";
import Link from "next/link";

// ─── Constantes couleur DJAMA ─────────────────────────────────────────────────

const GOLD        = "#FFB900";
const GOLD_DIM    = "rgba(255,185,0,0.12)";
const GOLD_BORDER = "rgba(255,185,0,0.30)";

// ─── Modèle de données ────────────────────────────────────────────────────────

interface Settings {
  name:             string;
  email:            string;
  phone:            string;
  website:          string;
  address:          string;
  postal_code:      string;
  city:             string;
  country:          string;
  country_code:     string;
  logoUrl:          string | null;
  forme_juridique:  string;
  capital_social:   string;
  siret:            string;
  ape:              string;
  vat_number:       string;
  tax_id_1:         string;
  tax_id_1_label:   string;
  tax_id_2:         string;
  tax_id_2_label:   string;
  tax_id_3:         string;
  tax_id_3_label:   string;
  iban:             string;
  bic:              string;
  bank_name:        string;
  routing_number:   string;
  sort_code:        string;
  account_number:   string;
  mobile_money:     string;
  garantie:            string;
  mentions_legales:    string;
  payment_conditions:  string;
  late_payment_clause: string;
  template:            string;
  color:              string;
}

const DEFAULTS: Settings = {
  name: "", email: "", phone: "", website: "",
  address: "", postal_code: "", city: "", country: "", country_code: "",
  logoUrl: null, forme_juridique: "", capital_social: "",
  siret: "", ape: "", vat_number: "",
  tax_id_1: "", tax_id_1_label: "", tax_id_2: "", tax_id_2_label: "",
  tax_id_3: "", tax_id_3_label: "",
  iban: "", bic: "",
  bank_name: "", routing_number: "", sort_code: "", account_number: "", mobile_money: "",
  garantie: "", mentions_legales: "", payment_conditions: "", late_payment_clause: "", template: "min-ligne", color: GOLD,
};

interface BankAccount {
  id:             string;
  label:          string;
  holder_name:    string;
  bank_name:      string;
  country_code:   string;
  currency:       string;
  iban:           string;
  bic:            string;
  account_number: string;
  routing_number: string;
  sort_code:      string;
  mobile_money:   string;
  is_default:     boolean;
  is_active:      boolean;
}

interface CustomClause {
  id:    string;
  label: string;
  text:  string;
}

const KEY_MAP: Record<keyof Settings, string> = {
  name:             "brand.company_name",
  email:            "brand.email",
  phone:            "brand.phone",
  website:          "brand.website",
  address:          "brand.address",
  postal_code:      "brand.postal_code",
  city:             "brand.city",
  country:          "brand.country",
  country_code:     "brand.country_code",
  logoUrl:          "brand.logo_url",
  forme_juridique:  "brand.forme_juridique",
  capital_social:   "brand.capital_social",
  siret:            "brand.siret",
  ape:              "brand.ape",
  vat_number:       "brand.vat_number",
  tax_id_1:         "brand.tax_id_1",
  tax_id_1_label:   "brand.tax_id_1_label",
  tax_id_2:         "brand.tax_id_2",
  tax_id_2_label:   "brand.tax_id_2_label",
  tax_id_3:         "brand.tax_id_3",
  tax_id_3_label:   "brand.tax_id_3_label",
  iban:             "brand.iban",
  bic:              "brand.bic",
  bank_name:        "brand.bank_name",
  routing_number:   "brand.routing_number",
  sort_code:        "brand.sort_code",
  account_number:   "brand.account_number",
  mobile_money:     "brand.mobile_money",
  garantie:            "brand.garantie",
  mentions_legales:    "brand.mentions_legales",
  payment_conditions:  "brand.payment_conditions",
  late_payment_clause: "brand.late_payment_clause",
  template:            "brand.template",
  color:            "brand.color",
};

type TabId = "identite" | "fiscalite" | "banque" | "documents";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "identite",  label: "Identité",  icon: Building2 },
  { id: "fiscalite", label: "Fiscalité", icon: Shield },
  { id: "banque",    label: "Banque",    icon: Landmark },
  { id: "documents", label: "Documents", icon: FileText },
];

// ─── Sélecteur de pays ────────────────────────────────────────────────────────

function CountrySelector({
  value, onChange, isDark, label: labelText, labelHint,
}: { value: string; onChange: (code: string, name: string) => void; isDark: boolean; label?: string; labelHint?: string }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const cfg = value ? getCountryConfig(value) : null;

  const filtered = COUNTRY_LIST.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.code.toLowerCase().includes(query.toLowerCase()) ||
    c.currency.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(c: CountryConfig) { onChange(c.code, c.name); setOpen(false); setQuery(""); }

  const badgeColor: Record<string, string> = {
    full: "#4ade80", partial: "#fbbf24", basic: "#94a3b8",
  };

  const dd = isDark
    ? { bg: "#1a1f2e", border: "rgba(255,255,255,0.10)", inputBg: "rgba(255,255,255,0.06)", inputColor: "#fff", iconColor: "rgba(255,255,255,0.3)", rowColor: "#fff", rowHover: "rgba(255,255,255,0.06)", emptyColor: "rgba(255,255,255,0.3)", fwBg: "rgba(255,255,255,0.08)", fwColor: "rgba(255,255,255,0.5)" }
    : { bg: "#fff", border: "#e5e7eb", inputBg: "#fff", inputColor: "#111827", iconColor: "#9ca3af", rowColor: "#111827", rowHover: "rgba(0,0,0,0.04)", emptyColor: "#9ca3af", fwBg: "rgba(0,0,0,0.06)", fwColor: "#374151" };

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280" }}>
        {labelText ?? "Pays"} <span style={{ color: GOLD }}>*</span>
        {labelHint !== "" && <span className="ml-2 text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#9ca3af" }}>{labelHint ?? "(détermine les formes juridiques, champs fiscaux et bancaires)"}</span>}
      </label>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(""); }}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm transition focus:outline-none"
        style={{
          border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb"}`,
          background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
          color: isDark ? "#fff" : "#111827",
        }}
      >
        {cfg ? (
          <span className="flex items-center gap-2">
            <MapPin size={12} style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }} />
            <span>{cfg.name}</span>
            <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#9ca3af" }}>{cfg.currency}</span>
            {cfg.frameworks.length > 0 && (
              <span className="rounded px-1 text-[10px]" style={{ background: GOLD_DIM, color: GOLD }}>{cfg.frameworks[0]}</span>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-2" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>
            <MapPin size={12} /> Sélectionner un pays…
          </span>
        )}
        <ChevronDown size={12} style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl shadow-2xl"
          style={{ background: dd.bg, border: `1px solid ${dd.border}` }}>
          <div className="sticky top-0 border-b" style={{ background: dd.bg, borderColor: dd.border }}>
            <div className="relative p-2">
              <Search size={12} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2" style={{ color: dd.iconColor }} />
              <input
                autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un pays…"
                className="w-full rounded-lg py-2 pl-8 pr-3 text-sm outline-none"
                style={{ background: dd.inputBg, color: dd.inputColor, border: `1px solid ${dd.border}` }}
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm" style={{ color: dd.emptyColor }}>Aucun résultat</p>
          ) : filtered.map(c => {
            const isSelected = c.code === value;
            return (
              <button
                key={c.code} type="button" onClick={() => select(c)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition"
                style={{
                  color: dd.rowColor,
                  background: isSelected ? GOLD_DIM : "transparent",
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = dd.rowHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? GOLD_DIM : "transparent"; }}
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#6b7280" }}>{c.code}</span>
                  {c.frameworks.length > 0 && (
                    <span className="rounded px-1 text-[10px]" style={{ background: dd.fwBg, color: dd.fwColor }}>{c.frameworks[0]}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>{c.currency}</span>
                  <span className="text-[10px] font-semibold" style={{ color: badgeColor[c.support_level] }}>
                    {c.support_level === "full" ? "Vérifié" : c.support_level === "partial" ? "Partiel" : "Basique"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Composants de formulaire ─────────────────────────────────────────────────

function FieldGroup({ label, children, isDark }: { label: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div className="mb-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "#9ca3af" }}>{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", hint, icon: Icon, required, disabled, maxLength, isDark }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
  icon?: React.ElementType; required?: boolean; disabled?: boolean; maxLength?: number; isDark: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280" }}>
        {label}{required && <span style={{ color: GOLD }}> *</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <Icon size={13} style={{ color: isDark ? "rgba(255,255,255,0.25)" : "#9ca3af" }} />
          </div>
        )}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled} maxLength={maxLength}
          className="w-full rounded-xl py-2.5 text-sm outline-none transition"
          style={{
            paddingLeft: Icon ? "2.25rem" : "1rem",
            paddingRight: "1rem",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb"}`,
            background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
            color: isDark ? "#fff" : "#111827",
            opacity: disabled ? 0.5 : 1,
          }}
          onFocus={e => { e.target.style.borderColor = `${GOLD}66`; e.target.style.boxShadow = `0 0 0 3px ${GOLD}1a`; }}
          onBlur={e => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb"; e.target.style.boxShadow = "none"; }}
        />
      </div>
      {hint && <p className="mt-1 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#9ca3af" }}>{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, hint, isDark }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { val: string; label: string }[]; hint?: string; isDark: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280" }}>{label}</label>
      <div className="relative">
        <select
          value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-4 py-2.5 text-sm outline-none transition"
          style={{
            border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb"}`,
            background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
            color: isDark ? "#fff" : "#111827",
          }}
        >
          {options.map(o => (
            <option key={o.val} value={o.val} style={{ background: isDark ? "#181c28" : "#fff", color: isDark ? "#fff" : "#111827" }}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }} />
      </div>
      {hint && <p className="mt-1 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#9ca3af" }}>{hint}</p>}
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 4, hint, isDark }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; hint?: string; isDark: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280" }}>{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none transition"
        style={{
          border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb"}`,
          background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
          color: isDark ? "#fff" : "#111827",
        }}
        onFocus={e => { e.target.style.borderColor = `${GOLD}66`; e.target.style.boxShadow = `0 0 0 3px ${GOLD}1a`; }}
        onBlur={e => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb"; e.target.style.boxShadow = "none"; }}
      />
      {hint && <p className="mt-1 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#9ca3af" }}>{hint}</p>}
    </div>
  );
}

// ─── Validation IBAN (modulo 97) ─────────────────────────────────────────────

function validateIBAN(iban: string): { valid: boolean; message: string } | null {
  const clean = iban.replace(/[\s-]/g, "").toUpperCase();
  if (!clean) return null;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(clean))
    return { valid: false, message: "Format invalide (ex : FR76 3000 6000 0112 3456 7890 189)" };
  const rear = clean.substring(4) + clean.substring(0, 4);
  const numeric = rear.split("").map(c => c >= "A" ? String(c.charCodeAt(0) - 55) : c).join("");
  let rem = 0;
  for (const d of numeric) rem = (rem * 10 + parseInt(d, 10)) % 97;
  return rem === 1
    ? { valid: true, message: "IBAN valide" }
    : { valid: false, message: "Clé de contrôle incorrecte" };
}

// ─── Modal ajout / modification compte bancaire ───────────────────────────────

function BankAccountModal({
  form: initialForm, editId, orgCountryCode, isDark, isSaving, onClose, onSave,
}: {
  form: Partial<BankAccount>;
  editId: string | null;
  orgCountryCode: string;
  isDark: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (form: Partial<BankAccount>) => Promise<void>;
}) {
  const [localForm, setLocalForm] = useState<Partial<BankAccount>>({ ...initialForm });
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const textMain   = isDark ? "#fff" : "#111827";
  const textMuted  = isDark ? "rgba(255,255,255,0.35)" : "#6b7280";

  const selectedCountry = localForm.country_code || orgCountryCode || "";
  const formConfig = selectedCountry ? getCountryConfig(selectedCountry) : null;
  const bankFields = formConfig?.bank_schema.fields ?? [
    { storageKey: "brand.iban",  label: "IBAN",      placeholder: "FR76 3000 6000 0112 3456 7890 189", required: false, hint: undefined },
    { storageKey: "brand.bic",   label: "BIC/SWIFT", placeholder: "BNPAFRPPXXX",                        required: false, hint: undefined },
  ];

  function up(k: keyof BankAccount, v: string | boolean) {
    setLocalForm(f => ({ ...f, [k]: v }));
  }

  function handleCountryChange(code: string, _name: string) {
    const cfg = getCountryConfig(code);
    setLocalForm(f => ({
      ...f, country_code: code, currency: cfg.currency,
      iban: "", bic: "", account_number: "", routing_number: "", sort_code: "", mobile_money: "",
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md overflow-y-auto rounded-2xl" style={{ maxHeight: "90vh", background: isDark ? "#1a1f2e" : "#fff", border: `1px solid ${cardBorder}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-5" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <h2 className="text-base font-semibold" style={{ color: textMain }}>
            {editId ? "Modifier le compte" : "Nouveau compte bancaire"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 transition" style={{ color: textMuted }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 px-5 py-4">
          <Field label="Libellé" value={localForm.label || ""} onChange={v => up("label", v)}
            placeholder="Ex : Compte principal BNP, Compte USD Chase…" isDark={isDark} />
          <Field label="Titulaire du compte" value={localForm.holder_name || ""} onChange={v => up("holder_name", v)}
            placeholder="Nom ou raison sociale du titulaire" isDark={isDark} />
          <Field label="Nom de la banque" value={localForm.bank_name || ""} onChange={v => up("bank_name", v)}
            placeholder="Ex : BNP Paribas, Chase, BOA, BICICI…" isDark={isDark} />

          <CountrySelector
            value={selectedCountry}
            onChange={handleCountryChange}
            isDark={isDark}
            label="Pays de domiciliation bancaire"
            labelHint=""
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: textMuted }}>
              Devise du compte
              <span className="ml-1.5 text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#9ca3af" }}>
                (indépendante de la devise de facturation)
              </span>
            </label>
            <input
              className="w-full rounded-xl px-4 py-2.5 font-mono text-sm font-bold uppercase"
              style={{ border: `1px solid ${cardBorder}`, background: isDark ? "rgba(255,255,255,0.04)" : "#fff", color: textMain, outline: "none" }}
              value={localForm.currency || ""}
              onChange={e => up("currency", e.target.value.toUpperCase().slice(0, 3))}
              placeholder="EUR / USD / XOF"
              maxLength={3}
            />
          </div>

          <div className="pt-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: textMuted }}>
              Coordonnées bancaires
            </p>
            <div className="space-y-3">
              {bankFields.map(field => {
                const fk = field.storageKey.replace("brand.", "") as keyof BankAccount;
                const val = String(localForm[fk] || "");
                const ibanCheck = field.storageKey === "brand.iban" ? validateIBAN(val) : null;
                return (
                  <div key={field.storageKey}>
                    <Field
                      label={field.label}
                      value={val}
                      onChange={v => up(fk, v)}
                      placeholder={field.placeholder || ""}
                      hint={field.hint}
                      required={field.required}
                      icon={field.storageKey === "brand.iban" || field.storageKey === "brand.account_number" ? CreditCard : field.storageKey === "brand.mobile_money" ? Smartphone : undefined}
                      isDark={isDark}
                    />
                    {ibanCheck && val.length > 4 && (
                      <p className="mt-0.5 text-[10px]" style={{ color: ibanCheck.valid ? "#4ade80" : GOLD }}>
                        {ibanCheck.valid ? "✓" : "⚠"} {ibanCheck.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 pt-1">
            <input type="checkbox" checked={!!localForm.is_default} onChange={e => up("is_default", e.target.checked)} />
            <span className="text-sm" style={{ color: textMain }}>Compte principal <span style={{ color: textMuted }}>(affiché en premier sur les documents)</span></span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-5 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm transition"
            style={{ border: `1px solid ${cardBorder}`, color: textMuted }}>
            Annuler
          </button>
          <button onClick={() => onSave(localForm)} disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold transition"
            style={{ background: GOLD, color: "#000", opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {isSaving ? "Enregistrement…" : editId ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MonEntreprise() {
  const { isDark }  = useTheme();
  const [data,      setData]        = useState<Settings>({ ...DEFAULTS });
  const [savedData, setSavedData]   = useState<Settings>({ ...DEFAULTS });
  const [loading,   setLoading]     = useState(true);
  const [saving,    setSaving]      = useState(false);
  const [saved,     setSaved]       = useState(false);
  const [error,     setError]       = useState("");
  const [activeTab, setActiveTab]   = useState<TabId>("identite");
  const [orgId,     setOrgId]       = useState<string | null>(null);
  const [logoPreviewBg, setLogoPreviewBg] = useState<"dark" | "light">("dark");
  const [confirmDelete,  setConfirmDelete] = useState(false);
  const [previewOpen,    setPreviewOpen]   = useState(false);
  const [bankAccounts,     setBankAccounts]     = useState<BankAccount[]>([]);
  const [bankForm,         setBankForm]         = useState<Partial<BankAccount> | null>(null);
  const [bankEditId,       setBankEditId]       = useState<string | null>(null);
  const [bankSaving,       setBankSaving]       = useState(false);
  const [bankConfirmId,    setBankConfirmId]    = useState<string | null>(null);
  const [bankShowArchived, setBankShowArchived] = useState(false);
  const [customClauses,   setCustomClauses]   = useState<CustomClause[]>([]);
  const [clauseForm,      setClauseForm]      = useState<{ label: string; text: string } | null>(null);
  const [clauseSaving,    setClauseSaving]    = useState(false);
  const [previewLoading,  setPreviewLoading]  = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);

  const countryConfig: CountryConfig | null = data.country_code
    ? getCountryConfig(data.country_code)
    : null;

  // ── Dirty state ───────────────────────────────────────────────────────────
  // Compare fields that matter (excludes logoUrl for perf on large data URIs)
  const isDirty = (() => {
    const fields: (keyof Settings)[] = [
      "name","email","phone","website","address","postal_code","city","country","country_code",
      "forme_juridique","capital_social","siret","ape","vat_number",
      "tax_id_1","tax_id_2","tax_id_3","iban","bic","bank_name",
      "routing_number","sort_code","account_number","mobile_money",
      "garantie","mentions_legales","payment_conditions","late_payment_clause","template","color",
    ];
    if (data.logoUrl !== savedData.logoUrl) return true;
    return fields.some(k => data[k] !== savedData[k]);
  })();

  // ── Beforeunload ──────────────────────────────────────────────────────────
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // ── Score de complétude ───────────────────────────────────────────────────
  interface ScoreItem { label: string; filled: boolean; tab: TabId; required: boolean }

  function computeScoreItems(): ScoreItem[] {
    const taxLabel = countryConfig?.tax_fields[0]
      ? countryConfig.tax_fields[0].label.split(" — ")[0].split(" (")[0]
      : "Identifiant fiscal";
    const taxFilled = countryConfig
      ? countryConfig.tax_fields.some(f => !!getTaxValue(f.storageKey))
      : !!(data.tax_id_1 || data.siret);
    const bankLabel = countryConfig?.bank_schema.fields[0]?.label ?? "Coordonnées bancaires";
    const bankFilled = bankAccounts.filter(a => a.is_active).length > 0;
    return [
      { label: "Raison sociale",   filled: !!data.name,                     tab: "identite",  required: true  },
      { label: "Pays",             filled: !!data.country_code,             tab: "identite",  required: true  },
      { label: taxLabel,           filled: taxFilled,                       tab: "fiscalite", required: true  },
      { label: "Adresse",          filled: !!data.address && !!data.city,   tab: "identite",  required: false },
      { label: "E-mail",           filled: !!data.email,                    tab: "identite",  required: false },
      { label: "Téléphone",        filled: !!data.phone,                    tab: "identite",  required: false },
      { label: "Forme juridique",  filled: !!data.forme_juridique,          tab: "identite",  required: false },
      { label: bankLabel,          filled: bankFilled,                      tab: "banque",    required: false },
      { label: "Logo",             filled: !!data.logoUrl,                  tab: "identite",  required: false },
      { label: "Mentions légales", filled: !!data.mentions_legales,         tab: "documents", required: false },
    ];
  }

  function computeScore(): number {
    const items = computeScoreItems();
    return Math.round(items.filter(i => i.filled).length / items.length * 100);
  }

  // ── Chargement ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])
        .is("suspended_at", null)
        .limit(1)
        .maybeSingle();

      const activeOrgId = orgMember?.organization_id ?? null;
      setOrgId(activeOrgId);

      let rows: { key: string; value: string }[] = [];
      if (activeOrgId) {
        const { data: d } = await supabase.from("org_settings").select("key,value")
          .eq("organization_id", activeOrgId).like("key", "brand.%");
        rows = (d ?? []) as typeof rows;
      } else {
        const { data: d } = await supabase.from("user_settings").select("key,value").like("key", "brand.%");
        rows = (d ?? []) as typeof rows;
      }

      const map: Record<string, string> = {};
      rows.forEach(r => { map[r.key] = r.value; });

      const rawCode    = map["brand.country_code"] || "";
      const rawCountry = map["brand.country"] || "";
      const resolvedCode = rawCode || inferCountryCode(rawCountry);

      let taxLabels: Record<string, string> = {};
      if (resolvedCode) {
        const cfg = getCountryConfig(resolvedCode);
        cfg.tax_fields.forEach(f => {
          if (!map[`${f.storageKey}_label`]) taxLabels[`${f.key}_label`] = f.label;
        });
      }

      const loaded: Settings = {
        name:             map["brand.company_name"]    || "",
        email:            map["brand.email"]            || "",
        phone:            map["brand.phone"]            || "",
        website:          map["brand.website"]          || "",
        address:          map["brand.address"]          || "",
        postal_code:      map["brand.postal_code"]      || "",
        city:             map["brand.city"]             || "",
        country:          rawCountry,
        country_code:     resolvedCode,
        logoUrl:          map["brand.logo_url"]         || null,
        forme_juridique:  map["brand.forme_juridique"]  || "",
        capital_social:   map["brand.capital_social"]   || "",
        siret:            map["brand.siret"]            || "",
        ape:              map["brand.ape"]              || "",
        vat_number:       map["brand.vat_number"]       || "",
        tax_id_1:         map["brand.tax_id_1"]         || "",
        tax_id_1_label:   map["brand.tax_id_1_label"]   || taxLabels["tax_id_1_label"] || "",
        tax_id_2:         map["brand.tax_id_2"]         || "",
        tax_id_2_label:   map["brand.tax_id_2_label"]   || taxLabels["tax_id_2_label"] || "",
        tax_id_3:         map["brand.tax_id_3"]         || "",
        tax_id_3_label:   map["brand.tax_id_3_label"]   || taxLabels["tax_id_3_label"] || "",
        iban:             map["brand.iban"]             || "",
        bic:              map["brand.bic"]              || "",
        bank_name:        map["brand.bank_name"]        || "",
        routing_number:   map["brand.routing_number"]   || "",
        sort_code:        map["brand.sort_code"]        || "",
        account_number:   map["brand.account_number"]   || "",
        mobile_money:     map["brand.mobile_money"]     || "",
        garantie:            map["brand.garantie"]              || "",
        mentions_legales:    map["brand.mentions_legales"]    || "",
        payment_conditions:  map["brand.payment_conditions"]  || "",
        late_payment_clause: map["brand.late_payment_clause"] || "",
        template:            map["brand.template"]            || "min-ligne",
        color:            map["brand.color"]            || GOLD,
      };
      setData(loaded);
      setSavedData(loaded);

      // Chargement multi-comptes bancaires
      const rawBankAccounts = map["brand.bank_accounts"];
      if (rawBankAccounts) {
        try { setBankAccounts(JSON.parse(rawBankAccounts) as BankAccount[]); } catch { setBankAccounts([]); }
      } else if (loaded.iban || loaded.bic || loaded.bank_name) {
        const cfg = resolvedCode ? getCountryConfig(resolvedCode) : null;
        setBankAccounts([{
          id:             crypto.randomUUID(),
          label:          "Compte principal",
          holder_name:    loaded.name,
          bank_name:      loaded.bank_name,
          country_code:   resolvedCode || "",
          currency:       cfg?.currency ?? "EUR",
          iban:           loaded.iban,
          bic:            loaded.bic,
          account_number: loaded.account_number,
          routing_number: loaded.routing_number,
          sort_code:      loaded.sort_code,
          mobile_money:   loaded.mobile_money,
          is_default:     true,
          is_active:      true,
        }]);
      } else {
        setBankAccounts([]);
      }

      // Chargement bibliothèque de clauses
      const rawClauses = map["brand.custom_clauses"];
      if (rawClauses) {
        try { setCustomClauses(JSON.parse(rawClauses) as CustomClause[]); } catch { setCustomClauses([]); }
      } else {
        setCustomClauses([]);
      }
    } catch (e) {
      console.error("[MonEntreprise] load:", e);
      setError("Impossible de charger les informations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true); setSaved(false); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const dataMap = data as unknown as Record<string, unknown>;
      const entries = (Object.keys(KEY_MAP) as (keyof Settings)[]).map(k => ({
        key:   KEY_MAP[k],
        value: String(dataMap[k] ?? ""),
      }));

      if (orgId) {
        const rows = entries.map(e => ({ ...e, organization_id: orgId }));
        const { error: err } = await supabase.from("org_settings").upsert(rows, { onConflict: "organization_id,key" });
        if (err) throw err;
      } else {
        const rows = entries.map(e => ({ ...e, user_id: user.id }));
        const { error: err } = await supabase.from("user_settings").upsert(rows, { onConflict: "user_id,key" });
        if (err) throw err;
      }

      setSavedData({ ...data });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("[MonEntreprise] save:", e);
      setError(e instanceof Error ? e.message : "Erreur de sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  function restore() {
    setData({ ...savedData });
  }

  async function saveBankAccounts(accounts: BankAccount[]) {
    setBankSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const val = JSON.stringify(accounts);
      if (orgId) {
        await supabase.from("org_settings").upsert(
          { organization_id: orgId, key: "brand.bank_accounts", value: val },
          { onConflict: "organization_id,key" }
        );
        // Sync compte par défaut vers les clés legacy (backward compat PDF)
        const def = accounts.find(a => a.is_default && a.is_active);
        if (def) {
          const legacyRows = [
            { organization_id: orgId, key: "brand.iban",           value: def.iban           || "" },
            { organization_id: orgId, key: "brand.bic",            value: def.bic            || "" },
            { organization_id: orgId, key: "brand.bank_name",      value: def.bank_name      || "" },
            { organization_id: orgId, key: "brand.account_number", value: def.account_number || "" },
            { organization_id: orgId, key: "brand.routing_number", value: def.routing_number || "" },
            { organization_id: orgId, key: "brand.sort_code",      value: def.sort_code      || "" },
            { organization_id: orgId, key: "brand.mobile_money",   value: def.mobile_money   || "" },
          ];
          await supabase.from("org_settings").upsert(legacyRows, { onConflict: "organization_id,key" });
        }
      } else {
        await supabase.from("user_settings").upsert(
          { user_id: user.id, key: "brand.bank_accounts", value: val },
          { onConflict: "user_id,key" }
        );
      }
      setBankAccounts(accounts);
    } catch (e) {
      console.error("[MonEntreprise] saveBankAccounts:", e);
    } finally {
      setBankSaving(false);
    }
  }

  // ── Sauvegarde clauses personnalisées ──────────────────────────────────────
  async function saveCustomClauses(clauses: CustomClause[]) {
    setClauseSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const val = JSON.stringify(clauses);
      if (orgId) {
        await supabase.from("org_settings").upsert(
          { organization_id: orgId, key: "brand.custom_clauses", value: val },
          { onConflict: "organization_id,key" }
        );
      } else {
        await supabase.from("user_settings").upsert(
          { user_id: user.id, key: "brand.custom_clauses", value: val },
          { onConflict: "user_id,key" }
        );
      }
      setCustomClauses(clauses);
    } catch (e) {
      console.error("[MonEntreprise] saveCustomClauses:", e);
    } finally {
      setClauseSaving(false);
    }
  }

  // ── Aperçu A4 mentions ────────────────────────────────────────────────────
  async function handlePreviewMentions() {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/factures/preview-mentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentions_legales:   data.mentions_legales,
          payment_conditions: data.payment_conditions,
          late_payment_clause: data.late_payment_clause,
          garantie:           data.garantie,
          template:           data.template,
          color:              data.color,
        }),
      });
      if (!res.ok) throw new Error("Erreur génération aperçu");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      console.error("[MonEntreprise] handlePreviewMentions:", e);
    } finally {
      setPreviewLoading(false);
    }
  }

  // ── Logo ──────────────────────────────────────────────────────────────────
  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo trop volumineux (max 2 Mo)."); return; }
    const reader = new FileReader();
    reader.onload = ev => setData(d => ({ ...d, logoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function up<K extends keyof Settings>(k: K, v: Settings[K]) {
    setData(d => ({ ...d, [k]: v }));
  }

  function handleCountryChange(code: string, name: string) {
    const cfg = getCountryConfig(code);
    const labelUpdates: Partial<Settings> = { country_code: code, country: name };
    cfg.tax_fields.forEach(f => {
      if (f.key === "tax_id_1") labelUpdates.tax_id_1_label = f.label;
      if (f.key === "tax_id_2") labelUpdates.tax_id_2_label = f.label;
      if (f.key === "tax_id_3") labelUpdates.tax_id_3_label = f.label;
    });
    setData(d => ({ ...d, ...labelUpdates }));
  }

  // ── Validation de format des identifiants fiscaux ────────────────────────
  function validateTaxField(
    storageKey: string,
    value: string,
    countryCode: string,
  ): { valid: boolean; message: string } | null {
    if (!value) return null;
    const digits = value.replace(/[\s\-\.]/g, "");
    // France
    if (countryCode === "FR") {
      if (storageKey === "brand.siret") {
        const d = digits.replace(/\D/g, "");
        const ok = d.length === 14;
        return { valid: ok, message: ok ? "SIRET valide — 14 chiffres" : `14 chiffres attendus (${d.length} trouvés)` };
      }
      if (storageKey === "brand.ape") {
        const clean = value.trim().replace(".", "");
        const ok = /^\d{4}[A-Z]$/i.test(clean);
        return { valid: ok, message: ok ? "Code APE valide" : "Format attendu : 4 chiffres + 1 lettre (ex : 7022Z ou 70.22Z)" };
      }
      if (storageKey === "brand.vat_number") {
        const clean = value.replace(/\s/g, "");
        const ok = /^FR[0-9A-Z]{2}\d{9}$/i.test(clean);
        return { valid: ok, message: ok ? "N° TVA valide" : "Format : FR + 2 chars + 9 chiffres (ex : FR12 123456789)" };
      }
    }
    // Sénégal
    if (countryCode === "SN") {
      if (storageKey === "brand.tax_id_1") {
        const d = digits.replace(/\D/g, "");
        const ok = d.length >= 7 && d.length <= 9;
        return { valid: ok, message: ok ? "NINEA valide" : "7 à 9 chiffres attendus" };
      }
    }
    return null;
  }

  function getTaxValue(storageKey: string): string {
    const km: Record<string, keyof Settings> = {
      "brand.siret": "siret", "brand.ape": "ape", "brand.vat_number": "vat_number",
      "brand.tax_id_1": "tax_id_1", "brand.tax_id_2": "tax_id_2", "brand.tax_id_3": "tax_id_3",
    };
    const k = km[storageKey]; return k ? String(data[k] ?? "") : "";
  }

  function setTaxValue(storageKey: string, v: string) {
    const km: Record<string, keyof Settings> = {
      "brand.siret": "siret", "brand.ape": "ape", "brand.vat_number": "vat_number",
      "brand.tax_id_1": "tax_id_1", "brand.tax_id_2": "tax_id_2", "brand.tax_id_3": "tax_id_3",
    };
    const k = km[storageKey]; if (k) setData(d => ({ ...d, [k]: v }));
  }

  function getBankValue(storageKey: string): string {
    const km: Record<string, keyof Settings> = {
      "brand.iban": "iban", "brand.bic": "bic", "brand.bank_name": "bank_name",
      "brand.routing_number": "routing_number", "brand.sort_code": "sort_code",
      "brand.account_number": "account_number", "brand.mobile_money": "mobile_money",
    };
    const k = km[storageKey]; return k ? String(data[k] ?? "") : "";
  }

  function setBankValue(storageKey: string, v: string) {
    const km: Record<string, keyof Settings> = {
      "brand.iban": "iban", "brand.bic": "bic", "brand.bank_name": "bank_name",
      "brand.routing_number": "routing_number", "brand.sort_code": "sort_code",
      "brand.account_number": "account_number", "brand.mobile_money": "mobile_money",
    };
    const k = km[storageKey]; if (k) setData(d => ({ ...d, [k]: v }));
  }

  function getPreviewRows(): { label: string; value: string }[] {
    const rows = [
      { label: "Adresse", value: [data.address, data.city].filter(Boolean).join(", ") || "—" },
      { label: "E-mail",  value: data.email  || "—" },
      { label: "Tél.",    value: data.phone  || "—" },
    ];
    if (countryConfig) {
      countryConfig.tax_fields.forEach(f => {
        const v = getTaxValue(f.storageKey);
        if (v) rows.push({ label: f.label.split(" — ")[0].split(" (")[0], value: v });
      });
      const bankField = countryConfig.bank_schema.fields[0];
      if (bankField) {
        const bv = getBankValue(bankField.storageKey);
        if (bv) rows.push({ label: bankField.label, value: bv.length > 8 ? `${bv.substring(0, 8)}…` : bv });
      }
    } else {
      if (data.siret)      rows.push({ label: "SIRET", value: data.siret });
      if (data.vat_number) rows.push({ label: "TVA",   value: data.vat_number });
      if (data.iban)       rows.push({ label: "IBAN",  value: `${data.iban.substring(0, 8)}…` });
    }
    return rows;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  const addrLabels  = countryConfig?.address_labels ?? {};
  const scoreItems  = computeScoreItems();
  const score       = computeScore();
  const scoreColor  = score >= 80 ? "#4ade80" : score >= 50 ? GOLD : "#f87171";
  const TAB_LABELS: Record<TabId, string> = { identite: "Identité", fiscalite: "Fiscalité", banque: "Banque", documents: "Documents" };

  const bg         = isDark ? "#0f1117" : "#f9fafb";
  const cardBg     = isDark ? "rgba(255,255,255,0.03)" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";
  const textMuted  = isDark ? "rgba(255,255,255,0.35)" : "#6b7280";
  const textMain   = isDark ? "#fff" : "#111827";

  return (
    <div style={{ minHeight: "100%", background: bg, paddingBottom: isDirty ? "5rem" : "1.5rem" }}>

      <div className="px-4 pb-4 pt-6 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: isDark ? "#fff" : "#111827" }}>Mon entreprise</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm" style={{ color: textMuted }}>Informations utilisées sur vos factures, devis et PDF.</span>
              {orgId && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: GOLD_DIM, color: GOLD }}>Organisation</span>
              )}
              {countryConfig && countryConfig.support_level !== "full" && (
                <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(251,191,36,0.1)", color: "rgba(251,191,36,0.9)" }}>
                  {countryConfig.support_level === "partial" ? "Support partiel" : "Support basique"}
                </span>
              )}
              {isDirty && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
                  ● Modifications non sauvegardées
                </span>
              )}
            </div>
          </div>

          {/* Bouton sauvegarde header (desktop) */}
          <div className="hidden items-center gap-2 sm:flex">
            {isDirty && (
              <button
                onClick={restore}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition"
                style={{ borderColor: cardBorder, color: textMuted }}
                title="Annuler les modifications"
              >
                <RotateCcw size={13} />
                <span className="hidden md:inline">Restaurer</span>
              </button>
            )}
            <button
              onClick={save} disabled={saving || !isDirty}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
              style={{ background: saved ? "#4ade80" : GOLD }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
              {saving ? "Enregistrement…" : saved ? "Enregistré !" : "Enregistrer"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertCircle size={14} />
            {error}
            <button className="ml-auto" onClick={() => setError("")}><X size={12} /></button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="mb-6 flex gap-0.5 rounded-xl p-1" style={{ border: `1px solid ${cardBorder}`, background: isDark ? "rgba(255,255,255,0.03)" : "#f3f4f6" }}>
          {TABS.map(tab => {
            const Icon  = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition"
                style={{
                  background: active ? (isDark ? "rgba(255,255,255,0.09)" : "#fff") : "transparent",
                  color: active ? (isDark ? "#fff" : "#111827") : (isDark ? "rgba(255,255,255,0.35)" : "#6b7280"),
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{tab.label}</span>
                {active && <span className="absolute bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded" style={{ background: GOLD }} />}
              </button>
            );
          })}
        </div>

        {/* ── Contenu 2 colonnes ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Formulaire (2/3) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl px-5 py-5 sm:px-6" style={{ border: `1px solid ${cardBorder}`, background: cardBg }}>

              {/* ── Identité ── */}
              {activeTab === "identite" && (
                <>
                  <FieldGroup label="Pays d'enregistrement" isDark={isDark}>
                    <CountrySelector value={data.country_code} onChange={handleCountryChange} isDark={isDark} />
                    {!data.country_code && (
                      <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
                        style={{ background: "rgba(251,191,36,0.07)", color: "rgba(251,191,36,0.85)", border: "1px solid rgba(251,191,36,0.15)" }}>
                        <Info size={12} className="mt-0.5 shrink-0" />
                        Sélectionnez un pays pour adapter les formes juridiques, champs fiscaux et coordonnées bancaires à votre juridiction.
                      </div>
                    )}
                    {countryConfig?.frameworks.length ? (
                      <p className="text-xs" style={{ color: textMuted }}>Cadre juridique : {countryConfig.frameworks.join(", ")}</p>
                    ) : null}
                  </FieldGroup>

                  <FieldGroup label="Identité visuelle" isDark={isDark}>
                    {/* Logo manager amélioré */}
                    <div className="rounded-xl p-4" style={{ border: `1px solid ${cardBorder}`, background: isDark ? "rgba(255,255,255,0.02)" : "#f9fafb" }}>
                      <div className="flex items-start gap-4">
                        {/* Prévisualisation logo avec toggle fond clair/sombre */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className="relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl transition hover:opacity-80"
                            style={{
                              background: logoPreviewBg === "dark" ? "#1a1f2e" : "#fff",
                              border: `1px solid ${cardBorder}`,
                            }}
                            onClick={() => logoRef.current?.click()}
                            title="Cliquer pour changer le logo"
                          >
                            {data.logoUrl ? (
                              <img src={data.logoUrl} alt="Logo" className="h-full w-full object-contain p-3" />
                            ) : (
                              <div className="flex flex-col items-center gap-1" style={{ color: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db" }}>
                                <ImagePlus size={28} />
                                <span className="text-[10px]">Ajouter</span>
                              </div>
                            )}
                          </div>
                          {/* Toggle fond de prévisualisation */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => setLogoPreviewBg("dark")}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] transition"
                              style={{
                                background: logoPreviewBg === "dark" ? GOLD_DIM : "transparent",
                                color: logoPreviewBg === "dark" ? GOLD : textMuted,
                                border: `1px solid ${logoPreviewBg === "dark" ? GOLD_BORDER : cardBorder}`,
                              }}
                            >
                              <Moon size={9} /> Sombre
                            </button>
                            <button
                              onClick={() => setLogoPreviewBg("light")}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] transition"
                              style={{
                                background: logoPreviewBg === "light" ? GOLD_DIM : "transparent",
                                color: logoPreviewBg === "light" ? GOLD : textMuted,
                                border: `1px solid ${logoPreviewBg === "light" ? GOLD_BORDER : cardBorder}`,
                              }}
                            >
                              <Sun size={9} /> Clair
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-2 pt-1">
                          <button
                            onClick={() => logoRef.current?.click()}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition"
                            style={{
                              border: `1px solid ${cardBorder}`,
                              background: isDark ? "rgba(255,255,255,0.07)" : "#f3f4f6",
                              color: isDark ? "rgba(255,255,255,0.75)" : "#374151",
                            }}
                          >
                            <Upload size={13} />
                            {data.logoUrl ? "Remplacer le logo" : "Importer un logo"}
                          </button>
                          {data.logoUrl && !confirmDelete && (
                            <button
                              onClick={() => setConfirmDelete(true)}
                              className="text-left text-xs transition"
                              style={{ color: "rgba(248,113,113,0.6)" }}
                            >
                              <X size={10} className="mr-1 inline-block" />Supprimer le logo
                            </button>
                          )}
                          {confirmDelete && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: "#f87171" }}>Supprimer définitivement ?</span>
                              <button
                                onClick={() => { up("logoUrl", null); setConfirmDelete(false); }}
                                className="rounded px-2 py-0.5 text-xs font-bold"
                                style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
                              >Oui</button>
                              <button
                                onClick={() => setConfirmDelete(false)}
                                className="rounded px-2 py-0.5 text-xs"
                                style={{ color: textMuted }}
                              >Annuler</button>
                            </div>
                          )}
                          <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#9ca3af" }}>
                            PNG · JPG · WebP · SVG — Max 2 Mo<br />
                            Préférez un fond transparent (PNG ou SVG)
                          </p>
                        </div>
                      </div>
                    </div>
                    <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogo} className="hidden" />
                  </FieldGroup>

                  <FieldGroup label="Raison sociale" isDark={isDark}>
                    <Field label="Nom commercial / Raison sociale" value={data.name}
                      onChange={v => up("name", v)} placeholder="Ex : Mon Entreprise SARL" icon={Building2} required isDark={isDark} />

                    {countryConfig ? (
                      <SelectField
                        label="Forme juridique" value={data.forme_juridique}
                        onChange={v => up("forme_juridique", v)}
                        options={countryConfig.legal_forms} isDark={isDark}
                      />
                    ) : (
                      <Field label="Forme juridique" value={data.forme_juridique}
                        onChange={v => up("forme_juridique", v)} placeholder="Ex : SARL, SAS, LLC…" isDark={isDark} />
                    )}

                    {(!countryConfig || countryConfig.legal_forms.find(f => f.val === data.forme_juridique)?.capital_required) && (
                      <Field label="Capital social" value={data.capital_social}
                        onChange={v => up("capital_social", v)}
                        placeholder={countryConfig?.currency ? `Ex : 10 000 ${countryConfig.currency}` : "Ex : 10 000 €"}
                        hint="Affiché dans les mentions légales" isDark={isDark} />
                    )}
                  </FieldGroup>

                  <FieldGroup label="Coordonnées" isDark={isDark}>
                    <Field label="Adresse" value={data.address} onChange={v => up("address", v)} placeholder="12 rue de la Paix" isDark={isDark} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={addrLabels.postal_code || "Code postal"} value={data.postal_code}
                        onChange={v => up("postal_code", v)}
                        placeholder={countryConfig?.code === "US" ? "90210" : "75001"} isDark={isDark} />
                      <Field label={addrLabels.city || "Ville"} value={data.city}
                        onChange={v => up("city", v)}
                        placeholder={countryConfig?.code === "US" ? "Los Angeles, CA" : "Paris"} isDark={isDark} />
                    </div>
                    <Field label="E-mail de contact" value={data.email}
                      onChange={v => up("email", v)} placeholder="contact@monentreprise.com" icon={Mail} type="email" isDark={isDark} />
                    <Field label="Téléphone" value={data.phone}
                      onChange={v => up("phone", v)}
                      placeholder={countryConfig ? `${countryConfig.phone_prefix} …` : "+33 1 23 45 67 89"}
                      icon={Phone} isDark={isDark} />
                    <Field label="Site web" value={data.website}
                      onChange={v => up("website", v)} placeholder="https://monentreprise.com" icon={Globe} isDark={isDark} />
                  </FieldGroup>
                </>
              )}

              {/* ── Fiscalité ── */}
              {activeTab === "fiscalite" && (
                <>
                  {/* État vide — pas de pays */}
                  {!data.country_code && (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="rounded-2xl p-6 w-full max-w-sm"
                        style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
                        <Shield size={28} className="mx-auto mb-3" style={{ color: GOLD }} />
                        <p className="mb-1 text-sm font-semibold" style={{ color: isDark ? "#fff" : "#111827" }}>
                          Pays non sélectionné
                        </p>
                        <p className="mb-4 text-xs leading-relaxed" style={{ color: textMuted }}>
                          Sélectionnez votre pays dans l&apos;onglet Identité pour afficher les champs fiscaux adaptés à votre juridiction.
                        </p>
                        <button
                          onClick={() => setActiveTab("identite")}
                          className="rounded-xl px-5 py-2 text-sm font-bold transition hover:opacity-90"
                          style={{ background: GOLD, color: "#000" }}
                        >
                          → Choisir mon pays
                        </button>
                      </div>
                    </div>
                  )}

                  {countryConfig && (
                    <>
                      {/* Bannière rôle sur les factures */}
                      <div className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3"
                        style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb", border: `1px solid ${cardBorder}` }}>
                        <FileText size={14} className="mt-0.5 shrink-0" style={{ color: textMuted }} />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "#374151" }}>
                            Ces identifiants apparaissent sur chaque facture et devis
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: textMuted }}>
                            Ils figurent en pied de page de vos documents et sont requis par la réglementation applicable à {countryConfig.name}.
                          </p>
                        </div>
                      </div>

                      {/* Champs fiscaux avec validation inline */}
                      <FieldGroup label={`Identifiants fiscaux — ${countryConfig.name}`} isDark={isDark}>
                        {countryConfig.tax_fields.map(field => {
                          const val = getTaxValue(field.storageKey);
                          const validation = validateTaxField(field.storageKey, val, countryConfig.code);
                          return (
                            <div key={field.key}>
                              <Field
                                label={field.label}
                                value={val}
                                onChange={v => setTaxValue(field.storageKey, v)}
                                placeholder={field.placeholder}
                                hint={field.hint}
                                maxLength={field.maxLength}
                                required={field.required}
                                icon={field.key === "tax_id_1" ? Hash : field.key === "tax_id_3" ? Percent : undefined}
                                isDark={isDark}
                              />
                              {val && validation && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]"
                                  style={{ color: validation.valid ? "#4ade80" : "#fbbf24" }}>
                                  {validation.valid
                                    ? <Check size={10} />
                                    : <AlertCircle size={10} />}
                                  {validation.message}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {countryConfig.support_level !== "full" && (
                          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
                            style={{ background: "rgba(148,163,184,0.06)", color: "rgba(148,163,184,0.7)", border: "1px solid rgba(148,163,184,0.12)" }}>
                            <Info size={12} className="mt-0.5 shrink-0" />
                            Support <strong>{countryConfig.support_level === "partial" ? "partiel" : "basique"}</strong> pour {countryConfig.name}. Vérifiez les formats fiscaux locaux auprès des autorités compétentes.
                          </div>
                        )}
                      </FieldGroup>

                      {/* Synthèse de validation */}
                      {countryConfig.tax_fields.some(f => !!getTaxValue(f.storageKey)) && (
                        <div className="mt-2 rounded-xl px-4 py-3"
                          style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb", border: `1px solid ${cardBorder}` }}>
                          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: textMuted }}>
                            Synthèse
                          </p>
                          <div className="space-y-2">
                            {countryConfig.tax_fields.map(field => {
                              const val = getTaxValue(field.storageKey);
                              const validation = validateTaxField(field.storageKey, val, countryConfig.code);
                              const name = field.label.split(" — ")[0].split(" (")[0];
                              return (
                                <div key={field.key} className="flex items-center justify-between gap-3">
                                  <span className="text-xs" style={{ color: textMuted }}>{name}</span>
                                  {!val ? (
                                    <span className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.18)" : "#c0c0c0" }}>
                                      Non renseigné
                                    </span>
                                  ) : !validation ? (
                                    <span className="flex items-center gap-1 text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280" }}>
                                      <Check size={9} /> Renseigné
                                    </span>
                                  ) : validation.valid ? (
                                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "#4ade80" }}>
                                      <Check size={9} /> Valide
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "#fbbf24" }}>
                                      <AlertCircle size={9} /> Format à vérifier
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <p className="mt-3 text-[10px] leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.18)" : "#c0c0c0" }}>
                            La validation de format est indicative. Consultez votre expert-comptable pour confirmer votre conformité fiscale.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── Banque ── */}
              {activeTab === "banque" && (() => {
                const activeAccounts  = bankAccounts.filter(a => a.is_active);
                const archivedAccounts = bankAccounts.filter(a => !a.is_active);

                function openAddForm() {
                  setBankEditId(null);
                  setBankForm({ country_code: data.country_code, currency: countryConfig?.currency || "EUR", is_default: activeAccounts.length === 0, is_active: true, label: "", holder_name: data.name, bank_name: "", iban: "", bic: "", account_number: "", routing_number: "", sort_code: "", mobile_money: "" });
                }

                async function handleSetDefault(id: string) {
                  const updated = bankAccounts.map(a => ({ ...a, is_default: a.id === id && a.is_active }));
                  await saveBankAccounts(updated);
                }

                async function handleArchive(id: string) {
                  let updated = bankAccounts.map(a => a.id !== id ? a : { ...a, is_active: false, is_default: false });
                  if (!updated.filter(a => a.is_active).some(a => a.is_default)) {
                    const fi = updated.findIndex(a => a.is_active);
                    if (fi >= 0) updated = updated.map((a, i) => i === fi ? { ...a, is_default: true } : a);
                  }
                  await saveBankAccounts(updated);
                  setBankConfirmId(null);
                }

                async function handleSave(form: Partial<BankAccount>) {
                  const account: BankAccount = {
                    id:             bankEditId ?? crypto.randomUUID(),
                    label:          form.label          || "",
                    holder_name:    form.holder_name     || "",
                    bank_name:      form.bank_name       || "",
                    country_code:   form.country_code    || "",
                    currency:       form.currency        || "EUR",
                    iban:           form.iban            || "",
                    bic:            form.bic             || "",
                    account_number: form.account_number  || "",
                    routing_number: form.routing_number  || "",
                    sort_code:      form.sort_code       || "",
                    mobile_money:   form.mobile_money    || "",
                    is_default:     !!form.is_default,
                    is_active:      true,
                  };
                  let updated: BankAccount[];
                  if (bankEditId) {
                    updated = bankAccounts.map(a => a.id === bankEditId ? account : (account.is_default ? { ...a, is_default: false } : a));
                  } else {
                    updated = account.is_default
                      ? [...bankAccounts.map(a => ({ ...a, is_default: false })), account]
                      : [...bankAccounts, account];
                  }
                  if (!updated.filter(a => a.is_active).some(a => a.is_default) && updated.filter(a => a.is_active).length > 0) {
                    const fi = updated.findIndex(a => a.is_active);
                    if (fi >= 0) updated = updated.map((a, ix) => ix === fi ? { ...a, is_default: true } : a);
                  }
                  await saveBankAccounts(updated);
                  setBankForm(null); setBankEditId(null);
                }

                return (
                  <>
                    {/* Info banner */}
                    <div className="mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                      style={{ background: "rgba(96,165,250,0.08)", color: "rgba(96,165,250,0.85)", border: "1px solid rgba(96,165,250,0.15)" }}>
                      <Info size={13} className="mt-0.5 shrink-0" />
                      Ces coordonnées sont communiquées aux destinataires de vos factures. Les documents déjà émis conservent les coordonnées bancaires de leur date d'émission.
                    </div>

                    {!data.country_code && (
                      <div className="mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                        style={{ background: GOLD_DIM, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>
                        <Info size={13} className="mt-0.5 shrink-0" />
                        Sélectionnez votre pays dans <strong>Identité</strong> pour des champs bancaires adaptés à votre région.
                      </div>
                    )}

                    {/* État vide */}
                    {activeAccounts.length === 0 && (
                      <div className="mb-4 flex flex-col items-center justify-center gap-3 rounded-xl py-10 text-center"
                        style={{ border: `2px dashed ${cardBorder}` }}>
                        <Landmark size={28} style={{ color: isDark ? "rgba(255,255,255,0.12)" : "#d1d5db" }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: isDark ? "#fff" : "#111827" }}>Aucun compte bancaire</p>
                          <p className="mt-0.5 text-xs" style={{ color: textMuted }}>Ajoutez vos coordonnées bancaires pour les afficher sur vos documents</p>
                        </div>
                        <button onClick={openAddForm}
                          className="mt-1 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition"
                          style={{ background: GOLD_DIM, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>
                          <Plus size={13} /> Ajouter un compte
                        </button>
                      </div>
                    )}

                    {/* Cartes de comptes */}
                    {activeAccounts.length > 0 && (
                      <div className="mb-3 space-y-3">
                        {activeAccounts.map(acc => {
                          const display = acc.iban || acc.account_number;
                          const masked  = display.length > 8
                            ? `${display.substring(0,4)} ${display.substring(4,8)} ···· ${display.slice(-4)}`
                            : display;
                          return (
                            <div key={acc.id} className="rounded-xl px-4 py-4 transition"
                              style={{
                                border: acc.is_default ? `1.5px solid ${GOLD_BORDER}` : `1px solid ${cardBorder}`,
                                background: acc.is_default ? GOLD_DIM : (isDark ? "rgba(255,255,255,0.03)" : "#fff"),
                              }}>
                              {/* En-tête carte */}
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  <CreditCard size={14} style={{ color: acc.is_default ? GOLD : textMuted, flexShrink: 0 }} />
                                  <span className="truncate text-sm font-semibold" style={{ color: isDark ? "#fff" : "#111827" }}>
                                    {acc.label || acc.bank_name || "Compte bancaire"}
                                  </span>
                                  {acc.is_default && (
                                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                      style={{ background: GOLD_DIM, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>
                                      ★ Principal
                                    </span>
                                  )}
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  {acc.currency && (
                                    <span className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                                      style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6", color: textMuted }}>
                                      {acc.currency}
                                    </span>
                                  )}
                                  {acc.country_code && (
                                    <span className="rounded px-1.5 py-0.5 text-[10px]"
                                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb", color: textMuted }}>
                                      {acc.country_code}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Détails */}
                              <div className="mb-3 ml-5 space-y-1">
                                {display && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <span style={{ color: textMuted }}>{acc.iban ? "IBAN" : "N° compte"}</span>
                                    <code className="font-mono" style={{ color: isDark ? "#fff" : "#111827" }}>{masked}</code>
                                  </div>
                                )}
                                {acc.bic && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <span style={{ color: textMuted }}>BIC/SWIFT</span>
                                    <code className="font-mono" style={{ color: isDark ? "#fff" : "#111827" }}>{acc.bic}</code>
                                  </div>
                                )}
                                {acc.bank_name && <p className="text-xs" style={{ color: textMuted }}>{acc.bank_name}</p>}
                                {acc.holder_name && <p className="text-xs" style={{ color: textMuted }}>Titulaire : {acc.holder_name}</p>}
                              </div>
                              {/* Actions */}
                              <div className="ml-5 flex flex-wrap items-center gap-1.5">
                                {!acc.is_default && (
                                  <button onClick={() => handleSetDefault(acc.id)}
                                    className="rounded-lg px-2.5 py-1 text-xs font-medium transition"
                                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6", color: textMuted, border: `1px solid ${cardBorder}` }}>
                                    Définir comme principal
                                  </button>
                                )}
                                <button onClick={() => { setBankEditId(acc.id); setBankForm({ ...acc }); }}
                                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition"
                                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6", color: textMuted, border: `1px solid ${cardBorder}` }}>
                                  Modifier
                                </button>
                                <button onClick={() => setBankConfirmId(acc.id)}
                                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition"
                                  style={{ color: "rgba(239,68,68,0.75)", border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.05)" }}>
                                  Archiver
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Bouton ajouter (quand il y a déjà au moins un compte) */}
                    {activeAccounts.length > 0 && (
                      <button onClick={openAddForm}
                        className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm transition"
                        style={{ border: `1px dashed ${cardBorder}`, color: textMuted, background: "transparent" }}>
                        <Plus size={13} /> Ajouter un compte
                      </button>
                    )}

                    {/* Comptes archivés */}
                    {archivedAccounts.length > 0 && (
                      <div className="mt-1">
                        <button onClick={() => setBankShowArchived(v => !v)}
                          className="flex items-center gap-1 text-xs"
                          style={{ color: textMuted }}>
                          <ChevronDown size={12} style={{ transform: bankShowArchived ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                          {archivedAccounts.length} compte(s) archivé(s)
                        </button>
                        {bankShowArchived && (
                          <div className="mt-2 space-y-2 opacity-50">
                            {archivedAccounts.map(acc => (
                              <div key={acc.id} className="flex items-center justify-between gap-2 rounded-xl px-4 py-3"
                                style={{ border: `1px solid ${cardBorder}`, background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa" }}>
                                <span className="text-xs" style={{ color: textMuted }}>{acc.label || acc.bank_name || "Compte archivé"}</span>
                                <button
                                  onClick={async () => {
                                    const updated = bankAccounts.map(a => a.id === acc.id ? { ...a, is_active: true, is_default: activeAccounts.length === 0 } : a);
                                    await saveBankAccounts(updated);
                                  }}
                                  className="rounded px-2 py-0.5 text-xs"
                                  style={{ color: GOLD, border: `1px solid ${GOLD_BORDER}`, background: GOLD_DIM }}>
                                  Restaurer
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modal ajout / modification */}
                    {bankForm !== null && (
                      <BankAccountModal
                        form={bankForm}
                        editId={bankEditId}
                        orgCountryCode={data.country_code}
                        isDark={isDark}
                        isSaving={bankSaving}
                        onClose={() => { setBankForm(null); setBankEditId(null); }}
                        onSave={handleSave}
                      />
                    )}

                    {/* Confirmation archivage */}
                    {bankConfirmId && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.6)" }}>
                        <div className="w-full max-w-sm rounded-2xl p-6"
                          style={{ background: isDark ? "#1a1f2e" : "#fff", border: `1px solid ${cardBorder}` }}>
                          <h3 className="mb-2 text-base font-semibold" style={{ color: isDark ? "#fff" : "#111827" }}>Archiver ce compte ?</h3>
                          <p className="mb-5 text-sm" style={{ color: textMuted }}>
                            Ce compte ne sera plus proposé sur les nouvelles factures. Les documents déjà émis ne sont pas affectés. Vous pourrez le restaurer à tout moment.
                          </p>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setBankConfirmId(null)}
                              className="rounded-xl px-4 py-2 text-sm transition"
                              style={{ border: `1px solid ${cardBorder}`, color: textMuted }}>
                              Annuler
                            </button>
                            <button onClick={() => handleArchive(bankConfirmId)}
                              className="rounded-xl px-4 py-2 text-sm font-medium transition"
                              style={{ background: "rgba(239,68,68,0.1)", color: "rgba(239,68,68,0.9)", border: "1px solid rgba(239,68,68,0.2)" }}>
                              Archiver
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* ── Documents ── */}
              {activeTab === "documents" && (() => {
                const isFR = countryConfig?.code === "FR";
                const isEN = countryConfig ? ["US","GB","CA","AU"].includes(countryConfig.code) : false;

                const mentionsQuickfills: { label: string; text: string }[] = isFR ? [
                  { label: "Micro-entrepreneur",   text: "TVA non applicable, art. 293 B du CGI." },
                  { label: "Franchise en base",    text: "TVA non applicable, art. 293 B du CGI." },
                  { label: "Auto-liquidation TVA", text: "TVA auto-liquidée par le preneur — art. 283-1 du CGI." },
                  { label: "CGA",                  text: "Membre d'un centre de gestion agréé — le règlement des honoraires par chèque est accepté." },
                ] : (countryConfig?.fiscal_mentions ?? []).map(m => ({ label: m.label, text: m.mentions }));

                const paymentQuickfills: { label: string; text: string }[] = isFR ? [
                  { label: "Dès réception",        text: "Règlement dès réception de la facture." },
                  { label: "30 jours",             text: "Règlement à 30 jours date de facture." },
                  { label: "45 jours fin de mois", text: "Règlement à 45 jours fin de mois." },
                  { label: "60 jours",             text: "Règlement à 60 jours date de facture." },
                ] : isEN ? [
                  { label: "Upon receipt", text: "Payment due upon receipt of invoice." },
                  { label: "Net 30",       text: "Payment due within 30 days of invoice date." },
                  { label: "Net 60",       text: "Payment due within 60 days of invoice date." },
                ] : [
                  { label: "30 jours", text: "Paiement sous 30 jours à compter de la date de facturation." },
                  { label: "60 jours", text: "Paiement sous 60 jours à compter de la date de facturation." },
                ];

                const latePaymentQuickfills: { label: string; text: string }[] = isFR ? [
                  {
                    label: "Standard France",
                    text: "En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal seront appliquées. Une indemnité forfaitaire de 40 € pour frais de recouvrement sera due de plein droit (art. L441-10 et D441-5 du Code de commerce).",
                  },
                  {
                    label: "Taux conventionnel 12 %",
                    text: "En cas de retard de paiement, intérêts de retard au taux annuel de 12 %. Indemnité forfaitaire pour frais de recouvrement : 40 € (art. D441-5 du Code de commerce).",
                  },
                ] : isEN ? [
                  { label: "Standard", text: "Late payments will incur interest at 1.5% per month. A flat recovery fee may apply." },
                ] : [
                  { label: "Clause standard", text: "Tout retard de paiement entraîne des pénalités de retard et des frais de recouvrement conformément à la législation applicable." },
                ];

                const chipStyle = {
                  border: `1px solid ${cardBorder}`,
                  background: isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6",
                  color: textMuted,
                };

                return (
                  <>
                    {/* 1 — Mentions légales */}
                    <FieldGroup label="Mentions légales" isDark={isDark}>
                      <TextareaField
                        label="Mentions légales par défaut" value={data.mentions_legales}
                        onChange={v => up("mentions_legales", v)}
                        placeholder={isFR ? "Ex : TVA non applicable, art. 293 B du CGI." : isEN ? "Ex : VAT registered. Company number 12345678." : "Ex : Mention légale applicable à vos factures."}
                        rows={4} hint="Affichées en pied de page de vos factures et devis" isDark={isDark}
                      />
                      {mentionsQuickfills.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {mentionsQuickfills.map(q => (
                            <button key={q.label} onClick={() => up("mentions_legales", q.text)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition hover:opacity-80"
                              style={chipStyle}>{q.label}</button>
                          ))}
                        </div>
                      )}
                    </FieldGroup>

                    {/* 2 — Conditions de paiement */}
                    <FieldGroup label="Conditions de paiement" isDark={isDark}>
                      <TextareaField
                        label="Conditions de paiement par défaut" value={data.payment_conditions}
                        onChange={v => up("payment_conditions", v)}
                        placeholder={isFR ? "Ex : Règlement à réception de facture." : "Ex : Payment due within 30 days of invoice date."}
                        rows={3} hint="Pré-rempli sur chaque nouveau document" isDark={isDark}
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        {paymentQuickfills.map(q => (
                          <button key={q.label} onClick={() => up("payment_conditions", q.text)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition hover:opacity-80"
                            style={chipStyle}>{q.label}</button>
                        ))}
                      </div>
                    </FieldGroup>

                    {/* 3 — Retards et recouvrement */}
                    <FieldGroup label="Retards et recouvrement" isDark={isDark}>
                      {isFR && (
                        <p className="mb-2 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "rgba(251,191,36,0.9)" }}>
                          Mention obligatoire sur les factures B2B en France (art. L441-10 du Code de commerce).
                        </p>
                      )}
                      <TextareaField
                        label="Clause de retard et recouvrement" value={data.late_payment_clause}
                        onChange={v => up("late_payment_clause", v)}
                        placeholder={isFR
                          ? "Ex : En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux légal seront appliquées..."
                          : "Ex : Late payments will incur interest at 1.5% per month."}
                        rows={4}
                        hint={isFR ? "Mention légalement requise — ajoutée en pied de page" : "Added to your invoice footer"}
                        isDark={isDark}
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        {latePaymentQuickfills.map(q => (
                          <button key={q.label} onClick={() => up("late_payment_clause", q.text)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition hover:opacity-80"
                            style={chipStyle}>{q.label}</button>
                        ))}
                      </div>
                    </FieldGroup>

                    {/* 4 — Mentions complémentaires */}
                    <FieldGroup label="Mentions complémentaires" isDark={isDark}>
                      <TextareaField
                        label="Garantie / RC Pro / Assurance professionnelle" value={data.garantie}
                        onChange={v => up("garantie", v)}
                        placeholder="Ex : Assuré RC Pro Allianz · N° de contrat 123456"
                        rows={3} hint="Informations complémentaires affichées en pied de page" isDark={isDark}
                      />
                    </FieldGroup>

                    {/* 5 — Bibliothèque de clauses */}
                    <FieldGroup label="Bibliothèque de clauses" isDark={isDark}>
                      <p className="mb-3 text-xs" style={{ color: textMuted }}>
                        Enregistrez vos clauses habituelles pour les réutiliser en un clic.
                      </p>

                      {customClauses.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {customClauses.map(clause => (
                            <div key={clause.id} className="rounded-xl p-3"
                              style={{ border: `1px solid ${cardBorder}`, background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb" }}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="mb-1 truncate text-xs font-semibold" style={{ color: textMain }}>{clause.label}</p>
                                  <p className="line-clamp-2 text-[11px]" style={{ color: textMuted }}>{clause.text}</p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  <button
                                    onClick={() => up("mentions_legales", (data.mentions_legales ? data.mentions_legales + "\n" : "") + clause.text)}
                                    className="rounded-lg px-2 py-1 text-[11px] font-medium transition hover:opacity-80"
                                    style={{ border: `1px solid ${GOLD_BORDER}`, color: GOLD, background: GOLD_DIM }}
                                    title="Insérer dans Mentions légales"
                                  >Insérer</button>
                                  <button
                                    onClick={() => saveCustomClauses(customClauses.filter(c => c.id !== clause.id))}
                                    className="rounded-lg px-2 py-1 text-[11px] font-medium transition hover:opacity-80"
                                    style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", background: "rgba(239,68,68,0.06)" }}
                                    title="Supprimer cette clause"
                                  >×</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {clauseForm !== null ? (
                        <div className="rounded-xl p-4 space-y-3"
                          style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_DIM }}>
                          <p className="text-xs font-semibold" style={{ color: GOLD }}>Nouvelle clause</p>
                          <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: textMuted }}>Nom de la clause</label>
                            <input
                              value={clauseForm.label}
                              onChange={e => setClauseForm(f => f ? { ...f, label: e.target.value } : f)}
                              placeholder="Ex : Pénalités de retard standard, Franchise TVA..."
                              className="w-full rounded-xl px-3 py-2 text-sm outline-none transition"
                              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "white", border: `1px solid ${cardBorder}`, color: textMain }}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: textMuted }}>Texte de la clause</label>
                            <textarea
                              value={clauseForm.text}
                              onChange={e => setClauseForm(f => f ? { ...f, text: e.target.value } : f)}
                              rows={3}
                              placeholder="Texte de la clause..."
                              className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none transition"
                              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "white", border: `1px solid ${cardBorder}`, color: textMain }}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setClauseForm(null)}
                              className="rounded-xl px-3 py-1.5 text-xs font-medium transition"
                              style={{ border: `1px solid ${cardBorder}`, color: textMuted }}>
                              Annuler
                            </button>
                            <button
                              disabled={!clauseForm.label.trim() || !clauseForm.text.trim() || clauseSaving}
                              onClick={async () => {
                                if (!clauseForm.label.trim() || !clauseForm.text.trim()) return;
                                const nc: CustomClause = { id: crypto.randomUUID(), label: clauseForm.label.trim(), text: clauseForm.text.trim() };
                                await saveCustomClauses([...customClauses, nc]);
                                setClauseForm(null);
                              }}
                              className="rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40"
                              style={{ background: GOLD, color: isDark ? "#000" : "#1a1a1a" }}>
                              {clauseSaving ? "..." : "Enregistrer"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setClauseForm({ label: "", text: "" })}
                          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition hover:opacity-80"
                          style={{ border: `1px dashed ${cardBorder}`, color: textMuted }}>
                          <Plus size={12} /> Nouvelle clause
                        </button>
                      )}
                    </FieldGroup>

                  {/* ── Aperçu A4 ───────────────────────────────────────── */}
                  <div className="rounded-2xl p-4" style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_DIM }}>
                    <div className="mb-2 flex items-center gap-2">
                      <FileText size={14} style={{ color: GOLD }} />
                      <span className="text-xs font-bold" style={{ color: GOLD }}>Aperçu A4 complet</span>
                    </div>
                    <p className="mb-3 text-xs" style={{ color: textMuted }}>
                      Génère une facture de démonstration avec vos mentions actuelles — même moteur que le PDF final.
                    </p>
                    <button
                      onClick={handlePreviewMentions}
                      disabled={previewLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-85 disabled:opacity-50"
                      style={{ background: GOLD, color: isDark ? "#000" : "#1a1a1a" }}
                    >
                      {previewLoading
                        ? <><Loader2 size={14} className="animate-spin" /> Génération en cours…</>
                        : <><FileText size={14} /> Aperçu A4</>
                      }
                    </button>
                  </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* ── Résumé (1/3) ── */}
          <div className="flex flex-col gap-4 lg:self-start">

            {/* Score de complétude */}
            <div className="rounded-2xl p-4" style={{ border: `1px solid ${cardBorder}`, background: cardBg }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "#9ca3af" }}>Complétude</span>
                <span className="text-sm font-bold" style={{ color: scoreColor }}>{score} %</span>
              </div>
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: scoreColor }} />
              </div>
              <p className="text-[11px]" style={{ color: textMuted }}>
                {scoreItems.filter(i => i.filled).length}/{scoreItems.length} informations renseignées
              </p>

              {/* Obligatoires manquants */}
              {scoreItems.some(i => i.required && !i.filled) && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#f87171" }}>Obligatoires manquants</p>
                  {scoreItems.filter(i => i.required && !i.filled).map(item => (
                    <button key={item.label} onClick={() => setActiveTab(item.tab)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition hover:opacity-80"
                      style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                      <span className="text-xs font-medium" style={{ color: "#f87171" }}>{item.label}</span>
                      <span className="shrink-0 text-[10px]" style={{ color: textMuted }}>{TAB_LABELS[item.tab]} →</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Facultatifs manquants */}
              {scoreItems.some(i => !i.required && !i.filled) && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#9ca3af" }}>Facultatifs</p>
                  {scoreItems.filter(i => !i.required && !i.filled).map(item => (
                    <button key={item.label} onClick={() => setActiveTab(item.tab)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition hover:opacity-80"
                      style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb", border: `1px solid ${cardBorder}` }}>
                      <span className="text-xs" style={{ color: textMuted }}>{item.label}</span>
                      <span className="shrink-0 text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#9ca3af" }}>{TAB_LABELS[item.tab]} →</span>
                    </button>
                  ))}
                </div>
              )}

              {scoreItems.every(i => i.filled) && (
                <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "#4ade80" }}>
                  <Check size={11} /> Profil complet
                </div>
              )}

              <p className="mt-3 text-[10px] leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.18)" : "#c0c0c0" }}>
                Ce score mesure la complétude du profil, non la conformité légale.
              </p>
            </div>

            {/* Aperçu carte entreprise */}
            <div className="rounded-2xl p-5" style={{ border: `1px solid ${cardBorder}`, background: cardBg }}>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "#9ca3af" }}>Aperçu en-tête facture</p>

              {/* Mini mockup en-tête facture — 2 colonnes seulement (logo + infos) */}
              <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${cardBorder}` }}>
                {/* Bandeau FACTURE en haut */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: cardBorder, background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}>
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>Aperçu</span>
                  <div className="text-right">
                    <span className="text-[10px] font-bold" style={{ color: isDark ? "#fff" : "#111827" }}>FACTURE</span>
                    <span className="ml-1.5 text-[9px]" style={{ color: textMuted }}>N° FAC-001</span>
                  </div>
                </div>

                <div className="px-3 py-3" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb" }}>
                  {/* 2-way flex : logo + infos entreprise */}
                  <div className="flex items-start gap-2.5">
                    {data.logoUrl ? (
                      <img src={data.logoUrl} alt="Logo" className="h-12 w-12 shrink-0 rounded-lg object-contain p-1"
                        style={{ border: `1px solid ${cardBorder}`, background: isDark ? "rgba(255,255,255,0.06)" : "#fff" }} />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
                        <Building2 size={18} style={{ color: GOLD }} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold leading-tight" style={{ color: isDark ? "#fff" : "#111827" }}>
                        {data.name || <span style={{ color: textMuted }}>Nom de l&apos;entreprise</span>}
                      </div>
                      {(data.forme_juridique || countryConfig) && (
                        <div className="truncate mt-0.5 text-[10px]" style={{ color: textMuted }}>
                          {data.forme_juridique}
                          {data.forme_juridique && countryConfig && " · "}
                          {countryConfig && <span style={{ color: GOLD }}>{countryConfig.name}</span>}
                        </div>
                      )}
                      {(data.address || data.city) && (
                        <div className="truncate mt-0.5 text-[10px]" style={{ color: textMuted }}>
                          {[data.address, data.postal_code, data.city].filter(Boolean).join(", ")}
                        </div>
                      )}
                      {data.phone && (
                        <div className="truncate mt-0.5 text-[10px]" style={{ color: textMuted }}>{data.phone}</div>
                      )}
                      {data.email && (
                        <div className="truncate mt-0.5 text-[10px]" style={{ color: textMuted }}>{data.email}</div>
                      )}
                    </div>
                  </div>

                  {/* Identifiants fiscaux */}
                  {countryConfig && countryConfig.tax_fields.some(f => !!getTaxValue(f.storageKey)) && (
                    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-0.5 border-t pt-2.5" style={{ borderColor: cardBorder }}>
                      {countryConfig.tax_fields.filter(f => !!getTaxValue(f.storageKey)).map(f => (
                        <span key={f.key} className="text-[9px]" style={{ color: textMuted }}>
                          <span style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>
                            {f.label.split(" — ")[0].split(" (")[0]} :
                          </span>{" "}
                          <span className="font-mono font-medium" style={{ color: isDark ? "rgba(255,255,255,0.65)" : "#374151" }}>
                            {getTaxValue(f.storageKey)}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton prévisualiser */}
              <Link
                href="/client/factures"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition"
                style={{
                  background: GOLD_DIM,
                  border: `1px solid ${GOLD_BORDER}`,
                  color: GOLD,
                }}
              >
                <Eye size={14} />
                Voir sur une vraie facture
              </Link>
            </div>

            {/* Conseil pays */}
            <div className="rounded-2xl p-4" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
              <div className="mb-1.5 text-sm font-semibold" style={{ color: GOLD }}>Bon à savoir</div>
              <p className="text-xs leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.55)" : "#6b7280" }}>
                {countryConfig
                  ? `Vos factures afficheront les identifiants fiscaux de ${countryConfig.name}. Les 24 modèles PDF s'adaptent automatiquement.`
                  : "Sélectionnez votre pays pour adapter les champs fiscaux et bancaires à votre juridiction."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre de sauvegarde sticky (mobile + rappel) ── */}
      {isDirty && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 py-3 shadow-lg sm:px-6"
          style={{
            background: isDark ? "rgba(15,17,23,0.95)" : "rgba(249,250,251,0.95)",
            borderTop: `1px solid ${cardBorder}`,
            backdropFilter: "blur(12px)",
          }}
        >
          <span className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>
            Modifications non sauvegardées
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={restore}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition"
              style={{ border: `1px solid ${cardBorder}`, color: textMuted }}
            >
              <RotateCcw size={13} /> Restaurer
            </button>
            <button
              onClick={save} disabled={saving}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
              style={{ background: saved ? "#4ade80" : GOLD }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
