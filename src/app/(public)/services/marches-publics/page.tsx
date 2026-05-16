"use client";

import {
  FileText,
  Search,
  Shield,
  Briefcase,
  CheckSquare,
  Edit,
  Users,
  TrendingUp,
  Send,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function MarchesPublicsPage() {
  return (
    <ServicePageShell
      icon={Briefcase}
      color="#f97316"
      colorRGB="249,115,22"
      badge="Administratif · Marchés Publics"
      title={
        <>
          Répondez aux appels d&apos;offres{" "}
          <span style={{ color: "#f97316" }}>avec succès</span>
        </>
      }
      subtitle="Constitution de dossiers de candidature, mémoire technique, documents obligatoires — on vous rend compétitif."
      stats={[
        { value: "Marchés publics", label: "& appels d'offres privés" },
        { value: "Dossier complet", label: "technique + administratif" },
        { value: "+80%", label: "de dossiers retenus" },
      ]}
      ctaLabel="Préparer mon dossier"
      ctaHref="/contact"
      ctaSecLabel="Poser une question"
      ctaSecHref="/contact"
      featuresTitle="Notre accompagnement"
      features={[
        {
          icon: FileText,
          color: "#f97316",
          title: "Analyse du dossier",
          desc: "Étude de l'appel d'offres, éligibilité, critères de notation.",
        },
        {
          icon: Search,
          color: "#f97316",
          title: "Constitution administrative",
          desc: "DC1, DC2, Kbis, attestations, assurances — tout préparé.",
        },
        {
          icon: Shield,
          color: "#f97316",
          title: "Mémoire technique",
          desc: "Rédaction professionnelle de votre offre technique et méthodologie.",
        },
        {
          icon: Briefcase,
          color: "#f97316",
          title: "Prix et décomposition",
          desc: "Aide à la structuration du DPGF / BPU / DQE.",
        },
        {
          icon: CheckSquare,
          color: "#f97316",
          title: "Relecture & optimisation",
          desc: "Correction, amélioration de la forme et du fond.",
        },
        {
          icon: Edit,
          color: "#f97316",
          title: "Documents obligatoires",
          desc: "Vérification exhaustive de la complétude du dossier.",
        },
        {
          icon: Users,
          color: "#f97316",
          title: "Suivi des délais",
          desc: "Alertes avant date limite, organisation du calendrier.",
        },
        {
          icon: TrendingUp,
          color: "#f97316",
          title: "Sous-traitance & GIE",
          desc: "Accompagnement pour les candidatures groupées.",
        },
      ]}
      processTitle="De l'annonce au dépôt"
      process={[
        {
          num: "01",
          icon: Search,
          color: "#f97316",
          title: "Analyse",
          desc: "Étude de l'avis de marché et de vos chances de succès.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: FileText,
          color: "#f97316",
          title: "Documents",
          desc: "Constitution du dossier administratif complet.",
          tag: "Jours 1–3",
        },
        {
          num: "03",
          icon: Edit,
          color: "#f97316",
          title: "Mémoire",
          desc: "Rédaction de votre offre technique sur mesure.",
          tag: "Jours 3–7",
        },
        {
          num: "04",
          icon: CheckSquare,
          color: "#f97316",
          title: "Relecture",
          desc: "Vérification, optimisation et validation finale.",
          tag: "Jours 7–8",
        },
        {
          num: "05",
          icon: Send,
          color: "#f97316",
          title: "Dépôt",
          desc: "Soumission du dossier sur la plateforme officielle.",
          tag: "Avant la date limite",
        },
      ]}
    />
  );
}
