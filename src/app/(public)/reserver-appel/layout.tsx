import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réserver un appel découverte | DJAMA",
  description:
    "Prenez rendez-vous pour un appel découverte gratuit avec l'équipe DJAMA. Discutons de vos besoins et de la meilleure solution pour votre activité.",
  openGraph: {
    title: "Réserver un appel découverte | DJAMA",
    description:
      "Un appel gratuit de 30 minutes pour analyser vos besoins et vous proposer les meilleures solutions DJAMA.",
    type: "website",
  },
};

export default function ReserverAppelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
