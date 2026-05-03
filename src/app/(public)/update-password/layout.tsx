import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modifier le mot de passe | DJAMA",
  description: "Modifiez votre mot de passe DJAMA.",
  robots: { index: false, follow: false },
};

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
