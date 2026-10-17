// Renderer HTML — génère le HTML statique d'une page pour la prévisualisation
import type { WebsitePage, WebsiteSection, WebsiteTheme, SectionStyles } from "./types";

// ── Utilitaires ───────────────────────────────────────────────────────────────

const PAD: Record<string, string> = {
  none: "0",  sm: "2rem",  md: "4rem",  lg: "6rem",  xl: "8rem",
};

function sectionPad(styles: SectionStyles): string {
  const top = PAD[styles.paddingTop ?? "md"];
  const bot = PAD[styles.paddingBot ?? "md"];
  return `padding-top:${top};padding-bottom:${bot};`;
}

function sectionBg(styles: SectionStyles, theme: WebsiteTheme): string {
  const bg = styles.bg ?? theme.bgColor;
  return `background:${bg};`;
}

function sectionColor(styles: SectionStyles, theme: WebsiteTheme): string {
  return `color:${styles.textColor ?? theme.textColor};`;
}

function sectionAlign(styles: SectionStyles): string {
  if (styles.fullWidth) return "";
  return `max-width:1200px;margin:0 auto;padding-left:1.5rem;padding-right:1.5rem;`;
}

function textAlign(styles: SectionStyles): string {
  return `text-align:${styles.alignment ?? "center"};`;
}

function btn(text: string, href: string, primary: boolean, theme: WebsiteTheme): string {
  if (!text || !href) return "";
  const bg = primary ? theme.primaryColor : "transparent";
  const color = primary ? "#fff" : theme.primaryColor;
  const border = `2px solid ${theme.primaryColor}`;
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  return `<a href="${href}" style="display:inline-block;padding:0.75rem 1.75rem;background:${bg};color:${color};border:${border};border-radius:${r};text-decoration:none;font-weight:600;margin:0.5rem;">${text}</a>`;
}

function stars(n: number): string {
  return "★".repeat(Math.min(5, n)) + "☆".repeat(Math.max(0, 5 - n));
}

// ── Renderers par type ────────────────────────────────────────────────────────

function renderNav(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { logo?: string; links?: { label: string; href: string }[]; ctaText?: string; ctaHref?: string; sticky?: boolean };
  const links = (p.links ?? []).map(l =>
    `<a href="${l.href}" style="color:inherit;text-decoration:none;font-weight:500;">${l.label}</a>`
  ).join("");
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const position = p.sticky ? "position:sticky;top:0;z-index:100;" : "";
  return `
<nav style="${position}background:${theme.bgColor};border-bottom:1px solid rgba(0,0,0,0.08);padding:1rem 1.5rem;">
  <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:2rem;">
    <span style="font-size:1.25rem;font-weight:700;color:${theme.primaryColor};">${p.logo || "Logo"}</span>
    <div style="display:flex;gap:1.5rem;align-items:center;">${links}</div>
    ${p.ctaText ? `<a href="${p.ctaHref ?? "#"}" style="background:${theme.primaryColor};color:#fff;padding:0.5rem 1.25rem;border-radius:${r};text-decoration:none;font-weight:600;">${p.ctaText}</a>` : ""}
  </div>
</nav>`;
}

function renderHero(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; subtitle?: string; cta1Text?: string; cta1Href?: string; cta2Text?: string; cta2Href?: string; imageUrl?: string; layout?: string };
  const s = sec.styles;
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}${textAlign(s)}">
    <h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;line-height:1.15;margin-bottom:1rem;">${p.title ?? ""}</h1>
    <p style="font-size:1.2rem;opacity:0.75;max-width:680px;margin:0 auto 2rem;">${p.subtitle ?? ""}</p>
    <div>${btn(p.cta1Text ?? "", p.cta1Href ?? "#", true, theme)}${btn(p.cta2Text ?? "", p.cta2Href ?? "#", false, theme)}</div>
    ${p.imageUrl ? `<img src="${p.imageUrl}" style="max-width:100%;margin-top:3rem;border-radius:1rem;" alt="" loading="lazy" />` : ""}
  </div>
</section>`;
}

function renderAbout(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; content?: string; imageUrl?: string; layout?: string };
  const s = sec.styles;
  const reverse = p.layout === "image-right" ? "row-reverse" : "row";
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}display:flex;flex-wrap:wrap;gap:3rem;align-items:center;flex-direction:${reverse};">
    ${p.imageUrl ? `<img src="${p.imageUrl}" style="width:45%;min-width:280px;border-radius:1rem;flex:1;" alt="" loading="lazy" />` : ""}
    <div style="flex:1;min-width:280px;">
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:1rem;color:${theme.primaryColor};">${p.title ?? ""}</h2>
      <p style="line-height:1.8;opacity:0.85;">${p.content ?? ""}</p>
    </div>
  </div>
</section>`;
}

function renderServices(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; subtitle?: string; items?: { title: string; desc: string; price?: string }[]; columns?: number };
  const s = sec.styles;
  const cols = Math.min(4, p.columns ?? 3);
  const cards = (p.items ?? []).map(item => `
    <div style="background:${theme.bgColor};border:1px solid rgba(0,0,0,0.08);border-radius:1rem;padding:1.75rem;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <h3 style="font-weight:700;font-size:1.1rem;margin-bottom:0.5rem;">${item.title}</h3>
      <p style="opacity:0.75;line-height:1.6;">${item.desc}</p>
      ${item.price ? `<p style="font-weight:700;color:${theme.primaryColor};margin-top:1rem;">${item.price}</p>` : ""}
    </div>`).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    <div style="${textAlign(s)}margin-bottom:3rem;">
      <h2 style="font-size:2rem;font-weight:700;color:${theme.primaryColor};">${p.title ?? ""}</h2>
      ${p.subtitle ? `<p style="opacity:0.7;margin-top:0.5rem;">${p.subtitle}</p>` : ""}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;">${cards}</div>
  </div>
</section>`;
}

function renderFeatures(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; subtitle?: string; items?: { title: string; desc: string }[] };
  const s = sec.styles;
  const items = (p.items ?? []).map(item => `
    <div style="display:flex;gap:1rem;align-items:flex-start;">
      <div style="width:40px;height:40px;background:${theme.primaryColor};border-radius:0.5rem;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex-shrink:0;">✓</div>
      <div>
        <h3 style="font-weight:700;margin-bottom:0.25rem;">${item.title}</h3>
        <p style="opacity:0.7;line-height:1.6;">${item.desc}</p>
      </div>
    </div>`).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    <div style="${textAlign(s)}margin-bottom:3rem;">
      <h2 style="font-size:2rem;font-weight:700;color:${theme.primaryColor};">${p.title ?? ""}</h2>
      ${p.subtitle ? `<p style="opacity:0.7;margin-top:0.5rem;">${p.subtitle}</p>` : ""}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;">${items}</div>
  </div>
</section>`;
}

function renderTestimonials(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; items?: { name: string; role?: string; rating?: number; text: string }[] };
  const s = sec.styles;
  const cards = (p.items ?? []).map(t => `
    <div style="background:${theme.bgColor};border:1px solid rgba(0,0,0,0.08);border-radius:1rem;padding:1.75rem;">
      <p style="color:${theme.accentColor ?? "#F59E0B"};font-size:1.2rem;">${stars(t.rating ?? 5)}</p>
      <p style="line-height:1.7;margin:1rem 0;font-style:italic;">"${t.text}"</p>
      <p style="font-weight:700;">${t.name}${t.role ? ` — <span style="opacity:0.6;font-weight:400;">${t.role}</span>` : ""}</p>
    </div>`).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    <h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:3rem;color:${theme.primaryColor};">${p.title ?? ""}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;">${cards}</div>
  </div>
</section>`;
}

function renderFaq(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; items?: { q: string; a: string }[] };
  const s = sec.styles;
  const items = (p.items ?? []).map((item, i) => `
    <details style="border:1px solid rgba(0,0,0,0.1);border-radius:0.75rem;padding:1.25rem 1.5rem;margin-bottom:0.75rem;">
      <summary style="font-weight:600;cursor:pointer;list-style:none;display:flex;justify-content:space-between;">${item.q} <span>▾</span></summary>
      <p style="margin-top:1rem;opacity:0.8;line-height:1.7;">${item.a}</p>
    </details>`).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}max-width:800px;margin:0 auto;">
    <h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:3rem;color:${theme.primaryColor};">${p.title ?? ""}</h2>
    ${items}
  </div>
</section>`;
}

function renderPricing(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; subtitle?: string; plans?: { name: string; price: string; period?: string; desc?: string; features?: string[]; cta?: string; popular?: boolean }[] };
  const s = sec.styles;
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const cards = (p.plans ?? []).map(plan => `
    <div style="border:2px solid ${plan.popular ? theme.primaryColor : "rgba(0,0,0,0.1)"};border-radius:1.5rem;padding:2rem;position:relative;${plan.popular ? `box-shadow:0 8px 24px rgba(0,0,0,0.12);` : ""}">
      ${plan.popular ? `<div style="position:absolute;top:-1rem;left:50%;transform:translateX(-50%);background:${theme.primaryColor};color:#fff;padding:0.25rem 1rem;border-radius:9999px;font-size:0.8rem;font-weight:700;">Populaire</div>` : ""}
      <h3 style="font-weight:700;font-size:1.2rem;">${plan.name}</h3>
      ${plan.desc ? `<p style="opacity:0.6;margin:0.5rem 0;">${plan.desc}</p>` : ""}
      <p style="font-size:2.5rem;font-weight:800;margin:1rem 0;color:${theme.primaryColor};">${plan.price}<span style="font-size:1rem;font-weight:400;opacity:0.6;">${plan.period ?? ""}</span></p>
      <ul style="list-style:none;padding:0;margin:1.5rem 0;">${(plan.features ?? []).map(f => `<li style="padding:0.4rem 0;display:flex;gap:0.5rem;"><span style="color:${theme.primaryColor};">✓</span>${f}</li>`).join("")}</ul>
      ${plan.cta ? `<a href="/contact" style="display:block;text-align:center;background:${plan.popular ? theme.primaryColor : "transparent"};color:${plan.popular ? "#fff" : theme.primaryColor};border:2px solid ${theme.primaryColor};padding:0.75rem;border-radius:${r};text-decoration:none;font-weight:600;">${plan.cta}</a>` : ""}
    </div>`).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    <div style="${textAlign(s)}margin-bottom:3rem;">
      <h2 style="font-size:2rem;font-weight:700;color:${theme.primaryColor};">${p.title ?? ""}</h2>
      ${p.subtitle ? `<p style="opacity:0.7;margin-top:0.5rem;">${p.subtitle}</p>` : ""}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;">${cards}</div>
  </div>
</section>`;
}

function renderStats(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { items?: { value: string; label: string }[] };
  const s = sec.styles;
  const items = (p.items ?? []).map(item => `
    <div style="${textAlign(s)}">
      <p style="font-size:3rem;font-weight:800;color:${theme.primaryColor};">${item.value}</p>
      <p style="opacity:0.7;">${item.label}</p>
    </div>`).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:2rem;">${items}</div>
</section>`;
}

function renderTeam(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; subtitle?: string; members?: { name: string; role?: string; bio?: string; imageUrl?: string }[] };
  const s = sec.styles;
  const cards = (p.members ?? []).map(m => `
    <div style="${textAlign(s)}">
      ${m.imageUrl ? `<img src="${m.imageUrl}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin:0 auto 1rem;" alt="${m.name}" />` : `<div style="width:100px;height:100px;border-radius:50%;background:${theme.primaryColor};margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem;font-weight:700;">${m.name.charAt(0)}</div>`}
      <h3 style="font-weight:700;">${m.name}</h3>
      ${m.role ? `<p style="color:${theme.primaryColor};font-weight:500;">${m.role}</p>` : ""}
      ${m.bio ? `<p style="opacity:0.7;margin-top:0.5rem;line-height:1.6;">${m.bio}</p>` : ""}
    </div>`).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    <div style="${textAlign(s)}margin-bottom:3rem;">
      <h2 style="font-size:2rem;font-weight:700;color:${theme.primaryColor};">${p.title ?? ""}</h2>
      ${p.subtitle ? `<p style="opacity:0.7;margin-top:0.5rem;">${p.subtitle}</p>` : ""}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2rem;">${cards}</div>
  </div>
</section>`;
}

function renderCta(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; subtitle?: string; cta1Text?: string; cta1Href?: string; cta2Text?: string; cta2Href?: string };
  const s = sec.styles;
  return `
<section style="background:${theme.primaryColor};color:#fff;${sectionPad(s)}">
  <div style="${sectionAlign(s)}${textAlign(s)}">
    <h2 style="font-size:2.5rem;font-weight:800;margin-bottom:1rem;">${p.title ?? ""}</h2>
    ${p.subtitle ? `<p style="opacity:0.85;font-size:1.1rem;margin-bottom:2rem;">${p.subtitle}</p>` : ""}
    <div>
      ${p.cta1Text ? `<a href="${p.cta1Href ?? "#"}" style="display:inline-block;background:#fff;color:${theme.primaryColor};padding:0.75rem 2rem;border-radius:0.5rem;text-decoration:none;font-weight:700;margin:0.5rem;">${p.cta1Text}</a>` : ""}
      ${p.cta2Text ? `<a href="${p.cta2Href ?? "#"}" style="display:inline-block;border:2px solid rgba(255,255,255,0.6);color:#fff;padding:0.75rem 2rem;border-radius:0.5rem;text-decoration:none;font-weight:700;margin:0.5rem;">${p.cta2Text}</a>` : ""}
    </div>
  </div>
</section>`;
}

function renderContact(sec: WebsiteSection, theme: WebsiteTheme, websiteId: string): string {
  const p = sec.props as { title?: string; subtitle?: string; formFields?: string[] };
  const s = sec.styles;
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const fields = (p.formFields ?? ["name","email","message"]).map(f => {
    const label = f === "name" ? "Nom" : f === "email" ? "E-mail" : f === "phone" ? "Téléphone" : "Message";
    const base = `padding:0.75rem;border:1px solid rgba(0,0,0,0.2);border-radius:${r};font-family:inherit;width:100%;font-size:0.95rem;`;
    if (f === "message") return `<textarea name="${f}" placeholder="${label}" rows="4" style="${base}resize:vertical;"></textarea>`;
    return `<input type="${f === "email" ? "email" : "text"}" name="${f}" placeholder="${label} ${["name","email"].includes(f) ? "*" : ""}" style="${base}" ${["name","email"].includes(f) ? "required" : ""} />`;
  }).join("");

  // Si websiteId fourni → vrai AJAX vers /api/websites/[id]/contact
  const submitHandler = websiteId
    ? `(function(e){e.preventDefault();var btn=e.target.querySelector('button[type=submit]'),f=e.target;btn.disabled=true;btn.textContent='Envoi…';var d={};f.querySelectorAll('[name]').forEach(function(i){d[i.name]=i.value});fetch('/api/websites/${websiteId}/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(j){if(j.ok){f.innerHTML='<div style=\\'text-align:center;padding:2rem;\\'><div style=\\'font-size:2.5rem;margin-bottom:0.75rem;\\'>✅</div><p style=\\'font-weight:700;margin:0;\\'>Message envoyé !</p><p style=\\'opacity:0.6;margin-top:0.5rem;\\'>Nous vous répondons sous 24h.</p></div>'}else{btn.disabled=false;btn.textContent='Envoyer';alert(j.error||'Erreur');}}).catch(function(){btn.disabled=false;btn.textContent='Envoyer';alert('Erreur réseau');})})(event)`
    : `event.preventDefault();alert('Formulaire actif après publication.')`;

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}max-width:600px;margin:0 auto;">
    <h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:0.5rem;color:${theme.primaryColor};">${p.title ?? ""}</h2>
    ${p.subtitle ? `<p style="${textAlign(s)}opacity:0.7;margin-bottom:2rem;">${p.subtitle}</p>` : ""}
    <form style="display:flex;flex-direction:column;gap:1rem;" onsubmit="${submitHandler}">
      ${fields}
      <button type="submit" style="background:${theme.primaryColor};color:#fff;border:none;padding:0.85rem;border-radius:${r};font-weight:700;font-size:1rem;cursor:pointer;">Envoyer</button>
    </form>
  </div>
</section>`;
}

function renderGallery(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; images?: string[]; columns?: number };
  const s = sec.styles;
  const imgs = (p.images ?? []).map(src =>
    `<img src="${src}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:0.5rem;" alt="" />`
  ).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:3rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;">${imgs || '<p style="opacity:0.5;text-align:center;padding:3rem;">Galerie vide — ajoutez des images</p>'}</div>
  </div>
</section>`;
}

function renderLogos(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; logos?: string[]; grayscale?: boolean };
  const s = sec.styles;
  const logos = (p.logos ?? []).map(src =>
    `<img src="${src}" style="max-height:48px;object-fit:contain;${p.grayscale ? "filter:grayscale(1);opacity:0.6;" : ""}" alt="" />`
  ).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}padding:3rem 1.5rem;">
  <div style="${sectionAlign(s)}text-align:center;">
    ${p.title ? `<p style="opacity:0.5;font-size:0.85rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:2rem;">${p.title}</p>` : ""}
    <div style="display:flex;flex-wrap:wrap;gap:2rem;justify-content:center;align-items:center;">${logos || '<p style="opacity:0.5;">Ajoutez vos logos partenaires</p>'}</div>
  </div>
</section>`;
}

function renderRichText(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { content?: string };
  const s = sec.styles;
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}max-width:800px;margin:0 auto;line-height:1.8;">${p.content ?? ""}</div>
</section>`;
}

function renderVideo(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { title?: string; url?: string };
  const s = sec.styles;
  const embedUrl = (p.url ?? "").replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}max-width:900px;margin:0 auto;">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:2rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${embedUrl ? `<div style="position:relative;padding-bottom:56.25%;"><iframe src="${embedUrl}" style="position:absolute;inset:0;width:100%;height:100%;border:none;border-radius:1rem;" allowfullscreen></iframe></div>` : `<div style="background:rgba(0,0,0,0.1);border-radius:1rem;height:300px;display:flex;align-items:center;justify-content:center;opacity:0.5;">▶ Vidéo</div>`}
  </div>
</section>`;
}

function renderDivider(sec: WebsiteSection, theme: WebsiteTheme): string {
  return `<hr style="border:none;border-top:1px solid rgba(0,0,0,0.1);margin:2rem 0;" />`;
}

function renderSpacer(sec: WebsiteSection): string {
  const p = sec.props as { height?: number };
  return `<div style="height:${p.height ?? 60}px;"></div>`;
}

// ── Footer (Jalon G) ─────────────────────────────────────────────────────────

const SOCIAL_SVG: Record<string, string> = {
  facebook:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>`,
  instagram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  twitter:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  linkedin:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>`,
  youtube:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon fill="#fff" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`,
  tiktok:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.07a8.16 8.16 0 004.77 1.52V7.14a4.85 4.85 0 01-1-.45z"/></svg>`,
};

function renderFooter(sec: WebsiteSection, theme: WebsiteTheme, websiteId: string): string {
  const p = sec.props as {
    logo?:        string;
    logoText?:    string;
    description?: string;
    columns?:     Array<{ title: string; links: Array<{ label: string; href: string }> }>;
    social?:      Record<string, string>;
    copyright?:   string;
    newsletter?:  boolean;
  };
  const s = sec.styles;
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const bgColor = s.bg ?? (theme.darkMode ? "#111827" : "#1F2937");
  const textColor = "#e5e7eb";
  const year = new Date().getFullYear();

  const logoHtml = p.logo
    ? `<img src="${p.logo}" style="max-height:40px;margin-bottom:0.75rem;" alt="${p.logoText ?? ""}" />`
    : p.logoText
    ? `<div style="font-size:1.25rem;font-weight:800;color:#fff;margin-bottom:0.75rem;">${p.logoText}</div>`
    : "";

  const cols = (p.columns ?? []).map(col => `
    <div>
      <h4 style="color:#fff;font-size:0.875rem;font-weight:700;margin:0 0 1rem;text-transform:uppercase;letter-spacing:0.08em;">${col.title}</h4>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem;">
        ${(col.links ?? []).map(l => `<li><a href="${l.href}" style="color:${textColor};text-decoration:none;font-size:0.875rem;opacity:0.75;transition:opacity 0.15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.75'">${l.label}</a></li>`).join("")}
      </ul>
    </div>`).join("");

  const socialLinks = Object.entries(p.social ?? {})
    .filter(([, url]) => url)
    .map(([net, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:${textColor};opacity:0.65;transition:opacity 0.15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'" aria-label="${net}">${SOCIAL_SVG[net] ?? net}</a>`)
    .join("");

  const newsletterHtml = p.newsletter ? `
    <div style="margin-top:1.25rem;">
      <p style="font-size:0.8rem;font-weight:600;color:${textColor};opacity:0.75;margin:0 0 0.5rem;">Newsletter</p>
      <form onsubmit="(function(e){e.preventDefault();var i=e.target.querySelector('input'),btn=e.target.querySelector('button');btn.disabled=true;fetch('/api/websites/${websiteId}/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Abonné',email:i.value,__type:'newsletter'})}).then(function(r){return r.json()}).then(function(){e.target.innerHTML='<span style=\\'font-size:0.8rem;color:#6EE7B7;\\'>✓ Merci !</span>'}).catch(function(){btn.disabled=false})})(event)" style="display:flex;gap:0.5rem;">
        <input type="email" placeholder="Votre e-mail" required style="flex:1;padding:0.5rem 0.75rem;border:1px solid rgba(255,255,255,0.2);border-radius:${r};background:rgba(255,255,255,0.08);color:#fff;font-size:0.875rem;min-width:0;" />
        <button type="submit" style="background:${theme.primaryColor};color:#fff;border:none;padding:0.5rem 1rem;border-radius:${r};font-weight:600;font-size:0.875rem;cursor:pointer;white-space:nowrap;">OK</button>
      </form>
    </div>` : "";

  const hasCols = (p.columns ?? []).length > 0;

  return `
<footer style="background:${bgColor};color:${textColor};padding:3rem 1.5rem 1.5rem;">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:${hasCols ? `1fr ${(p.columns ?? []).map(() => "1fr").join(" ")}` : "1fr"};gap:3rem;margin-bottom:2.5rem;">
      <div>
        ${logoHtml}
        ${p.description ? `<p style="font-size:0.875rem;opacity:0.65;line-height:1.7;margin:0;">${p.description}</p>` : ""}
        ${socialLinks ? `<div style="display:flex;gap:0.875rem;margin-top:1.25rem;align-items:center;">${socialLinks}</div>` : ""}
        ${newsletterHtml}
      </div>
      ${cols}
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:1.25rem;display:flex;align-items:center;justify-content:center;">
      <p style="font-size:0.78rem;opacity:0.4;margin:0;text-align:center;">${p.copyright ?? `© ${year} — Tous droits réservés`}</p>
    </div>
  </div>
</footer>`;
}

// ── Newsletter (Jalon G) ──────────────────────────────────────────────────────

function renderNewsletter(sec: WebsiteSection, theme: WebsiteTheme, websiteId: string): string {
  const p = sec.props as {
    title?:          string;
    subtitle?:       string;
    placeholder?:    string;
    buttonText?:     string;
    successMessage?: string;
  };
  const s = sec.styles;
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];

  const submitHandler = websiteId
    ? `(function(e){e.preventDefault();var i=e.target.querySelector('input[type=email]'),btn=e.target.querySelector('button');btn.disabled=true;btn.textContent='…';fetch('/api/websites/${websiteId}/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Abonné',email:i.value,__type:'newsletter'})}).then(function(r){return r.json()}).then(function(j){if(j.ok){e.target.closest('.nl-wrap').innerHTML='<div style=\\'text-align:center;padding:1.5rem;\\'><div style=\\'font-size:2rem;margin-bottom:0.5rem;\\'>✅</div><p style=\\'font-weight:700;margin:0;\\'>${p.successMessage ?? "Merci pour votre inscription !"}</p></div>'}else{btn.disabled=false;btn.textContent='${p.buttonText ?? "S'inscrire"}'}}).catch(function(){btn.disabled=false;btn.textContent='${p.buttonText ?? "S'inscrire"}'})})(event)`
    : `event.preventDefault();alert('Newsletter active après publication.')`;

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div class="nl-wrap" style="${sectionAlign(s)}max-width:560px;margin:0 auto;text-align:center;">
    ${p.title ? `<h2 style="font-size:2rem;font-weight:700;margin-bottom:0.5rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="opacity:0.65;margin-bottom:1.75rem;">${p.subtitle}</p>` : ""}
    <form onsubmit="${submitHandler}" style="display:flex;gap:0.5rem;max-width:440px;margin:0 auto;">
      <input type="email" placeholder="${p.placeholder ?? "Votre adresse e-mail"}" required
        style="flex:1;padding:0.75rem 1rem;border:1px solid rgba(0,0,0,0.2);border-radius:${r};font-family:inherit;font-size:0.95rem;min-width:0;" />
      <button type="submit" style="background:${theme.primaryColor};color:#fff;border:none;padding:0.75rem 1.5rem;border-radius:${r};font-weight:700;font-size:0.95rem;cursor:pointer;white-space:nowrap;">${p.buttonText ?? "S'inscrire"}</button>
    </form>
  </div>
</section>`;
}

// ── Countdown (Jalon G) ───────────────────────────────────────────────────────

function renderCountdown(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:       string;
    subtitle?:    string;
    targetDate?:  string;
    expiredLabel?: string;
    showSeconds?: boolean;
  };
  const s = sec.styles;
  const id = `cd_${sec.id.replace(/-/g, "")}`;
  const target = p.targetDate ?? "";
  const showSec = p.showSeconds !== false;

  const box = (unit: string, labelFr: string, elId: string) => `
    <div style="text-align:center;min-width:80px;">
      <div id="${elId}" style="font-size:3.5rem;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;color:${theme.primaryColor};">00</div>
      <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;opacity:0.55;margin-top:0.25rem;">${labelFr}</div>
    </div>`;

  const sep = `<div style="font-size:3rem;font-weight:800;opacity:0.3;padding:0 0.25rem;line-height:1;align-self:flex-start;padding-top:0.1rem;">:</div>`;

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}text-align:center;">
    ${p.title ? `<h2 style="font-size:2rem;font-weight:700;margin-bottom:0.5rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="opacity:0.65;margin-bottom:2rem;">${p.subtitle}</p>` : ""}
    <div id="${id}" style="display:inline-flex;align-items:center;gap:0.5rem;flex-wrap:wrap;justify-content:center;">
      ${box("days", "Jours", `${id}_d`)}${sep}
      ${box("hours", "Heures", `${id}_h`)}${sep}
      ${box("minutes", "Minutes", `${id}_m`)}
      ${showSec ? `${sep}${box("seconds", "Secondes", `${id}_s`)}` : ""}
    </div>
    <div id="${id}_exp" style="display:none;font-size:1.5rem;font-weight:700;color:${theme.primaryColor};">${p.expiredLabel ?? "Événement terminé"}</div>
  </div>
</section>
<script>
(function(){
  var target=${target ? JSON.stringify(new Date(target).getTime()) : "0"};
  if(!target){return;}
  function pad(n){return String(n).padStart(2,'0');}
  function tick(){
    var diff=Math.max(0,target-Date.now());
    var d=Math.floor(diff/86400000);
    var h=Math.floor((diff%86400000)/3600000);
    var m=Math.floor((diff%3600000)/60000);
    var sec=Math.floor((diff%60000)/1000);
    var eld=document.getElementById('${id}_d');
    var elh=document.getElementById('${id}_h');
    var elm=document.getElementById('${id}_m');
    var els=document.getElementById('${id}_s');
    var exp=document.getElementById('${id}_exp');
    if(diff===0&&exp){document.getElementById('${id}').style.display='none';exp.style.display='block';return;}
    if(eld)eld.textContent=pad(d);
    if(elh)elh.textContent=pad(h);
    if(elm)elm.textContent=pad(m);
    if(els)els.textContent=pad(sec);
    setTimeout(tick,1000);
  }
  tick();
})();
</script>`;
}

// ── Formulaire avancé (Jalon F) ───────────────────────────────────────────────

interface CustomFormField {
  id:          string;
  type:        "text" | "email" | "tel" | "number" | "textarea" | "select" | "radio" | "checkbox";
  label:       string;
  placeholder?: string;
  required?:   boolean;
  options?:    string[];
}

function renderCustomForm(sec: WebsiteSection, theme: WebsiteTheme, websiteId: string): string {
  const p = sec.props as {
    title?:          string;
    subtitle?:       string;
    fields?:         CustomFormField[];
    submitText?:     string;
    successMessage?: string;
    formId?:         string;
  };
  const s = sec.styles;
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const baseInput = `padding:0.75rem;border:1px solid rgba(0,0,0,0.2);border-radius:${r};font-family:inherit;width:100%;font-size:0.95rem;box-sizing:border-box;`;

  const fields = (p.fields ?? []).map(f => {
    const label = `<label style="font-weight:600;font-size:0.875rem;margin-bottom:0.25rem;display:block;">${f.label}${f.required ? " *" : ""}</label>`;
    let input = "";
    if (f.type === "textarea") {
      input = `<textarea name="${f.id}" placeholder="${f.placeholder ?? ""}" rows="4" style="${baseInput}resize:vertical;" ${f.required ? "required" : ""}></textarea>`;
    } else if (f.type === "select") {
      const opts = (f.options ?? []).map(o => `<option value="${o}">${o}</option>`).join("");
      input = `<select name="${f.id}" style="${baseInput}" ${f.required ? "required" : ""}><option value="">-- Choisir --</option>${opts}</select>`;
    } else if (f.type === "radio") {
      input = (f.options ?? []).map(o =>
        `<label style="display:flex;align-items:center;gap:0.5rem;font-weight:normal;cursor:pointer;"><input type="radio" name="${f.id}" value="${o}" ${f.required ? "required" : ""} /> ${o}</label>`
      ).join("");
    } else if (f.type === "checkbox") {
      input = `<label style="display:flex;align-items:center;gap:0.5rem;font-weight:normal;cursor:pointer;"><input type="checkbox" name="${f.id}" ${f.required ? "required" : ""} /> ${f.placeholder ?? f.label}</label>`;
    } else {
      input = `<input type="${f.type}" name="${f.id}" placeholder="${f.placeholder ?? ""}" style="${baseInput}" ${f.required ? "required" : ""} />`;
    }
    return `<div style="display:flex;flex-direction:column;gap:0.25rem;">${label}${input}</div>`;
  }).join("");

  const formId = p.formId ?? sec.id ?? "form";
  const submitHandler = websiteId
    ? `(function(e){e.preventDefault();var btn=e.target.querySelector('button[type=submit]'),f=e.target;btn.disabled=true;btn.textContent='Envoi…';var d={__formId:'${formId}'};f.querySelectorAll('[name]').forEach(function(i){if(i.type==='checkbox'){d[i.name]=i.checked}else if(i.type==='radio'){if(i.checked)d[i.name]=i.value}else{d[i.name]=i.value}});fetch('/api/websites/${websiteId}/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(j){if(j.ok){f.innerHTML='<div style=\\'text-align:center;padding:2rem;\\'><div style=\\'font-size:2.5rem;margin-bottom:0.75rem;\\'>✅</div><p style=\\'font-weight:700;margin:0;\\'>Merci !</p><p style=\\'opacity:0.6;margin-top:0.5rem;\\'>${p.successMessage ?? "Votre message a bien été envoyé."}</p></div>'}else{btn.disabled=false;btn.textContent='${p.submitText ?? "Envoyer"}';alert(j.error||'Erreur');}}).catch(function(){btn.disabled=false;btn.textContent='${p.submitText ?? "Envoyer"}';alert('Erreur réseau');})})(event)`
    : `event.preventDefault();alert('Formulaire actif après publication.')`;

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}max-width:640px;margin:0 auto;">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:0.5rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="${textAlign(s)}opacity:0.7;margin-bottom:2rem;">${p.subtitle}</p>` : ""}
    <form style="display:flex;flex-direction:column;gap:1rem;" onsubmit="${submitHandler}">
      ${fields || '<p style="opacity:0.5;text-align:center;padding:2rem;">Ajoutez des champs à votre formulaire</p>'}
      <input name="website" type="text" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0;width:1px;height:1px;" aria-hidden="true" />
      <button type="submit" style="background:${theme.primaryColor};color:#fff;border:none;padding:0.85rem;border-radius:${r};font-weight:700;font-size:1rem;cursor:pointer;">${p.submitText ?? "Envoyer"}</button>
    </form>
  </div>
</section>`;
}

// ── Popup (Jalon F) ────────────────────────────────────────────────────────────

function renderPopup(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:    string;
    content?:  string;
    trigger?:  "delay" | "scroll" | "exit";
    delay?:    number;
    scroll?:   number;
    ctaText?:  string;
    ctaHref?:  string;
    showOnce?: boolean;
  };
  const r  = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const id = `popup_${sec.id}`;

  const triggerScript = p.trigger === "scroll"
    ? `window.addEventListener('scroll',function(){if(window.scrollY/document.body.scrollHeight>=${(p.scroll ?? 50) / 100})show()},{once:true});`
    : p.trigger === "exit"
    ? `document.addEventListener('mouseleave',function(e){if(e.clientY<=0)show()},{once:true});`
    : `setTimeout(show,${(p.delay ?? 5) * 1000});`;

  const onceKey = `djama_popup_${id}`;

  return `
<div id="${id}" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;padding:1rem;">
  <div style="background:#fff;color:#111;border-radius:${r};padding:2rem;max-width:480px;width:100%;position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.3);">
    <button onclick="document.getElementById('${id}').style.display='none'" style="position:absolute;top:0.75rem;right:0.75rem;background:none;border:none;cursor:pointer;font-size:1.5rem;opacity:0.4;line-height:1;" aria-label="Fermer">×</button>
    ${p.title ? `<h3 style="font-size:1.5rem;font-weight:700;margin:0 0 0.75rem;color:${theme.primaryColor};">${p.title}</h3>` : ""}
    ${p.content ? `<p style="line-height:1.7;opacity:0.8;margin:0 0 1.5rem;">${p.content}</p>` : ""}
    ${p.ctaText && p.ctaHref ? `<a href="${p.ctaHref}" style="display:inline-block;background:${theme.primaryColor};color:#fff;padding:0.75rem 2rem;border-radius:${r};text-decoration:none;font-weight:700;">${p.ctaText}</a>` : ""}
  </div>
</div>
<script>
(function(){
  var id='${id}',once=${p.showOnce ? "true" : "false"},key='${onceKey}';
  function show(){
    if(once&&localStorage.getItem(key))return;
    var el=document.getElementById(id);
    el.style.display='flex';
    if(once)localStorage.setItem(key,'1');
  }
  ${triggerScript}
})();
</script>`;
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function renderTimeline(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:  string;
    layout?: "alternating" | "left";
    items?:  { id: string; date: string; title: string; content: string }[];
  };
  const s      = sec.styles;
  const r      = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const items  = p.items ?? [];
  const isAlt  = p.layout !== "left";

  if (!items.length) return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}${textAlign(s)}"><p style="opacity:0.4;">Ajoutez des événements à la chronologie</p></div>
</section>`;

  const rows = items.map((item, i) => {
    const isRight = isAlt && i % 2 === 0;
    const card = `<div style="background:${theme.bgColor};border:1px solid ${theme.primaryColor}22;border-radius:${r};padding:1.25rem 1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.06);max-width:420px;${isAlt ? (isRight ? "margin-left:auto;" : "margin-right:auto;") : ""}"><p style="font-size:0.78rem;font-weight:700;color:${theme.primaryColor};margin:0 0 0.4rem;text-transform:uppercase;letter-spacing:0.08em;">${item.date}</p><h3 style="font-weight:700;font-size:1.05rem;margin:0 0 0.5rem;color:${theme.textColor};">${item.title}</h3><p style="opacity:0.7;line-height:1.6;margin:0;font-size:0.9rem;">${item.content}</p></div>`;
    const dot = `<div style="position:absolute;left:50%;transform:translateX(-50%);width:14px;height:14px;background:${theme.primaryColor};border-radius:50%;top:50%;transform:translate(-50%,-50%);border:3px solid ${theme.bgColor};box-shadow:0 0 0 2px ${theme.primaryColor};"></div>`;

    if (isAlt) {
      return `<div style="position:relative;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;padding:0.75rem 0;">
      ${dot}
      ${isRight ? `<div></div>${card}` : `${card}<div></div>`}
    </div>`;
    } else {
      return `<div style="position:relative;display:grid;grid-template-columns:40px 1fr;gap:1.5rem;align-items:flex-start;padding:0.75rem 0;">
      <div style="display:flex;flex-direction:column;align-items:center;padding-top:0.25rem;"><div style="width:14px;height:14px;background:${theme.primaryColor};border-radius:50%;border:3px solid ${theme.bgColor};box-shadow:0 0 0 2px ${theme.primaryColor};flex-shrink:0;"></div>${i < items.length - 1 ? `<div style="flex:1;width:2px;background:${theme.primaryColor}30;margin-top:0.4rem;min-height:40px;"></div>` : ""}</div>
      ${card}
    </div>`;
    }
  }).join("\n");

  const lineStyle = isAlt ? `position:absolute;left:50%;transform:translateX(-50%);top:0;bottom:0;width:2px;background:${theme.primaryColor}30;` : "";

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:3rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    <div style="position:relative;${isAlt ? "max-width:900px;margin:0 auto;" : ""}">
      ${isAlt ? `<div style="${lineStyle}"></div>` : ""}
${rows}
    </div>
  </div>
</section>`;
}

// ── Comparison ────────────────────────────────────────────────────────────────

function renderComparison(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:    string;
    subtitle?: string;
    features?: string[];
    plans?:    { name: string; values: unknown[]; highlighted?: boolean }[];
  };
  const s        = sec.styles;
  const r        = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const features = p.features ?? [];
  const plans    = p.plans    ?? [];

  const valCell = (v: unknown, bg?: string) => {
    const base = `${bg ? `background:${bg};` : ""}text-align:center;padding:0.85rem 1rem;`;
    if (v === true)  return `<td style="${base}font-size:1.1rem;color:#10B981;">✓</td>`;
    if (v === false) return `<td style="${base}font-size:1rem;opacity:0.3;">✕</td>`;
    return `<td style="${base}font-size:0.875rem;font-weight:600;">${String(v ?? "")}</td>`;
  };

  const thead = `<tr><th style="padding:1rem;text-align:left;font-size:0.8rem;font-weight:700;opacity:0.5;text-transform:uppercase;letter-spacing:0.07em;">Fonctionnalité</th>${plans.map(pl => `<th style="padding:1rem;text-align:center;font-size:1rem;font-weight:800;color:${pl.highlighted ? "#fff" : theme.textColor};background:${pl.highlighted ? theme.primaryColor : "transparent"};border-radius:${r} ${r} 0 0;">${pl.name}${pl.highlighted ? `<br/><span style="font-size:0.7rem;font-weight:600;opacity:0.85;display:block;margin-top:0.2rem;">⭐ Populaire</span>` : ""}</th>`).join("")}</tr>`;
  const tbody = features.map((feat, fi) => `<tr style="border-top:1px solid ${theme.primaryColor}15;"><td style="padding:0.85rem 1rem;font-size:0.9rem;font-weight:500;">${feat}</td>${plans.map(pl => valCell((pl.values ?? [])[fi], pl.highlighted ? `${theme.primaryColor}08` : undefined)).join("")}</tr>`).join("");

  const tfoot = `<tr style="border-top:2px solid ${theme.primaryColor}20;"><td></td>${plans.map(pl => `<td style="padding:1.25rem 1rem;text-align:center;background:${pl.highlighted ? theme.primaryColor : "transparent"};border-radius:0 0 ${r} ${r};"><a href="/contact" style="display:inline-block;padding:0.6rem 1.5rem;background:${pl.highlighted ? "#fff" : theme.primaryColor};color:${pl.highlighted ? theme.primaryColor : "#fff"};border-radius:${r};text-decoration:none;font-weight:700;font-size:0.875rem;">Choisir</a></td>`).join("")}</tr>`;

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:0.75rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="${textAlign(s)}opacity:0.65;margin-bottom:2.5rem;">${p.subtitle}</p>` : ""}
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
      <table style="width:100%;border-collapse:collapse;min-width:480px;">
        <thead>${thead}</thead>
        <tbody>${tbody}</tbody>
        <tfoot>${tfoot}</tfoot>
      </table>
    </div>
  </div>
</section>`;
}

// ── Alert Bar ─────────────────────────────────────────────────────────────────

function renderAlertBar(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    text?:      string;
    ctaText?:   string;
    ctaHref?:   string;
    closeable?: boolean;
    bgColor?:   string;
  };
  const bg  = p.bgColor || theme.primaryColor;
  const uid = `alert_${sec.id.replace(/-/g, "")}`;

  return `
<div id="${uid}" style="background:${bg};color:#fff;padding:0.6rem 1.5rem;display:flex;align-items:center;justify-content:center;gap:1rem;flex-wrap:wrap;font-size:0.875rem;font-weight:500;position:relative;z-index:100;">
  <span>${p.text ?? ""}</span>
  ${p.ctaText && p.ctaHref ? `<a href="${p.ctaHref}" style="background:rgba(255,255,255,0.2);color:#fff;text-decoration:none;padding:0.3rem 0.85rem;border-radius:999px;font-weight:700;font-size:0.82rem;white-space:nowrap;border:1px solid rgba(255,255,255,0.35);">${p.ctaText}</a>` : ""}
  ${p.closeable !== false ? `<button onclick="document.getElementById('${uid}').style.display='none'" style="position:absolute;right:1rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#fff;opacity:0.7;font-size:1.1rem;line-height:1;padding:0.25rem;" aria-label="Fermer">×</button>` : ""}
</div>`;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function renderTabs(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?: string;
    tabs?:  { id: string; label: string; content: string }[];
  };
  const s    = sec.styles;
  const r    = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const uid  = `tabs_${sec.id.replace(/-/g, "")}`;
  const tabs = p.tabs ?? [];

  if (!tabs.length) return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}${textAlign(s)}"><p style="opacity:0.4;">Ajoutez des onglets à cette section</p></div>
</section>`;

  const tabHeaders = tabs.map((tab, i) => `<button onclick="${uid}_show(${i})" id="${uid}_btn_${i}" style="padding:0.65rem 1.25rem;border:none;background:${i===0?theme.primaryColor:"transparent"};color:${i===0?"#fff":theme.textColor};border-radius:${r};font-weight:600;font-size:0.9rem;cursor:pointer;transition:all 0.15s;white-space:nowrap;">${tab.label}</button>`).join("\n");

  const tabPanels = tabs.map((tab, i) => `<div id="${uid}_panel_${i}" style="display:${i===0?"block":"none"};padding-top:1.5rem;line-height:1.7;">${tab.content}</div>`).join("\n");

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:2rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem;border-bottom:2px solid ${theme.primaryColor}33;padding-bottom:0.5rem;">
${tabHeaders}
    </div>
${tabPanels}
  </div>
</section>
<script>
(function(){
  var n=${tabs.length};
  window['${uid}_show']=function(i){
    for(var j=0;j<n;j++){
      var b=document.getElementById('${uid}_btn_'+j),p=document.getElementById('${uid}_panel_'+j);
      if(b){b.style.background=j===i?'${theme.primaryColor}':'transparent';b.style.color=j===i?'#fff':'${theme.textColor}';}
      if(p)p.style.display=j===i?'block':'none';
    }
  };
})();
</script>`;
}

// ── Accordion ─────────────────────────────────────────────────────────────────

function renderAccordion(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:  string;
    items?:  { id: string; title: string; content: string }[];
  };
  const s     = sec.styles;
  const r     = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const uid   = `acc_${sec.id.replace(/-/g, "")}`;
  const items = p.items ?? [];

  const rendered = items.map((item, i) => `
  <div style="border:1px solid ${theme.primaryColor}22;border-radius:${r};overflow:hidden;margin-bottom:0.5rem;">
    <button onclick="${uid}_toggle(${i})" id="${uid}_hd_${i}" style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;background:none;border:none;cursor:pointer;color:${theme.textColor};text-align:left;font-weight:600;font-size:0.95rem;">
      <span>${item.title}</span>
      <span id="${uid}_ic_${i}" style="font-size:1.5rem;font-weight:300;transition:transform 0.2s;display:inline-block;line-height:1;">+</span>
    </button>
    <div id="${uid}_bd_${i}" style="display:none;padding:0 1.25rem 1.25rem;line-height:1.7;opacity:0.8;">${item.content}</div>
  </div>`).join("\n");

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:2rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    <div style="max-width:760px;margin:0 auto;">
${rendered}
    </div>
  </div>
</section>
<script>
(function(){
  window['${uid}_toggle']=function(i){
    var bd=document.getElementById('${uid}_bd_'+i),ic=document.getElementById('${uid}_ic_'+i);
    if(!bd)return;
    var open=bd.style.display!=='none';
    bd.style.display=open?'none':'block';
    if(ic)ic.style.transform=open?'rotate(0deg)':'rotate(45deg)';
  };
})();
</script>`;
}

// ── Map ───────────────────────────────────────────────────────────────────────

function renderMap(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:   string;
    address?: string;
    lat?:     number;
    lng?:     number;
    zoom?:    number;
    height?:  number;
  };
  const s      = sec.styles;
  const zoom   = p.zoom ?? 14;
  const height = p.height ?? 400;
  const r      = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];

  let mapBlock = "";
  if (p.lat !== undefined && p.lng !== undefined) {
    const lat = p.lat, lng = p.lng;
    const delta = 1 / Math.pow(2, zoom - 8);
    const minLng = lng - delta, maxLng = lng + delta;
    const minLat = lat - delta * 0.5, maxLat = lat + delta * 0.5;
    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng.toFixed(6)}%2C${minLat.toFixed(6)}%2C${maxLng.toFixed(6)}%2C${maxLat.toFixed(6)}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
    mapBlock = `<iframe src="${embedUrl}" width="100%" height="${height}" style="border:0;border-radius:${r};display:block;" loading="lazy" title="Carte" allowfullscreen></iframe>`;
  } else if (p.address) {
    const searchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(p.address)}`;
    mapBlock = `<div style="height:${height}px;background:rgba(0,0,0,0.04);border-radius:${r};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;border:2px dashed ${theme.primaryColor}44;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${theme.primaryColor}" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><p style="margin:0;font-weight:600;opacity:0.7;">${p.address}</p><a href="${searchUrl}" target="_blank" rel="noopener" style="background:${theme.primaryColor};color:#fff;text-decoration:none;padding:0.5rem 1.25rem;border-radius:${r};font-weight:600;font-size:0.875rem;">Voir sur la carte →</a></div>`;
  } else {
    mapBlock = `<div style="height:${height}px;background:rgba(0,0,0,0.04);border-radius:${r};display:flex;align-items:center;justify-content:center;border:2px dashed ${theme.primaryColor}44;"><p style="opacity:0.4;margin:0;">Configurez les coordonnées ou l'adresse</p></div>`;
  }

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:1.5rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${mapBlock}
    ${p.address ? `<p style="${textAlign(s)}margin-top:1rem;opacity:0.6;font-size:0.9rem;">📍 ${p.address}</p>` : ""}
  </div>
</section>`;
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

function renderSection(
  sec: WebsiteSection,
  theme: WebsiteTheme,
  opts: RenderOptions,
): string {
  if (!sec.visible) return "";
  const websiteId = opts.websiteId ?? "";
  switch (sec.type) {
    case "nav":           return renderNav(sec, theme);
    case "hero":          return renderHero(sec, theme);
    case "about":         return renderAbout(sec, theme);
    case "services":      return renderServices(sec, theme);
    case "features":      return renderFeatures(sec, theme);
    case "testimonials":  return renderTestimonials(sec, theme);
    case "faq":           return renderFaq(sec, theme);
    case "pricing":       return renderPricing(sec, theme);
    case "stats":         return renderStats(sec, theme);
    case "team":          return renderTeam(sec, theme);
    case "cta":           return renderCta(sec, theme);
    case "contact":       return renderContact(sec, theme, websiteId);
    case "gallery":       return renderGallery(sec, theme);
    case "logos":         return renderLogos(sec, theme);
    case "rich_text":     return renderRichText(sec, theme);
    case "video":         return renderVideo(sec, theme);
    case "divider":       return renderDivider(sec, theme);
    case "spacer":        return renderSpacer(sec);
    case "blog_feed":     return renderBlogFeed(sec, theme, opts.embeds?.blogPosts ?? []);
    case "products":      return renderProducts(sec, theme, opts.embeds?.products ?? []);
    case "booking":       return renderBooking(sec, theme, websiteId);
    case "custom_form":   return renderCustomForm(sec, theme, websiteId);
    case "popup":         return renderPopup(sec, theme);
    case "footer":        return renderFooter(sec, theme, websiteId);
    case "newsletter":    return renderNewsletter(sec, theme, websiteId);
    case "countdown":     return renderCountdown(sec, theme);
    case "tabs":          return renderTabs(sec, theme);
    case "accordion":     return renderAccordion(sec, theme);
    case "map":           return renderMap(sec, theme);
    case "timeline":      return renderTimeline(sec, theme);
    case "comparison":    return renderComparison(sec, theme);
    case "alert_bar":     return renderAlertBar(sec, theme);
    case "image_text":    return renderImageText(sec, theme);
    case "steps":         return renderSteps(sec, theme);
    case "before_after":  return renderBeforeAfter(sec, theme);
    case "table":         return renderTable(sec, theme);
    case "progress_bars": return renderProgressBars(sec, theme);
    case "embed":         return renderEmbed(sec, theme);
    case "carousel":       return renderCarousel(sec, theme);
    case "icon_grid":      return renderIconGrid(sec, theme);
    case "video_bg":       return renderVideoBg(sec, theme);
    case "quote":          return renderQuote(sec, theme);
    case "number_counter": return renderNumberCounter(sec, theme);
    case "split_screen":   return renderSplitScreen(sec, theme);
    default:               return "";
  }
}

// ── Tableau de données ────────────────────────────────────────────────────────

function renderTable(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:   string;
    caption?: string;
    striped?: boolean;
    headers?: string[];
    rows?:    string[][];
  };
  const s       = sec.styles;
  const headers = p.headers ?? [];
  const rows    = p.rows ?? [];

  const thead = headers.length
    ? `<thead><tr>${headers.map(h => `<th style="padding:0.75rem 1rem;text-align:left;font-size:0.82rem;font-weight:700;background:${theme.primaryColor};color:#fff;white-space:nowrap;">${h}</th>`).join("")}</tr></thead>`
    : "";

  const tbody = `<tbody>${rows.map((row, ri) => `<tr style="background:${p.striped !== false && ri % 2 === 1 ? (theme.bgColor === "#ffffff" ? "#f9fafb" : "rgba(255,255,255,0.04)") : "transparent"};">${(headers.length ? row.slice(0, headers.length) : row).map(cell => `<td style="padding:0.65rem 1rem;font-size:0.875rem;border-bottom:1px solid ${theme.primaryColor}18;">${cell}</td>`).join("")}</tr>`).join("")}</tbody>`;

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:1.5rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    <div style="overflow-x:auto;border-radius:8px;border:1px solid ${theme.primaryColor}20;">
      <table style="width:100%;border-collapse:collapse;min-width:400px;">
        ${thead}
        ${tbody}
      </table>
      ${p.caption ? `<p style="text-align:center;font-size:0.75rem;opacity:0.5;padding:0.5rem;">${p.caption}</p>` : ""}
    </div>
  </div>
</section>`;
}

// ── Barres de progression ─────────────────────────────────────────────────────

function renderProgressBars(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:       string;
    subtitle?:    string;
    items?:       { id: string; label: string; value: number }[];
    showPercent?: boolean;
    animated?:    boolean;
  };
  const s     = sec.styles;
  const items = p.items ?? [];
  const uid   = `pb_${sec.id.replace(/-/g, "")}`;

  const bars = items.map((item, i) => {
    const pct = Math.max(0, Math.min(100, item.value));
    return `
<div style="margin-bottom:${i < items.length - 1 ? "1.5rem" : "0"};">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.45rem;">
    <span style="font-size:0.9rem;font-weight:600;">${item.label}</span>
    ${p.showPercent !== false ? `<span id="${uid}_pct_${i}" style="font-size:0.82rem;font-weight:700;color:${theme.primaryColor};">${p.animated !== false ? "0%" : `${pct}%`}</span>` : ""}
  </div>
  <div style="height:10px;background:${theme.primaryColor}22;border-radius:9999px;overflow:hidden;">
    <div id="${uid}_bar_${i}" style="height:100%;width:${p.animated !== false ? "0" : `${pct}%`};background:${theme.primaryColor};border-radius:9999px;transition:width 1.2s cubic-bezier(.4,0,.2,1);"></div>
  </div>
</div>`;
  }).join("");

  const animScript = p.animated !== false ? `
<script>
(function(){
  var obs=new IntersectionObserver(function(entries){
    if(!entries[0].isIntersecting)return;
    obs.disconnect();
    var targets=${JSON.stringify(items.map((it,i)=>({i,pct:Math.max(0,Math.min(100,it.value))})))};
    targets.forEach(function(t){
      var bar=document.getElementById('${uid}_bar_'+t.i);
      var pct=document.getElementById('${uid}_pct_'+t.i);
      if(bar)setTimeout(function(){bar.style.width=t.pct+'%';},100);
      if(pct){var v=0;var interval=setInterval(function(){v+=2;pct.textContent=Math.min(v,t.pct)+'%';if(v>=t.pct)clearInterval(interval);},20);}
    });
  },{threshold:0.3});
  var el=document.getElementById('${uid}');
  if(el)obs.observe(el);
})();
</script>` : "";

  return `
<section id="${uid}" style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}max-width:700px;margin-left:auto;margin-right:auto;">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:0.5rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="${textAlign(s)}opacity:0.6;margin-bottom:2rem;">${p.subtitle}</p>` : ""}
    ${bars}
  </div>
</section>
${animScript}`;
}

// ── Embed HTML ────────────────────────────────────────────────────────────────

function renderEmbed(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:     string;
    html?:      string;
    height?:    number;
    scrolling?: boolean;
  };
  const s = sec.styles;
  const h = p.height ?? 500;

  if (!p.html?.trim()) return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}text-align:center;padding:3rem 1rem;opacity:0.4;border:2px dashed ${theme.primaryColor}40;border-radius:8px;">
    <p style="margin:0;font-size:0.9rem;">Ajoutez du code HTML / un iframe dans les propriétés</p>
    <p style="margin:0.4rem 0 0;font-size:0.78rem;opacity:0.6;">Compatible : Calendly, Typeform, Google Maps, YouTube, etc.</p>
  </div>
</section>`;

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:1.5rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    <div style="width:100%;min-height:${h}px;overflow:${p.scrolling ? "auto" : "hidden"};">
      ${p.html}
    </div>
  </div>
</section>`;
}

// ── Image + Texte ─────────────────────────────────────────────────────────────

function renderImageText(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:    string;
    content?:  string;
    imageUrl?: string;
    imageAlt?: string;
    layout?:   "image-left" | "image-right";
    ctaText?:  string;
    ctaHref?:  string;
  };
  const s   = sec.styles;
  const r   = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const rev = (p.layout ?? "image-right") === "image-left";

  const imgCol = p.imageUrl
    ? `<div style="border-radius:${r};overflow:hidden;"><img src="${p.imageUrl}" alt="${p.imageAlt ?? ""}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>`
    : `<div style="border-radius:${r};background:${theme.primaryColor}18;min-height:280px;display:flex;align-items:center;justify-content:center;color:${theme.primaryColor};font-size:0.85rem;opacity:0.6;">Image</div>`;

  const textCol = `
<div style="display:flex;flex-direction:column;justify-content:center;gap:1.25rem;">
  ${p.title ? `<h2 style="font-size:2rem;font-weight:700;line-height:1.2;margin:0;color:${theme.primaryColor};">${p.title}</h2>` : ""}
  ${p.content ? `<p style="margin:0;font-size:1rem;line-height:1.75;opacity:0.8;">${p.content}</p>` : ""}
  ${p.ctaText && p.ctaHref ? `<div><a href="${p.ctaHref}" style="background:${theme.primaryColor};color:#fff;display:inline-block;padding:0.7rem 1.75rem;text-decoration:none;font-weight:700;font-size:0.95rem;border-radius:${r};">${p.ctaText}</a></div>` : ""}
</div>`;

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;">
      ${rev ? `${imgCol}${textCol}` : `${textCol}${imgCol}`}
    </div>
  </div>
</section>`;
}

// ── Étapes / Processus ────────────────────────────────────────────────────────

function renderSteps(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:    string;
    subtitle?: string;
    layout?:   "horizontal" | "vertical";
    items?:    { id: string; title: string; desc: string }[];
  };
  const s     = sec.styles;
  const r     = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const items = p.items ?? [];
  const isH   = (p.layout ?? "horizontal") === "horizontal";

  const stepHtml = (item: { id: string; title: string; desc: string }, idx: number) => `
<div style="display:flex;flex-direction:column;align-items:center;text-align:center;${isH ? "flex:1;min-width:160px;" : "flex-direction:row;text-align:left;gap:1.25rem;align-items:flex-start;"}">
  <div style="width:52px;height:52px;border-radius:50%;background:${theme.primaryColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;flex-shrink:0;">${idx + 1}</div>
  <div style="${isH ? "padding-top:0.75rem;" : ""}">
    <h3 style="margin:0 0 0.35rem;font-size:1rem;font-weight:700;">${item.title}</h3>
    <p style="margin:0;font-size:0.875rem;opacity:0.65;line-height:1.6;">${item.desc}</p>
  </div>
</div>`;

  const connectorH = `<div style="flex-shrink:0;height:2px;flex:0 1 3rem;background:${theme.primaryColor}40;margin-top:26px;"></div>`;

  const innerH = items.flatMap((item, idx) => [stepHtml(item, idx), ...(idx < items.length - 1 ? [connectorH] : [])]).join("\n");
  const innerV = items.map((item, idx) => `<div style="display:flex;flex-direction:row;gap:1.25rem;align-items:flex-start;">${stepHtml(item, idx)}</div>`).join(`<div style="width:2px;height:2rem;background:${theme.primaryColor}40;margin-left:25px;"></div>`);

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:0.5rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="${textAlign(s)}opacity:0.6;margin-bottom:2.5rem;font-size:1rem;">${p.subtitle}</p>` : ""}
    <div style="display:flex;${isH ? "flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;gap:0;" : "flex-direction:column;gap:0;"}">
${isH ? innerH : innerV}
    </div>
  </div>
  <style>@media(max-width:600px){#steps_${sec.id.replace(/-/g,"")} .connector{display:none!important;} #steps_${sec.id.replace(/-/g,"")} .step{flex:0 0 100%!important;}}</style>
</section>`;
}

// ── Avant / Après ─────────────────────────────────────────────────────────────

function renderBeforeAfter(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    title?:       string;
    subtitle?:    string;
    beforeImage?: string;
    afterImage?:  string;
    beforeLabel?: string;
    afterLabel?:  string;
    height?:      number;
  };
  const s   = sec.styles;
  const r   = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const uid = `ba_${sec.id.replace(/-/g, "")}`;
  const h   = p.height ?? 420;

  const placeholder = (label: string) => `<div style="width:100%;height:${h}px;display:flex;align-items:center;justify-content:center;background:${theme.primaryColor}18;border-radius:${r};color:${theme.primaryColor};font-size:0.85rem;opacity:0.6;">${label}</div>`;

  if (!p.beforeImage || !p.afterImage) return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:0.75rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${placeholder("Ajoutez les images avant / après dans les propriétés")}
  </div>
</section>`;

  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    ${p.title ? `<h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:0.5rem;color:${theme.primaryColor};">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="${textAlign(s)}opacity:0.55;margin-bottom:1.5rem;">${p.subtitle}</p>` : ""}
    <div id="${uid}" style="position:relative;width:100%;max-width:860px;margin:0 auto;height:${h}px;border-radius:${r};overflow:hidden;cursor:ew-resize;user-select:none;">
      <img src="${p.afterImage}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" alt="${p.afterLabel ?? "Après"}" />
      <div id="${uid}_before" style="position:absolute;inset:0;width:50%;overflow:hidden;">
        <img src="${p.beforeImage}" style="position:absolute;inset:0;width:${h * 2}px;max-width:none;height:100%;object-fit:cover;" alt="${p.beforeLabel ?? "Avant"}" />
      </div>
      <div id="${uid}_line" style="position:absolute;top:0;bottom:0;left:50%;width:3px;background:#fff;box-shadow:0 0 8px rgba(0,0,0,0.35);transform:translateX(-50%);pointer-events:none;"></div>
      <div id="${uid}_handle" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;pointer-events:none;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${theme.primaryColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 21 12 15 6"/><polyline points="9 6 3 12 9 18"/></svg>
      </div>
      <div style="position:absolute;bottom:0.75rem;left:0.75rem;background:rgba(0,0,0,0.5);color:#fff;padding:0.25rem 0.65rem;border-radius:9999px;font-size:0.78rem;font-weight:600;">${p.beforeLabel ?? "Avant"}</div>
      <div style="position:absolute;bottom:0.75rem;right:0.75rem;background:rgba(0,0,0,0.5);color:#fff;padding:0.25rem 0.65rem;border-radius:9999px;font-size:0.78rem;font-weight:600;">${p.afterLabel ?? "Après"}</div>
    </div>
  </div>
</section>
<script>
(function(){
  var el=document.getElementById('${uid}');
  if(!el)return;
  var before=document.getElementById('${uid}_before');
  var line=document.getElementById('${uid}_line');
  var handle=document.getElementById('${uid}_handle');
  function setPos(x){
    var rect=el.getBoundingClientRect();
    var pct=Math.max(0,Math.min(1,(x-rect.left)/rect.width));
    var w=Math.round(pct*rect.width);
    before.style.width=w+'px';
    line.style.left=w+'px';
    handle.style.left=w+'px';
  }
  el.addEventListener('mousedown',function(e){
    e.preventDefault();
    function move(ev){setPos(ev.clientX);}
    document.addEventListener('mousemove',move);
    document.addEventListener('mouseup',function(){document.removeEventListener('mousemove',move);},{once:true});
  });
  el.addEventListener('touchstart',function(e){
    function move(ev){setPos(ev.touches[0].clientX);}
    document.addEventListener('touchmove',move,{passive:false});
    document.addEventListener('touchend',function(){document.removeEventListener('touchmove',move);},{once:true});
  },{passive:true});
})();
</script>`;
}

// ── Intégrations Jalon C ──────────────────────────────────────────────────────

interface BlogArticle {
  id: string;
  titre: string;
  slug: string;
  extrait: string;
  image_url: string | null;
  categorie: string;
  published_at: string;
}

interface ShopProduct {
  id: string;
  name: string;
  slug: string | null;
  sale_price: number;
  compare_price?: number | null;
  image_url: string | null;
  short_description?: string;
  category?: string;
  stock_current?: number;
  featured?: boolean;
}

function renderBlogFeed(sec: WebsiteSection, theme: WebsiteTheme, articles: BlogArticle[]): string {
  const p = sec.props as { title?: string; count?: number; showDate?: boolean };
  const s = sec.styles;
  if (!articles.length) {
    return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}${textAlign(s)}">
    <h2 style="font-size:2rem;font-weight:700;margin-bottom:2rem;color:${theme.primaryColor};">${p.title ?? "Notre blog"}</h2>
    <p style="opacity:0.5;">Aucun article publié pour l'instant.</p>
  </div>
</section>`;
  }
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  const cards = articles.slice(0, p.count ?? 3).map(a => {
    const date = p.showDate !== false ? `<p style="font-size:0.78rem;opacity:0.5;margin:0 0 0.5rem;">${new Date(a.published_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</p>` : "";
    const img = a.image_url ? `<img src="${a.image_url}" style="width:100%;height:180px;object-fit:cover;border-radius:${r} ${r} 0 0;" alt="${a.titre}" />` : `<div style="width:100%;height:180px;background:${theme.primaryColor}20;border-radius:${r} ${r} 0 0;display:flex;align-items:center;justify-content:center;font-size:2rem;">📰</div>`;
    return `
    <div style="border:1px solid rgba(0,0,0,0.08);border-radius:${r};overflow:hidden;transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'" onmouseout="this.style.boxShadow='none'">
      ${img}
      <div style="padding:1.25rem;">
        <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${theme.primaryColor};">${a.categorie}</span>
        ${date}
        <h3 style="font-weight:700;font-size:1rem;margin:0.35rem 0;">${a.titre}</h3>
        ${a.extrait ? `<p style="opacity:0.65;font-size:0.875rem;line-height:1.5;margin:0 0 1rem;">${a.extrait}</p>` : ""}
        <a href="/blog/${a.slug}" style="font-weight:600;color:${theme.primaryColor};text-decoration:none;font-size:0.875rem;">Lire l'article →</a>
      </div>
    </div>`;
  }).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    <h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:3rem;color:${theme.primaryColor};">${p.title ?? "Notre blog"}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;">${cards}</div>
  </div>
</section>`;
}

function renderProducts(sec: WebsiteSection, theme: WebsiteTheme, products: ShopProduct[]): string {
  const p = sec.props as { title?: string; count?: number; showPrice?: boolean; showCart?: boolean };
  const s = sec.styles;
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  if (!products.length) {
    return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}${textAlign(s)}">
    <h2 style="font-size:2rem;font-weight:700;margin-bottom:2rem;color:${theme.primaryColor};">${p.title ?? "Nos produits"}</h2>
    <p style="opacity:0.5;">Aucun produit en ligne pour l'instant.</p>
  </div>
</section>`;
  }
  const cards = products.slice(0, p.count ?? 6).map(prod => {
    const img = prod.image_url
      ? `<img src="${prod.image_url}" style="width:100%;height:200px;object-fit:cover;" alt="${prod.name}" />`
      : `<div style="width:100%;height:200px;background:${theme.primaryColor}15;display:flex;align-items:center;justify-content:center;font-size:3rem;">🛍️</div>`;
    const price = p.showPrice !== false && prod.sale_price != null
      ? `<div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;">
          <span style="font-weight:800;color:${theme.primaryColor};font-size:1.1rem;">${Number(prod.sale_price).toFixed(2)} €</span>
          ${prod.compare_price && prod.compare_price > prod.sale_price ? `<span style="text-decoration:line-through;opacity:0.45;font-size:0.875rem;">${Number(prod.compare_price).toFixed(2)} €</span>` : ""}
        </div>` : "";
    const cartBtn = p.showCart !== false
      ? `<button onclick="window.location.href='/boutique/${prod.slug ?? prod.id}'" style="width:100%;margin-top:0.75rem;background:${theme.primaryColor};color:#fff;border:none;padding:0.6rem;border-radius:${r};font-weight:600;cursor:pointer;font-size:0.875rem;">Voir le produit</button>`
      : "";
    return `
    <div style="border:1px solid rgba(0,0,0,0.08);border-radius:${r};overflow:hidden;">
      ${img}
      <div style="padding:1rem;">
        ${prod.category ? `<span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;opacity:0.5;">${prod.category}</span>` : ""}
        <h3 style="font-weight:700;font-size:1rem;margin:0.25rem 0;">${prod.name}</h3>
        ${prod.short_description ? `<p style="opacity:0.6;font-size:0.8rem;margin:0;line-height:1.4;">${prod.short_description}</p>` : ""}
        ${price}${cartBtn}
      </div>
    </div>`;
  }).join("");
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}">
    <h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:3rem;color:${theme.primaryColor};">${p.title ?? "Nos produits"}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1.5rem;">${cards}</div>
  </div>
</section>`;
}

function renderBooking(sec: WebsiteSection, theme: WebsiteTheme, websiteId: string): string {
  const p = sec.props as { title?: string; subtitle?: string };
  const s = sec.styles;
  const r = { none:"0",sm:"4px",md:"8px",lg:"12px",xl:"20px",full:"9999px" }[theme.borderRadius ?? "md"];
  return `
<section style="${sectionBg(s, theme)}${sectionColor(s, theme)}${sectionPad(s)}">
  <div style="${sectionAlign(s)}max-width:560px;margin:0 auto;">
    <h2 style="${textAlign(s)}font-size:2rem;font-weight:700;margin-bottom:0.5rem;color:${theme.primaryColor};">${p.title ?? "Prendre rendez-vous"}</h2>
    ${p.subtitle ? `<p style="${textAlign(s)}opacity:0.65;margin-bottom:2rem;">${p.subtitle}</p>` : ""}
    <form id="rdv-form-${sec.id}" style="display:flex;flex-direction:column;gap:0.875rem;"
      onsubmit="(function(e){e.preventDefault();var f=e.target,d={name:f.name.value,email:f.email.value,phone:f.phone?.value,message:f.message.value};fetch('/api/websites/${websiteId}/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(){f.parentElement.innerHTML='<div style=\\'text-align:center;padding:2rem;\\'><div style=\\'font-size:2.5rem;margin-bottom:1rem;\\'>✅</div><p style=\\'font-weight:700;color:${theme.primaryColor};\\'>Demande envoyée !</p><p style=\\'opacity:0.6;\\'>Nous vous contacterons rapidement pour confirmer votre rendez-vous.</p></div>'}).catch(function(){alert('Erreur — réessayez.')})})(event)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem;">
        <input name="name" type="text" placeholder="Votre nom *" required style="padding:0.7rem 1rem;border:1px solid rgba(0,0,0,0.2);border-radius:${r};font-family:inherit;font-size:0.9rem;" />
        <input name="email" type="email" placeholder="E-mail *" required style="padding:0.7rem 1rem;border:1px solid rgba(0,0,0,0.2);border-radius:${r};font-family:inherit;font-size:0.9rem;" />
      </div>
      <input name="phone" type="tel" placeholder="Téléphone" style="padding:0.7rem 1rem;border:1px solid rgba(0,0,0,0.2);border-radius:${r};font-family:inherit;font-size:0.9rem;" />
      <textarea name="message" placeholder="Précisez vos disponibilités et l'objet du rendez-vous" rows="3" style="padding:0.7rem 1rem;border:1px solid rgba(0,0,0,0.2);border-radius:${r};font-family:inherit;font-size:0.9rem;resize:vertical;"></textarea>
      <input name="website" type="text" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0;width:1px;height:1px;" aria-hidden="true" />
      <button type="submit" style="background:${theme.primaryColor};color:#fff;border:none;padding:0.9rem;border-radius:${r};font-weight:700;font-size:1rem;cursor:pointer;">Envoyer la demande</button>
    </form>
  </div>
</section>`;
}

// ── Quote ─────────────────────────────────────────────────────────────────────

function renderQuote(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { text?: string; author?: string; role?: string; variant?: "minimal" | "card" | "accent" };
  const color   = sectionColor(sec.styles, theme);
  const text    = p.text ?? "Insérez ici votre citation percutante.";
  const variant = p.variant ?? "card";

  const body = `
    <div style="font-size:4.5rem;line-height:0.7;color:${theme.primaryColor};opacity:0.22;font-family:Georgia,serif;margin-bottom:0.4rem;">&ldquo;</div>
    <blockquote style="margin:0 0 1.5rem;font-size:1.3rem;font-weight:600;line-height:1.7;color:${color};font-style:italic;">${text}</blockquote>
    ${p.author || p.role ? `<div style="display:flex;align-items:center;gap:0.75rem;">
      <div style="width:32px;height:2px;background:${theme.primaryColor};flex-shrink:0;"></div>
      <div>
        ${p.author ? `<p style="margin:0;font-weight:700;font-size:0.9rem;color:${color};">${p.author}</p>` : ""}
        ${p.role ? `<p style="margin:0;font-size:0.78rem;opacity:0.5;color:${color};">${p.role}</p>` : ""}
      </div>
    </div>` : ""}`;

  if (variant === "accent") {
    return `<section style="${sectionBg(sec.styles, theme)}${sectionPad(sec.styles)}">
  <div style="max-width:780px;margin:0 auto;padding-left:2rem;border-left:5px solid ${theme.primaryColor};">${body}</div>
</section>`;
  }
  if (variant === "card") {
    return `<section style="${sectionBg(sec.styles, theme)}${sectionPad(sec.styles)}">
  <div style="max-width:780px;margin:0 auto;background:${theme.primaryColor}10;border-radius:1.25rem;padding:2.5rem 3rem;">${body}</div>
</section>`;
  }
  return `<section style="${sectionBg(sec.styles, theme)}${sectionPad(sec.styles)}">
  <div style="max-width:780px;margin:0 auto;text-align:center;">${body}</div>
</section>`;
}

// ── Number Counter ────────────────────────────────────────────────────────────

function renderNumberCounter(sec: WebsiteSection, theme: WebsiteTheme): string {
  interface Counter { value: number; label: string; prefix?: string; suffix?: string }
  const p = sec.props as { title?: string; subtitle?: string; counters?: Counter[] };
  const counters: Counter[] = p.counters ?? [
    { value: 1500, label: "Clients satisfaits", suffix: "+" },
    { value: 98,   label: "Taux de satisfaction", suffix: "%" },
    { value: 12,   label: "Années d'expérience",  suffix: "" },
    { value: 50,   label: "Projets livrés",       suffix: "+" },
  ];
  const uid   = sec.id.replace(/-/g, "");
  const color = sectionColor(sec.styles, theme);
  const cols  = Math.min(counters.length, 4);

  const cells = counters.map((c, i) => `<div style="text-align:center;padding:1rem;">
    <div style="font-size:3rem;font-weight:900;color:${theme.primaryColor};line-height:1;" id="cnt_${uid}_${i}">${c.prefix ?? ""}0${c.suffix ?? ""}</div>
    <p style="margin:0.55rem 0 0;font-size:0.875rem;opacity:0.6;color:${color};">${c.label}</p>
  </div>`).join("");

  const countersJson = JSON.stringify(counters);
  const js = `<script>(function(){
  var done=false,cs=${countersJson},uid="${uid}";
  function anim(i,target,pre,suf){
    var el=document.getElementById('cnt_'+uid+'_'+i);if(!el)return;
    var dur=1800,t0=null;
    function step(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1),e=p*p*(3-2*p);
      el.textContent=(pre||'')+Math.round(e*target)+(suf||'');if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting&&!done){done=true;cs.forEach(function(c,i){anim(i,c.value,c.prefix,c.suffix);});io.disconnect();}});
    },{threshold:0.3});
    var el=document.getElementById('ncounters_${uid}');if(el)io.observe(el);
  } else {cs.forEach(function(c,i){var el=document.getElementById('cnt_'+uid+'_'+i);if(el)el.textContent=(c.prefix||'')+c.value+(c.suffix||'');});}
})();</script>`;

  return `<section style="${sectionBg(sec.styles, theme)}${sectionPad(sec.styles)}">
  <div style="max-width:960px;margin:0 auto;text-align:center;">
    ${p.title ? `<h2 style="font-size:2rem;font-weight:800;color:${color};margin:0 0 0.6rem;">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="font-size:1.05rem;opacity:0.65;color:${color};margin:0 0 2.5rem;">${p.subtitle}</p>` : ""}
    <div id="ncounters_${uid}" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:1.5rem;">${cells}</div>
  </div>
  ${js}
</section>`;
}

// ── Split Screen ──────────────────────────────────────────────────────────────

function renderSplitScreen(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as {
    leftBg?: string; leftImage?: string; leftTitle?: string; leftText?: string; leftCta?: string; leftCtaUrl?: string;
    rightBg?: string; rightImage?: string; rightTitle?: string; rightText?: string; rightCta?: string; rightCtaUrl?: string;
    height?: number; reversed?: boolean;
  };
  const h = (p.height as number | undefined) ?? 420;

  function half(bg?: string, img?: string, title?: string, text?: string, cta?: string, ctaUrl?: string): string {
    const hasImg = !!img;
    const tc     = hasImg ? "#fff" : theme.textColor;
    const bgCss  = img ? `background:url(${img}) center/cover no-repeat;` : bg ? `background:${bg};` : `background:${theme.primaryColor}10;`;
    return `<div style="flex:1;min-width:280px;min-height:${h}px;display:flex;align-items:center;justify-content:center;padding:3rem 2.5rem;box-sizing:border-box;position:relative;${bgCss}">
      ${hasImg ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.42);"></div>` : ""}
      <div style="position:relative;max-width:380px;">
        ${title ? `<h2 style="margin:0 0 0.85rem;font-size:1.8rem;font-weight:800;color:${tc};">${title}</h2>` : ""}
        ${text ? `<p style="margin:0 0 1.5rem;opacity:0.88;line-height:1.65;color:${tc};">${text}</p>` : ""}
        ${cta ? `<a href="${ctaUrl ?? "#"}" style="display:inline-block;padding:0.75rem 2rem;background:${theme.primaryColor};color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.9rem;">${cta}</a>` : ""}
      </div>
    </div>`;
  }

  const left  = half(p.leftBg,  p.leftImage,  p.leftTitle,  p.leftText,  p.leftCta,  p.leftCtaUrl);
  const right = half(p.rightBg, p.rightImage, p.rightTitle, p.rightText, p.rightCta, p.rightCtaUrl);

  return `<section style="${sectionPad(sec.styles)}overflow:hidden;">
  <div style="display:flex;flex-wrap:wrap;">${p.reversed ? right + left : left + right}</div>
</section>`;
}

// ── Carousel ──────────────────────────────────────────────────────────────────

function renderCarousel(sec: WebsiteSection, theme: WebsiteTheme): string {
  interface Slide { title?: string; subtitle?: string; cta?: string; ctaUrl?: string; image?: string }
  const p = sec.props as { slides?: Slide[]; autoplay?: boolean; interval?: number; showArrows?: boolean; showDots?: boolean };
  const slides: Slide[] = p.slides ?? [
    { title: "Slide 1", subtitle: "Description courte et percutante", cta: "En savoir plus" },
    { title: "Slide 2", subtitle: "Un autre message fort", cta: "Découvrir" },
  ];
  const uid         = sec.id.replace(/-/g, "");
  const showArrows  = p.showArrows !== false;
  const showDots    = p.showDots !== false;
  const doAutoplay  = p.autoplay !== false;
  const interval    = p.interval ?? 4000;
  const n           = slides.length;

  const slidesHtml = slides.map(s => {
    const hasBg = !!s.image;
    const textColor = hasBg ? "#fff" : theme.textColor;
    return `<div style="min-width:100%;display:flex;align-items:center;justify-content:center;${hasBg ? `background:url(${s.image}) center/cover no-repeat;` : `background:${theme.primaryColor}12;`}padding:5rem 2rem;box-sizing:border-box;position:relative;">
      ${hasBg ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);"></div>` : ""}
      <div style="position:relative;text-align:center;max-width:700px;">
        ${s.title ? `<h2 style="margin:0 0 0.85rem;font-size:2.2rem;font-weight:800;color:${textColor};">${s.title}</h2>` : ""}
        ${s.subtitle ? `<p style="margin:0 0 1.75rem;font-size:1.05rem;opacity:0.88;color:${textColor};">${s.subtitle}</p>` : ""}
        ${s.cta ? `<a href="${s.ctaUrl ?? "#"}" style="display:inline-block;padding:0.8rem 2.2rem;background:${theme.primaryColor};color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem;">${s.cta}</a>` : ""}
      </div>
    </div>`;
  }).join("");

  const dotsHtml = showDots ? `<div style="display:flex;justify-content:center;gap:0.55rem;padding:1rem 0 0.25rem;">
    ${slides.map((_, i) => `<button id="dot_${uid}_${i}" onclick="djCarousel_${uid}.goto(${i})" style="width:9px;height:9px;border-radius:50%;border:none;cursor:pointer;background:${theme.primaryColor};opacity:${i === 0 ? 1 : 0.3};transition:opacity 0.2s;padding:0;"></button>`).join("")}
  </div>` : "";

  const js = `<script>(function(){
  var cur=0,n=${n},t=document.getElementById('ctrack_${uid}');
  function go(i){cur=(i%n+n)%n;t.style.transform='translateX(-'+(cur*100)+'%)';${showDots ? `for(var j=0;j<n;j++){var d=document.getElementById('dot_${uid}_'+j);if(d)d.style.opacity=j===cur?'1':'0.3';}` : ""}}
  window.djCarousel_${uid}={goto:go};
  ${showArrows ? `document.getElementById('cprev_${uid}').onclick=function(){go(cur-1);};document.getElementById('cnext_${uid}').onclick=function(){go(cur+1);};` : ""}
  ${doAutoplay ? `setInterval(function(){go(cur+1);},${interval});` : ""}
})();</script>`;

  return `<section style="${sectionBg(sec.styles, theme)}${sectionPad(sec.styles)}">
  <div style="position:relative;overflow:hidden;">
    <div id="ctrack_${uid}" style="display:flex;transition:transform 0.4s ease;">${slidesHtml}</div>
    ${showArrows ? `<button id="cprev_${uid}" style="position:absolute;left:1rem;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.38);color:#fff;border:none;border-radius:50%;width:44px;height:44px;cursor:pointer;font-size:1.4rem;line-height:1;">&#8249;</button>
    <button id="cnext_${uid}" style="position:absolute;right:1rem;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.38);color:#fff;border:none;border-radius:50%;width:44px;height:44px;cursor:pointer;font-size:1.4rem;line-height:1;">&#8250;</button>` : ""}
  </div>
  ${dotsHtml}
  ${js}
</section>`;
}

// ── Icon Grid ─────────────────────────────────────────────────────────────────

function renderIconGrid(sec: WebsiteSection, theme: WebsiteTheme): string {
  interface IconItem { icon?: string; label: string; desc?: string }
  const p = sec.props as { title?: string; subtitle?: string; columns?: number; items?: IconItem[] };
  const items: IconItem[] = p.items ?? [
    { icon: "⚡", label: "Rapide",       desc: "Performances optimales" },
    { icon: "🔒", label: "Sécurisé",     desc: "Protection maximale" },
    { icon: "📱", label: "Mobile first", desc: "Compatible tous écrans" },
    { icon: "🎯", label: "Précis",       desc: "Résultats mesurables" },
    { icon: "🤝", label: "Support",      desc: "Équipe disponible" },
    { icon: "🌍", label: "Global",       desc: "Présence internationale" },
  ];
  const cols = Math.max(1, Math.min(6, (p.columns as number | undefined) ?? 3));
  const color = sectionColor(sec.styles, theme);

  const cells = items.map(item => `<div style="text-align:center;padding:1.75rem 1rem;">
    <div style="font-size:2.6rem;margin-bottom:0.75rem;">${item.icon ?? "✦"}</div>
    <h3 style="margin:0 0 0.45rem;font-size:1rem;font-weight:700;color:${color};">${item.label}</h3>
    ${item.desc ? `<p style="margin:0;font-size:0.875rem;opacity:0.6;line-height:1.55;color:${color};">${item.desc}</p>` : ""}
  </div>`).join("");

  return `<section style="${sectionBg(sec.styles, theme)}${sectionPad(sec.styles)}">
  <div style="max-width:960px;margin:0 auto;${sectionAlign(sec.styles)}">
    ${p.title ? `<h2 style="font-size:2rem;font-weight:800;color:${color};margin:0 0 0.6rem;">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="font-size:1.05rem;opacity:0.65;color:${color};margin:0 0 2.5rem;">${p.subtitle}</p>` : ""}
    <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:1.25rem;">${cells}</div>
  </div>
</section>`;
}

// ── Video Background ──────────────────────────────────────────────────────────

function renderVideoBg(sec: WebsiteSection, theme: WebsiteTheme): string {
  const p = sec.props as { videoUrl?: string; title?: string; subtitle?: string; cta?: string; ctaUrl?: string; overlay?: boolean; height?: number };
  const height  = (p.height as number | undefined) ?? 500;
  const overlay = p.overlay !== false;
  const url     = p.videoUrl ?? "";

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  let videoHtml: string;
  if (ytMatch) {
    const vid = ytMatch[1];
    videoHtml = `<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&playlist=${vid}&controls=0&rel=0&modestbranding=1" style="position:absolute;inset:0;width:100%;height:100%;border:none;pointer-events:none;" allow="autoplay; encrypted-media" title="bg"></iframe>`;
  } else if (url) {
    videoHtml = `<video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"><source src="${url}"></video>`;
  } else {
    videoHtml = `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${theme.primaryColor},${theme.secondaryColor ?? theme.primaryColor}cc);"></div>`;
  }

  return `<section style="${sectionPad(sec.styles)}position:relative;height:${height}px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
  ${videoHtml}
  ${overlay ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);"></div>` : ""}
  <div style="position:relative;text-align:center;padding:2rem;max-width:740px;z-index:1;">
    ${p.title ? `<h2 style="margin:0 0 1rem;font-size:2.5rem;font-weight:900;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,0.4);">${p.title}</h2>` : ""}
    ${p.subtitle ? `<p style="margin:0 0 2rem;font-size:1.15rem;color:rgba(255,255,255,0.92);text-shadow:0 1px 5px rgba(0,0,0,0.3);">${p.subtitle}</p>` : ""}
    ${p.cta ? `<a href="${p.ctaUrl ?? "#"}" style="display:inline-block;padding:0.9rem 2.5rem;background:${theme.primaryColor};color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:1rem;">${p.cta}</a>` : ""}
  </div>
</section>`;
}

// ── Cookie Consent RGPD ───────────────────────────────────────────────────────

function renderCookieBanner(cfg: { text?: string; acceptText?: string; declineText?: string }): string {
  const text = cfg.text ?? "Ce site utilise des cookies pour améliorer votre expérience de navigation.";
  const acceptText  = cfg.acceptText  ?? "Accepter";
  const declineText = cfg.declineText ?? "Refuser";
  return `
<div id="djama_cb" style="position:fixed;bottom:0;left:0;right:0;background:#1F2937;color:#F9FAFB;padding:1rem 1.5rem;z-index:9997;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;font-size:0.875rem;box-shadow:0 -4px 24px rgba(0,0,0,0.2);">
  <p style="margin:0;opacity:0.9;flex:1;min-width:200px;">${text}</p>
  <div style="display:flex;gap:0.75rem;flex-shrink:0;">
    <button onclick="djama_consent(true)" style="background:#2563EB;color:#fff;border:none;padding:0.5rem 1.25rem;border-radius:0.45rem;font-weight:700;cursor:pointer;font-size:0.875rem;">${acceptText}</button>
    <button onclick="djama_consent(false)" style="background:transparent;color:#F9FAFB;border:1px solid rgba(255,255,255,0.3);padding:0.5rem 1.25rem;border-radius:0.45rem;font-weight:600;cursor:pointer;font-size:0.875rem;">${declineText}</button>
  </div>
</div>
<script>
(function(){
  try{if(document.cookie.indexOf('djama_consent=')!==-1){document.getElementById('djama_cb').style.display='none';return;}}catch(e){}
  window.djama_consent=function(yes){
    try{
      var d=new Date(Date.now()+365*86400*1000).toUTCString();
      document.cookie='djama_consent='+(yes?'yes':'no')+';expires='+d+';path=/;SameSite=Lax';
      document.getElementById('djama_cb').style.display='none';
    }catch(e){}
  };
})();
</script>`;
}

// ── Page renderer ─────────────────────────────────────────────────────────────

export interface RenderOptions {
  title?:       string;
  description?: string;
  favicon?:     string;
  customCss?:   string;
  fontsUrl?:    string;
  websiteId?:   string;
  // SEO avancé (Jalon D)
  canonical?:   string;
  siteUrl?:     string;
  ogImage?:     string;
  siteName?:    string;
  allPages?:    { id: string; title: string; slug: string; is_homepage: boolean; in_nav: boolean; updated_at: string }[];
  embeds?: {
    blogPosts?: BlogArticle[];
    products?:  ShopProduct[];
  };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildJsonLd(opts: RenderOptions, page: WebsitePage): string {
  const name = esc(opts.siteName ?? opts.title ?? page.title ?? "");
  const url  = opts.canonical ?? opts.siteUrl ?? "";
  const desc = esc(opts.description ?? "");

  const org = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": name,
    "url": opts.siteUrl ?? url,
    "description": desc,
    ...(opts.ogImage ? { "image": opts.ogImage } : {}),
  });

  const breadcrumb = opts.allPages ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": opts.siteName ?? "Accueil", "item": opts.siteUrl ?? "/" },
      ...(page.is_homepage ? [] : [{ "@type": "ListItem", "position": 2, "name": page.title, "item": url }]),
    ],
  }) : null;

  return `<script type="application/ld+json">${org}</script>${breadcrumb ? `\n  <script type="application/ld+json">${breadcrumb}</script>` : ""}`;
}

export function renderPage(page: WebsitePage, theme: WebsiteTheme, opts: RenderOptions = {}): string {
  const sections = (page.sections ?? [])
    .sort((a, b) => a.position - b.position)
    .map(s => renderSection(s, theme, opts))
    .join("\n")
    .replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy"');

  const fontsToLoad = [...new Set([theme.fontHeading, theme.fontBody].filter(f => f && f !== "Inter"))] as string[];
  const font = fontsToLoad.length === 0 ? "" :
    fontsToLoad.map(f => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;500;600;700;800&display=swap" />`).join("\n  ");

  const titleStr  = esc(opts.title ?? page.title ?? "");
  const descStr   = esc(opts.description ?? "");
  const imageStr  = esc(opts.ogImage ?? "");
  const siteNameStr = esc(opts.siteName ?? opts.title ?? page.title ?? "");
  const canonical = opts.canonical ?? "";

  const ogTags = canonical ? `
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${esc(canonical)}" />
  <meta property="og:title"       content="${titleStr}" />
  <meta property="og:description" content="${descStr}" />
  <meta property="og:site_name"   content="${siteNameStr}" />
  ${imageStr ? `<meta property="og:image" content="${imageStr}" />` : ""}
  <meta name="twitter:card"       content="${imageStr ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title"      content="${titleStr}" />
  <meta name="twitter:description" content="${descStr}" />
  ${imageStr ? `<meta name="twitter:image" content="${imageStr}" />` : ""}` : "";

  // Scripts injectés depuis le thème (headerCode / footerCode / cookieBanner / intégrations)
  const themeExt = theme as unknown as Record<string, unknown>;
  const headerCode = String(themeExt.headerCode ?? "");
  const footerCode = String(themeExt.footerCode ?? "");
  const cookieBannerCfg = themeExt.cookieBanner as { enabled?: boolean; text?: string; acceptText?: string; declineText?: string } | undefined;
  const cookieBannerHtml = cookieBannerCfg?.enabled ? renderCookieBanner(cookieBannerCfg) : "";
  const integrationScripts = renderIntegrationScripts(themeExt);

  const scrollAnimHtml = themeExt.scrollAnimations === true ? `
<script>
(function(){
  if(!('IntersectionObserver' in window))return;
  var style=document.createElement('style');
  style.textContent='[data-djama-anim]{opacity:0;transform:translateY(28px);transition:opacity 0.55s ease,transform 0.55s ease;}';
  document.head.appendChild(style);
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.removeAttribute('data-djama-anim');io.unobserve(e.target);}});
  },{threshold:0.06,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('section').forEach(function(s,i){
    if(i===0)return;
    s.setAttribute('data-djama-anim','1');
    io.observe(s);
  });
})();
</script>` : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titleStr}</title>
  ${descStr ? `<meta name="description" content="${descStr}" />` : ""}
  ${canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : ""}
  ${opts.favicon ? `<link rel="icon" href="${esc(opts.favicon)}" />` : ""}
  ${ogTags}
  ${canonical ? buildJsonLd(opts, page) : ""}
  ${font}
  ${integrationScripts ? `<!-- Intégrations marketing -->\n  ${integrationScripts}` : ""}
  ${headerCode ? `<!-- Header scripts -->\n  ${headerCode}` : ""}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; font-family: '${theme.fontBody || theme.fontHeading}', system-ui, -apple-system, sans-serif; background: ${theme.bgColor}; color: ${theme.textColor}; }
    h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em; font-family: '${theme.fontHeading}', system-ui, -apple-system, sans-serif; }
    img { max-width: 100%; height: auto; display: block; }
    p { margin: 0 0 1em; }
    details > summary { user-select: none; }
    @media (max-width: 768px) {
      section > div { flex-direction: column !important; }
    }
    ${opts.customCss ?? theme.customCss ?? ""}
  </style>
</head>
<body>
${sections}
${footerCode ? `<!-- Footer scripts -->\n${footerCode}` : ""}
${cookieBannerHtml}
${scrollAnimHtml}
</body>
</html>`;
}

// ── Intégrations marketing ─────────────────────────────────────────────────────

function renderIntegrationScripts(themeExt: Record<string, unknown>): string {
  const scripts: string[] = [];

  const gtmId = themeExt.gtmId as string | undefined;
  if (gtmId?.trim()) {
    const id = gtmId.trim();
    scripts.push(`<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>
<!-- End Google Tag Manager -->`);
  }

  const ga4Id = themeExt.ga4Id as string | undefined;
  if (ga4Id?.trim()) {
    const id = ga4Id.trim();
    scripts.push(`<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`);
  }

  const fbPixelId = themeExt.fbPixelId as string | undefined;
  if (fbPixelId?.trim()) {
    const id = fbPixelId.trim();
    scripts.push(`<!-- Facebook Pixel -->
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1" /></noscript>`);
  }

  const hotjarId = themeExt.hotjarId as string | undefined;
  if (hotjarId?.trim()) {
    const id = hotjarId.trim();
    scripts.push(`<!-- Hotjar -->
<script>(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${id},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');</script>`);
  }

  const clarityId = themeExt.clarityId as string | undefined;
  if (clarityId?.trim()) {
    const id = clarityId.trim();
    scripts.push(`<!-- Microsoft Clarity -->
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${id}");</script>`);
  }

  return scripts.join("\n  ");
}
