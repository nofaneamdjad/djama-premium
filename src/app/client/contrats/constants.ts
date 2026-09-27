import {
  Wrench, Monitor, Lock, Users, ShoppingCart, Cloud,
  Home, Briefcase, Calendar, FileText, File,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ContractType, ContractStatus, DraftForm } from "./types";

export const gold = "#c9a55a";
export const ease = [0.16, 1, 0.3, 1] as const;

export const CONTRACT_TYPES: { value: ContractType; label: string; icon: LucideIcon; desc: string }[] = [
  { value: "prestation", label: "Prestation",    icon: Wrench,       desc: "Mission, livrables" },
  { value: "freelance",  label: "Freelance",      icon: Monitor,      desc: "Indépendant, TJM" },
  { value: "nda",        label: "NDA",            icon: Lock,         desc: "Confidentialité" },
  { value: "partenariat",label: "Partenariat",    icon: Users,        desc: "Co-business" },
  { value: "vente",      label: "Vente",          icon: ShoppingCart, desc: "Biens, livraison" },
  { value: "saas",       label: "SaaS",           icon: Cloud,        desc: "Abonnement logiciel" },
  { value: "location",   label: "Location",       icon: Home,         desc: "Bien, loyer" },
  { value: "cdi",        label: "CDI",            icon: Briefcase,    desc: "Contrat permanent" },
  { value: "cdd",        label: "CDD",            icon: Calendar,     desc: "Contrat temporaire" },
  { value: "devis",      label: "Devis",          icon: FileText,     desc: "Bon de commande" },
  { value: "autre",      label: "Autre",          icon: File,         desc: "Personnalisé" },
];

export const TYPE_MAP: Record<ContractType, string> = Object.fromEntries(
  CONTRACT_TYPES.map((t) => [t.value, t.label])
) as Record<ContractType, string>;

export const STATUS_CFG: Record<ContractStatus, { label: string; text: string; bg: string; border: string }> = {
  brouillon:  { label: "Brouillon",   text: "text-white/40",    bg: "bg-white/[0.05]",    border: "border-white/10" },
  validation: { label: "Validation",  text: "text-yellow-400",  bg: "bg-yellow-500/10",   border: "border-yellow-500/20" },
  "envoyé":   { label: "Envoyé",      text: "text-sky-400",     bg: "bg-sky-500/10",      border: "border-sky-500/20" },
  vu:         { label: "Vu",          text: "text-purple-400",  bg: "bg-purple-500/10",   border: "border-purple-500/20" },
  "signé":    { label: "Signé",       text: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/20" },
  "refusé":   { label: "Refusé",      text: "text-red-400",     bg: "bg-red-500/10",      border: "border-red-500/20" },
  "expiré":   { label: "Expiré",      text: "text-orange-400",  bg: "bg-orange-500/10",   border: "border-orange-500/20" },
  actif:      { label: "Actif",       text: "text-emerald-300", bg: "bg-emerald-400/10",  border: "border-emerald-400/20" },
};

export const STATUS_FLOW: ContractStatus[] = ["brouillon", "validation", "envoyé", "vu", "signé", "actif"];

export const JURISDICTIONS = [
  "France", "Belgique", "Suisse", "Luxembourg", "Canada", "Maroc", "International",
  "Allemagne", "Autriche", "Espagne", "Italie", "Portugal", "Pays-Bas", "Pologne",
  "Suède", "Norvège", "Danemark", "Finlande", "Irlande", "Royaume-Uni", "Grèce",
  "Turquie", "Ukraine", "Russie", "République Tchèque", "Hongrie", "Roumanie",
  "Bulgarie", "Croatie", "Serbie", "Slovaquie", "Slovénie", "Lituanie", "Lettonie",
  "Estonie", "Chypre", "Malte", "Islande", "Albanie", "Macédoine du Nord",
  "Bosnie-Herzégovine", "Monténégro", "Kosovo", "Moldova", "Biélorussie",
  "Algérie", "Tunisie", "Égypte", "Sénégal", "Côte d'Ivoire", "Mali",
  "Burkina Faso", "Niger", "Guinée", "Cameroun", "Congo", "RD Congo",
  "Madagascar", "Mozambique", "Tanzanie", "Kenya", "Éthiopie", "Nigeria",
  "Ghana", "Afrique du Sud", "Angola", "Zambie", "Zimbabwe", "Namibie",
  "Botswana", "Rwanda", "Ouganda", "Tchad", "Soudan", "Libye",
  "Mauritanie", "Togo", "Bénin", "Gabon", "Centrafrique", "Djibouti",
  "Somalie", "Érythrée", "Malawi", "Lesotho", "Eswatini", "Burundi",
  "Guinée-Bissau", "Guinée équatoriale", "Comores", "Cap-Vert",
  "São Tomé-et-Príncipe", "Seychelles", "Maurice",
  "États-Unis", "Mexique", "Brésil", "Argentine", "Chili", "Colombie",
  "Pérou", "Venezuela", "Équateur", "Bolivie", "Paraguay", "Uruguay",
  "Cuba", "Haïti", "République Dominicaine", "Panama", "Costa Rica",
  "Guatemala", "Honduras", "Salvador", "Nicaragua", "Jamaïque",
  "Trinidad-et-Tobago", "Barbade", "Guyana", "Suriname",
  "Chine", "Japon", "Inde", "Corée du Sud", "Corée du Nord",
  "Indonésie", "Philippines", "Viêt Nam", "Thaïlande", "Malaisie",
  "Singapour", "Myanmar", "Cambodge", "Laos", "Bangladesh", "Pakistan",
  "Sri Lanka", "Népal", "Afghanistan", "Iran", "Irak", "Syrie",
  "Arabie Saoudite", "Émirats Arabes Unis", "Qatar", "Koweït",
  "Bahreïn", "Oman", "Yémen", "Jordanie", "Liban", "Israël",
  "Palestine", "Kazakhstan", "Ouzbékistan", "Turkménistan",
  "Kirghizistan", "Tadjikistan", "Azerbaïdjan", "Arménie", "Géorgie",
  "Mongolie", "Taïwan", "Hong Kong", "Macao",
  "Australie", "Nouvelle-Zélande", "Papouasie-Nouvelle-Guinée",
  "Fidji", "Samoa", "Tonga", "Vanuatu",
];

export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "MAD", "CAD"];

export const SUGGESTED_CLAUSES: Record<ContractType, string[]> = {
  prestation:  ["Acompte 30% à la signature", "Révisions illimitées incluses", "Propriété intellectuelle transférée", "Pénalités de retard 3%/mois", "Non-concurrence 6 mois"],
  freelance:   ["TJM avec dépassement 20% max", "Frais de déplacement remboursés", "Non-débauchage 12 mois", "Droit moral conservé", "Facturation bi-mensuelle"],
  nda:         ["Durée confidentialité 3 ans", "Pénalité €50 000 si violation", "Exclusions : informations publiques", "Restitution documents à la fin", "Étendue mondiale"],
  partenariat: ["Partage revenus 50/50", "Clause de rachat à prix fixé", "Droit de préemption", "Gouvernance deux voix égales", "Non-sollicitation employés"],
  vente:       ["Garantie légale de conformité", "Réserve propriété jusqu'au paiement", "Délai rétractation 14 jours", "Force majeure définie", "Livraison DAP Incoterms"],
  saas:        ["SLA 99.9% uptime", "Backup quotidien des données", "Portabilité données à résiliation", "Sous-traitants RGPD listés", "Limitation responsabilité x3 abonnement"],
  location:    ["Dépôt de garantie 2 mois", "État des lieux contradictoire", "Assurance locataire obligatoire", "Interdiction sous-location", "Révision annuelle IRL"],
  cdi:         ["Période d'essai 3 mois renouvelable", "Clause non-concurrence 1 an", "Télétravail 2 jours/semaine", "Plan épargne entreprise", "Voiture de fonction"],
  cdd:         ["Renouvellement possible 1 fois", "Indemnité fin de contrat 10%", "Formation incluse", "Clause de rupture anticipée", "Motif de recours précisé"],
  devis:       ["Validité devis 30 jours", "Acompte 30% à la commande", "Pénalités retard légales", "Clause révision prix", "Droit applicable : droit français"],
  autre:       ["Confidentialité mutuelle", "Résiliation avec préavis 30 jours", "Arbitrage avant recours judiciaire", "Force majeure incluse", "Droit applicable défini"],
};

export const EMPTY_FORM = (): DraftForm => ({
  title: "", client_name: "", client_email: "", client_company: "",
  type: "prestation", amount: "", currency: "EUR", duration_months: "12",
  start_date: "", end_date: "", jurisdiction: "France", language: "fr",
  specifics: "", selected_clauses: [], logo: "",
});
