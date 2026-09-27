import type { DraftForm } from "./types";

export function buildContractText(f: DraftForm): string {
  const today = new Date().toLocaleDateString("fr-FR");
  const clauses = [...f.selected_clauses, ...(f.specifics ? [f.specifics] : [])];
  const clauseText = clauses.length ? clauses.map((c) => `• ${c}`).join("\n") : "Aucune clause spécifique ajoutée.";

  const header = `${f.title.toUpperCase()}
═══════════════════════════════════════════════════

Entre les soussignés :

LE PRESTATAIRE / PARTIE A
Représenté par l'utilisateur de la plateforme Djama

${f.client_company ? `LE CLIENT / PARTIE B\nSociété : ${f.client_company}\n` : "LE CLIENT / PARTIE B\n"}Représentant : ${f.client_name}${f.client_email ? `\nEmail : ${f.client_email}` : ""}

Ci-après dénommés ensemble « les Parties ».

───────────────────────────────────────────────────
ARTICLE 1 – OBJET
───────────────────────────────────────────────────
Le présent contrat a pour objet : « ${f.title} ».

───────────────────────────────────────────────────
ARTICLE 2 – DURÉE
───────────────────────────────────────────────────
Durée : ${f.duration_months} mois${f.start_date ? `, du ${f.start_date}` : ""}${f.end_date ? ` au ${f.end_date}` : ""}.

───────────────────────────────────────────────────
ARTICLE 3 – CONDITIONS FINANCIÈRES
───────────────────────────────────────────────────
Montant : ${f.amount ? parseFloat(f.amount).toLocaleString("fr-FR") : "À définir"} ${f.currency} HT
Paiement : virement bancaire sous 30 jours à réception de facture.

───────────────────────────────────────────────────
ARTICLE 4 – OBLIGATIONS DES PARTIES
───────────────────────────────────────────────────
Partie A : réaliser la mission avec diligence, respecter les délais, informer de tout obstacle.
Partie B : fournir les éléments nécessaires, régler les factures, désigner un interlocuteur.

───────────────────────────────────────────────────
ARTICLE 5 – CONFIDENTIALITÉ
───────────────────────────────────────────────────
Chaque Partie s'engage à maintenir la confidentialité de toutes les informations échangées pendant la durée du contrat et 3 ans après son expiration.

───────────────────────────────────────────────────
ARTICLE 6 – PROPRIÉTÉ INTELLECTUELLE
───────────────────────────────────────────────────
Les travaux réalisés dans le cadre de ce contrat seront la propriété exclusive du Client après règlement intégral des sommes dues.

───────────────────────────────────────────────────
ARTICLE 7 – RÉSILIATION
───────────────────────────────────────────────────
Résiliation possible en cas de manquement grave, après mise en demeure restée sans effet pendant 15 jours calendaires.

───────────────────────────────────────────────────
ARTICLE 8 – CLAUSES SPÉCIFIQUES
───────────────────────────────────────────────────
${clauseText}

───────────────────────────────────────────────────
ARTICLE 9 – LOI APPLICABLE
───────────────────────────────────────────────────
Le présent contrat est soumis au droit de : ${f.jurisdiction}.
En cas de litige, les Parties conviennent de rechercher une solution amiable avant tout recours judiciaire.

───────────────────────────────────────────────────
SIGNATURES
───────────────────────────────────────────────────
Fait le ${today}, en deux exemplaires originaux.

Partie A                               Partie B (${f.client_name})
_______________________                _______________________`;

  return header;
}

