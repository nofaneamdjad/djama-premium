"use client";

import ServicePageShell from "@/components/ServicePageShell";
import {
  FileText,
  CheckCircle2,
  Briefcase,
  Users,
  BookOpen,
  HelpCircle,
  Shield,
  Clock,
  Star,
  MessageSquare,
  CheckSquare,
  Monitor,
} from "lucide-react";

const COLOR = "#f59e0b";
const RGB = "245,158,11";

export default function CreationAutoEntrepreneurPage() {
  return (
    <ServicePageShell
      icon={Briefcase}
      color={COLOR}
      colorRGB={RGB}
      badge="Administratif · Auto-Entrepreneur"
      title={
        <>
          Créez votre auto-entreprise{" "}
          <span style={{ color: COLOR }}>sans stress</span>
        </>
      }
      subtitle="Accompagnement complet pour créer votre auto-entreprise : inscription, dossier, obligations — on gère tout."
      stats={[
        { value: "24h", label: "délai d'inscription" },
        { value: "100%", label: "en ligne" },
        { value: "0€", label: "frais de création" },
      ]}
      ctaHref="/contact"
      ctaLabel="Créer mon auto-entreprise"
      ctaSecHref="/contact"
      ctaSecLabel="Poser une question"
      featuresTitle="Ce qu'on fait pour vous"
      features={[
        {
          icon: FileText,
          color: COLOR,
          title: "Choix de l'activité",
          desc: "On vous aide à déterminer le bon code APE et le bon régime.",
        },
        {
          icon: CheckCircle2,
          color: COLOR,
          title: "Inscription en ligne",
          desc: "Accompagnement sur le portail INPI / autoentrepreneur.urssaf.fr.",
        },
        {
          icon: Briefcase,
          color: COLOR,
          title: "Préparation du dossier",
          desc: "Vérification et organisation de tous les documents requis.",
        },
        {
          icon: Users,
          color: COLOR,
          title: "Vérification des informations",
          desc: "On contrôle chaque champ avant soumission.",
        },
        {
          icon: BookOpen,
          color: COLOR,
          title: "Première déclaration",
          desc: "Guidage pour votre première déclaration de chiffre d'affaires.",
        },
        {
          icon: HelpCircle,
          color: COLOR,
          title: "Obligations légales",
          desc: "Explication claire de vos obligations : cotisations, TVA, seuils.",
        },
        {
          icon: Shield,
          color: COLOR,
          title: "Conseils démarrage",
          desc: "Ouvrir un compte pro, souscrire une assurance, émettre des factures.",
        },
        {
          icon: Clock,
          color: COLOR,
          title: "Support en cas de blocage",
          desc: "On répond à vos questions à chaque étape du processus.",
        },
      ]}
      processTitle="Création en 5 étapes simples"
      process={[
        {
          num: "01",
          icon: MessageSquare,
          color: COLOR,
          title: "Échange",
          desc: "Votre activité, vos objectifs, vos questions.",
          tag: "Jour 1",
        },
        {
          num: "02",
          icon: FileText,
          color: COLOR,
          title: "Dossier",
          desc: "Collecte et vérification de toutes vos informations.",
          tag: "Jour 1",
        },
        {
          num: "03",
          icon: CheckSquare,
          color: COLOR,
          title: "Inscription",
          desc: "Soumission du dossier sur le portail officiel.",
          tag: "Jour 1–2",
        },
        {
          num: "04",
          icon: Monitor,
          color: COLOR,
          title: "Confirmation",
          desc: "Réception du SIRET et activation du compte URSSAF.",
          tag: "Jour 2–7",
        },
        {
          num: "05",
          icon: Star,
          color: COLOR,
          title: "Démarrage",
          desc: "Premiers conseils pour lancer votre activité sereinement.",
          tag: "Jour 7+",
        },
      ]}
      pricingTitle="Un tarif unique, tout compris"
      plans={[
        {
          name: "Accompagnement création",
          price: "89€",
          unit: "paiement unique",
          desc: "Création complète de votre auto-entreprise",
          features: [
            "Aide au choix de l'activité",
            "Inscription sur le portail officiel",
            "Vérification du dossier",
            "Première déclaration CA",
            "Conseils obligations légales",
            "Support par message",
          ],
          hot: true,
        },
      ]}
    />
  );
}
