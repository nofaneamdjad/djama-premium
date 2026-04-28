import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services digitaux & outils pros",
  description:
    "Sites web, applications mobiles, coaching IA, automatisation, création auto-entrepreneur, visuels — tous les services digitaux pour développer votre activité.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Services digitaux & outils pros | DJAMA",
    description:
      "Sites web, applications mobiles, coaching IA, automatisation et bien plus. DJAMA accompagne entrepreneurs et PME dans tous leurs projets digitaux.",
    url: "https://djama.space/services",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "DJAMA Services" }],
  },
  twitter: {
    card: "summary",
    title: "Services digitaux & outils pros | DJAMA",
    description:
      "Sites web, apps, coaching IA, automatisation — tous les services pour développer votre activité.",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
