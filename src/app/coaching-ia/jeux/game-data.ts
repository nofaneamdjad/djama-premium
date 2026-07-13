/* ── DJAMA Jeux IA — Game Data ── */
export type Q =
  | { t: "q"; q: string; o: string[]; c: number; e: string }
  | { t: "v"; q: string; a: boolean; e: string };

export interface GameStep { title: string; qs: Q[] }
export interface GameLevel {
  id: number; title: string; sub: string;
  color: string; glow: string; emoji: string;
  steps: GameStep[];
}

const q = (q: string, o: string[], c: number, e: string): Q => ({ t: "q", q, o, c, e });
const v = (q: string, a: boolean, e: string): Q => ({ t: "v", q, a, e });

export const LEVELS: GameLevel[] = [
  /* ═══════ NIVEAU 1 ═══════ */
  { id: 1, title: "Les Bases", sub: "Fondements de l'IA", color: "#22c55e", glow: "rgba(34,197,94,0.22)", emoji: "🧠", steps: [
    { title: "Qu'est-ce que l'IA ?", qs: [
      q("IA signifie :", ["Intelligence Artificielle","Interface Avancée","Informatique Automatisée","Intégration Algorithmique"], 0, "IA = Intelligence Artificielle : des systèmes simulant l'intelligence humaine."),
      q("Quel pionnier a inventé le test d'intelligence des machines ?", ["Bill Gates","Alan Turing","John McCarthy","Yann LeCun"], 1, "Alan Turing a proposé le 'Test de Turing' en 1950 pour évaluer l'intelligence machine."),
      v("L'IA possède une conscience et des émotions réelles.", false, "Non. Les IA traitent des statistiques sur du texte sans conscience ni émotions."),
    ]},
    { title: "Histoire de l'IA", qs: [
      q("En quelle année ChatGPT a-t-il été lancé ?", ["2020","2021","2022","2023"], 2, "ChatGPT est sorti en novembre 2022 et a atteint 100M d'utilisateurs en 2 mois seulement."),
      q("Quelle architecture révolutionne l'IA depuis 2017 ?", ["CNN","RNN","Transformer","GAN"], 2, "'Attention is All You Need' (2017) introduit les Transformers, base de tous les LLMs modernes."),
      v("L'Intelligence Artificielle est un concept apparu après 2000.", false, "Faux. Le terme 'Intelligence Artificielle' date de 1956, lors d'une conférence à Dartmouth."),
    ]},
    { title: "Types d'IA", qs: [
      q("Que fait le Machine Learning ?", ["Programmer des règles manuellement","Apprendre à partir de données","Contrôler des robots","Optimiser du code"], 1, "Le ML permet à une machine d'apprendre des patterns depuis des exemples, sans règles explicites."),
      q("Qu'est-ce que l'IA Générative ?", ["Une IA qui joue aux jeux","Une IA qui crée du contenu original","Une IA qui classe des données","Une IA qui détecte des fraudes"], 1, "L'IA Générative crée du nouveau contenu : texte, images, audio, vidéo, code."),
      v("Le Deep Learning est une branche du Machine Learning.", true, "Exact ! Le Deep Learning utilise des réseaux de neurones profonds, une sous-catégorie du ML."),
    ]},
    { title: "Comment ça marche ?", qs: [
      q("Comment un LLM génère-t-il du texte ?", ["En copiant des phrases d'internet","En prédisant le token suivant","En traduisant du code binaire","En cherchant dans une base de données"], 1, "Un LLM prédit statistiquement le prochain token à chaque étape de génération."),
      q("Qu'est-ce qu'un 'token' ?", ["Un mot entier","1 caractère unique","Une unité de texte (~¾ d'un mot)","Un bit d'information"], 2, "Un token ≈ ¾ d'un mot. 'Intelligence' peut être découpé en 2-3 tokens."),
      v("Un LLM comprend le sens profond du texte comme un humain.", false, "Non. Il calcule des probabilités sur des vecteurs mathématiques, sans compréhension sémantique."),
    ]},
    { title: "Les Grands Modèles", qs: [
      q("Quel modèle est derrière ChatGPT ?", ["Claude","Gemini","GPT-4o","LLaMA"], 2, "ChatGPT utilise GPT-4o d'OpenAI. 'o' pour 'omni' (multimodal : texte, image, audio)."),
      q("Anthropic développe quel modèle ?", ["GPT","Gemini","Mistral","Claude"], 3, "Anthropic (fondée par d'anciens d'OpenAI) développe Claude, connu pour sa sécurité."),
      v("Mistral AI est une entreprise française.", true, "Oui ! Mistral AI, fondée à Paris en 2023, est l'un des champions européens de l'IA open source."),
    ]},
    { title: "Tokens & Contexte", qs: [
      q("Que signifie 'fenêtre de contexte' ?", ["La résolution d'écran","La quantité de texte qu'un modèle peut analyser","La vitesse de réponse","Le nombre de langues supportées"], 1, "La fenêtre de contexte = le nombre max de tokens traitables en une requête."),
      q("GPT-4 Turbo peut traiter jusqu'à :", ["4 000 tokens","32 000 tokens","128 000 tokens","1 million de tokens"], 2, "GPT-4 Turbo : 128k tokens ≈ 300 pages de texte en une seule requête."),
      v("Plus la fenêtre de contexte est grande, plus le modèle est puissant.", false, "Pas forcément. Une grande fenêtre aide mais la qualité dépend aussi de l'architecture et l'entraînement."),
    ]},
    { title: "Avantages de l'IA", qs: [
      q("Quel gain de productivité peut apporter l'IA en rédaction ?", ["10%","50%","×3 à ×10","×100"], 2, "Des études montrent un gain de ×3 à ×10 en vitesse pour la rédaction selon les tâches."),
      q("L'IA est particulièrement utile pour :", ["Remplacer tous les humains","Amplifier les capacités humaines sur les tâches répétitives","Éliminer le besoin de stratégie","Décider à la place des dirigeants"], 1, "L'IA amplifie les humains sur les tâches répétitives. La stratégie et la créativité restent humaines."),
      v("L'IA peut réduire les coûts de production de contenu jusqu'à 70%.", true, "Vrai selon plusieurs études d'entreprises adoptant l'IA pour le contenu marketing."),
    ]},
    { title: "Limites de l'IA", qs: [
      q("Qu'est-ce qu'une 'hallucination' en IA ?", ["Un bug visuel","L'IA invente des faits faux avec confiance","L'IA refuse de répondre","Une erreur de traduction"], 1, "L'hallucination : un LLM génère des informations fausses présentées comme vraies et certaines."),
      q("Que signifie 'knowledge cutoff' ?", ["L'IA ne travaille que la nuit","L'IA a une date limite de connaissances","L'IA ne parle qu'en anglais","L'IA s'arrête après 1h"], 1, "Le knowledge cutoff est la date après laquelle le modèle n'a plus d'informations récentes."),
      v("On peut partager des données clients confidentielles sur ChatGPT sans risque.", false, "Dangereux ! Les données peuvent être utilisées pour l'entraînement. RGPD à risque."),
    ]},
    { title: "IA au Quotidien", qs: [
      q("Quel outil Microsoft intègre GPT-4 ?", ["Teams","Word","Copilot","Excel"], 2, "Microsoft Copilot (anciennement Bing Chat) est basé sur GPT-4 et intégré dans Windows."),
      q("Perplexity AI est :", ["Un outil de génération d'images","Un moteur de recherche IA avec sources","Un assistant vocal","Un outil de code"], 1, "Perplexity est un moteur de recherche IA qui cite ses sources — idéal pour éviter les hallucinations."),
      v("L'IA peut être utilisée pour reconnaître des images.", true, "Oui ! Les modèles Vision (GPT-4V, Claude 3, Gemini) analysent et décrivent des images."),
    ]},
    { title: "🎓 Récap Niveau 1", qs: [
      q("Un LLM est principalement entraîné à :", ["Jouer aux jeux vidéo","Prédire le prochain token dans un texte","Chercher sur internet","Programmer automatiquement"], 1, "Parfait ! La prédiction de tokens est le mécanisme central de tous les LLMs."),
      q("Quelle entreprise a développé GPT-4 ?", ["Google","Meta","Anthropic","OpenAI"], 3, "OpenAI a créé GPT-4. C'est aussi la société derrière ChatGPT."),
      v("Le terme Intelligence Artificielle a été créé par Alan Turing.", false, "Non ! C'est John McCarthy qui a inventé ce terme en 1956. Turing a créé le 'Test de Turing'."),
    ]},
  ]},

  /* ═══════ NIVEAU 2 ═══════ */
  { id: 2, title: "Les Modèles", sub: "GPT, Claude, Gemini & Co", color: "#06b6d4", glow: "rgba(6,182,212,0.22)", emoji: "⚡", steps: [
    { title: "GPT-4 & OpenAI", qs: [
      q("GPT-4o signifie :", ["GPT-4 Optimisé","GPT-4 Omnimodal","GPT-4 Open source","GPT-4 Officiel"], 1, "GPT-4o = GPT-4 Omnimodal : traite simultanément texte, images et audio en temps réel."),
      q("OpenAI a été fondée en :", ["2012","2015","2017","2020"], 1, "OpenAI a été fondée en 2015 par Sam Altman, Elon Musk et d'autres. Elon Musk en est sorti en 2018."),
      v("GPT-4 est un modèle open source accessible à tous.", false, "Non. GPT-4 est propriétaire. Seule l'API payante est disponible. Le code source n'est pas publié."),
    ]},
    { title: "Claude & Anthropic", qs: [
      q("Anthropic met en avant quelle valeur pour Claude ?", ["Vitesse","Sécurité et alignement","Créativité","Prix bas"], 1, "Anthropic est spécialisée en 'AI Safety'. Claude est conçu pour être utile, inoffensif et honnête."),
      q("Claude 3.5 Sonnet est réputé pour :", ["Générer des images","Des performances en codage et raisonnement","La reconnaissance vocale","Les jeux vidéo"], 1, "Claude 3.5 Sonnet excelle en codage, analyse et raisonnement complexe."),
      v("Anthropic a été fondée par d'anciens employés d'OpenAI.", true, "Vrai. Les frères Amodei et d'autres ont quitté OpenAI en 2021 pour fonder Anthropic."),
    ]},
    { title: "Gemini & Google", qs: [
      q("Gemini est le modèle de :", ["Apple","Microsoft","Google","Amazon"], 2, "Gemini (lancé en 2023) est le modèle phare de Google DeepMind, successeur de Bard."),
      q("Gemini Ultra est la version :", ["La plus rapide","La moins chère","La plus puissante","La plus ancienne"], 2, "Google propose Gemini Nano (mobile), Pro (standard) et Ultra (la plus puissante)."),
      v("Google a intégré l'IA dans son moteur de recherche.", true, "Oui ! Google a intégré la 'Search Generative Experience' (SGE) et Gemini dans sa recherche."),
    ]},
    { title: "LLaMA & Meta", qs: [
      q("LLaMA est développé par :", ["Apple","Meta","Amazon","Samsung"], 1, "Meta (Facebook) développe LLaMA, un modèle open source largement utilisé."),
      q("LLaMA est :", ["Propriétaire et payant","Open weights (poids accessibles)","Un modèle de reconnaissance d'images","Un modèle vocal"], 1, "LLaMA est open weights : les poids sont téléchargeables et utilisables localement."),
      v("On peut faire tourner LLaMA sur son propre ordinateur.", true, "Vrai ! Avec Ollama ou LM Studio, LLaMA peut tourner localement sur un PC performant."),
    ]},
    { title: "Mistral & Open Source", qs: [
      q("Mistral AI est basée à :", ["Lyon","Paris","Bordeaux","Marseille"], 1, "Mistral AI est une startup française basée à Paris, fondée en 2023."),
      q("Mixtral est basé sur quelle architecture ?", ["MoE (Mixture of Experts)","CNN","RNN","GAN"], 0, "Mixtral utilise l'architecture MoE : plusieurs 'experts' spécialisés activés selon le contexte."),
      v("Mistral est entièrement open source.", false, "Partiellement. Mistral 7B est open source, mais Mistral Large est propriétaire et payant."),
    ]},
    { title: "Comparer les Modèles", qs: [
      q("Pour quel usage choisir Claude 3.5 Sonnet ?", ["Génération d'images","Codage et analyse longue","Recherche web en temps réel","Traduction basique"], 1, "Claude excelle en codage, analyse de longs documents et raisonnement structuré."),
      q("Pour la recherche avec sources fiables, le meilleur outil est :", ["ChatGPT","Gemini","Perplexity","Copilot"], 2, "Perplexity AI cite systématiquement ses sources, réduisant le risque d'hallucinations."),
      v("GPT-4 et Claude ont des forces différentes selon les tâches.", true, "Exact. GPT-4 est fort en créativité/polyvalence, Claude en analyse longue et codage précis."),
    ]},
    { title: "Open vs Closed Source", qs: [
      q("Avantage principal des modèles open source ?", ["Toujours plus puissants","Confidentialité et déploiement local","Gratuits sans limite","Support client inclus"], 1, "L'open source permet de faire tourner l'IA localement : confidentialité totale des données."),
      q("Inconvénient des modèles propriétaires comme GPT-4 ?", ["Trop lents","Données envoyées à l'entreprise externe","Impossible à utiliser","Uniquement en anglais"], 1, "Avec les API propriétaires, tes données passent par les serveurs d'OpenAI/Anthropic."),
      v("Un modèle open source est forcément moins performant qu'un modèle propriétaire.", false, "Faux. LLaMA 3.1 70B rivalise avec GPT-4 sur de nombreux benchmarks."),
    ]},
    { title: "Coûts & Pricing", qs: [
      q("Comment sont facturés la plupart des APIs IA ?", ["Abonnement fixe","Par token (entrée + sortie)","Par conversation","Par heure d'utilisation"], 1, "Les APIs LLM facturent au token : séparément pour les tokens en entrée et en sortie."),
      q("1 million de tokens GPT-4o coûte environ :", ["0,01$","5$","50$","500$"], 1, "GPT-4o : ~5$/M tokens en entrée. Pour référence, 1M tokens ≈ 750 000 mots."),
      v("L'utilisation gratuite de ChatGPT est illimitée.", false, "Non. ChatGPT Free a des limites sur GPT-4o. ChatGPT Plus (20$/mois) donne plus d'accès."),
    ]},
    { title: "Choisir le Bon Modèle", qs: [
      q("Pour un chatbot de service client économique, tu choisis :", ["GPT-4o","Claude 3.5 Sonnet","GPT-4o mini ou Haiku","Gemini Ultra"], 2, "GPT-4o mini et Claude Haiku sont rapides, pas chers et parfaits pour les tâches simples."),
      q("Pour analyser un document juridique de 200 pages, tu choisis :", ["GPT-3.5","Claude 3.5 Sonnet (200k tokens)","Mistral 7B","GPT-4o mini"], 1, "Claude 3.5 Sonnet avec sa fenêtre de 200k tokens peut ingérer un document entier d'un coup."),
      v("Un seul modèle IA suffit pour tous les usages en entreprise.", false, "Non. La stratégie optimale combine plusieurs modèles selon les cas d'usage et budgets."),
    ]},
    { title: "🎓 Récap Niveau 2", qs: [
      q("Quel modèle Meta est open weights ?", ["GPT-4","Claude","LLaMA","Gemini"], 2, "LLaMA de Meta est open weights : tu peux télécharger et utiliser les poids librement."),
      q("Anthropic est connue pour mettre l'accent sur :", ["La vitesse","Le prix","La sécurité de l'IA","La génération d'images"], 2, "Anthropic se spécialise en AI Safety : sécurité, alignement et éthique de l'IA."),
      v("Mistral AI est une entreprise américaine.", false, "Non ! Mistral AI est française, basée à Paris — un fleuron de l'IA européenne."),
    ]},
  ]},

  /* ═══════ NIVEAU 3 ═══════ */
  { id: 3, title: "Prompt Engineering", sub: "Maîtrise l'art du prompt", color: "#8b5cf6", glow: "rgba(139,92,246,0.22)", emoji: "✍️", steps: [
    { title: "C'est quoi le Prompting ?", qs: [
      q("Le Prompt Engineering, c'est :", ["Programmer une IA en Python","Rédiger des instructions efficaces pour une IA","Créer des images avec IA","Optimiser la vitesse d'un LLM"], 1, "Le prompt engineering = l'art de formuler des instructions pour obtenir les meilleurs résultats d'une IA."),
      q("Un bon prompt doit inclure :", ["Le plus de mots possible","Contexte + tâche précise + format attendu","Des emojis","Des majuscules"], 1, "La structure CTF : Contexte (qui tu es), Tâche (ce que tu veux), Format (comment tu veux la réponse)."),
      v("Un prompt court est toujours meilleur qu'un prompt long.", false, "Faux. La précision compte plus que la longueur. Un prompt détaillé et structuré donne de meilleurs résultats."),
    ]},
    { title: "Structure d'un Prompt", qs: [
      q("Le 'Rôle' dans un prompt sert à :", ["Nommer l'IA","Donner un contexte d'expert à l'IA","Définir le format","Limiter la longueur"], 1, "Assigner un rôle expert active les connaissances spécialisées du modèle sur ce domaine."),
      q("Exemple de bon début de prompt :", ["Aide-moi","Tu es un expert en marketing digital pour entrepreneurs","Réponds à ma question","IA dis-moi"], 1, "Définir le rôle expert en premier cadre toute la réponse dans la bonne perspective."),
      v("Il faut toujours terminer un prompt par 'S'il te plaît'.", false, "Non. La politesse n'améliore pas les résultats. La précision et la structure sont ce qui compte."),
    ]},
    { title: "Donner du Contexte", qs: [
      q("Pourquoi donner du contexte dans un prompt ?", ["Pour être poli","Pour que l'IA adapte sa réponse à ta situation réelle","Pour utiliser plus de tokens","Pour éviter les hallucinations"], 1, "Le contexte permet à l'IA de personnaliser sa réponse à ton secteur, audience et objectifs."),
      q("Meilleure formulation pour demander un email de relance :", ["Écris un email","Écris un email de relance pour mon client Marc qui n'a pas répondu depuis 5 jours à mon devis de 2000€","Email s'il te plaît","Aide-moi à écrire"], 1, "Le contexte (nom, délai, montant) permet une réponse personnalisée et directement utilisable."),
      v("Partager le nom de ton entreprise dans un prompt améliore les résultats.", true, "Oui ! Plus le contexte est spécifique, plus l'IA peut adapter sa réponse à ta réalité."),
    ]},
    { title: "Few-Shot Prompting", qs: [
      q("Le 'Few-Shot' prompting consiste à :", ["Utiliser peu de mots","Donner des exemples dans le prompt","Envoyer plusieurs prompts","Limiter la réponse à 5 phrases"], 1, "Few-Shot = donner 2-3 exemples dans le prompt pour guider le style/format de la réponse."),
      q("When do you use Few-Shot?", ["Pour des tâches créatives","Pour imposer un style ou format spécifique","Pour les traductions","Pour générer du code"], 1, "Few-Shot est parfait pour reproduire ton style d'écriture, un format précis, ou un ton particulier."),
      v("Le Few-Shot prompting peut imiter le style d'écriture d'une marque.", true, "Oui ! En donnant 2-3 exemples de tes textes, l'IA reproduit ton style avec précision."),
    ]},
    { title: "Zero-Shot Prompting", qs: [
      q("Le Zero-Shot prompting, c'est :", ["Demander sans donner d'exemples","Donner zéro contexte","Utiliser un nouveau modèle","Envoyer un prompt vide"], 0, "Zero-Shot = demander directement sans exemples. Fonctionne bien pour les tâches simples et directes."),
      q("Quand privilégier le Zero-Shot ?", ["Toujours","Pour des tâches simples et directes","Jamais","Pour du code complexe"], 1, "Zero-Shot est parfait pour des tâches claires et directes : résumer, traduire, répondre à une question."),
      v("Le Zero-Shot fonctionne mieux que le Few-Shot dans tous les cas.", false, "Faux. Pour les formats personnalisés ou styles spécifiques, le Few-Shot est bien supérieur."),
    ]},
    { title: "Chain of Thought", qs: [
      q("Le Chain of Thought (CoT) demande à l'IA de :", ["Répondre plus rapidement","Raisonner étape par étape avant de répondre","Utiliser plus de tokens","Vérifier ses sources"], 1, "CoT = 'Pense étape par étape'. Améliore drastiquement les raisonnements complexes."),
      q("Pour activer le Chain of Thought, on peut ajouter :", ["Réponds vite","Pense étape par étape / Let's think step by step","Sois concis","Ne raisonne pas"], 1, "La phrase magique 'Pense étape par étape' déclenche le raisonnement structuré du modèle."),
      v("Le Chain of Thought améliore les résultats pour les problèmes mathématiques.", true, "Vrai ! Le CoT augmente la précision de +30-50% sur les problèmes de raisonnement et maths."),
    ]},
    { title: "Prompts Système", qs: [
      q("Un 'system prompt' est utilisé pour :", ["Configurer le comportement global de l'IA","Poser une question","Traduire du texte","Générer des images"], 0, "Le system prompt définit le rôle, le comportement et les limites de l'IA pour toute la conversation."),
      q("Les system prompts sont surtout utiles pour :", ["Les tests occasionnels","Déployer un chatbot avec une personnalité fixe","Générer du code","Traduire des documents"], 1, "Les chatbots d'entreprise utilisent des system prompts pour définir identité, ton et règles."),
      v("Un utilisateur peut toujours contourner un system prompt.", false, "En théorie non, mais les LLMs ne sont pas infaillibles. Un bon system prompt limite les dérives."),
    ]},
    { title: "Prompts Avancés", qs: [
      q("La technique 'Tree of Thought' améliore :", ["La vitesse de réponse","L'exploration de plusieurs raisonnements en parallèle","La génération d'images","La traduction"], 1, "Tree of Thought explore plusieurs branches de raisonnement, ideal pour les problèmes complexes."),
      q("Pour obtenir un résultat JSON structuré, tu utilises :", ["Un long prompt","La contrainte 'réponds uniquement en JSON valide avec les champs : ...'","Un prompt court","La température à 0"], 1, "Spécifier le format JSON + les champs attendus force la réponse dans le bon format."),
      v("La température à 0 rend les réponses plus créatives.", false, "Faux ! Température 0 = réponses déterministes et précises. Température 1 = plus créatives et variées."),
    ]},
    { title: "🎓 Récap Niveau 3", qs: [
      q("La structure idéale d'un prompt est :", ["Question courte","Rôle + Contexte + Tâche + Format attendu","Des exemples uniquement","Du texte en majuscules"], 1, "La structure CTF/RCTF est la base du prompt engineering professionnel."),
      q("'Pense étape par étape' active :", ["Le mode rapide","Le Chain of Thought","Le Few-Shot","Le Zero-Shot"], 1, "Cette phrase active le raisonnement structuré (Chain of Thought) pour de meilleurs résultats."),
      v("Le Few-Shot prompting donne des exemples pour guider le style de réponse.", true, "Exact ! Les exemples dans le prompt guident l'IA sur le format, ton et style souhaités."),
    ]},
  ]},

  /* ═══════ NIVEAU 4 ═══════ */
  { id: 4, title: "RAG & Données", sub: "Enrichis l'IA avec tes données", color: "#f59e0b", glow: "rgba(245,158,11,0.22)", emoji: "🔍", steps: [
    { title: "Introduction au RAG", qs: [
      q("RAG signifie :", ["Rapid AI Generation","Retrieval-Augmented Generation","Random Answer Gateway","Real-time AI Guide"], 1, "RAG = Retrieval-Augmented Generation : connecter un LLM à une base de données externe."),
      q("Le principal problème que résout le RAG :", ["La lenteur des LLMs","Les hallucinations et le knowledge cutoff","Le coût des APIs","La génération d'images"], 1, "Le RAG fournit au modèle des données récentes et spécifiques, réduisant les hallucinations."),
      v("Avec le RAG, le LLM accède à internet en temps réel.", false, "Non. Le RAG récupère des données d'une base vectorielle pré-indexée, pas d'internet directement."),
    ]},
    { title: "Les Embeddings", qs: [
      q("Un embedding est :", ["Un type de prompt","Une représentation numérique (vecteur) d'un texte","Un fichier d'entraînement","Un token spécial"], 1, "Un embedding transforme du texte en vecteur de nombres permettant de mesurer la similarité sémantique."),
      q("À quoi servent les embeddings dans le RAG ?", ["Compresser les fichiers","Trouver les passages les plus pertinents par similarité","Traduire le texte","Générer des images"], 1, "Les embeddings permettent de comparer sémantiquement une question avec tous les documents indexés."),
      v("Deux phrases avec des mots différents peuvent avoir des embeddings similaires.", true, "Oui ! 'Voiture' et 'automobile' auront des embeddings proches car sémantiquement similaires."),
    ]},
    { title: "Bases Vectorielles", qs: [
      q("Une base vectorielle stocke :", ["Des images","Des vecteurs (embeddings) de textes","Du code source","Des logs système"], 1, "Une base vectorielle (Pinecone, Weaviate, Chroma) stocke et recherche des embeddings efficacement."),
      q("Quelle base vectorielle peut s'utiliser localement en Python ?", ["Pinecone","Weaviate Cloud","Chroma","Milvus Cloud"], 2, "ChromaDB est une base vectorielle open source légère, parfaite pour du prototypage local."),
      v("Les bases vectorielles remplacent totalement les bases de données SQL.", false, "Non. Elles sont complémentaires : SQL pour les données structurées, vectorielles pour la recherche sémantique."),
    ]},
    { title: "Chunking (Découpage)", qs: [
      q("Pourquoi découper les documents en 'chunks' ?", ["Pour économiser du stockage","Parce que les LLMs ont une limite de tokens","Pour traduire plus vite","Pour réduire les coûts d'API"], 1, "Les documents longs dépassent la fenêtre de contexte. Le chunking découpe en segments indexables."),
      q("La taille optimale d'un chunk est généralement :", ["10 tokens","100-500 tokens","5000 tokens","Le document entier"], 1, "Entre 100 et 500 tokens selon la nature du document et le modèle d'embedding utilisé."),
      v("Le chevauchement (overlap) entre chunks améliore la qualité du RAG.", true, "Oui ! Un overlap de 10-20% évite de couper des idées en plein milieu et améliore la continuité."),
    ]},
    { title: "Retrieval (Récupération)", qs: [
      q("Comment le RAG trouve les chunks pertinents ?", ["Par mots-clés exacts","Par similarité cosinus entre embeddings","Par date de création","Aléatoirement"], 1, "La similarité cosinus mesure l'angle entre vecteurs. Plus c'est proche de 1, plus c'est similaire."),
      q("Combien de chunks retourner en général au LLM ?", ["1","3 à 5","20 à 50","Tous les documents"], 1, "3 à 5 chunks bien choisis donnent au LLM suffisamment de contexte sans saturer la fenêtre."),
      v("La recherche par mots-clés (BM25) peut être combinée avec la recherche vectorielle.", true, "Oui ! L'approche hybride (BM25 + vectorielle) donne souvent de meilleurs résultats que l'une seule."),
    ]},
    { title: "Pipeline RAG Complet", qs: [
      q("L'ordre correct du pipeline RAG est :", ["Générer → Indexer → Récupérer","Indexer → Récupérer → Générer","Récupérer → Indexer → Générer","Générer → Récupérer → Indexer"], 1, "1. Indexer (chunks + embeddings), 2. Récupérer (chunks pertinents), 3. Générer (réponse LLM)."),
      q("Quel outil Python simplifie la création d'un pipeline RAG ?", ["NumPy","LangChain","Pandas","FastAPI"], 1, "LangChain fournit des abstractions pour construire facilement des pipelines RAG complets."),
      v("Le RAG peut utiliser des PDFs, des sites web et des bases de données comme sources.", true, "Oui ! N'importe quelle source textuelle peut être indexée : PDFs, URLs, SQL, APIs, etc."),
    ]},
    { title: "Outils RAG", qs: [
      q("LlamaIndex est :", ["Un modèle IA","Un framework pour construire des pipelines RAG","Une base vectorielle","Un LLM open source"], 1, "LlamaIndex (anciennement GPT Index) est un framework RAG concurrent de LangChain."),
      q("Pour indexer rapidement des PDFs en RAG, on utilise :", ["Excel","PyPDF2 + LangChain loader","Word","Google Docs"], 1, "PyPDF2 extrait le texte des PDFs, puis LangChain/LlamaIndex gère le chunking et l'indexation."),
      v("Pinecone est une base vectorielle 100% gratuite.", false, "Non. Pinecone a un tier gratuit limité mais est payant au-delà. Des alternatives gratuites existent (Chroma, FAISS)."),
    ]},
    { title: "Évaluation RAG", qs: [
      q("La métrique 'Faithfulness' en RAG mesure :", ["La vitesse","Si la réponse est fidèle aux chunks récupérés","Le coût","La longueur de la réponse"], 1, "Faithfulness = la réponse est-elle basée sur les documents fournis, sans halluciner ?"),
      q("Le framework RAGAS évalue :", ["La beauté du code","Faithfulness, Answer Relevance et Context Precision","La vitesse d'indexation","Le coût par requête"], 1, "RAGAS est le standard pour évaluer automatiquement la qualité d'un pipeline RAG."),
      v("Un RAG parfait élimine totalement les hallucinations.", false, "Non. Le RAG réduit fortement les hallucinations mais ne les élimine pas. La qualité des chunks compte."),
    ]},
    { title: "🎓 Récap Niveau 4", qs: [
      q("RAG connecte un LLM à :", ["Internet en temps réel","Une base de données vectorielle avec tes documents","Un autre LLM","Une API météo"], 1, "Le RAG enrichit le LLM avec tes propres documents indexés sous forme de vecteurs."),
      q("Un embedding transforme du texte en :", ["Image","Vecteur numérique","Résumé","Code Python"], 1, "Un embedding = représentation vectorielle permettant la comparaison sémantique."),
      v("Le chunking est nécessaire pour les documents dépassant la fenêtre de contexte.", true, "Exact ! Le chunking permet d'indexer de longs documents qui ne tiendraient pas dans un seul prompt."),
    ]},
  ]},

  /* ═══════ NIVEAU 5 ═══════ */
  { id: 5, title: "Agents IA", sub: "IA autonome et action", color: "#f97316", glow: "rgba(249,115,22,0.22)", emoji: "🤖", steps: [
    { title: "Qu'est-ce qu'un Agent ?", qs: [
      q("Un agent IA peut :", ["Uniquement répondre à des questions","Planifier et exécuter des actions de façon autonome","Uniquement générer du texte","Remplacer tous les humains"], 1, "Un agent IA observe, planifie et agit — il peut utiliser des outils, faire des recherches, écrire du code."),
      q("La différence entre un LLM et un agent IA :", ["Aucune","Un agent peut agir dans le monde (outils, APIs, code)","Un agent est plus rapide","Un agent coûte moins cher"], 1, "Un LLM génère du texte. Un agent utilise ce LLM comme 'cerveau' pour planifier et agir."),
      v("Un agent IA peut envoyer des emails de façon autonome.", true, "Oui ! Un agent avec accès à une API email peut rédiger et envoyer des emails sans intervention humaine."),
    ]},
    { title: "Tool Use (Outils)", qs: [
      q("Les 'tools' (outils) permettent à un agent de :", ["Changer de modèle","Interagir avec des APIs, bases de données, le web","Apprendre en temps réel","Générer des images automatiquement"], 1, "Les tools sont les bras de l'agent : recherche web, calcul, envoi d'emails, accès à des APIs."),
      q("Exemple de tool utile pour un agent commercial :", ["Outil de traduction","Accès CRM + calendrier pour qualifier un prospect et fixer un RDV","Génération d'images","Reconnaissance vocale"], 1, "Un agent commercial avec accès CRM/calendrier peut gérer le lead du premier contact au RDV."),
      v("Function calling est le mécanisme permettant aux LLMs d'utiliser des outils structurés.", true, "Oui ! OpenAI, Anthropic et Google ont tous implémenté le function calling pour les outils."),
    ]},
    { title: "Planification", qs: [
      q("Le pattern ReAct en agents IA signifie :", ["Refaire + Corriger","Reasoning + Acting : raisonner puis agir en boucle","Recherche + Activer","Répondre + Confirmer"], 1, "ReAct : l'agent Pense (Thought), Agit (Action), Observe le résultat, puis recommence."),
      q("Combien d'itérations un agent peut-il faire pour résoudre une tâche ?", ["Exactement 1","Exactement 3","Autant que nécessaire (configurable)","Illimité sans arrêt possible"], 2, "Un agent peut itérer N fois, avec une limite configurable pour éviter les boucles infinies."),
      v("Un agent peut décomposer automatiquement une tâche complexe en sous-tâches.", true, "Oui ! C'est une des forces des agents : la décomposition et planification autonome de tâches."),
    ]},
    { title: "Mémoire des Agents", qs: [
      q("La mémoire courte d'un agent (short-term) correspond à :", ["Sa base de données","L'historique de la conversation en cours","Ses paramètres","Ses outils disponibles"], 1, "La mémoire courte = le contexte de la conversation. Elle est perdue à la fin de la session."),
      q("La mémoire longue d'un agent (long-term) utilise :", ["La RAM","Une base vectorielle ou base de données persistante","La fenêtre de contexte","Des fichiers log"], 1, "La mémoire longue stocke les informations dans une base (SQL, vectorielle) persistante entre sessions."),
      v("Un agent sans mémoire longue oublie tout à chaque nouvelle conversation.", true, "Exact ! Sans persistance, chaque session repart de zéro. La mémoire longue résout ce problème."),
    ]},
    { title: "Multi-Agents", qs: [
      q("Un système multi-agents utilise :", ["Un seul LLM pour tout","Plusieurs agents spécialisés collaborant","Plusieurs LLMs en parallèle sans communication","Une seule API"], 1, "Dans un système multi-agents, chaque agent est spécialisé et les agents collaborent via des messages."),
      q("Exemple de système multi-agents pour le marketing :", ["Un seul agent qui fait tout","Chercheur + Rédacteur + Éditeur + Planificateur chacun spécialisé","Deux ChatGPT en parallèle","Un humain + une IA"], 1, "Des agents spécialisés (chercheur, rédacteur, SEO, éditeur) produisent de meilleurs contenus ensemble."),
      v("Les agents peuvent se critiquer mutuellement pour améliorer la qualité.", true, "Oui ! Le pattern 'review multi-agent' utilise un agent critique pour améliorer les sorties."),
    ]},
    { title: "LangChain", qs: [
      q("LangChain est :", ["Un modèle IA","Un framework Python/JS pour construire des applications LLM","Une base vectorielle","Un service cloud"], 1, "LangChain est le framework le plus populaire pour créer des agents, chaînes et pipelines LLM."),
      q("LCEL dans LangChain signifie :", ["LangChain Extended Language","LangChain Expression Language","LangChain External Loader","LangChain Embedding Library"], 1, "LCEL est la syntaxe pipe de LangChain pour composer des chaînes : prompt | llm | parser."),
      v("LangSmith permet de monitorer et déboguer les agents LangChain.", true, "Oui ! LangSmith est l'outil d'observabilité de LangChain pour tracer et déboguer les agents."),
    ]},
    { title: "CrewAI & AutoGen", qs: [
      q("CrewAI est optimisé pour :", ["Le RAG","Les systèmes multi-agents avec rôles définis","La génération d'images","Le fine-tuning"], 1, "CrewAI simplifie la création d'équipes d'agents avec rôles, outils et objectifs définis."),
      q("AutoGen de Microsoft est connu pour :", ["La génération d'images","Le code generation multi-agents conversationnel","Le déploiement cloud","La traduction"], 1, "AutoGen permet à des agents de collaborer via des conversations pour écrire et exécuter du code."),
      v("LangGraph permet de créer des agents avec des flux conditionnels et cycliques.", true, "Oui ! LangGraph (de LangChain) est idéal pour des workflows agent complexes avec des boucles."),
    ]},
    { title: "Sécurité des Agents", qs: [
      q("Le 'prompt injection' est :", ["Une technique de prompting utile","Une attaque où du texte malveillant détourne l'agent","Un outil de déploiement","Un type de mémoire"], 1, "Le prompt injection : un texte malveillant dans les données traîtées peut détourner le comportement de l'agent."),
      q("Pour sécuriser un agent, on doit :", ["Lui donner accès à tout","Limiter ses permissions au strict nécessaire (principe du moindre privilège)","Ne pas le tester","Lui faire confiance aveuglément"], 1, "Toujours appliquer le principe du moindre privilège : un agent n'accède qu'à ce dont il a besoin."),
      v("Un agent IA peut être testé dans un environnement sandbox avant déploiement.", true, "Oui ! Les sandboxes permettent de tester les agents sans risque d'impact sur les systèmes réels."),
    ]},
    { title: "🎓 Récap Niveau 5", qs: [
      q("La différence principale entre un LLM et un agent :", ["Le prix","Un agent peut agir et utiliser des outils","La langue","La vitesse"], 1, "Un agent utilise un LLM comme cerveau mais peut agir dans le monde via des outils et APIs."),
      q("ReAct signifie :", ["Réagir vite","Reasoning + Acting : raisonner et agir en boucle","Refaire + Corriger","Recherche + Action"], 1, "Le pattern ReAct alterne pensée et action, permettant à l'agent de corriger ses erreurs en chemin."),
      v("CrewAI est un framework pour les systèmes multi-agents.", true, "Exact ! CrewAI facilite la création d'équipes d'agents IA avec rôles et responsabilités définis."),
    ]},
  ]},

  /* ═══════ NIVEAU 6 ═══════ */
  { id: 6, title: "IA Entrepreneur", sub: "IA pour ton business", color: "#ec4899", glow: "rgba(236,72,153,0.22)", emoji: "💼", steps: [
    { title: "Productivité avec l'IA", qs: [
      q("Quelle tâche l'IA peut-elle le mieux automatiser pour un entrepreneur ?", ["La stratégie d'entreprise","La rédaction de contenus répétitifs et l'analyse de données","Les relations humaines","Les décisions créatives"], 1, "L'IA excelle sur les tâches répétitives : emails, résumés, analyses, rapports — libérant du temps."),
      q("Pour résumer un long document rapidement, tu utilises :", ["Tu le lis entièrement","Tu colles le PDF dans Claude/ChatGPT et demandes un résumé","Tu demandes à un stagiaire","Tu attends"], 1, "Claude peut lire jusqu'à 200k tokens = un document de 500+ pages résumé en secondes."),
      v("L'IA peut automatiquement planifier ton agenda à ta place.", false, "Pas encore nativement, mais des agents IA avec accès calendrier (ex. via API Google Calendar) peuvent le faire."),
    ]},
    { title: "Rédaction IA", qs: [
      q("Pour quel type de rédaction l'IA est la plus efficace ?", ["Poèmes artistiques uniques","Emails, posts LinkedIn, descriptions produits, articles SEO","Discours politiques","Autobiographies"], 1, "L'IA est excellente pour les formats standardisés avec structure connue : emails, posts, fiches produits."),
      q("Comment adapter le ton d'un texte IA à ta marque ?", ["Impossible","En donnant des exemples de tes textes (Few-Shot) dans le prompt","En changant de modèle","En traduisant en anglais d'abord"], 1, "Le Few-Shot avec 2-3 exemples de tes textes force l'IA à reproduire ton style et ton ton."),
      v("L'IA peut rédiger un article de blog complet en moins de 30 secondes.", true, "Vrai ! GPT-4/Claude génèrent 800 mots en 10-20 secondes. L'humain garde le contrôle éditorial."),
    ]},
    { title: "Service Client IA", qs: [
      q("Un chatbot IA de service client peut :", ["Remplacer totalement l'humain","Gérer les FAQs et réorienter vers l'humain pour les cas complexes","Résoudre tous les problèmes","Seulement répondre 'je ne sais pas'"], 1, "Un chatbot RAG gère 60-80% des questions courantes et escalade les cas complexes à l'humain."),
      q("Pour un chatbot fidèle à tes informations produit, tu utilises :", ["ChatGPT seul","RAG sur ta documentation produit","Un prompt générique","Google Translate"], 1, "Le RAG sur ta base de connaissance garantit que le chatbot répond avec tes informations exactes."),
      v("Un chatbot IA peut répondre 24h/24, 7j/7 sans coût de personnel.", true, "Oui ! C'est l'un des ROI les plus clairs de l'IA : disponibilité permanente à faible coût."),
    ]},
    { title: "Analyse de Données", qs: [
      q("Pour analyser un CSV de 10 000 lignes rapidement :", ["Excel classique","ChatGPT Advanced Data Analysis (Code Interpreter)","Google Sheets","Le faire à la main"], 1, "ChatGPT ADA exécute du code Python, analyse tes données et génère des graphiques en quelques secondes."),
      q("L'IA peut t'aider à identifier dans tes données :", ["Uniquement des erreurs de frappe","Tendances, anomalies, segments clients et opportunités","La météo future","Les concurrents"], 1, "L'analyse IA révèle des patterns invisibles à l'œil nu : corrélations, segments, anomalies."),
      v("On peut analyser des données confidentielles sur ChatGPT sans risque.", false, "Non ! ChatGPT peut utiliser tes données. Pour des données sensibles, utilise l'API en mode no-training ou un modèle local."),
    ]},
    { title: "Création de Contenu", qs: [
      q("Pour créer un mois de posts LinkedIn en 1h avec l'IA :", ["Impossible","Créer un prompt-template + générer en batch sur chaque sujet","Copier des posts d'autres","Engager un community manager"], 1, "La stratégie batch : un prompt template + 30 sujets = 30 posts LinkedIn en moins d'une heure."),
      q("L'IA génère des images via :", ["ChatGPT standard","Midjourney, DALL-E 3, Stable Diffusion","Microsoft Word","Google Docs"], 1, "Midjourney, DALL-E 3 (dans ChatGPT Plus) et Stable Diffusion sont les principaux générateurs d'images IA."),
      v("L'IA peut créer des vidéos courtes pour les réseaux sociaux.", true, "Oui ! Des outils comme Sora (OpenAI), Runway ou Kling AI génèrent maintenant des vidéos."),
    ]},
    { title: "Automatisation Business", qs: [
      q("Zapier permet de :", ["Créer un site web","Connecter des apps et automatiser des workflows sans code","Générer du contenu IA","Gérer sa comptabilité"], 1, "Zapier connecte +7000 apps : ex. Email reçu → Créer une tâche → Notifier Slack — sans coder."),
      q("Make.com (ex-Integromat) est idéal pour :", ["Workflows simples","Automatisations complexes avec logique conditionnelle","Générer des images","Coder en Python"], 1, "Make.com gère des flux complexes avec filtres, itérateurs et conditions — plus puissant que Zapier."),
      v("N8n est une alternative open source à Zapier qui peut s'héberger soi-même.", true, "Oui ! n8n est gratuit en self-hosted, parfait pour automatiser sans partager ses données."),
    ]},
    { title: "Finance & IA", qs: [
      q("L'IA peut t'aider à :", ["Faire tes déclarations fiscales automatiquement","Préparer un prévisionnel financier et analyser tes flux","Gérer ta banque","Remplacer ton expert-comptable"], 1, "Avec tes données financières, l'IA génère des prévisionnels, analyses de trésorerie et scénarios."),
      q("Pour catégoriser automatiquement tes dépenses :", ["Manuellement dans Excel","Avec un outil OCR + IA sur tes relevés bancaires","En appelant ta banque","En devinant"], 1, "L'OCR + IA (comme dans DJAMA) extrait et catégorise automatiquement tes dépenses des relevés."),
      v("L'IA peut détecter des anomalies dans tes flux financiers.", true, "Oui ! L'analyse IA de séries temporelles détecte les dépenses inhabituelles et les tendances."),
    ]},
    { title: "ROI de l'IA", qs: [
      q("Comment mesurer le ROI de l'IA en entreprise ?", ["Difficile à mesurer","Temps économisé × coût horaire + revenus générés — coût IA","Uniquement qualitatif","Impossible"], 1, "ROI = (Temps gagné × Coût horaire) + Revenus supplémentaires - Coût des outils IA."),
      q("Le coût moyen d'un abonnement ChatGPT Plus est :", ["0€","20$/mois","100€/mois","500€/mois"], 1, "ChatGPT Plus coûte 20$/mois — souvent amorti en quelques heures de productivité gagnée."),
      v("L'IA peut générer un ROI positif dès la première semaine pour la plupart des entrepreneurs.", true, "Vrai pour la plupart des cas : rédaction, analyse, automatisation montrent des gains rapides."),
    ]},
    { title: "🎓 Récap Niveau 6", qs: [
      q("L'IA est la plus efficace pour :", ["Remplacer la stratégie humaine","Automatiser les tâches répétitives et amplifier la productivité","Prendre toutes les décisions","Gérer les relations clients uniquement"], 1, "L'IA amplifie l'humain sur les tâches répétitives. La stratégie et créativité restent humaines."),
      q("Zapier, Make.com et n8n sont des outils d':", ["Analyse de données","Génération d'images","Automatisation no-code","Formation IA"], 2, "Ces outils connectent des apps et automatisent des workflows sans nécessiter de code."),
      v("Un chatbot RAG peut répondre fidèlement aux questions spécifiques à ton business.", true, "Exact ! Le RAG sur ta documentation permet des réponses précises et spécifiques à ton activité."),
    ]},
  ]},

  /* ═══════ NIVEAU 7 ═══════ */
  { id: 7, title: "Marketing IA", sub: "Contenu, SEO & réseaux", color: "#f43f5e", glow: "rgba(244,63,94,0.22)", emoji: "📣", steps: [
    { title: "Copywriting IA", qs: [
      q("Le copywriting IA est le plus efficace pour :", ["Remplacer un copywriter senior","Générer des variantes A/B de textes publicitaires rapidement","Écrire un manifeste de marque","Créer une stratégie de marque"], 1, "L'IA génère 10 variantes d'un texte pub en 30 secondes — parfait pour les tests A/B."),
      q("La formule AIDA en copywriting signifie :", ["Action, Info, Design, Analytics","Attention, Intérêt, Désir, Action","IA, Interface, Data, Analyse","Autre, Idée, Digital, Automation"], 1, "AIDA = Attention → Intérêt → Désir → Action. L'IA maîtrise cette structure."),
      v("L'IA peut adapter un même texte pour différentes audiences cibles.", true, "Oui ! 'Réécris ce texte pour [PME / startup / grand groupe]' donne des versions très différentes."),
    ]},
    { title: "SEO avec l'IA", qs: [
      q("L'IA peut aider au SEO en :", ["Garantissant le classement Google","Générant des articles optimisés pour des mots-clés","Achetant des backlinks","Hackeant l'algorithme Google"], 1, "L'IA génère du contenu structuré (H1, H2, méta-descriptions) optimisé pour les mots-clés ciblés."),
      q("Quel outil combine IA et SEO pour créer du contenu ?", ["Canva","Surfer SEO + GPT-4","Instagram","TikTok Studio"], 1, "Surfer SEO analyse le SERP et guide l'IA pour créer du contenu optimisé selon les top résultats."),
      v("Google pénalise automatiquement tout contenu généré par IA.", false, "Non. Google valorise le contenu utile et de qualité, peu importe s'il est généré par IA ou humain."),
    ]},
    { title: "Réseaux Sociaux IA", qs: [
      q("Pour générer 30 posts LinkedIn en 1h avec l'IA :", ["Copier des posts d'autres","Créer un template de prompt + variations sur 30 sujets","Payer un rédacteur","Publier sans stratégie"], 1, "La méthode batch : 1 template + 30 angles = 30 posts en moins d'une heure avec ChatGPT."),
      q("Les hashtags IA peuvent être générés par :", ["Google Maps","Un prompt demandant les 5 hashtags les plus pertinents pour le post","Instagram directement","Ta mémoire"], 1, "Demande simplement à l'IA : 'Suggère 5 hashtags pertinents pour ce post [LinkedIn/Instagram]'."),
      v("L'IA peut analyser tes meilleurs posts pour reproduire leur formule gagnante.", true, "Oui ! Colle tes 5 meilleurs posts et demande à l'IA d'identifier et reproduire la formule gagnante."),
    ]},
    { title: "Email Marketing IA", qs: [
      q("L'IA peut améliorer l'email marketing en :", ["Remplaçant ta liste d'abonnés","Personnalisant les objets et contenus à grande échelle","Envoyant les emails automatiquement (sans outil)","Gérant ta réputation d'expéditeur"], 1, "L'IA personnalise objets, contenus et CTAs selon le segment — multiplie les taux d'ouverture."),
      q("Pour améliorer le taux d'ouverture d'un email, l'IA aide à :", ["Changer la couleur","Générer 10 variantes d'objet à tester en A/B","Augmenter la fréquence d'envoi","Ajouter plus d'images"], 1, "Un prompt 'génère 10 objets d'email accrocheurs pour [sujet]' crée 10 variantes pour l'A/B test."),
      v("L'IA peut personnaliser un email avec le prénom du destinataire automatiquement.", true, "Oui ! Combinée à un CRM et des variables de merge, l'IA génère des emails ultra-personnalisés."),
    ]},
    { title: "Storytelling IA", qs: [
      q("Le storytelling IA est le plus puissant pour :", ["Remplacer ton histoire personnelle","Structurer et enrichir ton récit de marque existant","Inventer une fausse histoire","Copier d'autres marques"], 1, "L'IA structure et enrichit ton vécu en récit de marque convaincant — toi tu fournis l'authenticité."),
      q("La structure narrative la plus efficace selon Joseph Campbell est :", ["Intro-Développement-Conclusion","Le Voyage du Héros (situation, conflit, transformation, victoire)","AIDA","PAS (Problem-Agitate-Solution)"], 1, "Le Voyage du Héros est universel. L'IA peut structurer ton histoire selon ce schéma narratif."),
      v("L'IA peut raconter ton histoire personnelle de façon authentique sans informations de ta part.", false, "Non. L'authenticité vient de toi. L'IA structure et formule, mais tu dois fournir le contenu réel."),
    ]},
    { title: "Images & Visuels IA", qs: [
      q("Le meilleur outil pour générer des images réalistes haute qualité :", ["Paint","Midjourney V6","Google Images","Canva gratuit"], 1, "Midjourney V6 produit les images les plus photoréalistes et artistiques du marché."),
      q("DALL-E 3 est accessible via :", ["Adobe","ChatGPT Plus et l'API OpenAI","Google Docs","Microsoft Paint"], 1, "DALL-E 3 est intégré à ChatGPT Plus — tu peux décrire et générer des images directement dans la conversation."),
      v("Stable Diffusion peut être utilisé localement sans envoyer d'images à internet.", true, "Oui ! Stable Diffusion est open source et peut tourner sur ton GPU local — 100% privé."),
    ]},
    { title: "Vidéo & Audio IA", qs: [
      q("Quel outil IA transforme un texte en vidéo présentateur IA ?", ["iMovie","HeyGen ou Synthesia","YouTube Studio","DaVinci Resolve"], 1, "HeyGen et Synthesia créent des vidéos avec des avatars IA qui lisent ton script."),
      q("Pour créer des voix off IA en français, on utilise :", ["Google Translate","ElevenLabs ou Murf.ai","Siri","Alexa"], 0, "ElevenLabs génère des voix off ultra-réalistes en français et dans 30+ langues."),
      v("Sora d'OpenAI peut générer des vidéos longues (plus d'une heure) depuis du texte.", false, "Non. Sora génère des clips courts (quelques secondes à quelques minutes). Les vidéos longues sont encore hors de portée."),
    ]},
    { title: "Publicité IA", qs: [
      q("L'IA peut aider à créer des publicités en :", ["Achetant de l'espace pub","Générant des copies d'annonces, visuels et ciblages suggérés","Garantissant les conversions","Remplaçant Meta Ads"], 1, "L'IA génère des variantes de copies, propose des visuels et suggère des audiences basées sur tes données."),
      q("Pour optimiser des Google Ads avec l'IA :", ["Aucun outil n'existe","Google Performance Max utilise l'IA pour optimiser automatiquement","Tu dois tout faire manuellement","L'IA interdit les publicités"], 1, "Google Performance Max utilise le ML pour optimiser automatiquement budget, enchères et ciblage."),
      v("L'IA peut générer des landing pages complètes à partir d'un brief.", true, "Oui ! Des outils comme Unbounce AI ou un prompt bien structuré + dev génèrent des pages complètes."),
    ]},
    { title: "🎓 Récap Niveau 7", qs: [
      q("L'IA est la plus performante en marketing pour :", ["Remplacer la stratégie marketing","Générer des variantes de contenus et personnaliser à grande échelle","Acheter des espaces publicitaires","Garantir les résultats SEO"], 1, "L'IA excelle en génération de variantes et personnalisation à grande échelle."),
      q("Midjourney sert à :", ["Générer du texte","Créer des images IA de haute qualité","Envoyer des emails","Analyser des données"], 1, "Midjourney est le leader de la génération d'images IA artistiques et réalistes."),
      v("L'IA peut adapter un texte marketing selon différentes cibles (CEO, startup, PME).", true, "Exact ! Un même message peut être reformulé pour chaque persona cible avec un simple prompt."),
    ]},
  ]},

  /* ═══════ NIVEAU 8 ═══════ */
  { id: 8, title: "Automatisation", sub: "No-code, APIs & workflows", color: "#0ea5e9", glow: "rgba(14,165,233,0.22)", emoji: "⚙️", steps: [
    { title: "No-code & IA", qs: [
      q("Le no-code IA permet de :", ["Coder en Python plus vite","Créer des automatisations et apps sans programmer","Remplacer les développeurs","Générer des images uniquement"], 1, "Le no-code IA démocratise la création d'outils et automatisations sans compétence en programmation."),
      q("Quel outil no-code permet de créer des apps web complètes avec IA ?", ["Excel","Bubble.io ou Webflow","Instagram","TikTok"], 1, "Bubble.io permet de créer des apps web complexes avec des intégrations IA sans coder."),
      v("Avec les outils no-code actuels, un entrepreneur peut automatiser 80% de son ops en quelques jours.", false, "Exagéré. L'automatisation no-code est puissante mais demande du temps d'apprentissage et de configuration."),
    ]},
    { title: "Zapier Maîtrise", qs: [
      q("Un 'Zap' dans Zapier est :", ["Un type d'IA","Une automatisation déclenchée par un événement","Un plugin","Un modèle de prompt"], 1, "Un Zap = Trigger (déclencheur) + Actions (ce qui se passe en réponse). Ex: Email reçu → Créer tâche."),
      q("Zapier s'intègre avec combien d'applications environ ?", ["100","1 000","7 000+","50 000"], 2, "Zapier connecte plus de 7 000 applications : Gmail, Slack, Notion, HubSpot, Shopify et des centaines d'autres."),
      v("Zapier peut appeler des modèles IA comme GPT-4 dans ses workflows.", true, "Oui ! Zapier a une intégration native OpenAI. Tu peux appeler GPT-4 dans n'importe quel Zap."),
    ]},
    { title: "Make.com Maîtrise", qs: [
      q("Make.com est idéal pour :", ["Les automatisations simples","Les workflows complexes avec logique conditionnelle et itérateurs","Uniquement les emails","Les jeux vidéo"], 1, "Make.com gère la complexité : filtres, routeurs, itérateurs, agrégateurs — bien plus puissant que Zapier."),
      q("Dans Make.com, un 'Router' permet de :", ["Changer l'interface","Créer des branches conditionnelles (si A alors X, si B alors Y)","Envoyer des emails","Générer des images"], 1, "Le Router crée des branches : ex. Si statut='urgent' → envoyer SMS, sinon → créer tâche Notion."),
      v("Make.com peut traiter des fichiers comme des PDFs et des images dans ses workflows.", true, "Oui ! Make.com peut télécharger, transformer et analyser des fichiers dans ses scénarios."),
    ]},
    { title: "n8n Open Source", qs: [
      q("n8n se distingue de Zapier par :", ["Moins de fonctionnalités","La possibilité de s'héberger soi-même (self-hosted)","Son interface plus simple","Le prix plus élevé"], 1, "n8n est open source et self-hostable : tes données ne quittent pas tes serveurs."),
      q("n8n est particulièrement adapté pour :", ["Les débutants complets","Les équipes tech soucieuses de la confidentialité des données","Les réseaux sociaux","La génération d'images"], 1, "n8n est idéal pour les entreprises avec données sensibles ou besoin de personnalisation poussée."),
      v("n8n est totalement gratuit en self-hosted.", true, "Oui ! n8n self-hosted est gratuit. Le cloud n8n.io est payant au-delà d'une certaine utilisation."),
    ]},
    { title: "APIs IA", qs: [
      q("Une API REST permet de :", ["Créer un site web","Connecter des services via des requêtes HTTP standardisées","Générer des images","Coder une IA"], 1, "Une API REST = interface standardisée pour échanger des données entre applications via HTTP."),
      q("Pour appeler l'API OpenAI en Python, on utilise :", ["import openai","import chatgpt","import gpt4","import ai"], 0, "Le SDK officiel OpenAI en Python s'importe avec 'import openai'. Simple et bien documenté."),
      v("Les APIs IA nécessitent toujours de payer pour chaque appel.", false, "Non. Beaucoup d'APIs IA ont des tiers gratuits (Google AI, Hugging Face). OpenAI n'a pas de tier gratuit."),
    ]},
    { title: "Webhooks", qs: [
      q("Un webhook est :", ["Un type de modèle IA","Une URL qui reçoit automatiquement des données quand un événement survient","Un plugin navigateur","Un outil de génération d'images"], 1, "Un webhook = URL que tu crées pour recevoir des données en push (ex: paiement Stripe reçu → notification)."),
      q("La différence entre API polling et webhook :", ["Aucune","Polling = tu demandes régulièrement, Webhook = tu reçois automatiquement","Polling est plus rapide","Webhook coûte plus cher"], 1, "Webhook est plus efficace : tu reçois la notification instantanément sans polling toutes les X secondes."),
      v("Zapier et Make.com peuvent recevoir des webhooks externes.", true, "Oui ! Zapier et Make.com ont des URLs webhook que des apps externes peuvent appeler pour déclencher des automatisations."),
    ]},
    { title: "Workflows Intelligents", qs: [
      q("Un workflow CRM + IA peut automatiquement :", ["Gérer la comptabilité","Qualifier un lead, créer un suivi personnalisé et alerter le commercial","Remplacer le CRM","Acheter des publicités"], 1, "Ex: Lead entrant → IA analyse le profil → Score de qualification → Email personnalisé → Tâche CRM."),
      q("Pour un workflow 'Email entrant → Réponse IA → Approbation humaine → Envoi' :", ["C'est impossible","Zapier/Make + GPT-4 + approbation Slack/email = réalisable en 1h","Il faut coder en Python","Il faut 3 développeurs"], 1, "Ce workflow Human-in-the-loop est une approche sûre pour les automatisations IA en production."),
      v("L'automatisation IA peut traiter des demandes de support 24h/24 sans humain.", true, "Oui ! Un workflow IA répond aux questions courantes et escalade les cas complexes à l'humain."),
    ]},
    { title: "CRM & Support IA", qs: [
      q("HubSpot AI peut automatiquement :", ["Remplacer ton équipe commerciale","Scorer les leads, suggérer des emails et résumer les interactions clients","Gérer ta comptabilité","Créer des publicités TV"], 1, "HubSpot AI scoring, email assist et résumés de conversation accélèrent le travail commercial."),
      q("Pour un support client IA intégré à Intercom :", ["Impossible","Intercom a son propre moteur IA Fin basé sur GPT-4","Il faut coder un chatbot from scratch","Uniquement avec des humains"], 1, "Intercom Fin est un agent IA basé sur GPT-4 qui résout 40-60% des tickets sans intervention humaine."),
      v("Un CRM avec IA peut prédire quels clients risquent de partir (churn).", true, "Oui ! Les modèles de churn prediction analysent les comportements pour identifier les clients à risque."),
    ]},
    { title: "🎓 Récap Niveau 8", qs: [
      q("La principale différence entre Zapier et n8n :", ["n8n est plus beau","n8n est self-hosted (données chez toi), Zapier est cloud","Zapier est gratuit","Aucune différence"], 1, "n8n self-hosted = confidentialité totale. Zapier cloud = facilité mais données chez Zapier."),
      q("Un webhook est déclenché :", ["Manuellement","Automatiquement quand un événement survient dans une app externe","Chaque heure","Uniquement le matin"], 1, "Les webhooks = notifications automatiques en temps réel, sans polling."),
      v("Make.com peut traiter des logiques conditionnelles complexes dans ses workflows.", true, "Exact ! Le Router de Make.com permet des branches 'si/sinon' complexes."),
    ]},
  ]},

  /* ═══════ NIVEAU 9 ═══════ */
  { id: 9, title: "Stratégie IA", sub: "Vision, éthique & futur", color: "#6366f1", glow: "rgba(99,102,241,0.22)", emoji: "🎯", steps: [
    { title: "Tendances IA 2025", qs: [
      q("La tendance majeure de l'IA en 2025 est :", ["Le retour à l'IA symbolique","Les agents IA autonomes et le raisonnement avancé","La fin des LLMs","La domination de l'IA hardware"], 1, "2025 = l'année des agents IA, des modèles de raisonnement (o1, o3) et de l'IA multimodale avancée."),
      q("Le modèle o1 d'OpenAI se distingue par :", ["Sa vitesse","Son raisonnement lent mais très profond (Chain of Thought interne)","Sa taille réduite","Son prix bas"], 1, "o1 'pense' avant de répondre avec du Chain of Thought interne, excellent pour les problèmes complexes."),
      v("Les modèles multimodaux (texte + image + audio) sont la norme en 2025.", true, "Oui ! GPT-4o, Gemini 1.5, Claude 3.5 — tous sont multimodaux ou le deviennent."),
    ]},
    { title: "IA Locale & Privacy", qs: [
      q("Avantage principal d'une IA locale (ex: Ollama) :", ["Plus puissante","Données 100% privées, zéro envoi vers le cloud","Moins chère en computing","Plus rapide que les APIs cloud"], 1, "L'IA locale garantit que tes données ne quittent jamais ton serveur — crucial pour les données sensibles."),
      q("Ollama permet de :", ["Créer un site web","Faire tourner des LLMs open source (LLaMA, Mistral) localement","Acheter des GPUs","Générer des images"], 1, "Ollama est l'outil le plus simple pour lancer des LLMs localement : `ollama run llama3`."),
      v("Une IA locale peut être aussi puissante que GPT-4 sur un laptop standard.", false, "Pas encore. GPT-4 nécessite des milliers de GPUs. Les modèles locaux sur laptop restent moins puissants."),
    ]},
    { title: "Open Source IA", qs: [
      q("L'avantage de l'IA open source pour les entreprises :", ["Toujours la meilleure performance","Contrôle total, personnalisation et audit du code","Gratuit sans limite","Aucun avantage"], 1, "L'open source permet d'auditer, modifier et déployer l'IA selon tes besoins spécifiques."),
      q("Hugging Face est :", ["Un réseau social","Le hub central pour modèles, datasets et démos IA open source","Une startup de robotique","Un cloud GPU"], 1, "Hugging Face héberge +400k modèles IA open source. C'est le GitHub de l'IA."),
      v("Fine-tuner un modèle open source sur ses propres données est possible.", true, "Oui ! Tu peux fine-tuner LLaMA, Mistral ou Falcon sur tes données avec des outils comme Unsloth."),
    ]},
    { title: "Éthique de l'IA", qs: [
      q("Le principal risque éthique des LLMs est :", ["Ils coûtent trop cher","Les biais, désinformation et utilisation malveillante","Ils sont trop lents","Ils ne parlent qu'anglais"], 1, "Les LLMs amplifient les biais de leurs données d'entraînement et peuvent être utilisés pour la désinformation."),
      q("L'IA 'alignment' désigne :", ["Aligner les pixels d'une image","S'assurer que l'IA agit conformément aux valeurs humaines","Mettre à jour un modèle","Aligner des données"], 1, "L'alignment = s'assurer que l'IA fait ce que l'humain veut vraiment, de façon sûre et éthique."),
      v("Anthropic a été fondée spécifiquement pour travailler sur la sécurité de l'IA.", true, "Oui ! La raison d'être d'Anthropic est l'AI Safety : développer une IA puissante et sûre."),
    ]},
    { title: "RGPD & IA", qs: [
      q("Le RGPD s'applique à l'IA :", ["Non, l'IA est exemptée","Oui, dès que des données personnelles de résidents UE sont traitées","Uniquement pour les grandes entreprises","Uniquement en France"], 1, "L'IA traitant des données personnelles d'habitants UE est soumise au RGPD, peu importe où l'entreprise est."),
      q("Pour être RGPD-compliant en utilisant ChatGPT avec des données clients :", ["C'est impossible","Utiliser l'API avec l'option no-training + DPA signé avec OpenAI","Rien à faire","Juste mentionner l'IA dans les CGU"], 1, "L'API OpenAI avec data processing agreement (DPA) + no training permet d'être RGPD-compliant."),
      v("Il est légalement risqué de stocker des données clients dans ChatGPT sans consentement.", true, "Vrai ! Le traitement de données personnelles dans ChatGPT sans base légale et DPA viole le RGPD."),
    ]},
    { title: "Gouvernance IA", qs: [
      q("L'EU AI Act classe les IA selon :", ["Leur prix","Leur niveau de risque (faible, limité, élevé, inacceptable)","Leur performance","Leur langue"], 1, "L'EU AI Act adopté en 2024 impose des règles selon le niveau de risque de chaque système IA."),
      q("Une politique IA d'entreprise devrait inclure :", ["Rien, c'est inutile","Règles d'usage, données autorisées, supervision et review des outputs","Uniquement interdire l'IA","Laisser chaque employé décider"], 1, "Une bonne politique IA définit : quels outils utiliser, quelles données partager, comment valider les outputs."),
      v("Le règlement européen sur l'IA (EU AI Act) s'applique aux entreprises hors UE.", true, "Oui ! Comme le RGPD, l'EU AI Act s'applique dès qu'une IA impacte des utilisateurs dans l'UE."),
    ]},
    { title: "Sécurité IA", qs: [
      q("Le 'jailbreak' d'un LLM consiste à :", ["Améliorer ses performances","Contourner ses garde-fous de sécurité via des prompts astucieux","Accélérer l'inférence","Réduire les coûts"], 1, "Le jailbreak = tricks de prompt pour contourner les filtres de sécurité du modèle."),
      q("Pour protéger une application IA contre les attaques prompt injection :", ["Ne rien faire","Valider et assainir les inputs, utiliser des system prompts robustes, sandboxer l'agent","Cacher les prompts système","Utiliser uniquement GPT-3.5"], 1, "Défense en profondeur : validation d'input, prompts robustes, logs, sandbox et supervision humaine."),
      v("L'ingénierie des prompts malveillants peut extraire le system prompt d'une application.", true, "Oui ! Il existe des techniques pour extraire des system prompts. Un bon design de sécurité les limite."),
    ]},
    { title: "Roadmap IA", qs: [
      q("Pour adopter l'IA en entreprise, la première étape est :", ["Acheter tous les outils","Identifier les cas d'usage avec le meilleur ROI et commencer petit","Former tout le monde","Recruter un CDO"], 1, "La bonne approche : identifier 2-3 cas d'usage à fort ROI, piloter, mesurer, puis scaler."),
      q("Le bon ordre pour déployer l'IA en entreprise :", ["Former → Déployer → Tester","Identifier → Piloter → Mesurer → Scaler → Former","Acheter les outils → Former → Espérer","Recruter des experts → Attendre"], 1, "La méthode pragmatique : cas d'usage → MVP → métriques → scale → formation continue."),
      v("La formation des équipes est souvent le plus grand obstacle à l'adoption de l'IA.", true, "Vrai ! Les études montrent que la résistance au changement et le manque de formation sont les obstacles #1."),
    ]},
    { title: "🎓 Récap Niveau 9", qs: [
      q("L'EU AI Act classe les IA par :", ["Prix","Niveau de risque","Nationalité","Taille du modèle"], 1, "L'EU AI Act adopté en 2024 impose des obligations selon le niveau de risque de chaque IA."),
      q("Ollama permet de :", ["Créer des images","Faire tourner des LLMs localement","Envoyer des emails","Analyser des données financières"], 1, "Ollama est l'outil de référence pour lancer des LLMs open source en local."),
      v("RGPD et EU AI Act s'appliquent aux entreprises non-européennes qui ciblent l'UE.", true, "Exact ! Toute IA touchant des utilisateurs UE est concernée, peu importe l'origine de l'entreprise."),
    ]},
  ]},

  /* ═══════ NIVEAU 10 ═══════ */
  { id: 10, title: "Maîtrise Expert", sub: "Architecture, fine-tuning & futur", color: "#eab308", glow: "rgba(234,179,8,0.25)", emoji: "👑", steps: [
    { title: "Architecture des LLMs", qs: [
      q("Le mécanisme central des Transformers est :", ["La convolution","Le mécanisme d'attention (Self-Attention)","La récurrence","Le pooling"], 1, "Self-Attention permet au modèle de peser l'importance de chaque token par rapport à tous les autres."),
      q("Que signifie 'paramètre' dans '70B parameters' ?", ["70 milliards de tokens","70 milliards de poids ajustables dans le réseau de neurones","70 milliards de données d'entraînement","70 milliards de conversations"], 1, "Les paramètres sont les poids du réseau ajustés pendant l'entraînement. Plus il y en a, plus le modèle est capable."),
      v("Un modèle plus grand (plus de paramètres) est toujours meilleur.", false, "Non. L'architecture, les données et la méthode d'entraînement importent autant que la taille."),
    ]},
    { title: "Fine-Tuning", qs: [
      q("Le fine-tuning consiste à :", ["Optimiser les prompts","Réentraîner partiellement un modèle pré-entraîné sur des données spécifiques","Créer un nouveau modèle from scratch","Compresser un modèle"], 1, "Le fine-tuning adapte un modèle général à un domaine spécifique avec un jeu de données ciblé."),
      q("LoRA (Low-Rank Adaptation) est :", ["Un modèle IA","Une technique de fine-tuning efficace utilisant peu de paramètres","Un type de base vectorielle","Un outil de déploiement"], 1, "LoRA fine-tune uniquement des matrices de faible rang, réduisant drastiquement la mémoire nécessaire."),
      v("Le fine-tuning nécessite des milliers de GPUs.", false, "Non ! Avec LoRA/QLoRA, tu peux fine-tuner un modèle 7B sur un seul GPU consumer (RTX 3090)."),
    ]},
    { title: "RLHF & Alignment", qs: [
      q("RLHF signifie :", ["Rapid Learning from Human Feedback","Reinforcement Learning from Human Feedback","Random Learning Helping Function","Reward Learning High Fidelity"], 1, "RLHF = l'humain note les réponses du modèle, ces notes entraînent un modèle de récompense pour guider le LLM."),
      q("ChatGPT a été rendu 'conversationnel et utile' principalement grâce à :", ["Plus de données","RLHF et Instruction Tuning","Un nouveau hardware","Des prompts secrets"], 1, "ChatGPT = GPT-3.5 + RLHF + Instruction Tuning. Le RLHF a transformé un modèle générique en assistant."),
      v("Le DPO (Direct Preference Optimization) est une alternative moins coûteuse au RLHF.", true, "Oui ! DPO entraîne directement sur des paires de préférences sans modèle de récompense séparé."),
    ]},
    { title: "Déploiement Production", qs: [
      q("Vllm est un outil de :", ["Génération d'images","Serving de LLMs à haute performance en production","Fine-tuning","Formation des équipes"], 1, "vLLM (Virtual Large Language Model) est le standard pour servir des LLMs en production avec haute performance."),
      q("La quantification d'un modèle permet de :", ["L'entraîner plus vite","Réduire sa taille en mémoire (ex: float16 → int4) sans trop perdre en qualité","Augmenter sa taille de contexte","Améliorer sa sécurité"], 1, "La quantification (GGUF, GPTQ, AWQ) réduit l'empreinte mémoire d'un modèle de 2x à 8x."),
      v("FastAPI est souvent utilisé pour créer des APIs autour des LLMs.", true, "Oui ! FastAPI est le choix populaire en Python pour wrapper un LLM en API REST performante."),
    ]},
    { title: "Monitoring LLM", qs: [
      q("Le monitoring d'un LLM en production doit surveiller :", ["Uniquement les erreurs serveur","Latence, coût/requête, qualité des réponses, hallucinations et usage abusif","Uniquement le coût","Seulement la disponibilité"], 1, "Un bon monitoring LLM couvre : latence P95, tokens/requête, qualité (sampling), cost/query, anomalies."),
      q("Langfuse est :", ["Un modèle IA","Une plateforme d'observabilité open source pour LLMs","Un outil de fine-tuning","Un framework d'agents"], 1, "Langfuse trace chaque appel LLM, mesure les coûts, la latence et évalue la qualité des réponses."),
      v("Les hallucinations d'un LLM en production peuvent être détectées automatiquement.", true, "Oui ! Des classifieurs et détecteurs de cohérence factuelles identifient (partiellement) les hallucinations."),
    ]},
    { title: "Scaling & Performance", qs: [
      q("La 'Scaling Law' (loi de mise à l'échelle) prédit que :", ["Les coûts augmentent linéairement","Les performances augmentent prévisiblement avec la taille du modèle et les données","Les modèles deviennent moins fiables","L'IA s'améliore spontanément"], 1, "Les Scaling Laws (Kaplan et al.) montrent une relation log-linéaire entre taille, données et performance."),
      q("MoE (Mixture of Experts) permet d'avoir :", ["Plus de GPU","Un modèle énorme qui n'active qu'une partie de ses paramètres à chaque token","Plus de mémoire","Un modèle plus lent"], 1, "MoE (Mixtral, Grok) = des milliers d'experts, seulement 2-8 activés par token. Efficacité maximale."),
      v("La distillation consiste à entraîner un petit modèle à reproduire le comportement d'un grand.", true, "Oui ! La distillation (ex: DeepSeek R1 → modèles distillés) transfère les capacités vers des modèles légers."),
    ]},
    { title: "IA Multimodale", qs: [
      q("Un modèle multimodal traite :", ["Uniquement du texte","Plusieurs types de données : texte, images, audio, vidéo","Uniquement des images","Des données financières uniquement"], 1, "Les modèles multimodaux (GPT-4o, Gemini) comprennent et génèrent plusieurs types de médias."),
      q("GPT-4V désigne :", ["GPT-4 Vectoriel","GPT-4 Vision : capable d'analyser des images","GPT-4 Virtuel","GPT-4 Vérifié"], 1, "GPT-4V (Vision) peut analyser, décrire et raisonner sur des images dans la conversation."),
      v("Les modèles multimodaux peuvent lire le texte dans des images (OCR).", true, "Oui ! GPT-4V, Claude 3 Vision et Gemini Pro Vision font de l'OCR très performant."),
    ]},
    { title: "Frontier Models", qs: [
      q("GPT-o3 est connu pour :", ["Être le moins cher","Des performances exceptionnelles en raisonnement et sciences","Uniquement la génération d'images","Sa vitesse"], 1, "o3 (OpenAI) atteint des niveaux quasi-humains sur ARC-AGI et les benchmarks de raisonnement expert."),
      q("AGI signifie :", ["Advanced GPU Integration","Artificial General Intelligence : IA aux capacités humaines générales","Automated Generation Interface","Anthropic General Initiative"], 1, "AGI = IA capable de réaliser n'importe quelle tâche cognitive humaine — encore un objectif futur."),
      v("Les LLMs actuels ont atteint l'AGI.", false, "Non. Les LLMs actuels sont très capables sur des tâches spécifiques mais manquent de compréhension générale et d'autonomie de l'AGI."),
    ]},
    { title: "Futur de l'IA", qs: [
      q("La tendance 'AI Agents at Scale' en 2025 prédit :", ["La fin des LLMs","Des milliers d'agents IA qui travaillent en parallèle sur des tâches complexes","Une réduction des capacités IA","Le retour des règles expertes"], 1, "Les systèmes multi-agents en 2025 permettent de faire tourner des centaines d'agents sur des workflows complexes."),
      q("L'IA embarquée (on-device AI) signifie :", ["L'IA dans les voitures uniquement","L'IA qui tourne directement sur l'appareil (smartphone, laptop) sans cloud","L'IA dans les satellites","L'IA sous-marine"], 1, "Apple Intelligence, Gemini Nano (Pixel) et Phi-3 mini tournent sur l'appareil. Confidentialité maximale."),
      v("L'IA va rendre de nombreux emplois obsolètes tout en en créant de nouveaux.", true, "Vrai. L'histoire technologique montre que chaque révolution détruit des emplois et en crée d'autres."),
    ]},
    { title: "🏆 Maîtrise Certifiée", qs: [
      q("Le mécanisme central des Transformers est :", ["La récurrence","L'attention (Self-Attention)","La convolution","Le pooling"], 1, "Bravo Expert ! Self-Attention est le cœur des Transformers et de tous les LLMs modernes."),
      q("RLHF permet de :", ["Accélérer l'inférence","Aligner le LLM sur les préférences humaines via feedback et renforcement","Compresser les modèles","Indexer des documents"], 1, "RLHF = la technique clé qui a transformé les LLMs en assistants utiles, inoffensifs et honnêtes."),
      v("Tu es maintenant un Expert IA DJAMA certifié prêt à transformer ton business.", true, "FÉLICITATIONS ! Tu as complété les 10 niveaux de la formation IA DJAMA. Tu es maintenant un Expert IA ! 🏆"),
    ]},
  ]},
];

export const XP_PER_STAR = 10; // 30 XP max per step
export const MAX_STARS = 3;

export function getStars(correct: number, total: number): number {
  if (total === 0) return 0;
  const pct = correct / total;
  if (pct >= 1) return 3;
  if (pct >= 0.67) return 2;
  if (pct >= 0.34) return 1;
  return 0;
}
