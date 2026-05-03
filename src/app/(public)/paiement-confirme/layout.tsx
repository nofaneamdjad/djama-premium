import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement confirmé | DJAMA",
  description: "Votre paiement a été confirmé. Bienvenue chez DJAMA.",
  robots: { index: false, follow: false },
};

export default function PaiementConfirmeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
