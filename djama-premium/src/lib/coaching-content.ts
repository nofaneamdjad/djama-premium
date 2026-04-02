/* ─────────────────────────────────────────────────────────────
   Contenu pédagogique — Coaching IA DJAMA
   5 modules · 17 chapitres · leçons + exercices
─────────────────────────────────────────────────────────────── */

export type ChapterType = "lesson" | "exercise" | "quiz";

export interface KeyPoint {
  title: string;
  text:  string;
}

export interface Exercise {
  prompt: string;
  hints:  string[];
}

export interface Chapter {
  id:          string;   // e.g. "1.2"
  title:       string;
  type:        ChapterType;
  duration:    string;   // e.g. "15 min"
  intro:       string;
  keyPoints?:  KeyPoint[];
  example?:    string;
  exercise?:   Exercise;
  tips?:       string[];
}

export interface Module {
  id:          string;   // e.g. "1"
  title:       string;
  emoji:       string;
  tagline:     string;
  color:       string;
  rgb:         string;
  description: string;
  duration:    string;   // total estimated time
  chapters:    Chapter[];
}

/* ══════════════════════════════════════════════════════════════
   MODULE 1 — COMPRENDRE L'IA
══════════════════════════════════════════════════════════════ */
const M1: Module = {
  id:          "1",
  title:       "Comprendre l'IA",
  emoji:       "🧠",
  tagline:     "Les fondations pour tout comprendre",
  color:       "#60a5fa",
  rgb:         "96,165,250",
  description: "Démystifiez l'intelligence artificielle. De quoi s'agit-il vraiment, comment ça marche, et pourquoi c'est incontournable aujourd'hui.",
  duration:    "~60 min",
  chapters: [
    {
      id:       "1.1",
      title:    "Qu'est-ce que l'IA ?",
      type:     "lesson",
      duration: "15 min",
      intro:    "L'intelligence artificielle n'est pas de la magie — c'est un programme entraîné à reconnaître des patterns dans de grandes quantités de données. Comprendre ce principe de base change radicalement la façon dont vous l'utilisez.",
      keyPoints: [
        {
          title: "L'IA apprend par l'exemple",
          text:  "Contrairement à un programme classique avec des règles fixes, un modèle d'IA est exposé à des millions d'exemples et apprend à généraliser. Plus les données d'entraînement sont riches, plus le modèle est capable."
        },
        {
          title: "IA générative vs IA discriminative",
          text:  "L'IA discriminative classe (spam / pas spam). L'IA générative produit : texte, image, audio, code. ChatGPT, Claude et Gemini sont des IA génératives basées sur des LLM (Large Language Models)."
        },
        {
          title: "Ce que l'IA fait bien — et mal",
          text:  "L'IA excelle à rédiger, résumer, reformuler, coder, analyser des textes. Elle peut halluciner (inventer des faits), manquer de contexte récent, et ne pas comprendre les nuances culturelles fines."
        },
      ],
      example:  "Quand vous demandez à ChatGPT de résumer un article, il n'\"lit\" pas — il prédit les tokens (morceaux de mots) les plus probables compte tenu du contexte. Ça ressemble à de la compréhension, mais c'est de la prédiction statistique très sophistiquée.",
      tips:     ["Pensez à l'IA comme à un stagiaire très cultivé mais sans sens commun.", "Toujours vérifier les faits factuels importants — l'IA peut se tromper avec confiance."],
    },
    {
      id:       "1.2",
      title:    "Comment fonctionnent les LLM ?",
      type:     "lesson",
      duration: "20 min",
      intro:    "Les Large Language Models (LLM) comme Claude ou GPT-4 sont au cœur de la révolution IA actuelle. Comprendre leur mécanique de base — sans mathématiques — vous permet de les utiliser beaucoup plus intelligemment.",
      keyPoints: [
        {
          title: "Tokens et prédiction",
          text:  "Un LLM découpe le texte en \"tokens\" (environ 0,75 mot). Pour chaque token, il calcule la probabilité de chaque token possible suivant. La \"température\" contrôle la créativité : 0 = déterministe, 1 = créatif."
        },
        {
          title: "La fenêtre de contexte",
          text:  "Chaque modèle a une limite de contexte (ex : 200 000 tokens pour Claude 3.5). Au-delà, le modèle \"oublie\" les débuts de conversation. C'est pour ça que les conversations longues deviennent incohérentes."
        },
        {
          title: "Fine-tuning et RLHF",
          text:  "Les modèles bruts sont affinés pour être utiles et sûrs via RLHF (Reinforcement Learning from Human Feedback). Des humains notent les réponses, ce qui guide le modèle vers des réponses préférées."
        },
      ],
      example:  "Si vous demandez à Claude \"Quelle est la capitale de la France ?\", il ne cherche pas dans une base de données — il prédit que \"Paris\" est le token le plus probable après cette question, basé sur ses milliards de données d'entraînement.",
      tips:     ["Donner plus de contexte = meilleures réponses. L'IA n'a que ce que vous lui donnez.", "Si la conversation devient longue et incohérente, recommencez dans un nouveau fil."],
    },
    {
      id:       "1.3",
      title:    "Applications concrètes aujourd'hui",
      type:     "lesson",
      duration: "15 min",
      intro:    "L'IA générative n'est plus un gadget — c'est un outil de productivité concret. Voici les cas d'usage qui ont un impact immédiat sur votre travail quotidien, classés par gain de temps.",
      keyPoints: [
        {
          title: "Rédaction et communication (gain × 5)",
          text:  "Emails professionnels, réponses clients, posts LinkedIn, descriptions de produits, offres d'emploi. L'IA ne remplace pas votre voix — elle accélère le premier jet que vous affinez."
        },
        {
          title: "Analyse et synthèse (gain × 10)",
          text:  "Résumer des rapports longs, extraire les points clés d'un document, analyser des retours clients, comparer des offres. Ce qui prenait 2h peut se faire en 5 minutes."
        },
        {
          title: "Code et automatisation (gain × 20)",
          text:  "Même sans savoir coder, vous pouvez générer des scripts, des formules Excel/Google Sheets, des macros, des automatisations simples. L'IA explique chaque ligne si besoin."
        },
      ],
      example:  "Un entrepreneur utilise Claude chaque matin pour transformer ses notes brutes de la veille en un plan d'action structuré, ses emails en ébauches rédigées, et ses idées de posts en 3 versions différentes. Gain estimé : 1h30 par jour.",
      tips:     ["Commencez par automatiser les tâches répétitives que vous détestez.", "L'IA amplifie vos compétences — elle ne les remplace pas."],
    },
    {
      id:       "1.4",
      title:    "Quiz : Quiz Module 1",
      type:     "quiz",
      duration: "10 min",
      intro:    "Vérifiez votre compréhension des bases avant de passer à la suite. Ces questions vous aideront à consolider ce que vous venez d'apprendre.",
      exercise: {
        prompt: "Répondez aux questions suivantes par écrit (dans votre assistant IA ci-dessous, ou sur papier). Essayez de répondre sans relire les leçons — c'est ce qui ancre la mémoire.",
        hints: [
          "1. Quelle est la différence fondamentale entre un programme classique et un modèle d'IA ?",
          "2. Qu'est-ce qu'un token, et pourquoi la fenêtre de contexte est-elle importante ?",
          "3. Citez 3 cas d'usage de l'IA générative pour votre activité.",
          "4. Dans quelle situation faut-il vérifier les informations données par l'IA ?",
        ],
      },
      tips:     ["Utilisez l'assistant IA du cours pour vérifier vos réponses et approfondir les points flous."],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   MODULE 2 — PROMPT ENGINEERING
══════════════════════════════════════════════════════════════ */
const M2: Module = {
  id:          "2",
  title:       "Prompt Engineering",
  emoji:       "✍️",
  tagline:     "L'art de parler à l'IA",
  color:       "#c9a55a",
  rgb:         "201,165,90",
  description: "Le prompt engineering, c'est apprendre à formuler vos demandes pour obtenir exactement ce que vous voulez. Un bon prompt peut multiplier la qualité de la réponse par 10.",
  duration:    "~95 min",
  chapters: [
    {
      id:       "2.1",
      title:    "Anatomie d'un prompt efficace",
      type:     "lesson",
      duration: "20 min",
      intro:    "La plupart des gens utilisent l'IA comme un moteur de recherche : une courte question, une réponse décevante. La réalité est que l'IA répond à la qualité de l'entrée. Un prompt structuré change tout.",
      keyPoints: [
        {
          title: "Les 4 composantes d'un bon prompt",
          text:  "1) RÔLE : « Tu es un expert en... » 2) CONTEXTE : « J'ai une boutique qui... » 3) TÂCHE : « Rédige une description produit... » 4) FORMAT : « En 3 bullet points, ton professionnel mais accessible ». Chaque composante affine la réponse."
        },
        {
          title: "L'instruction négative",
          text:  "Préciser ce que vous ne voulez PAS est aussi puissant que ce que vous voulez. « Ne pas utiliser de jargon technique », « évite les formules creuses comme 'innovant' », « pas plus de 100 mots »."
        },
        {
          title: "Les exemples dans le prompt (few-shot)",
          text:  "Donner 1 ou 2 exemples du résultat attendu est la technique la plus efficace. « Voici le style que je veux : [exemple]. Maintenant fais la même chose pour... » Le modèle comprend immédiatement le registre visé."
        },
      ],
      example:  "Mauvais prompt : « Écris un email de relance ». Bon prompt : « Tu es un consultant commercial senior. J'ai envoyé un devis de 2 500€ à un prospect il y a 10 jours, sans réponse. Rédige un email de relance chaleureux mais professionnel, 4-5 phrases maximum, sans être insistant. »",
      tips:     ["Relisez votre prompt comme si c'était une instruction pour un stagiaire : est-ce assez clair ?", "Si la réponse est trop générique, ajoutez plus de contexte spécifique."],
    },
    {
      id:       "2.2",
      title:    "Techniques avancées : rôle, chaîne, contraintes",
      type:     "lesson",
      duration: "25 min",
      intro:    "Au-delà des bases, il existe des techniques qui transforment un simple assistant en un véritable collaborateur. Voici les méthodes utilisées par les meilleurs utilisateurs d'IA.",
      keyPoints: [
        {
          title: "Chain-of-thought (raisonnement pas à pas)",
          text:  "Ajouter « Réfléchis étape par étape » ou « Explique ton raisonnement » améliore drastiquement la qualité sur les tâches complexes (analyse, math, décision). L'IA structure sa réponse avant de conclure."
        },
        {
          title: "Le persona persistant",
          text:  "Définir un persona en début de conversation et lui demander de le maintenir. « Tu es mon directeur marketing, critique mais bienveillant. Pour toute la session, évalue mes idées depuis ce point de vue. » Résultat : cohérence et profondeur sur toute la conversation."
        },
        {
          title: "L'itération guidée",
          text:  "Ne jamais accepter la première réponse comme finale. « Améliore en rendant le ton plus percutant », « Propose une version plus courte », « Reformule pour cibler des parents d'enfants de 6-12 ans ». L'itération est le vrai pouvoir de l'IA."
        },
      ],
      example:  "Prompt en chaîne : « 1) Analyse les forces et faiblesses de cette idée : [votre idée]. 2) Identifie les 3 risques principaux. 3) Propose 2 ajustements qui réduisent ces risques sans sacrifier les forces. Présente en tableau. »",
      tips:     ["Sauvegardez vos meilleurs prompts — c'est votre capital prompt personnel.", "La spécificité bat la longueur : un prompt court mais précis > un prompt long vague."],
    },
    {
      id:       "2.3",
      title:    "Prompts pour votre métier",
      type:     "lesson",
      duration: "20 min",
      intro:    "Les meilleures applications du prompt engineering sont sectorielles. Voici des templates prêts à l'emploi pour les cas d'usage les plus fréquents en business, communication et gestion.",
      keyPoints: [
        {
          title: "Template : Analyse de situation",
          text:  "« En tant que conseiller stratégique, analyse [situation]. Identifie : 1) Les 3 facteurs clés, 2) Les risques à anticiper, 3) Les opportunités cachées. Synthèse en 5 bullet points actionnables. »"
        },
        {
          title: "Template : Rédaction persuasive",
          text:  "« Tu es copywriter senior. Audience : [description]. Objectif : [action souhaitée]. Ton : [adjectifs]. Contraintes : [longueur, format]. Écris [type de contenu]. Propose 3 versions avec approche différente. »"
        },
        {
          title: "Template : Résolution de problème",
          text:  "« Problème : [description précise]. Contexte : [votre situation]. Contraintes : [ressources, temps, budget]. Génère 5 solutions classées de la plus simple à la plus ambitieuse. Pour chaque solution : effort requis, délai, probabilité de succès. »"
        },
      ],
      tips:     ["Créez une bibliothèque de prompts métier — réutilisables à l'infini.", "Tester sur plusieurs modèles (Claude vs GPT-4) pour trouver le plus adapté à chaque tâche."],
    },
    {
      id:       "2.4",
      title:    "Atelier : Écrire vos prompts",
      type:     "exercise",
      duration: "30 min",
      intro:    "C'est l'heure de pratiquer. Cet exercice vous demande de créer 3 prompts personnalisés pour vos cas d'usage réels. Utilisez l'assistant IA du cours pour les tester et les affiner.",
      exercise: {
        prompt: "Réalisez les 3 exercices suivants. Pour chaque prompt que vous créez, testez-le dans l'assistant IA, notez le résultat, et améliorez-le jusqu'à obtenir un résultat que vous utiliseriez vraiment.",
        hints: [
          "Exercice 1 : Créez un prompt pour une tâche de communication récurrente dans votre activité (email type, post réseau social, message client). Incluez rôle + contexte + format.",
          "Exercice 2 : Créez un prompt pour analyser un problème que vous avez actuellement. Utilisez la technique chain-of-thought.",
          "Exercice 3 : Prenez un de vos 2 premiers prompts et créez-en une version améliorée avec des instructions négatives et un exemple de sortie attendue.",
        ],
      },
      tips:     ["Consacrez 5 min à chaque prompt avant de passer au suivant.", "L'objectif n'est pas la perfection — c'est la pratique itérative."],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   MODULE 3 — AUTOMATISATION
══════════════════════════════════════════════════════════════ */
const M3: Module = {
  id:          "3",
  title:       "Automatisation avec l'IA",
  emoji:       "⚙️",
  tagline:     "Travailler moins, produire plus",
  color:       "#4ade80",
  rgb:         "74,222,128",
  description: "Identifiez ce qui peut être automatisé dans votre activité et construisez vos premiers workflows. Zapier, Make, et les API IA n'ont plus de secrets.",
  duration:    "~80 min",
  chapters: [
    {
      id:       "3.1",
      title:    "Identifier ce qui peut être automatisé",
      type:     "lesson",
      duration: "15 min",
      intro:    "La première étape de l'automatisation est le repérage. Avant de choisir un outil, il faut savoir quoi automatiser. La règle d'or : si vous faites la même chose plus de 3 fois, c'est automatisable.",
      keyPoints: [
        {
          title: "Le critère des 3T",
          text:  "Trois types de tâches à automatiser en priorité : 1) Tâches Tedieuses (répétitives, peu de valeur ajoutée), 2) Tâches Time-consuming (longues mais simples), 3) Tâches Time-sensitive (qui nécessitent réactivité immédiate)."
        },
        {
          title: "Cartographier ses flux de travail",
          text:  "Passez une journée à noter chaque tâche digitale que vous faites. Classez-les : déclencheur → traitement → résultat. Chaque séquence avec un déclencheur clair est un candidat à l'automatisation."
        },
        {
          title: "ROI de l'automatisation",
          text:  "Estimez : temps actuel × fréquence × coût horaire. Si une automatisation prend 2h à mettre en place et économise 3h/mois, elle est rentabilisée en moins d'un mois. La plupart le sont en 1 à 4 semaines."
        },
      ],
      example:  "Cas réel : un freelance recevait 15 emails de prospects/jour, lisait chacun, répondait manuellement. Automatisation : un zap qui classe, résume et génère une ébauche de réponse. Résultat : 45 min/jour économisées.",
      tips:     ["Commencez par 1 automatisation simple. La confiance vient avec les premiers résultats.", "Ne cherchez pas à tout automatiser d'un coup — priorisez par impact."],
    },
    {
      id:       "3.2",
      title:    "Zapier, Make et les outils no-code IA",
      type:     "lesson",
      duration: "25 min",
      intro:    "Zapier et Make (anciennement Integromat) permettent de connecter des centaines d'applications sans coder. Intégrés aux modèles d'IA, ils deviennent des automates intelligents.",
      keyPoints: [
        {
          title: "Zapier vs Make : lequel choisir ?",
          text:  "Zapier : plus simple, plus d'intégrations (6000+), parfait pour les zaps linéaires (si X → alors Y). Make : plus puissant, scénarios complexes avec branches conditionnelles, moins cher pour les volumes. Conseil : commencez par Zapier."
        },
        {
          title: "Les modules IA natifs",
          text:  "Zapier et Make intègrent nativement ChatGPT, Claude, et d'autres modèles. Exemple de zap intelligent : « Quand un email arrive → extraire les infos clés avec Claude → créer une tâche dans Notion → envoyer un résumé sur Slack »."
        },
        {
          title: "Autres outils no-code IA",
          text:  "n8n (open-source, hébergeable), Voiceflow (chatbots), Relevance AI (agents complexes), Notion AI (intégré), Google AppScript + GPT. Pour les visuels automatisés : Canva AI, Adobe Firefly APIs."
        },
      ],
      example:  "Automatisation complète avec Make : un formulaire client → génération auto d'un devis personnalisé via Claude → envoi par email → création du contact dans le CRM → notification Slack au commercial. Sans écrire une ligne de code.",
      tips:     ["Les plans gratuits de Zapier et Make suffisent pour débuter.", "Documentez vos zaps — dans 3 mois vous aurez oublié comment ils fonctionnent."],
    },
    {
      id:       "3.3",
      title:    "Construire votre premier workflow",
      type:     "exercise",
      duration: "40 min",
      intro:    "C'est l'exercice le plus important du module. Vous allez construire un workflow réel, fonctionnel, que vous pouvez utiliser dès aujourd'hui.",
      exercise: {
        prompt: "Suivez les 4 étapes pour construire votre premier workflow automatisé. Si vous n'avez pas de compte Zapier/Make, créez-en un gratuit. L'objectif est d'avoir quelque chose qui fonctionne, même simple.",
        hints: [
          "Étape 1 — Choisissez une tâche à automatiser : email récurrent, publication réseau social, rapport hebdomadaire, classification de leads.",
          "Étape 2 — Définissez le déclencheur (trigger) : nouveau formulaire, email reçu, heure planifiée, nouveau fichier dans Drive.",
          "Étape 3 — Ajoutez une étape IA : 'résume ce texte', 'génère une réponse dans ce ton', 'classe cette demande'.",
          "Étape 4 — Définissez l'action finale : envoyer un email, créer une tâche, enregistrer dans un tableur, notifier sur Slack.",
        ],
      },
      tips:     ["La perfection est l'ennemi du bien — un zap qui fonctionne à 80% est infiniment plus utile que rien.", "Testez avec 3-4 cas réels avant de le mettre en production."],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   MODULE 4 — OUTILS IA INCONTOURNABLES
══════════════════════════════════════════════════════════════ */
const M4: Module = {
  id:          "4",
  title:       "Outils IA incontournables",
  emoji:       "🛠️",
  tagline:     "Le bon outil pour chaque mission",
  color:       "#a78bfa",
  rgb:         "167,139,250",
  description: "ChatGPT, Claude, Gemini, Midjourney, Perplexity… Le paysage IA évolue chaque semaine. Apprenez à naviguer, comparer et choisir intelligemment.",
  duration:    "~65 min",
  chapters: [
    {
      id:       "4.1",
      title:    "ChatGPT, Claude, Gemini : comparaison honnête",
      type:     "lesson",
      duration: "20 min",
      intro:    "Les trois grands modèles de langage ont des profils différents. Connaître leurs forces et faiblesses vous permet de choisir le bon outil selon la tâche — et d'économiser du temps.",
      keyPoints: [
        {
          title: "ChatGPT (OpenAI) — le vétéran polyvalent",
          text:  "Forces : écosystème de plugins énorme, excellent pour le code (GPT-4o), voice mode avancé, image generation (DALL-E). Faiblesses : peut être verbeux, moins nuancé sur certaines tâches de raisonnement complexe. Idéal pour : polyvalence générale, code, intégrations."
        },
        {
          title: "Claude (Anthropic) — le rédacteur nuancé",
          text:  "Forces : rédaction longue forme excellente, raisonnement nuancé, fenêtre de contexte massive (200K tokens), très sûr et factuel. Faiblesses : moins de plugins, pas d'image generation native. Idéal pour : analyse de documents longs, rédaction premium, réflexion stratégique."
        },
        {
          title: "Gemini (Google) — l'intégré Google",
          text:  "Forces : intégration native Google Workspace (Docs, Gmail, Sheets), accès web en temps réel, multimodal avancé. Faiblesses : moins créatif que Claude sur l'écriture. Idéal pour : utilisateurs Google, recherche web augmentée, résumé de fichiers Drive."
        },
      ],
      example:  "Stratégie multi-modèles : Claude pour rédiger un rapport stratégique → ChatGPT pour coder le script d'analyse → Gemini pour chercher des sources récentes et les synthétiser.",
      tips:     ["Abonnez-vous à UN modèle premium d'abord. Maîtrisez-le avant d'en ajouter d'autres.", "Les plans gratuits sont utiles pour explorer, mais les modèles premium font une différence notable."],
    },
    {
      id:       "4.2",
      title:    "Outils spécialisés : image, audio, code",
      type:     "lesson",
      duration: "25 min",
      intro:    "Au-delà des LLM généralistes, l'écosystème IA spécialisé offre des outils qui transforment chaque métier. Tour d'horizon des incontournables par catégorie.",
      keyPoints: [
        {
          title: "Image et vidéo IA",
          text:  "Midjourney (meilleure qualité artistique), DALL-E 3 (intégré à ChatGPT, plus simple), Stable Diffusion (open-source, personnalisable), Runway ML (vidéo IA professionnelle), Kling (vidéo réaliste). Cas d'usage : visuels marketing, mockups produit, contenu réseaux sociaux."
        },
        {
          title: "Audio et voix IA",
          text:  "ElevenLabs (clonage de voix, doublage), Suno (génération musicale), Whisper (transcription précise et gratuite), Descript (édition audio/vidéo par texte). Cas d'usage : podcasts, formations vidéo, transcription réunions, jingles."
        },
        {
          title: "Code et productivité IA",
          text:  "GitHub Copilot (complétion de code en temps réel), Cursor (IDE IA, refactoring intelligent), v0 by Vercel (génération UI), Bolt.new (apps full-stack en quelques prompts), Perplexity (recherche web avec sources). Cas d'usage : développement accéléré, prototypage rapide."
        },
      ],
      example:  "Workflow contenu complet IA : Claude rédige le script → ElevenLabs crée la voix-off → Midjourney génère les visuels → Runway les anime → Descript assemble la vidéo. Une production qui prenait 3 jours → 3 heures.",
      tips:     ["Ne payez que les outils que vous utilisez vraiment. Beaucoup ont des plans gratuits généreux.", "L'outil parfait n'existe pas — adaptez selon votre budget et vos cas d'usage."],
    },
    {
      id:       "4.3",
      title:    "Votre stack IA personnel",
      type:     "exercise",
      duration: "20 min",
      intro:    "Il est temps de construire votre stack IA personnel — les 3 à 5 outils que vous utiliserez vraiment, adaptés à votre métier et votre budget.",
      exercise: {
        prompt: "Construisez votre stack IA en répondant à ces questions. Utilisez l'assistant pour affiner vos choix et obtenir des recommandations personnalisées.",
        hints: [
          "Listez vos 5 tâches digitales les plus chronophages. Pour chacune : quel outil IA pourrait aider ?",
          "Budget mensuel que vous êtes prêt à investir ? (plan gratuit / 20€ / 50€ / 100€+)",
          "Sur la base de vos tâches et budget, choisissez votre outil principal (LLM) et 1-2 outils spécialisés.",
          "Définissez un protocole de test sur 2 semaines : quelle tâche vous engage à automatiser avec l'IA dès demain ?",
        ],
      },
      tips:     ["Commencez avec 1 outil maîtrisé plutôt que 5 outils superficiels.", "Réévaluez votre stack tous les 3 mois — le paysage IA évolue vite."],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   MODULE 5 — IA POUR VOTRE BUSINESS
══════════════════════════════════════════════════════════════ */
const M5: Module = {
  id:          "5",
  title:       "IA pour votre business",
  emoji:       "🚀",
  tagline:     "Passer de l'apprentissage à l'action",
  color:       "#fb923c",
  rgb:         "251,146,60",
  description: "Identifiez les opportunités IA dans votre activité spécifique, bâtissez une stratégie réaliste et créez votre plan d'action des 90 prochains jours.",
  duration:    "~100 min",
  chapters: [
    {
      id:       "5.1",
      title:    "Cartographier les opportunités IA",
      type:     "lesson",
      duration: "25 min",
      intro:    "Chaque business a des opportunités IA uniques. Ce chapitre vous donne un cadre pour les identifier systématiquement — pas de façon générique, mais ancrées dans votre réalité.",
      keyPoints: [
        {
          title: "La matrice Impact / Effort",
          text:  "Listez 10 processus de votre business. Pour chacun : quel serait l'impact de l'IA ? (1-5) Quel effort de mise en place ? (1-5). Commencez par les cases « impact fort, effort faible ». Ce sont vos quick wins."
        },
        {
          title: "Les 5 zones d'opportunités universelles",
          text:  "1) Acquisition client (génération contenu, qualification leads). 2) Service client (FAQ automatisée, réponses rapides). 3) Opérations internes (reporting, classement, résumés). 4) Création de contenu (posts, newsletters, scripts). 5) Prise de décision (analyse données, scénarios)."
        },
        {
          title: "L'audit de temps",
          text:  "Pendant 3 jours, notez chaque tâche et le temps passé. Catégorisez : 'créatif / stratégique' (gardez) vs 'répétitif / mécanique' (automatisez). La plupart des gens découvrent que 40-60% de leur temps est automatisable."
        },
      ],
      example:  "Un consultant identifie : rédaction de comptes-rendus (3h/semaine, automatisable via Whisper + Claude), recherche documentaire (5h/semaine, automatisable via Perplexity + Claude), création de propositions (4h/unité, semi-automatisable). Gain potentiel : 10h/semaine.",
      tips:     ["Impliquez votre équipe si vous avez des collaborateurs — ils connaissent leurs propres pain points.", "Priorisez les automatisations qui libèrent votre temps de travail à haute valeur ajoutée."],
    },
    {
      id:       "5.2",
      title:    "Stratégie IA durable",
      type:     "lesson",
      duration: "30 min",
      intro:    "Adopter l'IA n'est pas un projet ponctuel — c'est une transformation progressive. Ce chapitre vous donne les clés pour une stratégie viable sur la durée, sans se disperser.",
      keyPoints: [
        {
          title: "La règle du 1% d'amélioration",
          text:  "Plutôt que de révolutionner tout d'un coup, améliorez 1 processus de 10% chaque semaine. En un trimestre, vous avez transformé 13 processus. L'accumulation crée une avance compétitive durable."
        },
        {
          title: "Gouvernance et qualité",
          text:  "L'IA produit des drafts, pas des finaux. Définissez des règles claires : quand réviser systématiquement, quels outputs nécessitent une validation humaine, comment maintenir votre ton de marque. Sans gouvernance, la qualité baisse."
        },
        {
          title: "Former son équipe (ou soi-même)",
          text:  "La résistance à l'IA vient du manque de confiance, pas du manque d'intérêt. Commencez par partager vos propres gains de temps concrets. Organisez des sessions pratiques de 30 min sur 1 cas d'usage spécifique. La preuve par l'exemple convertit."
        },
      ],
      example:  "Une PME de 8 personnes : mois 1 = formation équipe (outils de base), mois 2 = automatisation des réponses clients (-70% de temps), mois 3 = génération contenu marketing (3x plus de publications). ROI global en 6 mois : 40 000€ équivalent temps.",
      tips:     ["Documentez vos gains de temps — ça motive à continuer et justifie l'investissement.", "Restez curieux : les modèles s'améliorent chaque mois, révisez vos workflows régulièrement."],
    },
    {
      id:       "5.3",
      title:    "Votre plan d'action 90 jours",
      type:     "exercise",
      duration: "45 min",
      intro:    "Voici le moment de cristalliser tout ce que vous avez appris en un plan d'action concret. À la fin de cet exercice, vous aurez une roadmap IA personnalisée pour les 90 prochains jours.",
      exercise: {
        prompt: "Créez votre plan d'action IA 90 jours en passant par les 4 phases ci-dessous. Utilisez l'assistant IA pour vous aider à affiner chaque section — c'est le moment de mettre en pratique tout le cours.",
        hints: [
          "Phase 1 — Semaines 1-2 : Choisissez UN outil à maîtriser. Définissez 3 cas d'usage précis. Objectif : 30 min/jour pendant 14 jours.",
          "Phase 2 — Semaines 3-4 : Construisez votre première automatisation réelle. Mesurez le temps économisé. Ajustez si nécessaire.",
          "Phase 3 — Mois 2 : Déployez 2-3 automatisations supplémentaires. Identifiez les gains. Partagez avec 1 collègue ou client.",
          "Phase 4 — Mois 3 : Évaluez le ROI total. Identifiez les prochaines opportunités. Planifiez le trimestre suivant.",
        ],
      },
      tips:     ["Partagez votre plan avec quelqu'un — l'engagement public augmente de 65% les chances de réalisation.", "Rejoignez notre session de coaching mensuelle pour affiner votre plan avec l'expert DJAMA."],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════════════════════ */
export const COACHING_MODULES: Module[] = [M1, M2, M3, M4, M5];

export const TOTAL_CHAPTERS = COACHING_MODULES.reduce(
  (acc, m) => acc + m.chapters.length,
  0
);

export function getModuleById(id: string): Module | undefined {
  return COACHING_MODULES.find((m) => m.id === id);
}

export function getChapterById(moduleId: string, chapterId: string): Chapter | undefined {
  return getModuleById(moduleId)?.chapters.find((c) => c.id === chapterId);
}

/** Retourne le chapitre suivant (inter-modules) */
export function getNextChapter(
  moduleId: string,
  chapterId: string
): { moduleId: string; chapterId: string } | null {
  const modIdx  = COACHING_MODULES.findIndex((m) => m.id === moduleId);
  const module  = COACHING_MODULES[modIdx];
  if (!module) return null;

  const chapIdx = module.chapters.findIndex((c) => c.id === chapterId);
  if (chapIdx < module.chapters.length - 1) {
    return { moduleId, chapterId: module.chapters[chapIdx + 1].id };
  }
  if (modIdx < COACHING_MODULES.length - 1) {
    const nextMod = COACHING_MODULES[modIdx + 1];
    return { moduleId: nextMod.id, chapterId: nextMod.chapters[0].id };
  }
  return null;
}
