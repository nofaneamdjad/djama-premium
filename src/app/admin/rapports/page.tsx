"use client";

import { BarChart2 } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function RapportsPage() {
  return (
    <ComingSoon
      icon={BarChart2}
      title="Rapports"
      description="Génération de rapports personnalisés sur l'activité du SaaS DJAMA — abonnements, revenus, utilisation, rétention."
      features={[
        "Rapport mensuel automatique (MRR, nouveaux clients, résiliations)",
        "Rapport d'utilisation par application",
        "Rapport de rétention et churn",
        "Export CSV / PDF des données",
        "Rapports planifiés par email",
        "Comparaisons périodiques (M-1, M-3, M-12)",
      ]}
    />
  );
}
