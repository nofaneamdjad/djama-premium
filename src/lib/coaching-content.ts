/* ─────────────────────────────────────────────────────────────
   Contenu pédagogique — Coaching IA DJAMA
   10 modules · 70 chapitres · leçons + exercices
─────────────────────────────────────────────────────────────── */

export type ChapterType = "lesson" | "exercise" | "quiz";
export interface KeyPoint { title: string; text: string; }
export interface Exercise { prompt: string; hints: string[]; }
export interface Chapter {
  id: string; title: string; type: ChapterType; duration: string; intro: string;
  keyPoints?: KeyPoint[]; example?: string; exercise?: Exercise;
  tips?: string[]; actions?: string[]; templates?: string[];
}
export interface Module {
  id: string; title: string; emoji: string; tagline: string;
  color: string; rgb: string; description: string; duration: string; chapters: Chapter[];
}

/* ══════════════════════════════════════════════════════════════
   MODULE 1 — COMPRENDRE L'IA
══════════════════════════════════════════════════════════════ */
const M1: Module = {
  id:"1", title:"Comprendre l'IA", emoji:"🧠",
  tagline:"Les fondations pour tout comprendre",
  color:"#60a5fa", rgb:"96,165,250",
  description:"Démystifiez l'intelligence artificielle : comment ça marche, ses limites, son histoire et les enjeux éthiques.",
  duration:"~90 min",
  chapters:[
    {
      id:"1.1", title:"Qu'est-ce que l'IA ?", type:"lesson", duration:"15 min",
      intro:"L'intelligence artificielle n'est pas de la magie — c'est un programme entraîné à reconnaître des patterns dans de grandes quantités de données.",
      keyPoints:[
        {title:"L'IA apprend par l'exemple", text:"Contrairement à un programme classique, un modèle d'IA est exposé à des millions d'exemples et apprend à généraliser. Plus les données sont riches, plus le modèle est capable."},
        {title:"IA générative vs discriminative", text:"L'IA discriminative classe (spam/pas spam). L'IA générative produit : texte, image, audio, code. ChatGPT, Claude et Gemini sont des LLM (Large Language Models)."},
        {title:"Ce que l'IA fait bien — et mal", text:"Excellente pour rédiger, résumer, coder, analyser. Elle peut halluciner (inventer des faits) et manquer de contexte récent."},
      ],
      example:"Quand vous demandez à ChatGPT de résumer un article, il prédit les tokens les plus probables. C'est de la prédiction statistique très sophistiquée.",
      tips:["Pensez à l'IA comme à un stagiaire très cultivé mais sans sens commun.","Toujours vérifier les faits importants."],
    },
    {
      id:"1.2", title:"Brève histoire de l'IA", type:"lesson", duration:"12 min",
      intro:"L'IA a 70 ans d'histoire. Comprendre les grandes étapes explique pourquoi tout s'accélère maintenant.",
      keyPoints:[
        {title:"1950-1980 : les premières règles", text:"Alan Turing pose les bases en 1950. Les premiers systèmes experts fonctionnent avec des règles codées à la main — puissants mais rigides."},
        {title:"1980-2010 : le machine learning", text:"On enseigne aux machines à apprendre depuis des données plutôt qu'à suivre des règles. Les réseaux de neurones progressent mais restent limités par la puissance de calcul."},
        {title:"2017-aujourd'hui : l'ère des transformers", text:"L'architecture Transformer (Google, 2017) révolutionne tout. GPT-3 (2020), ChatGPT (2022), GPT-4, Claude, Gemini — l'explosion est là."},
      ],
      example:"ChatGPT atteint 100 millions d'utilisateurs en 2 mois. Aucun produit technologique n'avait jamais grandi aussi vite.",
      tips:["L'accélération actuelle est réelle — pas du hype. Les modèles doublent de capacité tous les ~12 mois."],
    },
    {
      id:"1.3", title:"Comment fonctionne un LLM", type:"lesson", duration:"15 min",
      intro:"Comprendre les mécanismes internes d'un modèle de langage vous permet de mieux formuler vos demandes et d'anticiper ses réponses.",
      keyPoints:[
        {title:"Tokenisation", text:"Le texte est découpé en tokens (morceaux de mots). GPT-4 traite jusqu'à 128 000 tokens de contexte — environ 96 000 mots."},
        {title:"Attention et contexte", text:"Le mécanisme d'attention permet au modèle de relier chaque token à tous les autres dans le contexte. C'est ce qui donne l'impression de 'comprendre'."},
        {title:"Température et sampling", text:"La 'température' contrôle la créativité : basse = réponses prévisibles, haute = plus de créativité mais aussi plus d'erreurs."},
      ],
      example:"Si vous mettez un long document dans le contexte de Claude, il peut croiser des informations de la page 1 et de la page 50 pour répondre. C'est la fenêtre de contexte en action.",
      tips:["Plus votre prompt est précis, plus le modèle a de bons 'signaux' pour prédire la bonne réponse."],
    },
    {
      id:"1.4", title:"Les limites de l'IA", type:"lesson", duration:"12 min",
      intro:"Connaître les limites de l'IA vous évite les mauvaises surprises et vous rend plus efficace.",
      keyPoints:[
        {title:"Hallucinations", text:"L'IA invente des faits avec confiance. Sources inexistantes, chiffres faux, citations inventées. Toujours vérifier les données critiques."},
        {title:"Date de coupure", text:"Les modèles ont une date d'entraînement. Ils ne connaissent pas les événements récents sauf si on leur fournit l'information dans le prompt."},
        {title:"Manque de raisonnement profond", text:"L'IA suit des patterns statistiques — pas de vrai raisonnement logique. Elle peut échouer sur des problèmes simples présentés différemment."},
      ],
      example:"Demandez à un LLM 'combien de R dans strawberry ?' — certains modèles répondent 2 au lieu de 3. La tokenisation casse le comptage lettre par lettre.",
      tips:["Utilisez l'IA comme premier brouillon, pas comme source de vérité.","Pour les chiffres et faits précis, demandez toujours de citer ses sources."],
    },
    {
      id:"1.5", title:"Éthique et responsabilité IA", type:"lesson", duration:"15 min",
      intro:"Utiliser l'IA de façon éthique n'est pas optionnel — c'est ce qui distingue un professionnel d'un amateur.",
      keyPoints:[
        {title:"Biais dans les données", text:"Si les données d'entraînement sont biaisées, l'IA reproduit ces biais. Important à savoir pour les RH, la finance, le juridique."},
        {title:"Vie privée et confidentialité", text:"Ne jamais envoyer de données clients confidentielles dans un LLM public sans encadrement légal. Pensez RGPD."},
        {title:"Transparence", text:"Indiquer quand un contenu est produit avec IA dans les contextes où cela compte (journalisme, recherche, contrats)."},
      ],
      example:"En 2023, Samsung a accidentellement envoyé du code source confidentiel à ChatGPT. Résultat : données potentiellement utilisées pour l'entraînement du modèle.",
      tips:["Adoptez une politique IA dans votre entreprise avant de déployer à grande échelle.","Traitez les outputs IA comme des brouillons, pas des livrables finaux sans relecture."],
      actions:["Définir quelles données peuvent aller dans un LLM public","Créer une charte d'utilisation IA pour votre équipe"],
    },
    {
      id:"1.6", title:"L'IA dans votre secteur", type:"lesson", duration:"12 min",
      intro:"L'IA transforme chaque industrie différemment. Identifier les cas d'usage de votre secteur vous donne un avantage immédiat.",
      keyPoints:[
        {title:"Marketing & ventes", text:"Génération de contenu, personnalisation, scoring de leads, chatbots SAV, analyse de sentiment."},
        {title:"Finance & juridique", text:"Analyse de contrats, détection de fraude, résumé de rapports, due diligence accélérée."},
        {title:"Opérations & RH", text:"Tri de CV, onboarding automatisé, analyse de données, rapports automatiques, knowledge base interne."},
      ],
      example:"Un cabinet d'avocats utilise Claude pour analyser 500 pages de contrats en 10 minutes, repérant les clauses à risque. Ce travail prenait 3 jours à un junior.",
      tips:["Commencez par les tâches répétitives et chronophages de votre équipe — ce sont les gains les plus rapides."],
      actions:["Lister 5 tâches répétitives dans votre semaine","Tester l'IA sur 1 de ces tâches cette semaine"],
    },
    {
      id:"1.7", title:"Quiz : Fondations IA", type:"quiz", duration:"10 min",
      intro:"Testez vos connaissances sur les fondations de l'intelligence artificielle avant de passer au module suivant.",
      exercise:{
        prompt:"Répondez aux questions suivantes sans regarder vos notes. Pour chaque réponse, notez votre niveau de confiance (1-3).",
        hints:[
          "Quelle est la différence entre IA discriminative et IA générative ?",
          "Qu'est-ce qu'une hallucination dans le contexte des LLM ?",
          "Pourquoi les données d'entraînement influencent-elles les biais d'un modèle ?",
          "Citez 2 limites importantes des modèles de langage.",
          "Quelle architecture a révolutionné l'IA en 2017 ?",
        ]
      },
      tips:["Si vous hésitez sur une question, relisez le chapitre correspondant avant de continuer."],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MODULE 2 — PROMPT ENGINEERING
══════════════════════════════════════════════════════════════ */
const M2: Module = {
  id:"2", title:"Prompt Engineering", emoji:"✍️",
  tagline:"L'art de parler aux IA",
  color:"#a78bfa", rgb:"167,139,250",
  description:"Maîtrisez la science et l'art de formuler des instructions parfaites pour obtenir des résultats exceptionnels.",
  duration:"~95 min",
  chapters:[
    {
      id:"2.1", title:"Les bases du prompting", type:"lesson", duration:"15 min",
      intro:"Un bon prompt n'est pas un hasard. Il y a une structure qui multiplie par 10 la qualité des résultats.",
      keyPoints:[
        {title:"La formule RCTF", text:"Rôle (qui est l'IA), Contexte (la situation), Tâche (ce qu'elle doit faire), Format (comment présenter la réponse). Ces 4 éléments transforment vos résultats."},
        {title:"Soyez spécifique", text:"'Écris un email' → résultat moyen. 'Écris un email de relance de 3 paragraphes pour un prospect qui n'a pas répondu depuis 2 semaines, ton professionnel mais chaleureux' → excellent résultat."},
        {title:"Contexte avant tout", text:"Plus vous donnez de contexte, meilleur est le résultat. L'IA ne connaît pas votre business, votre ton, vos clients — dites-lui."},
      ],
      example:"Mauvais prompt : 'Résume cet article'. Bon prompt : 'Tu es expert en marketing. Résume cet article en 5 bullet points orientés action pour un entrepreneur e-commerce. Max 150 mots.'",
      templates:[
        "Rôle : Tu es [expert en X]. Contexte : [situation]. Tâche : [action précise]. Format : [bullet points / email / tableau / etc.]",
        "Agis comme [persona]. Mon problème est [X]. Donne-moi [N] solutions concrètes avec des exemples.",
      ],
    },
    {
      id:"2.2", title:"Techniques avancées", type:"lesson", duration:"15 min",
      intro:"Few-shot, chain-of-thought, role-playing... Ces techniques pro font la différence entre un utilisateur moyen et un expert.",
      keyPoints:[
        {title:"Few-shot prompting", text:"Donnez des exemples de ce que vous attendez. 'Voici 2 exemples du style que je veux : [ex1] [ex2]. Maintenant écris [X] dans ce style.'"},
        {title:"Chain-of-Thought (CoT)", text:"Demandez à l'IA de 'penser étape par étape'. Cela améliore drastiquement les raisonnements complexes, maths, et analyses."},
        {title:"Role-playing persistant", text:"Définissez un persona en début de conversation et maintenez-le. 'Pour toute cette conversation, tu es mon directeur marketing senior avec 15 ans d'expérience.'"},
      ],
      example:"Pour analyser un problème business : 'Réfléchis étape par étape. D'abord identifie le vrai problème, ensuite liste les causes racines, ensuite propose des solutions classées par impact/effort.'",
      templates:[
        "Voici un exemple de ce que je veux : [exemple]. Maintenant fais pareil pour : [ma demande]",
        "Pense étape par étape. Commençons par [étape 1], puis [étape 2], puis donne ta conclusion finale.",
      ],
    },
    {
      id:"2.3", title:"Prompts pour les entrepreneurs", type:"lesson", duration:"15 min",
      intro:"Des templates éprouvés pour les 10 situations business les plus fréquentes.",
      keyPoints:[
        {title:"Email et communication", text:"Emails de vente, de relance, de gestion de crise, de partenariat. L'IA peut rédiger en 30 secondes ce qui vous prendrait 30 minutes."},
        {title:"Stratégie et décision", text:"Analyser une opportunité, peser le pour/contre, créer un plan d'action, préparer une réunion. L'IA comme sparring partner."},
        {title:"Contenu et marketing", text:"Posts LinkedIn, newsletters, scripts vidéo, landing pages, FAQ. L'IA multiplie votre production de contenu."},
      ],
      templates:[
        "Je dois envoyer un email à [profil] pour [objectif]. Ton : [professionnel/décontracté]. Longueur : [X lignes]. Inclure : [CTA spécifique].",
        "Analyse cette opportunité business : [description]. Pros, cons, risques, ressources nécessaires. Recommandation finale.",
        "Crée 5 idées de posts LinkedIn sur [thème] pour une audience de [profil]. Format : accroche + 3 points + CTA.",
      ],
      actions:["Copier 3 templates et les tester aujourd'hui","Créer votre propre bibliothèque de prompts dans Notion ou un doc"],
    },
    {
      id:"2.4", title:"Itérer et affiner", type:"lesson", duration:"12 min",
      intro:"Le premier résultat n'est jamais le meilleur. L'art du prompting, c'est l'itération.",
      keyPoints:[
        {title:"La méthode AAAA", text:"Ask (demandez), Assess (évaluez), Adjust (ajustez), Again (recommencez). Chaque itération améliore le résultat."},
        {title:"Instructions négatives", text:"Dire à l'IA ce qu'elle NE doit PAS faire est aussi puissant que ce qu'elle doit faire. 'Ne pas utiliser de jargon technique. Ne pas dépasser 200 mots. Éviter les formules bateau.'"},
        {title:"Demander des variations", text:"'Donne-moi 3 versions de ce texte : une formelle, une décontractée, une percutante.' Choisissez le meilleur ou mélangez."},
      ],
      example:"Résultat décevant ? Dites : 'Ce n'est pas exactement ce que je voulais. Ce qui ne va pas : [X]. Refais en tenant compte de ça et en ajoutant [Y].'",
      tips:["Gardez les bons prompts dans un doc — c'est votre capital prompt.","Une conversation IA garde le contexte. Affinez dans la même conversation."],
    },
    {
      id:"2.5", title:"Bibliothèque de prompts DJAMA", type:"lesson", duration:"15 min",
      intro:"50 prompts testés et validés par l'équipe DJAMA pour les entrepreneurs et professionnels.",
      keyPoints:[
        {title:"Prompts de productivité", text:"Résumer des réunions, trier des emails, créer des agendas, rédiger des comptes-rendus, organiser sa semaine."},
        {title:"Prompts de création", text:"Brainstorming d'idées, noms de produits, slogans, scripts, storytelling de marque."},
        {title:"Prompts d'analyse", text:"Analyser des données, identifier des tendances, comparer des options, évaluer des risques."},
      ],
      templates:[
        "Résume cette réunion en : décisions prises, actions à faire (qui fait quoi avant quand), questions ouvertes. [coller notes]",
        "Génère 10 noms pour [produit/service] ciblant [audience]. Critères : mémorable, prononçable, disponible comme domaine.",
        "Compare ces 3 options : [A] vs [B] vs [C]. Critères : coût, temps, risque, impact. Tableau + recommandation.",
        "Identifie les 3 insights principaux dans ces données : [données]. Format : insight + preuve + action recommandée.",
      ],
      actions:["Sauvegarder cette bibliothèque dans vos favoris","Tester 5 prompts cette semaine sur de vrais problèmes"],
    },
    {
      id:"2.6", title:"Prompts multimodaux", type:"lesson", duration:"12 min",
      intro:"Les IA modernes traitent du texte, des images, des fichiers et du code. Exploitez toutes ces capacités.",
      keyPoints:[
        {title:"Analyser des images", text:"Envoyez une capture d'écran, un graphique, une photo de tableau blanc, un screenshot d'interface. Demandez : analyse, interprète, améliore."},
        {title:"Travailler avec des fichiers", text:"PDF, Excel, Word — les modèles comme Claude et GPT-4 peuvent lire et analyser des documents entiers. Révolution pour les contrats, rapports, études."},
        {title:"Génération de code", text:"Demandez du code, des scripts, des formules Excel/Google Sheets, des macros. Même sans savoir coder, vous pouvez automatiser."},
      ],
      example:"Envoyez une photo de votre tableau blanc de brainstorming à Claude : 'Analyse ce brainstorming, identifie les thèmes principaux, et propose une structure de projet.' 2 minutes de travail.",
      tips:["Pour les fichiers longs, dites à l'IA quelle partie vous intéresse en priorité."],
    },
    {
      id:"2.7", title:"Exercice : Construire vos prompts", type:"exercise", duration:"20 min",
      intro:"Mettez en pratique toutes les techniques apprises. Construisez 5 prompts sur mesure pour votre activité.",
      exercise:{
        prompt:"Créez 5 prompts personnalisés pour votre business en utilisant les techniques du module. Pour chaque prompt : situation déclenchante, prompt complet, résultat attendu.",
        hints:[
          "Utilisez la structure RCTF pour chaque prompt",
          "Incluez au moins 1 prompt avec few-shot (exemple inclus)",
          "Incluez au moins 1 prompt avec chain-of-thought",
          "Testez chaque prompt et notez le résultat",
          "Affinez avec la méthode AAAA si nécessaire",
        ]
      },
      actions:["Créer un doc 'Mes prompts DJAMA' pour centraliser vos meilleurs prompts","Partager vos 2 meilleurs prompts dans la communauté DJAMA"],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MODULE 3 — MAÎTRISER CHATGPT
══════════════════════════════════════════════════════════════ */
const M3: Module = {
  id:"3", title:"Maîtriser ChatGPT", emoji:"💬",
  tagline:"L'outil le plus utilisé au monde",
  color:"#34d399", rgb:"52,211,153",
  description:"De GPT-4o aux GPTs custom, maîtrisez chaque fonctionnalité de ChatGPT pour décupler votre productivité.",
  duration:"~100 min",
  chapters:[
    {
      id:"3.1", title:"Comprendre les modèles OpenAI", type:"lesson", duration:"12 min",
      intro:"GPT-4o, o1, o3, GPT-4 Turbo... Savoir quel modèle utiliser quand vous évite de gâcher du temps et de l'argent.",
      keyPoints:[
        {title:"GPT-4o — le couteau suisse", text:"Rapide, multimodal (texte+image+audio), excellent pour la plupart des tâches quotidiennes. Le modèle par défaut et le meilleur rapport vitesse/qualité."},
        {title:"o1 / o3 — le raisonneur", text:"Conçu pour les problèmes complexes : maths, code, raisonnement multi-étapes. Plus lent et plus cher, mais imbattable sur les sujets difficiles."},
        {title:"GPT-4 Turbo — l'équilibré", text:"Grande fenêtre de contexte (128k tokens), bon pour les longs documents. Légèrement moins créatif que 4o mais très fiable."},
      ],
      tips:["Utilisez GPT-4o pour 90% des tâches quotidiennes.","Passez sur o1 pour les analyses complexes, le code difficile, les décisions importantes.","Gardez GPT-4 Turbo pour les très longs documents."],
    },
    {
      id:"3.2", title:"Interface et raccourcis ChatGPT", type:"lesson", duration:"10 min",
      intro:"La plupart des utilisateurs n'exploitent que 20% des fonctionnalités de ChatGPT. Voici les 80% cachés.",
      keyPoints:[
        {title:"Custom Instructions", text:"Paramétrez ChatGPT une fois pour toutes : qui vous êtes, comment vous voulez qu'il réponde. Plus besoin de re-contextualiser à chaque conversation."},
        {title:"Mémoire persistante", text:"ChatGPT peut mémoriser des informations entre les sessions. Activez-la et dites-lui ce qu'il doit retenir sur vous et votre business."},
        {title:"Historique et organisation", text:"Renommez vos conversations, créez des projets. Organisez votre historique comme un second cerveau professionnel."},
      ],
      actions:["Configurer les Custom Instructions avec votre profil professionnel","Activer la mémoire et lui donner 5 informations clés sur votre business"],
    },
    {
      id:"3.3", title:"GPTs Custom — vos assistants sur mesure", type:"lesson", duration:"15 min",
      intro:"Créez des GPTs personnalisés pour des tâches récurrentes. Un GPT = un assistant spécialisé disponible en 1 clic.",
      keyPoints:[
        {title:"Qu'est-ce qu'un GPT custom ?", text:"Un GPT custom est ChatGPT pré-configuré avec des instructions, une personnalité, des documents de référence et des capacités spécifiques. Créez-le une fois, utilisez-le toujours."},
        {title:"Cas d'usage business", text:"Assistant recrutement (avec vos critères), rédacteur de posts LinkedIn (avec votre ton), analyste de contrats (avec vos templates), formateur (avec votre contenu)."},
        {title:"Création en 15 minutes", text:"ChatGPT Builder guide la création en langage naturel. Décrivez ce que vous voulez, uploadez vos documents, testez, publiez."},
      ],
      example:"Un entrepreneur a créé un GPT 'Commercial DJAMA' avec ses scripts de vente, ses objections fréquentes et son catalogue produits. Ses commerciaux l'utilisent pour préparer leurs appels.",
      actions:["Identifier 1 tâche récurrente pour laquelle créer votre premier GPT","Créer votre premier GPT custom cette semaine"],
      templates:["Tu es [nom du GPT], assistant spécialisé en [domaine] pour [entreprise]. Tu connais : [documents uploadés]. Ta mission : [objectif précis]. Ton ton : [style de communication]."],
    },
    {
      id:"3.4", title:"ChatGPT pour la recherche et l'analyse", type:"lesson", duration:"12 min",
      intro:"Avec la recherche web intégrée et l'analyse de données, ChatGPT devient un analyste de premier ordre.",
      keyPoints:[
        {title:"Recherche web temps réel", text:"ChatGPT avec browsing peut rechercher sur le web. Demandez des actualités récentes, des prix, des données de marché, des études récentes."},
        {title:"Analyse de fichiers CSV/Excel", text:"Uploadez vos données, demandez des analyses, des graphiques, des corrélations. Python s'exécute dans le sandbox sans que vous ayez à coder."},
        {title:"Synthèse multi-sources", text:"Donnez plusieurs documents à ChatGPT et demandez une synthèse comparative. Idéal pour la veille concurrentielle ou l'analyse de marché."},
      ],
      example:"Uploadez votre fichier de ventes mensuel : 'Analyse mes ventes des 12 derniers mois. Identifie les tendances, les produits les plus performants, les mois creux. Graphique inclus.'",
      actions:["Tester l'analyse de données avec un de vos fichiers Excel","Configurer une veille concurrentielle hebdomadaire avec ChatGPT"],
    },
    {
      id:"3.5", title:"ChatGPT pour créer du contenu", type:"lesson", duration:"15 min",
      intro:"Posts, newsletters, scripts, landing pages — ChatGPT peut générer du contenu engageant en quelques minutes.",
      keyPoints:[
        {title:"Trouver votre voix", text:"Donnez 3-5 exemples de vos meilleurs posts/emails à ChatGPT. Demandez-lui d'analyser votre style et de l'appliquer à nouveau contenu."},
        {title:"Le pipeline contenu IA", text:"Idée → brief → draft → révision → publication. L'IA accélère les étapes 2 et 3. Vous gardez le contrôle sur 1 et 4."},
        {title:"Recycler le contenu", text:"1 article → 5 posts LinkedIn → 1 newsletter → 3 tweets → 1 script vidéo. ChatGPT transforme 1 contenu en 10 formats différents."},
      ],
      templates:[
        "Voici mes 3 meilleurs posts : [posts]. Analyse mon style d'écriture, puis génère un nouveau post sur [sujet] dans ce même style.",
        "Transforme cet article en : 1 thread Twitter (10 tweets), 1 post LinkedIn (300 mots), 1 intro de newsletter (150 mots).",
      ],
    },
    {
      id:"3.6", title:"ChatGPT et le code", type:"lesson", duration:"15 min",
      intro:"Même sans savoir coder, ChatGPT vous permet d'automatiser, créer des outils et résoudre des problèmes techniques.",
      keyPoints:[
        {title:"Formules Excel et Google Sheets", text:"Décrivez ce que vous voulez calculer — ChatGPT génère la formule. RECHERCHEV, tableaux croisés, macros, scripts Google Apps."},
        {title:"Scripts d'automatisation", text:"Python, JavaScript, Zapier webhooks — demandez des scripts pour automatiser vos tâches répétitives. ChatGPT explique chaque ligne."},
        {title:"Débogage et amélioration", text:"Collez du code qui ne marche pas. ChatGPT identifie l'erreur, explique pourquoi, et propose la correction."},
      ],
      example:"'Crée une formule Google Sheets qui calcule le chiffre d'affaires par commercial, filtre ceux en dessous de l'objectif, et colore la cellule en rouge si c'est le cas.' — Aucun code requis de votre part.",
      actions:["Tester ChatGPT sur une formule Excel que vous ne savez pas écrire","Lui demander d'automatiser une tâche répétitive cette semaine"],
    },
    {
      id:"3.7", title:"Exercice : Workflow ChatGPT complet", type:"exercise", duration:"20 min",
      intro:"Construisez un workflow bout-en-bout avec ChatGPT pour un vrai cas d'usage de votre business.",
      exercise:{
        prompt:"Choisissez un processus de votre activité (onboarding client, création de proposition commerciale, préparation de réunion...) et construisez un workflow complet utilisant ChatGPT.",
        hints:[
          "Définir les étapes du processus actuel (sans IA)",
          "Identifier où l'IA peut intervenir (génération, analyse, résumé...)",
          "Créer les prompts pour chaque étape",
          "Tester le workflow avec un vrai cas",
          "Mesurer le temps gagné vs processus manuel",
        ]
      },
      actions:["Documenter votre workflow IA","Partager votre workflow dans la communauté DJAMA"],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MODULE 4 — MAÎTRISER CLAUDE (ANTHROPIC)
══════════════════════════════════════════════════════════════ */
const M4: Module = {
  id:"4", title:"Maîtriser Claude", emoji:"🎯",
  tagline:"L'IA la plus sûre et la plus nuancée",
  color:"#f97316", rgb:"249,115,22",
  description:"Claude d'Anthropic excelle sur les longs documents, le raisonnement nuancé et la sécurité. Maîtrisez ses capacités uniques.",
  duration:"~95 min",
  chapters:[
    {
      id:"4.1", title:"Claude vs ChatGPT — les vraies différences", type:"lesson", duration:"12 min",
      intro:"Claude et ChatGPT ne sont pas interchangeables. Chacun a des forces distinctes. Savoir lequel utiliser quand est un avantage compétitif.",
      keyPoints:[
        {title:"Points forts de Claude", text:"Fenêtre de contexte massive (200k tokens = 150 000 mots), excellent pour les longs documents. Raisonnement nuancé, moins de hallucinations, tone plus naturel."},
        {title:"L'approche Constitutional AI", text:"Anthropic a entraîné Claude avec des principes éthiques intégrés. Claude refuse moins brusquement, explique ses limites, et est plus fiable pour le contenu professionnel."},
        {title:"Claude Sonnet vs Opus vs Haiku", text:"Haiku = rapide/économique. Sonnet = équilibré (meilleur rapport qualité/vitesse). Opus = le plus puissant, pour les tâches complexes."},
      ],
      tips:["Utilisez Claude pour les longs documents, les analyses nuancées, le contenu éditorial.","Utilisez ChatGPT pour les GPTs custom, l'analyse de données, les intégrations plus larges."],
    },
    {
      id:"4.2", title:"Travailler avec de longs documents", type:"lesson", duration:"15 min",
      intro:"La capacité de Claude à traiter 200 000 tokens de contexte est sa superpower. Apprenez à l'exploiter.",
      keyPoints:[
        {title:"Analyser des contrats et rapports", text:"Uploadez un contrat de 50 pages. Demandez : clauses à risque, obligations de chaque partie, points de renégociation, résumé exécutif."},
        {title:"Recherche et synthèse", text:"Donnez 5 études de marché à Claude. Demandez une synthèse comparative, les tendances communes, les points de divergence."},
        {title:"Extraction structurée", text:"'Extrait de ce document : tous les chiffres clés, toutes les dates importantes, tous les noms de personnes mentionnées. Format tableau.'"},
      ],
      example:"Un investisseur envoie 3 business plans à Claude : 'Compare ces 3 projets sur : équipe, marché, modèle de revenus, risques. Tableau comparatif + recommandation motivée.'",
      templates:[
        "Voici un document de [X pages]. Ta mission : 1) Résumé exécutif (200 mots), 2) 5 points clés, 3) Questions que je devrais poser à l'auteur.",
        "Analyse ce contrat. Identifie : clauses favorables / défavorables pour moi, risques cachés, points de renégociation prioritaires.",
      ],
    },
    {
      id:"4.3", title:"Claude pour la rédaction avancée", type:"lesson", duration:"15 min",
      intro:"Claude est reconnu pour la qualité de sa rédaction. Voici comment obtenir le meilleur de ses capacités éditoriales.",
      keyPoints:[
        {title:"Garder votre voix", text:"Donnez des exemples de votre style, indiquez votre audience, vos valeurs. Claude adapte son ton avec une précision remarquable."},
        {title:"Rédaction longue forme", text:"Articles de fond, livres blancs, études de cas, rapports annuels. Claude maintient la cohérence sur de longs documents mieux que tout autre modèle."},
        {title:"Relecture et amélioration", text:"Collez votre texte : 'Améliore ce texte en gardant mon style. Critères : clarté, impact, fluidité. Explique chaque modification.'"},
      ],
      templates:[
        "Voici 2 exemples de mon style d'écriture : [ex1] [ex2]. Maintenant rédige [contenu] en adoptant exactement ce style.",
        "Améliore ce texte : [texte]. Garde mon ton personnel. Améliore : structure, clarté, impact émotionnel. Liste les changements faits.",
      ],
    },
    {
      id:"4.4", title:"Les projets Claude", type:"lesson", duration:"12 min",
      intro:"Les Projets de Claude vous permettent de donner un contexte permanent à l'IA — votre business, vos documents, vos instructions.",
      keyPoints:[
        {title:"Créer un projet", text:"Un Projet = un espace avec des documents uploadés + des instructions systèmes. Claude a accès à tout ce contexte dans chaque conversation du projet."},
        {title:"Cas d'usage", text:"Projet 'Mon Business' : uploadez votre business plan, vos personas clients, vos guidelines marque. Claude les intègre sans que vous ayez à re-expliquer."},
        {title:"Collaboration", text:"Partagez un projet avec votre équipe. Tout le monde accède au même Claude contextéualisé avec les mêmes documents de référence."},
      ],
      actions:["Créer un projet Claude pour votre business","Uploader vos 3 documents les plus importants (business plan, personas, guidelines)"],
    },
    {
      id:"4.5", title:"Claude API et intégrations", type:"lesson", duration:"15 min",
      intro:"L'API Claude vous permet d'intégrer ses capacités dans vos outils, workflows et applications.",
      keyPoints:[
        {title:"Quand utiliser l'API", text:"Pour automatiser des traitements à grande échelle, intégrer l'IA dans vos outils internes, créer des workflows sans intervention manuelle."},
        {title:"Sans code avec Zapier/Make", text:"Connectez Claude à vos outils via Zapier ou Make.com sans programmer. Email entrant → Claude analyse → résumé envoyé dans Slack."},
        {title:"Avec code (Python/Node)", text:"L'API Anthropic est simple. 10 lignes de Python suffisent pour automatiser n'importe quelle tâche IA dans votre stack technique."},
      ],
      example:"Un entrepreneur connecte son CRM à Claude via Zapier : chaque nouveau lead reçoit une fiche personnalisée générée par Claude en fonction de son profil LinkedIn scrappé.",
      actions:["Créer un compte sur console.anthropic.com","Tester 1 automatisation simple avec Zapier + Claude"],
    },
    {
      id:"4.6", title:"Claude pour le code et la technique", type:"lesson", duration:"12 min",
      intro:"Claude excelle dans l'assistance technique. Que vous soyez développeur ou non, découvrez ses capacités.",
      keyPoints:[
        {title:"Génération de code de qualité", text:"Claude génère du code propre avec des commentaires. Il explique chaque choix et propose des alternatives. Idéal pour les scripts d'automatisation."},
        {title:"Architecture et review", text:"Demandez à Claude de reviewer votre code, de proposer des architectures, d'identifier les problèmes de sécurité ou de performance."},
        {title:"Debugging et explication", text:"Collez une erreur ou un code qui ne marche pas. Claude identifie le problème, explique pourquoi, et propose une solution complète."},
      ],
      templates:[
        "Voici mon code : [code]. Il produit cette erreur : [erreur]. Explique la cause et donne la correction complète.",
        "Crée un script Python qui [fait X]. Il doit être : bien commenté, gestion d'erreurs incluse, exemple d'utilisation dans les commentaires.",
      ],
    },
    {
      id:"4.7", title:"Exercice : Claude en conditions réelles", type:"exercise", duration:"20 min",
      intro:"Travaillez avec Claude sur un vrai document ou problème de votre activité.",
      exercise:{
        prompt:"Choisissez un document réel de votre activité (contrat, rapport, étude, présentation) et utilisez Claude pour en extraire de la valeur maximale.",
        hints:[
          "Uploader le document dans Claude",
          "Demander un résumé exécutif",
          "Demander 5 insights actionnables",
          "Poser 3 questions spécifiques sur le contenu",
          "Demander une recommandation basée sur l'analyse",
        ]
      },
      actions:["Créer votre premier projet Claude","Configurer les instructions système avec votre contexte business"],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MODULE 5 — GEMINI, MISTRAL & LES AUTRES IA
══════════════════════════════════════════════════════════════ */
const M5: Module = {
  id:"5", title:"Gemini, Mistral & Autres", emoji:"🌐",
  tagline:"L'écosystème IA complet",
  color:"#06b6d4", rgb:"6,182,212",
  description:"Au-delà de ChatGPT et Claude — Gemini, Mistral, Perplexity, DALL-E, Midjourney et l'IA image/audio.",
  duration:"~90 min",
  chapters:[
    {
      id:"5.1", title:"Google Gemini — l'IA de l'écosystème Google", type:"lesson", duration:"15 min",
      intro:"Gemini est l'IA native de Google. Son intégration dans Gmail, Docs, Drive et Meet en fait un outil incontournable si vous utilisez Google Workspace.",
      keyPoints:[
        {title:"Gemini 1.5 Pro / Ultra", text:"Fenêtre de contexte d'1 million de tokens (record mondial). Excellent pour l'analyse de vidéos, de longs documents et les projets multimodaux."},
        {title:"Gemini dans Google Workspace", text:"Gmail : rédige et résume des emails. Docs : génère et améliore du contenu. Sheets : analyse de données. Meet : transcriptions et résumés automatiques."},
        {title:"Google AI Studio", text:"Accès gratuit aux modèles Gemini pour tester et prototyper. NotebookLM pour transformer des documents en podcast ou quiz automatiquement."},
      ],
      example:"NotebookLM de Google transforme votre business plan en un podcast de 10 minutes avec 2 hôtes IA qui débattent de vos idées. Parfait pour créer du contenu formation.",
      actions:["Activer Gemini dans votre Gmail et tester le résumé d'emails","Tester NotebookLM avec un document important"],
    },
    {
      id:"5.2", title:"Mistral — l'IA européenne open source", type:"lesson", duration:"12 min",
      intro:"Mistral AI est la startup française qui révolutionne l'IA open source. Souveraineté des données, performances compétitives, prix imbattables.",
      keyPoints:[
        {title:"Pourquoi Mistral", text:"Données hébergées en Europe (RGPD), modèles open source (vous pouvez les héberger vous-même), excellent rapport qualité/prix pour les entreprises."},
        {title:"Les modèles Mistral", text:"Mistral 7B : léger et rapide. Mixtral 8x7B : très performant. Mistral Large : concurrent direct de GPT-4. Le Chat : interface gratuite."},
        {title:"Cas d'usage entreprise", text:"Idéal pour les entreprises avec des contraintes RGPD strictes, les secteurs réglementés (santé, finance, juridique), et les déploiements à grande échelle."},
      ],
      tips:["Si vous gérez des données sensibles, Mistral hébergé en Europe est souvent le meilleur choix réglementaire."],
    },
    {
      id:"5.3", title:"Perplexity — l'IA pour la recherche", type:"lesson", duration:"10 min",
      intro:"Perplexity est le meilleur outil pour la recherche IA — citations vérifiées, sources en temps réel, interface idéale pour la veille.",
      keyPoints:[
        {title:"Recherche avec citations", text:"Contrairement à ChatGPT, Perplexity cite ses sources pour chaque affirmation. Chaque réponse est vérifiable. Révolution pour la recherche professionnelle."},
        {title:"Spaces — la veille automatisée", text:"Créez un Space Perplexity sur votre marché, vos concurrents ou votre technologie. Il surveille et résume les actualités automatiquement."},
        {title:"Pro Search", text:"Mode de recherche approfondie qui consulte 20+ sources, synthétise et structure. Équivalent d'1h de recherche manuelle en 30 secondes."},
      ],
      actions:["Configurer un Space Perplexity pour surveiller votre marché","Utiliser Perplexity pour votre prochaine étude de marché"],
    },
    {
      id:"5.4", title:"IA image — DALL-E, Midjourney, Stable Diffusion", type:"lesson", duration:"15 min",
      intro:"L'IA génère des images professionnelles en quelques secondes. Révolution pour le marketing, la communication et le design.",
      keyPoints:[
        {title:"DALL-E 3 (OpenAI)", text:"Intégré à ChatGPT. Excellent pour les illustrations business, les visuels de présentation, les mockups. Prompt en langage naturel, résultats cohérents."},
        {title:"Midjourney", text:"Le standard professionnel pour les visuels haute qualité, art et photographie IA. Communauté Discord, qualité esthétique supérieure, courbe d'apprentissage plus élevée."},
        {title:"Stable Diffusion", text:"Open source, hébergeable, personnalisable. Pour les équipes tech qui veulent un contrôle total et des coûts limités à grande échelle."},
      ],
      templates:[
        "Professional photo of [sujet], [style photographique], [éclairage], [contexte], high quality, 4K",
        "Minimalist flat design illustration of [concept], [palette de couleurs], [style graphique], for business presentation",
      ],
      actions:["Générer vos visuels de la semaine avec DALL-E 3","Tester Midjourney pour un projet créatif"],
    },
    {
      id:"5.5", title:"IA audio et vidéo", type:"lesson", duration:"12 min",
      intro:"Clonage vocal, génération vidéo, transcription automatique — l'IA audio-visuelle transforme la création de contenu.",
      keyPoints:[
        {title:"Transcription avec Whisper / AssemblyAI", text:"Transcrivez vos réunions, podcasts, interviews en texte en quelques minutes. Recherche dans vos transcriptions, résumés automatiques."},
        {title:"Génération vocale — ElevenLabs", text:"Clonez votre voix ou utilisez des voix IA pour créer des narrations, podcasts, contenus de formation. Multilingue, qualité professionnelle."},
        {title:"Génération vidéo — Runway, Sora", text:"Génération vidéo à partir de texte ou d'images. Encore en émergence mais évolue très vite. Parfait pour les visuels B-roll et transitions."},
      ],
      actions:["Tester Whisper pour transcrire votre prochaine réunion","Explorer ElevenLabs pour vos contenus de formation"],
    },
    {
      id:"5.6", title:"Choisir le bon outil pour chaque tâche", type:"lesson", duration:"10 min",
      intro:"La bonne IA au bon moment — une grille de décision pour ne plus jamais se demander quel outil utiliser.",
      keyPoints:[
        {title:"Matrice de décision", text:"Texte/rédaction long → Claude. Recherche vérifiée → Perplexity. Workflow Google → Gemini. Données sensibles EU → Mistral. Image professionnelle → DALL-E / Midjourney."},
        {title:"Multi-IA workflow", text:"Les meilleurs utilisateurs combinent les IA. Ex : Perplexity pour la recherche → Claude pour la synthèse → ChatGPT pour créer le contenu final."},
        {title:"Coûts et ROI", text:"ChatGPT Plus : 20$/mois. Claude Pro : 20$/mois. Gemini Advanced : 20$/mois. 1 seul abonnement bien utilisé = centaines d'heures économisées."},
      ],
      tips:["Commencez avec 1 seul outil. Maîtrisez-le à 80% avant d'en ajouter un second.","Le ROI de l'IA se mesure en temps gagné × valeur de votre heure."],
    },
    {
      id:"5.7", title:"Exercice : Tour d'horizon des IA", type:"exercise", duration:"15 min",
      intro:"Testez 3 IA différentes sur la même tâche pour comparer les résultats.",
      exercise:{
        prompt:"Prenez une vraie tâche de votre travail. Soumettez-la à ChatGPT, Claude ET Gemini (ou Perplexity). Comparez les résultats.",
        hints:[
          "Utiliser exactement le même prompt sur les 3 outils",
          "Noter la qualité du résultat (1-5)",
          "Noter la vitesse de réponse",
          "Identifier les différences de style et d'approche",
          "Décider quel outil sera votre go-to pour ce type de tâche",
        ]
      },
      actions:["Créer votre matrice personnelle IA : tâche → meilleur outil","Partager vos conclusions dans la communauté DJAMA"],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MODULE 6 — AUTOMATISATION & WORKFLOWS IA
══════════════════════════════════════════════════════════════ */
const M6: Module = {
  id:"6", title:"Automatisation & Workflows", emoji:"⚡",
  tagline:"Travaillez moins, produisez plus",
  color:"#fbbf24", rgb:"251,191,36",
  description:"Zapier, Make, n8n, agents IA — automatisez vos processus répétitifs et libérez votre temps pour les tâches à haute valeur.",
  duration:"~100 min",
  chapters:[
    {
      id:"6.1", title:"Les bases de l'automatisation", type:"lesson", duration:"12 min",
      intro:"L'automatisation n'est plus réservée aux développeurs. Avec les outils no-code d'aujourd'hui, n'importe qui peut automatiser en quelques heures.",
      keyPoints:[
        {title:"Trigger → Action", text:"Tout workflow d'automatisation suit ce schéma : un événement déclencheur (nouveau email, nouveau lead, nouvelle tâche) → une ou plusieurs actions automatiques."},
        {title:"Les outils no-code", text:"Zapier (le plus accessible), Make/Integromat (plus puissant), n8n (open source, auto-hébergeable). Ces 3 outils couvrent 99% des cas d'usage."},
        {title:"IA + automatisation = puissance maximale", text:"L'IA traite le contenu non structuré (emails, textes, images). L'automatisation orchestre les actions. Ensemble, ils créent des workflows intelligents."},
      ],
      actions:["Lister vos 5 tâches les plus répétitives","Identifier laquelle automatiser en premier (impact × faisabilité)"],
    },
    {
      id:"6.2", title:"Zapier — automatiser sans coder", type:"lesson", duration:"15 min",
      intro:"Zapier connecte 6000+ applications. Apprenez à créer vos premiers workflows en 30 minutes.",
      keyPoints:[
        {title:"Zaps essentiels pour entrepreneurs", text:"Nouveau formulaire → créer contact CRM + envoyer email de bienvenue. Nouveau client Stripe → créer projet dans Notion. Mention réseaux sociaux → notification Slack."},
        {title:"Intégrer l'IA dans Zapier", text:"L'action 'ChatGPT' de Zapier permet d'intégrer une étape IA dans tout workflow. Ex : email entrant → ChatGPT résume + classe → créer tâche dans Asana."},
        {title:"Multi-step Zaps", text:"Un trigger peut déclencher 10+ actions en chaîne. Créez des workflows complets : de la capture de lead à l'onboarding complet, 100% automatisé."},
      ],
      example:"Nouveau lead sur LinkedIn → Zapier capture les infos → Claude génère une analyse du profil → Email personnalisé envoyé automatiquement en 3 minutes.",
      actions:["Créer votre compte Zapier gratuit","Créer votre premier Zap simple cette semaine"],
    },
    {
      id:"6.3", title:"Make (ex-Integromat) — workflows avancés", type:"lesson", duration:"15 min",
      intro:"Make est plus puissant que Zapier pour les workflows complexes. Interface visuelle, logique conditionnelle, transformations de données.",
      keyPoints:[
        {title:"Scénarios visuels", text:"Make permet de visualiser votre workflow comme un diagramme. Idéal pour les processus complexes avec des conditions, des boucles, des transformations."},
        {title:"Transformations de données", text:"Formatez, filtrez, transformez les données entre les étapes. Calculez des valeurs, créez des conditions if/else, gérez les erreurs."},
        {title:"Templates Make + IA", text:"Des centaines de templates disponibles pour des cas d'usage courants : CRM enrichment, analyse de tickets SAV, génération de rapports automatiques."},
      ],
      tips:["Commencez par Zapier pour les cas simples. Passez à Make quand vous avez besoin de logique plus complexe."],
    },
    {
      id:"6.4", title:"n8n — l'automatisation open source", type:"lesson", duration:"12 min",
      intro:"n8n est la solution pour les entreprises qui veulent le contrôle total : auto-hébergé, open source, aucune limite de volume.",
      keyPoints:[
        {title:"Pourquoi n8n", text:"Gratuit si auto-hébergé, data souveraineté totale, 400+ intégrations natives. Idéal pour les gros volumes (10 000+ opérations/mois) ou les données sensibles."},
        {title:"AI Agent nodes", text:"n8n a des nodes IA natifs : ChatGPT, Claude, Gemini. Créez des agents IA complexes qui prennent des décisions et s'auto-corrigent."},
        {title:"Installation en 15 minutes", text:"Via Docker ou Railway.app (hébergement cloud). Interface similaire à Make mais plus technique. Documentation excellente."},
      ],
      actions:["Évaluer si n8n correspond à vos besoins (volume, contraintes data)","Tester le cloud n8n gratuit (essai 14 jours)"],
    },
    {
      id:"6.5", title:"Les 10 workflows IA indispensables", type:"lesson", duration:"15 min",
      intro:"Ces 10 workflows automatisés représentent les gains de productivité les plus rapides pour un entrepreneur.",
      keyPoints:[
        {title:"Workflows communication", text:"1) Triage et résumé des emails. 2) Réponses automatiques aux demandes standard. 3) Compte-rendu de réunion auto. 4) Veille concurrentielle quotidienne."},
        {title:"Workflows commercial", text:"5) Enrichissement de leads CRM. 6) Séquence d'onboarding client automatisée. 7) Scoring et priorisation des opportunités."},
        {title:"Workflows contenu", text:"8) Pipeline de création de contenu (idée→draft→publication). 9) Recyclage automatique de contenu sur plusieurs formats. 10) Rapport de performance hebdomadaire."},
      ],
      actions:["Choisir 2 workflows à implémenter ce mois","Documenter le ROI estimé avant implémentation"],
    },
    {
      id:"6.6", title:"Agents IA autonomes", type:"lesson", duration:"15 min",
      intro:"Un agent IA peut prendre des décisions, utiliser des outils, et accomplir des tâches de bout en bout sans supervision continue.",
      keyPoints:[
        {title:"Qu'est-ce qu'un agent", text:"Un agent IA a un objectif, accès à des outils (recherche web, email, calendrier, CRM), et peut planifier et exécuter des actions de façon autonome."},
        {title:"AutoGPT et alternatives", text:"AutoGPT, CrewAI, LangChain Agents, Claude Tools use — des frameworks pour créer des agents qui exécutent des tâches complexes en chaîne."},
        {title:"Limites et supervision", text:"Les agents font encore des erreurs. Toujours définir des limites claires, réviser les actions critiques, et commencer avec des tâches à faible risque."},
      ],
      example:"Un agent de veille : chaque matin, recherche les actualités de votre secteur, identifie les 3 plus importantes, rédige un résumé, l'envoie par email. Zéro intervention manuelle.",
      actions:["Identifier 1 tâche de recherche/veille à confier à un agent","Tester un agent simple avec les tools use de Claude"],
    },
    {
      id:"6.7", title:"Exercice : Construire votre stack IA", type:"exercise", duration:"20 min",
      intro:"Dessinez et implémentez votre stack d'automatisation IA personnalisé.",
      exercise:{
        prompt:"Créez un schéma de votre stack IA idéale : quels outils, quelles connexions, quels workflows. Puis implémentez le workflow le plus impactant.",
        hints:[
          "Lister tous vos outils actuels (CRM, email, project management...)",
          "Identifier les connexions manquantes (où perdez-vous du temps en copier-coller ?)",
          "Choisir 1 workflow à automatiser en priorité",
          "Implémenter avec Zapier ou Make",
          "Mesurer le temps gagné sur 1 semaine",
        ]
      },
      actions:["Créer votre carte de stack IA","Implémenter 1 workflow cette semaine"],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MODULE 7 — IA POUR ENTREPRENEURS
══════════════════════════════════════════════════════════════ */
const M7: Module = {
  id:"7", title:"IA pour Entrepreneurs", emoji:"🚀",
  tagline:"Croissance, ventes et opérations dopés par l'IA",
  color:"#ec4899", rgb:"236,72,153",
  description:"Prospection, marketing, service client, gestion financière — toutes les applications IA concrètes pour développer votre business.",
  duration:"~100 min",
  chapters:[
    {
      id:"7.1", title:"IA et prospection commerciale", type:"lesson", duration:"15 min",
      intro:"L'IA peut multiplier par 5 votre capacité de prospection tout en personnalisant chaque contact.",
      keyPoints:[
        {title:"Qualification de leads", text:"Utilisez l'IA pour scorer vos leads : analyse du profil LinkedIn, du site web, des signaux d'achat. Concentrez-vous sur les 20% qui valent 80% de votre temps."},
        {title:"Personnalisation à l'échelle", text:"Générez des emails de prospection ultra-personnalisés en masse. L'IA analyse le profil de chaque prospect et rédige un message sur mesure."},
        {title:"Séquences de nurturing", text:"Créez des séquences email automatisées avec l'IA qui adapte le contenu selon les actions du prospect (ouverture, clic, réponse)."},
      ],
      templates:[
        "Prospect : [nom, poste, entreprise, taille, secteur]. Rédige un email de premier contact de 4 lignes qui : cite un problème spécifique de son secteur, propose une solution précise, CTA clair.",
        "Crée une séquence de 5 emails de nurturing pour [persona]. Email 1 : valeur pure. Email 2 : cas client. Email 3 : contenu éducatif. Email 4 : offre. Email 5 : follow-up.",
      ],
      actions:["Tester l'IA sur 10 emails de prospection personnalisés","Mesurer le taux d'ouverture vs vos emails manuels"],
    },
    {
      id:"7.2", title:"IA et stratégie marketing", type:"lesson", duration:"15 min",
      intro:"De la segmentation à la création de campagnes, l'IA révolutionne le marketing.",
      keyPoints:[
        {title:"Segmentation et personas", text:"Demandez à l'IA d'analyser vos données clients et de créer des segments et personas détaillés. Puis adaptez votre communication à chaque segment."},
        {title:"Copywriting et A/B testing", text:"Générez 10 versions d'une landing page ou d'un objet d'email. A/B testez rapidement pour trouver ce qui convertit le mieux."},
        {title:"Analyse de campagnes", text:"Donnez vos données de campagne à l'IA. Elle identifie les patterns de succès, les points faibles, et recommande des optimisations."},
      ],
      templates:[
        "Voici mes données clients : [données]. Identifie 3 segments distincts. Pour chaque segment : profil détaillé, besoins principaux, message marketing optimal, canal préféré.",
        "Crée 5 variations d'objet email pour cette campagne : [description campagne]. Critères : curiosité, urgence, bénéfice clair. Pour chaque variation, explique le levier psychologique utilisé.",
      ],
    },
    {
      id:"7.3", title:"IA et service client", type:"lesson", duration:"12 min",
      intro:"Réduire les coûts du SAV tout en améliorant la satisfaction client — l'IA rend cela possible.",
      keyPoints:[
        {title:"Chatbots IA intelligents", text:"Pas les chatbots basiques de 2015 — les chatbots IA comprennent le contexte, traitent les demandes complexes et escaladent intelligemment vers un humain."},
        {title:"Résumé et triage des tickets", text:"L'IA catégorise, priorise et résume les tickets entrants. Vos agents humains se concentrent sur les cas complexes à haute valeur."},
        {title:"Base de connaissances IA", text:"Transformez vos emails de support en FAQ automatique. L'IA extrait les questions fréquentes et génère des réponses standardisées."},
      ],
      example:"Une PME a réduit son volume de tickets de 40% en déployant un chatbot IA avec Claude. Les 60% restants arrivent au support humain avec un résumé IA et une réponse suggérée.",
      actions:["Analyser les 20 emails de support les plus fréquents","Créer une FAQ IA à partir de ces emails"],
    },
    {
      id:"7.4", title:"IA et gestion de projet", type:"lesson", duration:"12 min",
      intro:"Planification, suivi, comptes-rendus — l'IA réduit la charge administrative pour que vous vous concentriez sur l'essentiel.",
      keyPoints:[
        {title:"Planification de projet", text:"Décrivez un projet à l'IA. Elle génère : structure WBS, jalons, ressources nécessaires, risques, plan de communication. En 5 minutes."},
        {title:"Comptes-rendus automatiques", text:"Enregistrez vos réunions → transcription automatique → compte-rendu structuré (décisions, actions, responsables, dates) généré par l'IA."},
        {title:"Suivi et reporting", text:"L'IA analyse l'avancement de votre projet, identifie les retards, calcule les impacts, et génère le rapport de statut hebdomadaire."},
      ],
      templates:[
        "Voici mon projet : [description]. Génère un plan de projet complet : phases, tâches, durées estimées, dépendances, risques principaux. Format : tableau.",
        "Voici les notes de réunion : [notes]. Génère le compte-rendu officiel : décisions prises, actions à faire (responsable + date), points en suspens, prochaine réunion.",
      ],
    },
    {
      id:"7.5", title:"IA et finances", type:"lesson", duration:"12 min",
      intro:"Analyse financière, prévisions, reporting — l'IA démocratise les capacités d'un analyste financier senior.",
      keyPoints:[
        {title:"Analyse de données financières", text:"Uploadez vos P&L, bilans, tableaux de bord dans Claude ou ChatGPT. Demandez : tendances, anomalies, comparaisons, recommandations."},
        {title:"Prévisions et scenarios", text:"L'IA peut modéliser des scenarios (optimiste/réaliste/pessimiste) basés sur vos données historiques. Utile pour les présentations investisseurs."},
        {title:"Préparation des réunions financières", text:"Donnez vos chiffres à l'IA, elle prépare les questions probables de votre banquier ou investisseur, et les meilleures réponses."},
      ],
      tips:["Ne donnez jamais de données financières confidentielles à un LLM public. Utilisez Claude Team ou Enterprise avec confidentialité garantie."],
    },
    {
      id:"7.6", title:"IA et ressources humaines", type:"lesson", duration:"10 min",
      intro:"Recrutement, formation, évaluation de performances — l'IA transforme la gestion des talents.",
      keyPoints:[
        {title:"Recrutement IA", text:"Rédaction d'offres d'emploi optimisées, tri de CV (sans biais de nommage), questions d'entretien personnalisées par poste, scoring des candidats."},
        {title:"Onboarding automatisé", text:"L'IA crée des parcours d'onboarding personnalisés, répond aux questions des nouveaux employés, et génère le contenu de formation."},
        {title:"Feedback et évaluation", text:"L'IA aide à rédiger des évaluations équilibrées et constructives, à identifier les gaps de compétences, à créer des plans de développement."},
      ],
      templates:[
        "Rédige une offre d'emploi pour [poste] dans une [type d'entreprise]. Inclure : missions (5 bullets), profil recherché, soft skills clés, ce qu'on offre. Ton : engageant et honnête.",
        "Voici le CV de [candidat] pour le poste [X]. Évalue sur : compétences requises (score 1-5), expérience pertinente, points forts, points d'attention. Recommandation finale.",
      ],
    },
    {
      id:"7.7", title:"Construire votre roadmap IA", type:"exercise", duration:"20 min",
      intro:"Créez votre plan personnel d'implémentation de l'IA dans votre business sur 90 jours.",
      exercise:{
        prompt:"Définissez votre roadmap IA personnelle : quels cas d'usage, dans quel ordre, avec quels outils, pour quels résultats mesurables.",
        hints:[
          "Lister tous les cas d'usage IA potentiels pour votre business",
          "Évaluer chaque cas : impact potentiel (1-5) × facilité d'implémentation (1-5)",
          "Sélectionner le top 5 pour commencer",
          "Planifier : semaine 1-4 (quick wins), mois 2 (consolidation), mois 3 (avancé)",
          "Définir 3 métriques de succès mesurables",
        ]
      },
      actions:["Finaliser votre roadmap IA 90 jours","Partager dans la communauté pour feedback"],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MODULE 8 — CRÉATION DE CONTENU IA
══════════════════════════════════════════════════════════════ */
const M8: Module = {
  id:"8", title:"Création de Contenu IA", emoji:"✨",
  tagline:"Multipliez votre production de contenu",
  color:"#8b5cf6", rgb:"139,92,246",
  description:"LinkedIn, newsletters, vidéos, podcasts, images, SEO — maîtrisez la création de contenu assistée par IA pour toutes les plateformes.",
  duration:"~95 min",
  chapters:[
    {
      id:"8.1", title:"Stratégie de contenu IA", type:"lesson", duration:"12 min",
      intro:"Avant de créer, stratégisez. L'IA vous aide à définir votre stratégie de contenu avec une précision qui prenait des semaines manuellement.",
      keyPoints:[
        {title:"Audit de contenu", text:"Donnez vos anciens posts/articles à l'IA. Elle identifie ce qui a performé, pourquoi, les thèmes porteurs, et les gaps à combler."},
        {title:"Calendrier éditorial automatique", text:"Décrivez votre audience, vos objectifs et vos thèmes clés. L'IA génère 3 mois de calendrier éditorial avec idées de contenu pour chaque format."},
        {title:"Veille et trending topics", text:"Perplexity + ChatGPT pour surveiller les tendances de votre secteur et identifier les sujets qui buzz avant vos concurrents."},
      ],
      actions:["Générer votre calendrier éditorial des 30 prochains jours avec l'IA","Auditer vos 10 meilleurs posts passés"],
    },
    {
      id:"8.2", title:"LinkedIn — bâtir votre audience", type:"lesson", duration:"15 min",
      intro:"LinkedIn est la plateforme B2B la plus puissante. L'IA vous permet de maintenir une présence forte sans y passer des heures.",
      keyPoints:[
        {title:"Le framework post viral", text:"Accroche (problème/question/chiffre surprenant) + Développement (3-5 bullets) + Retournement/insight + CTA. L'IA maîtrise ce format parfaitement."},
        {title:"Ton et authenticité", text:"L'IA peut imiter votre style. Donnez 5-10 de vos meilleurs posts comme exemples. Elle générera du contenu qu'on jurerait que vous avez écrit."},
        {title:"Engagement et commentaires", text:"L'IA génère des premières réponses aux commentaires, des follow-up questions pour prolonger les conversations, des remerciements personnalisés."},
      ],
      templates:[
        "Crée un post LinkedIn sur [sujet] pour [audience]. Format : accroche forte (1 ligne), 5 bullets actionnables, 1 insight contre-intuitif, CTA question. Max 300 mots. Ton : expert accessible.",
        "Voici mes 5 meilleurs posts LinkedIn : [posts]. Analyse mon style. Génère 3 nouveaux posts sur [thèmes] dans exactement ce style.",
      ],
    },
    {
      id:"8.3", title:"Newsletter — fidéliser et convertir", type:"lesson", duration:"12 min",
      intro:"La newsletter reste le canal le plus rentable. L'IA peut générer une newsletter de qualité en 15 minutes au lieu de 3 heures.",
      keyPoints:[
        {title:"Structure d'une bonne newsletter", text:"Accroche personnelle → sujet principal (80% de valeur) → insight court → ressources → CTA. L'IA génère chaque section en partant de vos notes."},
        {title:"Personnalisation à l'échelle", text:"Segmentez votre liste. L'IA génère des versions adaptées pour chaque segment. Même email, 3 angles différents selon le profil du lecteur."},
        {title:"Analyse des performances", text:"Donnez vos stats à l'IA (taux d'ouverture, CTR, réponses). Elle identifie les patterns et recommande les optimisations."},
      ],
      templates:[
        "Voici mes notes pour la newsletter de cette semaine : [notes]. Écris la newsletter complète : objet (3 variations), intro personnelle (3 lignes), corps (400 mots valeur), CTA clair.",
      ],
    },
    {
      id:"8.4", title:"Vidéo et podcast avec l'IA", type:"lesson", duration:"15 min",
      intro:"Scripts, sous-titres, descriptions, thumbnails — l'IA accélère toute la chaîne de production vidéo et audio.",
      keyPoints:[
        {title:"Scripts vidéo", text:"Donnez un sujet et une structure. L'IA génère un script complet avec intro hook, développement, moments clés à mettre en avant, outro et CTA."},
        {title:"Post-production IA", text:"Whisper pour la transcription automatique. Descript pour éditer la vidéo en éditant le texte. ElevenLabs pour les voix off. Otter.ai pour les réunions."},
        {title:"Distribution et repurposing", text:"1 vidéo → transcript → article blog → 5 posts LinkedIn → thread Twitter → shorts/reels extraits. L'IA gère toutes les transformations."},
      ],
      templates:[
        "Écris un script vidéo YouTube de 8 minutes sur [sujet] pour [audience]. Hook (30s), problème (1min), solution en 3 étapes (5min), résumé + CTA (1.5min). Style : conversationnel, exemples concrets.",
      ],
      actions:["Créer le script de votre prochaine vidéo avec l'IA","Tester Whisper pour transcrire une vidéo existante"],
    },
    {
      id:"8.5", title:"SEO et contenu optimisé", type:"lesson", duration:"12 min",
      intro:"L'IA révolutionne le SEO : recherche de mots-clés, optimisation on-page, création de contenu qui rankera.",
      keyPoints:[
        {title:"Recherche de mots-clés IA", text:"ChatGPT génère des clusters de mots-clés, identifie l'intention de recherche, et suggère la structure d'article optimale pour ranker."},
        {title:"Rédaction SEO", text:"L'IA intègre naturellement les mots-clés, crée les meta descriptions, génère les balises alt, structure les H1/H2/H3 pour le SEO."},
        {title:"Content gap analysis", text:"Donnez vos articles et ceux de vos concurrents à l'IA. Elle identifie ce qu'ils couvrent mieux et les sujets inexploités à traiter en priorité."},
      ],
      templates:[
        "Crée un article SEO de 1500 mots sur [mot-clé principal]. Intention : [informationnel/transactionnel]. Inclure : méta description, 5 H2, FAQ section (5Q). Keyword density naturelle.",
      ],
    },
    {
      id:"8.6", title:"Images et visuels IA", type:"lesson", duration:"12 min",
      intro:"Créez des visuels professionnels pour tous vos contenus sans compétences en design.",
      keyPoints:[
        {title:"Visuels pour les réseaux sociaux", text:"DALL-E 3 via ChatGPT pour des illustrations blog et posts. Canva IA pour des templates professionnels en 1 clic. Consistance visuelle = branding fort."},
        {title:"Infographies et data viz", text:"Décrivez vos données à l'IA, elle suggère la meilleure visualisation. Créez ensuite avec Canva ou demandez du code SVG/Chart.js."},
        {title:"Batch generation", text:"Générez 10-20 visuels en une session. Définissez un style guide (couleurs, fonts, style) et l'IA maintient la cohérence sur tout votre batch."},
      ],
      actions:["Créer les visuels de votre prochaine semaine de contenu","Définir votre style guide IA (couleurs, style, ambiance)"],
    },
    {
      id:"8.7", title:"Construire votre machine à contenu", type:"exercise", duration:"20 min",
      intro:"Créez un système de production de contenu IA qui tourne en semi-automatique.",
      exercise:{
        prompt:"Construisez votre pipeline de contenu complet : de l'idée à la publication, avec l'IA à chaque étape. Documentez le processus et créez vos templates.",
        hints:[
          "Définir les formats de contenu que vous produisez (LinkedIn, newsletter, vidéo...)",
          "Créer un prompt template pour chaque format",
          "Définir le workflow : idée → IA → relecture → publication",
          "Automatiser ce qui peut l'être (Zapier, Buffer, Hootsuite)",
          "Mesurer : temps de production avant/après IA",
        ]
      },
      actions:["Documenter votre pipeline contenu","Objectif : produire 2x plus de contenu en 50% moins de temps"],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MODULE 9 — AGENTS IA & NIVEAU AVANCÉ
══════════════════════════════════════════════════════════════ */
const M9: Module = {
  id:"9", title:"Agents IA & Niveau Avancé", emoji:"🤖",
  tagline:"Le futur de l'IA est autonome",
  color:"#14b8a6", rgb:"20,184,166",
  description:"Agents autonomes, RAG, fine-tuning, sécurité IA — maîtrisez les concepts et outils avancés qui définissent la prochaine vague.",
  duration:"~100 min",
  chapters:[
    {
      id:"9.1", title:"Architecture des agents IA", type:"lesson", duration:"15 min",
      intro:"Les agents IA vont au-delà des chatbots — ils planifient, exécutent et s'auto-corrigent. Comprendre leur architecture vous prépare à les construire.",
      keyPoints:[
        {title:"Composants d'un agent", text:"LLM (le cerveau) + Tools (les mains) + Memory (la mémoire) + Planning (la stratégie). Ces 4 composants définissent ce qu'un agent peut faire."},
        {title:"ReAct pattern", text:"Reason + Act : l'agent raisonne sur la situation, choisit une action, observe le résultat, et recommence. Cette boucle permet de résoudre des tâches complexes en plusieurs étapes."},
        {title:"Multi-agent systems", text:"Plusieurs agents spécialisés qui collaborent. Un agent chercheur, un agent rédacteur, un agent correcteur — chacun excellent dans son rôle."},
      ],
      example:"CrewAI permet de créer une équipe d'agents IA : le premier fait la recherche, le second analyse, le troisième rédige, le quatrième critique. En autonomie complète.",
      actions:["Lire la documentation de LangChain ou CrewAI","Identifier 1 tâche complexe à confier à un agent"],
    },
    {
      id:"9.2", title:"RAG — Retrieval Augmented Generation", type:"lesson", duration:"15 min",
      intro:"Le RAG permet à l'IA d'accéder à votre base de connaissance interne en temps réel — sans entraînement coûteux.",
      keyPoints:[
        {title:"Qu'est-ce que le RAG", text:"Au lieu d'entraîner un modèle sur vos données (coûteux), le RAG stocke vos documents dans une base vectorielle et les récupère à la demande pendant la génération."},
        {title:"Cas d'usage", text:"Assistant SAV qui connaît votre catalogue produit. Chatbot interne qui répond aux questions RH. Outil de recherche qui fouille vos 10 ans d'emails et documents."},
        {title:"Outils no-code", text:"Botpress, Voiceflow, CustomGPT.ai — créez des chatbots RAG sur vos documents sans une ligne de code. Résultats en quelques heures."},
      ],
      example:"Un cabinet juridique a créé un RAG sur ses 500 contrats types. Les avocats junior interrogent l'IA en langage naturel : 'Montre-moi les clauses de résiliation que nous avons utilisées pour des clients SaaS.' Résultat en 3 secondes.",
      actions:["Tester CustomGPT.ai avec un de vos documents internes","Identifier votre premier cas d'usage RAG"],
    },
    {
      id:"9.3", title:"Fine-tuning — personnaliser un modèle", type:"lesson", duration:"12 min",
      intro:"Le fine-tuning vous permet d'entraîner un modèle sur vos données pour des performances spécialisées inégalées.",
      keyPoints:[
        {title:"Quand fine-tuner", text:"Le RAG couvre 80% des cas. Fine-tuner quand : vous avez besoin d'un style ou format très spécifique, les données sont trop sensibles pour le cloud, ou le volume est massif."},
        {title:"OpenAI Fine-tuning", text:"GPT-3.5 et GPT-4o peuvent être fine-tunés via l'interface OpenAI. Format JSONL, ~100-500 exemples suffisent pour des résultats significatifs."},
        {title:"Coût et ROI", text:"Fine-tuning coûte : préparation des données + entraînement + inférence (moins cher que le modèle de base). ROI quand volume > 100k requêtes/mois."},
      ],
      tips:["La qualité des données d'entraînement compte plus que la quantité.","Commencez par le RAG ou les custom instructions avant le fine-tuning — c'est souvent suffisant."],
    },
    {
      id:"9.4", title:"LangChain et frameworks d'agents", type:"lesson", duration:"15 min",
      intro:"LangChain, LlamaIndex, CrewAI — les frameworks qui permettent de construire des applications IA sophistiquées.",
      keyPoints:[
        {title:"LangChain", text:"Le framework le plus utilisé pour construire des applications LLM. Chaînes, agents, tools, memory — une boîte à outils complète pour les développeurs."},
        {title:"LlamaIndex", text:"Spécialisé dans la connexion de LLM à vos données. Excellent pour les applications RAG, l'indexation de documents, la recherche sémantique."},
        {title:"CrewAI", text:"Framework pour les systèmes multi-agents. Définissez des rôles, des objectifs, des processus. Vos agents collaborent comme une vraie équipe."},
      ],
      example:"Avec CrewAI : Agent 1 (Researcher) cherche sur le web. Agent 2 (Analyst) analyse les données. Agent 3 (Writer) rédige le rapport. Agent 4 (Editor) révise. Tout en Python, ~100 lignes.",
      actions:["Installer LangChain ou CrewAI","Tester un exemple de base de la documentation"],
    },
    {
      id:"9.5", title:"Sécurité et risques de l'IA", type:"lesson", duration:"12 min",
      intro:"Comprendre les risques de sécurité de l'IA vous protège et protège vos clients.",
      keyPoints:[
        {title:"Prompt injection", text:"Des utilisateurs malveillants peuvent injecter des instructions dans vos prompts. Si vous exposez un chatbot IA, protégez-vous avec des validations et des guardrails."},
        {title:"Data leakage", text:"Les modèles peuvent involontairement révéler des informations confidentielles présentes dans leur contexte. Cloisonnez les informations sensibles."},
        {title:"Deepfakes et désinformation", text:"L'IA génère des contenus faux convaincants. Formation de vos équipes à la vérification des sources, watermarking des contenus IA, processus de validation."},
      ],
      tips:["Traitez votre clé API comme un mot de passe — ne la committez jamais dans du code public.","Implémentez des rate limits et des filtres de contenu sur tout chatbot IA exposé au public."],
    },
    {
      id:"9.6", title:"L'avenir de l'IA — se préparer", type:"lesson", duration:"12 min",
      intro:"GPT-5, agents autonomes, IA multimodale avancée — comment se préparer à la prochaine vague.",
      keyPoints:[
        {title:"Ce qui arrive dans 12-24 mois", text:"Agents IA autonomes mainstream. Vidéo IA professionnelle. IA temps réel et voix naturelle. Modèles on-device plus puissants. Coûts divisés par 10."},
        {title:"Compétences à développer", text:"Orchestration d'agents, évaluation de modèles, prompt engineering avancé, éthique IA appliquée. Ces compétences seront rares et valorisées."},
        {title:"Se former en continu", text:"L'IA évolue chaque semaine. Newsletters (The Rundown AI, Import AI), communautés (Hugging Face, r/LocalLLaMA), conférences (NeurIPS, ICML)."},
      ],
      actions:["S'abonner à 2 newsletters IA de référence","Rejoindre 1 communauté IA active"],
    },
    {
      id:"9.7", title:"Exercice : Construire un mini-agent", type:"exercise", duration:"20 min",
      intro:"Mettez les mains dans le cambouis — construisez votre premier mini-agent IA fonctionnel.",
      exercise:{
        prompt:"Construisez un agent IA simple qui accomplit une tâche en plusieurs étapes autonomes. Utilisez les outils de votre choix (LangChain, n8n, Zapier avec GPT, ou Claude tools use).",
        hints:[
          "Choisir une tâche simple à 3-4 étapes (recherche → analyse → rédaction → envoi)",
          "Définir les outils dont l'agent a besoin (search, email, calendar...)",
          "Construire la logique step by step",
          "Tester avec un cas réel",
          "Documenter les limitations rencontrées",
        ]
      },
      actions:["Publier votre mini-agent sur GitHub ou le partager dans la communauté","Identifier votre prochain projet agent plus ambitieux"],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MODULE 10 — PROJET FINAL & CERTIFICATION DJAMA
══════════════════════════════════════════════════════════════ */
const M10: Module = {
  id:"10", title:"Projet Final & Certification", emoji:"🏆",
  tagline:"Prouvez votre maîtrise, obtenez votre certification",
  color:"#f59e0b", rgb:"245,158,11",
  description:"Projet final complet, plan d'action 90 jours et certification officielle DJAMA IA Expert.",
  duration:"~120 min",
  chapters:[
    {
      id:"10.1", title:"Bilan des 9 modules", type:"lesson", duration:"15 min",
      intro:"Avant le projet final, consolidez toutes les connaissances acquises et identifiez vos zones de force et de progrès.",
      keyPoints:[
        {title:"Auto-évaluation par compétence", text:"Évaluez-vous sur chaque module (1-5) : fondations IA, prompt engineering, ChatGPT, Claude, autres IA, automatisation, business, contenu, avancé."},
        {title:"Vos quick wins réalisés", text:"Listez les automatisations déployées, le temps gagné, les workflows créés, les compétences nouvelles. Célébrez les progrès réels."},
        {title:"Gaps à combler", text:"Identifiez les 2-3 domaines où vous êtes moins à l'aise. Planifiez un temps de consolidation avant la certification."},
      ],
      actions:["Compléter la grille d'auto-évaluation DJAMA","Lister vos 5 plus grandes victoires avec l'IA depuis le début"],
    },
    {
      id:"10.2", title:"Définir votre projet de certification", type:"lesson", duration:"15 min",
      intro:"Le projet de certification doit démontrer votre capacité à déployer l'IA pour résoudre un vrai problème business.",
      keyPoints:[
        {title:"Critères du projet", text:"Problème réel de votre activité, utilisation d'au moins 3 outils IA, impact mesurable, documentation complète du processus."},
        {title:"Types de projets acceptés", text:"Workflow d'automatisation business, système de création de contenu IA, chatbot/agent IA pour un cas métier, analyse de données IA avec recommandations."},
        {title:"Format de livrable", text:"Présentation 15 minutes (slides + démo), document de 5 pages (contexte, solution, résultats, apprentissages), accès à la solution implémentée."},
      ],
      actions:["Choisir votre sujet de projet de certification","Soumettre votre brief projet pour validation par l'équipe DJAMA"],
    },
    {
      id:"10.3", title:"Construire votre solution IA", type:"exercise", duration:"30 min",
      intro:"Implémentez votre projet de certification de bout en bout.",
      exercise:{
        prompt:"Construisez votre solution IA complète : définition du problème, choix des outils, implémentation, tests, mesure des résultats.",
        hints:[
          "Documenter le problème initial et son coût (temps, argent, qualité)",
          "Concevoir l'architecture de la solution IA",
          "Implémenter les composants IA (LLM + automatisation + intégrations)",
          "Tester sur des cas réels et mesurer les résultats",
          "Préparer la documentation et la présentation",
        ]
      },
    },
    {
      id:"10.4", title:"Présenter et pitcher votre solution", type:"lesson", duration:"12 min",
      intro:"Communiquer la valeur de votre solution IA est une compétence en soi. Apprenez à pitcher votre projet.",
      keyPoints:[
        {title:"Structure du pitch IA", text:"Problème (1 slide) → Solution IA (2 slides) → Démo live (3 min) → Résultats mesurés → Apprentissages → Prochaines étapes."},
        {title:"Montrer la valeur", text:"Quantifiez tout : temps gagné par semaine, coût évité par mois, qualité améliorée (NPS, erreurs réduites), revenus générés ou protégés."},
        {title:"Les questions difficiles", text:"Sécurité des données. Fiabilité (taux d'erreur). Maintenabilité. Scalabilité. Préparez des réponses honnêtes à ces questions."},
      ],
      templates:[
        "Avant : [situation avant IA]. Problème : [impact négatif]. Solution : [description IA]. Résultat : [mesure concrète]. Prochaine étape : [évolution planifiée].",
      ],
    },
    {
      id:"10.5", title:"Plan d'action 90 jours", type:"lesson", duration:"15 min",
      intro:"La formation se termine, votre parcours IA commence. Construisez votre feuille de route pour les 3 prochains mois.",
      keyPoints:[
        {title:"Mois 1 — Consolider", text:"Déployer vos 3 workflows d'automatisation prioritaires. Former votre équipe aux outils validés. Mesurer les premiers gains."},
        {title:"Mois 2 — Accélérer", text:"Étendre les usages qui fonctionnent. Explorer les agents IA. Commencer votre projet RAG ou GPT custom si pertinent."},
        {title:"Mois 3 — Innover", text:"Projets avancés (fine-tuning, multi-agents). Partager vos apprentissages. Devenir la référence IA de votre réseau."},
      ],
      actions:["Rédiger votre plan 90 jours avec objectifs mesurables","Programmer un point de bilan à 30, 60 et 90 jours"],
    },
    {
      id:"10.6", title:"Rejoindre la communauté DJAMA IA", type:"lesson", duration:"10 min",
      intro:"La formation vous a donné les fondations. La communauté vous donnera le carburant pour continuer à progresser.",
      keyPoints:[
        {title:"Le réseau DJAMA IA", text:"Diplômés de la formation, experts invités, sessions live mensuelles, canal Slack/Discord privé. Un accès permanent à une communauté d'élite."},
        {title:"Partager et enseigner", text:"Les meilleurs apprenants deviennent des mentors. Partager votre expertise dans la communauté consolide vos propres connaissances et construit votre réputation."},
        {title:"Rester à jour", text:"L'IA évolue chaque semaine. La communauté DJAMA filtre le signal du bruit — vous recevez seulement ce qui compte vraiment pour votre business."},
      ],
      actions:["Rejoindre le canal Slack DJAMA IA Expert","Partager votre premier post de célébration avec votre projet final"],
    },
    {
      id:"10.7", title:"Certification DJAMA IA Expert", type:"quiz", duration:"20 min",
      intro:"L'évaluation finale pour obtenir votre certification officielle DJAMA IA Expert.",
      exercise:{
        prompt:"Répondez à l'évaluation finale couvrant les 9 modules. Score minimum : 80%. La certification est valable 2 ans et vérifiable en ligne.",
        hints:[
          "Section 1 : Fondations IA et LLM (10 questions)",
          "Section 2 : Prompt engineering et outils (10 questions)",
          "Section 3 : Applications business et automatisation (10 questions)",
          "Section 4 : Cas pratique — analyser une situation et proposer une solution IA (1 cas)",
          "Section 5 : Éthique et sécurité IA (5 questions)",
        ]
      },
      tips:["Prenez votre temps. La qualité du raisonnement compte plus que la vitesse.","Vous pouvez repasser l'évaluation une fois si vous obtenez moins de 80%."],
      actions:["Télécharger votre certificat après validation","Ajouter la certification DJAMA IA Expert à votre profil LinkedIn"],
    },
  ]
};

/* ══════════════════════════════════════════════════════════════
   EXPORTS
══════════════════════════════════════════════════════════════ */
export const COACHING_MODULES: Module[] = [M1, M2, M3, M4, M5, M6, M7, M8, M9, M10];

export const TOTAL_CHAPTERS = COACHING_MODULES.reduce(
  (sum, m) => sum + m.chapters.length, 0
);

export function getNextChapter(
  currentModuleId: string,
  currentChapterId: string
): { moduleId: string; chapterId: string } | null {
  const modIdx = COACHING_MODULES.findIndex(m => m.id === currentModuleId);
  if (modIdx === -1) return null;
  const mod = COACHING_MODULES[modIdx];
  const chapIdx = mod.chapters.findIndex(c => c.id === currentChapterId);
  if (chapIdx < mod.chapters.length - 1) {
    return { moduleId: currentModuleId, chapterId: mod.chapters[chapIdx + 1].id };
  }
  if (modIdx < COACHING_MODULES.length - 1) {
    const nextMod = COACHING_MODULES[modIdx + 1];
    return { moduleId: nextMod.id, chapterId: nextMod.chapters[0].id };
  }
  return null;
}
