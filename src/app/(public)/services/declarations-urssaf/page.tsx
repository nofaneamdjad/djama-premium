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
      color="#FFB900"
      colorRGB="255,185,0"
      badge="Administratif · URSSAF"
      title={
        <>
          Déclarations URSSAF{" "}
          <span style={{ color: "#FFB900" }}>sans erreur</span>
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
          color: "#FFB900",
          title: "Aide à la déclaration",
          desc: "On vous guide dans la saisie de votre chiffre d'affaires sur le portail.",
        },
        {
          icon: FileText,
          color: "#FFB900",
          title: "Vérification avant envoi",
          desc: "On contrôle chaque chiffre pour éviter les erreurs et pénalités.",
        },
        {
          icon: Clock,
          color: "#FFB900",
          title: "Rappels de délais",
          desc: "On vous avertit avant chaque date limite de déclaration.",
        },
        {
          icon: Shield,
          color: "#FFB900",
          title: "Explication des cotisations",
          desc: "Vous comprenez exactement ce que vous payez et pourquoi.",
        },
        {
          icon: BookOpen,
          color: "#FFB900",
          title: "Premières déclarations",
          desc: "Accompagnement spécial pour les auto-entrepreneurs débutants.",
        },
        {
          icon: HelpCircle,
          color: "#FFB900",
          title: "Régularisations",
          desc: "Aide en cas d'oubli, retard ou déclaration à corriger.",
        },
        {
          icon: CheckCircle2,
          color: "#FFB900",
          title: "Conseils fiscaux simples",
          desc: "TVA, seuils, franchise, exonérations — expliqués clairement.",
        },
        {
          icon: Users,
          color: "#FFB900",
          title: "Support questions",
          desc: "Réponses à toutes vos questions URSSAF par message sous 24h.",
        },
      ]}
      processTitle="Notre accompagnement étape par étape"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#FFB900",
          title: "Collecte",
          desc: "Vous nous transmettez vos revenus du trimestre.",
          tag: "J-7",
        },
        {
          num: "02",
          icon: FileText,
          color: "#FFB900",
          title: "Vérification",
          desc: "On contrôle vos chiffres et calcule vos cotisations.",
          tag: "J-5",
        },
        {
          num: "03",
          icon: CheckSquare,
          color: "#FFB900",
          title: "Préparation",
          desc: "Saisie et vérification du formulaire de déclaration.",
          tag: "J-3",
        },
        {
          num: "04",
          icon: Send,
          color: "#FFB900",
          title: "Validation",
          desc: "Vous validez avant toute soumission.",
          tag: "J-2",
        },
        {
          num: "05",
          icon: CheckCircle2,
          color: "#FFB900",
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
