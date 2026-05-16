"use client";

import Link from "next/link";
import {
  Globe,
  Palette,
  Smartphone,
  MessageSquare,
  Phone,
  Search,
  Lock,
  Zap,
  HeartHandshake,
  FileText,
  Code2,
  Rocket,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function SiteVitrinePage() {
  return (
    <ServicePageShell
      icon={Globe}
      color="#a78bfa"
      colorRGB="167,139,250"
      badge="Création Web · Site Vitrine"
      title={
        <>
          Site vitrine{" "}
          <span style={{ color: "#a78bfa" }}>professionnel</span> &amp; sur mesure
        </>
      }
      subtitle="Un site rapide, élégant et optimisé SEO — livré en 10 jours. Sans template générique."
      stats={[
        { value: "10 jours", label: "délai moyen" },
        { value: "90+", label: "score Lighthouse" },
        { value: "100%", label: "responsive" },
      ]}
      ctaHref="/contact"
      ctaLabel="Obtenir un devis gratuit"
      ctaSecHref="/realisations"
      ctaSecLabel="Voir nos réalisations"
      featuresTitle="Tout est inclus"
      features={[
        {
          icon: Palette,
          color: "#a78bfa",
          title: "Design sur mesure",
          desc: "Maquette validée avec vous. Couleurs, typographie, ambiance — rien de générique.",
        },
        {
          icon: Smartphone,
          color: "#a78bfa",
          title: "Responsive mobile",
          desc: "Parfait sur iPhone, Android, tablette et desktop.",
        },
        {
          icon: MessageSquare,
          color: "#a78bfa",
          title: "Formulaire de contact",
          desc: "Anti-spam, notifications email instantanées.",
        },
        {
          icon: Phone,
          color: "#a78bfa",
          title: "WhatsApp intégré",
          desc: "Bouton flottant ou CTA WhatsApp direct.",
        },
        {
          icon: Search,
          color: "#a78bfa",
          title: "SEO de base",
          desc: "Métas, H1–H6, sitemap.xml — les fondations pour Google.",
        },
        {
          icon: Lock,
          color: "#a78bfa",
          title: "SSL + HTTPS",
          desc: "Certificat SSL, conformité RGPD, mentions légales incluses.",
        },
        {
          icon: Zap,
          color: "#a78bfa",
          title: "Performance < 2s",
          desc: "Code optimisé, images compressées, Lighthouse 90+.",
        },
        {
          icon: Globe,
          color: "#a78bfa",
          title: "Mise en ligne clé en main",
          desc: "Configuration domaine, hébergement, déploiement — tout géré.",
        },
        {
          icon: HeartHandshake,
          color: "#a78bfa",
          title: "Support post-livraison",
          desc: "2 semaines de retouches incluses.",
        },
      ]}
      processTitle="Notre méthode en 5 étapes"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#a78bfa",
          title: "Contact",
          desc: "Échange de 15 min pour cerner votre activité.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: FileText,
          color: "#a78bfa",
          title: "Brief",
          desc: "Questionnaire + inspirations visuelles + contenu.",
          tag: "Jours 2–3",
        },
        {
          num: "03",
          icon: Palette,
          color: "#a78bfa",
          title: "Design",
          desc: "Maquette complète soumise pour validation.",
          tag: "Jours 4–6",
        },
        {
          num: "04",
          icon: Code2,
          color: "#a78bfa",
          title: "Développement",
          desc: "Intégration responsive, testé partout.",
          tag: "Jours 7–9",
        },
        {
          num: "05",
          icon: Rocket,
          color: "#a78bfa",
          title: "Mise en ligne",
          desc: "Publication + formation CMS incluse.",
          tag: "Jour 10",
        },
      ]}
      pricingTitle="Nos tarifs clairs"
      plans={[
        {
          name: "Essentiel",
          price: "790€",
          unit: "paiement unique",
          desc: "Site vitrine jusqu'à 5 pages",
          features: [
            "Design personnalisé",
            "Responsive mobile",
            "Formulaire contact",
            "SEO de base",
            "SSL + HTTPS",
            "Mise en ligne incluse",
          ],
          hot: false,
        },
        {
          name: "Pro",
          price: "1 290€",
          unit: "paiement unique",
          desc: "Site complet jusqu'à 10 pages + blog",
          features: [
            "Tout Essentiel inclus",
            "Blog/actualités",
            "WhatsApp intégré",
            "Animations premium",
            "Performance < 2s",
            "4 semaines de support",
          ],
          hot: true,
        },
        {
          name: "Sur devis",
          price: "Sur devis",
          unit: "",
          desc: "Sites complexes, fonctionnalités avancées",
          features: [
            "E-commerce",
            "Espace client",
            "Multilingue",
            "Intégrations API",
            "Sur mesure total",
          ],
          hot: false,
        },
      ]}
    />
  );
}
