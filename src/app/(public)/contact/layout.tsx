import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nous contacter — Devis gratuit sous 24h",
  description:
    "Contactez DJAMA pour un devis gratuit, un appel découverte ou toute question sur nos services. Email, WhatsApp, téléphone — réponse garantie sous 24h.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Nous contacter — Devis gratuit sous 24h | DJAMA",
    description:
      "Discutons de votre projet. Devis gratuit, appel découverte 30 min, réponse sous 24h. Email, WhatsApp ou téléphone.",
    url: "https://djama.space/contact",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Contacter DJAMA" }],
  },
  twitter: {
    card: "summary",
    title: "Contacter DJAMA — Devis gratuit sous 24h",
    description:
      "Devis gratuit, appel découverte 30 min, réponse sous 24h. Discutons de votre projet.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
