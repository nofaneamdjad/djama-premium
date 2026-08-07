import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderSiteHTML } from "@/lib/site-builder";
import type { SiteConfig } from "@/lib/site-builder";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (slug === "_preview-commerce") {
    const { TEMPLATES, emptySections, renderSiteHTML } = await import("@/lib/site-builder");
    const tpl = TEMPLATES.commerce;
    const sections = emptySections();
    sections.hero = { enabled: true, title: "La Boutique de Sophie — Mode & Style à Paris", subtitle: "Sélection pointue de vêtements, accessoires et bijoux pour femme. Nouvelle collection printemps disponible en boutique et en ligne.", cta: "Découvrir la collection" };
    sections.services = { enabled: true, title: "Nos catégories", items: [
      { name: "Prêt-à-porter femme", desc: "Robes, pulls, pantalons et vestes sélectionnés auprès de créateurs français et européens. Tailles 34 à 48.", price: "Dès 39€" },
      { name: "Accessoires & bijoux", desc: "Sacs, foulards, ceintures et bijoux fantaisie pour compléter chaque tenue avec élégance.", price: "Dès 12€" },
      { name: "Retouches sur mesure", desc: "Service de retouche rapide confié à notre couturière attitrée. Ourlets, ajustements, réparations.", price: "Dès 8€" },
      { name: "Click & Collect", desc: "Commandez en ligne et retirez votre colis en boutique sous 2h. Aucun frais de port.", price: "Gratuit" },
    ]};
    sections.about = { enabled: true, title: "Une boutique de mode avec une âme", content: "Créée en 2015 par Sophie Marchand, La Boutique de Sophie est née d'une passion pour la mode accessible et durable. Installée dans le 11e arrondissement de Paris, notre équipe de 4 stylistes vous accompagne dans vos choix avec bienveillance. Nous privilégions les marques éco-responsables et les créateurs locaux pour vous offrir une mode qui a du sens." };
    sections.testimonials = { enabled: true, items: [
      { name: "Camille D.", text: "Un accueil chaleureux, des conseils avisés et une sélection vraiment unique. Je suis cliente depuis l'ouverture !" },
      { name: "Nathalie R.", text: "Sophie a un œil incroyable pour la mode. Elle m'a trouvé la robe parfaite pour mon mariage en moins de 30 minutes !" },
      { name: "Isabelle M.", text: "La boutique que je cherchais depuis longtemps — des pièces originales, des prix raisonnables, une vraie relation de confiance." },
    ]};
    sections.faq = { enabled: true, items: [
      { q: "Proposez-vous la livraison à domicile ?", a: "Oui, nous livrons partout en France en 48h via Colissimo. Livraison gratuite dès 80€ d'achat. Nous proposons aussi le retrait en boutique (Click & Collect) sous 2h." },
      { q: "Quelle est votre politique de retours ?", a: "Vous avez 14 jours pour retourner un article non porté avec l'étiquette. Échange ou remboursement intégral. Les retours sont à votre charge sauf article défectueux." },
      { q: "Faites-vous des retouches sur des vêtements achetés ailleurs ?", a: "Bien sûr ! Notre couturière prend en charge tous types de retouches, quel que soit le vêtement. Devis gratuit sur place." },
    ]};
    const html = renderSiteHTML({ template: "commerce", businessName: "La Boutique de Sophie", sector: "Mode & Accessoires", description: "Boutique de mode féminine à Paris, sélection de créateurs français.", email: "contact@boutique-sophie.fr", phone: "+33 1 42 56 78 90", city: "Paris 11e", primaryColor: tpl.color, sections }, "boutique-sophie");
    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (slug === "_preview") {
    const { TEMPLATES, emptySections, renderSiteHTML } = await import("@/lib/site-builder");
    const tpl = TEMPLATES.artisan;
    const sections = emptySections();
    sections.hero = { enabled: true, title: "Plomberie Dupont — Expert depuis 1998", subtitle: "Interventions d'urgence, installations et rénovations de salle de bain à Lyon et alentours.", cta: "Demander un devis gratuit" };
    sections.services = { enabled: true, title: "Nos prestations", items: [
      { name: "Dépannage urgent", desc: "Intervention en moins de 2h pour toute urgence plomberie, 7j/7 et jours fériés.", price: "À partir de 90€" },
      { name: "Installation sanitaire", desc: "Pose de WC, lavabo, douche, baignoire et robinetterie avec garantie 2 ans.", price: "Sur devis" },
      { name: "Rénovation salle de bain", desc: "Conception et réalisation complète de votre salle de bain clé en main.", price: "Sur devis" },
      { name: "Détection de fuites", desc: "Caméra et détecteur acoustique pour localiser sans travaux destructifs.", price: "À partir de 150€" },
    ]};
    sections.about = { enabled: true, title: "Une entreprise familiale à votre service", content: "Fondée en 1998 par Jean-Pierre Dupont, notre entreprise familiale compte aujourd'hui 8 artisans qualifiés. Nous intervenons sur Lyon et l'ensemble du Rhône avec une priorité absolue : votre satisfaction. Chaque chantier est traité avec soin, dans le respect des normes NF et des délais convenus. Notre engagement : un travail soigné, une transparence totale sur les prix et un service après-vente réactif." };
    sections.testimonials = { enabled: true, items: [
      { name: "Sophie M.", text: "Intervention ultra-rapide pour une fuite d'urgence un dimanche soir. Professionnel, efficace et prix honnête. Je recommande sans hésitation !" },
      { name: "Thomas L.", text: "Rénovation complète de notre salle de bain en 5 jours. Résultat magnifique, équipe soignée et chantier laissé impeccable. Merci !" },
      { name: "Marie C.", text: "Toujours disponibles, prix transparents et travail de qualité. Mon plombier de confiance depuis 10 ans !" },
    ]};
    sections.faq = { enabled: true, items: [
      { q: "Intervenez-vous le week-end et les jours fériés ?", a: "Oui, notre service d'urgence est disponible 7j/7, 24h/24, y compris les jours fériés. Un supplément week-end peut s'appliquer pour les interventions hors heures ouvrables." },
      { q: "Proposez-vous des devis gratuits ?", a: "Absolument. Nous vous proposons un devis détaillé et gratuit avant toute intervention non urgente. Pour les urgences, le diagnostic est facturé et déduit de la prestation." },
      { q: "Quelles garanties offrez-vous sur vos travaux ?", a: "Tous nos travaux sont garantis 2 ans pièces et main d'œuvre. Nous sommes assurés en responsabilité civile professionnelle et décennale." },
    ]};
    const html = renderSiteHTML({ template: "artisan", businessName: "Plomberie Dupont", sector: "Artisanat & BTP", description: "Plombier à Lyon depuis 1998", email: "contact@plomberie-dupont.fr", phone: "+33 4 78 12 34 56", city: "Lyon", primaryColor: tpl.color, sections }, "plomberie-dupont");
    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supabase
    .from("sites")
    .select("config, published")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return new Response(notFoundHtml(slug), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!data.published) {
    return new Response(draftHtml(slug), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const html = renderSiteHTML(data.config as SiteConfig, slug);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

function notFoundHtml(slug: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Site introuvable</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;color:#374151}
.box{text-align:center;padding:3rem;background:#fff;border-radius:16px;border:1px solid #e5e7eb;max-width:420px}
h1{font-size:1.5rem;font-weight:700;margin-bottom:.75rem}p{color:#6b7280}a{color:#2563eb}</style>
</head><body><div class="box">
<h1>Site introuvable</h1>
<p>Le site <strong>${slug}</strong> n'existe pas.</p>
<p style="margin-top:1rem"><a href="https://djama.pro">Créer votre site avec DJAMA →</a></p>
</div></body></html>`;
}

function draftHtml(slug: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Site en cours de création</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;color:#374151}
.box{text-align:center;padding:3rem;background:#fff;border-radius:16px;border:1px solid #e5e7eb;max-width:420px}
h1{font-size:1.5rem;font-weight:700;margin-bottom:.75rem}p{color:#6b7280}
.badge{display:inline-block;background:#fef3c7;color:#92400e;padding:.25rem .75rem;border-radius:4px;font-size:.8rem;font-weight:600;margin-bottom:1rem}</style>
</head><body><div class="box">
<span class="badge">Brouillon</span>
<h1>Ce site est en cours de création</h1>
<p>Le propriétaire n'a pas encore publié <strong>${slug}</strong>.</p>
</div></body></html>`;
}
