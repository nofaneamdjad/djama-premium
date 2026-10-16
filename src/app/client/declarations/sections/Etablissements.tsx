"use client";

import { useState, useEffect } from "react";
import {
  Building2, Plus, Pencil, PowerOff, Power, X,
  Globe, Banknote, ChevronDown, MapPin, Hash, Save, Receipt,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, GOLD } from "../decl-utils";
import { getCountryEntry } from "@/lib/declarations/countries-registry";
import type { DeclEtablissement, FiscalProfile } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  add: (msg: string, type?: "success" | "error") => void;
}

// ── Constantes locales ────────────────────────────────────────────────────────

const FORMES = [
  "SARL", "SAS", "SASU", "EURL", "SA", "SNC", "LLC", "GmbH",
  "Ltd", "S.A.", "S.L.", "BV", "AB", "Sdn Bhd", "Pte Ltd", "autre",
];

const REGIMES_FISCAUX = [
  { value: "micro",          label: "Micro-entreprise" },
  { value: "reel_simplifie", label: "Réel simplifié" },
  { value: "reel_normal",    label: "Réel normal" },
  { value: "is",             label: "IS (Impôt sur les sociétés)" },
  { value: "forfait",        label: "Forfait" },
  { value: "autre",          label: "Autre" },
];

const REGIMES_TVA = [
  { value: "mensuel",       label: "TVA mensuelle" },
  { value: "trimestriel",   label: "TVA trimestrielle" },
  { value: "annuel",        label: "TVA annuelle" },
  { value: "franchise",     label: "Franchise en base" },
  { value: "non_assujetti", label: "Non assujetti" },
];

const DEVISES = ["EUR", "USD", "GBP", "CHF", "CAD", "MAD", "XOF", "XAF", "AED", "SGD", "JPY", "CNY", "INR", "BRL"];

const COVERAGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  non_disponible:      { bg: "rgba(100,116,139,0.15)", text: "#64748b", label: "Non couvert" },
  information:         { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", label: "Information" },
  calendrier_verifie:  { bg: "rgba(168,85,247,0.12)",  text: "#c084fc", label: "Calendrier" },
  preparation_assistee:{ bg: "rgba(201,165,90,0.15)",  text: "#c9a55a", label: "Préparation" },
  export_officiel:     { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", label: "Export officiel" },
  depot_integre:       { bg: "rgba(16,185,129,0.12)",  text: "#34d399", label: "Dépôt intégré" },
};

// ── Types formulaire ─────────────────────────────────────────────────────────

type FormData = Omit<DeclEtablissement, "id" | "user_id" | "profile_id" | "created_at" | "updated_at">;

const EMPTY_FORM: FormData = {
  nom: "",
  pays: "",
  territoire_fiscal: null,
  adresse: null,
  identifiant_local: null,
  numero_tva_local: null,
  devise_locale: "EUR",
  forme_juridique_locale: null,
  regime_fiscal_local: null,
  assujetti_tva_local: false,
  regime_tva_local: null,
  a_salaries_local: false,
  date_debut_activite: null,
  actif: true,
  notes: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputCls(t: ReturnType<typeof tok>) {
  return {
    background: t.glass,
    border: `1px solid ${t.border}`,
    color: t.text,
    borderRadius: "0.75rem",
    padding: "0.55rem 0.875rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  } as React.CSSProperties;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: "rgba(201,165,90,0.7)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function CoverageBadge({ pays }: { pays: string }) {
  const entry = getCountryEntry(pays);
  if (!entry) return null;
  const cfg = COVERAGE_COLORS[entry.statut] ?? COVERAGE_COLORS.non_disponible;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.text }}>
      {cfg.label}
    </span>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function Etablissements({ userId, isDark, profile, add }: Props) {
  const t = tok(isDark);
  const inp = inputCls(t);

  const [items, setItems]       = useState<DeclEtablissement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<DeclEtablissement | null>(null);
  const [form, setForm]         = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    fetchItems();
  }, [userId]);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("decl_etablissements")
      .select("*")
      .eq("user_id", userId!)
      .order("created_at", { ascending: true });
    if (error) {
      add("Erreur de chargement des établissements", "error");
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }

  // ── Ouvrir formulaire ──────────────────────────────────────────────────────

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item: DeclEtablissement) {
    setEditing(item);
    setForm({
      nom:                   item.nom,
      pays:                  item.pays,
      territoire_fiscal:     item.territoire_fiscal,
      adresse:               item.adresse,
      identifiant_local:     item.identifiant_local,
      numero_tva_local:      item.numero_tva_local,
      devise_locale:         item.devise_locale,
      forme_juridique_locale: item.forme_juridique_locale,
      regime_fiscal_local:   item.regime_fiscal_local,
      assujetti_tva_local:   item.assujetti_tva_local,
      regime_tva_local:      item.regime_tva_local,
      a_salaries_local:      item.a_salaries_local,
      date_debut_activite:   item.date_debut_activite,
      actif:                 item.actif,
      notes:                 item.notes,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!userId || !form.nom.trim() || !form.pays.trim()) {
      add("Nom et pays sont obligatoires", "error");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      nom:            form.nom.trim(),
      user_id:        userId,
      profile_id:     profile?.id ?? null,
      territoire_fiscal: form.territoire_fiscal?.trim() || null,
      adresse:           form.adresse?.trim() || null,
      identifiant_local: form.identifiant_local?.trim() || null,
      numero_tva_local:  form.numero_tva_local?.trim() || null,
      notes:             form.notes?.trim() || null,
      regime_tva_local:  form.assujetti_tva_local ? form.regime_tva_local : null,
    };

    if (editing) {
      const { error } = await supabase
        .from("decl_etablissements")
        .update(payload)
        .eq("id", editing.id)
        .eq("user_id", userId);
      if (error) {
        add("Erreur lors de la modification", "error");
      } else {
        add("Établissement modifié");
        closeForm();
        fetchItems();
      }
    } else {
      const { error } = await supabase
        .from("decl_etablissements")
        .insert(payload);
      if (error) {
        add("Erreur lors de la création", "error");
      } else {
        add("Établissement ajouté");
        closeForm();
        fetchItems();
      }
    }
    setSaving(false);
  }

  // ── Toggle actif ───────────────────────────────────────────────────────────

  async function toggleActif(item: DeclEtablissement) {
    const newActif = !item.actif;
    const { error } = await supabase
      .from("decl_etablissements")
      .update({ actif: newActif })
      .eq("id", item.id)
      .eq("user_id", userId!);
    if (error) {
      add("Erreur lors de la mise à jour", "error");
    } else {
      add(newActif ? "Établissement réactivé" : "Établissement désactivé");
      setConfirmOff(null);
      fetchItems();
    }
  }

  // ── Field change ───────────────────────────────────────────────────────────

  function set(key: keyof FormData, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const active  = items.filter(i => i.actif);
  const inactive = items.filter(i => !i.actif);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold" style={{ color: t.text }}>
            Établissements secondaires
          </h3>
          <p className="text-xs mt-0.5" style={{ color: t.text3 }}>
            Gérez les entités de votre groupe dans différents pays
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}
        >
          <Plus size={14} />
          Ajouter
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12" style={{ color: t.text3 }}>
          Chargement…
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center flex flex-col items-center gap-3"
          style={{ background: t.glass, border: `1px solid ${t.border}` }}
        >
          <Building2 size={40} style={{ color: `${GOLD}60` }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: t.text }}>
              Aucun établissement secondaire
            </p>
            <p className="text-xs mt-1" style={{ color: t.text3 }}>
              Ajoutez les filiales ou succursales de votre groupe à l'étranger
            </p>
          </div>
          <button
            onClick={openNew}
            className="mt-2 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
            style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}
          >
            <Plus size={14} />
            Ajouter un établissement
          </button>
        </div>
      )}

      {/* Active establishments */}
      {!loading && active.length > 0 && (
        <div className="space-y-3 mb-6">
          {active.map(item => (
            <EtablissementCard
              key={item.id}
              item={item}
              t={t}
              expanded={expanded === item.id}
              onToggleExpand={() => setExpanded(prev => prev === item.id ? null : item.id)}
              onEdit={() => openEdit(item)}
              onToggleActif={() => setConfirmOff(item.id)}
              confirmOff={confirmOff === item.id}
              onConfirmOff={() => toggleActif(item)}
              onCancelOff={() => setConfirmOff(null)}
            />
          ))}
        </div>
      )}

      {/* Inactive establishments */}
      {!loading && inactive.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: t.text4 }}>
            Désactivés ({inactive.length})
          </p>
          <div className="space-y-2 opacity-60">
            {inactive.map(item => (
              <EtablissementCard
                key={item.id}
                item={item}
                t={t}
                expanded={expanded === item.id}
                onToggleExpand={() => setExpanded(prev => prev === item.id ? null : item.id)}
                onEdit={() => openEdit(item)}
                onToggleActif={() => toggleActif(item)}
                confirmOff={false}
                onConfirmOff={() => {}}
                onCancelOff={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: isDark ? "#1a1a2e" : "#ffffff",
              border: `1px solid ${t.border}`,
              maxHeight: "90dvh",
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2">
                <Building2 size={16} style={{ color: GOLD }} />
                <span className="font-semibold text-sm" style={{ color: t.text }}>
                  {editing ? "Modifier l'établissement" : "Nouvel établissement"}
                </span>
              </div>
              <button onClick={closeForm}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: t.text3 }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Nom */}
              <Field label="Nom de l'établissement *">
                <input
                  style={inp}
                  placeholder="Ex : Filiale Maroc"
                  value={form.nom}
                  onChange={e => set("nom", e.target.value)}
                />
              </Field>

              {/* Pays + Devise */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Pays *">
                  <CountrySelect value={form.pays} onChange={v => set("pays", v)} inp={inp} t={t} />
                </Field>
                <Field label="Devise locale">
                  <select style={inp} value={form.devise_locale}
                    onChange={e => set("devise_locale", e.target.value)}>
                    {DEVISES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Territoire fiscal */}
              <Field label="Territoire fiscal (si différent du pays)">
                <input
                  style={inp}
                  placeholder="Ex : RE, YT, NC…"
                  value={form.territoire_fiscal ?? ""}
                  onChange={e => set("territoire_fiscal", e.target.value || null)}
                />
              </Field>

              {/* Forme juridique */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Forme juridique locale">
                  <select style={inp}
                    value={form.forme_juridique_locale ?? ""}
                    onChange={e => set("forme_juridique_locale", e.target.value || null)}>
                    <option value="">— Sélectionner —</option>
                    {FORMES.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Régime fiscal local">
                  <select style={inp}
                    value={form.regime_fiscal_local ?? ""}
                    onChange={e => set("regime_fiscal_local", e.target.value || null)}>
                    <option value="">— Sélectionner —</option>
                    {REGIMES_FISCAUX.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Identifiants */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Identifiant fiscal local">
                  <input style={inp}
                    placeholder="N° SIRET, NIF, KvK…"
                    value={form.identifiant_local ?? ""}
                    onChange={e => set("identifiant_local", e.target.value || null)}
                  />
                </Field>
                <Field label="N° TVA local">
                  <input style={inp}
                    placeholder="Ex : MA12345678"
                    value={form.numero_tva_local ?? ""}
                    onChange={e => set("numero_tva_local", e.target.value || null)}
                  />
                </Field>
              </div>

              {/* TVA */}
              <div className="rounded-xl p-4 space-y-4"
                style={{ background: t.glassMd, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    value={form.assujetti_tva_local}
                    onChange={v => set("assujetti_tva_local", v)}
                    isDark={isDark}
                  />
                  <span className="text-sm" style={{ color: t.text2 }}>
                    Assujetti à la TVA dans ce pays
                  </span>
                </div>
                {form.assujetti_tva_local && (
                  <Field label="Régime TVA local">
                    <select style={inp}
                      value={form.regime_tva_local ?? ""}
                      onChange={e => set("regime_tva_local", e.target.value || null)}>
                      <option value="">— Sélectionner —</option>
                      {REGIMES_TVA.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>

              {/* Salariés */}
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  value={form.a_salaries_local}
                  onChange={v => set("a_salaries_local", v)}
                  isDark={isDark}
                />
                <span className="text-sm" style={{ color: t.text2 }}>
                  Emploie des salariés dans ce pays
                </span>
              </div>

              {/* Date début */}
              <Field label="Date de début d'activité">
                <input
                  type="date"
                  style={inp}
                  value={form.date_debut_activite ?? ""}
                  onChange={e => set("date_debut_activite", e.target.value || null)}
                />
              </Field>

              {/* Adresse */}
              <Field label="Adresse">
                <textarea
                  style={{ ...inp, resize: "vertical", minHeight: "80px" }}
                  placeholder="Adresse complète de l'établissement"
                  value={form.adresse ?? ""}
                  onChange={e => set("adresse", e.target.value || null)}
                />
              </Field>

              {/* Notes */}
              <Field label="Notes internes">
                <textarea
                  style={{ ...inp, resize: "vertical", minHeight: "70px" }}
                  placeholder="Informations complémentaires…"
                  value={form.notes ?? ""}
                  onChange={e => set("notes", e.target.value || null)}
                />
              </Field>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
              style={{ borderTop: `1px solid ${t.border}` }}>
              <button
                onClick={closeForm}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: t.glass, color: t.text2, border: `1px solid ${t.border}` }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}50` }}
              >
                <Save size={14} />
                {saving ? "Enregistrement…" : editing ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card établissement ────────────────────────────────────────────────────────

interface CardProps {
  item: DeclEtablissement;
  t: ReturnType<typeof tok>;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onToggleActif: () => void;
  confirmOff: boolean;
  onConfirmOff: () => void;
  onCancelOff: () => void;
}

function EtablissementCard({
  item, t, expanded, onToggleExpand, onEdit,
  onToggleActif, confirmOff, onConfirmOff, onCancelOff,
}: CardProps) {
  const entry = getCountryEntry(item.pays);
  const countryLabel = entry?.label ?? item.pays;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: t.glass, border: `1px solid ${t.border}` }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4">
        {/* Flag emoji approximation via country code */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
          style={{ background: `${GOLD}14` }}
        >
          <FlagEmoji code={item.pays} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate" style={{ color: t.text }}>
              {item.nom}
            </span>
            <CoverageBadge pays={item.pays} />
            {!item.actif && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                Inactif
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs flex items-center gap-1" style={{ color: t.text3 }}>
              <Globe size={11} />
              {countryLabel}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: t.text3 }}>
              <Banknote size={11} />
              {item.devise_locale}
            </span>
            {item.regime_fiscal_local && (
              <span className="text-xs" style={{ color: t.text4 }}>
                {item.regime_fiscal_local}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg transition-colors"
            title="Modifier"
            style={{ color: t.text3 }}
          >
            <Pencil size={14} />
          </button>
          {item.actif ? (
            confirmOff ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: "#f87171" }}>Désactiver ?</span>
                <button onClick={onConfirmOff}
                  className="px-2 py-1 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                  Oui
                </button>
                <button onClick={onCancelOff}
                  className="px-2 py-1 rounded-lg text-xs font-medium"
                  style={{ background: t.glass, color: t.text3 }}>
                  Non
                </button>
              </div>
            ) : (
              <button
                onClick={onToggleActif}
                className="p-1.5 rounded-lg transition-colors"
                title="Désactiver"
                style={{ color: t.text3 }}
              >
                <PowerOff size={14} />
              </button>
            )
          ) : (
            <button
              onClick={onToggleActif}
              className="p-1.5 rounded-lg transition-colors"
              title="Réactiver"
              style={{ color: "#4ade80" }}
            >
              <Power size={14} />
            </button>
          )}
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: t.text3, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          className="px-5 pb-4 pt-1 grid grid-cols-2 gap-x-6 gap-y-2"
          style={{ borderTop: `1px solid ${t.border}` }}
        >
          <DetailRow label="Identifiant local" value={item.identifiant_local} icon={<Hash size={11} />} t={t} />
          <DetailRow label="N° TVA local" value={item.numero_tva_local} icon={<Receipt size={11} />} t={t} />
          <DetailRow label="Forme juridique" value={item.forme_juridique_locale} icon={<Building2 size={11} />} t={t} />
          <DetailRow label="Territoire fiscal" value={item.territoire_fiscal} icon={<MapPin size={11} />} t={t} />
          <DetailRow label="TVA assujetti" value={item.assujetti_tva_local ? "Oui" : "Non"} t={t} />
          {item.assujetti_tva_local && (
            <DetailRow label="Régime TVA" value={item.regime_tva_local} t={t} />
          )}
          <DetailRow label="Salariés" value={item.a_salaries_local ? "Oui" : "Non"} t={t} />
          <DetailRow label="Début d'activité" value={item.date_debut_activite} t={t} />
          {item.adresse && (
            <div className="col-span-2">
              <DetailRow label="Adresse" value={item.adresse} t={t} />
            </div>
          )}
          {item.notes && (
            <div className="col-span-2">
              <DetailRow label="Notes" value={item.notes} t={t} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label, value, icon, t,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
  t: ReturnType<typeof tok>;
}) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs flex items-center gap-1 mb-0.5" style={{ color: t.text4 }}>
        {icon}
        {label}
      </span>
      <span className="text-xs font-medium" style={{ color: t.text2 }}>{value}</span>
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function ToggleSwitch({
  value, onChange, isDark,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
      style={{ background: value ? GOLD : isDark ? "#374151" : "#d1d5db" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
        style={{
          background: "#fff",
          transform: value ? "translateX(20px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

function FlagEmoji({ code }: { code: string }) {
  if (!code || code.length !== 2) return <Globe size={14} />;
  try {
    const emoji = code.toUpperCase().split("").map(c =>
      String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
    ).join("");
    return <span>{emoji}</span>;
  } catch {
    return <Globe size={14} />;
  }
}

function CountrySelect({
  value, onChange, inp, t,
}: {
  value: string;
  onChange: (v: string) => void;
  inp: React.CSSProperties;
  t: ReturnType<typeof tok>;
}) {
  // Importer dynamiquement depuis countries-registry
  const [countries, setCountries] = useState<{ code: string; label: string }[]>([]);

  useEffect(() => {
    import("@/lib/declarations/countries-registry").then(m => {
      setCountries(
        m.WORLD_COUNTRIES
          .slice()
          .sort((a, b) => a.label.localeCompare(b.label, "fr"))
          .map(c => ({ code: c.code, label: c.label }))
      );
    });
  }, []);

  return (
    <select style={inp} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">— Sélectionner un pays —</option>
      {countries.map(c => (
        <option key={c.code} value={c.code}>{c.label}</option>
      ))}
    </select>
  );
}

