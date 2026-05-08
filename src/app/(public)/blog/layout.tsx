import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Actualités — DJAMA",
  description: "Conseils, guides et actualités pour entrepreneurs. Développez votre activité avec le digital et l'IA.",
  openGraph: {
    title: "Blog DJAMA — Ressources pour entrepreneurs",
    description: "Conseils pratiques, guides et actualités pour développer votre activité.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
