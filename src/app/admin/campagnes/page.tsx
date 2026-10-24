"use client";

import { Megaphone } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function CampagnesPage() {
  return (
    <ComingSoon
      icon={Megaphone}
      title="Campagnes"
      description="Campagnes marketing liées à la commercialisation du logiciel DJAMA."
      features={[
        "Campagnes email d'acquisition et rétention",
        "Codes promotionnels et offres limitées",
        "Suivi des inscriptions par campagne",
        "A/B test des messages d'onboarding",
        "Intégration avec les données d'abonnements",
        "Rapports ROI par campagne",
      ]}
    />
  );
}
