import type { Metadata, Viewport } from "next";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

export const metadata: Metadata = {
  title: "DJAMA — Services digitaux & outils pro",
  description:
    "Sites, apps, montage, factures/devis, accompagnement URSSAF — une solution complète.",
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
      </body>
    </html>
  );
}
