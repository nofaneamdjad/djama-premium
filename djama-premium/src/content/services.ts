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
  Building2,
  Globe,
  Landmark,
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

  // ACCOMPAGNEMENT (suite)
  {
    slug: "assistance-administrative-entreprises",
    title: "Assistance administrative entreprises",
    excerpt:
      "Gestion documentaire, rédaction professionnelle et organisation interne — on prend en charge votre administratif pour que vous vous concentriez sur l'essentiel.",
    category: "Accompagnement",
    icon: Building2,
    highlights: [
      "Gestion et classement des documents",
      "Rédaction de courriers & emails professionnels",
      "Suivi des échéances légales et fiscales",
      "Tableaux de bord et reporting interne",
      "Préparation des dossiers administratifs",
      "Confidentialité et discrétion garanties",
    ],
    ctaLabel: "En savoir plus",
    ctaHref: "/services/assistance-administrative-entreprises",
  },
  {
    slug: "fournisseurs-internationaux",
    title: "Recherche de fournisseurs internationaux",
    excerpt:
      "Sourcing qualifié en Chine, Turquie, Dubaï et ailleurs — les meilleurs prix, les bons partenaires, sans les mauvaises surprises.",
    category: "Accompagnement",
    icon: Globe,
    highlights: [
      "Sourcing ciblé : Chine, Turquie, Dubaï, Inde…",
      "Vérification et qualification des fournisseurs",
      "Négociation des prix et conditions",
      "Gestion des commandes et des délais",
      "Suivi logistique et douanier",
      "Conseils import-export et réglementation",
    ],
    ctaLabel: "En savoir plus",
    ctaHref: "/services/fournisseurs-internationaux",
  },
  {
    slug: "marches-publics-prives",
    title: "Marchés publics & privés",
    excerpt:
      "Répondez aux appels d'offres avec un dossier solide, clair et convaincant — de la veille jusqu'à la remise du mémoire technique.",
    category: "Accompagnement",
    icon: Landmark,
    highlights: [
      "Veille et détection des appels d'offres",
      "Constitution et vérification du dossier",
      "Rédaction du mémoire technique",
      "Réponse aux questions du commanditaire",
      "Marchés publics et marchés privés",
      "Accompagnement de A à Z",
    ],
    ctaLabel: "En savoir plus",
    ctaHref: "/services/marches-publics-prives",
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
    ctaHref: "/soutien-scolaire",
  },
];