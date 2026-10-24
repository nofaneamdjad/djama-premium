"use client";

import { LayoutGrid, CheckCircle, Settings, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { V } from "@/components/hq";

const MODULES = [
  { slug: "crm",           label: "CRM",              desc: "Contacts, pipeline, leads",          status: "actif" },
  { slug: "factures",      label: "Facturation",       desc: "Factures, devis, relances",          status: "actif" },
  { slug: "planning",      label: "Planning",          desc: "Agenda, événements, créneaux",       status: "actif" },
  { slug: "rdv",           label: "Rendez-vous",       desc: "Prise de RDV en ligne",              status: "actif" },
  { slug: "projets",       label: "Projets",           desc: "Gestion de projets",                 status: "actif" },
  { slug: "equipe",        label: "Équipe",            desc: "Membres, tâches, messagerie",        status: "actif" },
  { slug: "banque",        label: "Banque",            desc: "Transactions, rapprochement",        status: "actif" },
  { slug: "signature",     label: "Signature",         desc: "Signature électronique",             status: "actif" },
  { slug: "declarations",  label: "Déclarations",      desc: "Déclarations fiscales et sociales",  status: "actif" },
  { slug: "stock",         label: "Stock",             desc: "Inventaire, produits",               status: "actif" },
  { slug: "shop",          label: "Boutique",          desc: "E-commerce, commandes",              status: "actif" },
  { slug: "pos",           label: "POS",               desc: "Point de vente",                     status: "actif" },
  { slug: "analytics",     label: "Analytics",         desc: "Tableaux de bord, KPIs",             status: "actif" },
  { slug: "chatbot",       label: "Chatbot IA",        desc: "Assistant IA client",                status: "actif" },
  { slug: "carte-visite",  label: "Carte de visite",   desc: "Cartes numériques",                  status: "actif" },
  { slug: "site-web",      label: "Site web",          desc: "Constructeur de site",               status: "actif" },
  { slug: "blog",          label: "Blog",              desc: "Articles, SEO",                      status: "actif" },
  { slug: "social",        label: "Réseaux sociaux",   desc: "Publications, calendrier",           status: "actif" },
  { slug: "prestataires",  label: "Prestataires",      desc: "Gestion fournisseurs",               status: "actif" },
  { slug: "notes",         label: "Notes",             desc: "Bloc-notes, mémos audio",            status: "actif" },
  { slug: "espaces",       label: "Espaces privés",    desc: "Zones collaboratives",               status: "actif" },
  { slug: "reputation",    label: "Réputation",        desc: "Avis, e-réputation",                 status: "actif" },
  { slug: "sourcing",      label: "Sourcing",          desc: "Appels d'offres, fournisseurs",      status: "actif" },
  { slug: "coaching-ia",   label: "Coaching IA",       desc: "Formation personnalisée",            status: "actif" },
];

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black tracking-tight" style={{ color: V.text }}>
            <LayoutGrid size={18} style={{ color: V.gold }} />
            Applications DJAMA
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            {MODULES.length} modules · Tous actifs
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/hq/feature-flags"
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[0.73rem] font-medium transition"
            style={{ borderColor: V.border, color: V.textMuted }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = V.borderHov}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = V.border}
          >
            <Settings size={12} />
            Feature Flags
          </Link>
          <Link
            href="/admin/permissions"
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[0.73rem] font-medium transition"
            style={{ borderColor: V.border, color: V.textMuted }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = V.borderHov}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = V.border}
          >
            <LinkIcon size={12} />
            Permissions par plan
          </Link>
        </div>
      </div>

      {/* Grille des modules */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map(m => (
          <div
            key={m.slug}
            className="group flex items-start gap-3 rounded-xl p-4 transition-all"
            style={{ background: V.card, border: `1px solid ${V.border}` }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = V.borderHov}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = V.border}
          >
            <CheckCircle size={14} style={{ color: V.gold, marginTop: 3, flexShrink: 0 }} strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.83rem] font-semibold" style={{ color: V.text }}>{m.label}</p>
                <span
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold"
                  style={{ background: "rgba(52,211,153,0.10)", color: "#34d399" }}
                >
                  {m.status}
                </span>
              </div>
              <p className="mt-0.5 text-[0.75rem]" style={{ color: V.textFaint }}>{m.desc}</p>
              <code className="mt-1 block text-[0.63rem]" style={{ color: V.textFaint }}>/{m.slug}</code>
            </div>
          </div>
        ))}
      </div>

      {/* Note de gouvernance */}
      <div
        className="rounded-xl px-5 py-4 text-[0.8rem]"
        style={{ background: V.card, border: `1px solid ${V.border}`, color: V.textSub }}
      >
        La gestion des plans et permissions par module est disponible depuis les sections{" "}
        <Link href="/admin/plans" className="font-medium transition hover:opacity-75" style={{ color: V.gold }}>Plans</Link>{" "}
        et{" "}
        <Link href="/admin/permissions" className="font-medium transition hover:opacity-75" style={{ color: V.gold }}>Permissions</Link>.
        Les feature flags globaux se configurent depuis{" "}
        <Link href="/admin/hq/feature-flags" className="font-medium transition hover:opacity-75" style={{ color: V.gold }}>Feature Flags</Link>.
      </div>
    </div>
  );
}
