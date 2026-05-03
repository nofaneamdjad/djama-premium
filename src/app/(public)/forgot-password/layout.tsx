import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié | DJAMA",
  description: "Réinitialisez votre mot de passe DJAMA.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
