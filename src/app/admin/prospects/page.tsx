"use client";

import { TrendingUp } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function ProspectsPage() {
  return (
    <ComingSoon
      icon={TrendingUp}
      title="Prospects SaaS"
      description="Suivi des prospects intéressés par DJAMA avant leur inscription."
      features={[
        "Pipeline de prospects qualifiés",
        "Source d'acquisition (organique, campagne, parrainage)",
        "Statut : Prospect, Démonstration, Négociation, Converti",
        "Historique des échanges commerciaux",
        "Taux de conversion par canal",
        "Rappels et relances planifiées",
      ]}
    />
  );
}
