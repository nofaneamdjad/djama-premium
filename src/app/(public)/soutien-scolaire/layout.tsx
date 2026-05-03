import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soutien Scolaire DJAMA — Cours particuliers à domicile",
  description:
    "Cours particuliers personnalisés avec DJAMA : mathématiques, français, sciences et plus. Des enseignants qualifiés pour accompagner vos enfants du primaire au lycée.",
  openGraph: {
    title: "Soutien Scolaire DJAMA — Cours particuliers à domicile",
    description:
      "Des cours particuliers adaptés au niveau de votre enfant, dispensés par des enseignants qualifiés.",
    type: "website",
  },
};

export default function SoutienScolaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
