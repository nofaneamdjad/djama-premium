import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portail client — DJAMA",
  description: "Votre espace client sécurisé DJAMA PRO",
  robots: { index: false, follow: false },
};

export default function PortailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
