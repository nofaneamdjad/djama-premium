"use client";

import {
  Calculator,
  FileText,
  Clock,
  Shield,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Users,
  MessageSquare,
  CheckSquare,
  Send,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function DeclarationsUrssafPage() {
  return (
    <ServicePageShell
      icon={Calculator}
      color="#c9a55a"
      colorRGB="201,165,90"
      badge="Administratif · URSSAF"
      title={
        <>
          Déclarations URSSAF{" "}
          <span style={{ color: "#c9a55a" }}>sans erreur</span>
        </>
      }
      subtitle="Accompagnement pour vos déclarations de chiffre d'affaires URSSAF — on vous guide pas à pas, sans stress."
      stats={[
        { value: "Chaque trimestre", label: "déclaration obligatoire" },
        { value: "0 erreur", label: "grâce à nos vérifications" },
        { value: "24h", label: "délai d'accompagnement" },
      ]}
      ctaLabel="Obtenir de l'aide"
      ctaHref="/contact"
      ctaSecLabel="Poser une question"
      ctaSecHref="/contact"
      featuresTitle="Comment on vous aide"
      features={[
        {
          icon: Calculator,
          color: "#c9a55a",
          title: "Aide à la déclaration",
          desc: "On vous guide dans la saisie de votre chiffre d'affaires sur le portail.",
        },
        {
          icon: FileText,
          color: "#c9a55a",
          title: "Vérification avant envoi",
          desc: "On contrôle chaque chiffre pour éviter les erreurs et pénalités.",
        },
        {
          icon: Clock,
          color: "#c9a55a",
          title: "Rappels de délais",
          desc: "On vous avertit avant chaque date limite de déclaration.",
        },
        {
          icon: Shield,
          color: "#c9a55a",
          title: "Explication des cotisations",
          desc: "Vous comprenez exactement ce que vous payez et pourquoi.",
        },
        {
          icon: BookOpen,
          color: "#c9a55a",
          title: "Premières déclarations",
          desc: "Accompagnement spécial pour les auto-entrepreneurs débutants.",
        },
        {
          icon: HelpCircle,
          color: "#c9a55a",
          title: "Régularisations",
          desc: "Aide en cas d'oubli, retard ou déclaration à corriger.",
        },
        {
          icon: CheckCircle2,
          color: "#c9a55a",
          title: "Conseils fiscaux simples",
          desc: "TVA, seuils, franchise, exonérations — expliqués clairement.",
        },
        {
          icon: Users,
          color: "#c9a55a",
          title: "Support questions",
          desc: "Réponses à toutes vos questions URSSAF par message sous 24h.",
        },
      ]}
      processTitle="Notre accompagnement étape par étape"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#c9a55a",
          title: "Collecte",
          desc: "Vous nous transmettez vos revenus du trimestre.",
          tag: "J-7",
        },
        {
          num: "02",
          icon: FileText,
          color: "#c9a55a",
          title: "Vérification",
          desc: "On contrôle vos chiffres et calcule vos cotisations.",
          tag: "J-5",
        },
        {
          num: "03",
          icon: CheckSquare,
          color: "#c9a55a",
          title: "Préparation",
          desc: "Saisie et vérification du formulaire de déclaration.",
          tag: "J-3",
        },
        {
          num: "04",
          icon: Send,
          color: "#c9a55a",
          title: "Validation",
          desc: "Vous validez avant toute soumission.",
          tag: "J-2",
        },
        {
          num: "05",
          icon: CheckCircle2,
          color: "#c9a55a",
          title: "Envoi",
          desc: "Déclaration soumise sur le portail URSSAF.",
          tag: "Avant la date limite",
        },
      ]}
      pricingTitle="Tarifs transparents"
      plans={[
        {
          name: "Par déclaration",
          price: "29€",
          unit: "par trimestre",
          desc: "Accompagnement pour une déclaration",
          features: [
            "Aide à la saisie",
            "Vérification des chiffres",
            "Calcul des cotisations",
            "Confirmation d'envoi",
            "Support questions",
          ],
          hot: false,
        },
        {
          name: "Abonnement annuel",
          price: "89€",
          unit: "par an",
          desc: "Les 4 déclarations annuelles",
          features: [
            "4 déclarations trimestrielles",
            "Rappels automatiques",
            "Vérification systématique",
            "Support prioritaire",
            "Conseils toute l'année",
          ],
          hot: true,
        },
      ]}
    />
  );
}
