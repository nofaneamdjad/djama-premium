import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Mentions légales — DJAMA" };

export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" lastUpdated="21 avril 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>djama.space</strong> est édité par <strong>DJAMA</strong>, plateforme de services
        digitaux à destination des entrepreneurs, freelances et porteurs de projets.
        <br />Email : <a href="mailto:contact@djama.space">contact@djama.space</a>
      </p>

      <h2>Activités</h2>
      <p>DJAMA propose notamment :</p>
      <ul>
        <li>Des outils professionnels en ligne (facturation, planning, bloc-notes, gestion de dossiers)</li>
        <li>Un accompagnement à la recherche de fournisseurs</li>
        <li>Un accompagnement aux réponses aux marchés publics</li>
        <li>Des services de création digitale (sites web, visuels, contenu)</li>
        <li>Un accès à une communauté et à des ressources pour entrepreneurs</li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 701,
        San Francisco, California 94104, États-Unis.
        <br />Les données utilisateurs sont stockées sur l&apos;infrastructure <strong>Supabase</strong>,
        hébergée au sein de l&apos;Union européenne.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble du contenu présent sur ce site (textes, images, logos, design, code) est la propriété
        exclusive de DJAMA et est protégé par les lois en vigueur relatives à la propriété intellectuelle.
        Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.
      </p>

      <h2>Responsabilité</h2>
      <p>
        DJAMA s&apos;efforce de fournir des informations exactes et à jour sur ce site. Cependant,
        nous ne pouvons garantir l&apos;exactitude, la complétude ou l&apos;actualité des informations diffusées.
        DJAMA décline toute responsabilité pour les dommages directs ou indirects qui pourraient résulter
        de l&apos;accès au site ou de l&apos;utilisation de son contenu.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Le présent site et ses mentions légales sont soumis au droit français.
        Tout litige sera porté devant les tribunaux compétents.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à :
        <br /><strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
      </p>
    </LegalPage>
  );
}
