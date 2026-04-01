import type { Translations } from "./types";

export const fr: Translations = {
  nav: {
    home: "Accueil",
    services: "Services",
    projects: "Réalisations",
    contact: "Contact",
    clientArea: "Espace client",
    freeQuote: "Devis gratuit",
    language: "Langue",
  },

  home: {
    hero: {
      badge: "Création digitale & outils professionnels",
      titleLines: ["Votre présence", "digitale,", "simplifiée."],
      subtitle:
        "De la création de site à la gestion de votre activité, DJAMA vous accompagne avec des solutions digitales modernes, efficaces et accessibles.",
      cta1: "Démarrer un projet",
      cta2: "Nos services",
      socialProof: "+50 clients font confiance à DJAMA",
    },
    stats: [
      { value: "50+",  label: "Clients accompagnés",      sub: "depuis 2022" },
      { value: "2022", label: "Projets réalisés depuis",  sub: "sites, apps, outils, design" },
      { value: "100%", label: "Solutions sur mesure",     sub: "adaptées à chaque besoin" },
      { value: "∞",    label: "Support & accompagnement", sub: "humain, disponible" },
    ],
    presentation: {
      badge: "À propos de DJAMA",
      titleLines: ["Une vision moderne", "du digital."],
      text1: "DJAMA est une plateforme qui combine création digitale, outils professionnels et accompagnement.",
      text2:
        "L'objectif est d'aider les entrepreneurs, entreprises et particuliers à développer leur présence digitale avec des solutions simples, modernes et efficaces.",
      cta1: "Nos services",
      cta2: "Prendre contact",
      values: [
        { title: "Fiabilité",       desc: "Délais respectés, livrables soignés, communication transparente." },
        { title: "Rapidité",        desc: "Des process optimisés avec l'IA pour livrer vite, sans compromis." },
        { title: "Efficacité",      desc: "Chaque solution est pensée pour produire de vrais résultats." },
        { title: "Accompagnement",  desc: "Un suivi humain, personnalisé et adapté à votre réalité." },
      ],
    },
    assistant: {
      badge: "Intelligence artificielle",
      titleLines: ["Une question ?", "L'assistant DJAMA", "vous répond."],
      subtitle:
        "Posez vos questions sur nos services, nos outils ou votre projet. Notre assistant intelligent vous guide instantanément, à toute heure.",
      questions: [
        "Quels services proposez-vous ?",
        "Comment créer une auto-entreprise ?",
        "Proposez-vous du coaching IA ?",
        "Comment fonctionne l'espace client ?",
      ],
      cta: "Discuter avec l'assistant",
    },
    tools: {
      badge: "Espace client",
      titleLines: ["Des outils pour", "simplifier votre", "quotidien."],
      subtitle: "Gestion de documents, organisation, automatisation et espace client sécurisé.",
      cta: "Découvrir les outils",
      items: [
        { label: "Factures & Devis",   sub: "Documents professionnels en quelques secondes. PDF, TVA, logo, RIB." },
        { label: "Planning & Agenda",  sub: "Organisez votre agenda en vue Jour, Semaine ou Mois." },
        { label: "Bloc-notes pro",     sub: "Notes par catégorie, export PDF, sauvegarde automatique." },
      ],
    },
    approach: {
      badge: "Notre approche",
      titleLines: ["Une approche", "simple et efficace."],
      steps: [
        {
          title: "Comprendre votre besoin",
          desc: "Nous prenons le temps d'écouter votre projet, vos contraintes et vos objectifs. Pas de solution générique — une analyse précise de votre situation.",
        },
        {
          title: "Créer une solution adaptée",
          desc: "Site web, application, outil ou stratégie digitale : chaque livrable est pensé sur mesure pour répondre exactement à ce dont vous avez besoin.",
        },
        {
          title: "Accompagner dans la durée",
          desc: "La relation ne s'arrête pas à la livraison. Suivi, formation, évolutions : nous restons disponibles pour que votre projet continue de progresser.",
        },
      ],
    },
    servicesSection: {
      badge: "Ce que nous faisons",
      titleLines: ["Tous vos besoins", "digitaux, couverts."],
      subtitle:
        "Du site web au coaching, en passant par les outils professionnels — une seule équipe pour tout gérer.",
      cta: "Voir tous les services",
      items: [
        { title: "Création digitale",      desc: "Sites web, applications, e-commerce et design sur mesure." },
        { title: "Outils professionnels",  desc: "Factures, planning, bloc-notes et espace client sécurisé." },
        { title: "Accompagnement",         desc: "Admin, URSSAF, fournisseurs, marchés publics et privés." },
        { title: "Coaching",               desc: "Coaching IA, soutien scolaire et accompagnement numérique." },
      ],
    },
    realisationsSection: {
      badge: "Nos réalisations",
      titleLines: ["Des projets", "qui parlent."],
      subtitle:
        "Quelques exemples concrets de ce que nous construisons pour nos clients, partout dans le monde.",
      cta: "Voir toutes les réalisations",
      projects: [
        {
          name: "MONDOUKA",
          category: "E-commerce & Sourcing",
          desc: "Plateforme e-commerce avec gestion de sourcing, catalogue produit et intégration paiement international.",
          tag: "E-commerce",
        },
        {
          name: "CLAMAC",
          category: "Site vitrine & SEO",
          desc: "Site professionnel pour une entreprise de travaux, optimisé SEO avec formulaire de devis intégré.",
          tag: "Web",
        },
        {
          name: "WEWE",
          category: "Web App SaaS",
          desc: "Application web sur mesure avec espace utilisateur, tableau de bord et gestion de données avancée.",
          tag: "Application",
        },
      ],
    },
    cta: {
      label: "Prêt à démarrer ?",
      titleLines: ["Votre projet", "mérite mieux."],
      subtitle:
        "Prenez contact aujourd'hui — nous vous répondons sous 24h avec une proposition claire et adaptée à vos besoins.",
      cta1: "Demander un devis",
      cta2: "Nous contacter",
    },
  },

  overview: {
    title: "DJAMA en un regard",
    cols: [
      {
        title: "Création digitale",
        badge: "Sur mesure",
        items: [
          { label: "Sites web & applications",   badge: null },
          { label: "Design & identité visuelle", badge: null },
          { label: "E-commerce",                 badge: null },
        ],
      },
      {
        title: "Outils professionnels",
        badge: "Pro",
        items: [
          { label: "Factures & devis PDF",     badge: null },
          { label: "Planning & agenda",        badge: null },
          { label: "Bloc-notes professionnel", badge: null },
          { label: "Espace client sécurisé",   badge: "Disponible" },
        ],
      },
      {
        title: "Accompagnement",
        badge: "Personnalisé",
        items: [
          { label: "Création auto-entrepreneur",  badge: null },
          { label: "Déclarations URSSAF",         badge: null },
          { label: "Assistance administrative",   badge: null },
          { label: "Fournisseurs internationaux", badge: null },
          { label: "Marchés publics & privés",    badge: null },
        ],
      },
      {
        title: "Coaching",
        badge: "Individuel",
        items: [
          { label: "Coaching IA",              badge: null },
          { label: "Soutien scolaire",         badge: null },
          { label: "Accompagnement numérique", badge: null },
          { label: "Organisation digitale",    badge: null },
        ],
      },
    ],
  },

  services: {
    hero: {
      badge: "Ce que nous faisons",
      titleLines: ["Nos services,", "votre croissance."],
      subtitle:
        "Du site web à l'accompagnement administratif, en passant par les outils professionnels — tout ce dont vous avez besoin pour avancer.",
    },
    filters: {
      all: "Tous",
      Digital: "Digital",
      "Création de contenu": "Création",
      "Documents & Outils": "Outils",
      Accompagnement: "Accompagnement",
      Coaching: "Coaching",
    },
    whyUs: {
      badge: "Nos avantages",
      title: "Pourquoi choisir DJAMA.",
      items: [
        {
          title: "Exécution rapide",
          desc: "Processus IA-augmenté : nous livrons plus vite que les agences traditionnelles, sans sacrifier la qualité.",
        },
        {
          title: "Image premium",
          desc: "Chaque prestation est orientée objectif. Pas du beau pour le beau — du beau qui performe.",
        },
        {
          title: "Accompagnement humain",
          desc: "Une équipe disponible, pas un ticket support. Vous avez une vraie relation avec les personnes qui travaillent pour vous.",
        },
        {
          title: "Outils concrets",
          desc: "Factures, planning, notes — vous repartez avec des outils opérationnels, pas juste une livraison.",
        },
        {
          title: "Vision business & design",
          desc: "Nous comprenons à la fois les enjeux business et les exigences visuelles pour des solutions vraiment efficaces.",
        },
        {
          title: "Solutions sur mesure",
          desc: "Rien de générique. Chaque projet est analysé, pensé et construit pour votre réalité spécifique.",
        },
      ],
    },
    comparison: {
      badge: "Comparaison",
      title: "DJAMA vs agences traditionnelles",
      text: "Ce qui nous différencie concrètement.",
      features: [
        "Délais de livraison courts",
        "Tarifs transparents",
        "Accompagnement humain",
        "Outils professionnels inclus",
        "Vision business & design",
      ],
    },
    cta: {
      title: "Prêt à démarrer ?",
      subtitle: "Envoyez votre demande maintenant — nous vous répondons sous 24h avec une proposition adaptée.",
      btn1: "Démarrer un projet",
      btn2: "Explorer les services",
    },
  },

  contact: {
    hero: {
      badge: "Discutons de votre projet",
      titleLines: ["Parlons de votre", "projet."],
      subtitle:
        "Une idée, un besoin, une question ? Décrivez-nous votre projet — nous vous répondons rapidement avec une solution claire et adaptée.",
      badges: [
        { text: "Réponse sous 24h",         color: "#c9a55a", rgb: "201,165,90"  },
        { text: "Accompagnement sur mesure", color: "#60a5fa", rgb: "96,165,250" },
        { text: "WhatsApp disponible",       color: "#25d366", rgb: "37,211,102" },
      ],
    },
    form: {
      title: "Envoyez-nous un message",
      subtitle: "Formulaire de contact",
      namePlaceholder: "Jean Dupont",
      emailPlaceholder: "vous@exemple.com",
      subjectPlaceholder: "Sélectionner un sujet…",
      budgetPlaceholder: "Votre budget approximatif…",
      messagePlaceholder: "Décrivez votre projet, vos besoins, vos contraintes…",
      submit: "Envoyer le message",
      sending: "Envoi en cours…",
      successTitle: "Message envoyé ! 🎉",
      successText: "Merci pour votre message. Nous vous répondons sous 24h — surveillez votre boîte e-mail.",
      successBadge: "Réponse attendue sous 24h",
      newMessage: "Envoyer un autre message →",
      disclaimer: "Paiement accepté après accord : PayPal ou virement bancaire · Sans engagement",
      subjects: [
        "Création de site web",
        "Application mobile",
        "Design & identité visuelle",
        "Assistance administrative",
        "Recherche de fournisseurs",
        "Marchés publics & privés",
        "Coaching IA",
        "Soutien scolaire",
        "Outils professionnels",
        "Autre demande",
      ],
      budgets: [
        { value: "under500",   label: "Moins de 500€"        },
        { value: "500_2000",   label: "500€ – 2 000€"         },
        { value: "2000_10000", label: "2 000€ – 10 000€"      },
        { value: "over10000",  label: "Plus de 10 000€"       },
        { value: "unknown",    label: "Je ne sais pas encore" },
      ],
    },
    contactBlock: {
      title: "On est là pour vous",
      subtitle: "Choisissez le canal qui vous convient.",
      emailLabel: "E-mail",
      whatsappLabel: "WhatsApp",
      phoneLabel: "Téléphone",
      delayLabel: "Délai de réponse",
      delayValue: "Sous 24 heures",
      bookBtn: "Réserver un appel découverte",
    },
    process: {
      badge: "Processus simple",
      title: "Comment ça se passe.",
      subtitle: "De votre demande au lancement, un processus clair en 4 étapes.",
      steps: [
        {
          step: "01",
          title: "Votre demande",
          desc: "Remplissez le formulaire ou écrivez-nous directement. Décrivez votre projet en quelques lignes.",
        },
        {
          step: "02",
          title: "Analyse",
          desc: "Nous étudions votre besoin, définissons la meilleure approche et préparons notre réponse.",
        },
        {
          step: "03",
          title: "Proposition",
          desc: "Vous recevez une proposition claire : solution, délai, tarif. Pas de surprise, tout est transparent.",
        },
        {
          step: "04",
          title: "Lancement",
          desc: "Après validation, nous démarrons. Vous êtes tenu informé à chaque étape jusqu'à la livraison.",
        },
      ],
    },
    trust: {
      badge: "Nos engagements",
      title: "Pourquoi travailler avec DJAMA.",
      items: [
        {
          title: "Approche moderne",
          desc: "IA augmentée, process optimisés, outils récents. Nous travaillons avec les meilleures technologies disponibles.",
        },
        {
          title: "Accompagnement humain",
          desc: "Pas de ticket de support anonyme. Vous avez une vraie relation directe avec l'équipe qui travaille pour vous.",
        },
        {
          title: "Solutions claires",
          desc: "Chaque proposition est simple, lisible et sans jargon. Vous savez exactement ce que vous payez et ce que vous recevez.",
        },
        {
          title: "Rapidité d'exécution",
          desc: "Grâce à nos workflows optimisés, nous livrons plus vite que les agences traditionnelles, sans sacrifier la qualité.",
        },
        {
          title: "Qualité premium",
          desc: "Chaque livrable est soigné, pensé dans les détails. L'image que vous projetez mérite le meilleur.",
        },
        {
          title: "Fiabilité totale",
          desc: "Délais respectés, communication transparente, suivi rigoureux. Vous pouvez compter sur nous à chaque étape.",
        },
      ],
    },
    finalCta: {
      label: "Devis gratuit",
      title: "Prêt à démarrer ?",
      btn1: "Envoyer ma demande",
      btn2: "WhatsApp direct",
    },
  },

  footer: {
    tagline:
      "Création digitale, outils professionnels et accompagnement pour entrepreneurs, particuliers et entreprises.",
    services: {
      title: "Services",
      links: [
        { label: "Tous les services"     },
        { label: "Réalisations"          },
        { label: "Outils professionnels" },
        { label: "Coaching IA"           },
        { label: "Soutien scolaire"      },
      ],
    },
    account: {
      title: "Mon compte",
      links: [
        { label: "Espace client" },
        { label: "Connexion"     },
        { label: "Inscription"   },
        { label: "Contact"       },
      ],
    },
    social: {
      title: "DJAMA sur les réseaux",
    },
    language: {
      title: "Langue",
    },
    copyright: "Tous droits réservés",
  },
};
