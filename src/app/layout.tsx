import type { Metadata, Viewport } from "next";
import "./globals.css";
import SplashScreen    from "@/components/SplashScreen";
import { WebViewBanner } from "@/components/WebViewBanner";

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
    card: "summary",
    title: "DJAMA — L'écosystème digital pour entrepreneurs",
    description:
      "Présence digitale, outils de gestion, accompagnement expert et IA réunis en un seul écosystème.",
    images: ["/logo.png"],
  },

  // ── Autres ────────────────────────────────────────────────────────
  keywords: [
    "agence digitale", "création site web", "application mobile",
    "outils gestion entreprise", "coaching IA", "automatisation business",
    "factures en ligne", "espace client", "entrepreneur", "freelance",
    "DJAMA", "djama.space",
  ],
  authors: [{ name: "DJAMA", url: BASE_URL }],
  creator: "DJAMA",
  publisher: "DJAMA",
  category: "Business & Technology",
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
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "DJAMA",
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
      contactPoint: [
        { "@type": "ContactPoint", telephone: "+262693520520", contactType: "customer service", availableLanguage: ["French"] },
        { "@type": "ContactPoint", contactType: "technical support", email: "contact@djama.space" },
      ],
      sameAs: ["https://instagram.com/djama.space"],
      foundingDate: "2022",
      description: "Écosystème digital pour entrepreneurs : création de sites web, outils de gestion, accompagnement administratif et coaching IA.",
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "DJAMA",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/services?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
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
      </body>
    </html>
  );
}
