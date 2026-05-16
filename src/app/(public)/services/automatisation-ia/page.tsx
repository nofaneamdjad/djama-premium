"use client";

import {
  Mail,
  Sparkles,
  Users,
  MessageSquare,
  Database,
  FileText,
  BarChart3,
  Bell,
  Globe,
  Brain,
  Search,
  Workflow,
  Code2,
  Rocket,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function AutomatisationIAPage() {
  return (
    <ServicePageShell
      icon={Brain}
      color="#2dd4bf"
      colorRGB="45,212,191"
      badge="IA · Automatisation de processus"
      title={
        <>
          Automatisez votre business{" "}
          <span style={{ color: "#2dd4bf" }}>grâce à l&apos;IA</span>
        </>
      }
      subtitle="Workflows intelligents, agents IA autonomes et intégrations sur mesure — travaillez moins, produisez plus."
      stats={[
        { value: "800+", label: "outils intégrables" },
        { value: "–70%", label: "de tâches manuelles" },
        { value: "24h/7j", label: "travail automatique" },
      ]}
      ctaLabel="Automatiser mon business"
      ctaHref="/contact"
      ctaSecLabel="Voir un exemple"
      ctaSecHref="/contact"
      featuresTitle="Ce qu'on peut automatiser"
      features={[
        {
          icon: Mail,
          color: "#2dd4bf",
          title: "Emails & relances",
          desc: "Campagnes, onboarding, relances clients — tout en automatique.",
        },
        {
          icon: Sparkles,
          color: "#a78bfa",
          title: "Génération de contenu",
          desc: "Articles, posts, descriptions produits générés par GPT-4.",
        },
        {
          icon: Users,
          color: "#60a5fa",
          title: "Qualification de leads",
          desc: "Scoring, enrichissement CRM, segmentation automatique.",
        },
        {
          icon: MessageSquare,
          color: "#f472b6",
          title: "Support client IA",
          desc: "Chatbot, triage de tickets, réponses automatiques 24h/7j.",
        },
        {
          icon: Database,
          color: "#4ade80",
          title: "Traitement de données",
          desc: "ETL, synchronisation, nettoyage et enrichissement de bases.",
        },
        {
          icon: FileText,
          color: "#fb923c",
          title: "Génération de documents",
          desc: "Devis, contrats, rapports PDF générés à la demande.",
        },
        {
          icon: BarChart3,
          color: "#f9a826",
          title: "Reporting automatisé",
          desc: "KPIs, alertes, tableaux de bord envoyés par email.",
        },
        {
          icon: Bell,
          color: "#38bdf8",
          title: "Intégrations API",
          desc: "Connectez 800+ outils : CRM, ERP, Slack, Notion, Airtable…",
        },
        {
          icon: Globe,
          color: "#34d399",
          title: "Scraping & veille",
          desc: "Surveillance de marché, prix concurrents, actualités ciblées.",
        },
        {
          icon: Brain,
          color: "#2dd4bf",
          title: "Agents IA autonomes",
          desc: "Des IA qui exécutent des tâches complexes sans intervention humaine.",
        },
      ]}
      processTitle="Notre méthode d'automatisation"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#2dd4bf",
          title: "Audit",
          desc: "Analyse de vos processus et identification des gains rapides.",
          tag: "Sem. 1",
        },
        {
          num: "02",
          icon: Search,
          color: "#60a5fa",
          title: "Design",
          desc: "Schéma du workflow, outils sélectionnés, validation.",
          tag: "Sem. 1–2",
        },
        {
          num: "03",
          icon: Workflow,
          color: "#a78bfa",
          title: "Développement",
          desc: "Création des automatisations et agents IA.",
          tag: "Sem. 2–4",
        },
        {
          num: "04",
          icon: Code2,
          color: "#f9a826",
          title: "Tests",
          desc: "Validation en conditions réelles, ajustements.",
          tag: "Sem. 4",
        },
        {
          num: "05",
          icon: Rocket,
          color: "#4ade80",
          title: "Déploiement",
          desc: "Mise en prod, formation équipe, monitoring.",
          tag: "Sem. 5",
        },
      ]}
    />
  );
}
