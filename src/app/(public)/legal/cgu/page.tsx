import { LegalPage } from "../_legal-layout";

export const metadata = { title: "CGU — DJAMA" };

export default function CGU() {
  return (
    <LegalPage title="Conditions générales d'utilisation" lastUpdated="21 avril 2026">
      <h2>1. Acceptation des conditions</h2>
      <p>
        En accédant et en utilisant le site DJAMA (<strong>djama.space</strong>), vous acceptez sans réserve
        les présentes Conditions Générales d&apos;Utilisation. Si vous n&apos;acceptez pas ces conditions,
        veuillez ne pas utiliser le site.
      </p>

      <h2>2. Description des services</h2>
      <p>DJAMA propose un ensemble de services à destination des entrepreneurs, freelances et porteurs de projets :</p>
      <ul>
        <li><strong>Espace Client (abonnement mensuel)</strong> — accès à des outils professionnels en ligne : facturation, planning, bloc-notes, gestion de dossiers, suivi de projets</li>
        <li><strong>Recherche de fournisseurs</strong> — accompagnement personnalisé pour identifier et qualifier des fournisseurs adaptés à vos besoins (sur devis)</li>
        <li><strong>Marchés publics</strong> — assistance à la rédaction et au dépôt de réponses aux appels d&apos;offres publics (sur devis)</li>
        <li><strong>Création digitale</strong> — conception de sites web, visuels et contenus professionnels (sur devis)</li>
      </ul>
      <p>
        L&apos;accès à l&apos;Espace Client nécessite la création d&apos;un compte et la souscription d&apos;un abonnement mensuel.
        Les prestations d&apos;accompagnement font l&apos;objet d&apos;un devis distinct.
      </p>

      <h2>3. Inscription et compte utilisateur</h2>
      <p>
        Pour accéder aux outils professionnels de l&apos;Espace Client, vous devez créer un compte avec une adresse email valide.
        Vous êtes responsable de la confidentialité de vos identifiants de connexion.
        Toute utilisation frauduleuse de votre compte doit être signalée immédiatement à{" "}
        <a href="mailto:contact@djama.space">contact@djama.space</a>.
      </p>

      <h2>4. Tarification et paiement</h2>
      <p>
        L&apos;abonnement à l&apos;Espace Client est facturé <strong>11,90 € par mois</strong> (TTC). Le paiement est
        traité de manière sécurisée via <strong>Stripe</strong> (certifié PCI DSS Level 1).
        Tout abonnement est renouvelé automatiquement chaque mois jusqu&apos;à résiliation de votre part.
      </p>
      <p>
        Les prestations d&apos;accompagnement (recherche fournisseurs, marchés publics, création digitale) sont
        facturées selon devis accepté préalablement par le client.
      </p>

      <h2>5. Résiliation</h2>
      <p>
        Vous pouvez résilier votre abonnement mensuel à tout moment depuis votre espace client.
        La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement
        prorata ne sera effectué pour la période déjà facturée.
      </p>

      <h2>6. Propriété intellectuelle</h2>
      <p>
        Tout le contenu produit par DJAMA dans le cadre de ses prestations reste la propriété de
        DJAMA jusqu&apos;au règlement intégral de la prestation. Après paiement complet,
        les droits d&apos;utilisation sont cédés au client selon les termes convenus dans le devis ou
        le contrat de prestation.
      </p>
      <p>
        Les outils et fonctionnalités de l&apos;Espace Client demeurent la propriété exclusive de DJAMA.
        Le client bénéficie d&apos;un droit d&apos;utilisation non exclusif et non cessible pendant la durée de son abonnement.
      </p>

      <h2>7. Données personnelles</h2>
      <p>
        Le traitement de vos données personnelles est encadré par notre{" "}
        <a href="/legal/confidentialite">Politique de confidentialité</a>. En utilisant nos services,
        vous acceptez les conditions de traitement décrites dans ce document.
      </p>

      <h2>8. Limitation de responsabilité</h2>
      <p>
        DJAMA ne saurait être tenu responsable des dommages indirects résultant de l&apos;utilisation
        de ses services, notamment les pertes de revenus, de données ou d&apos;opportunités commerciales.
        La responsabilité de DJAMA est limitée au montant effectivement payé par le client
        pour la prestation concernée au cours des 12 derniers mois.
      </p>

      <h2>9. Droit applicable</h2>
      <p>
        Les présentes CGU sont soumises au droit français. Tout litige sera porté devant les
        tribunaux compétents du ressort du siège social de DJAMA, après tentative de résolution amiable.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question relative aux présentes CGU :{" "}
        <strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
      </p>
    </LegalPage>
  );
}
