"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ChevronLeft, ChevronRight, CheckCircle2, Lock,
  BookOpen, Lightbulb, Target, Trophy, Play, Clock,
  RefreshCw, Zap, Star, Send, Sparkles, Loader2,
  GraduationCap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Données des cours ────────────────────────────────────────── */

const FALLBACK_TITLES: Record<string, string> = {
  "05": "Automatiser son travail avec l'IA",
  "06": "Génération de texte professionnelle",
  "07": "Créer des images avec l'IA",
  "08": "Analyser des données avec l'IA",
  "09": "L'IA pour les entrepreneurs",
  "10": "Optimiser son temps avec l'IA",
  "11": "L'IA pour le marketing digital",
  "12": "Automatisation des tâches répétitives",
  "13": "Création de contenu IA",
  "14": "Les outils IA incontournables",
  "15": "Productivité et organisation",
  "16": "Créer des agents IA",
  "17": "Business en ligne avec l'IA",
  "18": "L'IA et la programmation",
  "19": "Cas pratiques d'entrepreneurs",
  "20": "Projet final — votre assistant IA",
};

/* ─── Video Player ──────────────────────────────────────────────── */

function VideoPlayer({ title, courseColor }: { title: string; courseColor: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/8 cursor-pointer group"
      style={{ background: `linear-gradient(135deg, #0a0f1e 0%, ${courseColor}18 100%)` }}
      onClick={() => setPlaying(p => !p)}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${courseColor}12, transparent)` }} />
      {/* Grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{
        backgroundImage: `linear-gradient(${courseColor}20 1px, transparent 1px), linear-gradient(90deg, ${courseColor}20 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />
      {!playing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <motion.div
            whileHover={{ scale: 1.12 }}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-lg transition-shadow"
            style={{ borderColor: courseColor + "70", background: courseColor + "28", boxShadow: `0 0 30px ${courseColor}30` }}
          >
            <Play size={24} fill={courseColor} style={{ color: courseColor, marginLeft: 3 }} />
          </motion.div>
          <p className="text-sm font-bold text-white/80">{title}</p>
          <span className="rounded-full px-3 py-1 text-[0.6rem] font-bold" style={{ background: courseColor + "22", color: courseColor, border: `1px solid ${courseColor}35` }}>
            Voir la leçon vidéo
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: courseColor + "30", border: `2px solid ${courseColor}60` }}
          >
            <div className="flex gap-2">
              <div className="h-5 w-1.5 rounded-full" style={{ background: courseColor }} />
              <div className="h-5 w-1.5 rounded-full" style={{ background: courseColor }} />
            </div>
          </motion.div>
          <p className="text-xs text-white/50">Vidéo en cours — cliquez pour pauser</p>
        </div>
      )}
      {/* Duration badge */}
      <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-[0.6rem] font-bold text-white/70 backdrop-blur-sm">
        15:30
      </div>
    </motion.div>
  );
}

const COURS_DATA: Record<string, {
  title: string; subtitle: string; duration: string; level: string;
  color: string; done?: boolean; active?: boolean;
  chapters: { title: string; content: string; concepts: { term: string; def: string }[] }[];
  exercise: { title: string; desc: string; exemple: string };
  quiz: { q: string; opts: string[]; correct: number }[];
}> = {
  "01": {
    title: "Introduction à l'IA",
    subtitle: "Comprendre ce qu'est l'intelligence artificielle",
    duration: "30 min", level: "Débutant", color: "#4ade80",
    chapters: [
      {
        title: "Qu'est-ce que l'intelligence artificielle ?",
        content: `L'intelligence artificielle (IA) est un domaine de l'informatique qui vise à créer des systèmes capables d'effectuer des tâches nécessitant normalement l'intelligence humaine.

Ces tâches incluent la compréhension du langage naturel, la reconnaissance d'images, la prise de décision et la résolution de problèmes complexes.

Aujourd'hui, l'IA n'est plus réservée aux grandes entreprises tech. Elle est accessible à tout entrepreneur via des outils simples comme ChatGPT, Midjourney ou Notion IA.`,
        concepts: [
          { term: "IA Faible", def: "IA spécialisée dans une tâche précise — ex: ChatGPT, reconnaissance faciale" },
          { term: "IA Forte", def: "IA générale capable de raisonner comme un humain — n'existe pas encore" },
          { term: "Machine Learning", def: "L'IA apprend à partir de données sans être explicitement programmée" },
        ],
      },
      {
        title: "Comment l'IA apprend-elle ?",
        content: `Les modèles d'IA modernes apprennent grâce à de vastes quantités de données. Le processus se déroule en 4 étapes :

1. Collecte de données — Des milliards de textes, images, vidéos sont collectés sur le web
2. Entraînement — L'IA ajuste ses paramètres internes pour reconnaître des patterns
3. Validation — On teste les performances sur des données que le modèle n'a jamais vues
4. Déploiement — Le modèle est mis en production et accessible aux utilisateurs

Plus un modèle est entraîné sur des données de qualité, plus ses réponses seront précises et pertinentes.`,
        concepts: [
          { term: "Dataset", def: "L'ensemble de données utilisé pour entraîner un modèle d'IA" },
          { term: "Paramètres", def: "Les réglages internes d'un modèle — GPT-4 en a environ 1 trillion" },
          { term: "Inférence", def: "Quand le modèle génère une réponse à partir d'un prompt" },
        ],
      },
      {
        title: "L'IA dans votre quotidien professionnel",
        content: `En tant qu'entrepreneur, l'IA peut transformer votre façon de travailler dès aujourd'hui. Voici les 4 grandes catégories d'usage :

Rédiger — Emails, devis, descriptions produits, posts réseaux sociaux, newsletters
Analyser — Données clients, tendances marché, retours d'expérience, bilans
Automatiser — Tâches répétitives, réponses FAQ, suivi de projets, relances
Créer — Visuels, présentations, scripts vidéo, idées de contenu

Le gain de productivité moyen pour un entrepreneur qui utilise l'IA quotidiennement est estimé entre 2 et 4 heures par jour.`,
        concepts: [
          { term: "Automatisation", def: "Déléguer des tâches répétitives à une IA pour gagner du temps" },
          { term: "Prompt", def: "L'instruction que vous donnez à l'IA pour obtenir un résultat" },
          { term: "ROI IA", def: "Le gain de productivité mesurable grâce à l'utilisation de l'IA" },
        ],
      },
    ],
    exercise: {
      title: "Exercice : Identifiez vos gains IA",
      desc: "Listez 3 tâches que vous réalisez chaque semaine qui pourraient être partiellement ou totalement déléguées à une IA.",
      exemple: "• Rédiger mes réponses emails clients (2h/sem) → ChatGPT génère un premier draft\n• Créer des légendes Instagram (1h/sem) → ChatGPT + Canva IA\n• Préparer mes comptes-rendus de réunion (1h/sem) → Whisper (transcription) + résumé IA",
    },
    quiz: [
      { q: "Quelle est la différence entre IA faible et IA forte ?", opts: ["La vitesse de traitement", "L'IA faible est spécialisée, l'IA forte est générale", "Le coût du modèle", "La taille du dataset"], correct: 1 },
      { q: "Quel est le gain de productivité estimé pour un entrepreneur utilisant l'IA quotidiennement ?", opts: ["30 min par jour", "1 heure par jour", "2 à 4 heures par jour", "8 heures par jour"], correct: 2 },
    ],
  },
  "02": {
    title: "Comprendre les modèles",
    subtitle: "LLMs, transformers et architectures IA",
    duration: "35 min", level: "Débutant", color: "#38bdf8",
    chapters: [
      {
        title: "Les Large Language Models (LLMs)",
        content: `Un LLM (Large Language Model) est un modèle d'IA entraîné sur de gigantesques corpus de texte — des milliards de pages web, livres, articles scientifiques et conversations.

Son objectif fondamental est simple : prédire le prochain token le plus probable dans une séquence. Et pourtant, de cette simplicité apparente émerge une capacité remarquable à comprendre et générer du langage naturel de façon cohérente.

La magie des LLMs vient de leur architecture Transformer, introduite en 2017 par Google.`,
        concepts: [
          { term: "LLM", def: "Large Language Model — modèle entraîné sur du texte à très grande échelle" },
          { term: "Token", def: "Unité de texte traitée par le modèle — environ ¾ d'un mot en français" },
          { term: "Context window", def: "La quantité maximale de texte que le modèle peut analyser à la fois" },
        ],
      },
      {
        title: "Les grands modèles du marché",
        content: `OpenAI — GPT-4o, o1, o3 (accessible via ChatGPT)
Le plus populaire et polyvalent, excellent pour la rédaction et l'analyse générale.

Anthropic — Claude 3.5 Sonnet, Claude 4
Très performant pour l'analyse de longs documents, la nuance et la rédaction professionnelle.

Google — Gemini 1.5 Pro, 2.0 Flash
Multimodal natif, profondément intégré dans les outils Google.

Meta — LLaMA 3.3 — Open source, peut être utilisé localement.

Mistral — Modèle français, excellent rapport qualité/prix, disponible en API.`,
        concepts: [
          { term: "Benchmark", def: "Test standardisé pour comparer les performances de différents modèles" },
          { term: "Multimodal", def: "Modèle capable de traiter texte + images + audio + vidéo simultanément" },
          { term: "Open source", def: "Modèle dont les poids sont publics — peut être utilisé librement" },
        ],
      },
      {
        title: "Comment choisir le bon modèle ?",
        content: `Pour la rédaction et les emails → ChatGPT GPT-4o ou Claude 3.5
Pour analyser de longs documents → Claude 3.5 Sonnet (128k tokens de contexte)
Pour la génération d'images → DALL-E 3 (via ChatGPT) ou Midjourney
Pour coder → GPT-4o, Claude ou Cursor (éditeur IA)
Pour un usage gratuit → ChatGPT 3.5, Gemini Flash ou Mistral
Pour garantir la confidentialité → LLaMA local via Ollama

Conseil DJAMA : commencez avec ChatGPT GPT-4o (20€/mois) — c'est le meilleur point de départ.`,
        concepts: [
          { term: "API", def: "Interface permettant d'intégrer un LLM directement dans vos propres outils" },
          { term: "Coût par token", def: "La plupart des modèles pros facturent à l'usage" },
          { term: "Latence", def: "Le temps de réponse du modèle — crucial pour les applications en temps réel" },
        ],
      },
    ],
    exercise: {
      title: "Exercice : Benchmark personnel",
      desc: "Testez la même question sur 3 modèles différents (ChatGPT, Claude, Gemini) et notez les différences en termes de style, précision, structure et longueur de réponse.",
      exemple: "Question test recommandée :\n'Donne-moi 5 idées concrètes pour augmenter mes ventes en ligne avec un budget inférieur à 500€/mois'\n\nObservez : lequel est le plus structuré ? Le plus créatif ? Le plus actionnable ?",
    },
    quiz: [
      { q: "Que signifie LLM ?", opts: ["Learning Language Machine", "Large Language Model", "Logical Learning Module", "Linear Logic Model"], correct: 1 },
      { q: "Quel modèle est français ?", opts: ["ChatGPT", "Claude", "Mistral", "DALL-E"], correct: 2 },
    ],
  },
  "03": {
    title: "Utiliser ChatGPT",
    subtitle: "Maîtriser l'outil IA le plus utilisé au monde",
    duration: "40 min", level: "Débutant", color: "#a78bfa",
    chapters: [
      {
        title: "Découvrir l'interface ChatGPT",
        content: `ChatGPT est le modèle d'IA conversationnelle le plus utilisé au monde avec plus de 200 millions d'utilisateurs actifs mensuels.

L'interface se compose de :
- La zone de saisie du prompt (en bas) — où vous tapez vos instructions
- L'historique des conversations (à gauche) — toutes vos sessions sont sauvegardées
- Le sélecteur de modèle (en haut) — choisissez entre GPT-4o, o1, o3...
- Les GPTs personnalisés — des assistants IA pré-configurés pour des tâches précises`,
        concepts: [
          { term: "Thread", def: "Une conversation dans ChatGPT — le contexte complet est conservé tout au long" },
          { term: "GPT personnalisé", def: "IA pré-configurée avec des instructions et une personnalité spécifique" },
          { term: "Mémoire", def: "ChatGPT peut mémoriser des informations entre les sessions si activée" },
        ],
      },
      {
        title: "10 cas d'usage pour entrepreneurs",
        content: `1. Emails professionnels — Rédiger, reformuler, répondre aux objections
2. Devis et propositions — Structurer et valoriser vos offres commerciales
3. Réseaux sociaux — Posts LinkedIn, légendes Instagram, stories
4. FAQ clients — Anticiper et répondre aux questions fréquentes
5. Contenu blog — Articles, newsletters, guides pratiques
6. Analyse compétitive — Comparer vos offres à la concurrence
7. Scripts vidéo — Reels, YouTube, présentations
8. Formation équipe — Créer des supports pédagogiques rapidement
9. Brainstorming — Générer 50 idées en 2 minutes
10. Relances commerciales — Emails de suivi personnalisés et percutants`,
        concepts: [
          { term: "Tone of voice", def: "Le style et le ton donné à l'IA pour qu'elle écrive dans votre voix" },
          { term: "Template prompt", def: "Un modèle de prompt réutilisable pour des tâches récurrentes" },
          { term: "Itération", def: "Affiner progressivement la réponse via des messages de follow-up" },
        ],
      },
      {
        title: "Bonnes pratiques et pièges à éviter",
        content: `Ce qu'il faut faire :
- Toujours donner du contexte (qui vous êtes, pour qui, dans quel but)
- Itérer — une bonne réponse vient rarement du premier prompt
- Vérifier les informations factuelles (dates, statistiques, noms propres)
- Utiliser des exemples pour guider le style souhaité

Ce qu'il faut éviter :
- Faire confiance aveuglément aux chiffres et aux dates
- Utiliser des prompts trop vagues
- Partager des données clients ou financières confidentielles
- Ignorer les hallucinations — l'IA peut inventer des sources`,
        concepts: [
          { term: "Hallucination", def: "Quand l'IA génère des informations fausses mais présentées avec certitude" },
          { term: "RGPD", def: "Ne partagez jamais de données personnelles de clients dans ChatGPT" },
          { term: "Source primaire", def: "Toujours vérifier les affirmations factuelles avec des sources vérifiables" },
        ],
      },
    ],
    exercise: {
      title: "Exercice : Votre premier template prompt",
      desc: "Créez votre premier prompt template professionnel. Choisissez une tâche récurrente et construisez un prompt réutilisable avec des variables.",
      exemple: "TEMPLATE — EMAIL DE RELANCE CLIENT\n\n'Tu es un commercial expert en relation client. Rédige un email de relance pour [NOM], qui n'a pas répondu à notre offre sur [SUJET] depuis [X] jours. Ton : professionnel et chaleureux. Max 120 mots. Inclure : accroche personnalisée + rappel de la valeur + CTA clair (appel 15 min).'",
    },
    quiz: [
      { q: "Combien d'utilisateurs actifs mensuels a ChatGPT ?", opts: ["1 million", "10 millions", "200 millions", "1 milliard"], correct: 2 },
      { q: "Que faut-il éviter de partager dans ChatGPT ?", opts: ["Ses idées créatives", "Les données personnelles de clients", "Des exemples de textes", "Ses objectifs business"], correct: 1 },
    ],
  },
  "04": {
    title: "Prompt Engineering Avancé",
    subtitle: "L'art de communiquer avec l'IA pour des résultats professionnels",
    duration: "45 min", level: "Intermédiaire", color: "#d946ef",
    active: true,
    chapters: [
      {
        title: "La structure d'un prompt parfait",
        content: `Un prompt efficace repose sur 4 piliers fondamentaux — la méthode RCTC :

Rôle (Persona) — Attribuez un rôle précis à l'IA avant toute chose.
"Tu es un copywriter expert en marketing B2B avec 15 ans d'expérience..."

Contexte — Donnez les informations nécessaires pour comprendre la situation.
"Mon entreprise vend des logiciels de gestion à des PME françaises..."

Tâche — Décrivez précisément ce que vous voulez obtenir.
"Rédige un email de prospection de 150 mots maximum..."

Contraintes — Spécifiez le format, le ton, les limites à respecter.
"Ton professionnel mais accessible. Utilise des bullet points. Max 150 mots."`,
        concepts: [
          { term: "Persona prompting", def: "Attribuer un rôle expert à l'IA pour des réponses plus calibrées" },
          { term: "Few-shot", def: "Donner des exemples concrets dans le prompt pour guider le style de réponse" },
          { term: "Zero-shot", def: "Demander à l'IA sans aucun exemple — efficace pour des tâches simples" },
        ],
      },
      {
        title: "Les techniques avancées",
        content: `Chain of Thought (CoT)
Demandez à l'IA de raisonner étape par étape avant de répondre.
Ajoutez : "Réfléchis étape par étape avant de me donner ta réponse."
Résultat : réponses 40% plus précises sur des problèmes complexes

Context Injection
Collez vos propres données dans le prompt pour personnaliser les réponses.
"Voici les retours clients de cette semaine : [COLLER VOS DONNÉES]
Maintenant, identifie les 3 problèmes récurrents et propose des solutions."

Role + Task + Format (RTF) — Template universel
Rôle : Tu es [expert en quoi]
Tâche : [Ce que tu dois faire précisément]
Format : [Comment présenter la réponse]
Contraintes : [Limites — mots, ton, ce à éviter]`,
        concepts: [
          { term: "Chain of Thought", def: "Technique qui force l'IA à raisonner pas-à-pas pour plus de précision" },
          { term: "Context injection", def: "Injecter vos données réelles dans le prompt pour des réponses ultra-personnalisées" },
          { term: "Temperature", def: "0 = réponses précises et déterministes / 1 = réponses créatives et variées" },
        ],
      },
      {
        title: "Templates prêts à l'emploi",
        content: `Email de prospection B2B :
"Tu es un commercial B2B expert. Rédige un email de prospection pour [TYPE CLIENT]. Mon offre : [OFFRE]. Ton : direct mais chaleureux. Max 120 mots. CTA : appel 15 min."

Post LinkedIn viral :
"Tu es un expert LinkedIn avec 50k abonnés. Crée un post sur [SUJET] qui commence par une accroche choc. Structure : accroche / 3-5 points clés / CTA. Max 300 mots."

Analyse de marché express :
"Tu es un analyste stratégique. Analyse le marché [SECTEUR] en France pour une PME. Inclure : tendances 2025, opportunités, risques, 3 actions concrètes."`,
        concepts: [
          { term: "Template prompt", def: "Prompt pré-construit avec des variables [EN MAJUSCULES] à remplacer" },
          { term: "Prompt library", def: "Bibliothèque de prompts testés et optimisés pour vos usages récurrents" },
          { term: "CTA", def: "Call to Action — l'action précise que vous voulez que le lecteur prenne" },
        ],
      },
    ],
    exercise: {
      title: "Défi du module : Construisez votre prompt RTF",
      desc: "Construisez un prompt complet en utilisant la méthode RTF (Rôle + Tâche + Format) pour une situation réelle de votre activité. Testez-le dans ChatGPT.",
      exemple: "EXEMPLE COMPLET RTF :\n\nRôle : Tu es un coach commercial expert en ventes B2B, spécialisé dans les PME françaises du secteur des services.\n\nTâche : Rédige un script de relance téléphonique pour un prospect qui a demandé un devis il y a 10 jours sans répondre.\n\nFormat : 3 parties — accroche 10 secondes / valeur ajoutée 30 secondes / question fermée de clôture.\n\nContraintes : Ton professionnel mais décontracté, max 80 mots au total.",
    },
    quiz: [
      { q: "Que signifie la technique 'Chain of Thought' ?", opts: ["Un type de modèle IA", "Demander à l'IA de raisonner étape par étape", "Un format de prompt en blocs", "Une chaîne de prompts automatisés"], correct: 1 },
      { q: "Dans la méthode RCTC, que signifie la lettre R ?", opts: ["Résultat", "Rôle", "Répétition", "Requête"], correct: 1 },
    ],
  },
  "05": {
    title: "Automatiser son travail avec l'IA",
    subtitle: "Déléguer les tâches répétitives pour se concentrer sur l'essentiel",
    duration: "40 min", level: "Intermédiaire", color: "#f59e0b",
    chapters: [
      {
        title: "Identifier les tâches automatisables",
        content: `L'automatisation IA commence par un audit simple : quelles tâches faites-vous chaque semaine de façon répétitive ?

Classez vos tâches en 3 catégories :
- Tâches cognitives légères — rédaction, tri d'emails, réponses types, résumés
- Tâches de transformation — convertir un format en un autre, extraire des données, traduire
- Tâches de surveillance — suivre des indicateurs, alertes, rapports périodiques

Un entrepreneur typique perd 15 à 20 heures par semaine sur des tâches automatisables. L'IA peut en récupérer 10 à 15.`,
        concepts: [
          { term: "Audit IA", def: "Cartographie de toutes vos tâches pour identifier ce qui peut être délégué à l'IA" },
          { term: "Tâche cognitive", def: "Tâche qui nécessite de la réflexion mais suit un pattern répétitif — idéale pour l'IA" },
          { term: "ROI temps", def: "Le ratio entre le temps investi à configurer une automatisation et le temps économisé" },
        ],
      },
      {
        title: "Les outils d'automatisation IA",
        content: `Zapier + ChatGPT — le duo le plus accessible
Connectez vos apps sans coder. Zapier déclenche une action, ChatGPT la traite.
Exemple : email reçu → résumé automatique → réponse draft → envoi si approbation.

Make (ex-Integromat) — plus puissant que Zapier
Scénarios complexes, logique conditionnelle, transformations de données avancées.

n8n — open source et auto-hébergeable
Idéal pour la confidentialité des données — tourne sur votre propre serveur.

Notion AI + Zapier — gestion de contenu automatisée
Création automatique de fiches projets, comptes-rendus, briefs à partir d'un email.`,
        concepts: [
          { term: "Trigger", def: "L'événement qui déclenche une automatisation (email reçu, formulaire soumis, etc.)" },
          { term: "Workflow", def: "La séquence d'actions automatisées de A à Z" },
          { term: "Webhook", def: "Un lien URL qui permet à une app d'envoyer des données à une autre en temps réel" },
        ],
      },
      {
        title: "Construire votre premier workflow IA",
        content: `Étape 1 — Choisissez une tâche simple (ex: résumer les emails importants)
Étape 2 — Identifiez le déclencheur (nouvel email avec mot-clé "urgent")
Étape 3 — Configurez l'action IA (prompt ChatGPT : "résume cet email en 3 points")
Étape 4 — Définissez la sortie (envoyer le résumé dans Slack)
Étape 5 — Testez et ajustez le prompt

Conseil DJAMA : commencez PETIT. Un workflow parfait sur une tâche vaut mieux que 10 workflows bancals. Une fois maîtrisé, dupliquez le pattern sur d'autres tâches.`,
        concepts: [
          { term: "Itération", def: "Tester, ajuster, ré-tester — l'automatisation se perfectionne avec le temps" },
          { term: "Prompt système", def: "Instructions permanentes données à l'IA dans l'automatisation (ton, format, règles)" },
          { term: "Fallback", def: "Ce qui se passe si l'IA échoue — toujours prévoir un plan B dans vos workflows" },
        ],
      },
    ],
    exercise: {
      title: "Exercice : Votre premier workflow",
      desc: "Créez un workflow Zapier (version gratuite) qui résume automatiquement un email important et envoie le résumé dans Notion ou Slack.",
      exemple: "WORKFLOW EXEMPLE :\n1. Trigger : Nouveau Gmail avec label 'Important'\n2. Action : ChatGPT — prompt : 'Résume cet email en 3 bullets points : titre + action requise + deadline'\n3. Action : Créer une page Notion avec le résumé\n\nTemps de setup : 20 minutes · Temps économisé : 1-2h/semaine",
    },
    quiz: [
      { q: "Quel outil d'automatisation est open source et auto-hébergeable ?", opts: ["Zapier", "Make", "n8n", "IFTTT"], correct: 2 },
      { q: "Qu'est-ce qu'un 'trigger' dans une automatisation ?", opts: ["Le résultat final", "L'événement qui déclenche l'automatisation", "Le modèle IA utilisé", "Le format de sortie"], correct: 1 },
    ],
  },
  "06": {
    title: "Génération de texte professionnelle",
    subtitle: "Produire des contenus de qualité en 10x moins de temps",
    duration: "38 min", level: "Intermédiaire", color: "#38bdf8",
    chapters: [
      {
        title: "Rédiger pour les entreprises avec l'IA",
        content: `La génération de texte IA ne remplace pas votre expertise — elle l'amplifie. Votre valeur ajoutée reste le jugement, la stratégie et la relation client. L'IA gère la production.

Les 6 types de contenus B2B les plus générés par l'IA aujourd'hui :
1. Emails commerciaux et de relance
2. Propositions commerciales et devis narratifs
3. Articles de blog et newsletters
4. Fiches produits et descriptions
5. Rapports et comptes-rendus
6. Scripts de démonstration et présentation

Gain moyen constaté : 70% de réduction du temps de rédaction.`,
        concepts: [
          { term: "Ghostwriting IA", def: "L'IA rédige dans votre voix — vous relisez, ajustez et validez" },
          { term: "Voix de marque", def: "Le style, le ton et les valeurs que votre contenu doit toujours refléter" },
          { term: "First draft", def: "Le premier brouillon généré par l'IA — toujours à améliorer avant envoi" },
        ],
      },
      {
        title: "Techniques pour des textes professionnels",
        content: `Technique 1 — Donner votre contexte métier précis
"Mon entreprise est une agence de comptabilité B2B. Je parle à des dirigeants de PME de 10 à 50 salariés."

Technique 2 — Fournir un exemple de votre style
"Voici un email que j'ai écrit et qui a bien fonctionné : [COLLER EMAIL]. Écris dans ce même style."

Technique 3 — Itérer par petites touches
Ne corrigez pas tout d'un coup. Demandez : "Rends le paragraphe 2 plus direct" ou "Raccourcis de 30%".

Technique 4 — Utiliser les variations
"Génère 3 versions de cet email : formelle, décontractée, urgente." Testez les 3 et combinez le meilleur.`,
        concepts: [
          { term: "Style matching", def: "Analyser et reproduire le style d'écriture d'un humain avec l'IA" },
          { term: "A/B testing", def: "Tester deux versions d'un texte pour identifier celle qui convertit le mieux" },
          { term: "Tone calibration", def: "Ajuster précisément le registre (formel, chaleureux, urgent) dans le prompt" },
        ],
      },
      {
        title: "Eviter les pièges du texte IA",
        content: `Piège 1 — Le texte trop générique
Symptôme : "Notre entreprise est leader dans son domaine et s'engage pour la satisfaction client."
Solution : Injectez des données réelles, des noms, des chiffres spécifiques.

Piège 2 — L'hallucination de faits
L'IA peut inventer des statistiques ou mal citer des sources.
Solution : Vérifiez systématiquement tous les chiffres et citations.

Piège 3 — Le style robotique
Symptôme : phrases longues, structure toujours identique, manque de personnalité.
Solution : Demandez "rends ce texte plus humain, ajoute une anecdote courte."

Piège 4 — La sur-utilisation de superlatifs
"Extraordinaire, exceptionnel, révolutionnaire" — les acheteurs B2B n'y croient plus.`,
        concepts: [
          { term: "Fact-checking", def: "Vérification obligatoire de toute donnée factuelle générée par l'IA" },
          { term: "Humanisation", def: "Ajouter des éléments personnels, anecdotes, détails concrets pour sortir du générique" },
          { term: "Relecture critique", def: "Lire le texte IA avec l'oeil d'un lecteur skeptique avant de l'envoyer" },
        ],
      },
    ],
    exercise: {
      title: "Exercice : Rédigez une proposition commerciale",
      desc: "Utilisez l'IA pour générer une proposition commerciale d'une page pour un client fictif. Appliquez les 4 techniques vues dans le module.",
      exemple: "PROMPT DE BASE :\n'Tu es un expert en rédaction commerciale B2B. Rédige une proposition pour [CLIENT] dans [SECTEUR]. Budget estimé : [X]€. Notre valeur ajoutée : [Y]. Ton : professionnel et direct. Structure : problème / solution / bénéfices / investissement / prochaine étape. Max 400 mots.'\n\nEnsuite : demandez 3 variations, choisissez les meilleurs éléments de chaque.",
    },
    quiz: [
      { q: "Quelle est la réduction de temps constatée grâce à l'IA pour la rédaction ?", opts: ["30%", "50%", "70%", "90%"], correct: 2 },
      { q: "Comment éviter le texte IA trop générique ?", opts: ["Changer de modèle IA", "Injecter des données réelles, noms et chiffres spécifiques", "Utiliser un prompt plus long", "Activer le mode créatif"], correct: 1 },
    ],
  },
  "07": {
    title: "Créer des images avec l'IA",
    subtitle: "Midjourney, DALL-E, Stable Diffusion — maîtrisez la création visuelle",
    duration: "42 min", level: "Intermédiaire", color: "#f472b6",
    chapters: [
      {
        title: "Les outils de génération d'images",
        content: `La génération d'images par IA a révolutionné la création visuelle. En 2024, des millions d'entrepreneurs utilisent ces outils pour leurs visuels marketing, sans budget agence.

Les 3 grands outils :

Midjourney — Le roi du réalisme artistique
Accès via Discord. Idéal pour les visuels premium, photographies IA, illustrations stylisées.
Abonnement : 10-60€/mois selon usage.

DALL-E 3 (intégré dans ChatGPT)
Le plus simple d'accès. Excellent pour les illustrations et visuels conceptuels.
Inclus dans ChatGPT Plus (20€/mois).

Stable Diffusion — Open source et gratuit
Le plus puissant techniquement. Tourne en local. Courbe d'apprentissage plus élevée.`,
        concepts: [
          { term: "Prompt visuel", def: "La description textuelle qui guide la génération d'image — précision = qualité" },
          { term: "Style transfer", def: "Appliquer le style d'un artiste ou d'une esthétique particulière à une génération" },
          { term: "Seed", def: "Un nombre qui fixe l'aléatoire — permet de reproduire exactement la même image" },
        ],
      },
      {
        title: "Écrire des prompts images efficaces",
        content: `Structure d'un prompt image parfait :

[Sujet principal] + [Style/Ambiance] + [Technique/Médium] + [Paramètres techniques]

Exemple Midjourney :
"Professional entrepreneur woman at modern desk, natural light, Canon 5D, shallow depth of field, warm tones, editorial photography style --ar 16:9 --q 2"

Exemples par usage :
• Photo produit : "Product shot of [PRODUIT], white background, studio lighting, 8K, commercial photography"
• Portrait professionnel : "[DESCRIPTION], LinkedIn headshot, professional suit, soft bokeh, neutral background"
• Visuel marketing : "Bold minimalist poster for [MARQUE], geometric shapes, [COULEURS], sans-serif typography"

Règle d'or : soyez ultra-précis sur ce que vous voulez voir, et ajoutez le style artistique souhaité.`,
        concepts: [
          { term: "Aspect ratio", def: "Format de l'image — 16:9 pour bannières, 1:1 pour réseaux, 4:5 pour Instagram" },
          { term: "Negative prompt", def: "Ce que vous ne voulez PAS voir dans l'image (ex: 'no text, no watermark')" },
          { term: "Upscaling", def: "Augmenter la résolution d'une image générée pour l'impression ou affichage HD" },
        ],
      },
      {
        title: "Cas d'usage pour entrepreneurs",
        content: `1. Visuels réseaux sociaux
Posts Instagram, couvertures LinkedIn, thumbnails YouTube — générés en 2 minutes vs 2 heures avec un graphiste.

2. Images pour site web et landing pages
Hero images, illustrations de sections, avatars et icônes — cohérents avec votre charte.

3. Maquettes produit
Visualiser un produit qui n'existe pas encore, tester des coloris, présenter à des investisseurs.

4. Contenu marketing
Visuels pour publicités Meta/Google, newsletters, brochures — A/B test rapide de concepts visuels.

5. Branding et identité visuelle
Explorer des directions artistiques, tester des ambiances de marque, créer des moodboards.

Budget économisé vs agence : 500 à 5 000€/mois selon volume.`,
        concepts: [
          { term: "Consistance visuelle", def: "Garder le même style, couleurs et ambiance dans toutes vos images générées" },
          { term: "Moodboard IA", def: "Série d'images générées pour définir l'ambiance visuelle d'une marque ou projet" },
          { term: "Brand kit", def: "Ensemble de visuels cohérents (couleurs, styles, typographies) générés et validés" },
        ],
      },
    ],
    exercise: {
      title: "Exercice : Créez 3 visuels pour votre marque",
      desc: "Utilisez DALL-E 3 (via ChatGPT) pour créer 3 visuels cohérents : un visuel hero, un visuel produit, un visuel réseaux sociaux.",
      exemple: "PROMPT HERO :\n'Minimalist hero image for a premium business coaching brand. Dark background with gold accents, abstract geometric shapes, professional and aspirational mood, wide format 16:9'\n\nPROMPT RÉSEAUX :\n'Square social media post for business coaching, inspirational quote overlay space, dark navy and gold color palette, modern typography, Instagram-ready 1:1'\n\nAstuce : utilisez le même style artistique dans les 3 pour la cohérence.",
    },
    quiz: [
      { q: "Quel outil de génération d'images est inclus dans ChatGPT Plus ?", opts: ["Midjourney", "Stable Diffusion", "DALL-E 3", "Adobe Firefly"], correct: 2 },
      { q: "Que signifie 'negative prompt' en génération d'images ?", opts: ["Un prompt qui génère des images sombres", "Spécifier ce qu'on ne veut pas voir dans l'image", "Un feedback négatif sur l'image", "Un type d'image en noir et blanc"], correct: 1 },
    ],
  },
  "08": {
    title: "Analyser des données avec l'IA",
    subtitle: "Transformer vos données en insights actionnables sans être data scientist",
    duration: "45 min", level: "Intermédiaire", color: "#4ade80",
    chapters: [
      {
        title: "L'analyse de données accessible à tous",
        content: `Analyser ses données était autrefois réservé aux data scientists. Aujourd'hui, avec ChatGPT Advanced Data Analysis (anciennement Code Interpreter), vous pouvez analyser n'importe quel fichier CSV ou Excel en quelques secondes.

Ce que l'IA peut analyser pour vous :
- Ventes et chiffre d'affaires (tendances, saisonnalité, clients top)
- Données clients (segmentation, comportement, rétention)
- Performances marketing (CPL, ROI par canal, conversion)
- Opérations (délais, coûts, efficacité)
- Finances (trésorerie, marges, prévisions)

Avant l'IA : 4 à 8 heures avec Excel avancé. Avec l'IA : 10 à 30 minutes.`,
        concepts: [
          { term: "Data Analysis", def: "Fonctionnalité ChatGPT qui permet d'uploader des fichiers et d'analyser les données" },
          { term: "Insight", def: "Une découverte actionnable tirée de l'analyse — pas juste un chiffre, mais une décision" },
          { term: "Corrélation", def: "Relation statistique entre deux variables (ex: température et ventes de glaces)" },
        ],
      },
      {
        title: "Prompts d'analyse de données",
        content: `Une fois votre fichier uploadé dans ChatGPT, utilisez ces prompts :

Analyse générale :
"Analyse ce fichier de ventes. Donne-moi les 5 insights les plus importants avec des graphiques."

Segmentation clients :
"Segmente mes clients en groupes selon leur valeur (CA, fréquence, ancienneté). Donne un nom et une stratégie pour chaque segment."

Prévisions :
"En te basant sur mes ventes des 18 derniers mois, génère une prévision pour les 6 prochains mois avec 3 scénarios."

Anomalies :
"Y a-t-il des valeurs aberrantes dans mes données ? Des mois anormaux ? Des clients outliers ?"

Recommandations :
"Quelles sont tes 3 recommandations concrètes basées sur cette analyse ?"`,
        concepts: [
          { term: "Segmentation RFM", def: "Classer clients par Récence, Fréquence et Montant d'achat pour les cibler" },
          { term: "Outlier", def: "Valeur qui s'écarte significativement des autres — peut signaler un problème ou opportunité" },
          { term: "Prévision", def: "Projection des données futures basée sur les tendances historiques" },
        ],
      },
      {
        title: "Construire des tableaux de bord automatisés",
        content: `Au-delà de l'analyse ponctuelle, l'IA peut vous aider à construire des systèmes de suivi automatisés.

Option 1 — Google Sheets + Gemini
Données auto-actualisées + analyse IA intégrée directement dans vos feuilles.

Option 2 — Notion + ChatGPT
Dashboard Notion avec rapports IA générés chaque semaine sur vos KPIs.

Option 3 — Airtable + Zapier + ChatGPT
Données structurées, alertes automatiques si un KPI passe sous le seuil.

KPIs essentiels pour un entrepreneur :
CA mensuel / MRR · Taux de conversion · CAC · LTV · NPS · Trésorerie prévisionnelle

Conseil : analysez d'abord avec l'IA, puis construisez le dashboard une fois que vous savez quels KPIs comptent vraiment.`,
        concepts: [
          { term: "KPI", def: "Key Performance Indicator — indicateur clé pour mesurer la santé de votre activité" },
          { term: "MRR", def: "Monthly Recurring Revenue — revenu récurrent mensuel (essentiel pour abonnements)" },
          { term: "LTV", def: "Lifetime Value — revenu total généré par un client sur toute sa durée de vie" },
        ],
      },
    ],
    exercise: {
      title: "Exercice : Analysez vos données réelles",
      desc: "Exportez 3 mois de données depuis votre outil de facturation ou tableau de bord (en CSV). Uploadez-les dans ChatGPT Advanced Data Analysis et demandez les 5 insights principaux.",
      exemple: "PROMPTS À UTILISER :\n1. 'Analyse ce fichier. Quelles sont les 5 découvertes les plus importantes ?'\n2. 'Crée un graphique de tendance du CA par mois'\n3. 'Qui sont mes 10 meilleurs clients ? Quelles caractéristiques partagent-ils ?'\n4. 'Y a-t-il des patterns dans mes meilleures semaines de vente ?'\n5. 'Génère 3 recommandations concrètes basées sur ces données'",
    },
    quiz: [
      { q: "Que signifie LTV dans l'analyse client ?", opts: ["Long Term Vision", "Lifetime Value", "Lead To Value", "Learning Transfer Value"], correct: 1 },
      { q: "Quelle fonctionnalité ChatGPT permet d'analyser des fichiers CSV ?", opts: ["ChatGPT Plugins", "Advanced Data Analysis", "Custom GPTs", "Memory Mode"], correct: 1 },
    ],
  },
  "09": {
    title: "L'IA pour les entrepreneurs",
    subtitle: "Stratégie complète pour intégrer l'IA dans votre business",
    duration: "50 min", level: "Avancé", color: "#a78bfa",
    chapters: [
      {
        title: "Construire votre stack IA personnel",
        content: `Un "stack IA" c'est l'ensemble des outils IA que vous utilisez au quotidien. En 2025, un entrepreneur optimisé a généralement 3 à 6 outils IA dans son quotidien.

Stack recommandé par DJAMA :
Cerveau — ChatGPT GPT-4o (rédaction, analyse, stratégie)
Images — DALL-E 3 ou Midjourney (visuels marketing)
Audio — Whisper (transcription) + ElevenLabs (voix IA)
Vidéo — Captions ou HeyGen (édition et présentations IA)
Automatisation — Zapier ou Make (flux de travail)
Spécialisé — Notion AI (notes) ou Perplexity (recherche)

Budget indicatif : 80 à 200€/mois pour un stack complet pro.
ROI typique : 15 à 30 heures économisées par semaine.`,
        concepts: [
          { term: "Stack IA", def: "L'ensemble des outils IA intégrés dans votre workflow au quotidien" },
          { term: "Orchestration", def: "Faire travailler plusieurs IA ensemble pour accomplir une tâche complexe" },
          { term: "Single source of truth", def: "Un outil central (Notion, Airtable) où toutes les données convergent" },
        ],
      },
      {
        title: "Nouvelles offres de services rendues possibles par l'IA",
        content: `L'IA ne fait pas que vous rendre plus efficace — elle crée de nouvelles sources de revenus.

Services que vous pouvez maintenant proposer :

1. Création de contenu scalable
Gérer 10 clients en contenu avec l'IA au lieu de 3. Tarif maintenu, marge multipliée.

2. Conseil en stratégie IA
Aider d'autres entrepreneurs à implémenter l'IA dans leur activité. 200-500€/heure.

3. Produits digitaux IA
E-books, formations, templates prompt — créés 5x plus vite, vendus en automatique.

4. Automatisation pour clients
Construire et maintenir des workflows IA pour d'autres businesses. MRR prévisible.

5. Agence de contenu IA
Production de contenu à grande échelle (articles, posts, newsletters) pour plusieurs clients.`,
        concepts: [
          { term: "Scalabilité", def: "Capacité à augmenter les revenus sans augmenter proportionnellement le temps de travail" },
          { term: "MRR", def: "Revenu mensuel récurrent — le Saint-Graal de l'entrepreneur qui sert plusieurs clients" },
          { term: "Productisation", def: "Transformer un service personnalisé en offre standardisée et scalable" },
        ],
      },
      {
        title: "Rester compétitif à l'ère de l'IA",
        content: `L'IA ne remplace pas les entrepreneurs — elle écarte ceux qui ne s'adaptent pas.

Les 3 compétences qui restent humaines (et donc précieuses) :
1. Jugement et vision stratégique — décider QUOI faire, l'IA exécute le COMMENT
2. Relation client — l'empathie, la confiance, la compréhension profonde des besoins
3. Créativité originale — les idées vraiment nouvelles viennent encore de l'expérience humaine

Comment rester à jour :
- Suivre 3-5 newsletters IA (The Rundown AI, TLDR AI, Superhuman)
- Tester un nouvel outil par mois
- Rejoindre des communautés d'entrepreneurs IA
- Consacrer 30 min par semaine à l'expérimentation

L'avantage concurrentiel de demain : la capacité à combiner expertise métier + maîtrise IA.`,
        concepts: [
          { term: "Veille IA", def: "Processus régulier pour suivre les évolutions des outils et modèles IA" },
          { term: "Avantage compétitif", def: "Ce que vous faites mieux que vos concurrents — combinaison expertise + IA" },
          { term: "Upskilling", def: "Se former continuellement pour maintenir ses compétences à niveau dans un domaine en évolution rapide" },
        ],
      },
    ],
    exercise: {
      title: "Exercice : Construisez votre roadmap IA 90 jours",
      desc: "Créez un plan concret sur 90 jours pour intégrer l'IA dans votre activité : 3 outils à tester, 2 workflows à construire, 1 nouvelle offre à explorer.",
      exemple: "ROADMAP EXEMPLE :\n\nMois 1 — Fondations\n• Tester ChatGPT Pro 30 jours\n• Automatiser réponses emails avec Zapier\n• Créer 5 templates prompts pour tâches récurrentes\n\nMois 2 — Amplification\n• Lancer Midjourney pour visuels marketing\n• Construire workflow contenu social (rédaction + images)\n• Analyser ses données clients avec Data Analysis\n\nMois 3 — Monétisation\n• Proposer un audit IA à 2 clients existants\n• Créer un lead magnet (guide) généré à 80% par IA\n• Mesurer le gain de temps et ROI",
    },
    quiz: [
      { q: "Quel est le budget mensuel indicatif pour un stack IA complet pour entrepreneur ?", opts: ["10-20€", "50-80€", "80-200€", "500-1000€"], correct: 2 },
      { q: "Parmi ces compétences, laquelle reste irremplaçable par l'IA ?", opts: ["Rédaction de base", "Analyse de données simples", "Jugement et vision stratégique", "Génération d'images"], correct: 2 },
    ],
  },
};

/* ─── Types ─────────────────────────────────────────────────────── */

type ChatMsg = { role: "user" | "assistant"; content: string };

/* ─── Prof IA Panel ─────────────────────────────────────────────── */

function ProfIAPanel({
  coursId, coursTitle, chapterTitle, chapterContent,
}: {
  coursId: string; coursTitle: string; chapterTitle: string; chapterContent: string;
}) {
  const [msgs,    setMsgs]    = useState<ChatMsg[]>([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/coaching/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          coursId,
          coursTitle,
          chapterTitle,
          chapterContent: chapterContent.slice(0, 1500),
          question: userMsg.content,
          history:  msgs.slice(-8),
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      const reply = res.ok && data.reply
        ? data.reply
        : (data.error ?? "Une erreur s'est produite. Réessaie.");
      setMsgs(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Erreur de connexion. Réessaie." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="relative overflow-hidden rounded-2xl border"
      style={{ borderColor: "rgba(217,70,239,0.3)", background: "rgba(217,70,239,0.03)" }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(217,70,239,0.07) 0%, transparent 60%)" }} />

      {/* Header */}
      <div className="relative flex items-center gap-3 border-b border-white/6 px-5 py-4">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-[rgba(217,70,239,0.15)]" style={{ borderColor: "rgba(217,70,239,0.35)" }}>
            <Brain size={18} className="text-fuchsia-400" />
          </div>
          <motion.div
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#4ade80]"
            style={{ boxShadow: "0 0 0 2px #0a0f1e" }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <div>
          <p className="font-extrabold text-white">Prof IA</p>
          <p className="text-[0.65rem] text-white/35">Posez vos questions sur ce cours — je réponds en direct</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)] px-2.5 py-1 text-[0.6rem] font-bold text-[#4ade80]">
          <div className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          En ligne
        </div>
      </div>

      {/* Messages */}
      <div className="relative h-72 overflow-y-auto space-y-3 p-4">
        {/* Greeting */}
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(217,70,239,0.2)]">
            <Brain size={11} className="text-fuchsia-400" />
          </div>
          <div className="max-w-sm rounded-2xl rounded-tl-none border border-[rgba(217,70,239,0.18)] bg-[rgba(217,70,239,0.08)] px-3.5 py-2.5">
            <p className="text-xs leading-relaxed text-white/70">
              Bonjour ! Je suis ton prof IA pour{" "}
              <span className="font-bold text-fuchsia-300">{coursTitle}</span>.
              Pose-moi n'importe quelle question, je suis là pour t'aider.
            </p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {msgs.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(217,70,239,0.2)]">
                  <Brain size={11} className="text-fuchsia-400" />
                </div>
              )}
              <div
                className={`max-w-xs rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-tr-none border border-[rgba(217,70,239,0.3)] bg-[rgba(217,70,239,0.15)] text-white/85"
                    : "rounded-tl-none border border-[rgba(217,70,239,0.15)] bg-[rgba(217,70,239,0.07)] text-white/70"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5">
            <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(217,70,239,0.2)]">
              <Brain size={11} className="text-fuchsia-400" />
            </div>
            <div className="rounded-2xl rounded-tl-none border border-[rgba(217,70,239,0.15)] bg-[rgba(217,70,239,0.07)] px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(j => (
                  <motion.div
                    key={j}
                    className="h-1.5 w-1.5 rounded-full bg-fuchsia-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="relative border-t border-white/6 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !loading) { e.preventDefault(); void send(); } }}
            placeholder={`Question sur "${coursTitle}"...`}
            className="flex-1 rounded-xl border border-white/8 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/20 transition-colors focus:border-[rgba(217,70,239,0.45)]"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => void send()}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-[rgba(217,70,239,0.15)] text-fuchsia-400 transition hover:bg-[rgba(217,70,239,0.25)] disabled:opacity-40"
            style={{ borderColor: "rgba(217,70,239,0.35)" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </motion.button>
        </div>
        <p className="mt-1.5 text-center text-[0.6rem] text-white/18">Entrée pour envoyer · Le Prof IA connaît ce module</p>
      </div>
    </motion.div>
  );
}

/* ─── Page principale ───────────────────────────────────────────── */

export default function CoursDetailPage() {
  const params = useParams();
  const id     = (params?.id as string) ?? "01";
  const cours  = COURS_DATA[id];
  const numId  = parseInt(id, 10);

  const [activeChap,   setActiveChap]   = useState(0);
  const [showExercise, setShowExercise] = useState(false);
  const [showExemple,  setShowExemple]  = useState(false);
  const [quizStarted,  setQuizStarted]  = useState(false);
  const [qIndex,       setQIndex]       = useState(0);
  const [selected,     setSelected]     = useState<number | null>(null);
  const [answers,      setAnswers]      = useState<number[]>([]);
  const [quizDone,     setQuizDone]     = useState(false);

  // Fallback (modules 10-20) state — always declared to respect hooks rules
  const [fbChap,        setFbChap]        = useState(0);
  const [fbQuizStarted, setFbQuizStarted] = useState(false);
  const [fbQIndex,      setFbQIndex]      = useState(0);
  const [fbSelected,    setFbSelected]    = useState<number | null>(null);
  const [fbAnswers,     setFbAnswers]     = useState<number[]>([]);
  const [fbQuizDone,    setFbQuizDone]    = useState(false);

  async function saveProgress(score: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !cours) return;
      await supabase.from("coaching_progress").upsert({
        user_id:      user.id,
        cours_id:     id,
        completed:    score === cours.quiz.length,
        quiz_score:   score,
        completed_at: score === cours.quiz.length ? new Date().toISOString() : null,
      }, { onConflict: "user_id,cours_id" });
    } catch {}
  }

  function handleAnswer(idx: number) {
    if (selected !== null || !cours) return;
    setSelected(idx);
    setTimeout(() => {
      const next = [...answers, idx];
      setAnswers(next);
      if (qIndex + 1 >= cours.quiz.length) {
        setQuizDone(true);
        const score = next.filter((a, i) => a === cours.quiz[i].correct).length;
        void saveProgress(score);
      } else {
        setQIndex(q => q + 1);
        setSelected(null);
      }
    }, 900);
  }

  function resetQuiz() {
    setQIndex(0); setSelected(null); setAnswers([]); setQuizDone(false); setQuizStarted(false);
  }

  const prevId = numId > 1  ? String(numId - 1).padStart(2, "0") : null;
  const nextId = numId < 20 ? String(numId + 1).padStart(2, "0") : null;

  /* ── Modules 10-20 : contenu structuré + Prof IA ── */
  if (!cours) {
    const title = FALLBACK_TITLES[id] ?? `Module ${id}`;
    const fallbackColor = "#d946ef";
    const FALLBACK_CHAPTERS = [
      { label: "Concepts fondamentaux", icon: BookOpen },
      { label: "Mise en pratique",      icon: Target   },
      { label: "Cas avancés",           icon: Zap      },
    ];
    const fbQuiz = [
      { q: `Quelle est la principale utilité de "${title}" pour un entrepreneur ?`, opts: ["Remplacer ses employés", "Gagner du temps et améliorer la qualité", "Créer une app mobile", "Gérer sa comptabilité"], correct: 1 },
      { q: "Quel est le premier réflexe avant d'utiliser un outil IA sur un nouveau domaine ?", opts: ["Le tester sans lire la doc", "Identifier précisément le cas d'usage et le résultat attendu", "Choisir le modèle le plus cher", "Attendre qu'il soit parfait"], correct: 1 },
    ];

    function fbHandleAnswer(idx: number) {
      if (fbSelected !== null) return;
      setFbSelected(idx);
      setTimeout(() => {
        const next = [...fbAnswers, idx];
        setFbAnswers(next);
        if (fbQIndex + 1 >= fbQuiz.length) {
          setFbQuizDone(true);
          const score = next.filter((a, i) => a === fbQuiz[i].correct).length;
          void (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from("coaching_progress").upsert({
                user_id: user.id, cours_id: id,
                completed: score === fbQuiz.length,
                quiz_score: score,
                completed_at: score === fbQuiz.length ? new Date().toISOString() : null,
              }, { onConflict: "user_id,cours_id" });
            } catch {}
          })();
        } else {
          setFbQIndex(q => q + 1);
          setFbSelected(null);
        }
      }, 900);
    }

    const fbScore = fbAnswers.filter((a, i) => a === fbQuiz[i].correct).length;

    return (
      <div className="min-h-screen bg-[#0a0f1e]">
        {/* Sub-header */}
        <div className="relative z-10 border-b border-white/6 bg-white/[0.025] px-5 py-3.5 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/client/coaching-ia" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ChevronLeft size={13} /> Coaching IA
              </Link>
              <span className="text-white/15">·</span>
              <span className="text-xs font-bold text-fuchsia-400">Module {id}</span>
            </div>
            <span className="rounded-full border border-fuchsia-500/30 px-2.5 py-0.5 text-[0.6rem] font-bold text-fuchsia-400">Avancé</span>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-3xl space-y-6 px-5 py-6 sm:px-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="relative overflow-hidden rounded-2xl border bg-white/[0.025] p-6"
            style={{ borderColor: "rgba(217,70,239,0.25)" }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(217,70,239,0.5), transparent)" }} />
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(217,70,239,0.06) 0%, transparent 60%)" }} />
            <div className="relative">
              <p className="text-[0.65rem] font-medium text-fuchsia-400">Module {id} / 20</p>
              <h1 className="mt-1 text-2xl font-bold text-white">{title}</h1>
              <p className="mt-1 text-sm text-white/40">Formation avancée — posez vos questions au Prof IA pour approfondir chaque concept.</p>
            </div>
          </motion.div>

          {/* Video player */}
          <VideoPlayer title={`Leçon vidéo — ${title}`} courseColor={fallbackColor} />

          {/* Chapter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FALLBACK_CHAPTERS.map((ch, i) => {
              const ChIcon = ch.icon;
              return (
                <button key={i} onClick={() => setFbChap(i)}
                  className={`relative shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${fbChap === i ? "text-white" : "text-white/35 hover:text-white/60 border border-white/6 bg-white/3"}`}>
                  {fbChap === i && (
                    <motion.div layoutId="fb-chap-bg" className="absolute inset-0 rounded-xl"
                      style={{ background: "rgba(217,70,239,0.18)", border: "1px solid rgba(217,70,239,0.4)" }}
                      transition={{ duration: 0.2 }} />
                  )}
                  <ChIcon size={11} className="relative" />
                  <span className="relative">{i + 1}. {ch.label}</span>
                </button>
              );
            })}
          </div>

          {/* Chapter content */}
          <AnimatePresence mode="wait">
            <motion.div key={fbChap}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, ease }}
              className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] p-6">
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 40% at 0% 0%, rgba(217,70,239,0.07) 0%, transparent 60%)" }} />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(217,70,239,0.15)] border border-[rgba(217,70,239,0.3)]">
                    {fbChap === 0 ? <BookOpen size={14} className="text-fuchsia-400" /> : fbChap === 1 ? <Target size={14} className="text-fuchsia-400" /> : <Zap size={14} className="text-fuchsia-400" />}
                  </div>
                  <h2 className="text-base font-extrabold text-white">{FALLBACK_CHAPTERS[fbChap].label} — {title}</h2>
                </div>
                <p className="text-sm leading-relaxed text-white/55">
                  {fbChap === 0 && `Ce module couvre les concepts fondamentaux de "${title}" appliqués au contexte entrepreneurial. Posez vos questions au Prof IA ci-dessous pour obtenir des explications personnalisées adaptées à votre activité.`}
                  {fbChap === 1 && `La mise en pratique de "${title}" commence par identifier 2 à 3 cas d'usage concrets dans votre activité. Utilisez le Prof IA pour construire votre premier exercice pratique guidé et obtenir des retours en temps réel.`}
                  {fbChap === 2 && `Les cas avancés de "${title}" permettent d'aller plus loin en combinant plusieurs approches. Le Prof IA peut vous accompagner sur des scénarios complexes propres à votre secteur d'activité.`}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    { term: "Concept clé 1", def: `Base essentielle de ${title.split(" ")[0]} — demandez au Prof IA une explication détaillée` },
                    { term: "Application pratique", def: "Identifiez comment ce concept s'applique à votre activité quotidienne" },
                    { term: "Niveau avancé", def: "Combinez ce module avec les précédents pour des résultats exponentiels" },
                  ].map(({ term, def }) => (
                    <div key={term} className="relative overflow-hidden rounded-xl border border-white/6 bg-white/[0.02] p-3">
                      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 0% 0%, rgba(217,70,239,0.07) 0%, transparent 70%)" }} />
                      <p className="relative text-xs font-extrabold text-fuchsia-400">{term}</p>
                      <p className="relative mt-1 text-[0.7rem] leading-relaxed text-white/40">{def}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Quiz */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.2)] bg-white/[0.025] p-6">
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(167,139,250,0.07) 0%, transparent 60%)" }} />
            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(167,139,250,0.12)] border border-[rgba(167,139,250,0.2)]">
                  <Trophy size={15} className="text-[#a78bfa]" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white">Quiz du module</p>
                  <p className="text-[0.65rem] text-white/35">2 questions · Score sauvegardé</p>
                </div>
              </div>
              {!fbQuizStarted ? (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setFbQuizStarted(true)}
                  className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-black shadow-[0_4px_20px_rgba(167,139,250,0.35)]"
                  style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
                  <Play size={13} fill="black" /> Lancer le quiz
                </motion.button>
              ) : fbQuizDone ? (
                <div className="space-y-4 text-center py-2">
                  <p className="text-3xl font-extrabold" style={{ color: fbScore === fbQuiz.length ? "#4ade80" : "#f59e0b" }}>
                    {fbScore}/{fbQuiz.length}
                  </p>
                  <p className="text-xs text-white/40">{fbScore === fbQuiz.length ? "Parfait ! Module maîtrisé." : "Relisez et réessayez."}</p>
                  {fbScore === fbQuiz.length && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.3)] px-3 py-1 text-xs font-bold text-[#4ade80]">
                      <CheckCircle2 size={11} /> Module complété
                    </motion.div>
                  )}
                  <button onClick={() => { setFbQIndex(0); setFbSelected(null); setFbAnswers([]); setFbQuizDone(false); setFbQuizStarted(false); }}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold text-white/60 hover:text-white transition-colors">
                    <RefreshCw size={11} /> Rejouer
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Question {fbQIndex + 1}/{fbQuiz.length}</span>
                    <div className="flex gap-1">
                      {fbQuiz.map((_, i) => (
                        <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i < fbQIndex ? "bg-[#a78bfa]" : i === fbQIndex ? "bg-[#a78bfa] opacity-50" : "bg-white/10"}`} />
                      ))}
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={fbQIndex} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                      <p className="text-sm font-bold text-white mb-3">{fbQuiz[fbQIndex].q}</p>
                      <div className="space-y-2">
                        {fbQuiz[fbQIndex].opts.map((opt, i) => {
                          const isCorrect = i === fbQuiz[fbQIndex].correct;
                          const isSelected = fbSelected === i;
                          const revealed = fbSelected !== null;
                          return (
                            <motion.button key={i} whileHover={!revealed ? { x: 3 } : {}}
                              onClick={() => fbHandleAnswer(i)} disabled={revealed}
                              className={`w-full rounded-xl border px-4 py-2.5 text-left text-xs font-semibold transition-all ${
                                !revealed ? "border-white/8 bg-white/4 text-white/65 hover:border-white/20 hover:text-white" :
                                isCorrect ? "border-[rgba(74,222,128,0.4)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]" :
                                isSelected ? "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-[#f87171]" :
                                "border-white/4 bg-white/2 text-white/20"
                              }`}>
                              <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>{opt}
                              {revealed && isCorrect && <CheckCircle2 size={12} className="inline ml-2 text-[#4ade80]" />}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          <ProfIAPanel coursId={id} coursTitle={title} chapterTitle={FALLBACK_CHAPTERS[fbChap].label} chapterContent="" />

          <div className="flex items-center justify-between pt-2">
            {prevId ? (
              <Link href={`/client/coaching-ia/cours/${prevId}`}
                className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-5 py-2.5 text-xs font-bold text-white/50 hover:text-white transition-colors">
                <ChevronLeft size={13} /> Module {prevId}
              </Link>
            ) : <div />}
            <Link href="/client/coaching-ia" className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
              <Brain size={11} /> Hub
            </Link>
            {nextId ? (
              <Link href={`/client/coaching-ia/cours/${nextId}`}
                className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-5 py-2.5 text-xs font-bold text-white/50 hover:text-white transition-colors">
                Module {nextId} <ChevronRight size={13} />
              </Link>
            ) : <div />}
          </div>
        </div>
      </div>
    );
  }

  const chap  = cours.chapters[activeChap];
  const score = answers.filter((a, i) => a === cours.quiz[i].correct).length;

  return (
    <div className="min-h-screen bg-[#0a0f1e]">

      {/* Sub-header */}
      <div className="relative z-10 border-b border-white/6 bg-white/[0.025] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/client/coaching-ia" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
              <ChevronLeft size={13} /> Coaching IA
            </Link>
            <span className="text-white/15">·</span>
            <span className="text-xs font-bold" style={{ color: cours.color }}>Module {id}</span>
          </div>
          <div className="flex items-center gap-3 text-[0.65rem] text-white/30">
            <span className="flex items-center gap-1"><Clock size={10} /> {cours.duration}</span>
            <span className="rounded-full border px-2 py-0.5 font-bold" style={{ borderColor: cours.color + "40", color: cours.color }}>{cours.level}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl space-y-6 px-5 py-6 sm:px-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="relative overflow-hidden rounded-2xl border bg-white/[0.025] p-6"
          style={{ borderColor: cours.color + "30" }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cours.color}60, transparent)` }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${cours.color}09 0%, transparent 60%)` }} />
          <div className="relative">
            <p className="text-[0.65rem] font-medium" style={{ color: cours.color }}>Module {id} / 20</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{cours.title}</h1>
            <p className="mt-1 text-sm text-white/45">{cours.subtitle}</p>
          </div>
        </motion.div>

        {/* Video player */}
        <VideoPlayer title={`Leçon vidéo — ${cours.title}`} courseColor={cours.color} />

        {/* Chapter nav */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {cours.chapters.map((ch, i) => (
            <button
              key={i}
              onClick={() => setActiveChap(i)}
              className={`relative shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeChap === i ? "text-white" : "text-white/35 hover:text-white/60 border border-white/6 bg-white/3"
              }`}
            >
              {activeChap === i && (
                <motion.div
                  layoutId="chap-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: cours.color + "20", border: `1px solid ${cours.color}40` }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <span className="relative">{i + 1}. {ch.title.split(" ").slice(0, 4).join(" ")}{ch.title.split(" ").length > 4 ? "…" : ""}</span>
            </button>
          ))}
        </motion.div>

        {/* Chapter content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChap}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease }}
            className="space-y-5"
          >
            {/* Content card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] p-6">
              <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 50% 40% at 0% 0%, ${cours.color}08 0%, transparent 60%)` }} />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: cours.color + "18", border: `1px solid ${cours.color}30` }}>
                    <BookOpen size={14} style={{ color: cours.color }} />
                  </div>
                  <h2 className="text-base font-extrabold text-white">{chap.title}</h2>
                </div>
                <div className="space-y-3">
                  {chap.content.split("\n\n").map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed text-white/60 whitespace-pre-line">{para}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Key concepts */}
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-xs font-bold text-white/50">
                <Lightbulb size={12} style={{ color: cours.color }} /> Concepts clés
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {chap.concepts.map(({ term, def }) => (
                  <div key={term} className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/[0.025] p-4">
                    <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 60% at 0% 0%, ${cours.color}08 0%, transparent 70%)` }} />
                    <p className="relative text-xs font-extrabold" style={{ color: cours.color }}>{term}</p>
                    <p className="relative mt-1.5 text-[0.7rem] leading-relaxed text-white/40">{def}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapter nav arrows */}
            <div className="flex items-center justify-between">
              <button
                disabled={activeChap === 0}
                onClick={() => setActiveChap(i => i - 1)}
                className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-xs font-bold text-white/40 transition hover:text-white disabled:opacity-20"
              >
                <ChevronLeft size={12} /> Précédent
              </button>
              <span className="text-[0.6rem] text-white/25">{activeChap + 1} / {cours.chapters.length}</span>
              <button
                disabled={activeChap === cours.chapters.length - 1}
                onClick={() => setActiveChap(i => i + 1)}
                className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-xs font-bold text-white/40 transition hover:text-white disabled:opacity-20"
              >
                Suivant <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Exercice */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-[rgba(245,158,11,0.2)] bg-white/[0.025]"
        >
          <button
            onClick={() => setShowExercise(e => !e)}
            className="flex w-full items-center justify-between p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.2)]">
                <Target size={15} className="text-[#f59e0b]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-white">{cours.exercise.title}</p>
                <p className="text-[0.65rem] text-white/35">Mettez en pratique ce que vous venez d'apprendre</p>
              </div>
            </div>
            <ChevronRight size={14} className={`text-[#f59e0b] transition-transform duration-200 ${showExercise ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {showExercise && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-[rgba(245,158,11,0.12)]"
              >
                <div className="space-y-4 p-5">
                  <p className="text-sm leading-relaxed text-white/60">{cours.exercise.desc}</p>
                  <button onClick={() => setShowExemple(e => !e)} className="flex items-center gap-2 text-xs font-bold text-[#f59e0b] hover:opacity-80 transition-opacity">
                    <Sparkles size={11} /> {showExemple ? "Masquer" : "Voir"} l'exemple
                  </button>
                  <AnimatePresence>
                    {showExemple && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)] p-4">
                        <pre className="text-xs leading-relaxed text-white/55 whitespace-pre-wrap font-sans">{cours.exercise.exemple}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mini Quiz */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.25 }}
          className="relative overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.2)] bg-white/[0.025] p-6"
        >
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(167,139,250,0.07) 0%, transparent 60%)" }} />
          <div className="relative">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(167,139,250,0.12)] border border-[rgba(167,139,250,0.2)]">
                <Trophy size={15} className="text-[#a78bfa]" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">Quiz du module</p>
                <p className="text-[0.65rem] text-white/35">{cours.quiz.length} questions · Score sauvegardé</p>
              </div>
            </div>

            {!quizStarted ? (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setQuizStarted(true)}
                className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-black shadow-[0_4px_20px_rgba(167,139,250,0.35)]"
                style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}
              >
                <Play size={13} fill="black" /> Lancer le quiz
              </motion.button>
            ) : quizDone ? (
              <div className="space-y-4 text-center py-2">
                <AnimatePresence>
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-2">
                    <p className="text-3xl font-extrabold" style={{ color: score === cours.quiz.length ? "#4ade80" : score >= cours.quiz.length / 2 ? "#f59e0b" : "#f87171" }}>
                      {score}/{cours.quiz.length}
                    </p>
                    <p className="text-xs text-white/40">
                      {score === cours.quiz.length ? "Parfait ! Module maîtrisé — progression sauvegardée." : "Relisez le cours et réessayez."}
                    </p>
                    {score === cours.quiz.length && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.3)] px-3 py-1 text-xs font-bold text-[#4ade80]">
                        <CheckCircle2 size={11} /> Module complété
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
                <button onClick={resetQuiz} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold text-white/60 hover:text-white transition-colors">
                  <RefreshCw size={11} /> Rejouer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Question {qIndex + 1}/{cours.quiz.length}</span>
                  <div className="flex gap-1">
                    {cours.quiz.map((_, i) => (
                      <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i < qIndex ? "bg-[#a78bfa]" : i === qIndex ? "bg-[#a78bfa] opacity-50" : "bg-white/10"}`} />
                    ))}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={qIndex} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                    <p className="text-sm font-bold text-white mb-3">{cours.quiz[qIndex].q}</p>
                    <div className="space-y-2">
                      {cours.quiz[qIndex].opts.map((opt, i) => {
                        const isCorrect = i === cours.quiz[qIndex].correct;
                        const isSelected = selected === i;
                        const revealed = selected !== null;
                        return (
                          <motion.button
                            key={i}
                            whileHover={!revealed ? { x: 3 } : {}}
                            onClick={() => handleAnswer(i)}
                            disabled={revealed}
                            className={`w-full rounded-xl border px-4 py-2.5 text-left text-xs font-semibold transition-all ${
                              !revealed ? "border-white/8 bg-white/4 text-white/65 hover:border-white/20 hover:text-white" :
                              isCorrect ? "border-[rgba(74,222,128,0.4)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]" :
                              isSelected ? "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-[#f87171]" :
                              "border-white/4 bg-white/2 text-white/20"
                            }`}
                          >
                            <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>{opt}
                            {revealed && isCorrect && <CheckCircle2 size={12} className="inline ml-2 text-[#4ade80]" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Prof IA ── */}
        <ProfIAPanel
          coursId={id}
          coursTitle={cours.title}
          chapterTitle={chap.title}
          chapterContent={chap.content}
        />

        {/* Module navigation */}
        <div className="flex items-center justify-between pt-2">
          {prevId ? (
            <Link href={`/client/coaching-ia/cours/${prevId}`}
              className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-5 py-2.5 text-xs font-bold text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={13} /> Module {prevId}
            </Link>
          ) : <div />}
          <Link href="/client/coaching-ia" className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
            <Brain size={11} /> Hub
          </Link>
          {nextId ? (
            <Link href={`/client/coaching-ia/cours/${nextId}`}
              className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-5 py-2.5 text-xs font-bold text-white/50 hover:text-white transition-colors">
              Module {nextId} <ChevronRight size={13} />
            </Link>
          ) : <div />}
        </div>

      </div>
    </div>
  );
}
