"use client";

import Link from "next/link";
import {
  Smartphone,
  Bell,
  Lock,
  LayoutDashboard,
  CreditCard,
  WifiOff,
  MapPin,
  Share2,
  Shield,
  Zap,
  MessageSquare,
  FileText,
  Palette,
  Code2,
  TestTube2,
  Rocket,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function ApplicationMobilePage() {
  return (
    <ServicePageShell
      icon={Smartphone}
      color="#22d3ee"
      colorRGB="34,211,238"
      badge="Développement · Application Mobile"
      title={
        <>
          Votre application mobile{" "}
          <span style={{ color: "#22d3ee" }}>iOS &amp; Android</span>
        </>
      }
      subtitle="Applications natives et cross-platform livrées sur App Store et Play Store. Du MVP à la plateforme complète."
      stats={[
        { value: "iOS + Android", label: "double publication" },
        { value: "4–8 sem.", label: "délai MVP" },
        { value: "App Store", label: "publication incluse" },
      ]}
      ctaHref="/contact"
      ctaLabel="Discuter de mon app"
      ctaSecHref="/contact"
      ctaSecLabel="Demander un devis"
      featuresTitle="Ce qui est inclus"
      features={[
        {
          icon: Smartphone,
          color: "#22d3ee",
          title: "iOS & Android",
          desc: "React Native ou Flutter. Une base de code, deux plateformes.",
        },
        {
          icon: Bell,
          color: "#22d3ee",
          title: "Push notifications",
          desc: "Atteignez vos utilisateurs en temps réel, sans algorithme.",
        },
        {
          icon: Lock,
          color: "#22d3ee",
          title: "Authentification",
          desc: "Email, Google, Apple Sign-In, biométrie (Face ID / Touch ID).",
        },
        {
          icon: LayoutDashboard,
          color: "#22d3ee",
          title: "Dashboard & analytics",
          desc: "KPIs en temps réel, graphiques, rapports personnalisés.",
        },
        {
          icon: CreditCard,
          color: "#22d3ee",
          title: "Paiements in-app",
          desc: "Stripe, Apple Pay, Google Pay, abonnements.",
        },
        {
          icon: WifiOff,
          color: "#22d3ee",
          title: "Mode hors-ligne",
          desc: "Données synchronisées à la reconnexion.",
        },
        {
          icon: MapPin,
          color: "#22d3ee",
          title: "Géolocalisation",
          desc: "Cartes, itinéraires, zones, tracking temps réel.",
        },
        {
          icon: Share2,
          color: "#22d3ee",
          title: "Partage & deeplinks",
          desc: "Partage natif, liens profonds, notifications riches.",
        },
        {
          icon: Shield,
          color: "#22d3ee",
          title: "Sécurité",
          desc: "Chiffrement, certificats SSL, stockage sécurisé des tokens.",
        },
        {
          icon: Zap,
          color: "#22d3ee",
          title: "Performance native",
          desc: "Animations 60fps, temps de démarrage < 2s.",
        },
      ]}
      processTitle="Notre processus de développement"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#22d3ee",
          title: "Découverte",
          desc: "Fonctionnalités, cibles, plateformes visées.",
          tag: "Sem. 1",
        },
        {
          num: "02",
          icon: FileText,
          color: "#22d3ee",
          title: "UX / Design",
          desc: "Wireframes + maquettes validées avec vous.",
          tag: "Sem. 2",
        },
        {
          num: "03",
          icon: Code2,
          color: "#22d3ee",
          title: "Développement",
          desc: "Sprints agiles, démos hebdomadaires.",
          tag: "Sem. 3–6",
        },
        {
          num: "04",
          icon: TestTube2,
          color: "#22d3ee",
          title: "Tests",
          desc: "QA interne, bêta testeurs, corrections.",
          tag: "Sem. 7",
        },
        {
          num: "05",
          icon: Rocket,
          color: "#22d3ee",
          title: "Publication",
          desc: "App Store & Play Store — on gère tout.",
          tag: "Sem. 8",
        },
      ]}
    />
  );
}
