// Templates de page prédéfinis pour le Website Builder DJAMA
import type { SectionType, SectionStyles } from "./types";

export interface PageTemplate {
  id:       string;
  label:    string;
  desc:     string;
  icon:     string;
  color:    string;
  sections: { type: SectionType; props?: Record<string, unknown>; styles?: SectionStyles }[];
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id:    "landing_saas",
    label: "Landing SaaS",
    desc:  "Page d'accueil moderne pour produit digital",
    icon:  "Zap",
    color: "#2563EB",
    sections: [
      { type: "nav" },
      { type: "hero",         props: { title: "Simplifiez votre activité", subtitle: "La solution tout-en-un pour les professionnels modernes.", cta1Text: "Démarrer gratuitement", cta1Href: "/contact", layout: "center" } },
      { type: "logos",        props: { title: "Ils nous font confiance" } },
      { type: "features",     props: { title: "Pourquoi choisir notre solution ?", layout: "grid" } },
      { type: "steps",        props: { title: "En 3 étapes", layout: "horizontal" } },
      { type: "testimonials", props: { title: "Ce que disent nos clients" } },
      { type: "pricing",      props: { title: "Tarifs transparents" } },
      { type: "cta",          props: { title: "Prêt à vous lancer ?", subtitle: "Essayez gratuitement pendant 14 jours. Sans carte bancaire." } },
      { type: "footer" },
    ],
  },
  {
    id:    "portfolio",
    label: "Portfolio",
    desc:  "Présentation de vos réalisations et compétences",
    icon:  "Briefcase",
    color: "#7C3AED",
    sections: [
      { type: "nav" },
      { type: "hero",    props: { title: "Je crée des expériences digitales", subtitle: "Designer & développeur freelance basé en France.", layout: "center" } },
      { type: "about",   props: { title: "À propos de moi", layout: "image-right" } },
      { type: "gallery", props: { title: "Mes réalisations", columns: 3 } },
      { type: "steps",   props: { title: "Mon processus de travail", layout: "horizontal" } },
      { type: "team",    props: { title: "Compétences" } },
      { type: "contact", props: { title: "Travaillons ensemble" } },
      { type: "footer" },
    ],
  },
  {
    id:    "restaurant",
    label: "Restaurant",
    desc:  "Site vitrine pour restaurant ou café",
    icon:  "UtensilsCrossed",
    color: "#DC2626",
    sections: [
      { type: "nav" },
      { type: "hero",         props: { title: "Bienvenue dans notre restaurant", subtitle: "Cuisine locale, produits frais, ambiance chaleureuse.", cta1Text: "Réserver une table", cta1Href: "/contact", layout: "center" } },
      { type: "services",     props: { title: "Notre carte", columns: 3 } },
      { type: "image_text",   props: { title: "Notre histoire", layout: "image-right" } },
      { type: "gallery",      props: { title: "Notre salle & nos plats", columns: 3 } },
      { type: "testimonials", props: { title: "Vos avis" } },
      { type: "map",          props: { title: "Nous trouver" } },
      { type: "footer" },
    ],
  },
  {
    id:    "agence",
    label: "Agence",
    desc:  "Site institutionnel pour agence ou cabinet",
    icon:  "Building2",
    color: "#059669",
    sections: [
      { type: "nav" },
      { type: "alert_bar",    props: { text: "🚀 Nouveau : découvrez notre offre lancement !", ctaText: "En savoir plus", ctaHref: "/contact" } },
      { type: "hero",         props: { title: "Votre partenaire de confiance", subtitle: "Expertise, réactivité et résultats mesurables.", layout: "center" } },
      { type: "stats",        props: { items: [{ value:"15+", label:"Années d'expérience" },{ value:"300+", label:"Clients accompagnés" },{ value:"98%", label:"Satisfaction client" },{ value:"50+", label:"Experts" }] } },
      { type: "services",     props: { title: "Nos expertises", columns: 3 } },
      { type: "team",         props: { title: "Notre équipe" } },
      { type: "testimonials", props: { title: "Témoignages" } },
      { type: "cta",          props: { title: "Démarrons votre projet", subtitle: "Contactez-nous pour un audit gratuit de votre situation." } },
      { type: "footer" },
    ],
  },
  {
    id:    "artisan",
    label: "Artisan / PME",
    desc:  "Site simple et efficace pour artisan ou PME locale",
    icon:  "Hammer",
    color: "#D97706",
    sections: [
      { type: "nav" },
      { type: "hero",         props: { title: "Votre artisan de confiance", subtitle: "Travail soigné, devis gratuit, disponibilité rapide.", cta1Text: "Demander un devis", cta1Href: "/contact", layout: "center" } },
      { type: "services",     props: { title: "Nos prestations", columns: 3 } },
      { type: "image_text",   props: { title: "Pourquoi nous choisir ?", layout: "image-left" } },
      { type: "before_after", props: { title: "Nos résultats", subtitle: "Avant / après intervention" } },
      { type: "testimonials", props: { title: "Avis de nos clients" } },
      { type: "faq",          props: { title: "Questions fréquentes" } },
      { type: "contact",      props: { title: "Contactez-nous", showPhone: true } },
      { type: "footer" },
    ],
  },
  {
    id:    "event",
    label: "Événement",
    desc:  "Page de présentation d'un événement ou conférence",
    icon:  "CalendarDays",
    color: "#BE185D",
    sections: [
      { type: "nav" },
      { type: "alert_bar",  props: { text: "📅 Inscriptions ouvertes ! Places limitées.", ctaText: "S'inscrire", ctaHref: "/contact" } },
      { type: "hero",       props: { title: "Rejoignez-nous le 15 mars 2025", subtitle: "La conférence incontournable des professionnels du secteur.", cta1Text: "Réserver ma place", cta1Href: "/contact", layout: "center" } },
      { type: "countdown",  props: { title: "Compte à rebours", targetDate: "2025-03-15T09:00:00" } },
      { type: "steps",      props: { title: "Programme de la journée", layout: "vertical" } },
      { type: "team",       props: { title: "Nos intervenants" } },
      { type: "pricing",    props: { title: "Tarifs d'accès" } },
      { type: "faq",        props: { title: "Questions fréquentes" } },
      { type: "footer" },
    ],
  },
];
