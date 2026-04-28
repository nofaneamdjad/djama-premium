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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * style inline sur <html> : assure le fond sombre même avant que
     * globals.css soit parsé (flash blanc dans certains WebViews).
     * colorScheme répété ici pour les navigateurs qui ignorent la balise meta.
     */
    <html
      lang="fr"
      style={{ colorScheme: "dark", backgroundColor: "#09090b" }}
    >
      <body>
        <SplashScreen />
        {children}
        {/* Bandeau "Ouvrir dans le navigateur" pour les in-app browsers */}
        <WebViewBanner />
      </body>
    </html>
  );
}
