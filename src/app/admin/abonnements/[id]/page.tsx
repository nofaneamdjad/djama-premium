"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard, ArrowLeft, Loader2, CheckCircle2, XCircle,
  Save, RefreshCw, Zap, Calendar, User, Building2,
  ExternalLink, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { V } from "@/components/hq";

interface Client {
  id: string; name: string; email: string;
  phone: string | null; company: string | null; created_at: string;
}
interface Sub {
  user_id: string; is_active: boolean; plan_name: string | null;
  provider: string | null; stripe_customer_id: string | null;
  stripe_sub_id: string | null; current_period_end: string | null;
  beta_access: boolean | null; beta_expires_at: string | null;
  ai_calls_used: number | null; updated_at: string;
}

const PLANS = ["gratuit", "outils_djama", "entreprise", "premium"];
const PROVIDERS = ["stripe", "paypal", "admin"];

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function ISOInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = value ? value.slice(0, 10) : "";
  return (
    <input
      type="date"
      value={date}
      onChange={e => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
      className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none transition"
      style={{ borderColor: V.border, color: V.text }}
      onFocus={e => (e.target.style.borderColor = V.goldBorder)}
      onBlur={e  => (e.target.style.borderColor = V.border)}
    />
  );
}

export default function AbonnementFichePage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [sub,     setSub]     = useState<Sub | null>(null);
  const [client,  setClient]  = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Champs éditables
  const [isActive,         setIsActive]         = useState(false);
  const [planName,         setPlanName]         = useState("");
  const [provider,         setProvider]         = useState("");
  const [periodEnd,        setPeriodEnd]        = useState("");
  const [betaAccess,       setBetaAccess]       = useState(false);
  const [betaExpires,      setBetaExpires]      = useState("");
  const [stripeCustomerId, setStripeCustomerId] = useState("");
  const [stripeSubId,      setStripeSubId]      = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`/api/admin/subscriptions/${id}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setSub(d.subscription);
      setClient(d.client);
      const s = d.subscription as Sub;
      setIsActive(s.is_active);
      setPlanName(s.plan_name ?? "");
      setProvider(s.provider ?? "");
      setPeriodEnd(s.current_period_end ?? "");
      setBetaAccess(s.beta_access ?? false);
      setBetaExpires(s.beta_expires_at ?? "");
      setStripeCustomerId(s.stripe_customer_id ?? "");
      setStripeSubId(s.stripe_sub_id ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true); setErr(null); setSuccess(false);
    try {
      const r = await fetch(`/api/admin/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active:          isActive,
          plan_name:          planName || null,
          provider:           provider || null,
          current_period_end: periodEnd || null,
          beta_access:        betaAccess,
          beta_expires_at:    betaExpires || null,
          stripe_customer_id: stripeCustomerId || null,
          stripe_sub_id:      stripeSubId || null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setSub(d.subscription);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin" style={{ color: V.gold }} />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="space-y-4">
        <Link href="/admin/abonnements"
          className="inline-flex items-center gap-1.5 text-[0.8rem] transition"
          style={{ color: V.textMuted }}>
          <ArrowLeft size={13} /> Retour
        </Link>
        <div className="rounded-xl border px-5 py-4 text-[0.84rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.07)", color: "#f87171" }}>
          {err ?? "Abonnement introuvable"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/abonnements"
          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.78rem] transition"
          style={{ borderColor: V.border, color: V.textMuted }}>
          <ArrowLeft size={13} /> Abonnements
        </Link>
        <h1 className="text-[1.1rem] font-black tracking-tight" style={{ color: V.text }}>
          {client?.name ?? id}
        </h1>
      </div>

      {/* Info client */}
      <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
        <p className="mb-3 text-[0.78rem] font-bold uppercase tracking-wide" style={{ color: V.textFaint }}>
          Client
        </p>
        <div className="grid grid-cols-2 gap-3 text-[0.82rem]">
          <div className="flex items-center gap-2" style={{ color: V.textSub }}>
            <User size={13} style={{ color: V.textFaint }} />
            {client?.name ?? "—"}
          </div>
          <div style={{ color: V.textSub }}>{client?.email}</div>
          <div className="flex items-center gap-2" style={{ color: V.textSub }}>
            <Building2 size={13} style={{ color: V.textFaint }} />
            {client?.company ?? "—"}
          </div>
          <div style={{ color: V.textSub }}>
            Inscrit le {fmt(client?.created_at ?? null)}
          </div>
        </div>
        <Link
          href={`/admin/clients/${id}`}
          className="mt-3 inline-flex items-center gap-1 text-[0.75rem] transition"
          style={{ color: V.gold }}
        >
          <ExternalLink size={11} /> Voir la fiche client
        </Link>
      </div>

      {/* Formulaire abonnement */}
      <div className="rounded-2xl border p-5 space-y-5" style={{ background: V.card, borderColor: V.border }}>
        <p className="text-[0.78rem] font-bold uppercase tracking-wide" style={{ color: V.textFaint }}>
          Abonnement
        </p>

        {/* Statut actif */}
        <div className="flex items-center justify-between rounded-xl border px-4 py-3"
          style={{ borderColor: V.border }}>
          <div>
            <p className="text-[0.84rem] font-semibold" style={{ color: V.text }}>Abonnement actif</p>
            <p className="text-[0.74rem]" style={{ color: V.textFaint }}>
              Contrôle l'accès à la plateforme
            </p>
          </div>
          <button
            onClick={() => setIsActive(v => !v)}
            className="flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-[0.82rem] font-semibold transition"
            style={{
              borderColor: isActive ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)",
              background:  isActive ? "rgba(74,222,128,0.08)"  : "rgba(248,113,113,0.08)",
              color:       isActive ? "#4ade80"                 : "#f87171",
            }}
          >
            {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {isActive ? "Actif" : "Inactif"}
          </button>
        </div>

        {/* Plan */}
        <div>
          <label className="block mb-1.5 text-[0.78rem] font-semibold" style={{ color: V.textSub }}>
            Plan
          </label>
          <select
            value={planName}
            onChange={e => setPlanName(e.target.value)}
            className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
            style={{ borderColor: V.border, color: V.text }}
          >
            <option value="">— Aucun plan —</option>
            {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Fournisseur */}
        <div>
          <label className="block mb-1.5 text-[0.78rem] font-semibold" style={{ color: V.textSub }}>
            Fournisseur de paiement
          </label>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
            style={{ borderColor: V.border, color: V.text }}
          >
            <option value="">— Aucun —</option>
            {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Expiration */}
        <div>
          <label className="block mb-1.5 text-[0.78rem] font-semibold" style={{ color: V.textSub }}>
            <Calendar size={12} className="inline mr-1" />
            Date d'expiration
          </label>
          <ISOInput value={periodEnd} onChange={setPeriodEnd} />
        </div>

        {/* IDs Stripe */}
        {(provider === "stripe" || stripeCustomerId || stripeSubId) && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-[0.74rem] font-semibold" style={{ color: V.textFaint }}>
                Stripe Customer ID
              </label>
              <input
                type="text"
                value={stripeCustomerId}
                onChange={e => setStripeCustomerId(e.target.value)}
                placeholder="cus_…"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.8rem] font-mono outline-none"
                style={{ borderColor: V.border, color: V.text }}
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[0.74rem] font-semibold" style={{ color: V.textFaint }}>
                Stripe Subscription ID
              </label>
              <input
                type="text"
                value={stripeSubId}
                onChange={e => setStripeSubId(e.target.value)}
                placeholder="sub_…"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.8rem] font-mono outline-none"
                style={{ borderColor: V.border, color: V.text }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bêta */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ background: V.card, borderColor: V.border }}>
        <p className="text-[0.78rem] font-bold uppercase tracking-wide" style={{ color: V.textFaint }}>
          Accès Bêta
        </p>
        <div className="flex items-center justify-between rounded-xl border px-4 py-3"
          style={{ borderColor: V.border }}>
          <p className="text-[0.84rem] font-semibold" style={{ color: V.text }}>Bêta actif</p>
          <button
            onClick={() => setBetaAccess(v => !v)}
            className="flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-[0.82rem] font-semibold transition"
            style={{
              borderColor: betaAccess ? "rgba(167,139,250,0.25)" : V.border,
              background:  betaAccess ? "rgba(167,139,250,0.08)" : "transparent",
              color:       betaAccess ? "#a78bfa"                 : V.textFaint,
            }}
          >
            <Zap size={13} />
            {betaAccess ? "Bêta activé" : "Inactif"}
          </button>
        </div>
        {betaAccess && (
          <div>
            <label className="block mb-1.5 text-[0.78rem] font-semibold" style={{ color: V.textSub }}>
              Expiration accès bêta
            </label>
            <ISOInput value={betaExpires} onChange={setBetaExpires} />
          </div>
        )}
        {sub.ai_calls_used != null && (
          <p className="text-[0.78rem]" style={{ color: V.textFaint }}>
            Appels IA utilisés ce mois : <strong style={{ color: V.gold }}>{sub.ai_calls_used}</strong>
          </p>
        )}
      </div>

      {/* Erreur / succès */}
      {err && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.07)", color: "#f87171" }}>
          <AlertTriangle size={14} /> {err}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.07)", color: "#4ade80" }}>
          <CheckCircle2 size={14} /> Abonnement mis à jour
        </div>
      )}

      {/* Boutons */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.85rem] font-bold transition disabled:opacity-50"
          style={{ background: V.goldDim, color: V.gold, border: `1px solid ${V.goldBorder}` }}
        >
          {saving
            ? <Loader2 size={14} className="animate-spin" />
            : <Save size={14} />
          }
          Enregistrer
        </button>
        <button
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[0.82rem] transition"
          style={{ borderColor: V.border, color: V.textMuted }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Recharger
        </button>
      </div>

      {/* Métadonnées */}
      <p className="text-[0.73rem]" style={{ color: V.textFaint }}>
        Dernière modification : {fmt(sub.updated_at)} — ID : <span className="font-mono">{sub.user_id}</span>
      </p>
    </div>
  );
}
