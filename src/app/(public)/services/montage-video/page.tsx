"use client";

import ServicePageShell from "@/components/ServicePageShell";
import {
  Film,
  Smartphone,
  Monitor,
  Zap,
  Type,
  Music,
  Layers,
  Download,
  RefreshCw,
  Star,
  Upload,
  Scissors,
  Eye,
  Edit,
} from "lucide-react";

const COLOR = "#e11d48";
const RGB = "225,29,72";

export default function MontageVideoPage() {
  return (
    <ServicePageShell
      icon={Film}
      color={COLOR}
      colorRGB={RGB}
      badge="Création · Montage Vidéo"
      title={
        <>
          Montage vidéo{" "}
          <span style={{ color: COLOR }}>professionnel</span>
        </>
      }
      subtitle="Reels, TikTok, YouTube, vidéos corporate — montages dynamiques livrés prêts à publier."
      stats={[
        { value: "48h", label: "délai moyen" },
        { value: "Tous formats", label: "9:16 · 16:9 · 1:1" },
        { value: "+65%", label: "d'engagement" },
      ]}
      ctaHref="/contact"
      ctaLabel="Envoyer mes rushes"
      ctaSecHref="/realisations"
      ctaSecLabel="Voir des exemples"
      featuresTitle="Ce qui est inclus"
      features={[
        {
          icon: Smartphone,
          color: COLOR,
          title: "Reels & TikTok",
          desc: "Montage court format vertical 9:16 optimisé pour l'algorithme.",
        },
        {
          icon: Monitor,
          color: COLOR,
          title: "YouTube long format",
          desc: "Montage 16:9, intro/outro, chapitres, transitions fluides.",
        },
        {
          icon: Film,
          color: COLOR,
          title: "Vidéos corporate",
          desc: "Présentation entreprise, témoignage client, formation interne.",
        },
        {
          icon: Zap,
          color: COLOR,
          title: "Transitions dynamiques",
          desc: "Cuts rythmés, transitions sur mesure, effets visuels.",
        },
        {
          icon: Type,
          color: COLOR,
          title: "Sous-titrage",
          desc: "Sous-titres stylisés intégrés, synchronisés au mot près.",
        },
        {
          icon: Music,
          color: COLOR,
          title: "Musique & audio",
          desc: "Mixage son, voix off, effets sonores, musique libre de droits.",
        },
        {
          icon: Layers,
          color: COLOR,
          title: "Motion design",
          desc: "Animations de texte, logo animé, habillage visuel de marque.",
        },
        {
          icon: Star,
          color: COLOR,
          title: "Call-to-action",
          desc: "CTA intégrés, watermark, fins d'écran personnalisées.",
        },
        {
          icon: RefreshCw,
          color: COLOR,
          title: "Multi-format",
          desc: "Déclinaison en plusieurs formats depuis un seul montage.",
        },
        {
          icon: Download,
          color: COLOR,
          title: "Fichiers sources",
          desc: "Projet final + exports HD livrés.",
        },
      ]}
      processTitle="De vos rushes à la publication"
      process={[
        {
          num: "01",
          icon: Upload,
          color: COLOR,
          title: "Envoi rushes",
          desc: "Vous partagez vos fichiers vidéo et votre brief.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: Scissors,
          color: COLOR,
          title: "Montage",
          desc: "On assemble, rythme et habille votre vidéo.",
          tag: "Jours 1–2",
        },
        {
          num: "03",
          icon: Eye,
          color: COLOR,
          title: "Aperçu",
          desc: "Première version livrée pour validation.",
          tag: "Jour 2–3",
        },
        {
          num: "04",
          icon: Edit,
          color: COLOR,
          title: "Retouches",
          desc: "Corrections jusqu'à votre satisfaction totale.",
          tag: "Jour 3–4",
        },
        {
          num: "05",
          icon: Download,
          color: COLOR,
          title: "Livraison",
          desc: "Fichiers HD prêts à publier, tous formats.",
          tag: "Jour 4–5",
        },
      ]}
    />
  );
}
