import type { Metadata } from "next";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";
import { Providers } from "@/app/providers";

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
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>
          <SplashScreen />
          {children}
        </Providers>
      </body>
    </html>
  );
}
