import type { Metadata, Viewport } from "next";
import "./globals.css";
import SplashScreen    from "@/components/SplashScreen";
import { WebViewBanner } from "@/components/WebViewBanner";
import PWAManager from "@/components/PWAManager";

const BASE_URL = "https://djama.space";

export const metadata: Metadata = {
  // ── Titre ─────────────────────────────────────────────────────────
  title: {
    default: "DJAMA — L'écosystème digital pour entrepreneurs",
    template: "%s | DJAMA",
  },

  // ── Description ───────────────────────────────────────────────────
  description:
    "Présence digitale, outils de gestion, accompagnement expert et IA réunis en un seul écosystème. Rejoignez 50+ entrepreneurs qui font grandir leur activité avec DJAMA.",

  // ── Canonical & robots ────────────────────────────────────────────
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },

  // ── Open Graph ────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: BASE_URL,
    siteName: "DJAMA",
    title: "DJAMA — L'écosystème digital pour entrepreneurs",
    description:
      "Présence digitale, outils de gestion, accompagnement expert et IA réunis en un seul écosystème. 50+ entrepreneurs accompagnés depuis 2022.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "DJAMA — L'écosystème digital",
      },
    ],
  },

  // ── Twitter / X ───────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "DJAMA — L'écosystème digital pour entrepreneurs",
    description:
      "Présence digitale, outils de gestion, accompagnement expert et IA réunis en un seul écosystème.",
    images: ["/logo.png"],
  },

  // ── Autres ────────────────────────────────────────────────────────
  keywords: [
    // Marque
    "DJAMA", "djama.space", "djama space",
    // Services clés
    "création site web", "agence digitale", "application mobile",
    "coaching IA", "automatisation business", "intelligence artificielle entrepreneur",
    "outils gestion entreprise", "factures en ligne", "espace client",
    "soutien scolaire", "accompagnement administratif", "auto-entrepreneur URSSAF",
    "recherche fournisseurs", "marchés publics", "freelance",
    // Localisation
    "La Réunion", "Comores", "France", "Belgique",
    "agence digitale La Réunion", "création site web La Réunion",
    "coaching IA Réunion", "développement web Réunion",
  ],
  authors: [{ name: "DJAMA", url: BASE_URL }],
  creator: "DJAMA",
  publisher: "DJAMA",
  category: "Business & Technology",

  // ── PWA / Apple ───────────────────────────────────────────────────
  appleWebApp: {
    capable: true,
    title: "DJAMA",
    statusBarStyle: "black-translucent",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

/**
 * Viewport export (Next.js 15+).
 *
 * colorScheme "light dark" → dit au navigateur "cette page gère elle-même
 * le color-scheme", ce qui DÉSACTIVE l'algorithme Force Dark d'Android
 * WebView (WhatsApp, Facebook, Instagram in-app browser).
 * Le CSS `html { color-scheme: dark }` force ensuite le rendu sombre réel.
 *
 * themeColor → barre de statut / navigation sombre sur Android/iOS.
 */
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/* ── Schema.org JSON-LD ─────────────────────────────────── */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    /* ── Organisation + Service professionnel ── */
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${BASE_URL}/#organization`,
      name: "DJAMA",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
      image: `${BASE_URL}/logo.png`,
      telephone: "+262693520520",
      email: "contact@djama.space",
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+262693520520",
          contactType: "customer service",
          availableLanguage: ["French"],
          contactOption: "TollFree",
        },
        {
          "@type": "ContactPoint",
          contactType: "technical support",
          email: "contact@djama.space",
        },
      ],
      sameAs: [
        "https://instagram.com/djama.space",
        "https://djama.space",
      ],
      foundingDate: "2022",
      description:
        "Écosystème digital pour entrepreneurs : création de sites web, outils de gestion, accompagnement administratif et coaching IA.",
      areaServed: [
        { "@type": "Place", name: "La Réunion" },
        { "@type": "Place", name: "Comores" },
        { "@type": "Place", name: "France" },
        { "@type": "Place", name: "Belgique" },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services DJAMA",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Création de site web" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Application mobile" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Coaching IA" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Outils de gestion professionnels", price: "11.90", priceCurrency: "EUR" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Accompagnement administratif" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Soutien scolaire" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Automatisation & IA" } },
        ],
      },
      priceRange: "€€",
    },

    /* ── WebSite avec SearchAction ── */
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "DJAMA",
      inLanguage: "fr-FR",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/services?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },

    /* ── FAQ enrichie ── */
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Quels services propose DJAMA ?",
          acceptedAnswer: { "@type": "Answer", text: "DJAMA propose la création de sites web, applications mobiles, outils de gestion professionnels (facturation, agenda, CRM), coaching IA, soutien scolaire, automatisation et accompagnement administratif." },
        },
        {
          "@type": "Question",
          name: "Quel est le prix de l'abonnement DJAMA Pro ?",
          acceptedAnswer: { "@type": "Answer", text: "L'abonnement DJAMA Pro est à 11,90 € par mois, sans engagement. Il inclut 11 outils professionnels : facturation, CRM, agenda, trésorerie, contrats IA et plus." },
        },
        {
          "@type": "Question",
          name: "DJAMA propose-t-il du coaching IA ?",
          acceptedAnswer: { "@type": "Answer", text: "Oui. Le coaching IA DJAMA est une formation complète de 6 modules et 20 chapitres, au prix unique de 190 €, avec 4h d'accompagnement expert et une garantie satisfait ou remboursé de 7 jours." },
        },
        {
          "@type": "Question",
          name: "Sous quel délai DJAMA répond-il ?",
          acceptedAnswer: { "@type": "Answer", text: "DJAMA s'engage à répondre à toute demande de devis ou de contact sous 24 heures. WhatsApp disponible pour les demandes urgentes." },
        },
        {
          "@type": "Question",
          name: "DJAMA est-il disponible à La Réunion et aux Comores ?",
          acceptedAnswer: { "@type": "Answer", text: "Oui. DJAMA accompagne des clients à La Réunion, aux Comores, en France et en Belgique. Tout se fait à distance, en visio et par messagerie, sans déplacement nécessaire." },
        },
        {
          "@type": "Question",
          name: "Comment créer un site web avec DJAMA ?",
          acceptedAnswer: { "@type": "Answer", text: "Envoyez votre demande via le formulaire de contact ou WhatsApp. DJAMA analyse votre besoin, propose un devis sous 24h, puis conçoit et livre votre site en 7 à 14 jours." },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      style={{ colorScheme: "dark", backgroundColor: "#09090b" }}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SplashScreen />
        {children}
        <WebViewBanner />
        <PWAManager />
      </body>
    </html>
  );
}
