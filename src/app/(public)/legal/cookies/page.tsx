import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Politique de cookies — DJAMA" };

export default function Cookies() {
  return (
    <LegalPage title="Politique de cookies" lastUpdated="30 juin 2026">

      {/* ─── Préambule ─── */}
      <h2>Préambule</h2>
      <p>
        La présente politique de cookies est publiée par <strong>DJAMA</strong> (AMDJAD Nofane,
        entrepreneur individuel, SIRET 981 189 087 00019, 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte)
        et s&apos;applique au site <strong>djama.space</strong>.
        Elle a pour objet de vous informer sur l&apos;utilisation des cookies et traceurs déposés lors
        de votre navigation, conformément aux recommandations de la CNIL et au RGPD.
      </p>

      {/* ─── 1. Définition ─── */}
      <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone, tablette)
        lors de la visite d&apos;un site web. Il est stocké par votre navigateur et permet de mémoriser
        des informations sur votre navigation. Les cookies peuvent être déposés par le site visité
        (cookies propriétaires) ou par des services tiers intégrés au site (cookies tiers).
      </p>
      <p>
        Les cookies ne contiennent aucune information permettant de vous identifier directement.
        Certains sont indispensables au fonctionnement du site, d&apos;autres servent à améliorer
        votre expérience ou à analyser l&apos;audience de façon anonyme.
      </p>

      {/* ─── 2. Cookies nécessaires ─── */}
      <h2>2. Cookies strictement nécessaires</h2>
      <p>
        Ces cookies sont indispensables au fonctionnement du site et à la fourniture des services.
        Ils ne peuvent pas être désactivés. Aucun consentement n&apos;est requis pour leur dépôt
        (art. 82 de la loi Informatique et Libertés — exemption CNIL).
      </p>
      <ul>
        <li><strong>Session d&apos;authentification :</strong> mémorise votre connexion à l&apos;Espace Client (token JWT Supabase) — durée : session ou 7 jours si "rester connecté"</li>
        <li><strong>Préférence de langue :</strong> mémorise la langue sélectionnée (FR/EN) — durée : 1 an</li>
        <li><strong>Jeton CSRF :</strong> protège les formulaires contre les attaques Cross-Site Request Forgery — durée : session</li>
        <li><strong>Consentement cookies :</strong> mémorise vos choix en matière de cookies pour éviter de vous redemander à chaque visite — durée : 6 mois</li>
      </ul>

      {/* ─── 3. Cookies analytiques ─── */}
      <h2>3. Cookies de performance (analytiques)</h2>
      <p>
        Ces cookies nous permettent de mesurer l&apos;audience du site et d&apos;améliorer son contenu
        et ses performances. <strong>Toutes les données collectées sont anonymisées et agrégées :</strong>{" "}
        elles ne permettent pas de vous identifier personnellement.
        Votre consentement est requis pour leur dépôt.
      </p>
      <ul>
        <li><strong>Pages visitées :</strong> identifier les contenus les plus consultés et améliorer la navigation</li>
        <li><strong>Durée de session :</strong> comprendre comment les visiteurs utilisent le site</li>
        <li><strong>Provenance du trafic :</strong> savoir comment les visiteurs découvrent djama.space (recherche naturelle, réseaux sociaux, liens directs)</li>
        <li><strong>Taux de rebond :</strong> identifier les pages à améliorer</li>
      </ul>
      <p>
        Ces données sont conservées sous forme anonymisée pendant <strong>13 mois maximum</strong>,
        conformément aux recommandations de la CNIL.
      </p>

      {/* ─── 4. Cookies tiers ─── */}
      <h2>4. Cookies tiers</h2>
      <p>
        Certains de nos partenaires peuvent déposer des cookies lors de votre utilisation des services.
        Ces cookies sont soumis à leurs propres politiques de confidentialité :
      </p>
      <ul>
        <li>
          <strong>Stripe :</strong> notre partenaire de paiement dépose des cookies techniques nécessaires
          au traitement sécurisé des transactions lors de votre abonnement. Ces cookies sont activés
          uniquement lors des processus de paiement. Politique Stripe :{" "}
          <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer">stripe.com/fr/privacy</a>
        </li>
        <li>
          <strong>Supabase :</strong> notre infrastructure de base de données peut utiliser des cookies
          techniques liés à la gestion des sessions. Politique Supabase :{" "}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>
        </li>
      </ul>
      <p>
        <strong>DJAMA n&apos;utilise aucun cookie publicitaire, de ciblage ou de suivi comportemental.</strong>{" "}
        Aucun cookie n&apos;est déposé à des fins de publicité personnalisée ou de revente de données.
      </p>

      {/* ─── 5. Durées de conservation ─── */}
      <h2>5. Durées de conservation</h2>
      <ul>
        <li><strong>Cookies de session :</strong> supprimés automatiquement à la fermeture du navigateur</li>
        <li><strong>Cookies persistants (préférences) :</strong> durée maximale de <strong>13 mois</strong> conformément aux recommandations CNIL</li>
        <li><strong>Cookies analytiques :</strong> durée maximale de <strong>13 mois</strong></li>
        <li><strong>Cookies de consentement :</strong> <strong>6 mois</strong> — passé ce délai, votre consentement est de nouveau sollicité</li>
      </ul>

      {/* ─── 6. Gestion et consentement ─── */}
      <h2>6. Gestion de vos préférences</h2>
      <p>
        Conformément aux recommandations de la CNIL, seuls les cookies strictement nécessaires
        sont déposés sans consentement préalable. Pour les cookies analytiques, votre accord est
        recueilli lors de votre première visite et mémorisé pendant 6 mois.
      </p>
      <p>
        Vous pouvez modifier vos préférences à tout moment :
      </p>
      <ul>
        <li><strong>Via les paramètres de votre navigateur :</strong> vous pouvez bloquer, supprimer ou autoriser les cookies à tout moment. Notez que la désactivation des cookies nécessaires peut empêcher l&apos;accès à l&apos;Espace Client.</li>
        <li><strong>Chrome :</strong> Paramètres › Confidentialité et sécurité › Cookies et autres données de sites</li>
        <li><strong>Firefox :</strong> Paramètres › Vie privée et sécurité › Cookies et données de sites</li>
        <li><strong>Safari :</strong> Préférences › Confidentialité › Cookies et données de sites web</li>
        <li><strong>Edge :</strong> Paramètres › Confidentialité, recherche et services › Cookies</li>
        <li><strong>Opera :</strong> Paramètres › Avancé › Confidentialité et sécurité › Cookies</li>
      </ul>
      <p>
        Pour en savoir plus sur la gestion des cookies et vos droits :{" "}
        <a href="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser" target="_blank" rel="noopener noreferrer">
          cnil.fr — Cookies : les outils pour les maîtriser
        </a>.
      </p>

      {/* ─── 7. Droits ─── */}
      <h2>7. Vos droits</h2>
      <p>
        Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès,
        de rectification, d&apos;opposition et d&apos;effacement sur vos données collectées via les cookies.
        Pour exercer ces droits ou pour toute question relative à notre politique de cookies :
      </p>
      <p>
        <strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
        <br />DJAMA — AMDJAD Nofane, 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte
        <br />Vous pouvez également introduire une réclamation auprès de la{" "}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
      </p>

      {/* ─── 8. Modifications ─── */}
      <h2>8. Modifications</h2>
      <p>
        DJAMA se réserve le droit de modifier la présente politique de cookies pour s&apos;adapter
        aux évolutions légales ou techniques. La date de dernière mise à jour est affichée en haut
        de cette page. En cas de modification substantielle, un nouveau recueil de consentement
        sera effectué.
      </p>
    </LegalPage>
  );
}
