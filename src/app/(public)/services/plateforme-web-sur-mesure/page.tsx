"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlatformeWebSurMesurePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/contact?besoin=Plateforme+web+sur+mesure");
  }, [router]);

  return null;
}
