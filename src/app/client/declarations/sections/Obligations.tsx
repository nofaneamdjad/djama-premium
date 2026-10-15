"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, CheckCircle2, AlertCircle, Info, Globe, X, BookOpen, Zap, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, GOLD, PAYS_LABELS } from "../decl-utils";
import type { Obligation, FiscalProfile, StatutCouverture } from "../decl-types";
import { computeObligations, type ObligationApplicable, type CoverageLevel } from "@/lib/declarations/obligations-engine";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  add: (msg: string, type?: "success" | "error") => void;
}

const CATEGORIES = ["toutes", "fiscale", "sociale", "administrative"] as const;
const PERIODICITES = ["mensuelle", "trimestrielle", "semestrielle", "annuelle", "ponctuelle"];

const COVERAGE_CFG: Record<CoverageLevel, { label: string; color: string }> = {
  non_disponible:       { label: "Non disponible",       color: "#9ca3af" },
  information:          { label: "Information",           color: "#6b7280" },
  calendrier_verifie:   { label: "Calendrier vérifié",   color: "#3b82f6" },
  preparation_assistee: { label: "Préparation assistée", color: "#c9a55a" },
  export_officiel:      { label: "Export officiel",      color: "#8b5cf6" },
  depot_integre:        { label: "Dépôt intégré",        color: "#22c55e" },
};

export default function ObligationsSection({ userId, isDark, profile, add }: Props) {
  const t = tok(isDark);

  // Vue : "catalogue" (moteur) ou "mes_obligations" (Supabase)
  const [view, setView]           = useState<"catalogue" | "mes_obligations">("catalogue");
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [cat, setCat]             = useState<typeof CATEGORIES[number]>("toutes");
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm]           = useState({
    libelle: "",
    type_obligation: "",
    categorie: "fiscale",
    autorite: "",
    formulaire: "",
    periodicite: "annuelle",
    pays: profile?.pays_constitution ?? "FR",
    description: "",
    source_reglementaire: "",
  });

  // Calcul du catalogue depuis le moteur (déterministe, côté client)
  const catalogueResult = useMemo(
    () => (profile ? computeObligations(profile) : null),
    [profile],
  );

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("decl_obligations")
      .select("*")
      .eq("user_id", userId)
      .order("categorie", { ascending: true })
      .then(({ data }) => {
        setObligations((data as Obligation[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  async function importFromCatalogue() {
    if (!userId || !catalogueResult || catalogueResult.obligations.length === 0) {
      add("Aucune obligation calculée pour ce profil", "error");
      return;
    }
    setImporting(true);
    const rows = catalogueResult.obligations.map(o => ({
      user_id:              userId,
      pays:                 o.pays,
      territoire:           o.territoire ?? null,
      type_obligation:      o.rule.id,
      categorie:            o.categorie,
      libelle:              o.libelle,
      description:          o.description,
      autorite:             o.autorite,
      formulaire:           o.formulaire ?? null,
      periodicite:          o.periodicite,
      source_reglementaire: o.source_reglementaire,
      date_verification:    o.date_verifiee,
      statut_couverture:    o.statut_couverture as StatutCouverture,
      active:               true,
    }));
    const { error } = await supabase.from("decl_obligations").insert(rows);
    setImporting(false);
    if (error) { add("Erreur : " + error.message, "error"); return; }
    add(`${rows.length} obligations importées`, "success");
    const { data } = await supabase.from("decl_obligations").select("*").eq("user_id", userId).order("categorie");
    setObligations((data as Obligation[]) ?? []);
    setView("mes_obligations");
  }

  async function toggle(id: string, active: boolean) {
    await supabase.from("decl_obligations").update({ active }).eq("id", id);
    setObligations(prev => prev.map(o => o.id === id ? { ...o, active } : o));
  }

  async function saveObligation() {
    if (!userId || !form.libelle.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("decl_obligations").insert({
      ...form, user_id: userId, statut_couverture: "information" as StatutCouverture, active: true,
    });
    setSaving(false);
    if (error) { add("Erreur : " + error.message, "error"); return; }
    add("Obligation ajoutée", "success");
    setShowForm(false);
    setForm({ libelle: "", type_obligation: "", categorie: "fiscale", autorite: "", formulaire: "", periodicite: "annuelle", pays: profile?.pays_constitution ?? "FR", description: "", source_reglementaire: "" });
    const { data } = await supabase.from("decl_obligations").select("*").eq("user_id", userId).order("categorie");
    setObligations((data as Obligation[]) ?? []);
  }

  const filtered = cat === "toutes" ? obligations : obligations.filter(o => o.categorie === cat);
  const byPays   = filtered.reduce((acc, o) => { (acc[o.pays] ??= []).push(o); return acc; }, {} as Record<string, Obligation[]>);

  const inputCls  = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all";
  const inputStyle = { background: t.glassMd, border: `1px solid ${t.border}`, color: t.text };

  // ─── Catalogue view ────────────────────────────────────────────────────────
  function renderCatalogue() {
    if (!profile) {
      return (
        <div className="rounded-2xl py-12 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <BookOpen size={20} className="mx-auto mb-3" style={{ color: t.text3 }} />
          <p className="text-sm" style={{ color: t.text3 }}>Configurez votre profil fiscal pour voir vos obligations.</p>
        </div>
      );
    }
    if (!catalogueResult) return null;

    const coverageCfg = COVERAGE_CFG[catalogueResult.coverage];

    const filteredObs: ObligationApplicable[] = cat === "toutes"
      ? catalogueResult.obligations
      : catalogueResult.obligations.filter(o => o.categorie === cat);

    return (
      <div className="space-y-4">
        {/* Coverage badge + warnings */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: `${coverageCfg.color}18`, color: coverageCfg.color, border: `1px solid ${coverageCfg.color}30` }}
          >
            {PAYS_LABELS[profile.pays_constitution] ?? profile.pays_constitution} — {coverageCfg.label}
          </span>
          {catalogueResult.coverage_note && (
            <span className="text-[11px]" style={{ color: t.text3 }}>{catalogueResult.coverage_note}</span>
          )}
        </div>

        {catalogueResult.warning && (
          <div className="rounded-xl px-3.5 py-3 flex items-start gap-2.5 text-xs"
            style={{ background: `${GOLD}0d`, border: `1px solid ${GOLD}25`, color: t.text2 }}>
            <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
            <span>{catalogueResult.warning}</span>
          </div>
        )}

        {filteredObs.length === 0 && (
          <div className="rounded-2xl py-12 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <Info size={18} className="mx-auto mb-3" style={{ color: t.text3 }} />
            <p className="text-sm" style={{ color: t.text3 }}>Aucune obligation dans cette catégorie pour votre profil.</p>
          </div>
        )}

        <div className="space-y-2">
          {filteredObs.map(o => {
            const cvr = COVERAGE_CFG[o.statut_couverture];
            return (
              <div
                key={o.rule.id}
                className="rounded-2xl px-4 py-3.5 transition-all"
                style={{ background: t.glass, border: `1px solid ${t.border}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: t.text }}>{o.libelle_court}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${cvr.color}18`, color: cvr.color }}
                      >
                        {cvr.label}
                      </span>
                      {o.formulaire && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: t.glassMd, color: t.text3 }}>
                          {o.formulaire}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed mb-2" style={{ color: t.text3 }}>{o.description}</p>
                    <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: t.text4 }}>
                      <span>{o.autorite}</span>
                      <span className="capitalize">{o.periodicite}</span>
                      {o.prochaine_echeance && (
                        <span style={{ color: GOLD }}>Prochaine : {new Date(o.prochaine_echeance + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                      )}
                    </div>
                  </div>
                  {o.url_autorite && (
                    <a
                      href={o.url_autorite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-lg transition-all hover:opacity-70"
                      style={{ color: t.text3 }}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <div className="mt-2 text-[10px]" style={{ color: t.text4 }}>
                  <span className="font-mono">{o.source_reglementaire}</span>
                  <span className="ml-2">— vérifié {o.date_verifiee}</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredObs.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px]" style={{ color: t.text4 }}>
              {filteredObs.length} obligation{filteredObs.length > 1 ? "s" : ""} · source vérifiée {filteredObs[0]?.date_verifiee}
            </p>
            <button
              onClick={importFromCatalogue}
              disabled={importing}
              className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-40"
              style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }}
            >
              <Zap size={12} />
              {importing ? "Import…" : "Importer dans mes obligations"}
            </button>
          </div>
        )}

        <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
          <Info size={12} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
          <p className="text-[11px]" style={{ color: t.text3 }}>
            Ce catalogue est calculé automatiquement à partir de votre profil et de règles vérifiées officiellement.
            Il est indicatif — consultez un expert-comptable pour confirmer vos obligations réelles.
            Les taux et seuils sont ceux en vigueur à la date de vérification indiquée.
          </p>
        </div>
      </div>
    );
  }

  // ─── Mes obligations view ──────────────────────────────────────────────────
  function renderMesObligations() {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(v => !v)}
              className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all active:scale-95"
              style={{ background: GOLD, color: "#111" }}
            >
              <Plus size={12} /> Ajouter
            </button>
          </div>
        </div>

        {showForm && (
          <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${GOLD}30` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: t.text }}>Nouvelle obligation</span>
              <button onClick={() => setShowForm(false)}><X size={14} style={{ color: t.text3 }} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {[
                { key: "libelle", label: "Libellé *", ph: "ex. TVA mensuelle CA3" },
                { key: "type_obligation", label: "Type (code)", ph: "ex. tva_ca3" },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>{label}</label>
                  <input className={inputCls} style={inputStyle} value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>Catégorie</label>
                <select className={inputCls} style={inputStyle} value={form.categorie}
                  onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}>
                  {["fiscale","sociale","administrative","autre"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>Périodicité</label>
                <select className={inputCls} style={inputStyle} value={form.periodicite}
                  onChange={e => setForm(p => ({ ...p, periodicite: e.target.value }))}>
                  {PERIODICITES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              {[
                { key: "autorite", label: "Autorité", ph: "ex. DGFiP, URSSAF" },
                { key: "formulaire", label: "Formulaire", ph: "ex. CA3, 2065" },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>{label}</label>
                  <input className={inputCls} style={inputStyle} value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveObligation} disabled={saving || !form.libelle.trim()}
                className="text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-40"
                style={{ background: GOLD, color: "#111" }}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-xs px-3 py-2 rounded-xl" style={{ color: t.text3 }}>Annuler</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center">
            <RefreshCw size={18} className="animate-spin mx-auto" style={{ color: t.text3 }} />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl py-12 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <Info size={20} className="mx-auto mb-3" style={{ color: t.text3 }} />
            <p className="text-sm" style={{ color: t.text3 }}>
              {obligations.length === 0
                ? "Aucune obligation enregistrée"
                : `Aucune obligation dans la catégorie "${cat}"`}
            </p>
            {profile && obligations.length === 0 && (
              <button onClick={importFromCatalogue} disabled={importing}
                className="mt-4 text-xs px-3 py-2 rounded-xl font-semibold disabled:opacity-40"
                style={{ background: `${GOLD}15`, color: GOLD }}>
                {importing ? "Import…" : "Importer depuis le catalogue"}
              </button>
            )}
          </div>
        )}

        {!loading && Object.entries(byPays).map(([pays, obs]) => (
          <div key={pays}>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={12} style={{ color: t.text3 }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.text3 }}>
                {PAYS_LABELS[pays] ?? pays}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: t.glassMd, color: t.text4 }}>{obs.length}</span>
            </div>
            <div className="space-y-2">
              {obs.map(o => {
                const cvr = COVERAGE_CFG[(o.statut_couverture ?? "information") as CoverageLevel] ?? COVERAGE_CFG.information;
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                    style={{ background: t.glass, border: `1px solid ${o.active ? t.border : t.borderSoft}`, opacity: o.active ? 1 : 0.5 }}
                  >
                    <button onClick={() => toggle(o.id, !o.active)} className="shrink-0">
                      {o.active
                        ? <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
                        : <AlertCircle size={16} style={{ color: t.text4 }} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: t.text }}>{o.libelle}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {o.autorite && <span className="text-[10px]" style={{ color: t.text3 }}>{o.autorite}</span>}
                        {o.formulaire && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: t.glassMd, color: t.text3 }}>{o.formulaire}</span>}
                        <span className="text-[10px] capitalize" style={{ color: t.text4 }}>{o.periodicite}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ color: cvr.color, background: `${cvr.color}18` }}>
                      {cvr.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!loading && obligations.length > 0 && (
          <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
            <Info size={12} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
            <p className="text-[11px]" style={{ color: t.text3 }}>
              DJAMA n&apos;applique aucun régime automatiquement.
              Consultez un expert-comptable pour vérifier vos obligations réelles.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Vue toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 rounded-xl p-1" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          {([
            { id: "catalogue",       label: "Catalogue calculé" },
            { id: "mes_obligations", label: "Mes obligations"   },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={view === id
                ? { background: GOLD, color: "#111" }
                : { color: t.text2 }
              }
            >
              {label}
              {id === "mes_obligations" && !loading && (
                <span className="ml-1.5 text-[10px] opacity-60">{obligations.length}</span>
              )}
            </button>
          ))}
        </div>
        {/* Category filter */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-all"
              style={cat === c
                ? { background: GOLD, color: "#111" }
                : { background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {view === "catalogue"       ? renderCatalogue()       : renderMesObligations()}
    </div>
  );
}
