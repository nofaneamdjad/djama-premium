"use client";

import { Webhook } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function WebhooksPage() {
  return (
    <ComingSoon
      icon={Webhook}
      title="Webhooks"
      description="Configurez les webhooks entrants (Stripe, PayPal) et sortants pour les intégrations tierces."
      features={[
        "Liste des webhooks Stripe et PayPal avec statut de validation",
        "Historique des événements reçus (200 derniers)",
        "Test de renvoi d'un événement",
        "Alertes sur les webhooks en échec répété",
      ]}
    />
  );
}
