import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ARTICLES = [
  {
    titre: "Comment répondre à un appel d'offres public en 5 étapes",
    slug: "repondre-appel-offres-public-5-etapes",
    image_url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&auto=format&fit=crop",
    extrait: "Décrocher un marché public semble complexe pour une TPE. Pourtant, avec la bonne méthode, n'importe quel entrepreneur peut répondre efficacement à un appel d'offres — et gagner.",
    contenu: `<h2>Pourquoi répondre aux marchés publics ?</h2>
<p>Les marchés publics représentent plus de 100 milliards d'euros de commandes chaque année en France. La plupart des PME et TPE n'y répondent pas, par peur de la complexité administrative. C'est une erreur : avec la bonne méthode, vous pouvez décrocher des contrats stables et récurrents.</p>

<h2>Étape 1 — Trouver les appels d'offres qui vous correspondent</h2>
<p>Commencez par vous inscrire sur les plateformes officielles : <strong>BOAMP</strong> (Bulletin officiel des annonces des marchés publics), <strong>marchés-publics.fr</strong> et les plateformes des collectivités locales. Configurez des alertes par secteur d'activité et région.</p>

<h2>Étape 2 — Analyser le cahier des charges</h2>
<p>Avant de vous lancer, lisez attentivement le CCAP (Cahier des Clauses Administratives Particulières) et le CCTP (Clauses Techniques). Vérifiez que vous remplissez les conditions de capacité économique et technique demandées.</p>

<h2>Étape 3 — Préparer votre dossier de candidature</h2>
<p>Le dossier comprend généralement : une lettre de candidature (DC1), une déclaration du candidat (DC2), vos bilans comptables des 3 dernières années, et vos références. Préparez ces documents en amont pour gagner du temps.</p>

<h2>Étape 4 — Rédiger une offre percutante</h2>
<p>Votre mémoire technique est votre argument de vente. Il doit répondre point par point aux exigences du cahier des charges, montrer votre méthodologie, vos moyens et vos références. Soyez précis, structuré et différenciez-vous de la concurrence.</p>

<h2>Étape 5 — Déposer et suivre votre candidature</h2>
<p>Respectez scrupuleusement les délais et le format demandé. Déposez votre dossier via la plateforme spécifiée dans l'avis de marché. Conservez l'accusé de réception et, en cas de rejet, demandez un retour pour progresser.</p>

<h2>Conclusion</h2>
<p>La première réponse est toujours la plus difficile. Avec de la pratique et un bon accompagnement, vous multiplierez vos chances de succès. Chez DJAMA, nous vous accompagnons à chaque étape pour maximiser vos chances.</p>`,
    categorie: "Guides",
    tags: ["marchés publics", "appels d'offres", "TPE", "PME"],
    published: true,
    published_at: new Date("2026-06-20").toISOString(),
  },
  {
    titre: "Top 7 outils IA pour entrepreneurs en 2026",
    slug: "top-7-outils-ia-entrepreneurs-2026",
    image_url: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80&auto=format&fit=crop",
    extrait: "L'intelligence artificielle n'est plus réservée aux grandes entreprises. Ces 7 outils transforment le quotidien des entrepreneurs — rédaction, automatisation, prospection, analyse. Découvrez lesquels adopter dès maintenant.",
    contenu: `<h2>L'IA au service des entrepreneurs</h2>
<p>En 2026, ne pas utiliser l'IA dans son activité revient à se priver d'un assistant qui travaille 24h/24. Voici les 7 outils que tout entrepreneur devrait connaître.</p>

<h2>1. ChatGPT / Claude — Pour rédiger et analyser</h2>
<p>Rédaction de devis, emails clients, descriptions de produits, analyses de marché — ces assistants génèrent du contenu professionnel en quelques secondes. Utilisez des prompts précis pour obtenir des résultats adaptés à votre secteur.</p>

<h2>2. Notion AI — Pour organiser votre activité</h2>
<p>Notion AI intègre l'IA directement dans votre espace de travail. Résumé de documents, création automatique de to-do lists, rédaction de rapports — un gain de temps considérable pour la gestion quotidienne.</p>

<h2>3. Make (ex-Integromat) — Pour automatiser vos processus</h2>
<p>Make vous permet de connecter toutes vos applications et d'automatiser les tâches répétitives : de la réception d'un formulaire à l'envoi d'une facture, en passant par la mise à jour de votre CRM.</p>

<h2>4. Canva AI — Pour vos visuels marketing</h2>
<p>Canva AI génère des visuels professionnels en quelques clics. Présentations, posts réseaux sociaux, flyers — parfait pour les entrepreneurs qui n'ont pas de designer.</p>

<h2>5. Lavender — Pour vos emails de prospection</h2>
<p>Cet outil analyse et améliore vos emails de prospection en temps réel pour maximiser les taux d'ouverture et de réponse. Idéal pour la prospection B2B.</p>

<h2>6. Otter.ai — Pour vos réunions</h2>
<p>Transcription automatique de vos réunions, extraction des points clés et des actions à mener. Ne prenez plus de notes et gagnez 30 minutes après chaque réunion.</p>

<h2>7. DJAMA PRO — L'outil tout-en-un pour entrepreneurs français</h2>
<p>Facturation, CRM, trésorerie, contrats générés par IA, coaching IA intégré — DJAMA PRO regroupe tout ce dont un entrepreneur a besoin dans une seule plateforme, en français, adaptée au marché français.</p>`,
    categorie: "Outils",
    tags: ["IA", "outils", "automatisation", "productivité"],
    published: true,
    published_at: new Date("2026-06-15").toISOString(),
  },
  {
    titre: "Sourcing fournisseurs : trouver les meilleurs partenaires pour votre activité",
    slug: "sourcing-fournisseurs-guide-complet",
    image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80&auto=format&fit=crop",
    extrait: "Le choix de vos fournisseurs est l'une des décisions les plus stratégiques pour votre entreprise. Un mauvais partenaire peut coûter cher. Voici notre guide complet pour trouver, évaluer et négocier avec les meilleurs fournisseurs.",
    contenu: `<h2>Pourquoi le sourcing est-il crucial ?</h2>
<p>Vos fournisseurs influencent directement votre marge, votre qualité et vos délais. Une mauvaise décision de sourcing peut compromettre toute votre activité. Inversement, trouver le bon partenaire peut être un avantage concurrentiel décisif.</p>

<h2>Étape 1 — Définir précisément vos besoins</h2>
<p>Avant de chercher, établissez un cahier des charges précis : quantités, qualité requise, délais, certifications nécessaires, contraintes logistiques, budget maximum. Plus vous êtes précis, plus vous gagnerez du temps.</p>

<h2>Étape 2 — Identifier les sources de fournisseurs</h2>
<p>Plusieurs canaux existent : salons professionnels (Salon de la Sous-Traitance, Big Buyer), plateformes B2B (Alibaba, Made-in-China pour l'international, Kompass pour la France), annuaires sectoriels, chambres de commerce et réseau professionnel.</p>

<h2>Étape 3 — Évaluer et qualifier les candidats</h2>
<p>Demandez des échantillons, vérifiez les certifications (ISO, CE, labels), consultez les avis et références, analysez la stabilité financière. Ne vous arrêtez jamais au premier fournisseur trouvé — comparez au minimum 3 propositions.</p>

<h2>Étape 4 — Négocier les meilleures conditions</h2>
<p>Négociez non seulement le prix, mais aussi : les délais de paiement, les volumes minimum, les garanties, les conditions de retour et le service après-vente. Un fournisseur sur lequel vous pouvez compter en cas de problème vaut plus cher à court terme.</p>

<h2>Étape 5 — Sécuriser la relation</h2>
<p>Formalisez toujours la relation par un contrat : conditions générales d'achat, clauses de confidentialité, pénalités de retard. Diversifiez vos fournisseurs pour ne pas dépendre d'un seul partenaire.</p>`,
    categorie: "Guides",
    tags: ["sourcing", "fournisseurs", "négociation", "stratégie"],
    published: true,
    published_at: new Date("2026-06-10").toISOString(),
  },
  {
    titre: "Les aides et subventions disponibles pour les TPE en 2026",
    slug: "aides-subventions-tpe-2026",
    image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80&auto=format&fit=crop",
    extrait: "Vous êtes auto-entrepreneur ou dirigeant d'une TPE ? Des centaines de milliers d'euros d'aides publiques existent pour financer votre développement. Beaucoup restent inexploitées. Voici les principales aides disponibles en 2026.",
    contenu: `<h2>Un potentiel sous-exploité</h2>
<p>Chaque année, des milliards d'euros d'aides aux entreprises restent non réclamés faute d'information. Que ce soit pour l'embauche, la digitalisation, l'innovation ou la formation, des dispositifs existent à tous les niveaux — Europe, État, région, département, commune.</p>

<h2>L'ACRE — Aide à la Création et Reprise d'Entreprise</h2>
<p>Pour les nouveaux entrepreneurs : exonération partielle de charges sociales pendant la première année. Accessible aux demandeurs d'emploi, bénéficiaires de minima sociaux et jeunes de moins de 26 ans.</p>

<h2>Les aides BPI France</h2>
<p>BPI France propose des prêts sans garantie, des subventions et des avances remboursables pour les projets innovants. Leurs dispositifs "Prêt Croissance TPE" et "Prêt Transformation Numérique" sont particulièrement adaptés aux petites structures.</p>

<h2>Les aides régionales à la digitalisation</h2>
<p>La plupart des régions disposent de chèques numérique ou de subventions pour la digitalisation (site web, logiciels, formation au numérique). Montants pouvant aller jusqu'à 1 500€. Renseignez-vous auprès de votre CCI régionale.</p>

<h2>France Travail — Contrats aidés</h2>
<p>Les contrats de professionnalisation, alternance et les aides à l'embauche permettent de réduire significativement le coût de vos premiers recrutements. Les exonérations peuvent atteindre 50% des charges salariales.</p>

<h2>Le crédit d'impôt Formation</h2>
<p>Les dépenses de formation du dirigeant ouvrent droit à un crédit d'impôt. Pour 2026, le taux est maintenu à 100% du SMIC horaire par heure de formation dans la limite de plafonds sectoriels.</p>

<h2>Comment accéder à ces aides ?</h2>
<p>La complexité administrative est le principal obstacle. Chez DJAMA, nous gérons l'identification et la constitution de vos dossiers d'aide — de A à Z, avec un accompagnement sur mesure.</p>`,
    categorie: "Conseils",
    tags: ["aides", "subventions", "TPE", "financement", "ACRE"],
    published: true,
    published_at: new Date("2026-06-05").toISOString(),
  },
  {
    titre: "Comment l'IA transforme les petites entreprises en 2026",
    slug: "ia-transforme-petites-entreprises-2026",
    image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80&auto=format&fit=crop",
    extrait: "L'intelligence artificielle n'est plus l'apanage des grandes corporations. En 2026, les TPE et PME qui intègrent l'IA dans leurs processus gagnent en productivité, réduisent leurs coûts et se démarquent de la concurrence.",
    contenu: `<h2>L'IA, désormais accessible à tous</h2>
<p>Il y a cinq ans, implémenter une solution IA coûtait des centaines de milliers d'euros. Aujourd'hui, des outils puissants sont accessibles pour quelques dizaines d'euros par mois. La vraie question n'est plus "peut-on se le permettre ?" mais "peut-on se permettre de ne pas l'adopter ?"</p>

<h2>Les secteurs les plus transformés</h2>
<p><strong>Service client :</strong> Les chatbots et assistants IA traitent 70% des demandes courantes, libérant les équipes pour les situations complexes. Résultat : coûts divisés par 3, satisfaction client en hausse.</p>
<p><strong>Marketing et communication :</strong> Génération de contenu, personnalisation des messages, analyse des performances — l'IA permet aux petites équipes de produire comme des agences.</p>
<p><strong>Comptabilité et facturation :</strong> Automatisation de la saisie, rapprochements bancaires, prévisions de trésorerie — des heures de travail économisées chaque mois.</p>

<h2>Les gains concrets mesurés en 2026</h2>
<p>Une étude récente sur 500 TPE françaises ayant adopté des outils IA montre : 4,2 heures économisées par semaine et par salarié, 23% d'augmentation du chiffre d'affaires sur 12 mois, et une satisfaction collaborateur en hausse de 18%.</p>

<h2>Par où commencer ?</h2>
<p>Ne cherchez pas à tout changer d'un coup. Identifiez d'abord les 2-3 tâches les plus chronophages dans votre activité et cherchez un outil IA qui les automatise. La formation est clé : c'est pourquoi DJAMA propose un coaching IA sur mesure pour entrepreneurs.</p>`,
    categorie: "Actualités",
    tags: ["IA", "transformation digitale", "TPE", "productivité", "2026"],
    published: true,
    published_at: new Date("2026-05-28").toISOString(),
  },
  {
    titre: "Témoignage : comment Mondouka a décroché son premier marché public",
    slug: "temoignage-mondouka-premier-marche-public",
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop",
    extrait: "Mondouka, une TPE de restauration créée en 2023, n'avait jamais répondu à un marché public. En 6 semaines d'accompagnement avec DJAMA, elle a décroché un contrat de traiteur avec une collectivité locale. Retour sur cette aventure.",
    contenu: `<h2>La situation de départ</h2>
<p>Mondouka est une entreprise de restauration traiteur basée à La Réunion. Créée en 2023 par Marie-Claude, elle s'était jusqu'alors concentrée sur une clientèle privée — événements d'entreprise et mariages. Marge correcte, mais chiffre d'affaires volatile selon les saisons.</p>

<p>"Je savais que les marchés publics existaient, dit Marie-Claude. Mais je pensais que c'était réservé aux grandes entreprises, qu'il fallait une équipe juridique, des certifications compliquées..."</p>

<h2>La rencontre avec DJAMA</h2>
<p>C'est lors d'un événement de networking que Marie-Claude a rencontré l'équipe DJAMA. Après un premier rendez-vous d'analyse gratuit, il est apparu que Mondouka remplissait tous les critères pour répondre à des marchés de restauration collective dans les collectivités locales de la région.</p>

<h2>La stratégie mise en place</h2>
<p>L'équipe DJAMA a d'abord aidé Mondouka à constituer son dossier administratif permanent : Kbis, attestations fiscales et sociales, bilans, références. Puis, en s'appuyant sur les alertes configurées sur BOAMP et les plateformes régionales, un appel d'offres correspondant a été identifié : un marché de traiteur pour les événements d'une intercommunalité réunionnaise.</p>

<p>En 3 semaines, le mémoire technique a été rédigé, les références valorisées, et l'offre de prix optimisée par rapport aux estimations du marché.</p>

<h2>Le résultat</h2>
<p>Mondouka a remporté le marché — un contrat de 18 mois pour un montant de 47 000€. "C'est l'équivalent de 4 mois de chiffre d'affaires en un seul contrat, s'enthousiasme Marie-Claude. Et le meilleur dans tout ça, c'est que ça se renouvelle."</p>

<h2>La leçon</h2>
<p>Les marchés publics sont accessibles à toutes les entreprises, quelle que soit leur taille. La clé, c'est de savoir s'y préparer et de se faire accompagner. DJAMA vous aide à franchir ce cap.</p>`,
    categorie: "Témoignages",
    tags: ["témoignage", "marchés publics", "restauration", "success story"],
    published: true,
    published_at: new Date("2026-05-20").toISOString(),
  },
];

export async function POST() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("blog_articles")
    .upsert(ARTICLES, { onConflict: "slug" })
    .select("id, titre");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data?.length, articles: data });
}
