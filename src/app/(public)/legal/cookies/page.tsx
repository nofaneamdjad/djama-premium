import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Politique de cookies — DJAMA" };

export default function Cookies() {
  return (
    <LegalPage title="Politique de cookies" lastUpdated="1er janvier 2026">
      <h2>Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite
        d&apos;un site web. Il permet de mémoriser des informations sur votre navigation.
      </p>

      <h2>Cookies utilisés par DJAMA</h2>

      <h2>Cookies strictement nécessaires</h2>
      <p>
        Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.
        Ils sont généralement activés en réponse à des actions que vous effectuez (connexion,
        remplissage de formulaire, etc.).
      </p>
      <ul>
        <li><strong>Session d&apos;authentification</strong> — mémorise votre connexion à l&apos;espace client</li>
        <li><strong>Préférence de langue</strong> — mémorise la langue sélectionnée (FR/EN)</li>
      </ul>

      <h2>Cookies de performance (analytiques)</h2>
      <p>
        Ces cookies nous permettent de mesurer l&apos;audience du site et d&apos;améliorer son contenu.
        Les données collectées sont anonymisées.
      </p>

      <h2>Cookies tiers</h2>
      <p>
        Notre partenaire de paiement <strong>Stripe</strong> peut déposer des cookies nécessaires
        au traitement sécurisé des paiements. Ces cookies sont soumis à la politique de
        confidentialité de Stripe.
      </p>

      <h2>Gestion des cookies</h2>
      <p>
        Vous pouvez à tout moment modifier vos préférences de cookies depuis les paramètres
        de votre navigateur. Notez que la désactivation de certains cookies peut affecter
        le fonctionnement du site.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question sur notre politique de cookies : <strong>contact@djama.fr</strong>
      </p>
    </LegalPage>
  );
}
