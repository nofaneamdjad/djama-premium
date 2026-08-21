/**
 * Données enrichies pour chaque application DJAMA.
 * Utilisées par /applications/[slug] (landing pages Odoo-style).
 */

import {
  ReceiptText, CreditCard, Wallet, BookMarked, Landmark, FileCheck2,
  Users, FileText, Truck, Package,
  ListTodo, Calendar, CalendarRange, Timer,
  StickyNote, CheckSquare, ScanLine, Network,
  Search, Zap, Share2, Brain, FolderOpen, Star,
  Building2, Banknote, BookOpen, MessageSquare, Target, Globe,
  CalendarPlus, QrCode, PenLine, ShoppingBag, ShoppingCart,
  Mail, Bot, BarChart2, Store, Contact2, Briefcase,
  TrendingUp, Clock, Shield, Sparkles, PlugZap, Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AppFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface AppCrossSell {
  slug: string;
  label: string;
  teaser: string;
}

export interface AppDetail {
  slug: string;
  label: string;
  category: string;
  color: string;
  bg: string;
  icon: LucideIcon;
  clientHref: string;
  hero: {
    title: string;
    subtitle: string;
  };
  valueProposition: string;
  features: AppFeature[];
  crossSell?: AppCrossSell;
}

export const APPS_DATA: AppDetail[] = [
  /* ─── FINANCE ─────────────────────────────────────────── */
  {
    slug: "factures",
    label: "Factures & Devis",
    category: "Finance",
    color: "#2563eb",
    bg: "#dbeafe",
    icon: ReceiptText,
    clientHref: "/client/factures",
    hero: {
      title: "La facturation professionnelle en toute simplicité",
      subtitle: "Créez, envoyez et suivez vos factures et devis en quelques secondes. Relances automatiques, paiements en ligne, zéro paperasse.",
    },
    valueProposition: "Envoyez des factures illimitées, suivez chaque paiement en temps réel et automatisez vos relances — tout depuis un seul écran.",
    features: [
      { title: "Devis en 30 secondes", description: "Générez un devis professionnel en quelques clics et convertissez-le en facture d'un seul geste.", icon: ReceiptText },
      { title: "Paiement en ligne", description: "Intégrez des liens de paiement directement dans vos factures pour être payé plus rapidement.", icon: QrCode },
      { title: "Relances automatiques", description: "L'IA envoie des rappels polis à vos clients en retard, sans que vous ayez à intervenir.", icon: Zap },
      { title: "Suivi en temps réel", description: "Visualisez l'état de chaque facture — envoyée, vue, payée, en retard — depuis votre tableau de bord.", icon: BarChart2 },
    ],
    crossSell: { slug: "tresorerie", label: "Trésorerie", teaser: "Vous cherchez à visualiser votre cash-flow en temps réel ?" },
  },
  {
    slug: "depenses",
    label: "Dépenses",
    category: "Finance",
    color: "#ea580c",
    bg: "#ffedd5",
    icon: CreditCard,
    clientHref: "/client/depenses",
    hero: {
      title: "Gérez vos dépenses sans effort",
      subtitle: "Scannez vos reçus, catégorisez vos charges et préparez vos notes de frais en quelques secondes grâce à l'IA.",
    },
    valueProposition: "Plus jamais de reçus perdus ni de notes de frais fastidieuses. L'IA reconnaît et catégorise vos dépenses automatiquement.",
    features: [
      { title: "Scan intelligent", description: "Prenez une photo de votre reçu, l'IA extrait montant, date, fournisseur et catégorie.", icon: ScanLine },
      { title: "Catégorisation auto", description: "Vos dépenses sont classées automatiquement selon votre plan comptable.", icon: Layers },
      { title: "Notes de frais", description: "Compilez et soumettez vos notes de frais en un clic, au format PDF ou Excel.", icon: FileText },
      { title: "Tableaux de bord", description: "Visualisez vos postes de dépenses, identifiez les tendances et réduisez les coûts inutiles.", icon: BarChart2 },
    ],
    crossSell: { slug: "comptabilite", label: "Comptabilité", teaser: "Vous cherchez à synchroniser vos dépenses avec votre comptabilité ?" },
  },
  {
    slug: "tresorerie",
    label: "Trésorerie",
    category: "Finance",
    color: "#059669",
    bg: "#d1fae5",
    icon: Wallet,
    clientHref: "/client/tresorerie",
    hero: {
      title: "Pilotez votre trésorerie en temps réel",
      subtitle: "Anticipez vos flux de liquidités, évitez les découverts et prenez des décisions éclairées grâce à des prévisions IA.",
    },
    valueProposition: "Visualisez votre solde disponible, vos encaissements et décaissements à venir — avec des alertes intelligentes avant chaque tension de trésorerie.",
    features: [
      { title: "Cash-flow prévisionnel", description: "L'IA prédit votre solde sur 30, 60 et 90 jours à partir de vos données historiques.", icon: TrendingUp },
      { title: "Flux consolidés", description: "Centralisez tous vos comptes bancaires et suivez vos flux entrants et sortants en un seul endroit.", icon: Landmark },
      { title: "Alertes intelligentes", description: "Recevez une notification dès qu'un risque de découvert est détecté.", icon: Zap },
      { title: "Tableaux de bord", description: "Des graphiques clairs pour piloter votre trésorerie sans être comptable.", icon: BarChart2 },
    ],
    crossSell: { slug: "banque", label: "Connexion bancaire", teaser: "Vous cherchez à synchroniser votre banque automatiquement ?" },
  },
  {
    slug: "comptabilite",
    label: "Comptabilité",
    category: "Finance",
    color: "#0891b2",
    bg: "#e0f2fe",
    icon: BookMarked,
    clientHref: "/client/comptabilite",
    hero: {
      title: "La comptabilité, enfin accessible à tous",
      subtitle: "Journal comptable, bilan, TVA et clôtures — assistés par l'IA pour que vous vous concentriez sur votre cœur de métier.",
    },
    valueProposition: "Gérez votre comptabilité vous-même ou collaborez avec votre expert-comptable, tout en restant conforme à la réglementation française.",
    features: [
      { title: "Journal automatisé", description: "Vos achats, ventes et banques s'enregistrent automatiquement dans le bon compte.", icon: BookMarked },
      { title: "Déclaration TVA", description: "Calculez et exportez votre TVA mensuelle ou trimestrielle en un clic.", icon: FileCheck2 },
      { title: "Bilan & P&L", description: "Consultez votre bilan et compte de résultat en temps réel, sans attendre la fin d'exercice.", icon: BarChart2 },
      { title: "Accès expert-comptable", description: "Partagez l'accès avec votre expert-comptable pour une collaboration fluide.", icon: Users },
    ],
    crossSell: { slug: "declarations", label: "Déclarations", teaser: "Vous cherchez à gérer vos obligations fiscales URSSAF et TVA ?" },
  },
  {
    slug: "banque",
    label: "Connexion bancaire",
    category: "Finance",
    color: "#0369a1",
    bg: "#dbeafe",
    icon: Landmark,
    clientHref: "/client/banque",
    hero: {
      title: "Votre banque connectée à votre business",
      subtitle: "Synchronisez vos comptes bancaires automatiquement et réconciliez vos transactions sans effort.",
    },
    valueProposition: "Fini le copier-coller de relevés bancaires. Vos mouvements s'importent et se classifient en temps réel.",
    features: [
      { title: "Sync automatique", description: "Connectez vos comptes bancaires en quelques secondes grâce à nos partenaires agréés.", icon: Zap },
      { title: "Rapprochement intelligent", description: "L'IA associe chaque transaction bancaire à la bonne facture ou dépense.", icon: CheckSquare },
      { title: "Multi-comptes", description: "Gérez plusieurs comptes bancaires et entités depuis un seul tableau de bord.", icon: Layers },
      { title: "Historique complet", description: "Retrouvez l'intégralité de vos mouvements classifiés et exportables.", icon: Clock },
    ],
    crossSell: { slug: "tresorerie", label: "Trésorerie", teaser: "Vous cherchez à anticiper vos flux de liquidités ?" },
  },
  {
    slug: "declarations",
    label: "Déclarations",
    category: "Finance",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: FileCheck2,
    clientHref: "/client/declarations",
    hero: {
      title: "Vos déclarations fiscales sans stress",
      subtitle: "TVA, URSSAF, IS — préparez et exportez vos obligations fiscales en quelques clics, toujours dans les délais.",
    },
    valueProposition: "Plus aucune pénalité de retard. DJAMA vous rappelle vos échéances et prépare vos déclarations automatiquement.",
    features: [
      { title: "Calendrier fiscal", description: "Toutes vos échéances fiscales dans un calendrier clair avec des rappels automatiques.", icon: Calendar },
      { title: "TVA automatisée", description: "Votre déclaration de TVA est pré-remplie à partir de vos factures et achats.", icon: FileCheck2 },
      { title: "Export URSSAF", description: "Exportez les données nécessaires à vos déclarations sociales en un clic.", icon: Building2 },
      { title: "Conformité garantie", description: "Mise à jour automatique selon les évolutions réglementaires françaises.", icon: Shield },
    ],
    crossSell: { slug: "comptabilite", label: "Comptabilité", teaser: "Vous cherchez à centraliser toute votre comptabilité ?" },
  },

  /* ─── COMMERCIAL ──────────────────────────────────────── */
  {
    slug: "crm",
    label: "CRM Clients",
    category: "Commercial",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: Users,
    clientHref: "/client/crm",
    hero: {
      title: "Développez vos ventes avec un CRM IA",
      subtitle: "Gérez vos contacts, suivez votre pipeline et automatisez vos relances commerciales pour ne plus jamais laisser filer un prospect.",
    },
    valueProposition: "Visualisez chaque opportunité dans votre pipeline, recevez des suggestions de relance IA et closez plus vite.",
    features: [
      { title: "Pipeline visuel", description: "Glissez-déposez vos prospects d'une étape à l'autre dans un pipeline Kanban intuitif.", icon: Layers },
      { title: "Relances IA", description: "L'assistant IA rédige des emails de relance personnalisés pour chaque prospect.", icon: Zap },
      { title: "Historique complet", description: "Toutes les interactions avec chaque contact centralisées en un seul endroit.", icon: Clock },
      { title: "Rapports de vente", description: "Analysez vos performances commerciales avec des tableaux de bord automatisés.", icon: BarChart2 },
    ],
    crossSell: { slug: "factures", label: "Factures & Devis", teaser: "Vous cherchez à facturer vos clients directement depuis le CRM ?" },
  },
  {
    slug: "contrats",
    label: "Contrats",
    category: "Commercial",
    color: "#b45309",
    bg: "#fef3c7",
    icon: FileText,
    clientHref: "/client/contrats",
    hero: {
      title: "Vos contrats rédigés et signés en ligne",
      subtitle: "Créez des contrats professionnels depuis vos modèles, collectez les signatures électroniques et archivez tout automatiquement.",
    },
    valueProposition: "Réduisez le délai de signature de 10 jours à quelques heures grâce aux contrats numériques et à la signature électronique.",
    features: [
      { title: "Modèles intelligents", description: "Partez de modèles pré-rédigés et personnalisez-les en quelques minutes.", icon: FileText },
      { title: "Signature électronique", description: "Envoyez vos contrats à signer en ligne, avec valeur juridique reconnue.", icon: PenLine },
      { title: "Suivi en temps réel", description: "Sachez exactement où en est chaque contrat dans le processus de signature.", icon: TrendingUp },
      { title: "Archivage automatique", description: "Tous vos contrats signés sont archivés de façon sécurisée et retrouvables.", icon: Shield },
    ],
    crossSell: { slug: "crm", label: "CRM Clients", teaser: "Vous cherchez à relier vos contrats à votre pipeline commercial ?" },
  },
  {
    slug: "fournisseurs",
    label: "Fournisseurs",
    category: "Commercial",
    color: "#166534",
    bg: "#dcfce7",
    icon: Truck,
    clientHref: "/client/fournisseurs",
    hero: {
      title: "Gérez vos fournisseurs intelligemment",
      subtitle: "Centralisez votre catalogue fournisseurs, comparez les offres et optimisez vos achats grâce à l'analyse IA.",
    },
    valueProposition: "Trouvez les meilleurs fournisseurs, négociez de meilleures conditions et suivez vos commandes depuis un seul espace.",
    features: [
      { title: "Catalogue fournisseurs", description: "Centralisez tous vos fournisseurs avec leurs tarifs, délais et conditions.", icon: Package },
      { title: "Comparaison offres", description: "Comparez automatiquement les devis reçus et identifiez la meilleure offre.", icon: BarChart2 },
      { title: "Commandes", description: "Passez et suivez vos commandes fournisseurs directement depuis la plateforme.", icon: Truck },
      { title: "Évaluation", description: "Notez et évaluez vos fournisseurs pour prendre de meilleures décisions d'achat.", icon: Star },
    ],
    crossSell: { slug: "stocks", label: "Stocks", teaser: "Vous cherchez à lier vos achats fournisseurs à votre inventaire ?" },
  },
  {
    slug: "stocks",
    label: "Stocks",
    category: "Commercial",
    color: "#0d9488",
    bg: "#ccfbf1",
    icon: Package,
    clientHref: "/client/stocks",
    hero: {
      title: "Votre inventaire sous contrôle en temps réel",
      subtitle: "Suivez vos niveaux de stock, recevez des alertes de réapprovisionnement et évitez les ruptures grâce à l'IA prédictive.",
    },
    valueProposition: "Optimisez votre stock et évitez à la fois les ruptures et les sur-stocks grâce à des prévisions basées sur vos historiques de vente.",
    features: [
      { title: "Inventaire en temps réel", description: "Visualisez vos niveaux de stock par produit, entrepôt ou emplacement.", icon: Package },
      { title: "Alertes automatiques", description: "Recevez une alerte dès qu'un article passe sous votre seuil minimum.", icon: Zap },
      { title: "Prévisions IA", description: "L'IA anticipe vos besoins de réapprovisionnement selon vos ventes passées.", icon: TrendingUp },
      { title: "Mouvements de stock", description: "Tracez chaque entrée et sortie avec son motif, sa date et son opérateur.", icon: Layers },
    ],
    crossSell: { slug: "fournisseurs", label: "Fournisseurs", teaser: "Vous cherchez à automatiser vos commandes fournisseurs ?" },
  },

  /* ─── OPÉRATIONS ──────────────────────────────────────── */
  {
    slug: "productivite",
    label: "Tâches",
    category: "Opérations",
    color: "#be185d",
    bg: "#fce7f3",
    icon: ListTodo,
    clientHref: "/client/productivite",
    hero: {
      title: "Organisez votre travail, accomplissez plus",
      subtitle: "To-do lists, projets, priorités et suivi d'avancement — tout au même endroit, enrichi par l'IA pour que vous n'oubliez jamais rien.",
    },
    valueProposition: "Transformez vos idées en actions concrètes. L'IA suggère des priorités et vous rappelle ce qui compte vraiment.",
    features: [
      { title: "To-do intelligente", description: "Créez des tâches rapidement et laissez l'IA les prioriser selon leur urgence et importance.", icon: ListTodo },
      { title: "Vue Kanban & Liste", description: "Basculez entre une vue liste classique et un tableau Kanban selon votre préférence.", icon: Layers },
      { title: "Sous-tâches", description: "Décomposez vos grandes tâches en étapes actionnables et suivez la progression.", icon: CheckSquare },
      { title: "Rappels & notifications", description: "Ne manquez plus aucune deadline grâce aux rappels automatiques.", icon: Zap },
    ],
    crossSell: { slug: "planning", label: "Planning", teaser: "Vous cherchez à planifier vos tâches dans un agenda ?" },
  },
  {
    slug: "planning",
    label: "Planning",
    category: "Opérations",
    color: "#4f46e5",
    bg: "#e0e7ff",
    icon: Calendar,
    clientHref: "/client/planning",
    hero: {
      title: "Planifiez, réservez, ne manquez plus rien",
      subtitle: "Un agenda professionnel connecté avec prise de rendez-vous en ligne, synchronisation Google Calendar et rappels automatiques.",
    },
    valueProposition: "Vos clients réservent directement en ligne, vous recevez une confirmation automatique — plus aucune double réservation.",
    features: [
      { title: "Agenda professionnel", description: "Gérez votre emploi du temps personnel et professionnel dans un seul agenda.", icon: Calendar },
      { title: "Réservation en ligne", description: "Partagez votre lien de prise de RDV et laissez vos clients choisir leur créneau.", icon: CalendarPlus },
      { title: "Rappels automatiques", description: "Réduisez les no-shows avec des rappels SMS et email automatiques.", icon: Zap },
      { title: "Sync calendriers", description: "Synchronisez avec Google Calendar, Outlook et Apple Calendar.", icon: Layers },
    ],
    crossSell: { slug: "rendez-vous", label: "Rendez-vous", teaser: "Vous cherchez à monétiser vos créneaux de consultation ?" },
  },
  {
    slug: "equipe",
    label: "Équipe",
    category: "Opérations",
    color: "#0891b2",
    bg: "#cffafe",
    icon: CalendarRange,
    clientHref: "/client/equipe",
    hero: {
      title: "Planifiez et managez votre équipe efficacement",
      subtitle: "Plannings d'équipe, gestion des absences et suivi du temps — tout ce dont vous avez besoin pour manager vos collaborateurs.",
    },
    valueProposition: "Créez des plannings en quelques minutes, gérez les congés et suivez la disponibilité de chaque membre de votre équipe.",
    features: [
      { title: "Planning d'équipe", description: "Visualisez les plannings de tous vos collaborateurs sur une vue semaine ou mois.", icon: CalendarRange },
      { title: "Gestion des absences", description: "Approuvez les demandes de congés et gérez les absences directement depuis l'app.", icon: Calendar },
      { title: "Alertes de disponibilité", description: "Soyez alerté en cas de conflit ou de sous-effectif sur un créneau.", icon: Zap },
      { title: "Export planning", description: "Exportez les plannings en PDF ou partagez-les avec votre équipe.", icon: FileText },
    ],
    crossSell: { slug: "paie", label: "Paie & RH", teaser: "Vous cherchez à automatiser vos fiches de paie ?" },
  },
  {
    slug: "chrono",
    label: "Chrono",
    category: "Opérations",
    color: "#7c3aed",
    bg: "#f3e8ff",
    icon: Timer,
    clientHref: "/client/chrono",
    hero: {
      title: "Tracez votre temps, facturez ce que vous méritez",
      subtitle: "Suivez le temps passé par projet et par client, puis facturez automatiquement sur la base de vos heures enregistrées.",
    },
    valueProposition: "Ne perdez plus une seule heure facturable. Le time tracking automatique capture votre temps en arrière-plan.",
    features: [
      { title: "Chronomètre en 1 clic", description: "Lancez et arrêtez le tracking en un clic, depuis n'importe quel appareil.", icon: Timer },
      { title: "Par projet & client", description: "Associez chaque session de travail à un projet et un client spécifique.", icon: Layers },
      { title: "Rapports détaillés", description: "Analysez comment vous distribuez votre temps entre vos différents projets.", icon: BarChart2 },
      { title: "Facturation auto", description: "Générez automatiquement des factures basées sur les heures enregistrées.", icon: ReceiptText },
    ],
    crossSell: { slug: "factures", label: "Factures & Devis", teaser: "Vous cherchez à facturer vos heures directement ?" },
  },

  /* ─── NOTES ───────────────────────────────────────────── */
  {
    slug: "bloc-notes",
    label: "Notes",
    category: "Notes",
    color: "#92400e",
    bg: "#fef9c3",
    icon: StickyNote,
    clientHref: "/client/bloc-notes",
    hero: {
      title: "Capturez toutes vos idées, n'en perdez aucune",
      subtitle: "Notes texte, vocales et canvas enrichis par l'IA — organisés en cahiers, accessibles partout et toujours retrouvables.",
    },
    valueProposition: "Dictez une note vocale, l'IA la transcrit, la résume et la classe automatiquement dans le bon cahier.",
    features: [
      { title: "Notes vocales IA", description: "Enregistrez votre voix, l'IA transcrit et résume le contenu automatiquement.", icon: Zap },
      { title: "Cahiers organisés", description: "Regroupez vos notes dans des cahiers thématiques pour une recherche facile.", icon: BookOpen },
      { title: "Canvas visuel", description: "Créez des tableaux blancs visuels pour brainstormer et organiser vos idées.", icon: Network },
      { title: "Recherche intelligente", description: "Retrouvez n'importe quelle note en quelques mots grâce à la recherche sémantique IA.", icon: Search },
    ],
    crossSell: { slug: "mindmap", label: "Mind Map", teaser: "Vous cherchez à structurer vos idées en carte mentale ?" },
  },
  {
    slug: "checklists",
    label: "Checklists",
    category: "Notes",
    color: "#10b981",
    bg: "#d1fae5",
    icon: CheckSquare,
    clientHref: "/client/checklists",
    hero: {
      title: "Des checklists professionnelles pour ne rien oublier",
      subtitle: "Créez des listes de vérification réutilisables pour vos processus récurrents — onboarding, livraison, contrôle qualité.",
    },
    valueProposition: "Standardisez vos processus avec des checklists partagées et assurez-vous que chaque étape critique est toujours validée.",
    features: [
      { title: "Modèles réutilisables", description: "Créez des modèles de checklist que vous réutilisez pour chaque projet ou client.", icon: Layers },
      { title: "Assignation", description: "Assignez des étapes à des membres de votre équipe pour un suivi collaboratif.", icon: Users },
      { title: "Progression", description: "Suivez la progression de chaque checklist en pourcentage d'avancement.", icon: TrendingUp },
      { title: "Rappels", description: "Recevez des rappels automatiques pour les étapes non complétées.", icon: Zap },
    ],
    crossSell: { slug: "productivite", label: "Tâches", teaser: "Vous cherchez à transformer vos checklists en tâches assignables ?" },
  },
  {
    slug: "scanner",
    label: "Scanner",
    category: "Notes",
    color: "#0ea5e9",
    bg: "#e0f2fe",
    icon: ScanLine,
    clientHref: "/client/scanner",
    hero: {
      title: "Numérisez et archivez vos documents en un instant",
      subtitle: "Scannez n'importe quel document depuis votre téléphone, l'IA en extrait le texte et le classe automatiquement.",
    },
    valueProposition: "Dites adieu aux piles de papier. Chaque document scanné est automatiquement indexé et retrouvable en quelques mots.",
    features: [
      { title: "Scan mobile", description: "Utilisez l'appareil photo de votre téléphone comme un scanner professionnel.", icon: ScanLine },
      { title: "OCR intelligent", description: "L'IA extrait le texte de vos documents pour les rendre recherchables.", icon: Brain },
      { title: "Archivage automatique", description: "Vos documents sont classés automatiquement par type, date et catégorie.", icon: Layers },
      { title: "Partage sécurisé", description: "Partagez vos documents scannés de façon sécurisée avec vos collaborateurs.", icon: Shield },
    ],
    crossSell: { slug: "bloc-notes", label: "Notes", teaser: "Vous cherchez à annoter vos documents scannés ?" },
  },
  {
    slug: "mindmap",
    label: "Mind Map",
    category: "Notes",
    color: "#8b5cf6",
    bg: "#ede9fe",
    icon: Network,
    clientHref: "/client/mindmap",
    hero: {
      title: "Pensez visuellement, structurez plus clairement",
      subtitle: "Créez des cartes mentales interactives pour brainstormer, planifier et présenter vos idées de façon claire et engageante.",
    },
    valueProposition: "Partez d'une idée centrale et laissez votre carte mentale grandir naturellement — l'IA peut même suggérer des branches connexes.",
    features: [
      { title: "Création rapide", description: "Ajoutez des nœuds en quelques secondes grâce aux raccourcis clavier.", icon: Zap },
      { title: "Suggestions IA", description: "L'IA suggère des idées connexes pour enrichir votre carte mentale.", icon: Sparkles },
      { title: "Export multi-formats", description: "Exportez votre mind map en image, PDF ou présentation PowerPoint.", icon: FileText },
      { title: "Collaboration", description: "Brainstormez en équipe sur la même carte en temps réel.", icon: Users },
    ],
    crossSell: { slug: "bloc-notes", label: "Notes", teaser: "Vous cherchez à prendre des notes liées à vos cartes mentales ?" },
  },

  /* ─── INTELLIGENCE ────────────────────────────────────── */
  {
    slug: "sourcing",
    label: "Sourcing IA",
    category: "Intelligence",
    color: "#6d28d9",
    bg: "#ede9fe",
    icon: Search,
    clientHref: "/client/sourcing",
    hero: {
      title: "Trouvez vos clients et partenaires grâce à l'IA",
      subtitle: "L'IA analyse des milliers de sources pour identifier des prospects qualifiés et des partenaires stratégiques pour votre activité.",
    },
    valueProposition: "Arrêtez de chercher vos clients manuellement. L'IA cible les profils les plus susceptibles de devenir vos meilleurs clients.",
    features: [
      { title: "Recherche IA", description: "Décrivez votre client idéal, l'IA vous propose une liste de prospects ciblés.", icon: Search },
      { title: "Analyse appels d'offres", description: "Identifiez les appels d'offres correspondant à votre domaine d'expertise.", icon: FileText },
      { title: "Profils enrichis", description: "Accédez à des fiches prospects enrichies avec infos légales et contacts.", icon: Users },
      { title: "Export CRM", description: "Exportez directement vos prospects dans votre CRM DJAMA.", icon: Zap },
    ],
    crossSell: { slug: "crm", label: "CRM Clients", teaser: "Vous cherchez à gérer vos prospects dans un pipeline ?" },
  },
  {
    slug: "assistant",
    label: "Assistant IA",
    category: "Intelligence",
    color: "#0369a1",
    bg: "#e8f4fd",
    icon: Zap,
    clientHref: "/client/assistant",
    hero: {
      title: "Votre assistant IA disponible 24h/24",
      subtitle: "Rédigez des emails, des rapports, des relances et des contenus professionnels en quelques secondes grâce à l'IA générative.",
    },
    valueProposition: "Multipliez votre productivité par 5. L'assistant IA rédige, résume, traduit et répond à votre place.",
    features: [
      { title: "Rédaction IA", description: "Générez des emails, propositions, rapports et contenus en quelques secondes.", icon: Sparkles },
      { title: "Relances automatiques", description: "L'IA rédige des emails de relance personnalisés pour chaque client.", icon: Zap },
      { title: "Résumés", description: "Résumez en quelques lignes n'importe quel document, email ou réunion.", icon: Brain },
      { title: "Multi-langues", description: "Rédigez et traduisez vos contenus dans plus de 30 langues.", icon: Globe },
    ],
    crossSell: { slug: "blog", label: "Blog", teaser: "Vous cherchez à générer des articles de blog avec l'IA ?" },
  },
  {
    slug: "projets",
    label: "Projets",
    category: "Intelligence",
    color: "#d97706",
    bg: "#fff3e0",
    icon: FolderOpen,
    clientHref: "/client/projets",
    hero: {
      title: "Pilotez vos projets de A à Z",
      subtitle: "Planification, ressources, budget et suivi d'avancement — tout en un pour livrer vos projets dans les délais et dans le budget.",
    },
    valueProposition: "Visualisez l'avancement de chaque projet en temps réel et anticipez les retards avant qu'ils n'impactent vos clients.",
    features: [
      { title: "Gantt & Kanban", description: "Planifiez vos projets avec un diagramme de Gantt ou un tableau Kanban.", icon: Layers },
      { title: "Gestion budget", description: "Suivez les dépenses de chaque projet et alertez dès qu'un dépassement approche.", icon: Wallet },
      { title: "Ressources", description: "Assignez les tâches en tenant compte des disponibilités de votre équipe.", icon: Users },
      { title: "Rapports clients", description: "Générez des rapports d'avancement professionnels pour vos clients.", icon: FileText },
    ],
    crossSell: { slug: "chrono", label: "Chrono", teaser: "Vous cherchez à tracker le temps passé par projet ?" },
  },
  {
    slug: "reseaux-sociaux",
    label: "Réseaux Sociaux IA",
    category: "Intelligence",
    color: "#e1306c",
    bg: "#fce7f3",
    icon: Share2,
    clientHref: "/client/reseaux-sociaux",
    hero: {
      title: "Publiez du contenu de qualité sans effort",
      subtitle: "L'IA génère, planifie et publie vos posts sur tous vos réseaux sociaux — Instagram, LinkedIn, Facebook et plus encore.",
    },
    valueProposition: "Publiez 5× plus de contenu en 5× moins de temps. L'IA adapte le ton et le format de chaque post à chaque réseau.",
    features: [
      { title: "Génération IA", description: "Décrivez votre sujet, l'IA rédige plusieurs variantes de posts prêts à publier.", icon: Sparkles },
      { title: "Planification", description: "Planifiez vos posts à l'avance sur un calendrier éditorial visuel.", icon: Calendar },
      { title: "Multi-plateformes", description: "Publiez simultanément sur Instagram, LinkedIn, Facebook et Twitter.", icon: Share2 },
      { title: "Analytics", description: "Suivez l'engagement de vos posts et identifiez vos meilleurs contenus.", icon: BarChart2 },
    ],
    crossSell: { slug: "blog", label: "Blog", teaser: "Vous cherchez à transformer vos articles de blog en posts sociaux ?" },
  },
  {
    slug: "coaching-ia",
    label: "Coaching IA",
    category: "Intelligence",
    color: "#9d174d",
    bg: "#faf0ff",
    icon: Brain,
    clientHref: "/coaching-ia/espace",
    hero: {
      title: "Montez en compétences avec votre coach IA",
      subtitle: "Des parcours de formation personnalisés, des exercices pratiques et un coach IA disponible 24h/24 pour accélérer votre croissance.",
    },
    valueProposition: "Bénéficiez d'un accompagnement sur mesure adapté à votre niveau, vos objectifs et votre secteur d'activité.",
    features: [
      { title: "Parcours personnalisés", description: "L'IA crée un plan de formation adapté à vos objectifs et votre niveau actuel.", icon: Target },
      { title: "Coach disponible 24h/24", description: "Posez vos questions à votre coach IA à n'importe quelle heure.", icon: Brain },
      { title: "Exercices pratiques", description: "Apprenez en faisant avec des exercices directement liés à votre activité.", icon: CheckSquare },
      { title: "Progression suivie", description: "Visualisez votre progression et vos acquis au fil des semaines.", icon: TrendingUp },
    ],
    crossSell: { slug: "assistant", label: "Assistant IA", teaser: "Vous cherchez à appliquer vos apprentissages avec un assistant IA ?" },
  },

  /* ─── VENTES ──────────────────────────────────────────── */
  {
    slug: "rendez-vous",
    label: "Rendez-vous",
    category: "Ventes",
    color: "#0891b2",
    bg: "#e0f2fe",
    icon: CalendarPlus,
    clientHref: "/client/rendez-vous",
    hero: {
      title: "Laissez vos clients réserver eux-mêmes",
      subtitle: "Un lien de réservation personnalisé, des créneaux disponibles en temps réel, des confirmations et rappels automatiques.",
    },
    valueProposition: "Réduisez le va-et-vient d'emails pour planifier un rendez-vous. Vos clients choisissent leur créneau en 30 secondes.",
    features: [
      { title: "Lien de réservation", description: "Partagez votre lien de prise de RDV par email, SMS ou WhatsApp.", icon: QrCode },
      { title: "Créneaux automatiques", description: "Vos disponibilités sont calculées automatiquement selon votre agenda.", icon: Calendar },
      { title: "Types de RDV", description: "Créez différents types de rendez-vous avec des durées et tarifs distincts.", icon: Layers },
      { title: "Visio intégrée", description: "Proposez des rendez-vous en visioconférence avec lien automatique.", icon: Globe },
    ],
    crossSell: { slug: "paiements", label: "Liens de paiement", teaser: "Vous cherchez à faire payer vos clients au moment de la réservation ?" },
  },
  {
    slug: "paiements",
    label: "Liens de paiement",
    category: "Ventes",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: QrCode,
    clientHref: "/client/paiements",
    hero: {
      title: "Encaissez où que vous soyez",
      subtitle: "Créez des liens de paiement en quelques secondes et encaissez par carte bancaire, virement ou PayPal.",
    },
    valueProposition: "Soyez payé immédiatement, sans terminal physique. Partagez un lien et votre client paie en 30 secondes.",
    features: [
      { title: "Lien en 1 clic", description: "Créez un lien de paiement sécurisé en quelques secondes.", icon: QrCode },
      { title: "Multi-modes", description: "Acceptez CB, virement, Apple Pay, Google Pay et PayPal.", icon: CreditCard },
      { title: "QR Code", description: "Générez un QR code à afficher en boutique pour des paiements instantanés.", icon: QrCode },
      { title: "Suivi encaissements", description: "Toutes vos transactions centralisées avec export comptable.", icon: BarChart2 },
    ],
    crossSell: { slug: "factures", label: "Factures & Devis", teaser: "Vous cherchez à intégrer le paiement dans vos factures ?" },
  },
  {
    slug: "signature",
    label: "Signature électronique",
    category: "Ventes",
    color: "#059669",
    bg: "#d1fae5",
    icon: PenLine,
    clientHref: "/client/signature",
    hero: {
      title: "Signez vos documents en ligne en toute légalité",
      subtitle: "Envoyez vos contrats, devis et accords à signer électroniquement — avec valeur juridique et archivage sécurisé.",
    },
    valueProposition: "Vos clients signent depuis leur téléphone en quelques secondes. La signature électronique DJAMA a valeur légale en France et en Europe.",
    features: [
      { title: "Envoi instantané", description: "Envoyez votre document à signer par email en quelques clics.", icon: Mail },
      { title: "Signature mobile", description: "Vos clients signent depuis n'importe quel appareil sans créer de compte.", icon: PenLine },
      { title: "Valeur juridique", description: "Nos signatures respectent le règlement eIDAS et ont valeur légale en UE.", icon: Shield },
      { title: "Archivage sécurisé", description: "Chaque document signé est archivé avec horodatage et certificat.", icon: Clock },
    ],
    crossSell: { slug: "contrats", label: "Contrats", teaser: "Vous cherchez à créer vos contrats depuis des modèles ?" },
  },
  {
    slug: "boutique",
    label: "Boutique en ligne",
    category: "Ventes",
    color: "#ec4899",
    bg: "#fce7f3",
    icon: ShoppingBag,
    clientHref: "/client/boutique",
    hero: {
      title: "Vendez en ligne dès aujourd'hui",
      subtitle: "Créez votre boutique en ligne, gérez votre catalogue et commencez à vendre — sans aucune compétence technique requise.",
    },
    valueProposition: "Votre boutique en ligne opérationnelle en moins d'une heure. L'IA génère même vos descriptions de produits.",
    features: [
      { title: "Catalogue produits", description: "Ajoutez vos produits avec photos, descriptions et variantes.", icon: Package },
      { title: "Descriptions IA", description: "L'IA génère des descriptions de produits SEO-optimisées automatiquement.", icon: Sparkles },
      { title: "Paiement sécurisé", description: "Acceptez les paiements par carte, PayPal et paiement différé.", icon: CreditCard },
      { title: "Gestion commandes", description: "Suivez et traitez vos commandes depuis un tableau de bord centralisé.", icon: ShoppingCart },
    ],
    crossSell: { slug: "caisse", label: "Caisse / POS", teaser: "Vous cherchez aussi à vendre en physique ?" },
  },
  {
    slug: "caisse",
    label: "Caisse / POS",
    category: "Ventes",
    color: "#0d9488",
    bg: "#ccfbf1",
    icon: ShoppingCart,
    clientHref: "/client/caisse",
    hero: {
      title: "Votre caisse enregistreuse dans votre poche",
      subtitle: "Encaissez en boutique ou sur les marchés depuis votre tablette ou smartphone — sans matériel coûteux.",
    },
    valueProposition: "Un terminal de vente complet sur votre iPad ou téléphone. Gérez vos ventes, stocks et encaissements depuis n'importe où.",
    features: [
      { title: "Interface tactile", description: "Une interface intuitive optimisée pour tablette et smartphone.", icon: PlugZap },
      { title: "Multi-modes paiement", description: "Acceptez espèces, carte, QR code et virement instantané.", icon: CreditCard },
      { title: "Mode hors-ligne", description: "Continuez à encaisser même sans connexion internet.", icon: Shield },
      { title: "Tickets de caisse", description: "Imprimez ou envoyez les tickets par email ou SMS automatiquement.", icon: ReceiptText },
    ],
    crossSell: { slug: "boutique", label: "Boutique en ligne", teaser: "Vous cherchez à synchroniser ventes physiques et en ligne ?" },
  },

  /* ─── DIGITAL ─────────────────────────────────────────── */
  {
    slug: "email-marketing",
    label: "Email Marketing",
    category: "Digital",
    color: "#e1306c",
    bg: "#fce7f3",
    icon: Mail,
    clientHref: "/client/email-marketing",
    hero: {
      title: "Des campagnes email qui convertissent",
      subtitle: "Créez, envoyez et analysez vos campagnes email professionnelles — avec des templates IA et une délivrabilité optimisée.",
    },
    valueProposition: "Multipliez vos conversions avec des emails personnalisés. L'IA optimise l'objet, le contenu et l'heure d'envoi pour maximiser les ouvertures.",
    features: [
      { title: "Templates IA", description: "Des dizaines de templates professionnels personnalisables en quelques minutes.", icon: Sparkles },
      { title: "Segmentation", description: "Ciblez vos contacts selon leur comportement, leur historique d'achat ou leur profil.", icon: Users },
      { title: "Automation", description: "Créez des séquences d'emails automatiques déclenchées par des actions.", icon: Zap },
      { title: "Analytics", description: "Taux d'ouverture, de clic et de conversion — toutes les métriques clés.", icon: BarChart2 },
    ],
    crossSell: { slug: "crm", label: "CRM Clients", teaser: "Vous cherchez à synchroniser vos campagnes avec votre CRM ?" },
  },
  {
    slug: "chatbot",
    label: "Chatbot IA",
    category: "Digital",
    color: "#8b5cf6",
    bg: "#ede9fe",
    icon: Bot,
    clientHref: "/client/chatbot",
    hero: {
      title: "Un assistant virtuel sur votre site 24h/24",
      subtitle: "Installez un chatbot IA sur votre site web qui répond aux questions, qualifie les prospects et prend des rendez-vous automatiquement.",
    },
    valueProposition: "Votre chatbot répond instantanément à vos visiteurs, même la nuit et le week-end — sans jamais se fatiguer.",
    features: [
      { title: "IA conversationnelle", description: "Un chatbot capable de comprendre les questions complexes et d'y répondre naturellement.", icon: Brain },
      { title: "Personnalisation", description: "Entraînez le chatbot avec les informations spécifiques à votre activité.", icon: Sparkles },
      { title: "Qualification", description: "Le chatbot collecte les informations clés sur vos visiteurs et les qualifie.", icon: Users },
      { title: "Intégration simple", description: "Intégrez le chatbot sur votre site en collant un simple code.", icon: PlugZap },
    ],
    crossSell: { slug: "crm", label: "CRM Clients", teaser: "Vous cherchez à transférer les leads du chatbot vers votre CRM ?" },
  },
  {
    slug: "analytics",
    label: "Analytics",
    category: "Digital",
    color: "#8b5cf6",
    bg: "#ede9fe",
    icon: BarChart2,
    clientHref: "/client/analytics",
    hero: {
      title: "Comprenez votre audience, prenez de meilleures décisions",
      subtitle: "Trafic, conversions, comportements — toutes vos données analytics centralisées avec des insights IA actionnables.",
    },
    valueProposition: "Arrêtez de naviguer à vue. L'IA analyse vos données et vous dit exactement quoi améliorer pour augmenter vos conversions.",
    features: [
      { title: "Tableau de bord unifié", description: "Toutes vos métriques clés (trafic, conversions, ventes) en un seul endroit.", icon: BarChart2 },
      { title: "Insights IA", description: "L'IA identifie les tendances et vous explique ce qui influence vos résultats.", icon: Sparkles },
      { title: "Entonnoir de conversion", description: "Visualisez où vous perdez vos visiteurs dans votre parcours d'achat.", icon: TrendingUp },
      { title: "Rapports automatiques", description: "Recevez un rapport hebdomadaire de vos performances par email.", icon: Mail },
    ],
    crossSell: { slug: "email-marketing", label: "Email Marketing", teaser: "Vous cherchez à optimiser vos campagnes email grâce aux données ?" },
  },
  {
    slug: "marketplace",
    label: "Marketplace",
    category: "Digital",
    color: "#0891b2",
    bg: "#e0f2fe",
    icon: Store,
    clientHref: "/client/marketplace",
    hero: {
      title: "Trouvez les meilleurs prestataires qualifiés",
      subtitle: "Accédez à un réseau de prestataires vérifiés pour tous vos besoins : développeurs, designers, consultants et plus encore.",
    },
    valueProposition: "Des prestataires qualifiés, vérifiés et évalués par la communauté DJAMA. Trouvez l'expert qu'il vous faut en quelques minutes.",
    features: [
      { title: "Prestataires vérifiés", description: "Tous les prestataires sont vérifiés et évalués par la communauté DJAMA.", icon: Shield },
      { title: "Recherche ciblée", description: "Filtrez par compétence, budget, disponibilité et zone géographique.", icon: Search },
      { title: "Devis en ligne", description: "Recevez des devis directement depuis la plateforme en quelques heures.", icon: FileText },
      { title: "Paiement sécurisé", description: "Paiement sécurisé avec libération des fonds après validation de la mission.", icon: Shield },
    ],
    crossSell: { slug: "agences", label: "Agences partenaires", teaser: "Vous cherchez des agences partenaires pour des projets plus importants ?" },
  },
  {
    slug: "carte-visite",
    label: "Carte de visite",
    category: "Digital",
    color: "#0891b2",
    bg: "#e0f2fe",
    icon: Contact2,
    clientHref: "/client/carte-visite",
    hero: {
      title: "Votre carte de visite digitale, partageable en 1 lien",
      subtitle: "Créez une carte de visite numérique professionnelle avec votre photo, vos coordonnées et vos liens — partageable par QR code ou lien.",
    },
    valueProposition: "Plus besoin de cartes papier. Partagez votre profil complet en un scan de QR code ou un clic sur votre lien personnalisé.",
    features: [
      { title: "Design professionnel", description: "Des templates de cartes de visite numériques élégants et personnalisables.", icon: Sparkles },
      { title: "QR Code", description: "Générez un QR code à imprimer ou à afficher lors de vos rendez-vous.", icon: QrCode },
      { title: "Liens réseaux sociaux", description: "Centralisez tous vos liens (LinkedIn, Instagram, site web) en un endroit.", icon: Share2 },
      { title: "Analytics de partage", description: "Sachez combien de personnes ont consulté votre carte de visite.", icon: BarChart2 },
    ],
    crossSell: { slug: "crm", label: "CRM Clients", teaser: "Vous cherchez à ajouter automatiquement vos nouveaux contacts au CRM ?" },
  },

  /* ─── GESTION ─────────────────────────────────────────── */
  {
    slug: "portail",
    label: "Portail Client",
    category: "Gestion",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: Building2,
    clientHref: "/client/portail",
    hero: {
      title: "Offrez à vos clients leur espace dédié",
      subtitle: "Un portail client personnalisé où vos clients accèdent à leurs factures, contrats, documents et l'avancement de leurs projets.",
    },
    valueProposition: "Vos clients n'ont plus besoin de vous appeler pour savoir où en est leur commande. Tout est visible dans leur espace dédié.",
    features: [
      { title: "Espace personnalisé", description: "Chaque client dispose de son propre espace sécurisé avec vos couleurs.", icon: Building2 },
      { title: "Documents centralisés", description: "Factures, contrats, livrables — tout est disponible en un clic.", icon: FileText },
      { title: "Messagerie intégrée", description: "Communiquez avec vos clients directement depuis le portail.", icon: MessageSquare },
      { title: "Approbations", description: "Vos clients approuvent les devis et signent les contrats depuis leur espace.", icon: CheckSquare },
    ],
    crossSell: { slug: "crm", label: "CRM Clients", teaser: "Vous cherchez à lier le portail client à votre CRM ?" },
  },
  {
    slug: "paie",
    label: "Paie & RH",
    category: "Gestion",
    color: "#10b981",
    bg: "#d1fae5",
    icon: Banknote,
    clientHref: "/client/paie",
    hero: {
      title: "Des fiches de paie conformes en quelques clics",
      subtitle: "Automatisez vos fiches de paie, gérez les contrats de travail et vos obligations sociales — toujours à jour avec la législation française.",
    },
    valueProposition: "Produisez des fiches de paie conformes en 2 minutes. Calculs automatiques des cotisations sociales selon les vrais taux légaux.",
    features: [
      { title: "Fiches de paie auto", description: "Générez des fiches de paie conformes avec calculs automatiques des cotisations.", icon: Banknote },
      { title: "Contrats de travail", description: "Rédigez vos contrats depuis des modèles légaux pré-validés.", icon: FileText },
      { title: "Congés & absences", description: "Suivez et validez les demandes de congés de vos salariés.", icon: Calendar },
      { title: "DSN automatique", description: "Préparez vos déclarations sociales nominatives automatiquement.", icon: FileCheck2 },
    ],
    crossSell: { slug: "equipe", label: "Équipe", teaser: "Vous cherchez à planifier les horaires de vos salariés ?" },
  },
  {
    slug: "reputation",
    label: "Réputation",
    category: "Gestion",
    color: "#b91c1c",
    bg: "#fef2f2",
    icon: Star,
    clientHref: "/client/reputation",
    hero: {
      title: "Maîtrisez votre réputation en ligne",
      subtitle: "Collectez des avis positifs, répondez aux avis négatifs et suivez votre e-réputation sur Google, Pages Jaunes et les réseaux sociaux.",
    },
    valueProposition: "Une bonne e-réputation multiplie vos conversions. Automatisez la collecte d'avis et répondez aux critiques avec l'aide de l'IA.",
    features: [
      { title: "Collecte d'avis automatique", description: "Envoyez une demande d'avis automatique après chaque prestation.", icon: Mail },
      { title: "Suivi multi-plateformes", description: "Suivez vos avis Google, Pages Jaunes, Facebook depuis un seul tableau de bord.", icon: BarChart2 },
      { title: "Réponse IA", description: "L'IA rédige des réponses professionnelles à vos avis, positifs ou négatifs.", icon: Sparkles },
      { title: "Alertes", description: "Soyez alerté dès qu'un nouvel avis est publié sur votre fiche.", icon: Zap },
    ],
    crossSell: { slug: "temoignages", label: "Témoignages", teaser: "Vous cherchez à afficher vos meilleurs avis sur votre site ?" },
  },
  {
    slug: "blog",
    label: "Blog",
    category: "Gestion",
    color: "#0369a1",
    bg: "#f0f9ff",
    icon: BookOpen,
    clientHref: "/client/blog",
    hero: {
      title: "Publiez des articles qui attirent des clients",
      subtitle: "L'IA génère des articles de blog SEO-optimisés sur vos sujets métier — publiez plus souvent sans y passer des heures.",
    },
    valueProposition: "Un article de qualité publié régulièrement peut doubler votre trafic organique. L'IA vous aide à publier sans effort.",
    features: [
      { title: "Génération IA", description: "Donnez un titre ou une idée, l'IA rédige un article complet en quelques secondes.", icon: Sparkles },
      { title: "SEO optimisé", description: "Chaque article est optimisé pour les moteurs de recherche automatiquement.", icon: TrendingUp },
      { title: "Images générées", description: "L'IA génère des images d'illustration adaptées à chaque article.", icon: Layers },
      { title: "Publication multi-canal", description: "Publiez sur votre blog DJAMA et partagez sur vos réseaux sociaux en 1 clic.", icon: Share2 },
    ],
    crossSell: { slug: "reseaux-sociaux", label: "Réseaux Sociaux IA", teaser: "Vous cherchez à transformer vos articles en posts sociaux ?" },
  },
  {
    slug: "temoignages",
    label: "Témoignages",
    category: "Gestion",
    color: "#9a3412",
    bg: "#ffedd5",
    icon: MessageSquare,
    clientHref: "/client/temoignages",
    hero: {
      title: "Affichez la preuve sociale qui rassure vos prospects",
      subtitle: "Collectez, gérez et affichez vos témoignages clients de façon professionnelle — en vidéo, texte ou note étoilée.",
    },
    valueProposition: "87% des consommateurs lisent les avis avant d'acheter. Affichez vos meilleurs témoignages et convertissez plus.",
    features: [
      { title: "Collecte simplifiée", description: "Envoyez une demande de témoignage par email ou SMS en 1 clic.", icon: Mail },
      { title: "Vidéo & texte", description: "Vos clients peuvent laisser un témoignage vidéo ou texte selon leur préférence.", icon: Layers },
      { title: "Widget intégrable", description: "Affichez vos témoignages sur votre site web avec un widget personnalisable.", icon: Globe },
      { title: "Modération", description: "Validez et organisez vos témoignages avant de les afficher publiquement.", icon: CheckSquare },
    ],
    crossSell: { slug: "reputation", label: "Réputation", teaser: "Vous cherchez à suivre votre e-réputation au global ?" },
  },
  {
    slug: "planification",
    label: "Planification",
    category: "Gestion",
    color: "#075985",
    bg: "#cffafe",
    icon: Target,
    clientHref: "/client/planification",
    hero: {
      title: "Planifiez votre stratégie, atteignez vos objectifs",
      subtitle: "Définissez vos OKRs, alignez votre équipe et suivez votre progression vers vos objectifs trimestriels et annuels.",
    },
    valueProposition: "Les équipes qui utilisent des OKRs atteignent leurs objectifs 3× plus souvent. Commencez dès aujourd'hui avec DJAMA Planification.",
    features: [
      { title: "OKRs & KPIs", description: "Définissez vos Objectifs et Résultats Clés et suivez leur avancement en temps réel.", icon: Target },
      { title: "Alignement équipe", description: "Chaque membre de l'équipe voit ses objectifs individuels et leur lien avec la stratégie.", icon: Users },
      { title: "Revues périodiques", description: "Planifiez des revues hebdomadaires et mensuelles pour ajuster le cap.", icon: Calendar },
      { title: "Tableaux de bord", description: "Un dashboard stratégique pour piloter votre business d'un seul coup d'œil.", icon: BarChart2 },
    ],
    crossSell: { slug: "projets", label: "Projets", teaser: "Vous cherchez à lier vos OKRs à des projets concrets ?" },
  },
  {
    slug: "site-web",
    label: "Créateur de site",
    category: "Gestion",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: Globe,
    clientHref: "/client/site-web",
    hero: {
      title: "Votre site vitrine créé par l'IA en 5 minutes",
      subtitle: "Décrivez votre activité, l'IA génère un site web professionnel complet — textes, images, structure — prêt à être publié.",
    },
    valueProposition: "Plus besoin d'une agence web ou de coder. L'IA crée votre site sur mesure et vous pouvez le personnaliser facilement.",
    features: [
      { title: "Génération IA", description: "L'IA génère votre site complet à partir d'une simple description de votre activité.", icon: Sparkles },
      { title: "Templates professionnels", description: "Des dizaines de templates par secteur, tous personnalisables.", icon: Layers },
      { title: "SEO intégré", description: "Chaque page est optimisée pour le référencement naturel automatiquement.", icon: TrendingUp },
      { title: "Publication en 1 clic", description: "Publiez votre site avec votre propre domaine en quelques minutes.", icon: Globe },
    ],
    crossSell: { slug: "chatbot", label: "Chatbot IA", teaser: "Vous cherchez à ajouter un assistant IA sur votre nouveau site ?" },
  },
  {
    slug: "mes-sites",
    label: "Mes sites",
    category: "Gestion",
    color: "#059669",
    bg: "#d1fae5",
    icon: Globe,
    clientHref: "/client/mes-sites",
    hero: {
      title: "Gérez et publiez tous vos sites depuis un seul endroit",
      subtitle: "Multi-sites, mises à jour, statistiques et gestion des domaines — tout votre écosystème web dans un seul tableau de bord.",
    },
    valueProposition: "Gérez plusieurs sites web pour vous ou vos clients depuis une interface unique, sans jongler entre différentes plateformes.",
    features: [
      { title: "Multi-sites", description: "Gérez plusieurs sites depuis un seul dashboard — idéal pour les agences.", icon: Layers },
      { title: "Mises à jour rapides", description: "Modifiez le contenu de vos sites en quelques clics sans compétences techniques.", icon: Zap },
      { title: "Statistiques", description: "Visualisez le trafic et les performances de chacun de vos sites.", icon: BarChart2 },
      { title: "Gestion domaines", description: "Connectez vos noms de domaine et gérez les DNS depuis la plateforme.", icon: Globe },
    ],
    crossSell: { slug: "analytics", label: "Analytics", teaser: "Vous cherchez à analyser en profondeur le trafic de vos sites ?" },
  },
  {
    slug: "agences",
    label: "Agences partenaires",
    category: "Gestion",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: Briefcase,
    clientHref: "/client/agences",
    hero: {
      title: "Un réseau d'agences partenaires à votre service",
      subtitle: "Accédez à des agences digitales certifiées DJAMA pour des projets d'envergure — développement, design, marketing et conseil.",
    },
    valueProposition: "Pour les projets qui dépassent les outils self-service, notre réseau d'agences partenaires vous accompagne de A à Z.",
    features: [
      { title: "Agences certifiées", description: "Toutes nos agences partenaires sont certifiées et évaluées par DJAMA.", icon: Shield },
      { title: "Par spécialité", description: "Trouvez une agence spécialisée dans votre secteur ou votre besoin spécifique.", icon: Search },
      { title: "Devis comparatifs", description: "Recevez des devis de plusieurs agences et comparez facilement.", icon: BarChart2 },
      { title: "Suivi de mission", description: "Suivez l'avancement de votre projet avec votre agence depuis DJAMA.", icon: TrendingUp },
    ],
    crossSell: { slug: "marketplace", label: "Marketplace", teaser: "Vous cherchez des prestataires indépendants pour des missions ponctuelles ?" },
  },
];

/* Helper pour retrouver une app par slug */
export function getAppBySlug(slug: string): AppDetail | undefined {
  return APPS_DATA.find((a) => a.slug === slug);
}

/* Helper pour retrouver les apps d'une catégorie */
export function getAppsByCategory(category: string): AppDetail[] {
  return APPS_DATA.filter((a) => a.category === category);
}

