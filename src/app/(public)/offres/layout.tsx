import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offres & Tarifs par profil — Indépendant, PME, Créatif",
  description:
    "Trouvez le pack DJAMA adapté à votre profil. Tarifs transparents pour indépendants, PME et agences créatives. De 11,90 €/mois à des projets sur mesure — pas de surprise, tout est clair.",
  openGraph: {
    title: "Offres & Tarifs DJAMA — Indépendant, PME, Créatif",
    description:
      "16 services, 3 profils, des prix annoncés. Site vitrine dès 490 €, coaching IA dès 190 €, SaaS pro à 11,90 €/mois. Choisissez votre pack.",
    url: "https://djama.space/offres",
    images: [
      {
        url: "https://djama.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "Offres & Tarifs DJAMA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Offres & Tarifs DJAMA — Indépendant, PME, Créatif",
    description:
      "16 services, 3 profils, des prix annoncés. Site vitrine dès 490 €, coaching IA dès 190 €, SaaS pro à 11,90 €/mois.",
    images: ["https://djama.space/og-image.png"],
  },
};

export default function OffresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
