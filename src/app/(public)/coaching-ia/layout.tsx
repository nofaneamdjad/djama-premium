import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coaching IA DJAMA — Votre assistant business personnel",
  description:
    "Accédez à votre espace Coaching IA DJAMA : analyses business, relances clients, optimisation planning. Un coach intelligent disponible 24h/24 pour freelances et TPE.",
  openGraph: {
    title: "Coaching IA DJAMA — Votre assistant business personnel",
    description:
      "Un coach business alimenté par l'IA pour booster votre activité freelance ou TPE.",
    type: "website",
  },
};

export default function CoachingIALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
