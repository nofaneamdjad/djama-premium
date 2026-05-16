"use client";

import ServicePageShell from "@/components/ServicePageShell";
import {
  User,
  ShoppingBag,
  Sun,
  Scissors,
  Image,
  Printer,
  Star,
  Palette,
  Download,
  Layers,
  Upload,
  Eye,
  Edit,
} from "lucide-react";

const COLOR = "#ec4899";
const RGB = "236,72,153";

export default function RetouchePhotoPage() {
  return (
    <ServicePageShell
      icon={Image}
      color={COLOR}
      colorRGB={RGB}
      badge="Design · Retouche Photo"
      title={
        <>
          Photos retouchées{" "}
          <span style={{ color: COLOR }}>à la perfection</span>
        </>
      }
      subtitle="Retouche portrait, produit e-commerce, suppression d'éléments, fond transparent — résultats pros en 48h."
      stats={[
        { value: "48h", label: "délai livraison" },
        { value: "+40%", label: "de conversions" },
        { value: "RAW + JPEG", label: "formats acceptés" },
      ]}
      ctaHref="/contact"
      ctaLabel="Envoyer mes photos"
      ctaSecHref="/realisations"
      ctaSecLabel="Voir des exemples"
      featuresTitle="Nos types de retouche"
      features={[
        {
          icon: User,
          color: COLOR,
          title: "Retouche portrait",
          desc: "Peau, yeux, dents, éclairage — naturel et élégant.",
        },
        {
          icon: ShoppingBag,
          color: COLOR,
          title: "Photo produit e-commerce",
          desc: "Fond blanc, ombres, angles, catalogue harmonisé.",
        },
        {
          icon: Sun,
          color: COLOR,
          title: "Correction lumière/couleurs",
          desc: "Exposition, balance blancs, étalonnage cinématique.",
        },
        {
          icon: Scissors,
          color: COLOR,
          title: "Suppression d'éléments",
          desc: "Objet gênant, personne indésirable, câbles, déchet.",
        },
        {
          icon: Eye,
          color: COLOR,
          title: "Détourage précis",
          desc: "Contours nets sur cheveux, fourrure, verre, fumée.",
        },
        {
          icon: Image,
          color: COLOR,
          title: "Fond transparent ou blanc",
          desc: "PNG transparent ou fond uni pour e-commerce.",
        },
        {
          icon: Star,
          color: COLOR,
          title: "Amélioration qualité",
          desc: "Upscale IA, réduction bruit, restauration d'anciennes photos.",
        },
        {
          icon: Layers,
          color: COLOR,
          title: "Harmonisation catalogue",
          desc: "Cohérence de style sur des dizaines ou centaines de photos.",
        },
        {
          icon: Printer,
          color: COLOR,
          title: "Préparation impression",
          desc: "CMJN, 300 DPI, marges d'impression — prêt à imprimer.",
        },
        {
          icon: Download,
          color: COLOR,
          title: "Formats livrés",
          desc: "JPEG + PNG + fichier source selon vos besoins.",
        },
      ]}
      processTitle="De vos photos à vos visuels pros"
      process={[
        {
          num: "01",
          icon: Upload,
          color: COLOR,
          title: "Envoi photos",
          desc: "Vous partagez vos photos et le résultat souhaité.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: Palette,
          color: COLOR,
          title: "Retouche",
          desc: "Travail précis sur chaque image.",
          tag: "Jours 1–2",
        },
        {
          num: "03",
          icon: Eye,
          color: COLOR,
          title: "Aperçu",
          desc: "Première version livrée pour validation.",
          tag: "Jour 2",
        },
        {
          num: "04",
          icon: Edit,
          color: COLOR,
          title: "Corrections",
          desc: "Ajustements jusqu'à satisfaction.",
          tag: "Jour 3",
        },
        {
          num: "05",
          icon: Download,
          color: COLOR,
          title: "Livraison",
          desc: "Fichiers HD + PNG transparent + sources.",
          tag: "Jour 3–4",
        },
      ]}
    />
  );
}
