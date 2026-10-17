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
    default:              return "";
  }
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
    .join("\n");

  const font = theme.fontHeading === "Inter" ? "" :
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontHeading)}:wght@400;600;700;800&display=swap" />`;

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

  // Scripts injectés depuis le thème (headerCode / footerCode)
  const themeExt = theme as unknown as Record<string, unknown>;
  const headerCode = String(themeExt.headerCode ?? "");
  const footerCode = String(themeExt.footerCode ?? "");

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
  ${headerCode ? `<!-- Header scripts -->\n  ${headerCode}` : ""}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; font-family: '${theme.fontHeading}', system-ui, -apple-system, sans-serif; background: ${theme.bgColor}; color: ${theme.textColor}; }
    img { max-width: 100%; height: auto; display: block; }
    h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em; }
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
</body>
</html>`;
}
