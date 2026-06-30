import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Politique de confidentialité — DJAMA" };

export default function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité" lastUpdated="30 juin 2026">

      {/* ─── 1. Responsable ─── */}
      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données personnelles collectées via le site{" "}
        <strong>djama.space</strong> est :
      </p>
      <ul>
        <li><strong>Identité :</strong> AMDJAD Nofane — Entrepreneur individuel (Micro-entreprise)</li>
        <li><strong>Nom commercial :</strong> DJAMA</li>
        <li><strong>SIRET :</strong> 981 189 087 00019</li>
        <li><strong>Adresse :</strong> 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte</li>
        <li><strong>Email :</strong> <a href="mailto:contact@djama.space">contact@djama.space</a></li>
      </ul>
      <p>
        Ce traitement est encadré par le Règlement Général sur la Protection des Données
        (RGPD — Règlement UE 2016/679) et la loi Informatique et Libertés du 6 janvier 1978 modifiée.
      </p>

      {/* ─── 2. Données collectées ─── */}
      <h2>2. Données collectées</h2>
      <p>Dans le cadre de l&apos;utilisation de nos services, nous collectons les catégories de données suivantes :</p>
      <ul>
        <li><strong>Données d&apos;identification :</strong> nom, prénom, adresse email, numéro de téléphone (si fourni)</li>
        <li><strong>Données de connexion :</strong> adresse IP, logs de connexion, identifiants de session, horodatage</li>
        <li><strong>Données de facturation :</strong> traitées par Stripe — nous ne stockons jamais vos données bancaires directement</li>
        <li><strong>Contenu de vos outils :</strong> factures, notes, événements, dossiers et fichiers créés dans l&apos;Espace Client</li>
        <li><strong>Données de navigation :</strong> pages visitées, durée de session (données anonymisées via cookies analytiques)</li>
        <li><strong>Données de correspondance :</strong> messages envoyés via le formulaire de contact ou par email</li>
        <li><strong>Données relatives aux prestations :</strong> informations partagées dans le cadre d&apos;un accompagnement (sourcing, marchés publics, création digitale)</li>
      </ul>

      {/* ─── 3. Finalités ─── */}
      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont utilisées pour les finalités suivantes :</p>
      <ul>
        <li>Créer et gérer votre compte utilisateur sur djama.space</li>
        <li>Vous fournir l&apos;accès aux outils de l&apos;Espace Client (facturation, planning, notes, CRM, etc.)</li>
        <li>Gérer votre abonnement, les renouvellements et les paiements associés</li>
        <li>Vous contacter et vous accompagner dans le cadre d&apos;une prestation (sourcing, marchés publics, site web, coaching IA)</li>
        <li>Vous envoyer des communications techniques relatives à votre compte (mises à jour, incidents, sécurité)</li>
        <li>Vous envoyer des communications commerciales et newsletters (avec votre consentement préalable)</li>
        <li>Améliorer nos services et analyser l&apos;audience du site (données anonymisées et agrégées)</li>
        <li>Respecter nos obligations légales, comptables et fiscales</li>
        <li>Prévenir la fraude et assurer la sécurité de la plateforme</li>
      </ul>

      {/* ─── 4. Base légale ─── */}
      <h2>4. Base légale des traitements</h2>
      <p>Selon les finalités, le traitement de vos données est fondé sur :</p>
      <ul>
        <li><strong>Exécution du contrat (art. 6.1.b RGPD) :</strong> pour la création de compte, la fourniture des outils et services souscrits, la gestion de l&apos;abonnement et des prestations</li>
        <li><strong>Intérêt légitime (art. 6.1.f RGPD) :</strong> pour l&apos;amélioration de nos services, la sécurité de la plateforme et la prévention de la fraude</li>
        <li><strong>Consentement (art. 6.1.a RGPD) :</strong> pour les communications marketing, les newsletters et les cookies non essentiels</li>
        <li><strong>Obligation légale (art. 6.1.c RGPD) :</strong> pour la conservation des données comptables et fiscales obligatoires</li>
      </ul>

      {/* ─── 5. Destinataires ─── */}
      <h2>5. Destinataires des données</h2>
      <p>
        Vos données sont traitées uniquement par DJAMA et ses sous-traitants techniques strictement nécessaires
        au fonctionnement du service :
      </p>
      <ul>
        <li><strong>Supabase :</strong> hébergement de la base de données et authentification (serveurs dans l&apos;Union européenne — AWS eu-west-3, Paris)</li>
        <li><strong>Vercel :</strong> hébergement de l&apos;application web (San Francisco, États-Unis — transfert encadré par clauses contractuelles types)</li>
        <li><strong>Stripe :</strong> traitement sécurisé des paiements (certifié PCI DSS Level 1 — Dublin, Irlande)</li>
        <li><strong>Resend / service email :</strong> envoi des emails transactionnels (notifications, factures)</li>
      </ul>
      <p>
        <strong>Nous ne vendons jamais vos données personnelles à des tiers à des fins commerciales.</strong>{" "}
        Aucune donnée n&apos;est partagée avec des partenaires publicitaires ou des courtiers en données.
      </p>

      {/* ─── 6. Durée de conservation ─── */}
      <h2>6. Durée de conservation</h2>
      <ul>
        <li><strong>Données de compte actif :</strong> conservées pendant toute la durée de votre abonnement ou relation contractuelle avec DJAMA</li>
        <li><strong>Après résiliation ou clôture :</strong> conservées pendant <strong>3 ans</strong> pour les obligations légales et contractuelles (preuve, litige)</li>
        <li><strong>Données comptables et fiscales :</strong> conservées <strong>10 ans</strong> conformément à l&apos;article L.123-22 du Code de commerce</li>
        <li><strong>Données de navigation anonymisées :</strong> conservées <strong>13 mois</strong> conformément aux recommandations de la CNIL</li>
        <li><strong>Données de correspondance (email, formulaire contact) :</strong> conservées <strong>3 ans</strong> après le dernier échange</li>
      </ul>

      {/* ─── 7. Droits RGPD ─── */}
      <h2>7. Vos droits (RGPD)</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>
      <ul>
        <li><strong>Droit d&apos;accès (art. 15) :</strong> obtenir une copie des données que nous détenons sur vous</li>
        <li><strong>Droit de rectification (art. 16) :</strong> corriger des données inexactes ou incomplètes</li>
        <li><strong>Droit à l&apos;effacement (art. 17) :</strong> demander la suppression de vos données, sous réserve des obligations légales de conservation</li>
        <li><strong>Droit à la portabilité (art. 20) :</strong> recevoir vos données dans un format structuré, lisible par machine (JSON ou CSV)</li>
        <li><strong>Droit à la limitation (art. 18) :</strong> demander la suspension temporaire du traitement</li>
        <li><strong>Droit d&apos;opposition (art. 21) :</strong> vous opposer au traitement fondé sur l&apos;intérêt légitime ou au traitement à des fins de prospection</li>
        <li><strong>Droit de retrait du consentement :</strong> retirer à tout moment votre consentement aux communications marketing</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à{" "}
        <strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>{" "}
        en précisant votre demande. Nous traiterons votre demande dans un délai maximum d&apos;un mois
        (prolongeable de deux mois supplémentaires en cas de demande complexe).
      </p>
      <p>
        En cas de réponse insatisfaisante, vous avez le droit d&apos;introduire une réclamation auprès de la{" "}
        <strong>Commission Nationale de l&apos;Informatique et des Libertés (CNIL)</strong> —{" "}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
      </p>

      {/* ─── 8. Sécurité ─── */}
      <h2>8. Sécurité des données</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
        vos données contre tout accès non autorisé, perte, altération ou divulgation :
      </p>
      <ul>
        <li>Chiffrement des communications en transit via <strong>TLS 1.3</strong></li>
        <li>Authentification sécurisée via <strong>Supabase Auth</strong> avec tokens JWT à durée limitée</li>
        <li><strong>Row Level Security (RLS)</strong> sur toutes les tables — vous ne pouvez accéder qu&apos;à vos propres données</li>
        <li>Mots de passe hachés via <strong>bcrypt</strong> — jamais stockés en clair</li>
        <li>Sauvegardes automatiques quotidiennes avec rétention</li>
        <li>Paiements traités exclusivement par <strong>Stripe (PCI DSS Level 1)</strong></li>
      </ul>
      <p>
        Pour en savoir plus, consultez notre <a href="/legal/securite">page Sécurité</a>.
      </p>

      {/* ─── 9. Transferts hors UE ─── */}
      <h2>9. Transferts de données hors Union Européenne</h2>
      <p>
        Certains de nos sous-traitants sont établis hors de l&apos;Union Européenne :
      </p>
      <ul>
        <li><strong>Vercel Inc. (États-Unis) :</strong> transfert encadré par les Clauses Contractuelles Types (CCT) de la Commission européenne</li>
        <li><strong>Stripe Inc. (États-Unis / Irlande) :</strong> transfert encadré par les CCT et la certification PCI DSS</li>
      </ul>
      <p>
        Ces transferts sont effectués dans le respect des garanties appropriées prévues par le RGPD
        (articles 46 et suivants), assurant un niveau de protection équivalent à celui de l&apos;UE.
      </p>

      {/* ─── 10. Cookies ─── */}
      <h2>10. Cookies et traceurs</h2>
      <p>
        Le site djama.space utilise des cookies strictement nécessaires à son fonctionnement
        (session d&apos;authentification, préférences de langue, sécurité CSRF) ainsi que des cookies
        de performance anonymisés. Aucun cookie publicitaire ou de ciblage n&apos;est utilisé.
        Pour en savoir plus, consultez notre{" "}
        <a href="/legal/cookies">Politique de cookies</a>.
      </p>

      {/* ─── 11. Mineurs ─── */}
      <h2>11. Protection des mineurs</h2>
      <p>
        Les services de DJAMA sont exclusivement destinés aux professionnels et aux personnes majeures
        (18 ans ou plus). Nous ne collectons sciemment aucune donnée personnelle concernant des mineurs.
        Si vous avez connaissance qu&apos;un mineur nous a communiqué des données, veuillez nous contacter
        immédiatement à <a href="mailto:contact@djama.space">contact@djama.space</a>.
      </p>

      {/* ─── 12. Modifications ─── */}
      <h2>12. Modifications de la présente politique</h2>
      <p>
        DJAMA se réserve le droit de modifier la présente politique de confidentialité à tout moment,
        notamment pour s&apos;adapter aux évolutions légales ou aux modifications de nos services.
        La date de dernière mise à jour est indiquée en haut de cette page. En cas de modification
        substantielle, vous serez informé par email ou via une notification dans votre espace client.
        La poursuite de l&apos;utilisation de nos services après notification vaut acceptation
        des modifications.
      </p>

      {/* ─── 13. Contact ─── */}
      <h2>13. Contact</h2>
      <p>
        Pour toute question relative à la présente politique ou pour exercer vos droits :
        <br /><strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
        <br />DJAMA — AMDJAD Nofane, 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte
        <br />Délai de réponse : 48 heures ouvrées maximum.
      </p>
    </LegalPage>
  );
}
