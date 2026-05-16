"use client";

import {
  Globe,
  Zap,
  Brain,
  Database,
  Code2,
  BarChart3,
  Lock,
  Bell,
  CreditCard,
  GitBranch,
  MessageSquare,
  Compass,
  Palette,
  TestTube2,
  Rocket,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function SolutionsDigitalesPage() {
  return (
    <ServicePageShell
      icon={Globe}
      color="#38bdf8"
      colorRGB="56,189,248"
      badge="Digital · Solutions sur mesure"
      title={
        <>
          Solutions digitales{" "}
          <span style={{ color: "#38bdf8" }}>sur mesure</span>
        </>
      }
      subtitle="Web, automatisation, IA et intégrations — on conçoit la solution exacte dont votre entreprise a besoin."
      stats={[
        { value: "Stack moderne", label: "Next.js · Node.js · IA" },
        { value: "4–12 sem.", label: "délai livraison" },
        { value: "MVP rapide", label: "validez vite" },
      ]}
      ctaLabel="Décrire mon projet"
      ctaHref="/contact"
      ctaSecLabel="Voir nos références"
      ctaSecHref="/realisations"
      featuresTitle="Nos domaines d'expertise"
      features={[
        {
          icon: Globe,
          color: "#38bdf8",
          title: "Applications web",
          desc: "Next.js, React, Node.js — performant, scalable, SEO-friendly.",
        },
        {
          icon: Zap,
          color: "#a78bfa",
          title: "Automatisations",
          desc: "Make, Zapier, n8n, scripts Python — vos processus en pilotage automatique.",
        },
        {
          icon: Brain,
          color: "#f472b6",
          title: "Intégration IA",
          desc: "OpenAI, Claude, Gemini — IA intégrée dans vos outils métier existants.",
        },
        {
          icon: Database,
          color: "#4ade80",
          title: "Bases de données",
          desc: "PostgreSQL, MongoDB, Supabase — architecture pensée pour durer.",
        },
        {
          icon: Code2,
          color: "#fb923c",
          title: "APIs & intégrations",
          desc: "REST, GraphQL, webhooks — connectez tous vos outils.",
        },
        {
          icon: BarChart3,
          color: "#f9a826",
          title: "Analytics & dashboards",
          desc: "Tableaux de bord temps réel, exports, alertes automatiques.",
        },
        {
          icon: Lock,
          color: "#34d399",
          title: "Sécurité & RGPD",
          desc: "Auth sécurisée, chiffrement, conformité, audits de sécurité.",
        },
        {
          icon: Bell,
          color: "#60a5fa",
          title: "Notifications omnicanal",
          desc: "Email, SMS, push, in-app — à la bonne personne, au bon moment.",
        },
        {
          icon: CreditCard,
          color: "#f43f5e",
          title: "Paiements",
          desc: "Stripe, abonnements, facturation automatique, webhooks comptables.",
        },
        {
          icon: GitBranch,
          color: "#c084fc",
          title: "CI/CD & DevOps",
          desc: "Déploiement continu, monitoring, rollback, infrastructure cloud.",
        },
      ]}
      processTitle="Notre approche projet"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#38bdf8",
          title: "Discovery",
          desc: "Audit des besoins, contraintes et opportunités.",
          tag: "Sem. 1",
        },
        {
          num: "02",
          icon: Compass,
          color: "#a78bfa",
          title: "Architecture",
          desc: "Stack technique, schéma, feuille de route.",
          tag: "Sem. 1–2",
        },
        {
          num: "03",
          icon: Palette,
          color: "#f472b6",
          title: "Design",
          desc: "UX/UI, maquettes, design system.",
          tag: "Sem. 2–3",
        },
        {
          num: "04",
          icon: Code2,
          color: "#4ade80",
          title: "Build",
          desc: "Développement agile, sprints, démos régulières.",
          tag: "Sem. 3–10",
        },
        {
          num: "05",
          icon: TestTube2,
          color: "#f9a826",
          title: "QA",
          desc: "Tests unitaires, intégration, sécurité.",
          tag: "Sem. 10–11",
        },
        {
          num: "06",
          icon: Rocket,
          color: "#34d399",
          title: "Live",
          desc: "Déploiement, monitoring, documentation.",
          tag: "Sem. 12",
        },
      ]}
    />
  );
}
