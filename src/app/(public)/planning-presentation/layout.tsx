import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planning Agenda DJAMA — Gestion de planning pour équipes",
  description:
    "Découvrez DJAMA Planning : outil de gestion de planning partagé pour équipes et indépendants. Organisez vos interventions, absences et événements en un clin d'œil.",
  openGraph: {
    title: "Planning Agenda DJAMA — Gestion de planning pour équipes",
    description:
      "Un planning collaboratif simple et efficace pour les petites équipes et les freelances.",
    type: "website",
  },
};

export default function PlanningPresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
