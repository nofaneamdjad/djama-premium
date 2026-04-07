"use client";

/**
 * /admin/settings — Identité entreprise
 *
 * Gère les clés brand.* dans site_settings :
 *   logo_url · company_name · email · website · phone
 *   address · city · country · siret · ape · iban
 *
 * Logo uploadé dans le bucket Supabase Storage "logos".
 * Ces valeurs sont utilisées automatiquement dans tous les PDF.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, RefreshCw, Building2, CreditCard, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MediaUploader } from "@/components/admin/MediaUploader";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface BrandForm {
  logo_url:     string;
  company_name: string;
  email:        string;
  website:      string;
  phone:        string;
  address:      string;
  city:         string;
  country:      string;
  siret:        string;
  ape:          string;
  iban:         string;
}

const EMPTY: BrandForm = {
  logo_url:     "",
  company_name: "DJAMA",
  email:        "contact@djama.fr",
  website:      "www.djama.fr",
  phone:        "",
  address:      "",
  city:         "",
  country:      "France",
  siret:        "",
  ape:          "",
  iban:         "",
};

// Mapping clé DB → champ formulaire
const KEY_MAP: Record<string, keyof BrandForm> = {
  "brand.logo_url":     "logo_url",
  "brand.company_name": "company_name",
  "brand.email":        "email",
  "brand.website":      "website",
  "brand.phone":        "phone",
  "brand.address":      "address",
  "brand.city":         "city",
  "brand.country":      "country",
  "brand.siret":        "siret",
  "brand.ape":          "ape",
  "brand.iban":         "iban",
};

// ─────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [form,    setForm]    = useState<BrandForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const loadedRef = useRef(false);

  // ── Chargement ─────────────────────────────────────────────
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .like("key", "brand.%");

    if (error) {
      console.error("[AdminSettings] fetch error:", error);
    } else if (data && data.length > 0) {
      const next = { ...EMPTY };
      data.forEach(row => {
        const field = KEY_MAP[row.key as string];
        if (field !== undefined) next[field] = (row.value as string) ?? "";
      });
      setForm(next);
    }
    setLoading(false);
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Sauvegarde ─────────────────────────────────────────────
  async function save() {
    setSaving(true);
    try {
      const LABELS: Record<string, string> = {
        "brand.logo_url":     "URL du logo",
        "brand.company_name": "Nom entreprise",
        "brand.email":        "Email",
        "brand.website":      "Site web",
        "brand.phone":        "Téléphone",
        "brand.address":      "Adresse",
        "brand.city":         "Ville",
        "brand.country":      "Pays",
        "brand.siret":        "SIRET",
        "brand.ape":          "Code APE",
        "brand.iban":         "IBAN",
      };

      const rows = Object.entries(KEY_MAP).map(([key, field]) => ({
        key,
        value:      form[field] ?? "",
        label:      LABELS[key] ?? key,
        section:    "brand",
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("site_settings")
        .upsert(rows, { onConflict: "key" });

      if (error) throw error;
      showToast("Paramètres sauvegardés ✓");
    } catch (err) {
      console.error("[AdminSettings] save error:", err);
      showToast("Erreur lors de la sauvegarde.", false);
    } finally {
      setSaving(false);
    }
  }

  const set = (field: keyof BrandForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  // ─────────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-2xl border px-4 py-3 text-[0.82rem] font-semibold shadow-xl ${
          toast.ok
            ? "border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)] text-[#4ade80]"
            : "border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] text-[#f87171]"
        }`}>
          <Check size={13} /> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Identité entreprise</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/30">
            Ces informations sont intégrées automatiquement dans chaque PDF généré.
          </p>
        </div>
        <button
          onClick={() => { loadedRef.current = false; load(); }}
          className="mt-1 text-white/20 transition-colors hover:text-white/50"
          title="Recharger"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={20} className="animate-spin text-white/20" />
        </div>
      ) : (
        <div className="space-y-5">

          {/* ── Logo ───────────────────────────────────────── */}
          <Card icon={<Building2 size={14} className="text-[#c9a55a]" />} title="Logo">
            <MediaUploader
              type="image"
              bucket="logos"
              folder=""
              label="Logo (PNG, SVG, WebP · fond transparent recommandé · max 5 MB)"
              currentUrl={form.logo_url}
              onUrlChange={url => set("logo_url", url)}
            />
            <p className="mt-2.5 text-[0.68rem] text-white/20">
              Format idéal : fond transparent, ratio 3:1 (ex. 600 × 200 px). Redimensionné automatiquement dans le PDF.
            </p>
          </Card>

          {/* ── Informations générales ──────────────────────── */}
          <Card icon={<Building2 size={14} className="text-[#c9a55a]" />} title="Informations générales">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nom de l'entreprise *"
                value={form.company_name}
                onChange={v => set("company_name", v)}
                placeholder="DJAMA"
                span={2}
              />
              <Field
                label="Email"
                value={form.email}
                onChange={v => set("email", v)}
                placeholder="contact@djama.fr"
                type="email"
              />
              <Field
                label="Téléphone"
                value={form.phone}
                onChange={v => set("phone", v)}
                placeholder="+33 6 00 00 00 00"
                type="tel"
              />
              <Field
                label="Site web"
                value={form.website}
                onChange={v => set("website", v)}
                placeholder="www.djama.fr"
                span={2}
              />
            </div>
          </Card>

          {/* ── Adresse ─────────────────────────────────────── */}
          <Card icon={<MapPin size={14} className="text-[#c9a55a]" />} title="Adresse">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Adresse (rue)"
                value={form.address}
                onChange={v => set("address", v)}
                placeholder="12 rue de la Paix"
                span={2}
              />
              <Field
                label="Ville"
                value={form.city}
                onChange={v => set("city", v)}
                placeholder="Paris"
              />
              <Field
                label="Pays"
                value={form.country}
                onChange={v => set("country", v)}
                placeholder="France"
              />
            </div>
          </Card>

          {/* ── Mentions légales ─────────────────────────────── */}
          <Card icon={<CreditCard size={14} className="text-[#c9a55a]" />} title="Mentions légales">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="SIRET"
                value={form.siret}
                onChange={v => set("siret", v)}
                placeholder="XXX XXX XXX XXXXX"
              />
              <Field
                label="Code APE / NAF"
                value={form.ape}
                onChange={v => set("ape", v)}
                placeholder="6201Z"
              />
              <Field
                label="IBAN"
                value={form.iban}
                onChange={v => set("iban", v)}
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                span={2}
              />
            </div>
          </Card>

          {/* ── Bouton Sauvegarder ───────────────────────────── */}
          <div className="flex justify-end pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-[#c9a55a] px-6 py-3 text-[0.88rem] font-bold text-[#1a1308] shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving
                ? <Loader2 size={15} className="animate-spin" />
                : <Check size={15} />
              }
              Sauvegarder
            </button>
          </div>

          {/* ── Aperçu pied de page PDF ───────────────────────── */}
          <Card title="Aperçu pied de page PDF">
            <div className="rounded-xl bg-[#0c0c0f] px-4 py-3 text-center">
              <p className="font-mono text-[0.7rem] text-white/35">
                {[form.company_name, form.email, form.website].filter(Boolean).join("  ·  ") || "—"}
              </p>
              {(form.siret || form.ape || form.iban) && (
                <p className="mt-1 font-mono text-[0.66rem] text-white/20">
                  {[
                    form.siret && `SIRET : ${form.siret}`,
                    form.ape   && `APE : ${form.ape}`,
                    form.iban  && `IBAN : ${form.iban}`,
                  ].filter(Boolean).join("  ·  ")}
                </p>
              )}
            </div>
            {form.logo_url && (
              <div className="mt-4">
                <p className="mb-2 text-[0.7rem] text-white/25">Aperçu logo :</p>
                <div className="flex h-16 w-44 items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.logo_url}
                    alt="Logo aperçu"
                    className="max-h-12 max-w-full object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              </div>
            )}
          </Card>

        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────

function Card({
  icon, title, children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.06] bg-[#18181c] p-5">
      <div className="mb-4 flex items-center gap-2.5">
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.1)]">
            {icon}
          </div>
        )}
        <h2 className="text-[0.88rem] font-black text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", span,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="mb-1.5 block text-[0.71rem] font-bold uppercase tracking-[0.07em] text-white/30">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[0.84rem] text-white/80 placeholder:text-white/18 outline-none transition-colors focus:border-[rgba(201,165,90,0.4)]"
      />
    </div>
  );
}
