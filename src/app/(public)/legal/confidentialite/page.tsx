import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Politique de confidentialité — DJAMA" };

export default function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité" lastUpdated="1er janvier 2026">
      <h2>1. Responsable du traitement</h2>
      <p>
        DJAMA est responsable du traitement de vos données personnelles.
        Contact : contact@djama.fr
      </p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons les données suivantes :</p>
      <ul>
        <li>Données d&apos;identification (nom, prénom, adresse email)</li>
        <li>Données de connexion (adresse IP, logs de connexion)</li>
        <li>Données de facturation (via Stripe — nous ne stockons pas vos données bancaires)</li>
        <li>Contenu que vous créez dans nos outils (factures, notes, événements)</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont utilisées pour :</p>
      <ul>
        <li>Gérer votre compte et votre abonnement</li>
        <li>Vous fournir nos services</li>
        <li>Vous envoyer des communications relatives à votre compte</li>
        <li>Améliorer nos services</li>
      </ul>

      <h2>4. Base légale</h2>
      <p>
        Le traitement de vos données est fondé sur l&apos;exécution du contrat (utilisation de
        nos services) et votre consentement pour les communications marketing.
      </p>

      <h2>5. Durée de conservation</h2>
      <p>
        Vos données sont conservées pendant la durée de votre abonnement, puis pendant
        3 ans après la résiliation pour les obligations légales.
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits suivants : accès, rectification,
        suppression, portabilité, limitation et opposition. Pour exercer ces droits,
        contactez-nous à <strong>contact@djama.fr</strong>.
      </p>

      <h2>7. Sécurité</h2>
      <p>
        Vos données sont stockées de manière sécurisée sur les serveurs de Supabase
        (hébergés en Europe). Nous appliquons des mesures techniques et organisationnelles
        appropriées pour protéger vos données.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Pour en savoir plus sur notre utilisation des cookies, consultez notre{" "}
        <a href="/legal/cookies" className="text-[#c9a55a] underline underline-offset-2">
          politique de cookies
        </a>.
      </p>
    </LegalPage>
  );
}
