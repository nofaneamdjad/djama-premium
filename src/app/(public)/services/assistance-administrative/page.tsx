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
      color="#c9a55a"
      colorRGB="201,165,90"
      badge="Administratif · Assistance"
      title={
        <>
          L&apos;administratif,{" "}
          <span style={{ color: "#c9a55a" }}>on s&apos;en occupe</span>
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
          color: "#c9a55a",
          title: "Rédaction de courriers",
          desc: "Lettres administratives, réclamations, relances officielles rédigées avec soin.",
        },
        {
          icon: Mail,
          color: "#c9a55a",
          title: "Démarches en ligne",
          desc: "CAF, impôts, mairie, Pôle Emploi, préfecture — on fait les démarches pour vous.",
        },
        {
          icon: Globe,
          color: "#c9a55a",
          title: "Constitution de dossiers",
          desc: "Rassemblement, organisation et vérification de tous les documents requis.",
        },
        {
          icon: Folder,
          color: "#c9a55a",
          title: "Formulaires officiels",
          desc: "Remplissage précis de tout formulaire administratif, en ligne ou papier.",
        },
        {
          icon: Clock,
          color: "#c9a55a",
          title: "Suivi de dossiers",
          desc: "On suit l'avancement de vos demandes et vous tenons informé.",
        },
        {
          icon: Shield,
          color: "#c9a55a",
          title: "Classement & organisation",
          desc: "Numérisation, organisation et archivage de vos documents importants.",
        },
        {
          icon: Users,
          color: "#c9a55a",
          title: "Pour les particuliers",
          desc: "Aides sociales, logement, santé, retraite — toutes démarches courantes.",
        },
        {
          icon: HeartHandshake,
          color: "#c9a55a",
          title: "Pour les professionnels",
          desc: "Administratif quotidien, courriers officiels, formalités métier.",
        },
      ]}
      processTitle="Un accompagnement clé en main"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: "#c9a55a",
          title: "Brief",
          desc: "Vous nous décrivez votre démarche et partagez vos documents.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: FileText,
          color: "#c9a55a",
          title: "Analyse",
          desc: "On étudie votre situation et ce qui est nécessaire.",
          tag: "Jour 1",
        },
        {
          num: "03",
          icon: CheckSquare,
          color: "#c9a55a",
          title: "Traitement",
          desc: "Rédaction, remplissage et préparation complète.",
          tag: "Jours 1–2",
        },
        {
          num: "04",
          icon: Send,
          color: "#c9a55a",
          title: "Validation",
          desc: "Vous vérifiez et validez avant tout envoi.",
          tag: "Jour 2",
        },
        {
          num: "05",
          icon: CheckCircle2,
          color: "#c9a55a",
          title: "Clôture",
          desc: "Envoi officiel + confirmation de réception.",
          tag: "Jour 2–3",
        },
      ]}
    />
  );
}
