import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Politique de cookies — DJAMA" };

export default function Cookies() {
  return (
    <LegalPage title="Politique de cookies" lastUpdated="21 avril 2026">
      <h2>Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone, tablette)
        lors de la visite d&apos;un site web. Il permet de mémoriser des informations sur votre navigation
        et peut être utilisé pour faciliter votre utilisation du site ou à des fins d&apos;analyse.
      </p>

      <h2>Cookies strictement nécessaires</h2>
      <p>
        Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.
        Ils sont activés automatiquement en réponse à des actions que vous effectuez (connexion,
        remplissage de formulaire, navigation sécurisée, etc.). Sans ces cookies, certains services
        ne peuvent pas fonctionner.
      </p>
      <ul>
        <li><strong>Session d&apos;authentification</strong> — mémorise votre connexion à l&apos;Espace Client (token JWT)</li>
        <li><strong>Préférence de langue</strong> — mémorise la langue sélectionnée (FR/EN)</li>
        <li><strong>Jeton CSRF</strong> — protège les formulaires contre les attaques de type Cross-Site Request Forgery</li>
      </ul>

      <h2>Cookies de performance (analytiques)</h2>
      <p>
        Ces cookies nous permettent de mesurer l&apos;audience du site et d&apos;améliorer son contenu
        et ses performances. Les données collectées sont anonymisées et agrégées : elles ne permettent
        pas de vous identifier personnellement.
      </p>
      <ul>
        <li><strong>Pages visitées</strong> — pour identifier les contenus les plus consultés</li>
        <li><strong>Durée de session</strong> — pour améliorer l&apos;expérience utilisateur</li>
        <li><strong>Provenance du trafic</strong> — pour comprendre comment les visiteurs découvrent DJAMA</li>
      </ul>

      <h2>Cookies tiers</h2>
      <p>
        Notre partenaire de paiement <strong>Stripe</strong> peut déposer des cookies nécessaires
        au traitement sécurisé des paiements lors de votre abonnement. Ces cookies sont soumis
        à la politique de confidentialité de Stripe et ne sont activés que lors des processus
        de paiement.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les cookies de session expirent à la fermeture de votre navigateur. Les cookies persistants
        (préférences, analytiques) ont une durée maximale de 13 mois conformément aux recommandations
        de la CNIL.
      </p>

      <h2>Gestion des cookies</h2>
      <p>
        Vous pouvez à tout moment modifier vos préférences de cookies depuis les paramètres
        de votre navigateur. Voici comment procéder sur les principaux navigateurs :
      </p>
      <ul>
        <li><strong>Chrome</strong> — Paramètres › Confidentialité et sécurité › Cookies</li>
        <li><strong>Firefox</strong> — Paramètres › Vie privée et sécurité › Cookies</li>
        <li><strong>Safari</strong> — Préférences › Confidentialité › Cookies</li>
        <li><strong>Edge</strong> — Paramètres › Confidentialité, recherche et services › Cookies</li>
      </ul>
      <p>
        Notez que la désactivation des cookies strictement nécessaires peut affecter
        le fonctionnement du site, notamment l&apos;accès à l&apos;Espace Client.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question sur notre politique de cookies ou pour exercer vos droits :{" "}
        <strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
      </p>
    </LegalPage>
  );
}
