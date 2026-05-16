"use client";

import ServicePageShell from "@/components/ServicePageShell";
import {
  Globe,
  Search,
  Shield,
  MessageSquare,
  TrendingDown,
  FileText,
  Truck,
  Star,
  Users,
  BarChart3,
  Phone,
} from "lucide-react";

const COLOR = "#c9a55a";
const RGB = "201,165,90";

export default function RechercheFournisseursPage() {
  return (
    <ServicePageShell
      icon={Globe}
      color={COLOR}
      colorRGB={RGB}
      badge="Sourcing · International"
      title={
        <>
          Trouvez les meilleurs{" "}
          <span style={{ color: COLOR }}>fournisseurs</span>
        </>
      }
      subtitle="Sourcing international en Chine, Dubaï, Turquie, Tanzanie et Afrique — fournisseurs vérifiés, prix négociés."
      stats={[
        { value: "5 zones", label: "Chine · Dubaï · Turquie · Tanzanie · Togo" },
        { value: "Vérifié", label: "chaque fournisseur" },
        { value: "–30%", label: "coût moyen négocié" },
      ]}
      ctaHref="/contact"
      ctaLabel="Démarrer mon sourcing"
      ctaSecHref="/contact"
      ctaSecLabel="Poser une question"
      featuresTitle="Notre service sourcing"
      features={[
        {
          icon: Search,
          color: COLOR,
          title: "Recherche ciblée",
          desc: "Identification des fournisseurs selon votre produit et vos critères.",
        },
        {
          icon: Shield,
          color: COLOR,
          title: "Vérification des entreprises",
          desc: "Contrôle de légitimité, licences, avis et historique.",
        },
        {
          icon: Users,
          color: COLOR,
          title: "Mise en relation",
          desc: "Introduction directe avec les contacts décisionnaires.",
        },
        {
          icon: BarChart3,
          color: COLOR,
          title: "Analyse des offres",
          desc: "Comparaison prix, qualité, MOQ, délais de livraison.",
        },
        {
          icon: TrendingDown,
          color: COLOR,
          title: "Aide à la négociation",
          desc: "Stratégies et arguments pour obtenir les meilleures conditions.",
        },
        {
          icon: Star,
          color: COLOR,
          title: "Gestion des échantillons",
          desc: "Commande et suivi des échantillons avant engagement.",
        },
        {
          icon: Truck,
          color: COLOR,
          title: "Accompagnement commandes",
          desc: "Suivi de la production et de l'expédition.",
        },
        {
          icon: FileText,
          color: COLOR,
          title: "Conseils import/export",
          desc: "Incoterms, douanes, documents requis, transitaires recommandés.",
        },
        {
          icon: Globe,
          color: COLOR,
          title: "Chine 🇨🇳",
          desc: "Industrie, électronique, textile, accessoires.",
        },
        {
          icon: Globe,
          color: COLOR,
          title: "Dubaï / EAU 🇦🇪",
          desc: "Commerce international, produits premium.",
        },
        {
          icon: Globe,
          color: COLOR,
          title: "Turquie 🇹🇷",
          desc: "Textile, ameublement, construction, alimentaire.",
        },
        {
          icon: Globe,
          color: COLOR,
          title: "Tanzanie 🇹🇿",
          desc: "Produits agricoles, matières premières, épices.",
        },
        {
          icon: Globe,
          color: COLOR,
          title: "Togo 🇹🇬",
          desc: "Commerce régional, distribution Afrique de l'Ouest.",
        },
      ]}
      processTitle="Notre processus de sourcing"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: COLOR,
          title: "Brief",
          desc: "Votre produit, volume, budget et délais.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: Search,
          color: COLOR,
          title: "Recherche",
          desc: "Identification et pré-sélection des fournisseurs.",
          tag: "Jours 2–5",
        },
        {
          num: "03",
          icon: Phone,
          color: COLOR,
          title: "Contact",
          desc: "Prise de contact et vérification des entreprises.",
          tag: "Jours 5–10",
        },
        {
          num: "04",
          icon: FileText,
          color: COLOR,
          title: "Offres",
          desc: "Réception, analyse et comparaison des devis.",
          tag: "Jours 10–15",
        },
        {
          num: "05",
          icon: Truck,
          color: COLOR,
          title: "Mise en relation",
          desc: "Présentation des meilleurs candidats + introduction.",
          tag: "Jour 15",
        },
      ]}
    />
  );
}
