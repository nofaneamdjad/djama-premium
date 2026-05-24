import PublicShell from "./PublicShell";

/**
 * Layout du groupe (public).
 *
 * Délègue à PublicShell (client component) qui détecte si la route est
 * une page vitrine (→ Navbar + Footer + WhatsApp) ou une page app/auth
 * (→ rendu nu, sans chrome du site vitrine).
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
