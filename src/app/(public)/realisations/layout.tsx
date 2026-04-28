import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos réalisations — Projets & études de cas",
  description:
    "Découvrez les projets digitaux réalisés par DJAMA : sites web, applications mobiles, outils sur mesure, automatisation. 50+ clients accompagnés depuis 2022.",
  alternates: { canonical: "/realisations" },
  openGraph: {
    title: "Nos réalisations — Projets & études de cas | DJAMA",
    description:
      "Sites web, applications, outils sur mesure, automatisation — 50+ projets livrés pour des entrepreneurs et PME depuis 2022.",
    url: "https://djama.space/realisations",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Réalisations DJAMA" }],
  },
  twitter: {
    card: "summary",
    title: "Réalisations DJAMA — 50+ projets digitaux",
    description:
      "Sites web, apps, outils sur mesure — découvrez nos projets pour entrepreneurs et PME.",
  },
};

export default function RealisationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
