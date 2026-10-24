"use client";

import { ClipboardCheck } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function TicketsPage() {
  return (
    <ComingSoon
      icon={ClipboardCheck}
      title="Tickets support"
      description="Système de ticketing pour les demandes d'assistance des utilisateurs DJAMA."
      features={[
        "File de tickets classés par priorité",
        "Affectation aux agents support",
        "Statuts : Ouvert, En cours, Résolu, Fermé",
        "Escalade vers le niveau technique",
        "Base de connaissances liée",
        "Indicateurs de satisfaction (CSAT)",
        "Historique complet des échanges",
      ]}
    />
  );
}
