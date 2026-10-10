"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2, AlertCircle, Building2, Globe, Receipt, Users, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, GOLD, PAYS_LABELS, TERRITOIRE_LABELS } from "../decl-utils";
import type { FiscalProfile } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  onProfileChange: (p: FiscalProfile) => void;
}

const FORMES_JURIDIQUES = [
  { value: "auto_entrepreneur", label: "Auto-entrepreneur / Micro-entreprise" },
  { value: "EI",                label: "Entreprise individuelle (EI)" },
  { value: "EURL",              label: "EURL" },
  { value: "SARL",              label: "SARL" },
  { value: "SAS",               label: "SAS" },
  { value: "SASU",              label: "SASU" },
  { value: "SA",                label: "SA" },
  { value: "SNC",               label: "SNC" },
  { value: "SCI",               label: "SCI" },
  { value: "association",       label: "Association" },
  { value: "autre",             label: "Autre" },
];

const REGIMES_FISCAUX = [
  { value: "micro",          label: "Micro-entreprise" },
  { value: "reel_simplifie", label: "Réel simplifié" },
  { value: "reel_normal",    label: "Réel normal" },
  { value: "is",             label: "Impôt sur les sociétés (IS)" },
  { value: "forfait",        label: "Forfait" },
];

const REGIMES_TVA = [
  { value: "franchise",    label: "Franchise en base de TVA" },
  { value: "mensuel",      label: "TVA mensuelle (CA3)" },
  { value: "trimestriel",  label: "TVA trimestrielle (CA12)" },
  { value: "annuel",       label: "TVA annuelle" },
  { value: "non_assujetti",label: "Non assujetti à la TVA" },
];

const SECTEURS = [
  { value: "commerce",   label: "Commerce" },
  { value: "services",   label: "Services" },
  { value: "industrie",  label: "Industrie" },
  { value: "liberal",    label: "Profession libérale" },
  { value: "agricole",   label: "Agriculture" },
  { value: "numerique",  label: "Numérique / Tech" },
  { value: "artisanat",  label: "Artisanat" },
  { value: "autre",      label: "Autre" },
];

const DEVISES = ["EUR", "USD", "GBP", "CHF", "CAD", "MAD", "XOF", "AED", "SGD"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "rgba(201,165,90,0.7)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ParametresSection({ userId, isDark, profile, onProfileChange }: Props) {
  const t = tok(isDark);
  const inputStyle = {
    background: t.glass,
    border: `1px solid ${t.border}`,
    color: t.text,
    borderRadius: "0.75rem",
    padding: "0.6rem 0.875rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  };
  const selectStyle = { ...inputStyle, cursor: "pointer" };

  const [form, setForm] = useState<Partial<FiscalProfile>>({
    pays_constitution:  "FR",
    pays_activite:      ["FR"],
    territoire_fiscal:  "FRA_METRO",
    forme_juridique:    "",
    raison_sociale:     "",
    siren:              "",
    siret:              "",
    numero_tva_intra:   "",
    regime_fiscal:      "reel_normal",
    regime_tva:         "mensuel",
    assujetti_tva:      true,
    taux_tva_principal: 20,
    activite_principale:"",
    code_naf:           "",
    secteur:            "",
    devise_principale:  "EUR",
    a_salaries:         false,
    etablissements_etrangers: false,
    comptable_email:    "",
    debut_exercice:     "01-01",
    duree_exercice:     12,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        pays_constitution:       profile.pays_constitution,
        pays_activite:           profile.pays_activite ?? ["FR"],
        territoire_fiscal:       profile.territoire_fiscal ?? "FRA_METRO",
        forme_juridique:         profile.forme_juridique ?? "",
        raison_sociale:          profile.raison_sociale ?? "",
        siren:                   profile.siren ?? "",
        siret:                   profile.siret ?? "",
        numero_tva_intra:        profile.numero_tva_intra ?? "",
        regime_fiscal:           profile.regime_fiscal,
        regime_tva:              profile.regime_tva,
        assujetti_tva:           profile.assujetti_tva,
        taux_tva_principal:      profile.taux_tva_principal,
        activite_principale:     profile.activite_principale ?? "",
        code_naf:                profile.code_naf ?? "",
        secteur:                 profile.secteur ?? "",
        devise_principale:       profile.devise_principale,
        a_salaries:              profile.a_salaries,
        etablissements_etrangers:profile.etablissements_etrangers,
        comptable_email:         profile.comptable_email ?? "",
        debut_exercice:          profile.debut_exercice,
        duree_exercice:          profile.duree_exercice,
      });
    }
  }, [profile]);

  async function save() {
    if (!userId) return;
    setSaving(true); setErr(null); setSaved(false);
    const payload = { ...form, user_id: userId };
    const { data, error } = profile
      ? await supabase.from("decl_fiscal_profiles").update(payload).eq("id", profile.id).select().single()
      : await supabase.from("decl_fiscal_profiles").insert(payload).select().single();
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setSaved(true);
    onProfileChange(data as FiscalProfile);
    setTimeout(() => setSaved(false), 3000);
  }

  const set = (k: keyof FiscalProfile, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle size={13} style={{ color: GOLD }} />
          <span className="text-xs font-semibold" style={{ color: GOLD }}>Note importante</span>
        </div>
        <p className="text-xs" style={{ color: t.text3 }}>
          Ces informations déterminent vos obligations fiscales potentielles. DJAMA n&apos;applique aucun régime automatiquement —
          vérifiez toujours avec votre expert-comptable. Aucune déclaration n&apos;est transmise sans votre validation explicite.
        </p>
      </div>

      {/* Entité juridique */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}15` }}>
            <Building2 size={14} style={{ color: GOLD }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: t.text }}>Entité juridique</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Raison sociale">
            <input style={inputStyle} value={form.raison_sociale ?? ""} onChange={e => set("raison_sociale", e.target.value)} placeholder="Nom de la société" />
          </Field>
          <Field label="Forme juridique">
            <select style={selectStyle} value={form.forme_juridique ?? ""} onChange={e => set("forme_juridique", e.target.value)}>
              <option value="">— Choisir —</option>
              {FORMES_JURIDIQUES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="SIREN">
            <input style={inputStyle} value={form.siren ?? ""} onChange={e => set("siren", e.target.value)} placeholder="123 456 789" maxLength={9} />
          </Field>
          <Field label="SIRET (établissement principal)">
            <input style={inputStyle} value={form.siret ?? ""} onChange={e => set("siret", e.target.value)} placeholder="123 456 789 00012" maxLength={14} />
          </Field>
          <Field label="N° TVA intracommunautaire">
            <input style={inputStyle} value={form.numero_tva_intra ?? ""} onChange={e => set("numero_tva_intra", e.target.value)} placeholder="FR12 123456789" />
          </Field>
          <Field label="Email de votre expert-comptable">
            <input style={inputStyle} type="email" value={form.comptable_email ?? ""} onChange={e => set("comptable_email", e.target.value)} placeholder="comptable@cabinet.fr" />
          </Field>
        </div>
      </div>

      {/* Géographie fiscale */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
            <Globe size={14} style={{ color: "#3b82f6" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: t.text }}>Géographie fiscale</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Pays de constitution">
            <select style={selectStyle} value={form.pays_constitution ?? "FR"} onChange={e => set("pays_constitution", e.target.value)}>
              {Object.entries(PAYS_LABELS).map(([code, label]) => <option key={code} value={code}>{label} ({code})</option>)}
            </select>
          </Field>
          <Field label="Territoire fiscal">
            <select style={selectStyle} value={form.territoire_fiscal ?? "FRA_METRO"} onChange={e => set("territoire_fiscal", e.target.value)}>
              {Object.entries(TERRITOIRE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              <option value="AUTRE">Autre territoire</option>
            </select>
          </Field>
          <Field label="Devise principale">
            <select style={selectStyle} value={form.devise_principale ?? "EUR"} onChange={e => set("devise_principale", e.target.value)}>
              {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Début d'exercice">
            <select style={selectStyle} value={form.debut_exercice ?? "01-01"} onChange={e => set("debut_exercice", e.target.value)}>
              <option value="01-01">1er janvier</option>
              <option value="04-01">1er avril</option>
              <option value="07-01">1er juillet</option>
              <option value="10-01">1er octobre</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => set("etablissements_etrangers", !form.etablissements_etrangers)}
              className="w-10 h-5 rounded-full transition-colors relative cursor-pointer"
              style={{ background: form.etablissements_etrangers ? GOLD : t.border }}
            >
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: form.etablissements_etrangers ? "translateX(20px)" : "translateX(0)" }} />
            </div>
            <span className="text-sm" style={{ color: t.text2 }}>Établissements dans d&apos;autres pays</span>
          </label>
        </div>
      </div>

      {/* Régime fiscal & TVA */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}15` }}>
            <Receipt size={14} style={{ color: GOLD }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: t.text }}>Régime fiscal</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Régime d'imposition">
            <select style={selectStyle} value={form.regime_fiscal ?? "reel_normal"} onChange={e => set("regime_fiscal", e.target.value)}>
              {REGIMES_FISCAUX.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Régime TVA">
            <select style={selectStyle} value={form.regime_tva ?? "mensuel"} onChange={e => {
              set("regime_tva", e.target.value);
              if (e.target.value === "franchise" || e.target.value === "non_assujetti") set("assujetti_tva", false);
              else set("assujetti_tva", true);
            }}>
              {REGIMES_TVA.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          {form.assujetti_tva && (
            <Field label="Taux TVA principal (%)">
              <select style={selectStyle} value={String(form.taux_tva_principal ?? 20)} onChange={e => set("taux_tva_principal", Number(e.target.value))}>
                <option value="20">20%</option>
                <option value="10">10%</option>
                <option value="5.5">5,5%</option>
                <option value="2.1">2,1%</option>
                <option value="0">0% (export / exonéré)</option>
              </select>
            </Field>
          )}
          <Field label="Secteur d'activité">
            <select style={selectStyle} value={form.secteur ?? ""} onChange={e => set("secteur", e.target.value)}>
              <option value="">— Choisir —</option>
              {SECTEURS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Activité principale">
            <input style={inputStyle} value={form.activite_principale ?? ""} onChange={e => set("activite_principale", e.target.value)} placeholder="Ex : Conseil en informatique" />
          </Field>
          <Field label="Code NAF / APE">
            <input style={inputStyle} value={form.code_naf ?? ""} onChange={e => set("code_naf", e.target.value)} placeholder="Ex : 6201Z" />
          </Field>
        </div>
      </div>

      {/* Salariés */}
      <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
            <Users size={14} style={{ color: "#10b981" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: t.text }}>Ressources humaines</span>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => set("a_salaries", !form.a_salaries)}
            className="w-10 h-5 rounded-full transition-colors relative cursor-pointer"
            style={{ background: form.a_salaries ? "#10b981" : t.border }}
          >
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: form.a_salaries ? "translateX(20px)" : "translateX(0)" }} />
          </div>
          <span className="text-sm" style={{ color: t.text2 }}>L&apos;entreprise a des salariés (obligations URSSAF, DSN, etc.)</span>
        </label>
      </div>

      {/* Sauvegarde */}
      {err && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertCircle size={13} style={{ color: "#ef4444" }} />
          <span className="text-xs" style={{ color: "#ef4444" }}>{err}</span>
        </div>
      )}
      {saved && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <CheckCircle2 size={13} style={{ color: "#22c55e" }} />
          <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>Profil fiscal enregistré</span>
        </div>
      )}
      <button
        onClick={save}
        disabled={saving || !userId}
        className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
        style={{ background: GOLD, color: "#111" }}
      >
        <Save size={14} />
        {saving ? "Enregistrement…" : "Enregistrer le profil fiscal"}
      </button>
    </div>
  );
}
