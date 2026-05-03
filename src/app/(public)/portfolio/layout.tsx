import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio DJAMA — Nos réalisations et projets",
  description:
    "Découvrez le portfolio DJAMA : sites web, applications mobiles, visuels publicitaires, montages vidéo et bien plus. Nos réalisations pour des freelances et TPE.",
  openGraph: {
    title: "Portfolio DJAMA — Nos réalisations et projets",
    description:
      "Parcourez nos projets réalisés pour des freelances et TPE françaises : digital, design, IA et accompagnement.",
    type: "website",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
