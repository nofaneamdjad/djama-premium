// Métadonnées de la bibliothèque de composants
import type { SectionType } from "./types";

export interface SectionMeta {
  type:        SectionType;
  label:       string;
  description: string;
  category:    "structure" | "contenu" | "conversion" | "social" | "intégration";
  icon:        string;  // nom lucide
  defaultProps: Record<string, unknown>;
}

export const SECTIONS_LIBRARY: SectionMeta[] = [
  // ── Structure ────────────────────────────────────────────────
  {
    type: "nav",
    label: "Navigation",
    description: "Menu principal avec logo et liens",
    category: "structure",
    icon: "Menu",
    defaultProps: {
      logo: "",
      links: [
        { label: "Accueil", href: "/" },
        { label: "Services", href: "/services" },
        { label: "Contact", href: "/contact" },
      ],
      ctaText: "Nous contacter",
      ctaHref: "/contact",
      sticky: true,
    },
  },
  {
    type: "divider",
    label: "Séparateur",
    description: "Ligne de séparation entre sections",
    category: "structure",
    icon: "Minus",
    defaultProps: { style: "line", margin: "md" },
  },
  {
    type: "spacer",
    label: "Espacement",
    description: "Espace vide configurable",
    category: "structure",
    icon: "ArrowUpDown",
    defaultProps: { height: 60 },
  },

  // ── Contenu ──────────────────────────────────────────────────
  {
    type: "hero",
    label: "Héro",
    description: "Section d'accroche principale avec CTA",
    category: "contenu",
    icon: "Sparkles",
    defaultProps: {
      title: "Votre titre percutant ici",
      subtitle: "Une phrase qui décrit votre valeur ajoutée en quelques mots.",
      cta1Text: "Commencer",
      cta1Href: "/contact",
      cta2Text: "En savoir plus",
      cta2Href: "#services",
      imageUrl: "",
      layout: "center",
    },
  },
  {
    type: "about",
    label: "À propos",
    description: "Présentation de l'entreprise",
    category: "contenu",
    icon: "Info",
    defaultProps: {
      title: "À propos de nous",
      content: "Parlez de votre entreprise, vos valeurs et votre histoire.",
      imageUrl: "",
      layout: "image-right",
    },
  },
  {
    type: "services",
    label: "Services",
    description: "Grille de prestations ou offres",
    category: "contenu",
    icon: "Briefcase",
    defaultProps: {
      title: "Nos prestations",
      subtitle: "",
      items: [
        { title: "Service 1", desc: "Description courte de ce service.", icon: "Star", price: "" },
        { title: "Service 2", desc: "Description courte de ce service.", icon: "Zap", price: "" },
        { title: "Service 3", desc: "Description courte de ce service.", icon: "Shield", price: "" },
      ],
      columns: 3,
    },
  },
  {
    type: "features",
    label: "Avantages",
    description: "Points forts / fonctionnalités",
    category: "contenu",
    icon: "CheckCircle",
    defaultProps: {
      title: "Pourquoi nous choisir ?",
      subtitle: "",
      items: [
        { title: "Expertise", desc: "Des années d'expérience dans notre domaine." },
        { title: "Réactivité", desc: "Nous répondons rapidement à vos demandes." },
        { title: "Qualité", desc: "Un travail soigné et professionnel." },
        { title: "Suivi", desc: "Un accompagnement de A à Z." },
      ],
      layout: "grid",
    },
  },
  {
    type: "gallery",
    label: "Galerie",
    description: "Grille de photos / réalisations",
    category: "contenu",
    icon: "Image",
    defaultProps: {
      title: "Nos réalisations",
      subtitle: "",
      images: [],
      columns: 3,
      lightbox: true,
    },
  },
  {
    type: "team",
    label: "Équipe",
    description: "Présentation des membres de l'équipe",
    category: "contenu",
    icon: "Users",
    defaultProps: {
      title: "Notre équipe",
      subtitle: "",
      members: [
        { name: "Prénom Nom", role: "Directeur", bio: "", imageUrl: "" },
        { name: "Prénom Nom", role: "Responsable", bio: "", imageUrl: "" },
      ],
    },
  },
  {
    type: "stats",
    label: "Chiffres clés",
    description: "Compteurs et statistiques",
    category: "contenu",
    icon: "BarChart2",
    defaultProps: {
      items: [
        { value: "10+", label: "Années d'expérience" },
        { value: "500+", label: "Clients satisfaits" },
        { value: "98%", label: "Taux de satisfaction" },
        { value: "24h", label: "Délai de réponse" },
      ],
    },
  },
  {
    type: "logos",
    label: "Logos partenaires",
    description: "Bande de logos clients / partenaires",
    category: "contenu",
    icon: "Building2",
    defaultProps: {
      title: "Ils nous font confiance",
      logos: [],
      grayscale: true,
    },
  },
  {
    type: "rich_text",
    label: "Texte libre",
    description: "Bloc de texte formaté",
    category: "contenu",
    icon: "AlignLeft",
    defaultProps: { content: "<p>Votre contenu ici.</p>" },
  },
  {
    type: "video",
    label: "Vidéo",
    description: "Vidéo intégrée (YouTube, Vimeo)",
    category: "contenu",
    icon: "Play",
    defaultProps: {
      title: "",
      url: "",
      poster: "",
      autoplay: false,
    },
  },

  // ── Conversion ───────────────────────────────────────────────
  {
    type: "testimonials",
    label: "Témoignages",
    description: "Avis clients sous forme de cartes",
    category: "conversion",
    icon: "MessageSquare",
    defaultProps: {
      title: "Ce que disent nos clients",
      items: [
        { name: "Client 1", role: "", rating: 5, text: "Excellent travail, très professionnel !" },
        { name: "Client 2", role: "", rating: 5, text: "Je recommande vivement, résultat impeccable." },
        { name: "Client 3", role: "", rating: 5, text: "Service rapide et de qualité." },
      ],
    },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Questions fréquentes en accordéon",
    category: "conversion",
    icon: "HelpCircle",
    defaultProps: {
      title: "Questions fréquentes",
      items: [
        { q: "Quelle est votre zone d'intervention ?", a: "Nous intervenons sur toute la région." },
        { q: "Quels sont vos délais ?", a: "Nous répondons dans les 24h et intervenons rapidement." },
        { q: "Proposez-vous des devis gratuits ?", a: "Oui, tous nos devis sont gratuits et sans engagement." },
      ],
    },
  },
  {
    type: "pricing",
    label: "Tarifs",
    description: "Tableau de tarification",
    category: "conversion",
    icon: "Tag",
    defaultProps: {
      title: "Nos tarifs",
      subtitle: "",
      plans: [
        { name: "Essentiel", price: "49 €", period: "/mois", desc: "Pour démarrer", features: ["Fonctionnalité 1", "Fonctionnalité 2"], cta: "Démarrer", popular: false },
        { name: "Pro", price: "99 €", period: "/mois", desc: "Le plus populaire", features: ["Tout l'Essentiel", "Fonctionnalité 3", "Fonctionnalité 4"], cta: "Essayer", popular: true },
        { name: "Entreprise", price: "Sur devis", period: "", desc: "Pour les grandes équipes", features: ["Tout le Pro", "Support dédié"], cta: "Nous contacter", popular: false },
      ],
    },
  },
  {
    type: "cta",
    label: "Appel à l'action",
    description: "Bannière d'appel à l'action",
    category: "conversion",
    icon: "Megaphone",
    defaultProps: {
      title: "Prêt à démarrer ?",
      subtitle: "Contactez-nous dès aujourd'hui pour un devis gratuit.",
      cta1Text: "Nous contacter",
      cta1Href: "/contact",
      cta2Text: "",
      cta2Href: "",
    },
  },
  {
    type: "contact",
    label: "Contact",
    description: "Formulaire de contact intégré au CRM",
    category: "conversion",
    icon: "Mail",
    defaultProps: {
      title: "Contactez-nous",
      subtitle: "Nous répondons sous 24h.",
      showPhone: true,
      showAddress: false,
      showHours: true,
      showMap: false,
      formFields: ["name", "email", "phone", "message"],
    },
  },
  {
    type: "custom_form",
    label: "Formulaire avancé",
    description: "Formulaire personnalisé avec champs configurables",
    category: "conversion",
    icon: "ClipboardList",
    defaultProps: {
      title: "Formulaire de demande",
      subtitle: "",
      submitText: "Envoyer",
      successMessage: "Votre demande a bien été envoyée. Nous vous répondons rapidement.",
      formId: "custom_form_1",
      fields: [
        { id: "field_nom",     type: "text",     label: "Nom",          placeholder: "Votre nom",     required: true },
        { id: "field_email",   type: "email",    label: "E-mail",       placeholder: "Votre e-mail",  required: true },
        { id: "field_message", type: "textarea", label: "Message",      placeholder: "Votre message", required: true },
      ],
    },
  },
  {
    type: "popup",
    label: "Popup / Notification",
    description: "Fenêtre surgissante avec déclencheur configurable",
    category: "conversion",
    icon: "Bell",
    defaultProps: {
      title: "Offre spéciale !",
      content: "Profitez de notre promotion en cours. N'attendez pas !",
      trigger: "delay",
      delay: 5,
      scroll: 50,
      ctaText: "En profiter",
      ctaHref: "/contact",
      showOnce: true,
    },
  },

  {
    type: "newsletter",
    label: "Newsletter",
    description: "Formulaire d'inscription e-mail",
    category: "conversion",
    icon: "Rss",
    defaultProps: {
      title: "Restez informé",
      subtitle: "Inscrivez-vous à notre newsletter pour recevoir nos actualités.",
      placeholder: "Votre adresse e-mail",
      buttonText: "S'inscrire",
      successMessage: "Merci pour votre inscription !",
    },
  },
  {
    type: "countdown",
    label: "Compte à rebours",
    description: "Minuteur vers une date cible",
    category: "conversion",
    icon: "Timer",
    defaultProps: {
      title: "Offre limitée",
      subtitle: "Ne ratez pas cette opportunité !",
      targetDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0] + "T00:00:00",
      expiredLabel: "Offre expirée",
      showSeconds: true,
    },
  },

  // ── Interactif ───────────────────────────────────────────
  {
    type: "tabs",
    label: "Onglets",
    description: "Contenu organisé en onglets interactifs",
    category: "contenu",
    icon: "LayoutDashboard",
    defaultProps: {
      title: "",
      tabs: [
        { id: "tab_1", label: "Onglet 1", content: "<p>Contenu de l'onglet 1. Modifiez ce texte selon vos besoins.</p>" },
        { id: "tab_2", label: "Onglet 2", content: "<p>Contenu de l'onglet 2. Ajoutez du texte, des listes ou des images.</p>" },
        { id: "tab_3", label: "Onglet 3", content: "<p>Contenu de l'onglet 3. Personnalisez chaque onglet librement.</p>" },
      ],
    },
  },
  {
    type: "accordion",
    label: "Accordéon",
    description: "Sections dépliables pour organiser le contenu",
    category: "contenu",
    icon: "ChevronsUpDown",
    defaultProps: {
      title: "",
      items: [
        { id: "acc_1", title: "Section 1", content: "Contenu développé de la section 1. Expliquez un sujet en détail." },
        { id: "acc_2", title: "Section 2", content: "Contenu développé de la section 2. Ajoutez autant de sections que nécessaire." },
        { id: "acc_3", title: "Section 3", content: "Contenu développé de la section 3. L'accordéon permet d'organiser beaucoup d'informations." },
      ],
    },
  },
  {
    type: "map",
    label: "Carte / Localisation",
    description: "Carte OpenStreetMap avec adresse",
    category: "contenu",
    icon: "MapPin",
    defaultProps: {
      title: "Nous trouver",
      address: "",
      lat: undefined,
      lng: undefined,
      zoom: 14,
      height: 400,
    },
  },

  // ── Structure (pied de page) ──────────────────────────────
  {
    type: "footer",
    label: "Pied de page",
    description: "Footer avec colonnes, réseaux sociaux et copyright",
    category: "structure",
    icon: "LayoutTemplate",
    defaultProps: {
      logoText: "Mon Site",
      description: "Une description courte de votre entreprise ou activité.",
      columns: [
        { title: "Navigation", links: [{ label: "Accueil", href: "/" }, { label: "Services", href: "/services" }, { label: "Contact", href: "/contact" }] },
        { title: "Légal", links: [{ label: "Mentions légales", href: "/mentions" }, { label: "CGV", href: "/cgv" }] },
      ],
      social: { facebook: "", instagram: "", twitter: "", linkedin: "" },
      copyright: `© ${new Date().getFullYear()} — Tous droits réservés`,
      newsletter: false,
    },
  },

  // ── Social ───────────────────────────────────────────────────
  {
    type: "blog_feed",
    label: "Articles récents",
    description: "Derniers articles du blog DJAMA",
    category: "social",
    icon: "Newspaper",
    defaultProps: {
      title: "Notre blog",
      count: 3,
      showDate: true,
    },
  },

  // ── Intégration ──────────────────────────────────────────────
  {
    type: "products",
    label: "Produits",
    description: "Catalogue produits de la boutique DJAMA",
    category: "intégration",
    icon: "ShoppingBag",
    defaultProps: {
      title: "Nos produits",
      count: 6,
      showPrice: true,
      showCart: true,
    },
  },
  {
    type: "booking",
    label: "Réservation",
    description: "Calendrier de réservation DJAMA",
    category: "intégration",
    icon: "Calendar",
    defaultProps: {
      title: "Prendre rendez-vous",
      subtitle: "Choisissez votre créneau en ligne.",
    },
  },
];

export const SECTION_CATEGORIES = [
  { id: "structure",    label: "Structure" },
  { id: "contenu",      label: "Contenu" },
  { id: "conversion",   label: "Conversion" },
  { id: "social",       label: "Social" },
  { id: "intégration",  label: "Intégrations" },
] as const;

export function getSectionMeta(type: SectionType): SectionMeta | undefined {
  return SECTIONS_LIBRARY.find(s => s.type === type);
}
