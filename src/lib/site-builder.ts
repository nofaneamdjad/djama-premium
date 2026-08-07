/**
 * DJAMA Site Builder — types, templates et renderer HTML
 *
 * SQL Supabase à exécuter une seule fois :
 * ─────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS sites (
 *   id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   slug         TEXT UNIQUE NOT NULL,
 *   config       JSONB NOT NULL DEFAULT '{}',
 *   published    BOOLEAN NOT NULL DEFAULT FALSE,
 *   published_at TIMESTAMPTZ,
 *   created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "own sites" ON sites FOR ALL USING (auth.uid() = user_id);
 * CREATE POLICY "public read" ON sites FOR SELECT USING (published = true);
 */

export type TemplateId = "artisan" | "commerce" | "freelance" | "sante" | "formation" | "restaurant" | "immobilier" | "beaute";

export interface ServiceItem { name: string; desc: string; price?: string }
export interface TestiItem   { name: string; text: string }
export interface FaqItem     { q: string; a: string }

export interface SiteSections {
  hero:         { enabled: boolean; title: string; subtitle: string; cta: string }
  services:     { enabled: boolean; title: string; items: ServiceItem[] }
  about:        { enabled: boolean; title: string; content: string }
  testimonials: { enabled: boolean; items: TestiItem[] }
  faq:          { enabled: boolean; items: FaqItem[] }
  contact:      { enabled: boolean }
}

export interface SiteConfig {
  template:     TemplateId
  businessName: string
  sector:       string
  description:  string
  email:        string
  phone:        string
  city:         string
  whatsapp?:    string
  primaryColor: string
  sections:     SiteSections
}

export const TEMPLATES: Record<TemplateId, {
  label: string; sector: string; color: string; light: string; emoji: string; desc: string
}> = {
  artisan:    { label: "Artisan",    sector: "Artisanat & BTP",            color: "#E86A2C", light: "#FEF3E8", emoji: "🔨", desc: "Plombier, électricien, maçon…" },
  commerce:   { label: "Commerce",   sector: "Commerce & Retail",           color: "#2563EB", light: "#EFF6FF", emoji: "🏪", desc: "Boutique, épicerie, magasin…" },
  freelance:  { label: "Freelance",  sector: "Services & Conseil",          color: "#7C3AED", light: "#F5F3FF", emoji: "💼", desc: "Consultant, coach, expert…" },
  sante:      { label: "Santé",      sector: "Santé & Bien-être",           color: "#10B981", light: "#ECFDF5", emoji: "🌿", desc: "Médecin, kiné, naturopathe…" },
  formation:  { label: "Formation",  sector: "Éducation & Formation",       color: "#0EA5E9", light: "#F0F9FF", emoji: "📚", desc: "Formateur, tuteur, académie…" },
  restaurant: { label: "Restaurant", sector: "Restauration",                color: "#DC2626", light: "#FFF5F5", emoji: "🍽️", desc: "Restaurant, traiteur, café…" },
  immobilier: { label: "Immobilier", sector: "Immobilier",                  color: "#6366F1", light: "#EEF2FF", emoji: "🏠", desc: "Agent, agence, promoteur…" },
  beaute:     { label: "Beauté",     sector: "Beauté & Bien-être",          color: "#EC4899", light: "#FDF2F8", emoji: "✨", desc: "Coiffeur, esthéticien, spa…" },
};

export const COLOR_PRESETS: Record<TemplateId, string[]> = {
  artisan:    ["#E86A2C","#D97706","#B45309","#CF4820","#EA580C","#9A3412"],
  commerce:   ["#2563EB","#1D4ED8","#3B82F6","#0EA5E9","#6366F1","#7C3AED"],
  freelance:  ["#7C3AED","#6D28D9","#8B5CF6","#9333EA","#6366F1","#4F46E5"],
  sante:      ["#10B981","#059669","#14B8A6","#0D9488","#16A34A","#0891B2"],
  formation:  ["#0EA5E9","#0284C7","#2563EB","#38BDF8","#6366F1","#8B5CF6"],
  restaurant: ["#DC2626","#B91C1C","#EF4444","#E86A2C","#D97706","#92400E"],
  immobilier: ["#6366F1","#4F46E5","#7C3AED","#2563EB","#1D4ED8","#0EA5E9"],
  beaute:     ["#EC4899","#DB2777","#F472B6","#C026D3","#E879F9","#A21CAF"],
};

export function toSlug(name: string): string {
  return name.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "mon-site";
}

/* ─── Default empty sections ─────────────────────────────────── */
export function emptySections(): SiteSections {
  return {
    hero:         { enabled: true,  title: "", subtitle: "", cta: "Nous contacter" },
    services:     { enabled: true,  title: "Nos prestations", items: [] },
    about:        { enabled: true,  title: "À propos de nous", content: "" },
    testimonials: { enabled: true,  items: [] },
    faq:          { enabled: true,  items: [] },
    contact:      { enabled: true },
  };
}

/* ─── HTML Renderer ──────────────────────────────────────────── */
export function renderSiteHTML(config: SiteConfig, slug: string, domain?: string): string {
  const tpl   = TEMPLATES[config.template] ?? TEMPLATES.commerce;
  const color = config.primaryColor || tpl.color;
  const s     = config.sections;
  const _url  = domain ?? `https://djama.pro/s/${slug}`;
  const bn    = esc(config.businessName);

  // Extract founding year from about/description to compute experience
  const yrm       = /\b(19[5-9]\d|20[0-2]\d)\b/.exec(s.about.content || config.description || "");
  const foundYear  = yrm ? +yrm[1] : null;
  const yearsXp    = foundYear ? `${new Date().getFullYear() - foundYear} ans` : "10+ ans";
  const sinceLabel = foundYear ? `Depuis ${foundYear}` : "Expert confirmé";

  // Per-template stats for "About" section (replaces emoji box)
  const ASTATS: Record<TemplateId, { v: string[]; l: string[] }> = {
    artisan:    { v: [yearsXp,"850+","1 200+","2 ans"],   l: ["D'expérience","Chantiers","Clients","Garantie"] },
    commerce:   { v: [yearsXp,"2 000+","3 500+","98%"],   l: ["En activité","Références","Clients fidèles","Satisfaction"] },
    freelance:  { v: [yearsXp,"120+","85+","97%"],        l: ["D'expertise","Missions","Clients","Recommandation"] },
    sante:      { v: [yearsXp,"2 400+","4 800+","4.9★"],  l: ["De pratique","Patients","Consultations","Satisfaction"] },
    formation:  { v: [yearsXp,"1 500+","280h","94%"],     l: ["D'expérience","Apprenants","De contenu","Réussite"] },
    restaurant: { v: [yearsXp,"400+","52","4.8★"],        l: ["D'ouverture","Couverts/sem.","Recettes","Satisfaction"] },
    immobilier: { v: [yearsXp,"340+","680+","98%"],       l: ["De présence","Biens vendus","Clients","Satisfaction"] },
    beaute:     { v: [yearsXp,"2 100+","160+","4.9★"],    l: ["D'expérience","Clients fidèles","Prestations/mois","Note Google"] },
  };
  const ast = ASTATS[config.template] ?? ASTATS.commerce;

  // Per-template trust bar items
  const TRUST: Record<TemplateId, string[]> = {
    artisan:    ["Devis gratuit","Intervention rapide","Garantie 2 ans","Artisan certifié"],
    commerce:   ["Livraison disponible","Click & Collect","Paiement sécurisé","Retours acceptés"],
    freelance:  ["Devis sous 24h","100% à distance","Sans engagement","Contrat NDA possible"],
    sante:      ["Prise en charge mutuelle","Urgences acceptées","Téléconsultation","Confidentialité"],
    formation:  ["Éligible CPF","Certification incluse","Support 6 mois","Satisfaction garantie"],
    restaurant: ["Réservation en ligne","Menu végétarien","Traiteur événements","Livraison à domicile"],
    immobilier: ["Estimation gratuite","Mandat simple","Photos HDR offertes","Suivi personnalisé"],
    beaute:     ["Réservation en ligne","Produits naturels","Carte fidélité","Consultation offerte"],
  };
  const trust = TRUST[config.template] ?? TRUST.commerce;

  // WhatsApp link
  const waRaw = config.whatsapp || config.phone || "";
  const waNum = waRaw.replace(/[^+\d]/g, "");
  const waLink = waNum.length >= 9 ? `https://wa.me/${waNum.startsWith("+") ? waNum.slice(1) : waNum}` : null;

  // og:image — URL absolue vers /api/og (acceptée par Facebook, Twitter, LinkedIn)
  const origin = (() => { try { return new URL(_url).origin; } catch { return "https://djama.pro"; } })();
  const ogImg  = `${origin}/api/og?t=${encodeURIComponent(config.businessName.slice(0, 38))}&s=${encodeURIComponent(tpl.sector)}&c=${color.replace("#", "")}`;

  // JSON-LD LocalBusiness schema
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": config.businessName,
    "description": config.description,
    "url": _url,
  };
  if (config.phone)  jsonLd["telephone"] = config.phone;
  if (config.email)  jsonLd["email"]     = config.email;
  if (config.city)   jsonLd["address"]   = { "@type": "PostalAddress", "addressLocality": config.city, "addressCountry": "FR" };

  const navLinks = [
    s.services.enabled && s.services.items.length > 0 ? `<a href="#services">Services</a>` : "",
    s.about.enabled    && s.about.content             ? `<a href="#apropos">À propos</a>` : "",
    s.testimonials.enabled && s.testimonials.items.length > 0 ? `<a href="#avis">Avis</a>` : "",
    s.faq.enabled      && s.faq.items.length > 0      ? `<a href="#faq">FAQ</a>` : "",
    s.contact.enabled                                  ? `<a href="#contact" class="nav-btn">Contact</a>` : "",
  ].filter(Boolean).join("\n");

  /* ── HERO ── */
  const heroSection = s.hero.enabled ? `
<section id="accueil" class="hero">
  <div class="blobs"><div class="b1"></div><div class="b2"></div></div>
  <div class="grd"></div>
  <div class="hero-in">
    <div class="badge">${tpl.emoji}&nbsp; ${esc(tpl.sector)}</div>
    <h1>${esc(s.hero.title) || bn}</h1>
    <p class="hero-p">${esc(s.hero.subtitle)}</p>
    <div class="hero-btns">
      <a href="#contact" class="btn btn-w">${esc(s.hero.cta)}</a>
      ${s.services.enabled && s.services.items.length > 0 ? `<a href="#services" class="btn btn-g">Nos services ↓</a>` : ""}
    </div>
    <div class="hst">
      <div class="hsti"><span class="hstv">★ 4.9</span><span class="hstl">Satisfaction</span></div>
      <span class="hstsep"></span>
      <div class="hsti"><span class="hstv">${s.testimonials.items.length > 0 ? `${Math.max(s.testimonials.items.length * 120, 200)}+` : "500+"}</span><span class="hstl">Clients satisfaits</span></div>
      <span class="hstsep"></span>
      <div class="hsti"><span class="hstv">${sinceLabel}</span><span class="hstl">${foundYear ? "En activité" : "Expert qualifié"}</span></div>
    </div>
  </div>
</section>` : "";

  /* ── TRUST BAR ── */
  const trustBar = `
<div class="tb">
  ${trust.map(t => `<div class="tbi"><span class="tbic">✓</span>${esc(t)}</div>`).join("")}
</div>`;

  /* ── SERVICES ── */
  const servicesSection = s.services.enabled && s.services.items.length > 0 ? `
<section id="services" class="sec">
  <div class="ct">
    <header class="sh"><span class="ey">Ce qu'on propose</span><h2>${esc(s.services.title)}</h2></header>
    <div class="sg">
      ${s.services.items.map((it, i) => `
      <article class="sc rv" style="--di:${i * 0.07}s">
        <div class="sih">
          <div class="sico">${esc(it.name).charAt(0).toUpperCase()}</div>
          <span class="sn">${String(i + 1).padStart(2, "0")}</span>
        </div>
        <h3>${esc(it.name)}</h3>
        <p>${esc(it.desc)}</p>
        ${it.price ? `<span class="sp">${esc(it.price)}</span>` : ""}
      </article>`).join("")}
    </div>
  </div>
</section>` : "";

  /* ── ABOUT — stats grid replaces emoji ── */
  const aboutSection = s.about.enabled && s.about.content ? `
<section id="apropos" class="sec alt">
  <div class="ct ag">
    <div class="at rv">
      <span class="ey">Notre histoire</span>
      <h2>${esc(s.about.title)}</h2>
      <p>${esc(s.about.content)}</p>
      ${s.contact.enabled ? `<a href="#contact" class="btn btn-c">Nous contacter</a>` : ""}
    </div>
    <div class="av rv">
      <div class="stg">
        ${ast.v.map((v, i) => `
        <div class="st">
          <span class="stv">${esc(v)}</span>
          <span class="stl">${esc(ast.l[i])}</span>
        </div>`).join("")}
      </div>
    </div>
  </div>
</section>` : "";

  /* ── TESTIMONIALS ── */
  const testiSection = s.testimonials.enabled && s.testimonials.items.length > 0 ? `
<section id="avis" class="sec dk">
  <div class="ct">
    <header class="sh">
      <span class="ey">Avis clients</span>
      <h2 class="ow">Ils nous font confiance</h2>
      <div class="trat"><span class="trs">★★★★★</span><span class="trn">4.9 / 5</span><span class="trc">— ${s.testimonials.items.length * 150}+ avis</span></div>
    </header>
    <div class="tg">
      ${s.testimonials.items.map((t, i) => {
        const av = t.name.split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
        return `
      <article class="tc rv" style="--di:${i * 0.09}s">
        <div class="tst">★★★★★</div>
        <p>${esc(t.text)}</p>
        <footer class="tf">
          <div class="tav">${av}</div>
          <div><div class="tn">${esc(t.name)}</div><div class="td">Client vérifié</div></div>
        </footer>
      </article>`;
      }).join("")}
    </div>
  </div>
</section>` : "";

  /* ── FAQ — SVG arrow + max-height animation ── */
  const faqSection = s.faq.enabled && s.faq.items.length > 0 ? `
<section id="faq" class="sec">
  <div class="ct fw">
    <header class="sh"><span class="ey">Questions fréquentes</span><h2>Tout ce que vous voulez savoir</h2></header>
    <div class="fl">
      ${s.faq.items.map((f, i) => `
      <div class="fi rv" style="--di:${i * 0.07}s">
        <button class="fq" onclick="faqT(this)">
          <span>${esc(f.q)}</span>
          <svg class="fi2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="fa"><p>${esc(f.a)}</p></div>
      </div>`).join("")}
    </div>
  </div>
</section>` : "";

  /* ── CONTACT ── */
  const contactSection = s.contact.enabled ? `
<section id="contact" class="sec dk">
  <div class="ct cg">
    <div class="cl rv">
      <span class="ey">Parlons de votre projet</span>
      <h2 class="ow">Contactez-nous</h2>
      <p class="cld">Nous répondons à toutes vos demandes sous 24h.</p>
      <div class="cil">
        ${config.phone ? `<a href="tel:${esc(config.phone)}" class="cic"><div class="cicn">📞</div><div><span class="cicl">Téléphone</span><span class="cicv">${esc(config.phone)}</span></div></a>` : ""}
        ${config.email ? `<a href="mailto:${esc(config.email)}" class="cic"><div class="cicn">✉️</div><div><span class="cicl">Email</span><span class="cicv">${esc(config.email)}</span></div></a>` : ""}
        ${config.city  ? `<div class="cic"><div class="cicn">📍</div><div><span class="cicl">Zone d'intervention</span><span class="cicv">${esc(config.city)} et alentours</span></div></div>` : ""}
      </div>
    </div>
    <form class="cf rv" id="cform" novalidate>
      <div class="cfh">Envoyer un message</div>
      <div class="cr">
        <div class="cfd"><label>Nom complet</label><input type="text" placeholder="Jean Dupont" required></div>
        <div class="cfd"><label>Email</label><input type="email" placeholder="jean@exemple.fr" required></div>
      </div>
      <div class="cfd"><label>Téléphone (optionnel)</label><input type="tel" placeholder="+33 6 12 34 56 78"></div>
      <div class="cfd"><label>Votre message</label><textarea rows="4" placeholder="Décrivez votre besoin…" required></textarea></div>
      <button type="submit" class="csb">Envoyer le message →</button>
      <div class="css" id="csuc" hidden>✓ Message reçu ! Nous répondrons sous 24h.</div>
    </form>
  </div>
</section>` : "";

  /* ── CSS ── */
  const css = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:#0f172a;background:#fff;line-height:1.65;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
:root{--c:${color};--c2:color-mix(in srgb,var(--c) 60%,#000);--cl:color-mix(in srgb,var(--c) 10%,#fff);--dk:#0f172a;--bd:#e2e8f0;--r:16px;--sh:0 2px 12px rgba(0,0,0,.06),0 8px 36px rgba(0,0,0,.08);--shx:0 20px 60px rgba(0,0,0,.12)}
#nav{position:sticky;top:0;z-index:200;height:68px;display:flex;align-items:center;background:rgba(255,255,255,.9);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid rgba(0,0,0,.06);transition:box-shadow .2s}
#nav.sc{box-shadow:0 4px 24px rgba(0,0,0,.07)}
.ni{width:100%;max-width:1200px;margin:0 auto;padding:0 clamp(1rem,4vw,2.5rem);display:flex;align-items:center;justify-content:space-between;gap:1.5rem}
.nl{font-weight:800;font-size:1.05rem;color:var(--c);display:flex;align-items:center;gap:.5rem}
.nl::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--c);flex-shrink:0}
.nm{display:flex;align-items:center;gap:2rem;font-size:.875rem}
.nm a{color:#475569;font-weight:500;transition:color .15s;position:relative}
.nm a:not(.nav-btn)::after{content:"";position:absolute;bottom:-4px;left:0;right:0;height:2px;background:var(--c);transform:scaleX(0);transform-origin:center;transition:transform .2s}
.nm a:not(.nav-btn):hover{color:var(--c)}
.nm a:not(.nav-btn):hover::after{transform:scaleX(1)}
.nav-btn{background:var(--c)!important;color:#fff!important;padding:.5rem 1.4rem;border-radius:100px;font-weight:700;font-size:.82rem;transition:opacity .15s,transform .15s;box-shadow:0 2px 10px color-mix(in srgb,var(--c) 35%,transparent)}
.nav-btn:hover{opacity:.88;transform:translateY(-1px)}
.hm{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px}
.hm span{display:block;width:22px;height:2px;background:#0f172a;border-radius:2px;transition:.25s}
.hero{position:relative;min-height:92vh;display:flex;align-items:center;background:var(--dk);overflow:hidden}
.blobs{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.b1,.b2{position:absolute;border-radius:50%;filter:blur(90px);will-change:transform}
.b1{width:700px;height:700px;background:var(--c);opacity:.2;top:-200px;right:-100px;animation:fl 10s ease-in-out infinite}
.b2{width:500px;height:500px;background:var(--c2);opacity:.14;bottom:-120px;left:-80px;animation:fl 13s ease-in-out infinite reverse}
.grd{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.035) 1px,transparent 1px);background-size:32px 32px;pointer-events:none}
@keyframes fl{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.08) translate(-18px,-22px)}}
.hero-in{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:6rem clamp(1rem,4vw,2.5rem) 5rem}
.badge{display:inline-flex;align-items:center;gap:.5rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.7);font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;padding:.45rem 1.1rem;border-radius:100px;margin-bottom:2rem;backdrop-filter:blur(8px)}
.hero h1{font-size:clamp(2.4rem,5.8vw,4.4rem);font-weight:800;line-height:1.08;color:#fff;letter-spacing:-.03em;max-width:760px;margin-bottom:1.5rem}
.hero-p{font-size:clamp(.98rem,1.8vw,1.18rem);color:rgba(255,255,255,.52);max-width:540px;line-height:1.82;margin-bottom:2.75rem}
.hero-btns{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:3.5rem}
.btn{display:inline-flex;align-items:center;gap:.4rem;padding:.9rem 2rem;border-radius:100px;font-weight:700;font-size:.92rem;transition:all .2s;cursor:pointer;border:none;font-family:inherit;letter-spacing:-.01em}
.btn-w{background:#fff;color:var(--c);box-shadow:0 4px 20px rgba(0,0,0,.2)}
.btn-w:hover{transform:translateY(-2px);box-shadow:0 10px 36px rgba(0,0,0,.26)}
.btn-g{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);color:#fff;backdrop-filter:blur(8px)}
.btn-g:hover{background:rgba(255,255,255,.14)}
.btn-c{background:var(--c);color:#fff;margin-top:2rem;box-shadow:0 4px 20px color-mix(in srgb,var(--c) 40%,transparent)}
.btn-c:hover{transform:translateY(-2px);box-shadow:0 10px 36px color-mix(in srgb,var(--c) 50%,transparent)}
.hst{display:flex;align-items:stretch;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.05);backdrop-filter:blur(12px);width:fit-content}
.hsti{padding:.9rem 1.75rem;display:flex;flex-direction:column;gap:.25rem}
.hstv{font-size:1rem;font-weight:700;color:#fff}
.hstl{font-size:.67rem;color:rgba(255,255,255,.42);text-transform:uppercase;letter-spacing:.09em;font-weight:500}
.hstsep{width:1px;align-self:stretch;background:rgba(255,255,255,.09)}
.tb{background:#fff;border-bottom:1px solid var(--bd);padding:.875rem clamp(1rem,4vw,2rem);display:flex;align-items:center;justify-content:center;gap:0;overflow-x:auto;scrollbar-width:none}
.tb::-webkit-scrollbar{display:none}
.tbi{display:flex;align-items:center;gap:.5rem;font-size:.8rem;font-weight:600;color:#475569;white-space:nowrap;padding:.25rem 1.75rem;border-right:1px solid var(--bd);flex-shrink:0}
.tbi:last-child{border-right:none}
.tbic{color:var(--c);font-weight:800}
.sec{padding:clamp(5rem,10vw,8rem) 0}
.alt{background:#f8fafc}
.dk{background:var(--dk)}
.ct{max-width:1200px;margin:0 auto;padding:0 clamp(1rem,4vw,2.5rem)}
.fw{max-width:760px}
.sh{text-align:center;max-width:640px;margin:0 auto 4rem}
.ey{display:block;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:var(--c);margin-bottom:.9rem}
h2{font-size:clamp(1.8rem,3.8vw,2.7rem);font-weight:800;letter-spacing:-.025em;line-height:1.15;color:#0f172a}
.ow{color:#fff}
.sg{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:1.5rem}
.sc{background:#fff;border:1px solid var(--bd);border-radius:var(--r);padding:2.25rem 2rem;position:relative;overflow:hidden;transition:transform .3s,box-shadow .3s,border-color .3s}
.sc::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,color-mix(in srgb,var(--c) 5%,#fff) 0%,transparent 60%);opacity:0;transition:opacity .3s}
.sc::after{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(to bottom,var(--c),var(--c2));transform:scaleY(0);transform-origin:bottom;transition:transform .4s}
.sc:hover{transform:translateY(-6px);box-shadow:var(--shx);border-color:color-mix(in srgb,var(--c) 20%,var(--bd))}
.sc:hover::before{opacity:1}
.sc:hover::after{transform:scaleY(1)}
.sih{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem}
.sico{width:46px;height:46px;border-radius:12px;background:var(--cl);color:var(--c);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;border:1px solid color-mix(in srgb,var(--c) 20%,transparent)}
.sn{font-size:.6rem;font-weight:800;letter-spacing:.1em;color:#cbd5e1}
.sc h3{font-size:1.05rem;font-weight:700;margin-bottom:.625rem;color:#0f172a}
.sc p{color:#64748b;font-size:.88rem;line-height:1.8}
.sp{display:inline-flex;align-items:center;margin-top:1.5rem;padding:.35rem 1rem;background:var(--cl);color:var(--c);border-radius:100px;font-size:.76rem;font-weight:700}
.ag{display:grid;grid-template-columns:1.1fr 1fr;gap:5.5rem;align-items:center}
.at .ey{display:block}.at h2{margin:.7rem 0 1.4rem}
.at p{color:#475569;line-height:1.9;font-size:.97rem}
.av{display:flex;justify-content:center}
.stg{display:grid;grid-template-columns:1fr 1fr;gap:1rem;width:100%}
.st{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:1.75rem 1.5rem;position:relative;overflow:hidden;transition:box-shadow .25s,border-color .25s}
.st::after{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--c),var(--c2))}
.st:hover{box-shadow:var(--sh);border-color:color-mix(in srgb,var(--c) 25%,var(--bd))}
.stv{display:block;font-size:2.1rem;font-weight:800;color:var(--c);letter-spacing:-.03em;line-height:1;margin-bottom:.45rem}
.stl{font-size:.73rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.08em}
.trat{display:flex;align-items:center;gap:.75rem;justify-content:center;margin-top:1rem}
.trs{color:#f59e0b;font-size:1.1rem;letter-spacing:.04em}
.trn{color:#fff;font-weight:700}
.trc{color:rgba(255,255,255,.38);font-size:.8rem}
.tg{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:1.25rem}
.tc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:var(--r);padding:2rem;transition:transform .3s,border-color .3s}
.tc:hover{transform:translateY(-5px);border-color:rgba(255,255,255,.18)}
.tst{color:#f59e0b;font-size:.92rem;letter-spacing:.06em;margin-bottom:1.25rem}
.tc p{color:rgba(255,255,255,.6);font-size:.9rem;line-height:1.8;margin-bottom:1.75rem;font-style:italic}
.tf{display:flex;align-items:center;gap:.875rem}
.tav{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--c),var(--c2));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem;color:#fff;flex-shrink:0}
.tn{color:#fff;font-weight:700;font-size:.88rem}
.td{color:rgba(255,255,255,.32);font-size:.74rem;margin-top:.15rem}
.fl{display:flex;flex-direction:column;gap:.75rem;margin-top:4rem}
.fi{border:1px solid var(--bd);border-radius:14px;overflow:hidden;transition:border-color .2s,box-shadow .2s}
.fi:hover{border-color:color-mix(in srgb,var(--c) 40%,var(--bd))}
.fi.open{border-color:var(--c);box-shadow:0 0 0 3px var(--cl)}
.fq{width:100%;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;padding:1.375rem 1.75rem;background:#fff;border:none;cursor:pointer;text-align:left;font-size:.95rem;font-weight:600;color:#0f172a;font-family:inherit;transition:background .15s}
.fq:hover{background:#f8fafc}
.fi2{width:20px;height:20px;min-width:20px;color:var(--c);flex-shrink:0;transition:transform .3s}
.fi.open .fi2{transform:rotate(180deg)}
.fa{max-height:0;overflow:hidden;transition:max-height .35s ease,padding .25s}
.fa.open{max-height:500px;padding:.25rem 1.75rem 1.375rem}
.fa p{color:#64748b;font-size:.9rem;line-height:1.8}
.cg{display:grid;grid-template-columns:1fr 1.65fr;gap:5.5rem;align-items:start}
.cl{padding-top:1rem}
.cl h2{margin:.7rem 0 .875rem}
.cld{color:rgba(255,255,255,.42);font-size:.9rem;line-height:1.75;margin-bottom:2rem}
.cil{display:flex;flex-direction:column;gap:.875rem}
.cic{display:flex;align-items:center;gap:1rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:.875rem 1.25rem;transition:border-color .2s,background .2s;color:inherit}
.cic:hover{border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.09)}
.cicn{font-size:1.2rem;flex-shrink:0;width:30px;text-align:center}
.cicl{display:block;font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.28);margin-bottom:.2rem}
.cicv{display:block;font-size:.88rem;color:rgba(255,255,255,.78);font-weight:500}
.cf{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:2.5rem;backdrop-filter:blur(12px)}
.cfh{font-size:1rem;font-weight:700;color:#fff;margin-bottom:1.75rem}
.cr{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.cfd{margin-bottom:1rem}
.cfd label{display:block;font-size:.67rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.32);margin-bottom:.5rem}
.cfd input,.cfd textarea{width:100%;padding:.875rem 1.15rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:.9rem;font-family:inherit;outline:none;transition:border-color .2s,background .2s,box-shadow .2s}
.cfd input::placeholder,.cfd textarea::placeholder{color:rgba(255,255,255,.2)}
.cfd input:focus,.cfd textarea:focus{border-color:var(--c);background:rgba(255,255,255,.09);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 22%,transparent)}
.cfd textarea{resize:vertical;min-height:110px}
.csb{width:100%;padding:1.1rem;background:var(--c);color:#fff;border:none;border-radius:12px;font-size:.95rem;font-weight:700;font-family:inherit;cursor:pointer;transition:opacity .2s,transform .2s;box-shadow:0 4px 20px color-mix(in srgb,var(--c) 38%,transparent)}
.csb:hover{opacity:.88;transform:translateY(-1px)}
.csb:disabled{opacity:.5;cursor:not-allowed;transform:none}
.css{text-align:center;padding:1.25rem;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:12px;color:#34d399;font-weight:600;font-size:.9rem;margin-top:1rem}
footer{background:#020617;padding:3rem 0;border-top:1px solid rgba(255,255,255,.06)}
.ft{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.25rem}
.fb{display:flex;flex-direction:column;gap:.35rem}
.fl2{font-weight:800;color:#fff;font-size:1rem;display:flex;align-items:center;gap:.5rem}
.fl2::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--c);flex-shrink:0}
.fs{color:#374151;font-size:.78rem}
.fc{color:#374151;font-size:.8rem}
.fc a{color:#6b7280;transition:color .15s}
.fc a:hover{color:#fff}
.rv{opacity:0;transform:translateY(28px);transition:opacity .55s ease,transform .55s ease;transition-delay:var(--di,0s)}
.rv.in{opacity:1;transform:none}
@media(max-width:920px){.ag{grid-template-columns:1fr;gap:3rem}.av{order:-1}.cg{grid-template-columns:1fr;gap:3rem}}
@media(max-width:640px){.nm{display:none}.nm.op{display:flex;flex-direction:column;align-items:flex-start;position:fixed;top:68px;left:0;right:0;bottom:0;background:rgba(255,255,255,.97);backdrop-filter:blur(24px);padding:2rem;gap:1.75rem;font-size:1.1rem;z-index:199}.nm.op a{color:#0f172a}.hm{display:flex}.cr{grid-template-columns:1fr}.hero h1{font-size:clamp(2rem,7vw,2.8rem)}.hst{display:none}.stg{grid-template-columns:1fr 1fr}}
@media(prefers-color-scheme:dark){body{background:#080c14;color:#f1f5f9}h2:not(.ow){color:#f1f5f9}.sec{background:#080c14}.alt{background:#0d1320}#nav{background:rgba(8,12,20,.92);border-color:rgba(255,255,255,.06)}.nm a:not(.nav-btn){color:#94a3b8}.sc{background:#111827;border-color:#1e293b}.sc h3{color:#f1f5f9}.sc p{color:#94a3b8}.sn{color:#374151}.at p{color:#94a3b8}.st{background:#111827;border-color:#1e293b}.stl{color:#64748b}.tb{background:#080c14;border-color:#1e293b}.tbi{color:#94a3b8;border-color:#1e293b}.fi{border-color:#1e293b}.fq{background:#111827;color:#f1f5f9}.fq:hover{background:#1e293b}.fa p{color:#94a3b8}.sh h2:not(.ow){color:#f1f5f9}.nm.op{background:rgba(8,12,20,.97)}.nm.op a{color:#f1f5f9}}
.wa-btn{position:fixed;bottom:1.75rem;right:1.75rem;z-index:990;width:58px;height:58px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(37,211,102,.45);transition:transform .2s,box-shadow .2s;color:#fff}
.wa-btn:hover{transform:scale(1.1) translateY(-2px);box-shadow:0 8px 40px rgba(37,211,102,.6)}`;

  /* ── JS ── */
  const js = `window.addEventListener('scroll',()=>{document.getElementById('nav').classList.toggle('sc',scrollY>8)},{passive:true});
const hm=document.querySelector('.hm'),nm=document.querySelector('.nm');
hm&&hm.addEventListener('click',()=>nm.classList.toggle('op'));
nm&&nm.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nm.classList.remove('op')));
function faqT(b){const fi=b.closest('.fi'),bd=b.nextElementSibling,isOpen=fi.classList.contains('open');document.querySelectorAll('.fi.open').forEach(el=>{el.classList.remove('open');el.querySelector('.fa').classList.remove('open')});if(!isOpen){fi.classList.add('open');bd.classList.add('open')}}
const obs=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&(e.target.classList.add('in'),obs.unobserve(e.target))),{threshold:.06,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.rv').forEach(el=>obs.observe(el));
const SITE_SLUG='${slug}';
(function(){const k='djv_'+SITE_SLUG,n=Date.now(),l=+localStorage.getItem(k)||0;if(n-l<1800000)return;localStorage.setItem(k,n);fetch('/api/site-builder/track',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"s":"'+SITE_SLUG+'"}',keepalive:true}).catch(()=>{})})();
const cf=document.getElementById('cform'),cs=document.getElementById('csuc');
cf&&cf.addEventListener('submit',async e=>{e.preventDefault();const sb=cf.querySelector('.csb');const ins=[...cf.querySelectorAll('input,textarea')];const body=JSON.stringify({slug:SITE_SLUG,name:ins[0]?.value,email:ins[1]?.value,phone:ins[2]?.value,message:ins[3]?.value});sb.disabled=true;sb.textContent='Envoi en cours…';try{const r=await fetch('/api/site-builder/contact',{method:'POST',headers:{'Content-Type':'application/json'},body});if(r.ok){sb.style.display='none';cs.hidden=false}else{sb.disabled=false;sb.textContent='Envoyer le message →'}}catch(err){console.error(err);sb.disabled=false;sb.textContent='Envoyer le message →'}});`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${bn} — ${esc(config.city || tpl.sector)}</title>
<meta name="description" content="${esc(config.description)}">
<link rel="canonical" href="${_url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:url" content="${_url}">
<meta property="og:title" content="${bn}">
<meta property="og:description" content="${esc(config.description)}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${bn}">
<meta name="twitter:description" content="${esc(config.description)}">
<meta name="twitter:image" content="${ogImg}">
<meta name="theme-color" content="${color}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>${css}</style>
</head>
<body>

<nav id="nav">
  <div class="ni">
    <a href="#accueil" class="nl">${bn}</a>
    <div class="nm" id="nm">${navLinks}</div>
    <button class="hm" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</nav>

${heroSection}
${trustBar}
${servicesSection}
${aboutSection}
${testiSection}
${faqSection}
${contactSection}

<footer>
  <div class="ct ft">
    <div class="fb">
      <span class="fl2">${bn}</span>
      <span class="fs">${config.city ? esc(config.city) + " et alentours" : esc(tpl.sector)}</span>
    </div>
    <p class="fc">Site créé avec <a href="https://djama.pro" target="_blank" rel="noopener">DJAMA Premium</a></p>
  </div>
</footer>

${waLink ? `<a href="${waLink}" class="wa-btn" target="_blank" rel="noopener noreferrer" aria-label="Nous contacter sur WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>` : ""}
<script>${js}</script>
</body>
</html>`;
}

function esc(str: string | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
