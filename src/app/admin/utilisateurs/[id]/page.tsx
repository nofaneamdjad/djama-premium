"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Phone, Building2, Calendar,
  ShieldOff, ShieldCheck, Trash2, Loader2, Save,
  CreditCard, FileText, Lock, Unlock,
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserDetail {
  id:           string;
  name:         string;
  email:        string;
  phone:        string | null;
  company:      string | null;
  statut:       string | null;
  abonnement:   string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  admin_notes:  string | null;
  created_at:   string;
  updated_at:   string | null;
}

interface AccessData {
  id:              string;
  email:           string;
  name:            string | null;
  espace_premium:  boolean;
  coaching_ia:     boolean;
  soutien_scolaire:boolean;
  outils_saas:     boolean;
  source:          string | null;
  has_access:      boolean | null;
}

interface Facture {
  id:          string;
  numero:      string | null;
  montant_ttc: number;
  statut:      string | null;
  created_at:  string;
}

interface ProfileResponse {
  user:     UserDetail;
  access:   AccessData | null;
  factures: Facture[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.72rem] font-medium uppercase tracking-wider text-white/25">{label}</dt>
      <dd className="mt-1 text-[0.85rem] text-white/70">{value || "—"}</dd>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function UserFichePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [profile,    setProfile]    = useState<ProfileResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [acting,     setActing]     = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then((d: ProfileResponse) => {
        setProfile(d);
        setAdminNotes(d.user.admin_notes ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function saveNotes() {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ admin_notes: adminNotes }),
    });
    setSaving(false);
    if (res.ok) {
      showToast("Notes sauvegardées");
      setProfile(p => p ? { ...p, user: { ...p.user, admin_notes: adminNotes } } : p);
    } else {
      showToast("Erreur lors de la sauvegarde", false);
    }
  }

  async function doSuspend() {
    setActing(true);
    const res = await fetch(`/api/admin/users/${id}/suspend`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({}),
    });
    setActing(false);
    const json = await res.json();
    if (res.ok) {
      showToast("Utilisateur suspendu");
      setProfile(p => p ? { ...p, user: { ...p.user, suspended_at: json.suspended_at } } : p);
    } else {
      showToast(json.error ?? "Erreur", false);
    }
  }

  async function doReactivate() {
    setActing(true);
    const res = await fetch(`/api/admin/users/${id}/reactivate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:   JSON.stringify({}),
    });
    setActing(false);
    const json = await res.json();
    if (res.ok) {
      showToast("Compte réactivé");
      setProfile(p => p ? { ...p, user: { ...p.user, suspended_at: null, statut: "actif" } } : p);
    } else {
      showToast(json.error ?? "Erreur", false);
    }
  }

  async function doDelete() {
    setActing(true);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setActing(false);
    const json = await res.json();
    if (res.ok) {
      router.push("/admin/utilisateurs");
    } else {
      showToast(json.error ?? "Suppression impossible", false);
      setConfirmDel(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-white/30">
        <Loader2 size={20} className="animate-spin mr-2" />
        Chargement…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-white/40">
        <User size={28} />
        <p>Utilisateur introuvable</p>
        <Link href="/admin/utilisateurs" className="text-[#c9a55a] text-sm hover:underline">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const { user, access, factures } = profile;
  const isSuspended = !!user.suspended_at;

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-xl transition-all ${
          toast.ok ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/utilisateurs"
            className="mb-3 inline-flex items-center gap-1 text-[0.8rem] text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft size={13} /> Retour à la liste
          </Link>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <User size={20} className="text-[#c9a55a]" />
            {user.name || user.email}
          </h1>
          <p className="mt-0.5 text-[0.8rem] text-white/40">{user.email}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          {isSuspended ? (
            <button
              onClick={doReactivate}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[0.8rem] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/15 disabled:opacity-50"
            >
              {acting ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
              Réactiver
            </button>
          ) : (
            <button
              onClick={doSuspend}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-[0.8rem] font-medium text-orange-400 transition-colors hover:bg-orange-500/15 disabled:opacity-50"
            >
              {acting ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
              Suspendre
            </button>
          )}

          {!confirmDel ? (
            <button
              onClick={() => setConfirmDel(true)}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-[0.8rem] font-medium text-red-400/70 transition-colors hover:bg-red-500/10"
            >
              <Trash2 size={13} />
              Supprimer
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={doDelete}
                disabled={acting}
                className="flex items-center gap-1 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-[0.8rem] font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                {acting ? <Loader2 size={13} className="animate-spin" /> : null}
                Confirmer
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="rounded-xl border border-white/[0.07] px-3 py-2 text-[0.8rem] text-white/40 hover:text-white/60"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Suspension notice */}
      {isSuspended && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[0.82rem] text-red-400 flex items-center gap-2">
          <ShieldOff size={14} />
          Suspendu le {fmt(user.suspended_at)} par {user.suspended_by ?? "admin"}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Informations personnelles */}
        <section className="rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] p-5 space-y-4">
          <h2 className="text-[0.75rem] font-semibold uppercase tracking-wider text-white/30 flex items-center gap-1.5">
            <User size={12} /> Informations
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Nom"       value={user.name} />
            <Field label="Email"     value={user.email} />
            <Field label="Téléphone" value={user.phone} />
            <Field label="Entreprise" value={user.company} />
            <Field label="Statut"    value={user.statut} />
            <Field label="Abonnement" value={user.abonnement} />
            <Field label="Inscription" value={fmt(user.created_at)} />
            <Field label="Mis à jour"  value={fmt(user.updated_at)} />
          </dl>
        </section>

        {/* Accès */}
        <section className="rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] p-5 space-y-4">
          <h2 className="text-[0.75rem] font-semibold uppercase tracking-wider text-white/30 flex items-center gap-1.5">
            <CreditCard size={12} /> Accès et plan
          </h2>
          {access ? (
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Espace premium"  value={access.espace_premium  ? "✓ Oui" : "Non"} />
              <Field label="Outils SaaS"     value={access.outils_saas     ? "✓ Oui" : "Non"} />
              <Field label="Coaching IA"     value={access.coaching_ia     ? "✓ Oui" : "Non"} />
              <Field label="Soutien scolaire" value={access.soutien_scolaire ? "✓ Oui" : "Non"} />
              <Field label="Source"          value={access.source} />
              <Field label="Accès actif"     value={access.has_access ? "Oui" : "Non"} />
            </dl>
          ) : (
            <p className="text-[0.82rem] text-white/30">Aucun enregistrement d'accès</p>
          )}
        </section>
      </div>

      {/* Factures récentes */}
      {factures.length > 0 && (
        <section className="rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] p-5 space-y-3">
          <h2 className="text-[0.75rem] font-semibold uppercase tracking-wider text-white/30 flex items-center gap-1.5">
            <FileText size={12} /> Factures récentes
          </h2>
          <div className="divide-y divide-white/[0.04]">
            {factures.map(f => (
              <div key={f.id} className="flex items-center justify-between py-2.5 text-[0.82rem]">
                <span className="text-white/60">{f.numero || f.id.slice(0, 8)}</span>
                <span className="text-white/40">{fmt(f.created_at)}</span>
                <span className="font-medium text-white/70 tabular-nums">
                  {(f.montant_ttc / 100).toFixed(2)} €
                </span>
                <span className="text-white/40">{f.statut}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notes admin */}
      <section className="rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] p-5 space-y-3">
        <h2 className="text-[0.75rem] font-semibold uppercase tracking-wider text-white/30">
          Notes admin (privées)
        </h2>
        <textarea
          value={adminNotes}
          onChange={e => setAdminNotes(e.target.value)}
          rows={4}
          placeholder="Notes internes sur cet utilisateur…"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[0.82rem] text-white/70 placeholder-white/20 outline-none resize-none focus:border-[rgba(201,165,90,0.3)] focus:ring-1 focus:ring-[rgba(201,165,90,0.1)]"
        />
        <button
          onClick={saveNotes}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] px-4 py-2 text-[0.8rem] font-medium text-[#c9a55a] transition-colors hover:bg-[rgba(201,165,90,0.15)] disabled:opacity-50"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Sauvegarder les notes
        </button>
      </section>
    </div>
  );
}
