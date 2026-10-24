"use client";

import { TestTube2 } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function EssaisPage() {
  return (
    <ComingSoon
      icon={TestTube2}
      title="Essais gratuits"
      description="Supervision des périodes d'essai en cours sur la plateforme DJAMA."
      features={[
        "Liste des comptes en période d'essai",
        "Durée restante et date d'expiration",
        "Conversion essai → abonnement payant",
        "Relances automatiques avant expiration",
        "Statistiques de conversion des essais",
        "Extension manuelle autorisée (gérant uniquement)",
      ]}
    />
  );
}
