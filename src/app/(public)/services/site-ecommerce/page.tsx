"use client";

import Link from "next/link";
import {
  ShoppingCart,
  CreditCard,
  Smartphone,
  Search,
  Package,
  BarChart3,
  Mail,
  Lock,
  HeartHandshake,
  MessageSquare,
  FileText,
  Palette,
  Code2,
  Rocket,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function SiteEcommercePage() {
  return (
    <ServicePageShell
      icon={ShoppingCart}
      color="#34d399"
      colorRGB="52,211,153"
      badge="E-Commerce · Boutique en ligne"
      title={
        <>
          Votre boutique en ligne{" "}
          <span style={{ color: "#34d399" }}>prête à vendre</span>
        </>
      }
      subtitle="Des sites e-commerce performants, mobiles et connectés à Stripe — livrés en 14 jours."
      stats={[
        { value: "14 jours", label: "délai moyen" },
        { value: "Stripe", label: "paiement sécurisé" },
        { value: "24h/7j", label: "ventes automatiques" },
      ]}
      ctaHref="/contact"
      ctaLabel="Lancer ma boutique"
      ctaSecHref="/realisations"
      ctaSecLabel="Voir des exemples"
      featuresTitle="Ce qui est inclus"
      features={[
        {
          icon: Package,
          color: "#34d399",
          title: "Fiches produits premium",
          desc: "Photos, variantes, descriptions SEO, galerie zoom.",
        },
        {
          icon: ShoppingCart,
          color: "#34d399",
          title: "Panier & checkout fluide",
          desc: "UX optimisée, abandon de panier réduit.",
        },
        {
          icon: CreditCard,
          color: "#34d399",
          title: "Paiements sécurisés",
          desc: "Stripe, PayPal, CB — conformité PCI DSS.",
        },
        {
          icon: Search,
          color: "#34d399",
          title: "SEO produits",
          desc: "URLs propres, structured data, sitemap produits.",
        },
        {
          icon: Package,
          color: "#34d399",
          title: "Gestion des stocks",
          desc: "Alertes stock, variantes (taille, couleur), inventaire.",
        },
        {
          icon: BarChart3,
          color: "#34d399",
          title: "Dashboard commandes",
          desc: "Suivi en temps réel, export CSV, statuts automatiques.",
        },
        {
          icon: Mail,
          color: "#34d399",
          title: "Emails automatiques",
          desc: "Confirmation, expédition, relance panier abandonné.",
        },
        {
          icon: Smartphone,
          color: "#34d399",
          title: "Mobile-first",
          desc: "70% des achats se font sur mobile. On optimise pour ça.",
        },
        {
          icon: HeartHandshake,
          color: "#34d399",
          title: "Support & maintenance",
          desc: "Mises à jour, sécurité, ajout produits disponibles.",
        },
      ]}
      processTitle="De zéro à la vente en 14 jours"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#34d399",
          title: "Brief",
          desc: "Votre activité, vos produits, votre cible.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: Palette,
          color: "#34d399",
          title: "Design",
          desc: "Maquette boutique validée avec vous.",
          tag: "Jours 2–4",
        },
        {
          num: "03",
          icon: Package,
          color: "#34d399",
          title: "Catalogue",
          desc: "Import produits, photos, descriptions.",
          tag: "Jours 5–8",
        },
        {
          num: "04",
          icon: CreditCard,
          color: "#34d399",
          title: "Paiement",
          desc: "Stripe, PayPal, tests de commandes.",
          tag: "Jours 9–11",
        },
        {
          num: "05",
          icon: FileText,
          color: "#34d399",
          title: "Test & QA",
          desc: "Tests complets sur tous les appareils.",
          tag: "Jours 12–13",
        },
        {
          num: "06",
          icon: Rocket,
          color: "#34d399",
          title: "Lancement",
          desc: "Mise en ligne + formation back-office.",
          tag: "Jour 14",
        },
      ]}
      pricingTitle="Tarifs boutique en ligne"
      plans={[
        {
          name: "Starter",
          price: "890€",
          unit: "paiement unique",
          desc: "Jusqu'à 50 produits",
          features: [
            "Design personnalisé",
            "Stripe + PayPal",
            "Gestion stocks",
            "Dashboard commandes",
            "Emails automatiques",
            "SEO de base",
            "Mobile-first",
          ],
          hot: false,
        },
        {
          name: "Pro",
          price: "1 490€",
          unit: "paiement unique",
          desc: "Produits illimités + fonctions avancées",
          features: [
            "Tout Starter inclus",
            "Produits illimités",
            "Relance panier abandonné",
            "Codes promo & réductions",
            "Programme fidélité",
            "Rapport analytics",
          ],
          hot: true,
        },
      ]}
    />
  );
}
