"use client";

import {
  FileText,
  Mail,
  Globe,
  Folder,
  Clock,
  Shield,
  Users,
  HeartHandshake,
  MessageSquare,
  CheckSquare,
  Send,
  CheckCircle2,
} from "lucide-react";
import ServicePageShell from "@/components/ServicePageShell";

export default function AssistanceAdministrativePage() {
  return (
    <ServicePageShell
      icon={Folder}
      color="#FFB900"
      colorRGB="255,185,0"
      badge="Administratif · Assistance"
      title={
        <>
          L&apos;administratif,{" "}
          <span style={{ color: "#FFB900" }}>on s&apos;en occupe</span>
        </>
      }
      subtitle="Courriers, dossiers, démarches en ligne, formulaires officiels — on gère vos formalités pour vous."
      stats={[
        { value: "48h", label: "délai traitement" },
        { value: "100%", label: "en ligne" },
        { value: "Tous types", label: "de démarches" },
      ]}
      ctaLabel="Confier mes démarches"
      ctaHref="/contact"
      ctaSecLabel="Poser une question"
      ctaSecHref="/contact"
      featuresTitle="Nos prestations"
      features={[
        {
          icon: FileText,
          color: "#FFB900",
          title: "Rédaction de courriers",
          desc: "Lettres administratives, réclamations, relances officielles rédigées avec soin.",
        },
        {
          icon: Mail,
          color: "#FFB900",
          title: "Démarches en ligne",
          desc: "CAF, impôts, mairie, Pôle Emploi, préfecture — on fait les démarches pour vous.",
        },
        {
          icon: Globe,
          color: "#FFB900",
          title: "Constitution de dossiers",
          desc: "Rassemblement, organisation et vérification de tous les documents requis.",
        },
        {
          icon: Folder,
          color: "#FFB900",
          title: "Formulaires officiels",
          desc: "Remplissage précis de tout formulaire administratif, en ligne ou papier.",
        },
        {
          icon: Clock,
          color: "#FFB900",
          title: "Suivi de dossiers",
          desc: "On suit l'avancement de vos demandes et vous tenons informé.",
        },
        {
          icon: Shield,
          color: "#FFB900",
          title: "Classement & organisation",
          desc: "Numérisation, organisation et archivage de vos documents importants.",
        },
        {
          icon: Users,
          color: "#FFB900",
          title: "Pour les particuliers",
          desc: "Aides sociales, logement, santé, retraite — toutes démarches courantes.",
        },
        {
          icon: HeartHandshake,
          color: "#FFB900",
          title: "Pour les professionnels",
          desc: "Administratif quotidien, courriers officiels, formalités métier.",
        },
      ]}
      processTitle="Un accompagnement clé en main"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#FFB900",
          title: "Brief",
          desc: "Vous nous décrivez votre démarche et partagez vos documents.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: FileText,
          color: "#FFB900",
          title: "Analyse",
          desc: "On étudie votre situation et ce qui est nécessaire.",
          tag: "Jour 1",
        },
        {
          num: "03",
          icon: CheckSquare,
          color: "#FFB900",
          title: "Traitement",
          desc: "Rédaction, remplissage et préparation complète.",
          tag: "Jours 1–2",
        },
        {
          num: "04",
          icon: Send,
          color: "#FFB900",
          title: "Validation",
          desc: "Vous vérifiez et validez avant tout envoi.",
          tag: "Jour 2",
        },
        {
          num: "05",
          icon: CheckCircle2,
          color: "#FFB900",
          title: "Clôture",
          desc: "Envoi officiel + confirmation de réception.",
          tag: "Jour 2–3",
        },
      ]}
    />
  );
}
