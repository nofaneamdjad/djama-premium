import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Définir mon mot de passe | DJAMA",
  description: "Choisissez votre mot de passe pour activer votre compte DJAMA.",
  robots: { index: false, follow: false },
};

export default function DefinirMotDePasseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
