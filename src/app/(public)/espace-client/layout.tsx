import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace client | DJAMA",
  description: "Accédez à votre espace client DJAMA.",
  robots: { index: false, follow: false },
};

export default function EspaceClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
