import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Conditions générales d'utilisation — DJAMA" };

export default function CGU() {
  return (
    <LegalPage title="Conditions générales d'utilisation" lastUpdated="30 juin 2026">

      {/* ─── Préambule ─── */}
      <h2>Préambule</h2>
      <p>
        Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation
        du site <strong>djama.space</strong> et de l&apos;ensemble des services proposés par DJAMA.
        Elles sont conclues entre :
      </p>
      <ul>
        <li><strong>DJAMA</strong> — AMDJAD Nofane, entrepreneur individuel (micro-entreprise), SIRET 981 189 087 00019, 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte — ci-après «&nbsp;DJAMA&nbsp;»</li>
        <li>Toute personne physique ou morale accédant au site ou souscrivant à un service — ci-après «&nbsp;l&apos;Utilisateur&nbsp;»</li>
      </ul>
      <p>
        En accédant au site ou en utilisant les services, l&apos;Utilisateur accepte sans réserve les présentes
        CGU. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser le site ni les services DJAMA.
      </p>

      {/* ─── 1. Services ─── */}
      <h2>1. Description des services</h2>
      <p>DJAMA propose les services suivants :</p>
      <ul>
        <li><strong>DJAMA Pro (abonnement) :</strong> accès à 20+ outils professionnels en ligne — facturation, CRM, planning, bloc-notes, gestion de dossiers, suivi de projets, portail client, et plus encore — pour 11,90 €/mois (mensuel) ou 9,90 €/mois facturé annuellement</li>
        <li><strong>Recherche de fournisseurs :</strong> accompagnement personnalisé pour identifier, qualifier et mettre en relation avec des fournisseurs nationaux ou internationaux (sur devis)</li>
        <li><strong>Marchés publics :</strong> assistance à la rédaction et au dépôt de réponses aux appels d&apos;offres publics (sur devis)</li>
        <li><strong>Création digitale :</strong> conception de sites web, applications mobiles, visuels et contenus professionnels (sur devis)</li>
        <li><strong>Coaching IA :</strong> formation à l&apos;utilisation des outils d&apos;intelligence artificielle (ChatGPT, Claude, etc.) — 190 € en accès unique</li>
        <li><strong>Ressources & blog :</strong> accès gratuit à des articles, guides et ressources pour entrepreneurs</li>
      </ul>

      {/* ─── 2. Inscription ─── */}
      <h2>2. Inscription et compte utilisateur</h2>
      <p>
        L&apos;accès aux outils de l&apos;Espace Client requiert la création d&apos;un compte avec une adresse
        email valide et un mot de passe sécurisé. L&apos;Utilisateur s&apos;engage à :
      </p>
      <ul>
        <li>Fournir des informations exactes, complètes et à jour lors de l&apos;inscription</li>
        <li>Maintenir la confidentialité de ses identifiants de connexion</li>
        <li>Ne pas partager son compte avec des tiers</li>
        <li>Notifier immédiatement DJAMA de toute utilisation non autorisée de son compte à <a href="mailto:contact@djama.space">contact@djama.space</a></li>
      </ul>
      <p>
        DJAMA se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes
        CGU, d&apos;usage frauduleux ou de comportement contraire à la loi.
      </p>

      {/* ─── 3. Tarification ─── */}
      <h2>3. Tarification et paiement</h2>
      <p>
        Les tarifs en vigueur sont affichés sur le site au moment de la souscription. Le paiement est
        traité de manière sécurisée via <strong>Stripe</strong> (certifié PCI DSS Level 1).
        Tous les prix sont indiqués en euros (€), toutes taxes comprises (TTC).
      </p>
      <ul>
        <li><strong>Abonnement mensuel DJAMA Pro :</strong> 11,90 € TTC / mois — renouvelé automatiquement chaque mois</li>
        <li><strong>Abonnement annuel DJAMA Pro :</strong> 9,90 € TTC / mois facturé en une fois annuellement (soit 118,80 €/an)</li>
        <li><strong>Coaching IA :</strong> 190 € TTC — paiement unique, accès à vie</li>
        <li><strong>Prestations sur devis :</strong> sourcing, marchés publics, création digitale — selon devis accepté préalablement</li>
      </ul>
      <p>
        En cas de non-paiement, DJAMA se réserve le droit de suspendre l&apos;accès aux services
        jusqu&apos;à régularisation de la situation.
      </p>

      {/* ─── 4. Rétractation ─── */}
      <h2>4. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L.221-18 du Code de la consommation, le consommateur dispose d&apos;un
        délai de <strong>14 jours</strong> à compter de la souscription pour exercer son droit de rétractation,
        sans avoir à justifier sa décision.
      </p>
      <p>
        Pour exercer ce droit, l&apos;Utilisateur doit notifier sa décision par email à{" "}
        <a href="mailto:contact@djama.space">contact@djama.space</a> avant l&apos;expiration du délai.
        Le remboursement sera effectué dans un délai de 14 jours suivant la réception de la demande.
      </p>
      <p>
        <strong>Exception :</strong> en cas d&apos;accès immédiat aux services numériques avec consentement
        exprès de l&apos;Utilisateur et renonciation au droit de rétractation, ce droit ne s&apos;applique plus
        une fois le service commencé (art. L.221-28 du Code de la consommation).
      </p>

      {/* ─── 5. Résiliation ─── */}
      <h2>5. Résiliation de l&apos;abonnement</h2>
      <p>
        L&apos;Utilisateur peut résilier son abonnement à tout moment depuis son espace client ou en
        contactant DJAMA à <a href="mailto:contact@djama.space">contact@djama.space</a>.
        La résiliation prend effet à la fin de la période de facturation en cours.
        Aucun remboursement prorata temporis ne sera effectué pour la période déjà facturée,
        sauf en cas d&apos;exercice du droit de rétractation dans les conditions prévues à l&apos;article 4.
      </p>
      <p>
        DJAMA peut résilier un abonnement avec préavis de 30 jours en cas de cessation du service ou
        de modification substantielle de l&apos;offre, avec remboursement prorata de la période non consommée.
      </p>

      {/* ─── 6. Obligations utilisateur ─── */}
      <h2>6. Obligations et responsabilités de l&apos;Utilisateur</h2>
      <p>L&apos;Utilisateur s&apos;engage à utiliser les services DJAMA dans le respect des lois en vigueur et s&apos;interdit notamment de :</p>
      <ul>
        <li>Utiliser les services à des fins illicites, frauduleuses ou contraires à l&apos;ordre public</li>
        <li>Tenter de pirater, contourner ou perturber les systèmes informatiques de DJAMA</li>
        <li>Stocker, partager ou transmettre des contenus illégaux, diffamatoires ou portant atteinte aux droits de tiers</li>
        <li>Revendre, céder ou sous-licencier l&apos;accès aux outils DJAMA à des tiers sans autorisation écrite</li>
        <li>Utiliser des robots, scripts ou outils automatisés pour accéder abusivement aux services</li>
        <li>Porter atteinte à l&apos;image ou à la réputation de DJAMA</li>
      </ul>
      <p>
        L&apos;Utilisateur est seul responsable des données, contenus et informations qu&apos;il enregistre
        et gère via les outils DJAMA. DJAMA ne saurait être tenu responsable des contenus produits par
        les Utilisateurs.
      </p>

      {/* ─── 7. Propriété intellectuelle ─── */}
      <h2>7. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments constituant les services DJAMA — code source, design, interfaces,
        textes, logos, marques, fonctionnalités — est la propriété exclusive de DJAMA et est protégé
        par les lois relatives à la propriété intellectuelle.
      </p>
      <p>
        DJAMA accorde à l&apos;Utilisateur un droit d&apos;utilisation <strong>personnel, non exclusif, non cessible
        et non transférable</strong> aux outils et services, pour la durée de l&apos;abonnement actif.
        Ce droit ne constitue en aucun cas une cession de propriété intellectuelle.
      </p>
      <p>
        Les contenus créés par l&apos;Utilisateur via les outils DJAMA (factures, notes, documents) restent
        sa propriété exclusive. DJAMA ne revendique aucun droit sur ces contenus.
      </p>

      {/* ─── 8. Données personnelles ─── */}
      <h2>8. Données personnelles</h2>
      <p>
        Le traitement de vos données personnelles est encadré par notre{" "}
        <a href="/legal/confidentialite">Politique de confidentialité</a> conforme au RGPD.
        En utilisant les services DJAMA, l&apos;Utilisateur accepte les conditions de traitement décrites
        dans ce document.
      </p>

      {/* ─── 9. Disponibilité ─── */}
      <h2>9. Disponibilité des services</h2>
      <p>
        DJAMA s&apos;efforce d&apos;assurer la disponibilité des services 24h/24 et 7j/7, mais ne peut garantir
        une disponibilité ininterrompue. Des interruptions peuvent survenir pour maintenance, mise à jour,
        incident technique ou cas de force majeure.
      </p>
      <p>
        DJAMA s&apos;engage à informer les Utilisateurs des maintenances planifiées avec un préavis raisonnable.
        En cas d&apos;interruption prolongée et non planifiée dépassant 72 heures consécutives, une compensation
        sous forme de prolongation d&apos;abonnement pourra être accordée.
      </p>

      {/* ─── 10. Limitation de responsabilité ─── */}
      <h2>10. Limitation de responsabilité</h2>
      <p>
        DJAMA met en œuvre tous les moyens raisonnables pour assurer la qualité et la fiabilité de ses
        services. Toutefois, DJAMA ne saurait être tenu responsable :
      </p>
      <ul>
        <li>Des dommages indirects (perte de revenus, de données, d&apos;opportunités commerciales) résultant de l&apos;utilisation ou de l&apos;indisponibilité des services</li>
        <li>Des erreurs ou omissions dans les informations fournies par l&apos;Utilisateur</li>
        <li>Des dommages causés par des tiers (attaques informatiques, force majeure)</li>
        <li>De l&apos;utilisation des services par l&apos;Utilisateur en violation des présentes CGU ou des lois en vigueur</li>
      </ul>
      <p>
        La responsabilité totale de DJAMA, toutes causes confondues, est limitée au montant
        effectivement payé par l&apos;Utilisateur au cours des <strong>12 derniers mois</strong> pour
        la prestation concernée.
      </p>

      {/* ─── 11. Modifications ─── */}
      <h2>11. Modifications des CGU et des tarifs</h2>
      <p>
        DJAMA se réserve le droit de modifier les présentes CGU et ses tarifs à tout moment.
        Les Utilisateurs seront informés de toute modification substantielle par email ou via une
        notification dans leur espace client, avec un préavis minimum de <strong>30 jours</strong>.
        La poursuite de l&apos;utilisation des services après ce délai vaut acceptation des nouvelles CGU.
        En cas de désaccord, l&apos;Utilisateur peut résilier son abonnement sans pénalité avant l&apos;entrée
        en vigueur des modifications.
      </p>

      {/* ─── 12. Médiation ─── */}
      <h2>12. Médiation et règlement des litiges</h2>
      <p>
        En cas de litige relatif aux présentes CGU, l&apos;Utilisateur et DJAMA s&apos;engagent à rechercher
        une solution amiable dans un délai de 30 jours. En l&apos;absence de résolution amiable,
        le consommateur peut recourir gratuitement à un médiateur de la consommation.
      </p>
      <p>
        La plateforme européenne de règlement en ligne des litiges (RLL) est accessible à :{" "}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>

      {/* ─── 13. Droit applicable ─── */}
      <h2>13. Droit applicable et juridiction</h2>
      <p>
        Les présentes CGU sont soumises au droit français. En cas de litige non résolu par voie amiable
        ou de médiation, les tribunaux compétents du ressort de <strong>Mamoudzou (Mayotte)</strong> seront
        seuls compétents, sans préjudice des dispositions impératives applicables aux consommateurs.
      </p>

      {/* ─── 14. Contact ─── */}
      <h2>14. Contact</h2>
      <p>
        Pour toute question relative aux présentes CGU :
        <br /><strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
        <br />DJAMA — AMDJAD Nofane, 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte
        <br />Délai de réponse : 48 heures ouvrées maximum.
      </p>
    </LegalPage>
  );
}
