import { LegalPage } from "../_legal-layout";

export const metadata = { title: "CGU — DJAMA" };

export default function CGU() {
  return (
    <LegalPage title="Conditions générales d'utilisation" lastUpdated="1er janvier 2026">
      <h2>1. Acceptation des conditions</h2>
      <p>
        En accédant et en utilisant le site DJAMA, vous acceptez sans réserve les présentes
        Conditions Générales d&apos;Utilisation. Si vous n&apos;acceptez pas ces conditions,
        veuillez ne pas utiliser le site.
      </p>

      <h2>2. Description des services</h2>
      <p>
        DJAMA propose des services de création digitale, d&apos;outils professionnels (facturation,
        planning, bloc-notes), d&apos;accompagnement administratif et de coaching. L&apos;accès à
        certains services nécessite la création d&apos;un compte et/ou la souscription d&apos;un abonnement.
      </p>

      <h2>3. Inscription et compte utilisateur</h2>
      <p>
        Pour accéder aux outils professionnels, vous devez créer un compte avec une adresse email valide.
        Vous êtes responsable de la confidentialité de vos identifiants de connexion.
        Toute utilisation frauduleuse de votre compte doit être signalée immédiatement à contact@djama.fr.
      </p>

      <h2>4. Tarification et paiement</h2>
      <p>
        L&apos;abonnement aux outils professionnels est facturé 11,99€ par mois. Le paiement est
        traité de manière sécurisée via Stripe. Tout abonnement est renouvelé automatiquement
        jusqu&apos;à résiliation de votre part.
      </p>

      <h2>5. Résiliation</h2>
      <p>
        Vous pouvez résilier votre abonnement à tout moment depuis votre espace client.
        La résiliation prend effet à la fin de la période de facturation en cours.
      </p>

      <h2>6. Propriété intellectuelle</h2>
      <p>
        Tout le contenu produit par DJAMA dans le cadre de ses prestations reste la propriété de
        DJAMA jusqu&apos;au règlement intégral de la prestation. Après paiement complet,
        les droits d&apos;utilisation sont cédés au client selon les termes convenus.
      </p>

      <h2>7. Limitation de responsabilité</h2>
      <p>
        DJAMA ne saurait être tenu responsable des dommages indirects résultant de l&apos;utilisation
        de ses services. La responsabilité de DJAMA est limitée au montant effectivement payé
        par le client pour la prestation concernée.
      </p>

      <h2>8. Droit applicable</h2>
      <p>
        Les présentes CGU sont soumises au droit français. Tout litige sera porté devant les
        tribunaux compétents du ressort du siège social de DJAMA.
      </p>

      <h2>Contact</h2>
      <p>contact@djama.fr</p>
    </LegalPage>
  );
}
