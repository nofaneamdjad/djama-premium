import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Mentions légales — DJAMA" };

export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" lastUpdated="30 juin 2026">

      {/* ─── 1. Éditeur ─── */}
      <h2>1. Éditeur du site</h2>
      <p>Le site <strong>djama.space</strong> est édité par :</p>
      <ul>
        <li><strong>Nom commercial :</strong> DJAMA</li>
        <li><strong>Entrepreneur :</strong> AMDJAD Nofane</li>
        <li><strong>Forme juridique :</strong> Entrepreneur individuel — Micro-entreprise</li>
        <li><strong>Adresse du siège :</strong> 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte</li>
        <li><strong>Email :</strong> <a href="mailto:contact@djama.space">contact@djama.space</a></li>
        <li><strong>SIREN :</strong> 981 189 087</li>
        <li><strong>SIRET (siège) :</strong> 981 189 087 00019</li>
        <li><strong>RCS :</strong> 981 189 087 R.C.S. Mamoudzou</li>
        <li><strong>RNE :</strong> Inscrit</li>
        <li><strong>Numéro de TVA intracommunautaire :</strong> FR35981189087</li>
        <li><strong>Code APE / NAF :</strong> 70.22Z — Conseil pour les affaires et autres conseils de gestion</li>
        <li><strong>Date de création :</strong> 10 novembre 2023</li>
      </ul>

      {/* ─── 2. Directeur de publication ─── */}
      <h2>2. Directeur de la publication</h2>
      <p>
        Le directeur de la publication du site <strong>djama.space</strong> est :{" "}
        <strong>AMDJAD Nofane</strong>.
        <br />Contact : <a href="mailto:contact@djama.space">contact@djama.space</a>
      </p>

      {/* ─── 3. Hébergement ─── */}
      <h2>3. Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong>
        <br />Adresse : 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis
        <br />Site web :{" "}
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
      </p>
      <p>
        Les données utilisateurs (comptes, fichiers, contenus) sont stockées sur l&apos;infrastructure{" "}
        <strong>Supabase</strong>, hébergée au sein de l&apos;Union européenne (AWS eu-west-3, Paris, France).
        <br />Site web :{" "}
        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a>
      </p>

      {/* ─── 4. Activités ─── */}
      <h2>4. Activités proposées</h2>
      <p>
        DJAMA est une plateforme de services digitaux à destination des entrepreneurs, freelances et porteurs
        de projets. Elle propose notamment :
      </p>
      <ul>
        <li>Des outils professionnels en ligne : facturation, planning, bloc-notes, CRM, gestion de dossiers et suivi de projets (abonnement mensuel ou annuel)</li>
        <li>Un accompagnement personnalisé à la recherche de fournisseurs nationaux et internationaux (importation, exportation, négoce)</li>
        <li>Un accompagnement aux réponses aux marchés publics et appels d&apos;offres</li>
        <li>Des prestations de création digitale : sites web, applications, visuels et contenu</li>
        <li>Une formation au coaching IA (maîtrise des outils d&apos;intelligence artificielle)</li>
        <li>Un accès à des ressources, articles et guides pour entrepreneurs</li>
      </ul>

      {/* ─── 5. Propriété intellectuelle ─── */}
      <h2>5. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble du contenu présent sur ce site — textes, articles, photographies, images, logos,
        design, charte graphique, code source, architecture de l&apos;application — est la propriété exclusive
        de <strong>DJAMA / AMDJAD Nofane</strong> et est protégé par les dispositions du Code de la
        propriété intellectuelle français ainsi que par les conventions internationales applicables.
      </p>
      <p>
        Toute reproduction, représentation, modification, publication ou transmission totale ou partielle
        du site ou de son contenu, par quelque procédé que ce soit, est interdite sans l&apos;autorisation
        préalable et écrite de DJAMA. Toute exploitation non autorisée sera considérée comme constitutive
        d&apos;une contrefaçon et poursuivie conformément aux articles L.335-2 et suivants du Code de la
        propriété intellectuelle.
      </p>

      {/* ─── 6. Données personnelles ─── */}
      <h2>6. Données personnelles et RGPD</h2>
      <p>
        Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679)
        et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez d&apos;un droit
        d&apos;accès, de rectification, d&apos;effacement, de portabilité et d&apos;opposition concernant
        vos données personnelles.
      </p>
      <p>
        Pour exercer ces droits, contactez le responsable du traitement :{" "}
        <strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>.
        Nous traiterons votre demande dans un délai maximum d&apos;un mois.
      </p>
      <p>
        En cas de réclamation non résolue, vous avez le droit d&apos;introduire une plainte auprès de la{" "}
        <strong>Commission Nationale de l&apos;Informatique et des Libertés (CNIL)</strong> —{" "}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
      </p>
      <p>
        Pour plus d&apos;informations sur le traitement de vos données, consultez notre{" "}
        <a href="/legal/confidentialite">Politique de confidentialité</a>.
      </p>

      {/* ─── 7. Cookies ─── */}
      <h2>7. Cookies</h2>
      <p>
        Le site djama.space utilise des cookies strictement nécessaires à son fonctionnement
        (authentification, préférences, sécurité des formulaires) ainsi que des cookies de performance
        anonymisés. Pour en savoir plus, consultez notre{" "}
        <a href="/legal/cookies">Politique de cookies</a>.
      </p>

      {/* ─── 8. Responsabilité ─── */}
      <h2>8. Limitation de responsabilité</h2>
      <p>
        DJAMA s&apos;efforce de fournir des informations exactes et à jour. Toutefois, DJAMA ne garantit pas
        l&apos;exactitude, la complétude ou l&apos;actualité des informations disponibles sur ce site et décline
        toute responsabilité pour tout dommage direct ou indirect résultant de l&apos;utilisation du site,
        notamment en cas d&apos;interruption de service, de bug informatique ou de force majeure.
      </p>
      <p>
        La responsabilité de DJAMA est limitée au montant effectivement payé par le client au cours des
        12 derniers mois pour la prestation concernée.
      </p>

      {/* ─── 9. Liens hypertextes ─── */}
      <h2>9. Liens hypertextes</h2>
      <p>
        Le site djama.space peut contenir des liens vers des sites externes. DJAMA n&apos;a aucun contrôle
        sur leur contenu et décline toute responsabilité à leur égard.
        La création de liens vers djama.space est autorisée sans accord préalable, sous réserve que les
        pages liées ne soient pas encadrées (framing) et que la source soit clairement mentionnée.
      </p>

      {/* ─── 10. Médiation ─── */}
      <h2>10. Médiation des litiges de consommation</h2>
      <p>
        En cas de litige non résolu à l&apos;amiable avec DJAMA, le consommateur peut recourir gratuitement
        à un médiateur conformément aux dispositions du Code de la consommation (articles L.616-1 et suivants).
      </p>
      <p>
        Conformément à l&apos;article 14 du Règlement (UE) n°524/2013, la Commission Européenne a mis en
        place une plateforme de règlement en ligne des litiges (RLL) accessible à :{" "}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>

      {/* ─── 11. Droit applicable ─── */}
      <h2>11. Droit applicable et juridiction compétente</h2>
      <p>
        Le présent site et ses mentions légales sont soumis au droit français.
        Tout litige sera porté, après tentative de résolution amiable, devant les tribunaux compétents
        du ressort de Mamoudzou (Mayotte).
      </p>

      {/* ─── 12. Contact ─── */}
      <h2>12. Contact</h2>
      <p>
        Pour toute question relative aux présentes mentions légales :
        <br /><strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
        <br />Réponse sous 48 heures ouvrées.
      </p>
    </LegalPage>
  );
}
