import type { SiteTemplate } from "./types";

export const SITE_TEMPLATES: SiteTemplate[] = [
  // ── Artisan / TPE ──────────────────────────────────────────────────────────
  {
    id: "artisan",
    label: "Artisan & TPE",
    category: "TPE/PME",
    desc: "Site vitrine professionnel pour artisans et petites entreprises.",
    color: "#2563EB",
    icon: "🔨",
    theme: {
      primaryColor: "#2563EB",
      secondaryColor: "#1E40AF",
      accentColor: "#F59E0B",
      fontHeading: "Inter",
    },
    pages: [
      {
        title: "Accueil",
        slug: "accueil",
        isHome: true,
        sections: [
          { type: "nav", props: { logo: "Mon Entreprise", links: [{ label: "Accueil", href: "/" }, { label: "Services", href: "#services" }, { label: "Contact", href: "#contact" }], ctaText: "Devis gratuit", ctaHref: "#contact" }, styles: {} },
          { type: "hero", props: { title: "Artisan qualifié à votre service", subtitle: "Interventions rapides, travail soigné et garantie de satisfaction.", cta1Text: "Demander un devis", cta1Href: "#contact", cta2Text: "Voir nos réalisations", cta2Href: "#galerie" }, styles: { paddingTop: "xl", paddingBot: "xl" } },
          { type: "stats", props: { items: [{ value: "15+", label: "Ans d'expérience" }, { value: "1200+", label: "Clients satisfaits" }, { value: "24h", label: "Délai de réponse" }, { value: "100%", label: "Garantie satisfaction" }] }, styles: { bg: "#F8FAFC" } },
          { type: "services", props: { title: "Nos prestations", items: [{ title: "Installation", desc: "Pose et installation selon les normes en vigueur.", icon: "Wrench" }, { title: "Rénovation", desc: "Remise à neuf et modernisation de vos installations.", icon: "Home" }, { title: "Dépannage", desc: "Intervention rapide en cas d'urgence.", icon: "Zap" }] }, styles: { bg: "#FFFFFF", paddingTop: "lg", paddingBot: "lg" } },
          { type: "testimonials", props: { title: "Avis clients", items: [{ name: "Jean-Pierre M.", role: "Particulier", rating: 5, text: "Travail impeccable, délais respectés et prix honnêtes. Je recommande vivement !" }, { name: "Société Dupont", role: "PME", rating: 5, text: "Partenaire fiable depuis 5 ans. Professionnalisme irréprochable." }, { name: "Marie L.", role: "Particulier", rating: 5, text: "Intervention rapide et efficace. Résultat parfait !" }] }, styles: { bg: "#F8FAFC" } },
          { type: "cta", props: { title: "Prêt à démarrer votre projet ?", subtitle: "Contactez-nous pour un devis gratuit sous 24h.", cta1Text: "Nous appeler", cta1Href: "tel:+33600000000", cta2Text: "Formulaire de contact", cta2Href: "#contact" }, styles: {} },
          { type: "contact", props: { title: "Contactez-nous", subtitle: "Réponse garantie sous 24h.", formFields: ["name", "email", "phone", "message"] }, styles: { bg: "#F8FAFC", paddingTop: "lg", paddingBot: "lg" } },
        ],
      },
    ],
  },

  // ── Consultant ─────────────────────────────────────────────────────────────
  {
    id: "consultant",
    label: "Consultant & Coach",
    category: "Services",
    desc: "Positionnez votre expertise et attirez de nouveaux clients.",
    color: "#7C3AED",
    icon: "💼",
    theme: {
      primaryColor: "#7C3AED",
      secondaryColor: "#5B21B6",
      accentColor: "#F59E0B",
      fontHeading: "Playfair Display",
      fontBody: "Inter",
    },
    pages: [
      {
        title: "Accueil",
        slug: "accueil",
        isHome: true,
        sections: [
          { type: "nav", props: { logo: "Votre Nom", links: [{ label: "À propos", href: "#apropos" }, { label: "Services", href: "#services" }, { label: "Témoignages", href: "#temoignages" }, { label: "Contact", href: "#contact" }], ctaText: "Prendre RDV", ctaHref: "#contact" }, styles: {} },
          { type: "hero", props: { title: "Transformez votre entreprise grâce à l'expertise", subtitle: "Consultant spécialisé en stratégie d'entreprise, j'accompagne les dirigeants vers la réussite.", cta1Text: "Prendre rendez-vous", cta1Href: "#contact", cta2Text: "Découvrir mes services", cta2Href: "#services" }, styles: { paddingTop: "xl", paddingBot: "xl" } },
          { type: "about", props: { title: "Mon approche", content: "Avec plus de 15 ans d'expérience, j'ai accompagné plus de 200 entreprises dans leur transformation. Mon approche combine analyse rigoureuse, pragmatisme et focus sur les résultats mesurables.", layout: "image-right" }, styles: { bg: "#F8F5FF" } },
          { type: "services", props: { title: "Mes services", items: [{ title: "Stratégie", desc: "Définissez une vision claire et un plan d'action concret." }, { title: "Organisation", desc: "Optimisez vos processus et votre structure." }, { title: "Coaching Dirigeant", desc: "Développez votre leadership et vos soft skills." }] }, styles: {} },
          { type: "stats", props: { items: [{ value: "200+", label: "Entreprises accompagnées" }, { value: "15 ans", label: "D'expérience" }, { value: "94%", label: "Clients satisfaits" }] }, styles: { bg: "#F8F5FF" } },
          { type: "testimonials", props: { title: "Ce que disent mes clients", items: [{ name: "Alexandre B.", role: "PDG, TechCorp", rating: 5, text: "Un accompagnement transformateur. Notre CA a doublé en 18 mois." }, { name: "Sophie M.", role: "DG, PME Industrie", rating: 5, text: "Clarté, rigueur et résultats. Je recommande sans réserve." }] }, styles: {} },
          { type: "cta", props: { title: "Discutons de vos enjeux", subtitle: "Un appel découverte de 30 min pour évaluer comment je peux vous aider.", cta1Text: "Réserver un appel", cta1Href: "#contact" }, styles: {} },
          { type: "contact", props: { title: "Contact", subtitle: "", formFields: ["name", "email", "phone", "message"] }, styles: { bg: "#F8F5FF" } },
        ],
      },
    ],
  },

  // ── Restaurant / Food ──────────────────────────────────────────────────────
  {
    id: "restaurant",
    label: "Restaurant & Food",
    category: "Restauration",
    desc: "Mettez en valeur votre cuisine et attirez des clients.",
    color: "#DC2626",
    icon: "🍽️",
    theme: {
      primaryColor: "#DC2626",
      secondaryColor: "#B91C1C",
      accentColor: "#F59E0B",
      fontHeading: "Playfair Display",
      fontBody: "Inter",
    },
    pages: [
      {
        title: "Accueil",
        slug: "accueil",
        isHome: true,
        sections: [
          { type: "nav", props: { logo: "Restaurant", links: [{ label: "Menu", href: "#menu" }, { label: "Notre histoire", href: "#histoire" }, { label: "Réservation", href: "#reservation" }], ctaText: "Réserver", ctaHref: "#reservation" }, styles: {} },
          { type: "hero", props: { title: "Une expérience culinaire inoubliable", subtitle: "Saveurs authentiques, produits locaux et ambiance chaleureuse depuis 2005.", cta1Text: "Réserver une table", cta1Href: "#reservation", cta2Text: "Voir le menu", cta2Href: "#menu" }, styles: { paddingTop: "xl", paddingBot: "xl" } },
          { type: "features", props: { title: "Notre promesse", items: [{ title: "Produits locaux", desc: "Nous sélectionnons les meilleurs producteurs de la région." }, { title: "Fait maison", desc: "Tout est préparé sur place par notre brigade." }, { title: "Vins naturels", desc: "Une cave soigneusement sélectionnée par notre sommelier." }, { title: "Service attentionné", desc: "Une équipe passionnée à votre service." }] }, styles: { bg: "#FFF5F5" } },
          { type: "stats", props: { items: [{ value: "18", label: "Ans d'histoire" }, { value: "50", label: "Couverts" }, { value: "★ 4.9", label: "Note Google" }] }, styles: {} },
          { type: "testimonials", props: { title: "Avis de nos clients", items: [{ name: "Marie T.", rating: 5, text: "Un repas exceptionnel ! La décoration, le service, les saveurs… Tout était parfait." }, { name: "Luc D.", rating: 5, text: "Notre restaurant préféré depuis 10 ans. Toujours aussi bon !" }] }, styles: { bg: "#FFF5F5" } },
          { type: "contact", props: { title: "Réservation", subtitle: "Réservez votre table en ligne ou appelez-nous.", showPhone: true }, styles: {} },
        ],
      },
    ],
  },

  // ── E-commerce / Boutique ──────────────────────────────────────────────────
  {
    id: "boutique",
    label: "Boutique en ligne",
    category: "E-commerce",
    desc: "Vendez vos produits en ligne avec une boutique professionnelle.",
    color: "#059669",
    icon: "🛍️",
    theme: {
      primaryColor: "#059669",
      secondaryColor: "#047857",
      accentColor: "#F59E0B",
      fontHeading: "Inter",
    },
    pages: [
      {
        title: "Accueil",
        slug: "accueil",
        isHome: true,
        sections: [
          { type: "nav", props: { logo: "Ma Boutique", links: [{ label: "Produits", href: "#produits" }, { label: "À propos", href: "#apropos" }, { label: "Contact", href: "#contact" }], ctaText: "Voir le catalogue", ctaHref: "#produits" }, styles: {} },
          { type: "hero", props: { title: "Des produits d'exception", subtitle: "Sélection rigoureuse, livraison rapide et service client disponible 7j/7.", cta1Text: "Découvrir nos produits", cta1Href: "#produits" }, styles: { paddingTop: "xl", paddingBot: "xl" } },
          { type: "features", props: { title: "Pourquoi nous choisir ?", items: [{ title: "Qualité garantie", desc: "Chaque produit est sélectionné et testé par notre équipe." }, { title: "Livraison rapide", desc: "Expédition sous 24h, livraison en 48h." }, { title: "Retours faciles", desc: "30 jours pour changer d'avis, sans questions." }, { title: "Service client", desc: "Une équipe disponible 7j/7 par chat, email ou téléphone." }] }, styles: { bg: "#F0FDF4" } },
          { type: "products", props: { title: "Nos produits", count: 6, showPrice: true, showCart: true }, styles: {} },
          { type: "testimonials", props: { title: "Ils nous font confiance", items: [{ name: "Camille R.", rating: 5, text: "Super boutique ! Produits conformes à la description et livraison ultra rapide." }, { name: "Thomas M.", rating: 5, text: "Excellent rapport qualité/prix. Je commande régulièrement." }] }, styles: { bg: "#F0FDF4" } },
          { type: "cta", props: { title: "Commandez dès maintenant", subtitle: "Profitez de la livraison offerte à partir de 50€.", cta1Text: "Découvrir le catalogue", cta1Href: "#produits" }, styles: {} },
        ],
      },
    ],
  },

  // ── Professionnel de santé ─────────────────────────────────────────────────
  {
    id: "sante",
    label: "Professionnel de santé",
    category: "Santé",
    desc: "Cabinet médical, paramédical ou bien-être.",
    color: "#0891B2",
    icon: "⚕️",
    theme: {
      primaryColor: "#0891B2",
      secondaryColor: "#0E7490",
      accentColor: "#10B981",
      fontHeading: "Inter",
      borderRadius: "lg",
    },
    pages: [
      {
        title: "Accueil",
        slug: "accueil",
        isHome: true,
        sections: [
          { type: "nav", props: { logo: "Cabinet", links: [{ label: "Présentation", href: "#presentation" }, { label: "Consultations", href: "#consultations" }, { label: "Informations pratiques", href: "#infos" }], ctaText: "Prendre RDV", ctaHref: "#rdv" }, styles: {} },
          { type: "hero", props: { title: "Votre santé, notre priorité", subtitle: "Cabinet de proximité offrant des soins de qualité dans un environnement bienveillant.", cta1Text: "Prendre rendez-vous", cta1Href: "#rdv" }, styles: { paddingTop: "xl", paddingBot: "xl" } },
          { type: "services", props: { title: "Nos consultations", items: [{ title: "Consultation générale", desc: "Suivi médical personnalisé." }, { title: "Prévention", desc: "Bilans et dépistages." }, { title: "Urgences", desc: "Prise en charge rapide." }] }, styles: { bg: "#F0F9FF" } },
          { type: "booking", props: { title: "Prendre rendez-vous", subtitle: "Choisissez votre créneau en ligne." }, styles: {} },
          { type: "faq", props: { title: "Informations pratiques", items: [{ q: "Quels sont les horaires d'ouverture ?", a: "Du lundi au vendredi, 8h-19h. Le samedi matin sur rendez-vous." }, { q: "Prenez-vous de nouveaux patients ?", a: "Oui, nous acceptons de nouveaux patients sur rendez-vous." }, { q: "Quels sont les modes de paiement acceptés ?", a: "Nous acceptons la carte vitale, la mutuelle, les espèces et la carte bancaire." }] }, styles: { bg: "#F0F9FF" } },
          { type: "contact", props: { title: "Contact & Accès", showPhone: true, showAddress: true }, styles: {} },
        ],
      },
    ],
  },

  // ── Agence / Studio ────────────────────────────────────────────────────────
  {
    id: "agence",
    label: "Agence & Studio créatif",
    category: "Services créatifs",
    desc: "Showcasez vos projets et attirez de nouveaux clients.",
    color: "#1F2937",
    icon: "✨",
    theme: {
      primaryColor: "#6366F1",
      secondaryColor: "#4F46E5",
      accentColor: "#EC4899",
      bgColor: "#0F172A",
      textColor: "#F8FAFC",
      fontHeading: "Inter",
      darkMode: true,
    },
    pages: [
      {
        title: "Accueil",
        slug: "accueil",
        isHome: true,
        sections: [
          { type: "nav", props: { logo: "Studio", links: [{ label: "Projets", href: "#projets" }, { label: "Services", href: "#services" }, { label: "Équipe", href: "#equipe" }], ctaText: "Parlons-en", ctaHref: "#contact" }, styles: { bg: "#0F172A" } },
          { type: "hero", props: { title: "Nous créons des expériences digitales mémorables", subtitle: "Stratégie, design et développement au service de votre ambition.", cta1Text: "Voir nos projets", cta1Href: "#projets", cta2Text: "Nous contacter", cta2Href: "#contact" }, styles: { bg: "#0F172A", textColor: "#F8FAFC", paddingTop: "xl", paddingBot: "xl" } },
          { type: "services", props: { title: "Nos expertises", items: [{ title: "UX/UI Design", desc: "Interfaces intuitives et mémorables." }, { title: "Développement", desc: "Web et mobile, performant et scalable." }, { title: "Stratégie digitale", desc: "Vision et plan de croissance." }] }, styles: { bg: "#1E293B", textColor: "#F8FAFC" } },
          { type: "stats", props: { items: [{ value: "80+", label: "Projets livrés" }, { value: "40+", label: "Clients actifs" }, { value: "5", label: "Années d'expertise" }] }, styles: { bg: "#0F172A", textColor: "#F8FAFC" } },
          { type: "team", props: { title: "Notre équipe", members: [{ name: "Alex", role: "Creative Director", bio: "" }, { name: "Sam", role: "Lead Developer", bio: "" }, { name: "Jordan", role: "UX Designer", bio: "" }] }, styles: { bg: "#1E293B", textColor: "#F8FAFC" } },
          { type: "cta", props: { title: "Votre prochain projet commence ici", subtitle: "", cta1Text: "Démarrer un projet", cta1Href: "#contact" }, styles: {} },
          { type: "contact", props: { title: "Parlons de votre projet", subtitle: "", formFields: ["name", "email", "message"] }, styles: { bg: "#1E293B", textColor: "#F8FAFC" } },
        ],
      },
    ],
  },
];

export function getTemplate(id: string): SiteTemplate | undefined {
  return SITE_TEMPLATES.find(t => t.id === id);
}
