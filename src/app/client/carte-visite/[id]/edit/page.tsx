"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Eye, Loader2, Upload, Sparkles,
  Phone, Mail, Globe, MapPin, Linkedin, Twitter, Instagram,
  Facebook, Youtube, Github, Link2, Clock, ChevronDown, ChevronUp,
  Palette, Type, Layout, User, Briefcase, Share2, Plus, Trash2, X, Check,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { tok } from "@/lib/website-builder/theme-utils";
import type { BusinessCard, CardTheme, SocialLinks, CustomLink, HoursEntry } from "@/lib/cards/types";
import { CARD_TEMPLATES } from "@/lib/cards/templates";

type Tab = "infos" | "reseaux" | "template" | "theme" | "avance";

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { key: "linkedin",   label: "LinkedIn",   icon: <Linkedin size={14} />,   placeholder: "https://linkedin.com/in/…" },
  { key: "twitter",    label: "X / Twitter", icon: <Twitter size={14} />,    placeholder: "https://x.com/…" },
  { key: "instagram",  label: "Instagram",  icon: <Instagram size={14} />,  placeholder: "https://instagram.com/…" },
  { key: "facebook",   label: "Facebook",   icon: <Facebook size={14} />,   placeholder: "https://facebook.com/…" },
  { key: "youtube",    label: "YouTube",    icon: <Youtube size={14} />,    placeholder: "https://youtube.com/…" },
  { key: "github",     label: "GitHub",     icon: <Github size={14} />,     placeholder: "https://github.com/…" },
  { key: "tiktok",     label: "TikTok",     icon: <Link2 size={14} />,      placeholder: "https://tiktok.com/@…" },
];

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function CardEditor() {
  const { isDark } = useTheme();
  const t          = tok(isDark);
  const router     = useRouter();
  const params     = useParams();
  const id         = params.id as string;

  const [card,    setCard]    = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [tab,     setTab]     = useState<Tab>("infos");
  const [preview, setPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiSidebar, setAiSidebar] = useState(false);

  // Données formulaire
  const [form, setForm] = useState<Partial<BusinessCard>>({});

  useEffect(() => {
    fetch(`/api/cards/${id}`)
      .then(r => r.json())
      .then((d: { card?: BusinessCard }) => {
        if (d.card) {
          setCard(d.card);
          setForm(d.card);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const set = useCallback(<K extends keyof BusinessCard>(key: K, val: BusinessCard[K]) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  const setTheme = useCallback((key: keyof CardTheme, val: string | boolean) => {
    setForm(f => ({ ...f, theme: { ...(f.theme ?? {}), [key]: val } as CardTheme }));
  }, []);

  const setSocial = useCallback((key: keyof SocialLinks, val: string) => {
    setForm(f => ({ ...f, social: { ...(f.social ?? {}), [key]: val } as SocialLinks }));
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { card?: BusinessCard };
    if (res.ok && data.card) {
      setCard(data.card);
      setForm(data.card);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  async function callAI(action: string) {
    setAiLoading(action);
    const res = await fetch("/api/cards/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        lang: form.lang ?? "fr",
        context: {
          name:      form.name ?? "",
          first_name: form.first_name ?? "",
          last_name:  form.last_name ?? "",
          job_title:  form.job_title ?? "",
          company:    form.company ?? "",
          bio:        form.bio ?? "",
        },
      }),
    });
    const data = await res.json() as { result?: string | Record<string, string> };
    if (res.ok && data.result) {
      if (action === "bio" || action === "pitch" || action === "improve") {
        set("bio", typeof data.result === "string" ? data.result : "");
      } else if (action === "suggest_template" && data.result && typeof data.result === "object") {
        const r = data.result as Record<string, string>;
        const found = CARD_TEMPLATES.find(tp => tp.id === r["template"]);
        if (found) {
          set("template_id", found.id);
          set("theme", found.theme);
        }
      }
    }
    setAiLoading(null);
  }

  const gold = "#c9a55a";

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: t.bg }}>
        <Loader2 size={28} color={gold} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: t.bg, color: t.text }}>
        Carte introuvable.
      </div>
    );
  }

  const currentTpl = CARD_TEMPLATES.find(tp => tp.id === (form.template_id ?? card.template_id)) ?? CARD_TEMPLATES[0];
  const thm        = form.theme ?? currentTpl.theme;
  const social     = (form.social ?? {}) as SocialLinks;
  const links      = (form.links ?? []) as CustomLink[];
  const hours      = (form.hours ?? []) as HoursEntry[];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.55rem",
    border: `1px solid ${t.border}`, background: isDark ? "#ffffff08" : "#f9fafb",
    color: t.text, fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.72rem", fontWeight: 600, opacity: 0.55, marginBottom: "0.3rem", letterSpacing: "0.04em", textTransform: "uppercase",
  };
  const sectionStyle: React.CSSProperties = {
    background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.85rem", padding: "1.1rem", marginBottom: "0.85rem",
  };

  const tabButtons: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "infos",    label: "Infos",    icon: <User size={13} /> },
    { id: "reseaux",  label: "Réseaux",  icon: <Share2 size={13} /> },
    { id: "template", label: "Modèle",   icon: <Layout size={13} /> },
    { id: "theme",    label: "Thème",    icon: <Palette size={13} /> },
    { id: "avance",   label: "Avancé",   icon: <Briefcase size={13} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, display: "flex", flexDirection: "column" }}>
      {/* ── Topbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem", borderBottom: `1px solid ${t.border}`, gap: "1rem", flexWrap: "wrap", background: t.bg, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button onClick={() => router.push("/client/carte-visite")}
            style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.6, display: "flex", alignItems: "center" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{form.name || "Carte sans titre"}</p>
            <p style={{ margin: 0, fontSize: "0.7rem", opacity: 0.4 }}>/{form.slug ?? card.slug}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button onClick={() => setAiSidebar(!aiSidebar)}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.8rem", background: aiSidebar ? `${gold}22` : "none", border: `1px solid ${aiSidebar ? gold : t.border}`, borderRadius: "0.5rem", color: aiSidebar ? gold : t.text, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>
            <Sparkles size={13} /> IA
          </button>
          <button onClick={() => setPreview(!preview)}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.8rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.5rem", color: t.text, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>
            <Eye size={13} /> Aperçu
          </button>
          <button onClick={save} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", background: saved ? "#10B981" : gold, color: "#000", border: "none", borderRadius: "0.5rem", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
            {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? "Enregistré" : "Enregistrer"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Panneau édition ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>

          {/* Onglets */}
          <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {tabButtons.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.45rem 0.9rem", borderRadius: "0.5rem", border: `1px solid ${tab === tb.id ? gold : t.border}`, background: tab === tb.id ? `${gold}18` : "none", color: tab === tb.id ? gold : t.text, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>
                {tb.icon} {tb.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Infos ── */}
          {tab === "infos" && (
            <>
              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Identité</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={labelStyle}>Prénom</label>
                    <input style={inputStyle} value={form.first_name ?? ""} onChange={e => set("first_name", e.target.value)} placeholder="Prénom" />
                  </div>
                  <div>
                    <label style={labelStyle}>Nom</label>
                    <input style={inputStyle} value={form.last_name ?? ""} onChange={e => set("last_name", e.target.value)} placeholder="Nom" />
                  </div>
                </div>
                <div style={{ marginTop: "0.65rem" }}>
                  <label style={labelStyle}>Nom d'affichage</label>
                  <input style={inputStyle} value={form.name ?? ""} onChange={e => set("name", e.target.value)} placeholder="Nom complet affiché" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginTop: "0.65rem" }}>
                  <div>
                    <label style={labelStyle}>Poste</label>
                    <input style={inputStyle} value={form.job_title ?? ""} onChange={e => set("job_title", e.target.value)} placeholder="Développeur, Consultant…" />
                  </div>
                  <div>
                    <label style={labelStyle}>Entreprise</label>
                    <input style={inputStyle} value={form.company ?? ""} onChange={e => set("company", e.target.value)} placeholder="Nom de l'entreprise" />
                  </div>
                </div>
                <div style={{ marginTop: "0.65rem" }}>
                  <label style={labelStyle}>Département</label>
                  <input style={inputStyle} value={form.department ?? ""} onChange={e => set("department", e.target.value)} placeholder="Marketing, Technique…" />
                </div>
              </div>

              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Bio</p>
                <textarea
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.55 }}
                  value={form.bio ?? ""}
                  onChange={e => set("bio", e.target.value)}
                  placeholder="Présentation professionnelle…"
                />
                <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                  {[
                    { label: "Rédiger", action: "bio" },
                    { label: "Accroche", action: "pitch" },
                    { label: "Améliorer", action: "improve" },
                  ].map(btn => (
                    <button key={btn.action} onClick={() => callAI(btn.action)} disabled={!!aiLoading}
                      style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", background: `${gold}14`, border: `1px solid ${gold}40`, borderRadius: "0.45rem", color: gold, fontWeight: 600, fontSize: "0.74rem", cursor: "pointer", opacity: aiLoading ? 0.6 : 1 }}>
                      {aiLoading === btn.action ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={11} />}
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Contact</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {[
                    { key: "phone" as const,           label: "Téléphone",  icon: <Phone size={13} />,   placeholder: "+33 6 00 00 00 00" },
                    { key: "phone_whatsapp" as const,   label: "WhatsApp",   icon: <Phone size={13} />,   placeholder: "+33 6 00 00 00 00" },
                    { key: "email" as const,            label: "Email",      icon: <Mail size={13} />,    placeholder: "vous@exemple.com" },
                    { key: "website" as const,          label: "Site web",   icon: <Globe size={13} />,   placeholder: "https://…" },
                    { key: "address" as const,          label: "Adresse",    icon: <MapPin size={13} />,  placeholder: "1 rue Exemple, Paris" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}><span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>{f.icon} {f.label}</span></label>
                      <input style={inputStyle} value={(form[f.key] as string) ?? ""} onChange={e => set(f.key, e.target.value as never)} placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Médias</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                  <div>
                    <label style={labelStyle}>URL Photo</label>
                    <input style={inputStyle} value={form.avatar_url ?? ""} onChange={e => set("avatar_url", e.target.value)} placeholder="https://…/photo.jpg" />
                  </div>
                  <div>
                    <label style={labelStyle}>URL Logo</label>
                    <input style={inputStyle} value={form.logo_url ?? ""} onChange={e => set("logo_url", e.target.value)} placeholder="https://…/logo.png" />
                  </div>
                </div>
              </div>

              {/* Horaires */}
              <HoursEditor hours={hours} onChange={h => set("hours", h as never)} isDark={isDark} t={t} gold={gold} inputStyle={inputStyle} labelStyle={labelStyle} sectionStyle={sectionStyle} />
            </>
          )}

          {/* ── Tab: Réseaux ── */}
          {tab === "reseaux" && (
            <>
              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Réseaux sociaux</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {SOCIAL_FIELDS.map(sf => (
                    <div key={sf.key}>
                      <label style={labelStyle}><span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>{sf.icon} {sf.label}</span></label>
                      <input style={inputStyle} value={social[sf.key] ?? ""} onChange={e => setSocial(sf.key, e.target.value)} placeholder={sf.placeholder} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Liens personnalisés */}
              <LinksEditor links={links} onChange={l => set("links", l as never)} isDark={isDark} t={t} gold={gold} inputStyle={inputStyle} labelStyle={labelStyle} sectionStyle={sectionStyle} />
            </>
          )}

          {/* ── Tab: Modèle ── */}
          {tab === "template" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>Choisir un modèle</p>
                <button onClick={() => callAI("suggest_template")} disabled={!!aiLoading}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", background: `${gold}14`, border: `1px solid ${gold}40`, borderRadius: "0.45rem", color: gold, fontWeight: 600, fontSize: "0.76rem", cursor: "pointer" }}>
                  {aiLoading === "suggest_template" ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={12} />}
                  Suggérer
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                {CARD_TEMPLATES.map(tpl => {
                  const isSelected = (form.template_id ?? card.template_id) === tpl.id;
                  return (
                    <button key={tpl.id} onClick={() => { set("template_id", tpl.id); set("theme", tpl.theme); }}
                      style={{ textAlign: "left", background: t.glass, border: `2px solid ${isSelected ? gold : t.border}`, borderRadius: "0.75rem", padding: "1rem", cursor: "pointer", position: "relative" }}>
                      {isSelected && (
                        <span style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: gold, color: "#000", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check size={11} />
                        </span>
                      )}
                      <div style={{ height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${tpl.theme.primaryColor}, ${tpl.theme.accentColor ?? tpl.theme.primaryColor})`, marginBottom: "0.7rem" }} />
                      <p style={{ margin: "0 0 0.2rem", fontWeight: 700, fontSize: "0.85rem", color: t.text }}>{tpl.name}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", opacity: 0.5 }}>{tpl.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Tab: Thème ── */}
          {tab === "theme" && (
            <>
              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Couleurs</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {([
                    { key: "primaryColor",  label: "Couleur principale" },
                    { key: "bgColor",       label: "Arrière-plan" },
                    { key: "textColor",     label: "Texte" },
                    { key: "accentColor",   label: "Accent" },
                  ] as { key: keyof CardTheme; label: string }[]).map(f => (
                    <div key={f.key as string}>
                      <label style={labelStyle}>{f.label}</label>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input type="color" value={(thm?.[f.key] as string) ?? "#000000"} onChange={e => setTheme(f.key, e.target.value)}
                          style={{ width: 36, height: 36, borderRadius: "0.4rem", border: `1px solid ${t.border}`, padding: 2, cursor: "pointer", background: "none" }} />
                        <input style={{ ...inputStyle, flex: 1 }} value={(thm?.[f.key] as string) ?? ""} onChange={e => setTheme(f.key, e.target.value)} placeholder="#000000" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Typographie</p>
                <div>
                  <label style={labelStyle}>Police</label>
                  <select style={{ ...inputStyle }} value={thm?.fontFamily ?? ""} onChange={e => setTheme("fontFamily", e.target.value)}>
                    <option value="">Système</option>
                    {["Inter", "Poppins", "Playfair Display", "Raleway", "Lato", "Montserrat", "Source Sans Pro", "Cormorant Garamond"].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Style avatar</p>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {(["circle", "square", "rounded"] as const).map(shape => (
                    <button key={shape} onClick={() => setTheme("avatarShape", shape)}
                      style={{ flex: 1, padding: "0.65rem", border: `2px solid ${(thm?.avatarShape ?? "circle") === shape ? gold : t.border}`, borderRadius: "0.55rem", background: "none", cursor: "pointer", color: t.text, fontWeight: 600, fontSize: "0.78rem" }}>
                      {shape === "circle" ? "Cercle" : shape === "square" ? "Carré" : "Arrondi"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Layout</p>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {(["centered", "left", "split"] as const).map(layout => (
                    <button key={layout} onClick={() => setTheme("layout", layout)}
                      style={{ flex: 1, padding: "0.65rem", border: `2px solid ${(thm?.layout ?? "centered") === layout ? gold : t.border}`, borderRadius: "0.55rem", background: "none", cursor: "pointer", color: t.text, fontWeight: 600, fontSize: "0.78rem" }}>
                      {layout === "centered" ? "Centré" : layout === "left" ? "Gauche" : "Split"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Tab: Avancé ── */}
          {tab === "avance" && (
            <>
              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Slug personnalisé</p>
                <label style={labelStyle}>URL publique (djama.space/c/…)</label>
                <input style={inputStyle} value={form.slug ?? ""} onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="prenom-nom" />
              </div>

              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Options</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    { key: "show_contact_form" as const, label: "Afficher le formulaire de contact" },
                    { key: "allow_save_contact" as const, label: "Permettre l'enregistrement du contact (VCF)" },
                  ].map(opt => (
                    <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer" }}>
                      <div onClick={() => set(opt.key, !form[opt.key])}
                        style={{ width: 38, height: 21, borderRadius: 9999, background: form[opt.key] ? gold : (isDark ? "#ffffff20" : "#d1d5db"), position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
                        <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form[opt.key] ? 19 : 2, transition: "left 0.2s" }} />
                      </div>
                      <span style={{ fontSize: "0.82rem" }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Langue</p>
                <select style={{ ...inputStyle }} value={form.lang ?? "fr"} onChange={e => set("lang", e.target.value)}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div style={sectionStyle}>
                <p style={{ margin: "0 0 0.85rem", fontWeight: 700, fontSize: "0.85rem" }}>Statut</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {(["active", "draft", "disabled"] as const).map(s => (
                    <button key={s} onClick={() => set("status", s)}
                      style={{ padding: "0.5rem 1rem", border: `2px solid ${form.status === s ? gold : t.border}`, borderRadius: "0.5rem", background: form.status === s ? `${gold}18` : "none", color: form.status === s ? gold : t.text, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>
                      {s === "active" ? "Active" : s === "draft" ? "Brouillon" : "Désactivée"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Sidebar IA ── */}
        {aiSidebar && (
          <div style={{ width: 260, borderLeft: `1px solid ${t.border}`, padding: "1.25rem", overflowY: "auto", background: isDark ? "#0f111a" : "#f8f9fc" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sparkles size={14} color={gold} />
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Assistant IA</span>
              </div>
              <button onClick={() => setAiSidebar(false)} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.5 }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {[
                { action: "bio",              label: "Rédiger une bio",          desc: "Génère une biographie professionnelle" },
                { action: "pitch",            label: "Accroche commerciale",     desc: "Phrase d'accroche impactante" },
                { action: "improve",          label: "Améliorer la bio",         desc: "Optimise le texte existant" },
                { action: "suggest_template", label: "Suggérer un modèle",       desc: "IA choisit le meilleur template" },
              ].map(item => (
                <button key={item.action} onClick={() => callAI(item.action)} disabled={!!aiLoading}
                  style={{ padding: "0.75rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.65rem", textAlign: "left", cursor: "pointer", opacity: aiLoading ? 0.6 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.25rem" }}>
                    {aiLoading === item.action ? <Loader2 size={12} color={gold} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={12} color={gold} />}
                    <span style={{ fontWeight: 700, fontSize: "0.8rem", color: t.text }}>{item.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.72rem", opacity: 0.5 }}>{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Aperçu ── */}
        {preview && (
          <div style={{ width: 340, borderLeft: `1px solid ${t.border}`, background: isDark ? "#080a12" : "#eef0f5", display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem 1rem" }}>
            <p style={{ margin: "0 0 1rem", fontSize: "0.72rem", fontWeight: 600, opacity: 0.45, letterSpacing: "0.06em", textTransform: "uppercase" }}>Aperçu</p>
            <div style={{
              width: "100%", maxWidth: 300,
              background: thm?.bgColor ?? currentTpl.theme.bgColor,
              borderRadius: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.22)", overflow: "hidden",
              fontFamily: thm?.fontFamily ? `'${thm.fontFamily}', sans-serif` : "inherit",
            }}>
              {/* Header preview */}
              <div style={{ background: thm?.primaryColor ?? currentTpl.theme.primaryColor, padding: "1.75rem 1.25rem 1.25rem", textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: (thm?.avatarShape ?? "circle") === "circle" ? "50%" : (thm?.avatarShape === "square" ? 4 : 12),
                  background: "#ffffff30", margin: "0 auto 0.75rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {form.avatar_url
                    ? <img src={form.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.4rem" }}>
                        {[form.first_name, form.last_name].filter(Boolean).map(s => s![0]).join("").toUpperCase() || "?"}
                      </span>
                  }
                </div>
                <p style={{ margin: "0 0 0.2rem", color: "#fff", fontWeight: 800, fontSize: "1.05rem" }}>{form.name || "Votre Nom"}</p>
                <p style={{ margin: 0, color: "#ffffff99", fontSize: "0.78rem" }}>{form.job_title || "Votre poste"}</p>
                {form.company && <p style={{ margin: "0.2rem 0 0", color: "#ffffffcc", fontSize: "0.72rem" }}>{form.company}</p>}
              </div>
              {/* Body preview */}
              <div style={{ padding: "1rem 1.25rem", background: thm?.bgColor ?? currentTpl.theme.bgColor }}>
                {form.bio && <p style={{ margin: "0 0 0.85rem", fontSize: "0.76rem", color: thm?.textColor ?? currentTpl.theme.textColor, lineHeight: 1.55, opacity: 0.8 }}>{form.bio}</p>}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {form.phone && <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.76rem", color: thm?.textColor ?? currentTpl.theme.textColor }}><Phone size={12} color={thm?.primaryColor ?? currentTpl.theme.primaryColor} /> {form.phone}</div>}
                  {form.email && <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.76rem", color: thm?.textColor ?? currentTpl.theme.textColor }}><Mail size={12} color={thm?.primaryColor ?? currentTpl.theme.primaryColor} /> {form.email}</div>}
                  {form.website && <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.76rem", color: thm?.textColor ?? currentTpl.theme.textColor }}><Globe size={12} color={thm?.primaryColor ?? currentTpl.theme.primaryColor} /> {form.website}</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── HoursEditor ───────────────────────────────────────────────────────────────

function HoursEditor({ hours, onChange, isDark, t, gold, inputStyle, labelStyle, sectionStyle }: {
  hours: HoursEntry[]; onChange: (h: HoursEntry[]) => void;
  isDark: boolean; t: ReturnType<typeof tok>; gold: string;
  inputStyle: React.CSSProperties; labelStyle: React.CSSProperties; sectionStyle: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const set = (i: number, key: keyof HoursEntry, val: string | boolean) => {
    const updated = [...hours];
    updated[i] = { ...updated[i], [key]: val };
    onChange(updated);
  };
  return (
    <div style={sectionStyle}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", color: t.text }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Clock size={14} /> Horaires
        </p>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div style={{ marginTop: "0.85rem" }}>
          {DAYS.map((day, i) => {
            const entry = hours[i] ?? { day, open: "09:00", close: "18:00", closed: false };
            return (
              <div key={day} style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr auto", gap: "0.5rem", alignItems: "center", marginBottom: "0.45rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, width: 70 }}>{day.slice(0, 3)}</span>
                <input type="time" style={{ ...inputStyle, padding: "0.35rem 0.5rem" }} value={entry.open} onChange={e => set(i, "open", e.target.value)} disabled={entry.closed} />
                <input type="time" style={{ ...inputStyle, padding: "0.35rem 0.5rem" }} value={entry.close} onChange={e => set(i, "close", e.target.value)} disabled={entry.closed} />
                <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!entry.closed} onChange={e => set(i, "closed", e.target.checked)} />
                  Fermé
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── LinksEditor ───────────────────────────────────────────────────────────────

function LinksEditor({ links, onChange, isDark, t, gold, inputStyle, labelStyle, sectionStyle }: {
  links: CustomLink[]; onChange: (l: CustomLink[]) => void;
  isDark: boolean; t: ReturnType<typeof tok>; gold: string;
  inputStyle: React.CSSProperties; labelStyle: React.CSSProperties; sectionStyle: React.CSSProperties;
}) {
  const add = () => onChange([...links, { id: crypto.randomUUID(), label: "", url: "", icon: "link" }]);
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const set = (i: number, key: keyof CustomLink, val: string) => {
    const updated = [...links];
    updated[i] = { ...updated[i], [key]: val };
    onChange(updated);
  };
  return (
    <div style={sectionStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem" }}>Liens personnalisés</p>
        <button onClick={add} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.7rem", background: `${gold}14`, border: `1px solid ${gold}40`, borderRadius: "0.4rem", color: gold, fontWeight: 600, fontSize: "0.74rem", cursor: "pointer" }}>
          <Plus size={11} /> Ajouter
        </button>
      </div>
      {links.length === 0 && <p style={{ fontSize: "0.78rem", opacity: 0.45, margin: 0 }}>Aucun lien personnalisé.</p>}
      {links.map((link, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
          <input style={inputStyle} value={link.label} onChange={e => set(i, "label", e.target.value)} placeholder="Label" />
          <input style={inputStyle} value={link.url} onChange={e => set(i, "url", e.target.value)} placeholder="https://…" />
          <button onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center" }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
