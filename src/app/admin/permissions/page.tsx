"use client";

import { Lock } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function PermissionsPage() {
  return (
    <ComingSoon
      icon={Lock}
      title="Permissions par module"
      description="Définissez les droits d'accès aux modules DJAMA pour chaque rôle (propriétaire, admin, membre)."
      features={[
        "Matrice rôles × modules avec granularité lecture/écriture/suppression",
        "Permissions héritées depuis le plan d'abonnement",
        "Override par utilisateur ou par organisation",
        "Audit des changements de permissions",
      ]}
    />
  );
}
