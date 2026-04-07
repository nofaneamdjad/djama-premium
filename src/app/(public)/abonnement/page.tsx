import { redirect } from "next/navigation";

/**
 * /abonnement → redirige vers /espace-client
 * (page historique remplacée par la nouvelle page d'offre)
 */
export default function AbonnementPage() {
  redirect("/espace-client");
}
