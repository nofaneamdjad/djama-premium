"use client";

import {
  Brain,
  Sparkles,
  Users2,
  BarChart3,
  Briefcase,
  HeartHandshake,
  FileText,
  Zap,
  Shield,
  BookOpen,
  BadgeCheck,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function CoachingIAPage() {
  return (
    <ServicePageShell
      icon={Brain}
      color="#a78bfa"
      colorRGB="167,139,250"
      badge="Formation · Intelligence Artificielle"
      title={
        <>
          Maîtrisez l&apos;IA,{" "}
          <span style={{ color: "#a78bfa" }}>transformez votre activité</span>
        </>
      }
      subtitle="6 modules · 20 chapitres · 4h d'accompagnement expert. Apprenez à automatiser, créer et déléguer grâce à l'IA."
      stats={[
        { value: "6 modules", label: "progressifs" },
        { value: "20h+", label: "de contenu" },
        { value: "7 jours", label: "satisfait ou remboursé" },
      ]}
      ctaLabel="Accéder à la formation"
      ctaHref="/espace-client"
      ctaSecLabel="En savoir plus"
      ctaSecHref="/contact"
      featuresTitle="Ce que vous allez maîtriser"
      features={[
        {
          icon: Sparkles,
          color: "#a78bfa",
          title: "Documents en 30 secondes",
          desc: "Générez emails, devis et contrats avec l'IA en quelques clics.",
        },
        {
          icon: Zap,
          color: "#60a5fa",
          title: "5 à 15h gagnées/semaine",
          desc: "Automatisez les tâches répétitives qui vous volent du temps.",
        },
        {
          icon: Users2,
          color: "#4ade80",
          title: "Prospection augmentée",
          desc: "Trouvez et qualifiez vos clients grâce aux agents IA.",
        },
        {
          icon: BarChart3,
          color: "#f9a826",
          title: "Contenu 10× plus rapide",
          desc: "Posts, vidéos, newsletters — créez à la vitesse de la pensée.",
        },
        {
          icon: Brain,
          color: "#f472b6",
          title: "Analyse business",
          desc: "Comprenez vos données en quelques secondes avec l'IA.",
        },
        {
          icon: Briefcase,
          color: "#34d399",
          title: "Délégation à l'IA",
          desc: "Des agents autonomes qui travaillent pour vous 24h/7j.",
        },
        {
          icon: FileText,
          color: "#fb923c",
          title: "Bibliothèque de prompts",
          desc: "200+ prompts prêts à l'emploi classés par usage.",
        },
        {
          icon: HeartHandshake,
          color: "#38bdf8",
          title: "Comparateur d'outils",
          desc: "ChatGPT, Claude, Gemini — choisissez le bon outil.",
        },
        {
          icon: Shield,
          color: "#a3e635",
          title: "Certifié DJAMA",
          desc: "Attestation de formation à l'issue du parcours.",
        },
      ]}
      processTitle="Le programme en 6 modules"
      process={[
        {
          num: "01",
          icon: BookOpen,
          color: "#a78bfa",
          title: "Fondations",
          desc: "Comprendre comment fonctionnent les IA.",
          tag: "Module 1",
        },
        {
          num: "02",
          icon: Brain,
          color: "#60a5fa",
          title: "Prompting",
          desc: "L'art de parler aux IA pour obtenir les meilleurs résultats.",
          tag: "Module 2",
        },
        {
          num: "03",
          icon: Sparkles,
          color: "#4ade80",
          title: "Outils IA",
          desc: "ChatGPT, Claude, Gemini — maîtrisez chaque outil.",
          tag: "Modules 3–4",
        },
        {
          num: "04",
          icon: BarChart3,
          color: "#f9a826",
          title: "Automatisation",
          desc: "Workflows, agents IA et délégation des tâches.",
          tag: "Module 5",
        },
        {
          num: "05",
          icon: BadgeCheck,
          color: "#f472b6",
          title: "Certification",
          desc: "Évaluation finale et attestation DJAMA.",
          tag: "Module 6",
        },
      ]}
      pricingTitle="Accéder à la formation"
      plans={[
        {
          name: "Abonnés DJAMA Pro",
          price: "GRATUIT",
          unit: "inclus avec l'abonnement 11,90€/mois",
          desc: "Formation complète offerte avec votre abonnement",
          features: [
            "Accès immédiat aux 6 modules",
            "Assistant IA pédagogique 24h/7j",
            "Quiz et fiches PDF",
            "Bibliothèque 200+ prompts",
            "Mises à jour à vie",
            "20 outils pros inclus",
          ],
          hot: true,
        },
        {
          name: "Achat individuel",
          price: "190€",
          unit: "paiement unique · accès 3 mois",
          desc: "Accès complet sans abonnement",
          features: [
            "6 modules complets",
            "Quiz et fiches PDF",
            "Bibliothèque de prompts",
            "Satisfait ou remboursé 7j",
          ],
          hot: false,
        },
      ]}
    />
  );
}
