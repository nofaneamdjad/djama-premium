import type { Metadata } from "next";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

export const metadata: Metadata = {
  title: "DJAMA — Services digitaux & outils pro",
  description:
    "Sites, apps, montage, factures/devis, accompagnement URSSAF — une solution complète.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}