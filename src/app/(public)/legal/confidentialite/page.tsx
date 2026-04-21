import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Politique de confidentialité — DJAMA" };

export default function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité" lastUpdated="21 avril 2026">
      <h2>1. Responsable du traitement</h2>
      <p>
        <strong>DJAMA</strong> est responsable du traitement de vos données personnelles au sens du
        Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679).
        <br />Contact : <a href="mailto:contact@djama.space">contact@djama.space</a>
      </p>

      <h2>2. Données collectées</h2>
      <p>Dans le cadre de l&apos;utilisation de nos services, nous collectons les catégories de données suivantes :</p>
      <ul>
        <li><strong>Données d&apos;identification</strong> — nom, prénom, adresse email, numéro de téléphone (si fourni)</li>
        <li><strong>Données de connexion</strong> — adresse IP, logs de connexion, identifiants de session</li>
        <li><strong>Données de facturation</strong> — traitées via Stripe ; nous ne stockons jamais vos données bancaires en propre</li>
        <li><strong>Contenu de vos outils</strong> — factures, notes, événements, dossiers créés dans l&apos;Espace Client</li>
        <li><strong>Données de navigation</strong> — pages visitées, durée de session (données anonymisées via cookies analytiques)</li>
        <li><strong>Données de correspondance</strong> — messages envoyés via le formulaire de contact ou par email</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont utilisées pour les finalités suivantes :</p>
      <ul>
        <li>Créer et gérer votre compte utilisateur</li>
        <li>Vous fournir l&apos;accès aux outils de l&apos;Espace Client</li>
        <li>Gérer votre abonnement et les paiements associés</li>
        <li>Vous contacter dans le cadre d&apos;une prestation d&apos;accompagnement</li>
        <li>Vous envoyer des communications techniques relatives à votre compte (mises à jour, incidents)</li>
        <li>Améliorer nos services et analyser l&apos;audience du site (données anonymisées)</li>
        <li>Respecter nos obligations légales et comptables</li>
      </ul>

      <h2>4. Base légale</h2>
      <p>Selon les finalités, le traitement est fondé sur :</p>
      <ul>
        <li><strong>Exécution du contrat</strong> — pour la fourniture des services souscrits</li>
        <li><strong>Intérêt légitime</strong> — pour l&apos;amélioration de nos services et la sécurité</li>
        <li><strong>Consentement</strong> — pour les communications marketing et les cookies non essentiels</li>
        <li><strong>Obligation légale</strong> — pour la conservation des données comptables et fiscales</li>
      </ul>

      <h2>5. Destinataires des données</h2>
      <p>Vos données peuvent être partagées avec :</p>
      <ul>
        <li><strong>Supabase</strong> — hébergement et base de données (serveurs en Europe)</li>
        <li><strong>Stripe</strong> — traitement sécurisé des paiements</li>
        <li><strong>Vercel</strong> — hébergement de l&apos;application web</li>
      </ul>
      <p>
        Nous ne vendons jamais vos données personnelles à des tiers à des fins commerciales.
      </p>

      <h2>6. Durée de conservation</h2>
      <p>
        Vos données sont conservées pendant la durée de votre abonnement ou de votre relation avec DJAMA,
        puis pendant <strong>3 ans</strong> après la résiliation pour les obligations légales et contractuelles.
        Les données comptables sont conservées <strong>10 ans</strong> conformément aux obligations fiscales françaises.
      </p>

      <h2>7. Vos droits (RGPD)</h2>
      <p>
        Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
      </p>
      <ul>
        <li><strong>Droit d&apos;accès</strong> — obtenir une copie des données que nous détenons sur vous</li>
        <li><strong>Droit de rectification</strong> — corriger des données inexactes ou incomplètes</li>
        <li><strong>Droit à l&apos;effacement</strong> — demander la suppression de vos données (sous réserve des obligations légales)</li>
        <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré et lisible par machine</li>
        <li><strong>Droit à la limitation</strong> — demander la suspension temporaire du traitement</li>
        <li><strong>Droit d&apos;opposition</strong> — vous opposer au traitement fondé sur l&apos;intérêt légitime</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à{" "}
        <strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>.
        Nous traiterons votre demande dans un délai maximum d&apos;un mois.
        Vous avez également le droit d&apos;introduire une réclamation auprès de la <strong>CNIL</strong> (cnil.fr).
      </p>

      <h2>8. Sécurité des données</h2>
      <p>
        Vos données sont stockées de manière sécurisée sur les serveurs de Supabase hébergés en Europe.
        Nous appliquons des mesures techniques et organisationnelles appropriées : chiffrement TLS 1.3,
        authentification JWT, Row Level Security, sauvegardes automatiques.
        Pour en savoir plus, consultez notre <a href="/legal/securite">page Sécurité</a>.
      </p>

      <h2>9. Transferts hors UE</h2>
      <p>
        Certains de nos prestataires (Vercel, Stripe) sont établis aux États-Unis. Ces transferts
        sont encadrés par des garanties appropriées (clauses contractuelles types de la Commission européenne
        ou mécanismes équivalents conformes au RGPD).
      </p>

      <h2>10. Cookies</h2>
      <p>
        Pour en savoir plus sur notre utilisation des cookies, consultez notre{" "}
        <a href="/legal/cookies">politique de cookies</a>.
      </p>
    </LegalPage>
  );
}
