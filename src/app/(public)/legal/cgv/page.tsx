import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Conditions générales de vente — DJAMA" };

export default function CGV() {
  return (
    <LegalPage title="Conditions générales de vente" lastUpdated="30 juillet 2026">

      {/* ─── Préambule ─── */}
      <h2>Préambule</h2>
      <p>
        Les présentes Conditions Générales de Vente (CGV) s&apos;appliquent à toute commande passée
        sur le site <strong>djama.space</strong> auprès de :
      </p>
      <ul>
        <li><strong>Nom commercial :</strong> DJAMA</li>
        <li><strong>Entrepreneur :</strong> AMDJAD Nofane</li>
        <li><strong>Forme juridique :</strong> Entrepreneur individuel — Micro-entreprise</li>
        <li><strong>Adresse :</strong> 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte</li>
        <li><strong>SIRET :</strong> 981 189 087 00019</li>
        <li><strong>Email :</strong> <a href="mailto:contact@djama.space">contact@djama.space</a></li>
      </ul>
      <p>
        Toute commande implique l&apos;acceptation sans réserve des présentes CGV.
        DJAMA se réserve le droit de les modifier à tout moment ; les CGV applicables sont celles
        en vigueur au moment de la commande.
      </p>

      {/* ─── 1. Produits et services ─── */}
      <h2>1. Produits et services proposés</h2>
      <p>DJAMA commercialise les offres suivantes :</p>
      <ul>
        <li>
          <strong>DJAMA Pro — abonnement mensuel :</strong> accès à l&apos;ensemble des outils
          professionnels (facturation, CRM, planning, projets, bloc-notes, sourcing IA, etc.) —
          <strong> 11,90 € TTC / mois</strong>, sans engagement, résiliable à tout moment
        </li>
        <li>
          <strong>DJAMA Pro — abonnement annuel :</strong> mêmes outils, facturé annuellement —
          <strong> 9,90 € TTC / mois</strong> (soit 118,80 € TTC / an)
        </li>
        <li>
          <strong>Coaching IA :</strong> formation complète à l&apos;intelligence artificielle —
          <strong> 190 € TTC</strong>, paiement unique, accès 3 mois
        </li>
        <li>
          <strong>Prestations sur devis :</strong> création de site web, application mobile,
          sourcing fournisseurs, réponses aux marchés publics, visuels — tarif selon devis
          accepté préalablement par le client
        </li>
      </ul>
      <p>
        Les caractéristiques essentielles de chaque offre sont présentées sur la page
        correspondante du site avant toute validation de commande.
      </p>

      {/* ─── 2. Prix ─── */}
      <h2>2. Prix</h2>
      <p>
        Tous les prix affichés sur djama.space sont exprimés en <strong>euros (€) TTC</strong>
        (toutes taxes comprises). DJAMA est micro-entrepreneur et, à ce titre, n&apos;est pas assujetti
        à la TVA en vertu de l&apos;article 293 B du Code général des impôts (mention
        «&nbsp;TVA non applicable, art. 293 B du CGI&nbsp;»).
      </p>
      <p>
        DJAMA se réserve le droit de modifier ses tarifs à tout moment. Les prix applicables
        sont ceux affichés au moment de la validation de la commande.
      </p>

      {/* ─── 3. Commande ─── */}
      <h2>3. Processus de commande</h2>
      <p>La commande se déroule en plusieurs étapes :</p>
      <ul>
        <li>Sélection de l&apos;offre sur le site djama.space</li>
        <li>Renseignement des informations de paiement via la plateforme sécurisée Stripe ou PayPal</li>
        <li>Validation de la commande par le client (clic sur le bouton de paiement)</li>
        <li>Confirmation de commande par email envoyé à l&apos;adresse indiquée par le client</li>
        <li>Activation de l&apos;accès au service dans les minutes suivant la confirmation de paiement</li>
      </ul>
      <p>
        Toute commande validée constitue un contrat ferme entre le client et DJAMA.
        DJAMA se réserve le droit de refuser une commande en cas de litige antérieur non résolu
        ou de suspicion de fraude.
      </p>

      {/* ─── 4. Paiement ─── */}
      <h2>4. Modalités de paiement</h2>
      <p>
        Le paiement est effectué en ligne et de manière sécurisée via :
      </p>
      <ul>
        <li><strong>Stripe</strong> — carte bancaire (Visa, Mastercard, American Express), certifié PCI DSS Level 1</li>
        <li><strong>PayPal</strong> — compte PayPal ou carte bancaire via PayPal</li>
      </ul>
      <p>
        Le débit est effectué immédiatement lors de la validation de la commande.
        Pour les abonnements, le renouvellement est automatique à chaque échéance (mensuelle ou annuelle)
        jusqu&apos;à résiliation par le client.
        DJAMA n&apos;a accès à aucune donnée bancaire du client ; ces informations sont traitées
        exclusivement par Stripe et PayPal.
      </p>
      <p>
        En cas d&apos;échec de paiement lors du renouvellement, DJAMA en informera le client par email
        et suspendra l&apos;accès au service jusqu&apos;à régularisation.
      </p>

      {/* ─── 5. Livraison ─── */}
      <h2>5. Livraison — accès aux services numériques</h2>
      <p>
        Les services DJAMA sont des <strong>produits numériques dématérialisés</strong>.
        Aucune livraison physique n&apos;est prévue.
        L&apos;accès au service est activé dans les <strong>minutes suivant la confirmation de paiement</strong>,
        via un email contenant le lien d&apos;accès à l&apos;espace client.
      </p>
      <p>
        En cas de non-réception de l&apos;email de confirmation dans les 30 minutes, le client est
        invité à vérifier ses spams ou à contacter DJAMA à{" "}
        <a href="mailto:contact@djama.space">contact@djama.space</a>.
      </p>

      {/* ─── 6. Droit de rétractation ─── */}
      <h2>6. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L.221-18 du Code de la consommation, le consommateur dispose
        d&apos;un délai de <strong>14 jours</strong> à compter de la souscription pour exercer son droit
        de rétractation, sans avoir à justifier sa décision ni à payer de pénalités.
      </p>
      <p>
        Pour exercer ce droit, le client doit notifier sa décision par email à{" "}
        <a href="mailto:contact@djama.space">contact@djama.space</a> avant l&apos;expiration du délai,
        en indiquant son nom, son adresse email et la référence de sa commande.
        Le remboursement sera effectué dans les <strong>14 jours</strong> suivant la réception
        de la demande, par le même moyen de paiement que celui utilisé lors de la commande.
      </p>
      <p>
        <strong>Exception — services numériques :</strong> conformément à l&apos;article L.221-28
        du Code de la consommation, le droit de rétractation ne peut être exercé pour les
        contenus numériques dont l&apos;exécution a commencé avec l&apos;accord exprès du consommateur
        et après renonciation expresse à son droit de rétractation.
        En validant sa commande et en accédant immédiatement au service, le client reconnaît
        avoir été informé de cette exception et renonce expressément à son droit de rétractation.
      </p>

      {/* ─── 7. Résiliation ─── */}
      <h2>7. Résiliation des abonnements</h2>
      <p>
        Le client peut résilier son abonnement à tout moment, sans frais ni pénalités, depuis
        son espace client ou en contactant DJAMA à{" "}
        <a href="mailto:contact@djama.space">contact@djama.space</a>.
      </p>
      <p>
        La résiliation prend effet à la <strong>fin de la période de facturation en cours</strong>.
        Aucun remboursement prorata temporis n&apos;est effectué pour la période déjà facturée,
        sauf exercice du droit de rétractation dans les conditions de l&apos;article 6.
      </p>
      <p>
        DJAMA peut mettre fin à un abonnement avec un préavis de <strong>30 jours</strong>
        en cas de cessation d&apos;activité ou de modification substantielle du service,
        avec remboursement prorata de la période non consommée.
      </p>

      {/* ─── 8. Garanties légales ─── */}
      <h2>8. Garanties légales</h2>
      <p>
        Le client bénéficie des garanties légales suivantes, sans préjudice de toute
        garantie commerciale éventuellement accordée :
      </p>
      <ul>
        <li>
          <strong>Garantie légale de conformité</strong> (art. L.224-25-12 et suivants du Code
          de la consommation) : DJAMA est tenu de fournir un contenu numérique conforme
          au contrat et répond des défauts de conformité existant lors de la fourniture.
        </li>
        <li>
          <strong>Garantie contre les vices cachés</strong> (art. 1641 et suivants du Code civil) :
          DJAMA répond des vices cachés qui rendraient le service impropre à l&apos;usage auquel
          il est destiné.
        </li>
      </ul>
      <p>
        Pour toute réclamation relative à la conformité du service, le client doit contacter
        DJAMA à <a href="mailto:contact@djama.space">contact@djama.space</a>.
      </p>

      {/* ─── 9. Responsabilité ─── */}
      <h2>9. Limitation de responsabilité</h2>
      <p>
        DJAMA s&apos;engage à fournir ses services avec soin et diligence. Toutefois, DJAMA ne
        saurait être tenu responsable des dommages indirects (perte de revenus, de données,
        d&apos;opportunités commerciales) résultant de l&apos;utilisation ou de l&apos;indisponibilité
        temporaire des services.
      </p>
      <p>
        La responsabilité totale de DJAMA, toutes causes confondues, est limitée au montant
        effectivement payé par le client au cours des <strong>12 derniers mois</strong>
        pour la prestation concernée.
      </p>

      {/* ─── 10. Données personnelles ─── */}
      <h2>10. Données personnelles</h2>
      <p>
        Les données collectées lors de la commande (nom, email, moyen de paiement) sont
        traitées conformément à notre{" "}
        <a href="/legal/confidentialite">Politique de confidentialité</a> et au RGPD.
        Ces données sont nécessaires au traitement de la commande et à la gestion du compte client.
        Elles ne sont jamais revendues à des tiers.
      </p>

      {/* ─── 11. Force majeure ─── */}
      <h2>11. Force majeure</h2>
      <p>
        DJAMA ne pourra être tenu responsable de l&apos;inexécution ou du retard dans l&apos;exécution
        de ses obligations en cas de survenance d&apos;un événement de force majeure au sens de
        l&apos;article 1218 du Code civil (catastrophe naturelle, pandémie, panne d&apos;infrastructure
        tierce, attaque informatique majeure, etc.).
      </p>

      {/* ─── 12. Médiation ─── */}
      <h2>12. Médiation et règlement des litiges</h2>
      <p>
        En cas de litige relatif à une commande, le client peut contacter DJAMA en priorité à{" "}
        <a href="mailto:contact@djama.space">contact@djama.space</a> pour une résolution amiable.
      </p>
      <p>
        À défaut de résolution amiable dans un délai de 30 jours, le consommateur peut
        recourir gratuitement à un médiateur de la consommation conformément aux articles
        L.611-1 et suivants du Code de la consommation.
      </p>
      <p>
        La Commission Européenne met également à disposition une plateforme de règlement en
        ligne des litiges (RLL) :{" "}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>

      {/* ─── 13. Droit applicable ─── */}
      <h2>13. Droit applicable et juridiction</h2>
      <p>
        Les présentes CGV sont soumises au <strong>droit français</strong>.
        En cas de litige non résolu amiablement, les tribunaux du ressort de{" "}
        <strong>Mamoudzou (Mayotte)</strong> seront compétents, sans préjudice des dispositions
        impératives protégeant les consommateurs dans leur pays de résidence.
      </p>

      {/* ─── 14. Contact ─── */}
      <h2>14. Contact</h2>
      <p>
        Pour toute question relative à une commande ou aux présentes CGV :
        <br /><strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
        <br />DJAMA — AMDJAD Nofane, 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte
        <br />Délai de réponse : 48 heures ouvrées maximum.
      </p>
    </LegalPage>
  );
}
