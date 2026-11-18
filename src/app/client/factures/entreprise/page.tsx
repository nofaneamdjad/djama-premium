"use client";

/**
 * Mon entreprise — Internationalisation complète.
 * Le sélecteur de pays est le point de départ : il pilote dynamiquement
 * les formes juridiques, les champs fiscaux, le schéma bancaire et les
 * mentions légales de référence.
 *
 * Stockage : user_settings + org_settings via clés brand.*
 * Backward compat : brand.siret / brand.ape / brand.vat_number conservés pour
 * les entreprises françaises existantes.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import {
  Building2, Mail, Phone, Globe, Hash, Shield, Landmark,
  FileText, ImagePlus, Save, Check, ChevronDown, Loader2,
  X, AlertCircle, Info, CreditCard, Percent, Upload, Search,
  MapPin, Smartphone,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  COUNTRY_LIST, getCountryConfig, inferCountryCode,
  type CountryConfig,
} from "@/lib/i18n/countries";

const GOLD       = "#c9a55a";
const GOLD_DIM   = "rgba(201,165,90,0.12)";
const GOLD_BORDER= "rgba(201,165,90,0.30)";

// ─── Modèle de données ────────────────────────────────────────────────────────

interface Settings {
  // Identité
  name:             string;
  email:            string;
  phone:            string;
  website:          string;
  address:          string;
  postal_code:      string;
  city:             string;
  country:          string;   // nom affiché (backward compat)
  country_code:     string;   // ISO 3166-1 alpha-2
  logoUrl:          string | null;
  forme_juridique:  string;
  capital_social:   string;
  // Fiscalité France (backward compat)
  siret:            string;
  ape:              string;
  vat_number:       string;
  // Fiscalité internationale générique
  tax_id_1:         string;
  tax_id_1_label:   string;
  tax_id_2:         string;
  tax_id_2_label:   string;
  tax_id_3:         string;
  tax_id_3_label:   string;
  // Banque SEPA (backward compat)
  iban:             string;
  bic:              string;
  // Banque internationale
  bank_name:        string;
  routing_number:   string;
  sort_code:        string;
  account_number:   string;
  mobile_money:     string;
  // Documents
  garantie:         string;
  mentions_legales: string;
  template:         string;
  color:            string;
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
  garantie: "", mentions_legales: "", template: "min-ligne", color: GOLD,
};

// Toutes les clés brand.* sauvegardées
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
  garantie:         "brand.garantie",
  mentions_legales: "brand.mentions_legales",
  template:         "brand.template",
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
  value, onChange,
}: { value: string; onChange: (code: string, name: string) => void }) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
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
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(c: CountryConfig) {
    onChange(c.code, c.name);
    setOpen(false);
    setQuery("");
  }

  const supportBadge: Record<string, { label: string; color: string }> = {
    full:    { label: "Vérifié",  color: "rgba(74,222,128,0.85)" },
    partial: { label: "Partiel",  color: "rgba(251,191,36,0.85)" },
    basic:   { label: "Basique",  color: "rgba(148,163,184,0.7)" },
  };

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-white/40">
        Pays <span style={{ color: GOLD }}>*</span>
        <span className="ml-2 text-[10px] text-white/20">(détermine les formes juridiques, champs fiscaux et bancaires)</span>
      </label>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(""); }}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white transition hover:border-white/[0.15] focus:border-[#c9a55a]/45 focus:outline-none"
      >
        {cfg ? (
          <span className="flex items-center gap-2">
            <MapPin size={12} className="text-white/30" />
            <span>{cfg.name}</span>
            <span className="text-xs text-white/35">{cfg.currency}</span>
            {cfg.frameworks.length > 0 && (
              <span className="rounded px-1 text-[10px]" style={{ background: GOLD_DIM, color: GOLD }}>
                {cfg.frameworks[0]}
              </span>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-white/30">
            <MapPin size={12} />
            Sélectionner un pays…
          </span>
        )}
        <ChevronDown size={12} className="shrink-0 text-white/30" />
      </button>

      {open && (
        <div className="ent-country-dropdown absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border shadow-2xl">
          <div className="ent-country-search-header sticky top-0 border-b">
            <div className="relative p-2">
              <Search size={12} className="ent-search-icon pointer-events-none absolute left-5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un pays…"
                className="ent-country-input w-full rounded-lg py-2 pl-8 pr-3 text-sm outline-none"
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="ent-country-empty px-4 py-3 text-sm">Aucun résultat</p>
          ) : (
            filtered.map(c => {
              const badge = supportBadge[c.support_level];
              const isSelected = c.code === value;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => select(c)}
                  className={`ent-country-row flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition${isSelected ? " ent-country-row-selected" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="ent-country-name font-medium">{c.name}</span>
                    <span className="ent-country-code text-xs">{c.code}</span>
                    {c.frameworks.length > 0 && (
                      <span className="ent-country-fw-badge rounded px-1 text-[10px]">
                        {c.frameworks[0]}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="ent-country-currency text-xs">{c.currency}</span>
                    <span className="ent-country-support-badge text-[10px]" data-level={c.support_level}>
                      {badge.label}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Micro-composants ─────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", hint, icon: Icon, required, disabled, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
  icon?: React.ElementType; required?: boolean; disabled?: boolean; maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/40">
        {label}{required && <span style={{ color: GOLD }}> *</span>}
      </label>
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
          disabled={disabled}
          maxLength={maxLength}
          className={`w-full rounded-xl border border-white/[0.09] bg-white/[0.04] py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/[0.15] focus:border-[#c9a55a]/45 focus:ring-2 focus:ring-[#c9a55a]/10 disabled:opacity-40 ${Icon ? "pl-9 pr-4" : "px-4"}`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-white/20">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { val: string; label: string }[]; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/40">{label}</label>
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
      {hint && <p className="mt-1 text-xs text-white/20">{hint}</p>}
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 4, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/40">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/[0.15] focus:border-[#c9a55a]/45 focus:ring-2 focus:ring-[#c9a55a]/10"
      />
      {hint && <p className="mt-1 text-xs text-white/20">{hint}</p>}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MonEntreprise() {
  const { isDark } = useTheme();
  const [data,      setData]      = useState<Settings>({ ...DEFAULTS });
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("identite");
  const [orgId,     setOrgId]     = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const countryConfig: CountryConfig | null = data.country_code
    ? getCountryConfig(data.country_code)
    : null;

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
        const { data: d } = await supabase
          .from("org_settings")
          .select("key,value")
          .eq("organization_id", activeOrgId)
          .like("key", "brand.%");
        rows = (d ?? []) as typeof rows;
      } else {
        const { data: d } = await supabase
          .from("user_settings")
          .select("key,value")
          .like("key", "brand.%");
        rows = (d ?? []) as typeof rows;
      }

      const map: Record<string, string> = {};
      rows.forEach(r => { map[r.key] = r.value; });

      // Résolution du code pays (backward compat : inférer depuis le nom textuel)
      const rawCode    = map["brand.country_code"] || "";
      const rawCountry = map["brand.country"] || "";
      const resolvedCode = rawCode || inferCountryCode(rawCountry);

      // Si on a un code pays, synchroniser les labels depuis le registre
      let taxLabels: Record<string, string> = {};
      if (resolvedCode) {
        const cfg = getCountryConfig(resolvedCode);
        cfg.tax_fields.forEach(f => {
          if (!map[`${f.storageKey}_label`]) {
            taxLabels[`${f.key}_label`] = f.label;
          }
        });
      }

      setData({
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
        garantie:         map["brand.garantie"]         || "",
        mentions_legales: map["brand.mentions_legales"] || "",
        template:         map["brand.template"]         || "min-ligne",
        color:            map["brand.color"]            || GOLD,
      });
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
        const { error: err } = await supabase
          .from("org_settings")
          .upsert(rows, { onConflict: "organization_id,key" });
        if (err) throw err;
      } else {
        const rows = entries.map(e => ({ ...e, user_id: user.id }));
        const { error: err } = await supabase
          .from("user_settings")
          .upsert(rows, { onConflict: "user_id,key" });
        if (err) throw err;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("[MonEntreprise] save:", e);
      setError(e instanceof Error ? e.message : "Erreur de sauvegarde.");
    } finally {
      setSaving(false);
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

  // ── Sélection de pays : met à jour les labels depuis le registre ──────────
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

  // ── Lecture des champs fiscaux dynamiques ─────────────────────────────────
  function getTaxValue(storageKey: string): string {
    // Mapping storage key → état local
    const keyMap: Record<string, keyof Settings> = {
      "brand.siret":      "siret",
      "brand.ape":        "ape",
      "brand.vat_number": "vat_number",
      "brand.tax_id_1":   "tax_id_1",
      "brand.tax_id_2":   "tax_id_2",
      "brand.tax_id_3":   "tax_id_3",
    };
    const k = keyMap[storageKey];
    return k ? String(data[k] ?? "") : "";
  }

  function setTaxValue(storageKey: string, v: string) {
    const keyMap: Record<string, keyof Settings> = {
      "brand.siret":      "siret",
      "brand.ape":        "ape",
      "brand.vat_number": "vat_number",
      "brand.tax_id_1":   "tax_id_1",
      "brand.tax_id_2":   "tax_id_2",
      "brand.tax_id_3":   "tax_id_3",
    };
    const k = keyMap[storageKey];
    if (k) setData(d => ({ ...d, [k]: v }));
  }

  function getBankValue(storageKey: string): string {
    const keyMap: Record<string, keyof Settings> = {
      "brand.iban":           "iban",
      "brand.bic":            "bic",
      "brand.bank_name":      "bank_name",
      "brand.routing_number": "routing_number",
      "brand.sort_code":      "sort_code",
      "brand.account_number": "account_number",
      "brand.mobile_money":   "mobile_money",
    };
    const k = keyMap[storageKey];
    return k ? String(data[k] ?? "") : "";
  }

  function setBankValue(storageKey: string, v: string) {
    const keyMap: Record<string, keyof Settings> = {
      "brand.iban":           "iban",
      "brand.bic":            "bic",
      "brand.bank_name":      "bank_name",
      "brand.routing_number": "routing_number",
      "brand.sort_code":      "sort_code",
      "brand.account_number": "account_number",
      "brand.mobile_money":   "mobile_money",
    };
    const k = keyMap[storageKey];
    if (k) setData(d => ({ ...d, [k]: v }));
  }

  // ── Aperçu — libellés adaptatifs ──────────────────────────────────────────
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
      // Banque
      const bankField = countryConfig.bank_schema.fields[0];
      if (bankField) {
        const bv = getBankValue(bankField.storageKey);
        if (bv) rows.push({ label: bankField.label, value: bv.length > 8 ? `${bv.substring(0, 8)}…` : bv });
      }
    } else {
      if (data.siret) rows.push({ label: "SIRET", value: data.siret });
      if (data.vat_number) rows.push({ label: "TVA", value: data.vat_number });
      if (data.iban) rows.push({ label: "IBAN", value: `${data.iban.substring(0, 8)}…` });
    }

    return rows;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={22} className="animate-spin text-white/20" />
      </div>
    );
  }

  const addrLabels = countryConfig?.address_labels ?? {};

  return (
    <div className={`min-h-full ${isDark ? "bg-[#0f1117] ent-dark" : "bg-gray-50 ent-light"}`}>
      <style>{`
        .ent-light [class*="bg-white/[0.04]"] { background-color: #ffffff !important; }
        .ent-light [class*="bg-white/[0.03]"] { background-color: rgba(0,0,0,0.025) !important; }
        .ent-light [class*="bg-white/[0.07]"] { background-color: rgba(0,0,0,0.045) !important; }
        .ent-light [class*="bg-white/[0.09]"] { background-color: rgba(0,0,0,0.055) !important; }
        .ent-light [class*="border-white/[0.07]"] { border-color: rgba(0,0,0,0.08) !important; }
        .ent-light [class*="border-white/[0.09]"] { border-color: #e5e7eb !important; }
        .ent-light [class*="border-white/[0.1]"]  { border-color: rgba(0,0,0,0.10) !important; }
        .ent-light [class*="border-white/[0.15]"] { border-color: rgba(0,0,0,0.15) !important; }
        .ent-light [class*="text-white/"] { color: #6b7280 !important; }
        .ent-light .text-white { color: #111827 !important; }
        .ent-light [class*="placeholder:text-white"]::placeholder { color: #d1d5db !important; }
        .ent-light select option { background: #ffffff !important; color: #111827 !important; }
        .ent-light input, .ent-light select, .ent-light textarea {
          color: #111827 !important; background-color: #ffffff !important; border-color: #e5e7eb !important;
        }
        .ent-light input:focus, .ent-light select:focus, .ent-light textarea:focus {
          border-color: rgba(201,165,90,0.5) !important;
        }

        /* ── CountrySelector dropdown — mode clair ─────────────────────── */
        .ent-light .ent-country-dropdown {
          background: #ffffff !important;
          border-color: #e5e7eb !important;
        }
        .ent-light .ent-country-search-header {
          background: #f9fafb !important;
          border-color: #e5e7eb !important;
        }
        .ent-light .ent-country-input {
          background: #ffffff !important;
          color: #111827 !important;
          border: 1px solid #e5e7eb !important;
        }
        .ent-light .ent-country-input::placeholder { color: #9ca3af !important; }
        .ent-light .ent-search-icon { color: #9ca3af !important; }
        .ent-light .ent-country-row { color: #111827 !important; }
        .ent-light .ent-country-row:hover { background: rgba(0,0,0,0.04) !important; }
        .ent-light .ent-country-row-selected { background: rgba(201,165,90,0.08) !important; }
        .ent-light .ent-country-name { color: #111827 !important; }
        .ent-light .ent-country-code { color: #6b7280 !important; }
        .ent-light .ent-country-currency { color: #9ca3af !important; }
        .ent-light .ent-country-empty { color: #9ca3af !important; }
        .ent-light .ent-country-fw-badge {
          background: rgba(0,0,0,0.06) !important;
          color: #374151 !important;
        }
        .ent-light .ent-country-support-badge[data-level="full"]    { color: #15803d !important; }
        .ent-light .ent-country-support-badge[data-level="partial"] { color: #b45309 !important; }
        .ent-light .ent-country-support-badge[data-level="basic"]   { color: #6b7280 !important; }

        /* ── CountrySelector dropdown — mode sombre ────────────────────── */
        .ent-dark .ent-country-dropdown {
          background: #1a1f2e;
          border-color: rgba(255,255,255,0.1);
        }
        .ent-dark .ent-country-search-header {
          background: #1a1f2e;
          border-color: rgba(255,255,255,0.07);
        }
        .ent-dark .ent-country-input {
          background: rgba(255,255,255,0.06);
          color: #ffffff;
        }
        .ent-dark .ent-country-input::placeholder { color: rgba(255,255,255,0.25); }
        .ent-dark .ent-search-icon { color: rgba(255,255,255,0.3); }
        .ent-dark .ent-country-row { color: #ffffff; }
        .ent-dark .ent-country-row:hover { background: rgba(255,255,255,0.06); }
        .ent-dark .ent-country-row-selected { background: rgba(201,165,90,0.12); }
        .ent-dark .ent-country-name { color: #ffffff; }
        .ent-dark .ent-country-code { color: rgba(255,255,255,0.35); }
        .ent-dark .ent-country-currency { color: rgba(255,255,255,0.3); }
        .ent-dark .ent-country-empty { color: rgba(255,255,255,0.3); }
        .ent-dark .ent-country-fw-badge {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
        }
        .ent-dark .ent-country-support-badge[data-level="full"]    { color: rgba(74,222,128,0.85); }
        .ent-dark .ent-country-support-badge[data-level="partial"] { color: rgba(251,191,36,0.85); }
        .ent-dark .ent-country-support-badge[data-level="basic"]   { color: rgba(148,163,184,0.7); }
      `}</style>

      <div className="px-6 py-6">

        {/* ── Header ── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Mon entreprise</h1>
            <p className="mt-0.5 text-sm text-white/35">
              Informations utilisées sur vos factures, devis et PDF.
              {orgId && (
                <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: GOLD_DIM, color: GOLD }}>
                  Organisation
                </span>
              )}
              {countryConfig && countryConfig.support_level !== "full" && (
                <span className="ml-2 rounded-full px-2 py-0.5 text-[10px]"
                  style={{ background: "rgba(251,191,36,0.1)", color: "rgba(251,191,36,0.9)" }}>
                  {countryConfig.support_level === "partial" ? "Support partiel" : "Support basique"}
                </span>
              )}
            </p>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            style={{ background: saved ? "#4ade80" : GOLD }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? "Enregistrement…" : saved ? "Enregistré !" : "Enregistrer"}
          </button>
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
        <div className="mb-6 flex gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-white/[0.09] text-white shadow-sm" : "text-white/35 hover:text-white/60"
                }`}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{tab.label}</span>
                {active && <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded" style={{ background: GOLD }} />}
              </button>
            );
          })}
        </div>

        {/* ── Contenu ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Formulaire (2/3) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-5">

              {/* ── Identité ── */}
              {activeTab === "identite" && (
                <>
                  {/* Sélecteur pays en tête */}
                  <FieldGroup label="Pays d'enregistrement">
                    <CountrySelector
                      value={data.country_code}
                      onChange={handleCountryChange}
                    />
                    {!data.country_code && (
                      <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
                        style={{ background: "rgba(251,191,36,0.07)", color: "rgba(251,191,36,0.85)", border: "1px solid rgba(251,191,36,0.15)" }}>
                        <Info size={12} className="mt-0.5 shrink-0" />
                        Sélectionnez un pays pour adapter les formes juridiques, les champs fiscaux et les coordonnées bancaires à votre juridiction.
                      </div>
                    )}
                    {countryConfig && countryConfig.frameworks.length > 0 && (
                      <p className="text-xs text-white/30">
                        Cadre juridique : {countryConfig.frameworks.join(", ")}
                      </p>
                    )}
                  </FieldGroup>

                  <FieldGroup label="Logo">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.05] transition hover:opacity-80"
                        onClick={() => logoRef.current?.click()}
                      >
                        {data.logoUrl ? (
                          <img src={data.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                        ) : (
                          <ImagePlus size={22} className="text-white/20" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          onClick={() => logoRef.current?.click()}
                          className="rounded-lg border border-white/[0.1] bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:bg-white/[0.09]"
                        >
                          <Upload size={11} className="mr-1.5 inline-block" />
                          {data.logoUrl ? "Remplacer le logo" : "Importer un logo"}
                        </button>
                        {data.logoUrl && (
                          <button onClick={() => up("logoUrl", null)} className="text-left text-xs text-red-400/60 transition hover:text-red-400">
                            <X size={10} className="mr-1 inline-block" />Supprimer
                          </button>
                        )}
                        <p className="text-xs text-white/20">PNG ou SVG recommandé · Max 2 Mo</p>
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                    </div>
                  </FieldGroup>

                  <FieldGroup label="Raison sociale">
                    <Field label="Nom commercial / Raison sociale" value={data.name}
                      onChange={v => up("name", v)} placeholder="Ex : Mon Entreprise SARL" icon={Building2} required />

                    {/* Formes juridiques dynamiques par pays */}
                    {countryConfig ? (
                      <SelectField
                        label="Forme juridique"
                        value={data.forme_juridique}
                        onChange={v => up("forme_juridique", v)}
                        options={countryConfig.legal_forms}
                      />
                    ) : (
                      <Field label="Forme juridique" value={data.forme_juridique}
                        onChange={v => up("forme_juridique", v)} placeholder="Ex : SARL, SAS, LLC…" />
                    )}

                    {/* Capital social — affiché si la forme le requiert */}
                    {(!countryConfig ||
                      countryConfig.legal_forms.find(f => f.val === data.forme_juridique)?.capital_required) && (
                      <Field label="Capital social" value={data.capital_social}
                        onChange={v => up("capital_social", v)}
                        placeholder={countryConfig?.currency ? `Ex : 10 000 ${countryConfig.currency}` : "Ex : 10 000 €"}
                        hint="Affiché dans les mentions légales" />
                    )}
                  </FieldGroup>

                  <FieldGroup label="Coordonnées">
                    <Field label="Adresse" value={data.address}
                      onChange={v => up("address", v)} placeholder="12 rue de la Paix" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label={addrLabels.postal_code || "Code postal"}
                        value={data.postal_code}
                        onChange={v => up("postal_code", v)}
                        placeholder={countryConfig?.code === "US" ? "90210" : "75001"}
                      />
                      <Field
                        label={addrLabels.city || "Ville"}
                        value={data.city}
                        onChange={v => up("city", v)}
                        placeholder={countryConfig?.code === "US" ? "Los Angeles, CA" : "Paris"}
                      />
                    </div>
                    <Field label="E-mail de contact" value={data.email}
                      onChange={v => up("email", v)} placeholder="contact@monentreprise.com" icon={Mail} type="email" />
                    <Field label="Téléphone" value={data.phone}
                      onChange={v => up("phone", v)}
                      placeholder={countryConfig ? `${countryConfig.phone_prefix} …` : "+33 1 23 45 67 89"}
                      icon={Phone} />
                    <Field label="Site web" value={data.website}
                      onChange={v => up("website", v)} placeholder="https://monentreprise.com" icon={Globe} />
                  </FieldGroup>
                </>
              )}

              {/* ── Fiscalité ── */}
              {activeTab === "fiscalite" && (
                <>
                  {!data.country_code && (
                    <div className="mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                      style={{ background: "rgba(251,191,36,0.07)", color: "rgba(251,191,36,0.85)", border: "1px solid rgba(251,191,36,0.15)" }}>
                      <Info size={13} className="mt-0.5 shrink-0" />
                      Sélectionnez d'abord votre pays dans l'onglet <strong>Identité</strong> pour afficher les champs fiscaux adaptés.
                    </div>
                  )}

                  {countryConfig && (
                    <FieldGroup label={`Identifiants fiscaux — ${countryConfig.name}`}>
                      {countryConfig.tax_fields.map(field => (
                        <Field
                          key={field.key}
                          label={field.label}
                          value={getTaxValue(field.storageKey)}
                          onChange={v => setTaxValue(field.storageKey, v)}
                          placeholder={field.placeholder}
                          hint={field.hint}
                          maxLength={field.maxLength}
                          required={field.required}
                          icon={field.key === "tax_id_1" ? Hash : field.key === "tax_id_3" ? Percent : undefined}
                        />
                      ))}

                      {countryConfig.support_level !== "full" && (
                        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
                          style={{ background: "rgba(148,163,184,0.06)", color: "rgba(148,163,184,0.7)", border: "1px solid rgba(148,163,184,0.12)" }}>
                          <Info size={12} className="mt-0.5 shrink-0" />
                          <span>
                            Support <strong>{countryConfig.support_level === "partial" ? "partiel" : "basique"}</strong> pour {countryConfig.name}.
                            Les formats et validations locaux ne sont pas intégralement vérifiés.
                          </span>
                        </div>
                      )}
                    </FieldGroup>
                  )}

                  {/* Régimes fiscaux — uniquement pour les pays qui en ont */}
                  {countryConfig && countryConfig.fiscal_mentions.length > 0 && (
                    <FieldGroup label="Régime fiscal — sélectionner pour pré-remplir les mentions">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {countryConfig.fiscal_mentions.map(r => {
                          const active = data.mentions_legales === r.mentions;
                          return (
                            <button
                              key={r.label}
                              onClick={() => up("mentions_legales", r.mentions)}
                              className="rounded-xl border px-4 py-3 text-left text-sm transition"
                              style={{
                                background: active ? GOLD_DIM : "rgba(255,255,255,0.03)",
                                borderColor: active ? GOLD_BORDER : "rgba(255,255,255,0.07)",
                              }}
                            >
                              <div className="font-semibold text-white">{r.label}</div>
                              <div className="mt-1 line-clamp-2 text-[11px] text-white/40">{r.mentions}</div>
                            </button>
                          );
                        })}
                      </div>
                    </FieldGroup>
                  )}

                  {/* Fallback : pas de pays sélectionné — afficher les champs génériques */}
                  {!countryConfig && (
                    <FieldGroup label="Identifiants fiscaux (génériques)">
                      <Field label="Numéro d'identification fiscal"
                        value={data.tax_id_1} onChange={v => up("tax_id_1", v)}
                        placeholder="Numéro fiscal" icon={Hash} />
                      <Field label="Numéro d'enregistrement"
                        value={data.tax_id_2} onChange={v => up("tax_id_2", v)}
                        placeholder="Registre du commerce" />
                      <Field label="Numéro de TVA"
                        value={data.tax_id_3} onChange={v => up("tax_id_3", v)}
                        placeholder="N° TVA" icon={Percent} />
                    </FieldGroup>
                  )}
                </>
              )}

              {/* ── Banque ── */}
              {activeTab === "banque" && (
                <>
                  <div className="mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                    style={{ background: "rgba(96,165,250,0.08)", color: "rgba(96,165,250,0.85)", border: "1px solid rgba(96,165,250,0.15)" }}>
                    <Info size={13} className="mt-0.5 shrink-0" />
                    <span>
                      Ces informations sont affichées sur vos factures pour faciliter le paiement.
                      Elles ne sont jamais transmises à des tiers.
                    </span>
                  </div>

                  {!data.country_code && (
                    <div className="mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                      style={{ background: "rgba(251,191,36,0.07)", color: "rgba(251,191,36,0.85)", border: "1px solid rgba(251,191,36,0.15)" }}>
                      <Info size={13} className="mt-0.5 shrink-0" />
                      Sélectionnez votre pays dans l'onglet <strong>Identité</strong> pour voir les champs bancaires adaptés à votre région.
                    </div>
                  )}

                  <FieldGroup label={countryConfig ? `Coordonnées bancaires — ${countryConfig.name}` : "Coordonnées bancaires"}>
                    {countryConfig ? (
                      countryConfig.bank_schema.fields.map(field => (
                        <Field
                          key={field.storageKey}
                          label={field.label}
                          value={getBankValue(field.storageKey)}
                          onChange={v => setBankValue(field.storageKey, v)}
                          placeholder={field.placeholder}
                          hint={field.hint}
                          required={field.required}
                          icon={
                            field.storageKey === "brand.iban" || field.storageKey === "brand.account_number"
                              ? CreditCard
                              : field.storageKey === "brand.mobile_money"
                              ? Smartphone
                              : undefined
                          }
                        />
                      ))
                    ) : (
                      <>
                        <Field label="IBAN" value={data.iban} onChange={v => up("iban", v)}
                          placeholder="FR76 3000 6000 0112 3456 7890 189" icon={CreditCard} />
                        <Field label="BIC / SWIFT" value={data.bic} onChange={v => up("bic", v)}
                          placeholder="BNPAFRPPXXX" />
                      </>
                    )}
                  </FieldGroup>

                  <FieldGroup label="Garantie professionnelle">
                    <TextareaField
                      label="Assurance / Garantie professionnelle"
                      value={data.garantie}
                      onChange={v => up("garantie", v)}
                      placeholder="Ex : Assuré RC Pro — Cabinet Allianz, contrat n° 123456"
                      rows={3}
                      hint="Optionnel — affiché en pied de document"
                    />
                  </FieldGroup>
                </>
              )}

              {/* ── Documents ── */}
              {activeTab === "documents" && (
                <>
                  <FieldGroup label="Mentions légales par défaut">
                    <TextareaField
                      label="Mentions légales"
                      value={data.mentions_legales}
                      onChange={v => up("mentions_legales", v)}
                      placeholder={
                        countryConfig?.code === "FR"
                          ? "Ex : TVA non applicable, art. 293 B du CGI."
                          : "Ex : Délai de paiement : 30 jours. Pénalités de retard applicables."
                      }
                      rows={5}
                      hint="Pré-remplies sur chaque nouveau document — adaptez selon votre régime fiscal"
                    />

                    {/* Boutons de remplissage rapide depuis le registre */}
                    {countryConfig && countryConfig.fiscal_mentions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {countryConfig.fiscal_mentions.map(r => (
                          <button
                            key={r.label}
                            onClick={() => up("mentions_legales", r.mentions)}
                            className="rounded-lg border border-white/[0.09] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/50 transition hover:bg-white/[0.07] hover:text-white/75"
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </FieldGroup>

                  <FieldGroup label="Garantie professionnelle">
                    <TextareaField
                      label="Texte de garantie / assurance"
                      value={data.garantie}
                      onChange={v => up("garantie", v)}
                      placeholder="Ex : Assuré RC Pro Allianz · N° de contrat 123456"
                      rows={3}
                      hint="Affiché en pied de page de vos documents"
                    />
                  </FieldGroup>

                  {countryConfig && (
                    <div className="rounded-xl px-4 py-3"
                      style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.1)" }}>
                      <p className="mb-2 text-xs font-semibold text-white/40">Paramètres pays détectés</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-white/30">Devise par défaut</span>
                          <span className="ml-2 font-mono font-semibold text-white/60">{countryConfig.currency}</span>
                        </div>
                        <div>
                          <span className="text-white/30">Préfixe tél.</span>
                          <span className="ml-2 font-mono font-semibold text-white/60">{countryConfig.phone_prefix}</span>
                        </div>
                        {countryConfig.frameworks.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-white/30">Cadre juridique</span>
                            <span className="ml-2 font-semibold text-white/60">{countryConfig.frameworks.join(", ")}</span>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-white/30">Support DJAMA</span>
                          <span className="ml-2 font-semibold" style={{
                            color: countryConfig.support_level === "full" ? "rgba(74,222,128,0.85)"
                              : countryConfig.support_level === "partial" ? "rgba(251,191,36,0.85)"
                              : "rgba(148,163,184,0.7)"
                          }}>
                            {countryConfig.support_level === "full" ? "Vérifié"
                              : countryConfig.support_level === "partial" ? "Partiel — validez les informations fiscales locales"
                              : "Basique — saisie libre"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Résumé (1/3) ── */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/25">Aperçu</p>
              <div className="flex items-center gap-3">
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg border border-white/[0.1] bg-white/[0.05] object-contain p-1" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
                    <Building2 size={16} style={{ color: GOLD }} />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white">{data.name || "Nom de l'entreprise"}</div>
                  <div className="text-xs text-white/35">
                    {data.forme_juridique || "Forme juridique"}{" "}
                    {countryConfig && <span style={{ color: GOLD }}>· {countryConfig.name}</span>}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {getPreviewRows().map(row => (
                  <div key={row.label} className="flex justify-between gap-2">
                    <span className="text-[11px] text-white/30">{row.label}</span>
                    <span className="max-w-[140px] truncate text-right text-[11px] font-medium text-white/60">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
              <div className="mb-1.5 text-sm font-semibold" style={{ color: GOLD }}>Bon à savoir</div>
              <p className="text-xs leading-relaxed text-white/55">
                {countryConfig
                  ? `Vos factures afficheront les identifiants fiscaux de ${countryConfig.name}. Les 24 modèles PDF s'adaptent automatiquement.`
                  : "Sélectionnez votre pays pour adapter les champs fiscaux et bancaires à votre juridiction."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
