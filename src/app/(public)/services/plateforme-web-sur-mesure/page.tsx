"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlatformeWebSurMesurePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/services/automatisation-ia");
  }, [router]);

  return null;
}
