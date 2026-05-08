import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculateur de tarifs — DJAMA",
  description: "Estimez le coût de votre projet digital en quelques secondes. Site web, application mobile, IA — tarifs transparents.",
  openGraph: {
    title: "Calculateur de tarifs DJAMA",
    description: "Configurez votre projet et obtenez une estimation instantanée.",
  },
};

export default function CalculateurLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
