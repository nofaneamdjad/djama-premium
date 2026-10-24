"use client";

import { MonitorDot, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import { V } from "@/components/hq";

const SERVICES = [
  { name: "Vercel",     desc: "Hébergement & déploiement",    status: "unknown", url: "https://www.vercel-status.com" },
  { name: "Supabase",   desc: "Base de données & authentification", status: "unknown", url: "https://status.supabase.com" },
  { name: "Stripe",     desc: "Paiements & abonnements",      status: "unknown", url: "https://status.stripe.com" },
  { name: "Anthropic",  desc: "API Intelligence artificielle", status: "unknown", url: "https://status.anthropic.com" },
  { name: "Resend",     desc: "Emails transactionnels",        status: "unknown", url: "https://resend-status.com" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "operational") return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (status === "degraded")    return <AlertTriangle size={14} className="text-yellow-400" />;
  if (status === "down")        return <XCircle size={14} className="text-red-400" />;
  return <div className="h-3.5 w-3.5 rounded-full border" style={{ borderColor: V.border, background: V.surface }} />;
}

function StatusLabel({ status }: { status: string }) {
  if (status === "operational") return <span style={{ color: "#34d399" }}>Opérationnel</span>;
  if (status === "degraded")    return <span style={{ color: "#fbbf24" }}>Dégradé</span>;
  if (status === "down")        return <span style={{ color: "#f87171" }}>Indisponible</span>;
  return <span style={{ color: V.textFaint }}>Non vérifié</span>;
}

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-[1.2rem] font-black tracking-tight" style={{ color: V.text }}>
          <MonitorDot size={18} style={{ color: V.gold }} />
          Monitoring des services
        </h1>
        <p className="mt-1 text-[0.8rem]" style={{ color: V.textMuted }}>
          État des services tiers utilisés par DJAMA
        </p>
      </div>

      {/* Avertissement */}
      <div
        className="rounded-xl border p-4 text-[0.82rem]"
        style={{ background: "rgba(201,165,90,0.06)", borderColor: "rgba(201,165,90,0.2)", color: V.textSub }}
      >
        <p className="font-semibold mb-1" style={{ color: V.gold }}>Supervision externe</p>
        <p>
          Les statuts affichés proviennent des pages de statut officielles des fournisseurs.
          Une supervision interne en temps réel (webhooks, health checks) sera intégrée dans une prochaine version.
        </p>
      </div>

      {/* Services */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: V.border }}
      >
        <div
          className="border-b px-5 py-3"
          style={{ background: V.surface, borderColor: V.border }}
        >
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em]" style={{ color: V.textFaint }}>
            Infrastructure SaaS
          </p>
        </div>
        <div style={{ background: V.card }}>
          {SERVICES.map((svc, i) => (
            <div
              key={svc.name}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: i < SERVICES.length - 1 ? `1px solid ${V.border}` : undefined }}
            >
              <StatusIcon status={svc.status} />
              <div className="min-w-0 flex-1">
                <p className="text-[0.87rem] font-semibold" style={{ color: V.text }}>{svc.name}</p>
                <p className="text-[0.74rem]" style={{ color: V.textFaint }}>{svc.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.78rem] font-medium">
                  <StatusLabel status={svc.status} />
                </span>
                <a
                  href={svc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.73rem] font-medium transition"
                  style={{ background: V.surface, border: `1px solid ${V.border}`, color: V.textMuted }}
                >
                  <ExternalLink size={10} />
                  Statut
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonctionnalités prévues */}
      <div className="rounded-xl border p-5" style={{ background: V.card, borderColor: V.border }}>
        <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.12em]" style={{ color: V.gold }}>
          Supervision interne prévue
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Health checks automatiques toutes les 5 minutes",
            "Alertes Slack/email sur panne détectée",
            "Latence des endpoints API clés",
            "Taux d'erreur par route (4xx, 5xx)",
            "Monitoring des webhooks Stripe",
            "Disponibilité Supabase Realtime",
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-[0.8rem]" style={{ color: V.textSub }}>
              <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: V.gold }} />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
