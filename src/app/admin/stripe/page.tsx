"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard, ShieldCheck, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, Eye, RotateCcw, Loader2, Clock,
} from "lucide-react";
import { V } from "@/components/hq";

// ─── Types ────────────────────────────────────────────────────────────────────

type StripeStatus = {
  environment:            "test" | "live" | "not_configured";
  secret_key_prefix:      string;
  publishable_key_prefix: string;
  webhook_configured:     boolean;
  price_configured:       boolean;
  live_key_in_dev:        boolean;
};

type AuditRow = {
  id:              string;
  action:          "key_verified" | "key_rotation_declared" | "config_viewed" | "webhook_tested";
  key_prefix:      string | null;
  environment:     "test" | "live" | "not_configured" | null;
  verification_ok: boolean | null;
  stripe_account:  string | null;
  webhook_status:  string | null;
  ip_address:      string | null;
  created_at:      string;
};

type ConfigPayload = {
  status:        StripeStatus;
  last_verified: { at: string; stripe_account: string | null; webhook_status: string | null } | null;
  last_rotation: { at: string } | null;
  audit_log:     AuditRow[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function envBadge(env: string) {
  if (env === "live")           return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">LIVE</span>;
  if (env === "test")           return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/15 text-yellow-400">TEST</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/10 text-white/40">NON CONFIGURÉ</span>;
}

function actionLabel(a: string) {
  switch (a) {
    case "key_verified":          return "Clé vérifiée";
    case "key_rotation_declared": return "Rotation déclarée";
    case "config_viewed":         return "Config consultée";
    case "webhook_tested":        return "Webhook testé";
    default:                      return a;
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function StripePage() {
  const [data,          setData]          = useState<ConfigPayload | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [verifying,     setVerifying]     = useState(false);
  const [verifyResult,  setVerifyResult]  = useState<{ ok: boolean; msg: string } | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/stripe-config");
      if (!res.ok) { setError(`Erreur ${res.status}`); return; }
      setData(await res.json());
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  async function handleVerify() {
    setVerifying(true); setVerifyResult(null);
    try {
      const res = await fetch("/api/admin/stripe-config/verify", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setVerifyResult({ ok: true, msg: `Clé valide — compte : ${json.account_name ?? "—"}` });
      } else {
        setVerifyResult({ ok: false, msg: json.error ?? `Erreur ${res.status}` });
      }
      await loadConfig();
    } catch {
      setVerifyResult({ ok: false, msg: "Erreur réseau" });
    } finally {
      setVerifying(false);
    }
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-white/40">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />Chargement…
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-400 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4" />{error}
    </div>
  );

  const s = data!.status;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-white/50" />
          <h1 className="text-lg font-semibold text-white">Configuration Stripe</h1>
        </div>
        <button
          onClick={loadConfig}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />Actualiser
        </button>
      </div>

      {/* Alerte clé live en dev */}
      {s.live_key_in_dev && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Clé Stripe LIVE détectée en environnement de développement.</span>
            <br />Remplacez <code className="text-xs bg-white/10 px-1 rounded">STRIPE_SECRET_KEY</code> par une clé <code className="text-xs bg-white/10 px-1 rounded">sk_test_*</code> dans <code className="text-xs bg-white/10 px-1 rounded">.env.local</code>.
          </div>
        </div>
      )}

      {/* Statut clés */}
      <V.Card className="space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Identifiants</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Clé secrète */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04]">
            <ShieldCheck className="w-4 h-4 text-white/40 mt-0.5" />
            <div>
              <p className="text-xs text-white/40 mb-1">Clé secrète</p>
              <p className="text-sm font-mono text-white/80">{s.secret_key_prefix}</p>
              <div className="mt-1">{envBadge(s.environment)}</div>
            </div>
          </div>
          {/* Clé publiable */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04]">
            <Eye className="w-4 h-4 text-white/40 mt-0.5" />
            <div>
              <p className="text-xs text-white/40 mb-1">Clé publiable</p>
              <p className="text-sm font-mono text-white/80">{s.publishable_key_prefix}</p>
            </div>
          </div>
          {/* Webhook */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04]">
            {s.webhook_configured
              ? <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
              : <XCircle      className="w-4 h-4 text-red-400   mt-0.5" />
            }
            <div>
              <p className="text-xs text-white/40 mb-1">Webhook secret</p>
              <p className="text-sm text-white/80">{s.webhook_configured ? "Configuré" : "Non configuré"}</p>
            </div>
          </div>
          {/* Price ID */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04]">
            {s.price_configured
              ? <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
              : <XCircle      className="w-4 h-4 text-yellow-400 mt-0.5" />
            }
            <div>
              <p className="text-xs text-white/40 mb-1">Price ID</p>
              <p className="text-sm text-white/80">{s.price_configured ? "Configuré" : "Non configuré"}</p>
            </div>
          </div>
        </div>
      </V.Card>

      {/* Vérification */}
      <V.Card className="space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Vérification</h2>

        {data!.last_verified && (
          <div className="text-xs text-white/40 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Dernière vérification : {fmtDate(data!.last_verified.at)}
            {data!.last_verified.stripe_account && (
              <> — compte : <span className="text-white/60">{data!.last_verified.stripe_account}</span></>
            )}
          </div>
        )}

        {data!.last_rotation && (
          <div className="text-xs text-white/40 flex items-center gap-1.5">
            <RotateCcw className="w-3 h-3" />
            Dernière rotation déclarée : {fmtDate(data!.last_rotation.at)}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/15 text-white/80 disabled:opacity-50 transition-colors"
        >
          {verifying
            ? <><Loader2 className="w-4 h-4 animate-spin" />Vérification…</>
            : <><ShieldCheck className="w-4 h-4" />Vérifier la clé Stripe</>
          }
        </button>

        {verifyResult && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            verifyResult.ok
              ? "bg-green-500/10 border border-green-500/20 text-green-300"
              : "bg-red-500/10 border border-red-500/20 text-red-300"
          }`}>
            {verifyResult.ok
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              : <XCircle      className="w-4 h-4 mt-0.5 shrink-0" />
            }
            {verifyResult.msg}
          </div>
        )}
      </V.Card>

      {/* Historique d'audit */}
      <V.Card className="space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Historique (10 dernières entrées)</h2>
        {(!data!.audit_log || data!.audit_log.length === 0) ? (
          <p className="text-sm text-white/30 italic">Aucune entrée pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/30 border-b border-white/[0.07]">
                  <th className="text-left py-2 pr-3 font-medium">Heure</th>
                  <th className="text-left py-2 pr-3 font-medium">Action</th>
                  <th className="text-left py-2 pr-3 font-medium">Env.</th>
                  <th className="text-left py-2 pr-3 font-medium">Préfixe</th>
                  <th className="text-left py-2 pr-3 font-medium">OK</th>
                  <th className="text-left py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {data!.audit_log.map(row => (
                  <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2 pr-3 text-white/40 whitespace-nowrap">{fmtDate(row.created_at)}</td>
                    <td className="py-2 pr-3 text-white/70">{actionLabel(row.action)}</td>
                    <td className="py-2 pr-3">{row.environment ? envBadge(row.environment) : "—"}</td>
                    <td className="py-2 pr-3 font-mono text-white/50">{row.key_prefix ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {row.verification_ok === true  && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                      {row.verification_ok === false && <XCircle      className="w-3.5 h-3.5 text-red-400"   />}
                      {row.verification_ok === null  && <span className="text-white/20">—</span>}
                    </td>
                    <td className="py-2 text-white/30">{row.ip_address ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </V.Card>
    </div>
  );
}
