import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abonnement DJAMA Pro — 11 outils à 11,90€/mois",
  description:
    "Accédez à 11 outils professionnels pour gérer votre activité : factures & devis, CRM, agenda, trésorerie, contrats IA, sourcing et plus. Sans engagement, résiliable à tout moment.",
  alternates: { canonical: "/abonnement" },
  openGraph: {
    title: "Abonnement DJAMA Pro — 11 outils à 11,90€/mois",
    description:
      "Factures, CRM, trésorerie, contrats IA, sourcing — 11 outils pros réunis pour 11,90€/mois. Sans engagement, accès immédiat.",
    url: "https://djama.space/abonnement",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "DJAMA Pro abonnement" }],
  },
  twitter: {
    card: "summary",
    title: "DJAMA Pro — 11 outils pros à 11,90€/mois",
    description:
      "Factures, CRM, trésorerie, contrats IA — tous vos outils business sans engagement.",
  },
};

export default function AbonnementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
