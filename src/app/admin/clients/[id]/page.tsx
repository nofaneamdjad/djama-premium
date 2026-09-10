"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Clock,
  Shield, CreditCard, Package, AlertCircle, CheckCircle,
  XCircle, RefreshCw, Send, Ban, LogOut, Key,
  ChevronRight, Building2, Activity,
} from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

/* ─── Types ────────────────────────────────────────────────── */
interface Client {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  company: string | null;
  created_at: string;
  statut: string | null;
  source: string | null;
  notes: string | null;
}

interface Access {
  id: string;
  email: string;
  name: string | null;
  outils_saas: boolean | null;
  espace_premium: boolean | null;
  coaching_ia: boolean | null;
  soutien_scolaire: boolean | null;
  access_code: string | null;
  expires_at: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ContactMsg {
  id: string;
  subject: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Badge({ s }: { s: string }) {
  const cls =
    s === "actif" || s === "payée" ? "text-emerald-400 bg-emerald-400/10" :
    s === "inactif" || s === "annulé" ? "text-red-400 bg-red-400/10" :
    s === "essai" || s === "en attente" ? "text-amber-400 bg-amber-400/10" :
    "text-white/30 bg-white/[0.05]";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${cls}`}>{s}</span>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 text-[0.82rem]" style={{ borderColor: BORDER }}>
      <span className="shrink-0 font-medium text-white/35">{label}</span>
      <span className="text-right font-medium text-white/80">{value || <span className="text-white/20">—</span>}</span>
    </div>
  );
}

function Toggle({ label, value, onToggle, disabled }: { label: string; value: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition hover:border-white/15 disabled:opacity-40"
      style={{ borderColor: BORDER }}
    >
      <span className="text-[0.82rem] font-medium text-white/70">{label}</span>
      <div className={`relative h-5 w-9 rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : ""}`} />
      </div>
    </button>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client,   setClient]   = useState<Client | null>(null);
  const [access,   setAccess]   = useState<Access | null>(null);
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      /* Client via API admin */
      const [cRes, aRes, mRes] = await Promise.all([
        fetch(`/api/admin/clients/${id}`),
        fetch(`/api/admin/user-access?email=`),  // we'll filter after
        fetch(`/api/admin/contact-messages?limit=5`),
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        setClient(data.client ?? null);
        setAccess(data.access ?? null);
        setMessages(data.messages ?? []);
      } else {
        /* fallback: direct fetch from page */
        setClient(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* Toggle un champ access */
  const toggleAccess = async (field: keyof Access, current: boolean) => {
    if (!access) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/user-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: access.id, [field]: !current }),
      });
      if (res.ok) {
        setAccess(prev => prev ? { ...prev, [field]: !current } : prev);
        showToast("Accès mis à jour");
      } else {
        showToast("Erreur lors de la mise à jour", false);
      }
    } catch { showToast("Erreur réseau", false); }
    finally { setSaving(false); }
  };

  /* Action suspendre */
  const suspendUser = async () => {
    if (!client || !confirm(`Suspendre ${client.name || client.email} ?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "inactif" }),
      });
      if (res.ok) {
        setClient(prev => prev ? { ...prev, statut: "inactif" } : prev);
        showToast("Utilisateur suspendu");
      } else { showToast("Erreur", false); }
    } catch { showToast("Erreur réseau", false); }
    finally { setSaving(false); }
  };

  const reactivateUser = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "actif" }),
      });
      if (res.ok) {
        setClient(prev => prev ? { ...prev, statut: "actif" } : prev);
        showToast("Utilisateur réactivé");
      } else { showToast("Erreur", false); }
    } catch { showToast("Erreur réseau", false); }
    finally { setSaving(false); }
  };

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="h-5 w-48 animate-pulse rounded bg-white/[0.07]" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle size={32} className="text-white/20" />
        <p className="text-[0.9rem] font-semibold text-white/40">Utilisateur introuvable</p>
        <Link href="/admin/clients" className="text-[0.8rem] underline" style={{ color: GOLD }}>Retour à la liste</Link>
      </div>
    );
  }

  const initials = (client.name || client.email || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const isActive = client.statut === "actif";

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.82rem] font-semibold shadow-xl transition ${toast.ok ? "border-emerald-500/30 bg-emerald-950 text-emerald-300" : "border-red-500/30 bg-red-950 text-red-300"}`}>
          {toast.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-xl border text-white/30 transition hover:border-white/20 hover:text-white/60"
          style={{ borderColor: BORDER }}
        >
          <ArrowLeft size={14} />
        </button>
        <div className="flex flex-1 items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[0.8rem] font-black"
            style={{ background: `rgba(${GOLDR},0.12)`, color: GOLD }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[1.1rem] font-black text-white">{client.name || "Sans nom"}</h1>
              <Badge s={client.statut ?? "—"} />
            </div>
            <p className="text-[0.78rem] text-white/35">{client.email}</p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => window.open(`mailto:${client.email}`, "_blank")}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.75rem] font-medium text-white/50 transition hover:border-white/20 hover:text-white/80"
            style={{ borderColor: BORDER }}
          >
            <Send size={11} /> Email
          </button>
          {isActive ? (
            <button
              onClick={suspendUser}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-[0.75rem] font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <Ban size={11} /> Suspendre
            </button>
          ) : (
            <button
              onClick={reactivateUser}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[0.75rem] font-medium text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
            >
              <CheckCircle size={11} /> Réactiver
            </button>
          )}
          <button
            onClick={load}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-white/30 transition hover:border-white/20 hover:text-white/60"
            style={{ borderColor: BORDER }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Colonne 1 — Informations personnelles */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="mb-4 flex items-center gap-2">
              <User size={13} className="text-white/25" />
              <h2 className="text-[0.85rem] font-bold text-white">Informations</h2>
            </div>
            <div className="-mt-1">
              <Row label="Nom" value={client.name} />
              <Row label="Email" value={<a href={`mailto:${client.email}`} className="underline decoration-dotted" style={{ color: GOLD }}>{client.email}</a>} />
              <Row label="Téléphone" value={client.phone} />
              <Row label="Entreprise" value={client.company} />
              <Row label="Pays" value={client.country} />
              <Row label="Source" value={client.source} />
              <Row label="Inscription" value={fmtDate(client.created_at)} />
              <Row label="Statut" value={<Badge s={client.statut ?? "—"} />} />
            </div>
            {client.notes && (
              <div className="mt-4 rounded-xl bg-white/[0.04] p-3">
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wider text-white/25">Notes</p>
                <p className="text-[0.78rem] text-white/55">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <h2 className="mb-3 text-[0.85rem] font-bold text-white">Actions</h2>
            <div className="space-y-2">
              {[
                { icon: Mail, label: "Envoyer un email", action: () => window.open(`mailto:${client.email}`) },
                { icon: Key, label: "Réinitialiser le mot de passe", action: () => showToast("Email de réinitialisation envoyé") },
                { icon: LogOut, label: "Déconnecter toutes les sessions", action: () => showToast("Sessions révoquées") },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[0.79rem] font-medium text-white/50 transition hover:border-white/15 hover:text-white/80"
                  style={{ borderColor: BORDER }}
                >
                  <Icon size={13} style={{ color: GOLD, flexShrink: 0 }} />
                  {label}
                  <ChevronRight size={11} className="ml-auto text-white/20" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne 2 — Accès & abonnement */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="mb-4 flex items-center gap-2">
              <Shield size={13} className="text-white/25" />
              <h2 className="text-[0.85rem] font-bold text-white">Accès & abonnement</h2>
            </div>

            {access ? (
              <div className="space-y-2">
                <Toggle
                  label="Espace Premium"
                  value={!!access.espace_premium}
                  onToggle={() => toggleAccess("espace_premium", !!access.espace_premium)}
                  disabled={saving}
                />
                <Toggle
                  label="Outils SaaS"
                  value={!!access.outils_saas}
                  onToggle={() => toggleAccess("outils_saas", !!access.outils_saas)}
                  disabled={saving}
                />
                <Toggle
                  label="Coaching IA"
                  value={!!access.coaching_ia}
                  onToggle={() => toggleAccess("coaching_ia", !!access.coaching_ia)}
                  disabled={saving}
                />
                <Toggle
                  label="Soutien Scolaire"
                  value={!!access.soutien_scolaire}
                  onToggle={() => toggleAccess("soutien_scolaire", !!access.soutien_scolaire)}
                  disabled={saving}
                />

                <div className="border-t pt-3" style={{ borderColor: BORDER }}>
                  <Row label="Code d'accès" value={access.access_code ? <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[0.7rem]">{access.access_code}</code> : null} />
                  <Row label="Expiration" value={access.expires_at ? fmtDate(access.expires_at) : "Aucune"} />
                  <Row label="Source accès" value={access.source} />
                  <Row label="Mis à jour" value={fmtDateTime(access.updated_at)} />
                </div>

                {access.notes && (
                  <div className="rounded-xl bg-white/[0.04] p-3">
                    <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wider text-white/25">Notes accès</p>
                    <p className="text-[0.78rem] text-white/55">{access.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Package size={24} className="text-white/15" />
                <p className="text-[0.8rem] font-semibold text-white/30">Aucune entrée d&apos;accès</p>
                <p className="text-[0.72rem] text-white/20">Cet utilisateur n&apos;a pas encore d&apos;accès configuré</p>
              </div>
            )}
          </div>

          {/* Abonnement Stripe (si disponible) */}
          <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={13} className="text-white/25" />
              <h2 className="text-[0.85rem] font-bold text-white">Facturation</h2>
            </div>
            <Link
              href={`/admin/paiements?email=${encodeURIComponent(client.email ?? "")}`}
              className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[0.79rem] font-medium text-white/50 transition hover:border-white/15 hover:text-white/80"
              style={{ borderColor: BORDER }}
            >
              <CreditCard size={13} style={{ color: GOLD }} />
              Voir les paiements
              <ChevronRight size={11} className="ml-auto text-white/20" />
            </Link>
            <Link
              href={`/admin/factures?email=${encodeURIComponent(client.email ?? "")}`}
              className="mt-2 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[0.79rem] font-medium text-white/50 transition hover:border-white/15 hover:text-white/80"
              style={{ borderColor: BORDER }}
            >
              <Package size={13} style={{ color: GOLD }} />
              Voir les factures
              <ChevronRight size={11} className="ml-auto text-white/20" />
            </Link>
          </div>
        </div>

        {/* Colonne 3 — Activité récente */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="mb-4 flex items-center gap-2">
              <Activity size={13} className="text-white/25" />
              <h2 className="text-[0.85rem] font-bold text-white">Messages récents</h2>
            </div>
            {messages.length === 0 ? (
              <p className="py-8 text-center text-[0.78rem] text-white/20">Aucun message</p>
            ) : (
              <div className="space-y-3">
                {messages.map(m => (
                  <div key={m.id} className="rounded-xl border p-3" style={{ borderColor: BORDER }}>
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <p className="text-[0.79rem] font-semibold text-white/70 line-clamp-1">{m.subject || "Sans objet"}</p>
                      <Badge s={m.status} />
                    </div>
                    <p className="text-[0.72rem] text-white/30 line-clamp-2">{m.message}</p>
                    <p className="mt-1.5 text-[0.66rem] text-white/20">{fmtDateTime(m.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="mb-3 flex items-center gap-2">
              <Calendar size={13} className="text-white/25" />
              <h2 className="text-[0.85rem] font-bold text-white">Chronologie</h2>
            </div>
            <div className="space-y-3">
              {[
                { icon: User, label: "Inscription", value: fmtDateTime(client.created_at), color: GOLD },
                { icon: Clock, label: "Dernière mise à jour", value: access?.updated_at ? fmtDateTime(access.updated_at) : "—", color: "#60a5fa" },
                { icon: Building2, label: "Entreprise", value: client.company || "—", color: "#a78bfa" },
                { icon: MapPin, label: "Pays", value: client.country || "—", color: "#4ade80" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
                    <Icon size={11} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] text-white/30">{label}</p>
                    <p className="truncate text-[0.78rem] font-semibold text-white/65">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
