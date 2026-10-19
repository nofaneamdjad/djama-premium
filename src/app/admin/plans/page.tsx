"use client";

import { Sliders } from "lucide-react";
import { ComingSoon } from "@/app/admin/_components/ComingSoon";

export default function PlansPage() {
  return (
    <ComingSoon
      icon={Sliders}
      title="Plans tarifaires"
      description="Gérez les plans DJAMA, leurs limites d'usage et les fonctionnalités incluses par niveau d'abonnement."
      features={[
        "Création et modification des plans (Gratuit, Premium, Enterprise)",
        "Limites par module : nombre d'items, d'utilisateurs, d'espace disque",
        "Périodes d'essai et coupons associés",
        "Grille tarifaire mensuelle / annuelle",
      ]}
    />
  );
}
