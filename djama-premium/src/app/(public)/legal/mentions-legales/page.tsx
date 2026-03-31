import { LegalPage } from "../_legal-layout";

export const metadata = { title: "Mentions légales — DJAMA" };

export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" lastUpdated="1er janvier 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>djama.fr</strong> est édité par DJAMA, plateforme de services digitaux.
        <br />Email : contact@djama.fr
      </p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 701,
        San Francisco, California 94104, États-Unis.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble du contenu présent sur ce site (textes, images, logos, design) est la propriété
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

      <h2>Contact</h2>
      <p>
        Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à :
        <br /><strong>contact@djama.fr</strong>
      </p>
    </LegalPage>
  );
}
