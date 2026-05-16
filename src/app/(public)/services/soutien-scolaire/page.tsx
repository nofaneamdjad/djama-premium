"use client";

import {
  BookOpen,
  Video,
  Clock,
  Target,
  HeartHandshake,
  Star,
  Calculator,
  Globe,
  Microscope,
  Brain,
  MessageSquare,
  Calendar,
  TrendingUp,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function SoutienScolairePage() {
  return (
    <ServicePageShell
      icon={BookOpen}
      color="#60a5fa"
      colorRGB="96,165,250"
      badge="Éducation · Soutien Scolaire"
      title={
        <>
          Soutien scolaire{" "}
          <span style={{ color: "#60a5fa" }}>en ligne</span>
        </>
      }
      subtitle="Cours particuliers en ligne du collège à la terminale — professeurs qualifiés, méthode progressive, résultats garantis."
      stats={[
        { value: "14€", label: "de l'heure" },
        { value: "Collège → Terminale", label: "tous niveaux" },
        { value: "8 matières", label: "disponibles" },
      ]}
      ctaLabel="Réserver un cours"
      ctaHref="/contact"
      ctaSecLabel="En savoir plus"
      ctaSecHref="/contact"
      featuresTitle="Pourquoi choisir DJAMA ?"
      features={[
        {
          icon: Video,
          color: "#60a5fa",
          title: "Cours en visio",
          desc: "Sessions en direct sur Google Meet ou Zoom, partage d'écran interactif.",
        },
        {
          icon: Clock,
          color: "#60a5fa",
          title: "Horaires flexibles",
          desc: "Soir, week-end, vacances scolaires — selon votre agenda.",
        },
        {
          icon: Target,
          color: "#60a5fa",
          title: "Méthode progressive",
          desc: "Rappel de cours, exercices guidés, exercices autonomes — en 3 temps.",
        },
        {
          icon: HeartHandshake,
          color: "#60a5fa",
          title: "Bienveillance",
          desc: "Aucune pression, un espace de confiance pour progresser à son rythme.",
        },
        {
          icon: Star,
          color: "#60a5fa",
          title: "Suivi personnalisé",
          desc: "Compte-rendu après chaque séance, points de progression.",
        },
        {
          icon: Calculator,
          color: "#60a5fa",
          title: "Tarif transparent",
          desc: "14€/h tout compris, pas de frais cachés ni d'engagement.",
        },
        {
          icon: Globe,
          color: "#60a5fa",
          title: "Mathématiques & Physique",
          desc: "Les matières scientifiques au cœur de nos spécialités.",
        },
        {
          icon: BookOpen,
          color: "#60a5fa",
          title: "Français & Anglais",
          desc: "Expression écrite, grammaire, compréhension, oral.",
        },
        {
          icon: Microscope,
          color: "#60a5fa",
          title: "Histoire-Géo & SVT",
          desc: "Cours complets, fiches de révision, méthode de dissertations.",
        },
        {
          icon: Brain,
          color: "#60a5fa",
          title: "NSI & Informatique",
          desc: "Programmation, algorithmes, bases de données — avec passion.",
        },
      ]}
      processTitle="Comment ça se passe"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#60a5fa",
          title: "Évaluation",
          desc: "On cerne le niveau, les lacunes et les objectifs de l'élève.",
          tag: "Gratuit",
        },
        {
          num: "02",
          icon: Calendar,
          color: "#60a5fa",
          title: "Planning",
          desc: "Planification des séances selon votre disponibilité.",
          tag: "Jour 1",
        },
        {
          num: "03",
          icon: Video,
          color: "#60a5fa",
          title: "Cours",
          desc: "Session en visio, exercices interactifs, explications claires.",
          tag: "J+1",
        },
        {
          num: "04",
          icon: BookOpen,
          color: "#60a5fa",
          title: "Bilan",
          desc: "Compte-rendu détaillé envoyé après chaque séance.",
          tag: "Après chaque cours",
        },
        {
          num: "05",
          icon: TrendingUp,
          color: "#60a5fa",
          title: "Progression",
          desc: "Suivi des notes, ajustement de la méthode si besoin.",
          tag: "Continu",
        },
      ]}
      pricingTitle="Des tarifs accessibles"
      plans={[
        {
          name: "À la séance",
          price: "14€",
          unit: "par heure",
          desc: "Cours sans engagement",
          features: [
            "1h de cours en visio",
            "Exercices fournis",
            "Bilan envoyé après",
            "Annulation 24h avant",
          ],
          hot: false,
        },
        {
          name: "Pack 10h",
          price: "120€",
          unit: "10 séances d'1h",
          desc: "Économisez 20€",
          features: [
            "10h de cours en visio",
            "Exercices et fiches inclus",
            "Suivi de progression",
            "Priorité de planning",
            "Valable 3 mois",
          ],
          hot: true,
        },
        {
          name: "Pack 20h",
          price: "220€",
          unit: "20 séances d'1h",
          desc: "Le plus avantageux",
          features: [
            "20h de cours en visio",
            "Tout Pack 10h inclus",
            "Fiches de révision personnalisées",
            "Bilan mensuel",
            "Valable 6 mois",
          ],
          hot: false,
        },
      ]}
    />
  );
}
