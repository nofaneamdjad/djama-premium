"use client";

import { Flame } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function IncidentsPage() {
  return (
    <ComingSoon
      icon={Flame}
      title="Incidents"
      description="Gestion des incidents techniques affectant la disponibilité ou les données DJAMA."
      features={[
        "Déclaration d'un incident (critique, majeur, mineur)",
        "Timeline de résolution en temps réel",
        "Notification automatique aux utilisateurs concernés",
        "Post-mortem et rapport de cause racine",
        "Historique des incidents résolus",
        "Indicateurs de disponibilité (SLA)",
      ]}
    />
  );
}
