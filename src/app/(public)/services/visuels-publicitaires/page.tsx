"use client";

import {
  Share2,
  Monitor,
  Image,
  Printer,
  Palette,
  Layers,
  FileText,
  Smartphone,
  Globe,
  Sparkles,
  MessageSquare,
  Eye,
  Edit,
  Download,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function VisuelsPublicitairesPage() {
  return (
    <ServicePageShell
      icon={Palette}
      color="#f43f5e"
      colorRGB="244,63,94"
      badge="Design · Visuels Publicitaires"
      title={
        <>
          Des visuels qui{" "}
          <span style={{ color: "#f43f5e" }}>vendent</span>
        </>
      }
      subtitle="Posts, stories, bannières, affiches, flyers — des créations percutantes prêtes à publier ou imprimer."
      stats={[
        { value: "48h", label: "délai livraison" },
        { value: "Tous formats", label: "digital & print" },
        { value: "Source file", label: "fichiers inclus" },
      ]}
      ctaLabel="Commander mes visuels"
      ctaHref="/contact"
      ctaSecLabel="Voir des exemples"
      ctaSecHref="/realisations"
      featuresTitle="Ce qu'on crée pour vous"
      features={[
        {
          icon: Share2,
          color: "#f43f5e",
          title: "Posts réseaux sociaux",
          desc: "Instagram, Facebook, LinkedIn, TikTok — chaque format optimisé.",
        },
        {
          icon: Monitor,
          color: "#fb923c",
          title: "Publicités Facebook / Meta",
          desc: "Formats ads adaptés aux placements et aux objectifs.",
        },
        {
          icon: Image,
          color: "#f9a826",
          title: "Stories & Reels covers",
          desc: "Visuels animés ou statiques pour vos stories et highlights.",
        },
        {
          icon: Globe,
          color: "#4ade80",
          title: "Bannières web & display",
          desc: "Google Display, site web, newsletters — tous formats.",
        },
        {
          icon: Printer,
          color: "#60a5fa",
          title: "Affiches publicitaires",
          desc: "Print haute résolution, prêt pour l'impression.",
        },
        {
          icon: Layers,
          color: "#a78bfa",
          title: "Flyers & dépliants",
          desc: "A5, A4, tri-fold — adaptés à votre activité et budget.",
        },
        {
          icon: FileText,
          color: "#f472b6",
          title: "Cartes de visite",
          desc: "Recto/verso, finitions premium, formats standards ou carrés.",
        },
        {
          icon: Smartphone,
          color: "#34d399",
          title: "Bâches & panneaux",
          desc: "Grand format, bâches outdoor, signalétique événementielle.",
        },
        {
          icon: Palette,
          color: "#f43f5e",
          title: "Cohérence de marque",
          desc: "Charte graphique respectée, déclinaisons illimitées.",
        },
        {
          icon: Sparkles,
          color: "#38bdf8",
          title: "Fichiers source inclus",
          desc: "Illustrator / Photoshop / Canva Pro fournis.",
        },
      ]}
      processTitle="Livraison en 48h"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#f43f5e",
          title: "Brief",
          desc: "Votre activité, vos couleurs, votre message.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: Palette,
          color: "#fb923c",
          title: "Création",
          desc: "Première version livrée sous 24–48h.",
          tag: "Jours 1–2",
        },
        {
          num: "03",
          icon: Eye,
          color: "#f9a826",
          title: "Retour",
          desc: "Corrections illimitées jusqu'à satisfaction.",
          tag: "Jour 3",
        },
        {
          num: "04",
          icon: Edit,
          color: "#4ade80",
          title: "Validation",
          desc: "Votre accord final avant export.",
          tag: "Jour 3–4",
        },
        {
          num: "05",
          icon: Download,
          color: "#60a5fa",
          title: "Livraison",
          desc: "Fichiers HD + sources fournis.",
          tag: "Jour 4–5",
        },
      ]}
    />
  );
}
