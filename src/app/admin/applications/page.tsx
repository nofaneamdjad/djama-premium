"use client";

import { LayoutGrid, CheckCircle } from "lucide-react";

const GOLD   = "#c9a55a";
const BORDER = "rgba(255,255,255,0.07)";
const CARD   = "#131620";

const MODULES = [
  { slug: "crm",           label: "CRM",              desc: "Contacts, pipeline, leads" },
  { slug: "factures",      label: "Facturation",       desc: "Factures, devis, relances" },
  { slug: "planning",      label: "Planning",          desc: "Agenda, événements, créneaux" },
  { slug: "rdv",           label: "Rendez-vous",       desc: "Prise de RDV en ligne" },
  { slug: "projets",       label: "Projets",           desc: "Gestion de projets" },
  { slug: "equipe",        label: "Équipe",            desc: "Membres, tâches, messagerie" },
  { slug: "banque",        label: "Banque",            desc: "Transactions, rapprochement" },
  { slug: "signature",     label: "Signature",         desc: "Signature électronique" },
  { slug: "declarations",  label: "Déclarations",      desc: "Déclarations fiscales et sociales" },
  { slug: "stock",         label: "Stock",             desc: "Inventaire, produits" },
  { slug: "shop",          label: "Boutique",          desc: "E-commerce, commandes" },
  { slug: "pos",           label: "POS",               desc: "Point de vente" },
  { slug: "analytics",     label: "Analytics",         desc: "Tableaux de bord, KPIs" },
  { slug: "chatbot",       label: "Chatbot IA",        desc: "Assistant IA client" },
  { slug: "carte-visite",  label: "Carte de visite",   desc: "Cartes numériques" },
  { slug: "site-web",      label: "Site web",          desc: "Constructeur de site" },
  { slug: "blog",          label: "Blog",              desc: "Articles, SEO" },
  { slug: "social",        label: "Réseaux sociaux",   desc: "Publications, calendrier" },
  { slug: "prestataires",  label: "Prestataires",      desc: "Gestion fournisseurs" },
  { slug: "notes",         label: "Notes",             desc: "Bloc-notes, mémos audio" },
  { slug: "espaces",       label: "Espaces privés",    desc: "Zones collaboratives" },
  { slug: "reputation",    label: "Réputation",        desc: "Avis, e-réputation" },
  { slug: "sourcing",      label: "Sourcing",          desc: "Appels d'offres, fournisseurs" },
  { slug: "coaching-ia",   label: "Coaching IA",       desc: "Formation personnalisée" },
];

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <LayoutGrid size={18} style={{ color: GOLD }} />
          Applications DJAMA
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Inventaire des {MODULES.length} modules de la plateforme
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map(m => (
          <div
            key={m.slug}
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <CheckCircle size={14} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{m.label}</p>
              <p className="text-xs text-white/35 mt-0.5">{m.desc}</p>
              <code className="mt-1 block text-[0.65rem] text-white/20">{m.slug}</code>
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl px-5 py-4 text-sm text-white/40"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}
      >
        La gestion des plans et permissions par module sera disponible depuis les sections{" "}
        <span className="font-medium text-white/60">Plans</span> et{" "}
        <span className="font-medium text-white/60">Permissions</span>.
      </div>
    </div>
  );
}
