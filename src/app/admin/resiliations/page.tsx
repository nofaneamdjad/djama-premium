"use client";

import { RefreshCcw } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function ResiliationsPage() {
  return (
    <ComingSoon
      icon={RefreshCcw}
      title="Résiliations"
      description="Suivi et analyse des résiliations d'abonnements DJAMA."
      features={[
        "Liste des résiliations en cours et historique",
        "Motifs déclarés par les utilisateurs",
        "Délais de préavis et dates d'effet",
        "Taux de churn par période",
        "Actions de rétention possibles",
        "Réactivation d'un abonnement résilié",
      ]}
    />
  );
}
