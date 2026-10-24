"use client";

import { Undo2 } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function RemboursementsPage() {
  return (
    <ComingSoon
      icon={Undo2}
      title="Remboursements"
      description="Gestion des demandes de remboursement sur la plateforme DJAMA."
      features={[
        "Demandes de remboursement en attente",
        "Historique des remboursements accordés",
        "Approbation par le gérant ou la finance",
        "Intégration Stripe Refunds",
        "Journal des décisions et justifications",
        "Statistiques de remboursement par période",
      ]}
    />
  );
}
