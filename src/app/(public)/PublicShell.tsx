"use client";

/**
 * PublicShell — wrapper conditionnel pour le layout public.
 *
 * Pour les routes du site vitrine : Navbar + Footer + WhatsApp + AssistantDJAMA.
 * Pour les routes de l'application (auth, espace client) : rendu nu, sans chrome vitrine.
 *
 * Cette logique vit ici (client component) plutôt que dans layout.tsx (server)
 * car usePathname() nécessite le contexte client.
 */

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar         from "@/components/Navbar";
import Footer         from "@/components/Footer";
import AssistantDJAMA from "@/components/AssistantDJAMA";
import WhatsAppButton from "@/components/WhatsAppButton";
import CookieBanner   from "@/components/CookieBanner";
import { LanguageProvider } from "@/lib/language-context";

/**
 * Routes qui doivent afficher uniquement la page,
 * sans Navbar / Footer / WhatsApp / AssistantDJAMA du site vitrine.
 */
const APP_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/update-password",
  "/definir-mot-de-passe",
  "/paiement-confirme",
  /* Les routes /client, /admin, /coaching-ia, /membre, /portail
     ne passent pas par (public)/layout, donc pas besoin de les lister ici. */
];

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
}

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /* ── Page app / auth : rendu minimal ── */
  if (isAppRoute(pathname)) {
    return <>{children}</>;
  }

  /* ── Page vitrine : layout complet ── */
  return (
    <LanguageProvider>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <AssistantDJAMA />
        <WhatsAppButton />
        <CookieBanner />
      </Suspense>
    </LanguageProvider>
  );
}
