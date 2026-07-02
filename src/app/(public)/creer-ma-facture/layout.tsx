import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer une facture gratuite — Générateur PDF en ligne | DJAMA",
  description:
    "Générez votre facture professionnelle en 30 secondes. Gratuit, sans compte, téléchargement PDF immédiat. Idéal pour auto-entrepreneurs.",
  keywords: [
    "créer facture gratuit",
    "générateur facture",
    "facture auto-entrepreneur",
    "facture pdf gratuit",
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
