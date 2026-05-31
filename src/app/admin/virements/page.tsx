"use client";

import { useEffect, useState } from "react";
import {
  Banknote, Plus, X, Check, Loader2, Trash2,
  RefreshCw, Search, CheckCircle2, XCircle,
  Clock, AlertTriangle, Calendar, Euro,
  Shield, ChevronRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Virement {
  id:                string;
  email:             string;
  nom:               string;
  montant:           number;
  jour_prelevement:  number;
  dernier_paiement:  string | null;
  prochain_paiement: string | null;
  acces_actif:       boolean;
  notes:             string | null;
  created_at:        string;
}

type VirementStatus = "actif" | "en_retard" | "bloque" | "nouveau";

function getVirementStatus(v: Virement): VirementStatus {
  if (!v.acces_actif && !v.dernier_paiement) return "nouveau";
  if (!v.acces_actif) return "bloque";
  if (!v.prochain_paiement) return "actif";
  const today = new Date();
  const due   = new Date(v.prochain_paiement);
  if (due < today) return "en_retard";
  return "actif";
}

const STATUS_CFG: Record<VirementStatus, { label: string; color: string; bg: string; border: string }> = {
  actif:      { label: "Actif",      color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.2)"   },
  en_retard:  { label: "En retard",  color: "#f9a826", bg: "rgba(249,168,38,0.08)",   border: "rgba(249,168,38,0.25)"  },
  bloque:     { label: "Bloqué",     color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.22)" },
  nouveau:    { label: "Nouveau",    color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.2)"   },
};

const EMPTY_FORM = {
  email: "", nom: "", montant: "11.90",
  jour_prelevement: "1", notes: "",
};

// ─────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────

export default function AdminVirementsPage() {
  const [virements,   setVirements]   = useState<Virement[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [formErr,     setFormErr]     = useState<string | null>(null);
  const [acting,      setActing]      = useState<string | null>(null); // id en cours
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/admin/virements");
    const json = await res.json() as { data?: Virement[] };
    setVirements(json.data ?? []);
    setLoading(false);
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), ok ? 3500 : 6000);
  }

  /* ── Marquer paiement reçu ── */
  async function markPaye(v: Virement) {
    setActing(v.id + ":paye");
    const res  = await fetch("/api/admin/virements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id, action: "paye", email: v.email, nom: v.nom }),
    });
    const json = await res.json() as { success?: boolean; prochain?: string };
    setActing(null);
    if (res.ok && json.success) {
      showToast(`✓ Paiement enregistré — accès débloqué pour ${v.nom}`);
      load();
    } else {
      showToast("Erreur lors de l'activation.", false);
    }
  }

  /* ── Bloquer l'accès ── */
  async function bloquer(v: Virement) {
    setActing(v.id + ":bloquer");
    const res  = await fetch("/api/admin/virements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id, action: "bloquer", email: v.email }),
    });
    const json = await res.json() as { success?: boolean };
    setActing(null);
    if (res.ok && json.success) {
      showToast(`Accès bloqué — ${v.nom}`, true);
      load();
    } else {
      showToast("Erreur lors du blocage.", false);
    }
  }

  /* ── Créer un virement ── */
  async function create() {
    if (!form.email.trim() || !form.nom.trim()) {
      setFormErr("Email et nom sont obligatoires."); return;
    }
    const montant = parseFloat(form.montant);
    if (isNaN(montant) || montant <= 0) {
      setFormErr("Montant invalide."); return;
    }
    setSaving(true); setFormErr(null);
    const res  = await fetch("/api/admin/virements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:            form.email.trim().toLowerCase(),
        nom:              form.nom.trim(),
        montant,
        jour_prelevement: parseInt(form.jour_prelevement) || 1,
        notes:            form.notes.trim() || null,
      }),
    });
    const json = await res.json() as { success?: boolean; error?: string };
    setSaving(false);
    if (res.ok && json.success) {
      setShowForm(false);
      setForm(EMPTY_FORM);
      showToast(`${form.nom} ajouté aux virements ✓`);
      load();
    } else {
      setFormErr(json.error ?? "Erreur serveur.");
    }
  }

  /* ── Supprimer ── */
  async function deleteVirement(id: string) {
    await fetch("/api/admin/virements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setConfirmDel(null);
    showToast("Virement supprimé");
    load();
  }

  /* ── Filtrage ── */
  const filtered = virements.filter(v => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.email.toLowerCase().includes(q) || v.nom.toLowerCase().includes(q);
  });

  /* ── Stats ── */
  const nbActif    = virements.filter(v => getVirementStatus(v) === "actif").length;
  const nbRetard   = virements.filter(v => getVirementStatus(v) === "en_retard").length;
  const nbBloque   = virements.filter(v => getVirementStatus(v) === "bloque").length;
  const masseTotal = virements.filter(v => v.acces_actif).reduce((s, v) => s + v.montant, 0);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const fmtEur = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  // ─────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={[
          "fixed right-6 top-6 z-50 flex max-w-sm items-start gap-2 rounded-2xl border px-4 py-3 text-[0.82rem] font-semibold shadow-xl",
          toast.ok
            ? "border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)] text-[#4ade80]"
            : "border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] text-[#f87171]",
        ].join(" ")}>
          {toast.ok ? <Check size={13} className="mt-0.5 shrink-0"/> : <AlertTriangle size={13} className="mt-0.5 shrink-0"/>}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(74,222,128,0.1)]">
            <Banknote size={17} className="text-[#4ade80]" />
          </div>
          <div>
            <h1 className="text-[1.3rem] font-black text-white">Virements récurrents</h1>
            <p className="text-[0.78rem] text-white/30">
              {virements.length} abonné{virements.length !== 1 ? "s" : ""} ·{" "}
              <span className="text-[#4ade80]">{nbActif} actif{nbActif !== 1 ? "s" : ""}</span>
              {nbRetard > 0 && <> · <span className="text-[#f9a826]">{nbRetard} en retard</span></>}
              {nbBloque > 0 && <> · <span className="text-[#f87171]">{nbBloque} bloqué{nbBloque !== 1 ? "s" : ""}</span></>}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormErr(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 rounded-2xl bg-[#4ade80] px-4 py-2.5 text-[0.83rem] font-bold text-[#0a1a0a] transition-opacity hover:opacity-90"
        >
          <Plus size={14} /> Ajouter virement
        </button>
      </div>

      {/* Alerte en retard */}
      {nbRetard > 0 && (
        <div className="rounded-2xl border border-[rgba(249,168,38,0.22)] bg-[rgba(249,168,38,0.05)] px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="shrink-0 text-[#f9a826]" />
            <p className="flex-1 text-[0.84rem] font-semibold text-[#f9a826]">
              {nbRetard} virement{nbRetard > 1 ? "s" : ""} en retard — relance ou blocage requis
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Actifs",        val: nbActif,           color: "#4ade80"  },
          { label: "En retard",     val: nbRetard,          color: "#f9a826"  },
          { label: "Bloqués",       val: nbBloque,          color: "#f87171"  },
          { label: "CA virements",  val: fmtEur(masseTotal),color: "#c9a55a"  },
        ].map(k => (
          <div key={k.label}
            className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-4">
            <p className="text-[0.68rem] font-medium uppercase tracking-wider text-white/25">{k.label}</p>
            <p className="mt-1 text-xl font-black" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="w-full rounded-2xl border border-white/[0.06] bg-[#18181c] py-2.5 pl-10 pr-4 text-[0.84rem] text-white/70 placeholder:text-white/20 outline-none focus:border-[rgba(74,222,128,0.3)]"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#18181c] py-16 text-white/20">
            <Banknote size={28} />
            <p className="text-[0.83rem]">{search ? "Aucun résultat" : "Aucun virement configuré"}</p>
            {!search && (
              <button onClick={() => setShowForm(true)} className="text-[0.78rem] text-[#4ade80] hover:opacity-80">
                + Ajouter le premier virement
              </button>
            )}
          </div>
        ) : (
          filtered.map(v => {
            const status = getVirementStatus(v);
            const cfg    = STATUS_CFG[status];
            const isActing = acting?.startsWith(v.id);
            return (
              <div key={v.id}
                className="group rounded-2xl border border-white/[0.06] bg-[#18181c] transition-colors hover:bg-[#1c1c21]"
                style={status === "en_retard" ? { borderColor: "rgba(249,168,38,0.15)" } : {}}
              >
                <div className="flex items-center gap-4 px-5 py-4">

                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold text-white/80"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    {v.nom.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.88rem] font-bold text-white/90">{v.nom}</span>
                      {/* Badge statut */}
                      <span className="rounded-full px-2 py-0.5 text-[0.64rem] font-bold"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                      {/* Montant */}
                      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[0.64rem] font-semibold text-white/40">
                        {fmtEur(v.montant)}/mois
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[0.7rem] text-white/30">
                      <span>{v.email}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={9} />
                        Prélèvement le {v.jour_prelevement} du mois
                      </span>
                      {v.dernier_paiement && (
                        <span className="flex items-center gap-1 text-[#4ade80]/70">
                          <CheckCircle2 size={9} />
                          Dernier paiement : {fmtDate(v.dernier_paiement)}
                        </span>
                      )}
                      {v.prochain_paiement && (
                        <span className={`flex items-center gap-1 ${status === "en_retard" ? "text-[#f9a826]" : "text-white/30"}`}>
                          <Clock size={9} />
                          Prochain : {fmtDate(v.prochain_paiement)}
                        </span>
                      )}
                    </div>
                    {v.notes && (
                      <p className="mt-0.5 text-[0.68rem] italic text-white/20">{v.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">

                    {/* Paiement reçu */}
                    <button
                      onClick={() => markPaye(v)}
                      disabled={!!isActing}
                      title="Marquer le paiement reçu et débloquer l'accès"
                      className="flex items-center gap-1.5 rounded-xl border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)] px-3 py-1.5 text-[0.72rem] font-bold text-[#4ade80] transition hover:bg-[rgba(74,222,128,0.15)] disabled:opacity-40"
                    >
                      {acting === v.id + ":paye"
                        ? <Loader2 size={11} className="animate-spin" />
                        : <CheckCircle2 size={11} />
                      }
                      Paiement reçu
                    </button>

                    {/* Bloquer */}
                    <button
                      onClick={() => bloquer(v)}
                      disabled={!!isActing || !v.acces_actif}
                      title="Bloquer l'accès — non-paiement"
                      className="flex items-center gap-1.5 rounded-xl border border-[rgba(248,113,113,0.22)] bg-[rgba(248,113,113,0.07)] px-3 py-1.5 text-[0.72rem] font-bold text-[#f87171] transition hover:bg-[rgba(248,113,113,0.15)] disabled:opacity-30"
                    >
                      {acting === v.id + ":bloquer"
                        ? <Loader2 size={11} className="animate-spin" />
                        : <XCircle size={11} />
                      }
                      Bloquer
                    </button>

                    {/* Supprimer */}
                    <button
                      onClick={() => setConfirmDel(v.id)}
                      title="Supprimer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 transition hover:bg-white/[0.06] hover:text-[#f87171]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[0.72rem] text-white/20">{filtered.length} virement{filtered.length !== 1 ? "s" : ""}</p>
          <button onClick={load} className="flex items-center gap-1.5 text-[0.72rem] text-white/20 transition-colors hover:text-white/45">
            <RefreshCw size={11} /> Actualiser
          </button>
        </div>
      )}

      {/* ── Modal Ajouter ──────────────────────────────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(74,222,128,0.1)]">
                  <Banknote size={14} className="text-[#4ade80]" />
                </div>
                <h2 className="text-[0.95rem] font-black text-white">Nouveau virement</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/70"><X size={18}/></button>
            </div>

            <div className="space-y-4">
              {[
                { key: "nom",   label: "Nom complet *",   placeholder: "Marie Dupont",          type: "text"   },
                { key: "email", label: "Email *",          placeholder: "marie@exemple.com",     type: "email"  },
              ].map(f => (
                <div key={f.key}>
                  <label className="mb-1.5 block text-[0.71rem] font-bold uppercase tracking-[0.07em] text-white/30">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none focus:border-[rgba(74,222,128,0.4)]"
                  />
                </div>
              ))}

              {/* Montant + Jour */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[0.71rem] font-bold uppercase tracking-[0.07em] text-white/30">
                    Montant (€)
                  </label>
                  <div className="relative">
                    <Euro size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      type="number"
                      step="0.01"
                      value={form.montant}
                      onChange={e => setForm(p => ({ ...p, montant: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 pl-8 pr-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(74,222,128,0.4)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.71rem] font-bold uppercase tracking-[0.07em] text-white/30">
                    Jour du mois
                  </label>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      type="number"
                      min="1" max="28"
                      value={form.jour_prelevement}
                      onChange={e => setForm(p => ({ ...p, jour_prelevement: e.target.value }))}
                      placeholder="1–28"
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 pl-8 pr-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(74,222,128,0.4)]"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-[0.71rem] font-bold uppercase tracking-[0.07em] text-white/30">Notes (optionnel)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Référence virement, remarque…"
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none focus:border-[rgba(74,222,128,0.4)]"
                />
              </div>

              {formErr && (
                <p className="rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[0.78rem] text-[#f87171]">
                  {formErr}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 rounded-2xl border border-white/[0.08] py-2.5 text-[0.83rem] font-bold text-white/40 transition-colors hover:text-white/70">
                  Annuler
                </button>
                <button onClick={create} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#4ade80] py-2.5 text-[0.83rem] font-bold text-[#0a1a0a] transition-opacity hover:opacity-90 disabled:opacity-50">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 text-center">
            <Trash2 size={24} className="mx-auto mb-3 text-[#f87171]" />
            <p className="mb-1 font-bold text-white">Supprimer ce virement ?</p>
            <p className="mb-5 text-[0.8rem] text-white/35">
              Le client restera dans user_access. Seul le suivi virement sera supprimé.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 rounded-2xl border border-white/[0.08] py-2.5 text-[0.83rem] font-bold text-white/40 transition-colors hover:text-white/70">
                Annuler
              </button>
              <button onClick={() => deleteVirement(confirmDel)}
                className="flex-1 rounded-2xl bg-[rgba(248,113,113,0.15)] py-2.5 text-[0.83rem] font-bold text-[#f87171] transition-colors hover:bg-[rgba(248,113,113,0.25)]">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
