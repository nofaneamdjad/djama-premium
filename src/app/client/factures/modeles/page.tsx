"use client";
/**
 * /client/factures/modeles → Redirige vers la galerie unifiée.
 * Conserve l'URL de l'ancienne page pour compatibilité des bookmarks.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ModelesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/client/factures/galerie"); }, [router]);
  return null;
}
