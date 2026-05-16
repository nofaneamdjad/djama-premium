"use client";

import Link from "next/link";
import {
  Lock,
  Users,
  BarChart3,
  CreditCard,
  Bell,
  FileText,
  Code2,
  Globe,
  Shield,
  Database,
  MessageSquare,
  Palette,
  TestTube2,
  Rocket,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function PlateformeWebSurMesurePage() {
  return (
    <ServicePageShell
      icon={Code2}
      color="#818cf8"
      colorRGB="129,140,248"
      badge="Développement · Plateforme Web"
      title={
        <>
          Votre plateforme web{" "}
          <span style={{ color: "#818cf8" }}>100% sur mesure</span>
        </>
      }
      subtitle="SaaS, outil métier, marketplace ou extranet — on conçoit et développe votre plateforme de A à Z."
      stats={[
        { value: "4–12 sem.", label: "délai selon scope" },
        { value: "API REST", label: "architecture scalable" },
        { value: "Multi-user", label: "rôles & permissions" },
      ]}
      ctaHref="/contact"
      ctaLabel="Étudier mon projet"
      ctaSecHref="/realisations"
      ctaSecLabel="Voir nos références"
      featuresTitle="Ce qui est inclus"
      features={[
        {
          icon: Lock,
          color: "#818cf8",
          title: "Authentification avancée",
          desc: "SSO, OAuth, MFA, gestion de sessions sécurisée.",
        },
        {
          icon: Users,
          color: "#818cf8",
          title: "Rôles & permissions",
          desc: "Super admin, admin, utilisateur, invité — granularité totale.",
        },
        {
          icon: BarChart3,
          color: "#818cf8",
          title: "Dashboard sur mesure",
          desc: "KPIs, graphiques temps réel, filtres et exports PDF/CSV.",
        },
        {
          icon: CreditCard,
          color: "#818cf8",
          title: "Facturation intégrée",
          desc: "Stripe, abonnements, factures automatiques, webhooks.",
        },
        {
          icon: Bell,
          color: "#818cf8",
          title: "Notifications",
          desc: "Email, SMS, in-app, push — règles et triggers configurables.",
        },
        {
          icon: FileText,
          color: "#818cf8",
          title: "Documents & PDF",
          desc: "Génération automatique de contrats, devis, rapports.",
        },
        {
          icon: Code2,
          color: "#818cf8",
          title: "API REST / GraphQL",
          desc: "Documentation Swagger, webhooks, intégrations tierces.",
        },
        {
          icon: Globe,
          color: "#818cf8",
          title: "Multi-locataire",
          desc: "Architecture SaaS multi-tenant, isolation des données.",
        },
        {
          icon: Shield,
          color: "#818cf8",
          title: "Sécurité enterprise",
          desc: "HTTPS, RGPD, logs d'audit, backup automatique.",
        },
        {
          icon: Database,
          color: "#818cf8",
          title: "Base de données optimisée",
          desc: "PostgreSQL, migrations versionnées, performances.",
        },
      ]}
      processTitle="Notre méthode agile"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#818cf8",
          title: "Découverte",
          desc: "Besoins métier, utilisateurs, contraintes techniques.",
          tag: "Sem. 1",
        },
        {
          num: "02",
          icon: FileText,
          color: "#818cf8",
          title: "Architecture",
          desc: "Schéma BDD, API design, choix technologiques.",
          tag: "Sem. 2",
        },
        {
          num: "03",
          icon: Palette,
          color: "#818cf8",
          title: "Design UX",
          desc: "Wireframes, maquettes, design system.",
          tag: "Sem. 3–4",
        },
        {
          num: "04",
          icon: Code2,
          color: "#818cf8",
          title: "Développement",
          desc: "Sprints agiles, démos bi-hebdomadaires.",
          tag: "Sem. 5–10",
        },
        {
          num: "05",
          icon: TestTube2,
          color: "#818cf8",
          title: "Tests & QA",
          desc: "Tests unitaires, intégration, sécurité, charge.",
          tag: "Sem. 11",
        },
        {
          num: "06",
          icon: Rocket,
          color: "#818cf8",
          title: "Déploiement",
          desc: "Mise en production, monitoring, documentation.",
          tag: "Sem. 12",
        },
      ]}
    />
  );
}
