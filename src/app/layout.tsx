import type { Metadata, Viewport } from "next";
import "./globals.css";
import SplashScreen      from "@/components/SplashScreen";
import { WebViewBanner } from "@/components/WebViewBanner";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "DJAMA — Services digitaux & outils pro",
  description:
    "Sites, apps, montage, factures/devis, accompagnement URSSAF — une solution complète.",
};

/**
 * Viewport export (Next.js 15+).
 *
 * colorScheme "light dark" → page déclare qu'elle gère les deux thèmes.
 *   • Désactive l'algorithme Force Dark d'Android WebView (Chrome 81+).
 *   • Permet aux navigateurs modernes d'adapter leurs UI chrome (barres, etc.)
 * themeColor → barre de statut / navigation sombre sur Android/iOS.
 *   Le script no-flash ci-dessous met à jour dynamiquement cette valeur
 *   via <meta name="theme-color"> lorsque l'utilisateur change de thème.
 */
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Script no-flash — injecté dans <head>, exécuté de façon synchrone
 * AVANT que React hydrate et AVANT que globals.css soit parsé.
 * Pose data-theme sur <html> immédiatement → aucun flash de couleur.
 *
 * Logique : localStorage("djama-theme") → prefers-color-scheme → "dark"
 */
const noFlashScript = `(function(){try{var k="djama-theme",s=localStorage.getItem(k);if(s==="dark"||s==="light"){document.documentElement.setAttribute("data-theme",s);}else{var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",d?"dark":"light");}}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * Pas d'inline style colorScheme/backgroundColor :
     * le script no-flash pose data-theme en synchrone → les CSS vars
     * prennent le relais immédiatement, sans flash.
     */
    <html lang="fr">
      <head>
        {/* Script no-flash : synchrone, avant toute hydratation React */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          <SplashScreen />
          {children}
          {/* Bandeau "Ouvrir dans le navigateur" pour les in-app browsers */}
          <WebViewBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
