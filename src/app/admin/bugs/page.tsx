"use client";

import { Bug } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function BugsPage() {
  return (
    <ComingSoon
      icon={Bug}
      title="Bugs"
      description="Suivi des remontées de bugs signalés par les utilisateurs DJAMA."
      features={[
        "Liste des bugs signalés avec reproduction",
        "Sévérité : Bloquant, Majeur, Mineur",
        "Affectation à un développeur",
        "Lien vers commit ou PR de correction",
        "Notification automatique à l'utilisateur à la résolution",
        "Statistiques de qualité logicielle",
      ]}
    />
  );
}
