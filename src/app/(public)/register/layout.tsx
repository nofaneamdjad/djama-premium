import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte | DJAMA",
  description: "Créez votre compte DJAMA et accédez à l'ensemble de nos outils.",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
