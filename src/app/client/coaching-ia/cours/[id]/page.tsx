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

  /* ── Cours 05-20 : page Prof IA simple ── */
  if (!cours) {
    const title = FALLBACK_TITLES[id] ?? `Module ${id}`;
    return (
      <div className="min-h-screen bg-[#0a0f1e]">
        <div className="relative z-10 border-b border-white/6 bg-white/[0.025] px-5 py-3.5 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/client/coaching-ia" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ChevronLeft size={13} /> Coaching IA
              </Link>
              <span className="text-white/15">·</span>
              <span className="text-xs font-bold text-fuchsia-400">Module {id}</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-3xl space-y-6 px-5 py-6 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="relative overflow-hidden rounded-2xl border bg-white/[0.025] p-6"
            style={{ borderColor: "rgba(217,70,239,0.25)" }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(217,70,239,0.5), transparent)" }} />
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(217,70,239,0.06) 0%, transparent 60%)" }} />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-[rgba(217,70,239,0.15)]" style={{ borderColor: "rgba(217,70,239,0.3)" }}>
                <GraduationCap size={24} className="text-fuchsia-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-fuchsia-400">Module {id} / 20</p>
                <h1 className="mt-0.5 text-xl font-extrabold text-white">{title}</h1>
                <p className="mt-1 text-sm text-white/40">Le contenu structuré arrive bientôt — le Prof IA peut déjà t'enseigner ce sujet !</p>
              </div>
            </div>
          </motion.div>

          <ProfIAPanel
            coursId={id}
            coursTitle={title}
            chapterTitle=""
            chapterContent=""
          />

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
