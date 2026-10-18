"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mes Sites est désormais intégré dans Site Web
export default function MesSitesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/client/site-web"); }, [router]);
  return null;
}
