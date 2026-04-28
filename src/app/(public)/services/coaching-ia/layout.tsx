import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coaching IA DJAMA — Maîtrisez l'IA pour votre business",
  description:
    "Formation IA complète pour entrepreneurs : 6 modules, 20 chapitres, 4h d'accompagnement expert. Automatisez, gagnez du temps, vendez mieux. Paiement unique 190€ — accès 3 mois.",
  alternates: { canonical: "/services/coaching-ia" },
  openGraph: {
    title: "Coaching IA DJAMA — Maîtrisez l'IA pour votre business",
    description:
      "Formation IA pour entrepreneurs : 6 modules · 20 chapitres · 4h d'accompagnement expert. Automatisez vos tâches et vendez mieux. 190€ paiement unique.",
    url: "https://djama.space/services/coaching-ia",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Coaching IA DJAMA" }],
  },
  twitter: {
    card: "summary",
    title: "Coaching IA DJAMA — Formation IA pour entrepreneurs",
    description:
      "6 modules · 20 chapitres · 4h d'accompagnement expert. Maîtrisez l'IA pour votre business. 190€.",
  },
};

export default function CoachingIALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
