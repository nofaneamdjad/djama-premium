import {
  Code2,
  ShoppingCart,
  Smartphone,
  LayoutDashboard,
  Video,
  Image as ImageIcon,
  Megaphone,
  FileText,
  ClipboardList,
  NotebookPen,
  Briefcase,
  BadgeCheck,
  Brain,
  GraduationCap,
} from "lucide-react";

export type Service = {
  slug: string;
  title: string;
  excerpt: string;
  category:
    | "Digital"
    | "Création de contenu"
    | "Documents & Outils"
    | "Accompagnement"
    | "Coaching";
  icon: any;
  highlights: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export const services: Service[] = [
  // DIGITAL
  {
    slug: "site-vitrine",
    title: "Site vitrine / portfolio",
    excerpt: "Design premium, rapide, pensé conversion (pro & clean).",
    category: "Digital",
    icon: Code2,
    highlights: ["UX premium", "Responsive", "SEO de base", "Sections sur mesure"],
  },
  {
    slug: "site-ecommerce",
    title: "Site e-commerce",
    excerpt: "Boutique moderne + pages produit + parcours simple.",
    category: "Digital",
    icon: ShoppingCart,
    highlights: ["Pages produit", "Panier", "Paiements PayPal/virement", "Optimisation confiance"],
  },
  {
    slug: "application-mobile",
    title: "Application mobile",
    excerpt: "Application propre & évolutive (UX, performance).",
    category: "Digital",
    icon: Smartphone,
    highlights: ["UX moderne", "Fonctionnalités utiles", "Évolutif", "Accompagnement"],
  },
  {
    slug: "plateforme-web",
    title: "Plateforme / outil web sur mesure",
    excerpt: "Dashboard, comptes, outils internes — comme un mini-SaaS.",
    category: "Digital",
    icon: LayoutDashboard,
    highlights: ["Espace client", "Gestion simple", "Branding", "Scalable"],
  },

  // CRÉATION DE CONTENU
  {
    slug: "montage-video",
    title: "Montage vidéo pro",
    excerpt: "Reels, pubs, formats Instagram — style propre & premium.",
    category: "Création de contenu",
    icon: Video,
    highlights: ["Sous-titres", "Rythme pro", "Branding", "Formats réseaux sociaux"],
  },
  {
    slug: "retouche-photo",
    title: "Retouche / montage photo",
    excerpt: "Visuels clean, retouche pro, cohérence de marque.",
    category: "Création de contenu",
    icon: ImageIcon,
    highlights: ["Qualité pro", "Branding", "Posts", "Bannières"],
  },
  {
    slug: "visuels-publicitaires",
    title: "Visuels publicitaires",
    excerpt: "Posts & ads : design pro, impact et cohérence.",
    category: "Création de contenu",
    icon: Megaphone,
    highlights: ["Ads", "Posts", "Kits réseaux", "Cohérence visuelle"],
  },

  // DOCUMENTS & OUTILS
  {
    slug: "factures-automatiques",
    title: "Factures automatiques",
    excerpt: "Logo + infos société + export : pro en 1 minute.",
    category: "Documents & Outils",
    icon: FileText,
    highlights: ["Templates", "Branding", "Export", "Simple & rapide"],
  },
  {
    slug: "devis-automatiques",
    title: "Devis automatiques",
    excerpt: "Devis premium : clair, pro, rapide.",
    category: "Documents & Outils",
    icon: ClipboardList,
    highlights: ["Templates", "Calcul simple", "Export", "Envoi client"],
  },
  {
    slug: "planning-agenda",
    title: "Planning / agenda",
    excerpt: "Organisation claire et efficace.",
    category: "Documents & Outils",
    icon: BadgeCheck,
    highlights: ["Rappels", "Organisation", "Simple", "Efficace"],
  },
  {
    slug: "bloc-notes",
    title: "Bloc-notes",
    excerpt: "Notes rapides + organisation (export possible ensuite).",
    category: "Documents & Outils",
    icon: NotebookPen,
    highlights: ["Notes", "Classement", "Téléchargement plus tard", "Propre"],
  },

  // ACCOMPAGNEMENT
  {
    slug: "creation-auto-entrepreneur",
    title: "Création auto-entrepreneur",
    excerpt: "Démarrage simple, rapide, clair.",
    category: "Accompagnement",
    icon: Briefcase,
    highlights: ["Guidage", "Dossiers", "Étapes claires", "Soutien"],
  },
  {
    slug: "declarations-urssaf",
    title: "Déclarations URSSAF",
    excerpt: "Assistance administrative personnalisée.",
    category: "Accompagnement",
    icon: ClipboardList,
    highlights: ["Suivi", "Conseils", "Aide déclaration", "Sérénité"],
  },

  // COACHING
  {
    slug: "coaching-ia",
    title: "Coaching IA",
    excerpt: "190€ / 3 mois — stratégie + automatisation + support.",
    category: "Coaching",
    icon: Brain,
    highlights: ["Plan d’action", "Outils IA", "Suivi 3 mois", "Objectifs clairs"],
    ctaLabel: "Voir l’offre",
    ctaHref: "/coaching-ia",
  },
  {
    slug: "soutien-scolaire",
    title: "Soutien scolaire",
    excerpt: "14€/h — de la 6e à la Terminale — RDV en ligne.",
    category: "Coaching",
    icon: GraduationCap,
    highlights: ["Méthode", "Exercices", "Régularité", "RDV en ligne"],
    ctaLabel: "Prendre RDV",
    ctaHref: "/rendezvous",
  },
];