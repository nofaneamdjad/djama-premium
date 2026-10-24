"use client";

import { Sliders, Check, ExternalLink, Users, CreditCard, Zap, Building2 } from "lucide-react";
import Link from "next/link";
import { V } from "@/components/hq";

const PLANS = [
  {
    id: "gratuit",
    label: "Plan Gratuit",
    price: "0 €",
    period: "/mois",
    color: "rgba(135,144,158,0.8)",
    bg: "rgba(135,144,158,0.08)",
    features: [
      "3 applications au choix (verrouillées)",
      "1 utilisateur",
      "Stockage 500 MB",
      "Support communautaire",
    ],
    cta: null,
    stripe_price_id: null,
  },
  {
    id: "outils_djama",
    label: "Outils DJAMA",
    price: "49 €",
    period: "/mois",
    color: "#c9a84c",
    bg: "rgba(201,168,76,0.08)",
    features: [
      "Toutes les applications incluses",
      "Utilisateurs illimités",
      "Stockage 10 GB",
      "Support prioritaire",
      "IA intégrée",
      "Export données illimité",
    ],
    cta: "Configurer dans Stripe",
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID ?? null,
  },
  {
    id: "entreprise",
    label: "Entreprise",
    price: "Sur devis",
    period: "",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    features: [
      "Toutes les fonctionnalités Outils DJAMA",
      "Accès multi-organisation",
      "Sous-domaine personnalisé",
      "SLA 99.9%",
      "Onboarding dédié",
      "Intégrations sur mesure",
    ],
    cta: "Contact commercial",
    stripe_price_id: null,
  },
];

const QUICK_LINKS = [
  { href: "/admin/acces",     label: "Abonnements actifs", icon: Users },
  { href: "/admin/paiements", label: "Historique paiements", icon: CreditCard },
  { href: "/admin/coupons",   label: "Codes promo", icon: Zap },
  { href: "/admin/entreprises", label: "Comptes entreprise", icon: Building2 },
];

export default function PlansPage() {
  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black tracking-tight" style={{ color: V.text }}>
            <Sliders size={18} style={{ color: V.gold }} />
            Offres d'abonnement
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            Plans commerciaux de DJAMA SaaS — 3 niveaux
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com/products"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[0.73rem] font-medium transition"
          style={{ borderColor: V.border, color: V.textMuted }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = V.borderHov}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = V.border}
        >
          <ExternalLink size={12} />
          Stripe Products
        </a>
      </div>

      {/* Grille des plans */}
      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className="flex flex-col rounded-2xl border p-6"
            style={{ background: V.card, borderColor: V.border }}
          >
            {/* Badge + nom */}
            <div className="mb-4">
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider"
                style={{ background: plan.bg, color: plan.color }}
              >
                {plan.label}
              </span>
            </div>

            {/* Prix */}
            <div className="mb-6">
              <span className="text-[2rem] font-black leading-none tracking-tight" style={{ color: V.text }}>
                {plan.price}
              </span>
              {plan.period && (
                <span className="ml-1 text-[0.8rem]" style={{ color: V.textFaint }}>{plan.period}</span>
              )}
            </div>

            {/* Fonctionnalités */}
            <ul className="mb-6 flex-1 space-y-2.5">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[0.8rem]" style={{ color: V.textSub }}>
                  <Check size={12} style={{ color: plan.color, marginTop: 3, flexShrink: 0 }} strokeWidth={3} />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA / Stripe info */}
            {plan.stripe_price_id && (
              <div
                className="mb-3 rounded-lg px-3 py-2 text-[0.72rem] font-mono"
                style={{ background: V.surface, color: V.textFaint }}
              >
                price_id: {plan.stripe_price_id.slice(0, 20)}…
              </div>
            )}

            {plan.cta && (
              <a
                href={plan.id === "outils_djama"
                  ? "https://dashboard.stripe.com/products"
                  : "/admin/messages"
                }
                target={plan.id === "outils_djama" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[0.78rem] font-semibold transition"
                style={{ background: plan.bg, color: plan.color, border: `1px solid ${plan.color}30` }}
              >
                <ExternalLink size={12} />
                {plan.cta}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Accès rapides */}
      <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
        <h2 className="mb-4 text-[0.87rem] font-bold" style={{ color: V.text }}>Gestion des abonnements</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2.5 rounded-xl border p-3.5 text-center text-[0.75rem] font-medium transition-all"
              style={{ borderColor: V.border, color: V.textSub }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = V.borderHov;
                (e.currentTarget as HTMLAnchorElement).style.background = V.surfaceHov;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = V.border;
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: V.goldDim }}
              >
                <Icon size={15} style={{ color: V.gold }} strokeWidth={2} />
              </div>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Note de configuration */}
      <div
        className="rounded-xl px-5 py-4 text-[0.8rem]"
        style={{ background: V.card, border: `1px solid ${V.border}`, color: V.textSub }}
      >
        <p className="font-semibold mb-1" style={{ color: V.textMuted }}>Configuration Stripe</p>
        <p>
          Les prix et produits sont configurés directement dans le dashboard Stripe.
          L'ID de prix (<code className="text-[0.72rem] font-mono" style={{ color: V.gold }}>NEXT_PUBLIC_STRIPE_PRICE_ID</code>) est
          utilisé par le module de paiement pour créer les abonnements.
          Les essais gratuits et coupons se configurent dans{" "}
          <Link href="/admin/essais" className="font-medium transition hover:opacity-75" style={{ color: V.gold }}>Essais</Link>{" "}
          et{" "}
          <Link href="/admin/coupons" className="font-medium transition hover:opacity-75" style={{ color: V.gold }}>Coupons</Link>.
        </p>
      </div>
    </div>
  );
}
