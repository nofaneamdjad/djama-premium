"use client";

import { Wrench } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function MaintenancePage() {
  return (
    <ComingSoon
      icon={Wrench}
      title="Maintenance"
      description="Outils de maintenance de la plateforme : purge de cache, recalcul d'index, nettoyage des données orphelines."
      features={[
        "Mode maintenance global avec page d'interruption personnalisée",
        "Purge du cache Next.js (revalidation des routes ISR)",
        "Nettoyage des fichiers orphelins dans les buckets Supabase Storage",
        "Recalcul des statistiques analytics",
        "Export de la base de données (tables clés)",
      ]}
    />
  );
}
