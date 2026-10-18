"use client";

import { useEffect, useState } from "react";
import {
  Phone, Mail, Globe, MapPin, Download, Share2,
  Linkedin, Twitter, Instagram, Facebook, Youtube,
  Github, ExternalLink, MessageCircle, Send, Check,
  User, X, ChevronDown, ChevronUp,
} from "lucide-react";
import type { BusinessCard, CardTheme } from "@/lib/cards/types";

interface Props { card: BusinessCard }

export default function PublicCardView({ card }: Props) {
  const theme = card.theme as CardTheme;
  const [copied,       setCopied]       = useState(false);
  const [showContact,  setShowContact]  = useState(false);
  const [showHours,    setShowHours]    = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [contactForm,  setContactForm]  = useState({ name: "", email: "", phone: "", message: "", company: "", consent: false });
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState("");

  const bg      = theme.bgColor      ?? "#0e1420";
  const primary = theme.primaryColor ?? "#c9a55a";
  const text    = theme.textColor    ?? "#f5f0e8";
  const accent  = theme.accentColor  ?? "#e8c882";
  const radius  = { none: "0px", sm: "8px", md: "14px", lg: "20px", full: "9999px" }[theme.borderRadius ?? "lg"];

  const bgStyle = theme.backgroundType === "gradient" && theme.gradient
    ? { background: `linear-gradient(${theme.gradient})` }
    : { background: bg };

  // Track view
  useEffect(() => {
    const source = window.location.search.includes("qr") ? "qr" : "direct";
    fetch(`/api/cards/${card.id}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "view", source }),
    }).catch(() => {});
  }, [card.id]);

  function track(event: string, source = "direct") {
    fetch(`/api/cards/${card.id}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: event, source }),
    }).catch(() => {});
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      track("share");
    } catch { /* ignore */ }
  }

  async function submitContact() {
    if (!contactForm.name.trim() && !contactForm.email.trim()) {
      setFormError("Veuillez saisir votre nom ou votre email."); return;
    }
    if (!contactForm.consent) { setFormError("Le consentement est requis."); return; }
    setSubmitting(true); setFormError("");
    const res = await fetch(`/api/cards/${card.id}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (res.ok) { setSubmitted(true); }
    else { setFormError(data.error ?? "Erreur"); }
    setSubmitting(false);
  }

  const initials = [card.first_name, card.last_name]
    .filter(Boolean).map(s => s![0].toUpperCase()).join("") ||
    (card.name ?? "?")[0].toUpperCase();

  const fullName = [card.first_name, card.last_name].filter(Boolean).join(" ") || card.name;
  const avatarR  = { circle: "50%", rounded: radius, square: "4px" }[theme.avatarShape ?? "circle"];

  const social = card.social ?? {};
  const links  = card.links  ?? [];
  const hours  = card.hours  ?? [];

  const SOCIAL_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
    linkedin:  { icon: <Linkedin  size={18} />, color: "#0077b5" },
    twitter:   { icon: <Twitter   size={18} />, color: "#1da1f2" },
    instagram: { icon: <Instagram size={18} />, color: "#e1306c" },
    facebook:  { icon: <Facebook  size={18} />, color: "#1877f2" },
    youtube:   { icon: <Youtube   size={18} />, color: "#ff0000" },
    github:    { icon: <Github    size={18} />, color: "#24292e" },
  };

  const textOpacity = (op: number) => `${text}${Math.round(op * 255).toString(16).padStart(2, "0")}`;

  return (
    <div style={{ minHeight: "100svh", background: isDark(bg) ? "#07080e" : "#f0f2f5", fontFamily: theme.fontFamily ?? "Inter, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

        {/* ── Carte principale ── */}
        <div style={{ ...bgStyle, borderRadius: radius, overflow: "hidden", boxShadow: theme.shadowCard ? "0 20px 60px rgba(0,0,0,0.35)" : "none" }}>

          {/* Header */}
          <div style={{ padding: theme.layout === "centered" ? "2.5rem 1.5rem 1.5rem" : "2rem 1.5rem 1.5rem", textAlign: theme.layout === "centered" ? "center" : "left", display: "flex", flexDirection: theme.layout === "centered" ? "column" : "row", alignItems: theme.layout === "centered" ? "center" : "flex-start", gap: "1rem" }}>

            {/* Avatar */}
            <div style={{ width: 72, height: 72, borderRadius: avatarR, overflow: "hidden", background: `${primary}33`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${primary}55` }}>
              {card.avatar_url
                ? <img src={card.avatar_url} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: "1.5rem", fontWeight: 800, color: primary }}>{initials}</span>
              }
            </div>

            <div style={{ flex: 1 }}>
              {card.logo_url && (
                <img src={card.logo_url} alt={card.company ?? ""} style={{ height: 28, objectFit: "contain", marginBottom: "0.5rem", filter: isDark(bg) ? "brightness(1.2)" : "none" }} />
              )}
              <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: text, lineHeight: 1.2 }}>{fullName}</h1>
              {card.job_title && <p style={{ margin: "0.25rem 0 0", fontSize: "0.88rem", color: textOpacity(0.8), fontWeight: 600 }}>{card.job_title}</p>}
              {card.company   && <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem",  color: textOpacity(0.6), fontWeight: 500 }}>{card.company}{card.department ? ` · ${card.department}` : ""}</p>}
            </div>
          </div>

          {/* Bio */}
          {card.bio && (
            <div style={{ padding: "0 1.5rem 1.25rem", borderTop: `1px solid ${textOpacity(0.1)}` }}>
              <p style={{ margin: "1rem 0 0", fontSize: "0.82rem", lineHeight: 1.65, color: textOpacity(0.72) }}>{card.bio}</p>
            </div>
          )}

          {/* Infos de contact */}
          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.65rem", borderTop: `1px solid ${textOpacity(0.1)}` }}>
            {card.phone && (
              <ContactRow icon={<Phone size={14} />} text={card.phone} href={`tel:${card.phone}`} color={primary} textColor={text} onTrack={() => track("click_phone")} />
            )}
            {card.email && (
              <ContactRow icon={<Mail size={14} />} text={card.email} href={`mailto:${card.email}`} color={primary} textColor={text} onTrack={() => track("click_email")} />
            )}
            {card.website && (
              <ContactRow icon={<Globe size={14} />} text={card.website.replace(/^https?:\/\//, "")} href={card.website.startsWith("http") ? card.website : `https://${card.website}`} color={primary} textColor={text} onTrack={() => track("click_website")} external />
            )}
            {(card.city || card.address) && (
              <ContactRow icon={<MapPin size={14} />} text={[card.address, card.city, card.country].filter(Boolean).join(", ")} color={primary} textColor={text} />
            )}
          </div>

          {/* Boutons d'action principaux */}
          <div style={{ padding: "0 1.5rem 1.5rem", display: "flex", gap: "0.65rem" }}>
            {card.phone && (
              <ActionBtn
                href={`tel:${card.phone}`}
                label="Appeler"
                icon={<Phone size={15} />}
                bg={primary}
                color={isDark(primary) ? "#fff" : "#000"}
                radius={radius}
                onClick={() => track("click_phone")}
              />
            )}
            {card.phone_whatsapp && (
              <ActionBtn
                href={`https://wa.me/${card.phone_whatsapp.replace(/\D/g, "")}`}
                label="WhatsApp"
                icon={<MessageCircle size={15} />}
                bg="#25d366"
                color="#fff"
                radius={radius}
                onClick={() => track("click_whatsapp")}
                external
              />
            )}
            {card.email && (
              <ActionBtn
                href={`mailto:${card.email}`}
                label="Email"
                icon={<Mail size={15} />}
                bg={`${primary}22`}
                color={primary}
                radius={radius}
                onClick={() => track("click_email")}
                border={`1.5px solid ${primary}55`}
              />
            )}
          </div>

          {/* Réseaux sociaux */}
          {Object.entries(social).some(([, v]) => !!v) && (
            <div style={{ padding: "1rem 1.5rem 1.5rem", display: "flex", gap: "0.65rem", flexWrap: "wrap", borderTop: `1px solid ${textOpacity(0.1)}` }}>
              {Object.entries(social).map(([key, url]) => {
                if (!url) return null;
                const meta = SOCIAL_ICONS[key];
                const href = (url as string).startsWith("http") ? (url as string) : `https://${url}`;
                return (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                    onClick={() => track("click_social")}
                    style={{ width: 40, height: 40, borderRadius: "50%", background: `${textOpacity(0.06)}`, display: "flex", alignItems: "center", justifyContent: "center", color: meta?.color ?? text, textDecoration: "none" }}>
                    {meta?.icon ?? <ExternalLink size={16} />}
                  </a>
                );
              })}
            </div>
          )}

          {/* Liens custom */}
          {links.length > 0 && (
            <div style={{ padding: "1rem 1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: `1px solid ${textOpacity(0.1)}` }}>
              {links.map((l, i) => (
                <a key={i} href={l.url.startsWith("http") ? l.url : `https://${l.url}`} target="_blank" rel="noopener noreferrer"
                  onClick={() => track("click_link")}
                  style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.7rem 0.9rem", background: textOpacity(0.06), borderRadius: radius, color: text, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
                  <ExternalLink size={14} color={accent} />
                  {l.label}
                </a>
              ))}
            </div>
          )}

          {/* Horaires */}
          {hours.length > 0 && (
            <div style={{ borderTop: `1px solid ${textOpacity(0.1)}` }}>
              <button onClick={() => setShowHours(h => !h)}
                style={{ width: "100%", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", color: text, fontWeight: 600, fontSize: "0.85rem" }}>
                Horaires {showHours ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {showHours && (
                <div style={{ padding: "0 1.5rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {hours.map((h, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: textOpacity(0.7) }}>
                      <span style={{ fontWeight: 600 }}>{h.day}</span>
                      <span>{h.closed ? "Fermé" : `${h.open ?? ""} – ${h.close ?? ""}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Actions rapides ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", marginTop: "1rem" }}>
          <a href={`/api/cards/${card.id}/vcf`} download
            onClick={() => track("vcf_download")}
            style={quickBtn}>
            <Download size={18} color="#c9a55a" />
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#c9a55a" }}>Enregistrer</span>
          </a>
          <button onClick={copyLink} style={quickBtn}>
            {copied ? <Check size={18} color="#10b981" /> : <Share2 size={18} color="#6b7280" />}
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: copied ? "#10b981" : "#6b7280" }}>
              {copied ? "Copié !" : "Partager"}
            </span>
          </button>
          {card.show_contact_form && (
            <button onClick={() => setShowContact(v => !v)} style={quickBtn}>
              <Send size={18} color="#6b7280" />
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280" }}>Me contacter</span>
            </button>
          )}
        </div>

        {/* ── Formulaire de contact ── */}
        {card.show_contact_form && showContact && (
          <div style={{ marginTop: "1rem", background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>Me contacter</p>
              <button onClick={() => setShowContact(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={16} color="#9ca3af" />
              </button>
            </div>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "1rem", color: "#10b981" }}>
                <Check size={28} style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Message envoyé !</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {[
                  { key: "name",    label: "Nom",     ph: "Votre nom" },
                  { key: "email",   label: "Email",   ph: "votre@email.com" },
                  { key: "phone",   label: "Tél",     ph: "+33 6 …" },
                  { key: "company", label: "Société", ph: "Facultatif" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.25rem" }}>{f.label}</label>
                    <input
                      value={(contactForm as unknown as Record<string, string>)[f.key]}
                      onChange={e => setContactForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.ph}
                      style={{ width: "100%", boxSizing: "border-box", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: "0.82rem", outline: "none", color: "#111" }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.25rem" }}>Message</label>
                  <textarea
                    rows={3}
                    value={contactForm.message}
                    onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Votre message…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: "0.82rem", outline: "none", resize: "none", color: "#111" }}
                  />
                </div>
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", cursor: "pointer" }}>
                  <input type="checkbox" checked={contactForm.consent}
                    onChange={e => setContactForm(p => ({ ...p, consent: e.target.checked }))}
                    style={{ marginTop: 2 }} />
                  <span style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.4 }}>J&apos;accepte que mes coordonnées soient transmises au propriétaire de cette carte.</span>
                </label>
                {formError && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: 0 }}>{formError}</p>}
                <button onClick={submitContact} disabled={submitting}
                  style={{ padding: "0.75rem", borderRadius: 10, background: primary, color: isDark(primary) ? "#fff" : "#000", fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Footer DJAMA ── */}
        <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.68rem", color: "#9ca3af" }}>
          Créé avec{" "}
          <a href="https://djama.pro" target="_blank" rel="noopener noreferrer" style={{ color: "#c9a55a", textDecoration: "none", fontWeight: 600 }}>DJAMA</a>
        </p>
      </div>
    </div>
  );
}

// ── Composants utilitaires ────────────────────────────────────────────────────

function isDark(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function ContactRow({ icon, text, href, color, textColor, onTrack, external }: {
  icon: React.ReactNode; text: string; href?: string; color: string;
  textColor: string; onTrack?: () => void; external?: boolean;
}) {
  const content = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: "0.83rem", color: textColor, opacity: 0.85, wordBreak: "break-all" }}>{text}</span>
    </div>
  );
  if (!href) return content;
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={onTrack} style={{ textDecoration: "none" }}>
      {content}
    </a>
  );
}

function ActionBtn({ href, label, icon, bg, color, radius, onClick, external, border }: {
  href: string; label: string; icon: React.ReactNode; bg: string; color: string;
  radius: string; onClick?: () => void; external?: boolean; border?: string;
}) {
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", flex: 1, padding: "0.7rem 0.5rem", background: bg, color, borderRadius: radius, textDecoration: "none", fontWeight: 700, fontSize: "0.8rem", border: border ?? "none" }}>
      {icon} {label}
    </a>
  );
}

const quickBtn: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: "0.35rem", padding: "0.9rem 0.5rem", background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, cursor: "pointer",
};
