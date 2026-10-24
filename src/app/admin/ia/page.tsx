"use client";

import { Brain, Cpu, DollarSign, AlertTriangle, BarChart2, Zap } from "lucide-react";
import { V } from "@/components/hq";

const IA_MODULES = [
  { slug: "assistant",    label: "Assistant IA",       desc: "Génération de documents, relances",  icon: Brain },
  { slug: "chatbot",      label: "Chatbot IA",         desc: "Widget conversationnel client",       icon: Cpu  },
  { slug: "coaching",     label: "Coaching IA",        desc: "Parcours de formation personnalisé",  icon: Zap  },
  { slug: "doc",          label: "DOC IA",             desc: "Analyse et génération de contrats",   icon: BarChart2 },
  { slug: "site-web",     label: "Site web IA",        desc: "Génération de sites professionnels",  icon: DollarSign },
  { slug: "blog",         label: "Blog IA",            desc: "Génération d'articles",               icon: AlertTriangle },
];

export default function IAAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-[1.2rem] font-black tracking-tight" style={{ color: V.text }}>
          <Brain size={18} style={{ color: V.gold }} />
          Intelligence artificielle
        </h1>
        <p className="mt-1 text-[0.8rem]" style={{ color: V.textMuted }}>
          Supervision de la consommation IA par module — DJAMA SaaS
        </p>
      </div>

      {/* Notice développement */}
      <div
        className="rounded-xl border p-4 text-[0.82rem]"
        style={{ background: "rgba(201,165,90,0.06)", borderColor: "rgba(201,165,90,0.2)", color: V.textSub }}
      >
        <p className="font-semibold mb-1" style={{ color: V.gold }}>Module en cours de développement</p>
        <p>Les métriques de consommation IA en temps réel seront disponibles ici. En attendant, retrouvez les feature flags dans la section Applications.</p>
      </div>

      {/* Modules IA */}
      <div>
        <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.12em]" style={{ color: V.textFaint }}>
          Modules IA actifs
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IA_MODULES.map(({ slug, label, desc, icon: Icon }) => (
            <div
              key={slug}
              className="flex items-start gap-3 rounded-xl border p-4"
              style={{ background: V.card, borderColor: V.border }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: V.goldDim }}
              >
                <Icon size={15} style={{ color: V.gold }} />
              </div>
              <div className="min-w-0">
                <p className="text-[0.85rem] font-semibold" style={{ color: V.text }}>{label}</p>
                <p className="mt-0.5 text-[0.74rem]" style={{ color: V.textFaint }}>{desc}</p>
                <span
                  className="mt-2 inline-block rounded-full px-2 py-0.5 text-[0.63rem] font-bold"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                >
                  Actif
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonctionnalités prévues */}
      <div
        className="rounded-xl border p-5"
        style={{ background: V.card, borderColor: V.border }}
      >
        <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.12em]" style={{ color: V.gold }}>
          Métriques prévues
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            "Nombre de requêtes par module / période",
            "Consommation par organisation cliente",
            "Coûts estimés (tokens × tarif Anthropic)",
            "Latence moyenne par endpoint IA",
            "Taux d'erreur par module",
            "Quotas par plan d'abonnement",
            "Alertes de dépassement automatiques",
            "Modèles configurés (Claude Sonnet / Haiku)",
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
