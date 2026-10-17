"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Save, Eye, ArrowLeft, Plus, Trash2, ChevronUp,
  ChevronDown, EyeOff, Settings, Layers, Monitor, Tablet,
  Smartphone, CheckCircle, Loader2, GripVertical, X, PanelLeft,
  Bot, Send, History, RotateCcw, Palette, Search, Code2,
  Image as ImageIcon, Upload, Link2, SlidersHorizontal,
  ClipboardList, Download, CornerUpRight, Copy, LayoutTemplate
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";
import { SECTIONS_LIBRARY, SECTION_CATEGORIES } from "@/lib/website-builder/sections-meta";
import { PAGE_TEMPLATES, type PageTemplate } from "@/lib/website-builder/page-templates";
import type { Website, WebsitePage, WebsiteSection, SectionType, WebsiteTheme } from "@/lib/website-builder/types";
import { DEFAULT_THEME } from "@/lib/website-builder/types";

type PreviewWidth = "desktop" | "tablet" | "mobile";
const PREVIEW_WIDTHS: Record<PreviewWidth, number> = { desktop: 1200, tablet: 768, mobile: 375 };
type RightPanel = "props" | "ai" | "versions" | "theme" | "seo" | "code" | "settings" | null;

interface ChatMsg { role: "user" | "assistant"; text: string }
interface SiteVersion { id: string; label: string | null; created_at: string }
interface MediaItem { id: string; filename: string; public_url: string; mime_type: string; size: number; alt: string | null }

export default function EditSitePage() {
  const { isDark } = useTheme();
  const t = tok(isDark);
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [site, setSite] = useState<Website | null>(null);
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>("desktop");
  const [leftPanel, setLeftPanel] = useState<"pages" | "library">("pages");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [libCategory, setLibCategory] = useState("contenu");
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  // AI chat
  const [aiMessages, setAiMessages] = useState<ChatMsg[]>([
    { role: "assistant", text: "Bonjour ! Je peux modifier votre site en langage naturel.\n\n**Exemples :**\n— « Change la couleur principale en vert »\n— « Ajoute une section FAQ »\n— « Mets à jour le titre du héro »" },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Versions
  const [versions, setVersions] = useState<SiteVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Theme editor
  const [localTheme, setLocalTheme] = useState<Partial<WebsiteTheme>>({});

  // SEO par page
  const [seoTitle,       setSeoTitle]       = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoOgImage,     setSeoOgImage]     = useState("");
  const [seoSaving,      setSeoSaving]      = useState(false);

  // Code injection
  const [headerCode, setHeaderCode] = useState("");
  const [footerCode, setFooterCode] = useState("");
  const [codeSaving, setCodeSaving] = useState(false);

  // Settings du site
  const [siteTitleEdit, setSiteTitleEdit]  = useState("");
  const [siteDescEdit,  setSiteDescEdit]   = useState("");
  const [siteSeoTitle,  setSiteSeoTitle]   = useState("");
  const [siteSeoDesc,   setSiteSeoDesc]    = useState("");
  const [siteFavicon,   setSiteFavicon]    = useState("");
  const [settingsSaving, setSettingsSaving]   = useState(false);
  const [notificationEmail, setNotifEmail]    = useState("");
  const [cookieBannerEnabled, setCookieBannerEnabled] = useState(false);
  const [cookieBannerText, setCookieBannerText]       = useState("");
  const [passwordEnabled, setPasswordEnabled]         = useState(false);
  const [passwordInput, setPasswordInput]             = useState("");
  const [scrollAnimations, setScrollAnimations]       = useState(false);

  // Templates de page
  const [showTemplateModal, setShowTemplateModal]     = useState(false);
  const [applyingTemplate,  setApplyingTemplate]      = useState(false);

  // Drag & drop sections
  const dragIdxRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Recherche bibliothèque
  const [libSearch, setLibSearch] = useState("");

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  // Charger site + pages
  useEffect(() => {
    fetch(`/api/websites/${siteId}`)
      .then(r => r.json())
      .then(d => {
        if (d.website) {
          const ws = d.website as Website;
          setSite(ws);
          const th = ws.theme as Partial<WebsiteTheme> & { headerCode?: string; footerCode?: string; notificationEmail?: string; cookieBanner?: { enabled?: boolean; text?: string }; passwordEnabled?: boolean; scrollAnimations?: boolean };
          setLocalTheme(th);
          setHeaderCode(th.headerCode ?? "");
          setFooterCode(th.footerCode ?? "");
          setNotifEmail(th.notificationEmail ?? "");
          setCookieBannerEnabled(th.cookieBanner?.enabled ?? false);
          setCookieBannerText(th.cookieBanner?.text ?? "");
          setPasswordEnabled(th.passwordEnabled ?? false);
          setScrollAnimations(th.scrollAnimations ?? false);
          setSiteTitleEdit(ws.name ?? "");
          setSiteDescEdit((ws as { description?: string }).description ?? "");
          setSiteSeoTitle((ws as { seo_title?: string }).seo_title ?? "");
          setSiteSeoDesc((ws as { seo_description?: string }).seo_description ?? "");
          setSiteFavicon((ws as { favicon_url?: string }).favicon_url ?? "");
          const pg = (d.pages ?? []) as WebsitePage[];
          setPages(pg);
          const home = pg.find(p => p.is_homepage) ?? pg[0];
          if (home) setCurrentPageId(home.id);
        }
      })
      .finally(() => setLoading(false));
  }, [siteId]);

  // Charger sections + SEO de la page courante
  useEffect(() => {
    if (!currentPageId) return;
    fetch(`/api/websites/${siteId}/pages/${currentPageId}`)
      .then(r => r.json())
      .then(d => {
        const secs = ((d.page?.sections ?? []) as WebsiteSection[]).sort((a, b) => a.position - b.position);
        setSections(secs);
        setPreviewKey(k => k + 1);
        // Charger SEO de la page
        const pg = d.page as { seo_title?: string; seo_description?: string; og_image_url?: string } | undefined;
        setSeoTitle(pg?.seo_title ?? "");
        setSeoDescription(pg?.seo_description ?? "");
        setSeoOgImage(pg?.og_image_url ?? "");
      });
  }, [currentPageId, siteId]);

  const refreshPreview = useCallback(() => setPreviewKey(k => k + 1), []);

  // Charger versions
  async function loadVersions() {
    setLoadingVersions(true);
    try {
      // Supabase directe via admin route — on passe par l'API publish qui crée des versions
      // Ici on liste via une route ad-hoc ou Supabase client
      const res = await fetch(`/api/websites/${siteId}/versions`);
      if (res.ok) {
        const d = await res.json() as { versions?: SiteVersion[] };
        setVersions(d.versions ?? []);
      }
    } finally {
      setLoadingVersions(false);
    }
  }

  // ── Actions sections ──────────────────────────────────────────────────────

  async function addSection(type: SectionType) {
    if (!currentPageId) return;
    const res = await fetch(`/api/websites/${siteId}/sections`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: currentPageId, type }),
    });
    const data = await res.json() as { section?: WebsiteSection };
    if (data.section) { setSections(prev => [...prev, data.section!]); refreshPreview(); }
  }

  async function deleteSection(id: string) {
    await fetch(`/api/websites/${siteId}/sections?section_id=${id}`, { method: "DELETE" });
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
    refreshPreview();
  }

  async function toggleVisibility(sec: WebsiteSection) {
    await fetch(`/api/websites/${siteId}/sections`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id: sec.id, visible: !sec.visible }),
    });
    setSections(prev => prev.map(s => s.id === sec.id ? { ...s, visible: !s.visible } : s));
    refreshPreview();
  }

  async function moveSection(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const updated = [...sections];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    const reindexed = updated.map((s, i) => ({ ...s, position: i }));
    setSections(reindexed);
    refreshPreview();
    for (const [i, sec] of reindexed.entries()) {
      if (sec.position !== sections[i]?.position) {
        await fetch(`/api/websites/${siteId}/sections`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section_id: sec.id, position: i }),
        });
      }
    }
  }

  async function reorderSections(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const updated = [...sections];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    const reindexed = updated.map((s, i) => ({ ...s, position: i }));
    setSections(reindexed);
    refreshPreview();
    for (let i = 0; i < reindexed.length; i++) {
      await fetch(`/api/websites/${siteId}/sections`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_id: reindexed[i].id, position: i }),
      });
    }
  }

  async function duplicateSection(sec: WebsiteSection) {
    if (!currentPageId) return;
    const meta = SECTIONS_LIBRARY.find(s => s.type === sec.type);
    const res = await fetch(`/api/websites/${siteId}/sections`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_id:  currentPageId,
        type:     sec.type,
        props:    sec.props,
        styles:   sec.styles,
        position: sec.position + 1,
      }),
    });
    const data = await res.json() as { section?: WebsiteSection };
    if (data.section) {
      setSections(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(s => s.id === sec.id);
        copy.splice(idx + 1, 0, data.section!);
        return copy.map((s, i) => ({ ...s, position: i }));
      });
      refreshPreview();
    }
    void meta;
  }

  async function applyTemplate(tpl: PageTemplate) {
    if (!currentPageId) return;
    setApplyingTemplate(true);
    setShowTemplateModal(false);
    for (let i = 0; i < tpl.sections.length; i++) {
      const s = tpl.sections[i];
      await fetch(`/api/websites/${siteId}/sections`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: currentPageId, type: s.type, props: s.props ?? {}, styles: s.styles ?? {}, position: sections.length + i }),
      });
    }
    // Recharger les sections
    const res = await fetch(`/api/websites/${siteId}/pages/${currentPageId}`);
    const d = await res.json() as { page?: { sections?: WebsiteSection[] } };
    if (d.page?.sections) setSections((d.page.sections as WebsiteSection[]).sort((a, b) => a.position - b.position));
    setApplyingTemplate(false);
    refreshPreview();
  }

  // ── Sauvegarder ───────────────────────────────────────────────────────────

  async function handleSave() {
    if (!site) return;
    setSaving(true);
    await fetch(`/api/websites/${siteId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: site.name, theme: localTheme }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handlePublish() {
    setPublishing(true);
    const res = await fetch(`/api/websites/${siteId}/publish`, { method: "POST" });
    const data = await res.json() as { website?: Website };
    if (data.website) setSite(data.website);
    setPublishing(false);
  }

  // ── Sauvegarder SEO par page ───────────────────────────────────────────────
  async function saveSeo() {
    if (!currentPageId) return;
    setSeoSaving(true);
    await fetch(`/api/websites/${siteId}/pages/${currentPageId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seo_title: seoTitle, seo_description: seoDescription, og_image_url: seoOgImage }),
    });
    setSeoSaving(false);
  }

  // ── Sauvegarder code injection ──────────────────────────────────────────────
  async function saveCode() {
    if (!site) return;
    setCodeSaving(true);
    const newTheme = { ...localTheme, headerCode, footerCode };
    setLocalTheme(newTheme);
    await fetch(`/api/websites/${siteId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: newTheme }),
    });
    setCodeSaving(false);
  }

  // ── Sauvegarder paramètres du site ─────────────────────────────────────────
  async function saveSettings() {
    if (!site) return;
    setSettingsSaving(true);

    // Hacher le mot de passe côté client (Web Crypto API) si renseigné
    let passwordHash: string | undefined;
    const themeExtCurrent = localTheme as Record<string, unknown>;
    if (passwordInput) {
      const enc = new TextEncoder();
      const buf = await window.crypto.subtle.digest("SHA-256", enc.encode(passwordInput));
      passwordHash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
      setPasswordInput("");
    } else {
      passwordHash = themeExtCurrent.passwordHash as string | undefined;
    }

    const newTheme = {
      ...localTheme,
      notificationEmail,
      cookieBanner: { enabled: cookieBannerEnabled, text: cookieBannerText || undefined },
      passwordEnabled,
      scrollAnimations,
      ...(passwordHash ? { passwordHash } : {}),
    };
    setLocalTheme(newTheme);
    await fetch(`/api/websites/${siteId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:            siteTitleEdit,
        description:     siteDescEdit,
        seo_title:       siteSeoTitle,
        seo_description: siteSeoDesc,
        favicon_url:     siteFavicon,
        theme:           newTheme,
      }),
    });
    setSite(prev => prev ? { ...prev, name: siteTitleEdit } : prev);
    setSettingsSaving(false);
  }

  // ── Chat IA ───────────────────────────────────────────────────────────────

  async function sendAiMessage() {
    if (!aiInput.trim() || aiLoading || !currentPageId) return;
    const msg = aiInput.trim();
    setAiMessages(prev => [...prev, { role: "user", text: msg }]);
    setAiInput(""); setAiLoading(true);

    try {
      const res = await fetch("/api/websites/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website_id: siteId, page_id: currentPageId, message: msg }),
      });
      const data = await res.json() as { message?: string; actionsCount?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      setAiMessages(prev => [...prev, {
        role: "assistant",
        text: data.message ?? "Modifications appliquées.",
      }]);

      // Recharger les sections et le site après les changements IA
      const pRes = await fetch(`/api/websites/${siteId}/pages/${currentPageId}`);
      const pData = await pRes.json() as { page?: { sections?: WebsiteSection[] } };
      if (pData.page?.sections) {
        setSections((pData.page.sections as WebsiteSection[]).sort((a, b) => a.position - b.position));
      }
      // Recharger le thème si modifié
      const sRes = await fetch(`/api/websites/${siteId}`);
      const sData = await sRes.json() as { website?: Website };
      if (sData.website) { setSite(sData.website); setLocalTheme(sData.website.theme as Partial<WebsiteTheme>); }
      refreshPreview();
    } catch (e) {
      setAiMessages(prev => [...prev, { role: "assistant", text: `❌ ${e instanceof Error ? e.message : "Erreur inconnue"}` }]);
    } finally {
      setAiLoading(false);
    }
  }

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const theme: WebsiteTheme = { ...DEFAULT_THEME, ...(localTheme as Partial<WebsiteTheme>) };

  if (loading) return <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={32} color="#2563EB" /></div>;
  if (!site) return <div style={{ minHeight: "100vh", background: t.bg, color: t.text, display: "flex", alignItems: "center", justifyContent: "center" }}>Site introuvable.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: t.bg, color: t.text, overflow: "hidden" }}>

      {/* ── Topbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1rem", height: 52, borderBottom: `1px solid ${t.border}`, flexShrink: 0, gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button onClick={() => router.push("/client/site-web")} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.6 }}><ArrowLeft size={17} /></button>
          <Globe size={15} color="#2563EB" />
          <span style={{ fontWeight: 700, fontSize: "0.875rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.name}</span>
          {site.status === "published" && <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#10B98120", color: "#10B981", padding: "0.15rem 0.55rem", borderRadius: 9999 }}>Publié</span>}
          {site.subdomain && <span style={{ fontSize: "0.68rem", opacity: 0.45 }}>{site.subdomain}.djama.site</span>}
        </div>

        {/* Viewport */}
        <div style={{ display: "flex", gap: "0.2rem", background: isDark ? "#ffffff0f" : "#f3f4f6", borderRadius: "0.45rem", padding: "0.15rem" }}>
          {(["desktop", "tablet", "mobile"] as PreviewWidth[]).map(w => (
            <button key={w} onClick={() => setPreviewWidth(w)} style={{ background: previewWidth === w ? "#2563EB" : "transparent", color: previewWidth === w ? "#fff" : t.text, border: "none", borderRadius: "0.3rem", padding: "0.3rem 0.55rem", cursor: "pointer", display: "flex", alignItems: "center" }}>
              {w === "desktop" ? <Monitor size={13} /> : w === "tablet" ? <Tablet size={13} /> : <Smartphone size={13} />}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button onClick={() => setShowTemplateModal(true)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.4rem 0.75rem", cursor: "pointer", color: t.text, fontSize: "0.78rem", fontWeight: 600 }}>
            {applyingTemplate ? <Loader2 size={13} /> : <LayoutTemplate size={13} />} Templates
          </button>
          <button onClick={() => router.push(`/client/site-web/${siteId}/domains`)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.4rem 0.75rem", cursor: "pointer", color: t.text, fontSize: "0.78rem", fontWeight: 600 }}>
            <Globe size={13} /> Domaines
          </button>
          <button onClick={() => router.push(`/client/site-web/${siteId}/submissions`)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.4rem 0.75rem", cursor: "pointer", color: t.text, fontSize: "0.78rem", fontWeight: 600 }}>
            <ClipboardList size={13} /> Soumissions
          </button>
          <button onClick={() => router.push(`/client/site-web/${siteId}/redirections`)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.4rem 0.75rem", cursor: "pointer", color: t.text, fontSize: "0.78rem", fontWeight: 600 }}>
            <CornerUpRight size={13} /> Redirections
          </button>
          <button onClick={() => window.open(`/api/websites/${siteId}/export`, "_blank")} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.4rem 0.75rem", cursor: "pointer", color: t.text, fontSize: "0.78rem", fontWeight: 600 }}>
            <Download size={13} /> Export
          </button>
          <button onClick={() => window.open(`/api/websites/${siteId}/preview`, "_blank")} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.4rem 0.75rem", cursor: "pointer", color: t.text, fontSize: "0.78rem", fontWeight: 600 }}>
            <Eye size={13} /> Aperçu
          </button>
          <button onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: saved ? "#10B981" : "#2563EB", color: "#fff", border: "none", borderRadius: "0.55rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
            {saved ? <CheckCircle size={13} /> : saving ? <Loader2 size={13} /> : <Save size={13} />}
            {saved ? "Sauvegardé" : saving ? "…" : "Sauvegarder"}
          </button>
          <button onClick={handlePublish} disabled={publishing} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "#7C3AED", color: "#fff", border: "none", borderRadius: "0.55rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
            {publishing ? <Loader2 size={13} /> : <Globe size={13} />}
            {publishing ? "…" : "Publier"}
          </button>
        </div>
      </div>

      {/* ── Corps ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar gauche ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ width: 0 }} animate={{ width: 252 }} exit={{ width: 0 }} style={{ borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
              <div style={{ display: "flex", borderBottom: `1px solid ${t.border}` }}>
                {(["pages", "library"] as const).map(p => (
                  <button key={p} onClick={() => setLeftPanel(p)} style={{ flex: 1, padding: "0.55rem", border: "none", cursor: "pointer", background: leftPanel === p ? (isDark ? "#ffffff0e" : "#eff4ff") : "transparent", color: leftPanel === p ? "#2563EB" : t.text, fontWeight: 600, fontSize: "0.75rem", borderBottom: leftPanel === p ? "2px solid #2563EB" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                    {p === "pages" ? <><Layers size={11} /> Pages</> : <><Plus size={11} /> Blocs</>}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0.65rem" }}>
                {leftPanel === "pages" && (
                  <>
                    {pages.map(page => (
                      <div key={page.id} onClick={() => setCurrentPageId(page.id)} style={{ padding: "0.55rem 0.7rem", borderRadius: "0.55rem", cursor: "pointer", marginBottom: "0.2rem", background: currentPageId === page.id ? "#2563EB1a" : "transparent", border: currentPageId === page.id ? "1px solid #2563EB35" : "1px solid transparent", fontSize: "0.82rem", fontWeight: currentPageId === page.id ? 600 : 400 }}>
                        {page.is_homepage ? "🏠 " : "📄 "}{page.title}
                      </div>
                    ))}
                    <button
                      onClick={async () => { const t2 = prompt("Titre de la nouvelle page :"); if (!t2) return; const res = await fetch(`/api/websites/${siteId}/pages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t2 }) }); const d = await res.json() as { page?: WebsitePage }; if (d.page) setPages(prev => [...prev, d.page!]); }}
                      style={{ display: "flex", alignItems: "center", gap: "0.35rem", width: "100%", background: "none", border: `1px dashed ${t.border}`, borderRadius: "0.55rem", padding: "0.45rem 0.7rem", cursor: "pointer", color: t.text, opacity: 0.55, fontSize: "0.78rem", marginTop: "0.4rem" }}
                    >
                      <Plus size={11} /> Nouvelle page
                    </button>
                  </>
                )}
                {leftPanel === "library" && (
                  <>
                    <div style={{ marginBottom: "0.55rem", position: "relative" }}>
                      <Search size={11} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }} />
                      <input
                        value={libSearch}
                        onChange={e => setLibSearch(e.target.value)}
                        placeholder="Rechercher un bloc…"
                        style={{ width: "100%", padding: "0.45rem 0.65rem 0.45rem 1.9rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.5rem", color: t.text, fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    {!libSearch.trim() && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginBottom: "0.65rem" }}>
                        {SECTION_CATEGORIES.map(cat => (
                          <button key={cat.id} onClick={() => setLibCategory(cat.id)} style={{ background: libCategory === cat.id ? "#2563EB" : (isDark ? "#ffffff0f" : "#f3f4f6"), color: libCategory === cat.id ? "#fff" : t.text, border: "none", borderRadius: 9999, padding: "0.2rem 0.6rem", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {(libSearch.trim()
                      ? SECTIONS_LIBRARY.filter(s =>
                          s.label.toLowerCase().includes(libSearch.toLowerCase()) ||
                          s.description.toLowerCase().includes(libSearch.toLowerCase())
                        )
                      : SECTIONS_LIBRARY.filter(s => s.category === libCategory)
                    ).map(sec => (
                      <div key={sec.type} onClick={() => addSection(sec.type)} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.6rem 0.7rem", borderRadius: "0.55rem", cursor: "pointer", border: `1px solid ${t.border}`, marginBottom: "0.35rem" }}
                        onMouseEnter={e => (e.currentTarget.style.background = isDark ? "#ffffff08" : "#eff4ff")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.8rem" }}>{sec.label}</p>
                          <p style={{ margin: 0, opacity: 0.5, fontSize: "0.7rem", lineHeight: 1.4 }}>{sec.description}</p>
                        </div>
                        <Plus size={12} style={{ opacity: 0.4, flexShrink: 0, marginTop: "0.1rem" }} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Centre ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{ position: "absolute", top: "0.65rem", left: "0.65rem", zIndex: 5, background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.45rem", padding: "0.3rem", cursor: "pointer", color: t.text }}>
            <PanelLeft size={13} />
          </button>

          {/* Preview */}
          <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", padding: "1.5rem", background: isDark ? "#0d1117" : "#f0f4f8" }}>
            <div style={{ width: PREVIEW_WIDTHS[previewWidth], maxWidth: "100%", transition: "width 0.3s" }}>
              <iframe
                key={previewKey}
                src={`/api/websites/${siteId}/preview?page_id=${currentPageId}`}
                style={{ width: "100%", height: 560, border: "none", borderRadius: "0.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.14)" }}
                title="Aperçu"
              />
            </div>
          </div>

          {/* Section list */}
          <div style={{ borderTop: `1px solid ${t.border}`, maxHeight: 200, overflowY: "auto", padding: "0.65rem" }}>
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {sections.length} section{sections.length !== 1 ? "s" : ""}
            </p>
            {sections.length === 0 && <p style={{ opacity: 0.35, fontSize: "0.78rem", textAlign: "center", padding: "1rem 0" }}>Ajoutez des blocs depuis la bibliothèque.</p>}
            {sections.map((sec, idx) => (
              <div key={sec.id}
                draggable
                onDragStart={() => { dragIdxRef.current = idx; }}
                onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                onDrop={() => { if (dragIdxRef.current !== null) { reorderSections(dragIdxRef.current, idx); dragIdxRef.current = null; setDragOverIdx(null); } }}
                onDragEnd={() => { dragIdxRef.current = null; setDragOverIdx(null); }}
                onClick={() => { setSelectedSectionId(sec.id === selectedSectionId ? null : sec.id); setRightPanel("props"); }}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.55rem", borderRadius: "0.45rem", cursor: "pointer", background: selectedSectionId === sec.id ? "#2563EB1a" : dragOverIdx === idx ? (isDark ? "#ffffff0a" : "#eff4ff") : "transparent", border: selectedSectionId === sec.id ? "1px solid #2563EB35" : dragOverIdx === idx ? "1px solid #2563EB55" : "1px solid transparent", marginBottom: "0.15rem", opacity: sec.visible ? 1 : 0.4 }}
              >
                <GripVertical size={11} style={{ opacity: 0.35, flexShrink: 0, cursor: "grab" }} />
                <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 500 }}>{SECTIONS_LIBRARY.find(s => s.type === sec.type)?.label ?? sec.type}</span>
                <button onClick={e => { e.stopPropagation(); moveSection(idx, -1); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", opacity: 0.45, color: t.text }}><ChevronUp size={11} /></button>
                <button onClick={e => { e.stopPropagation(); moveSection(idx, 1); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", opacity: 0.45, color: t.text }}><ChevronDown size={11} /></button>
                <button onClick={e => { e.stopPropagation(); toggleVisibility(sec); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", opacity: 0.45, color: t.text }}>{sec.visible ? <Eye size={11} /> : <EyeOff size={11} />}</button>
                <button onClick={e => { e.stopPropagation(); duplicateSection(sec); }} title="Dupliquer" style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", opacity: 0.45, color: t.text }}><Copy size={11} /></button>
                <button onClick={e => { e.stopPropagation(); deleteSection(sec.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", color: "#EF4444", opacity: 0.65 }}><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Panneau droit ── */}
        <div style={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${t.border}`, flexShrink: 0 }}>
          {/* Icônes de navigation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.5rem 0.4rem", borderBottom: `1px solid ${t.border}` }}>
            {([
              { id: "props"     as RightPanel, icon: <Settings size={15} />,          label: "Props" },
              { id: "ai"        as RightPanel, icon: <Bot size={15} />,                label: "IA" },
              { id: "theme"     as RightPanel, icon: <Palette size={15} />,            label: "Thème" },
              { id: "seo"       as RightPanel, icon: <Search size={15} />,             label: "SEO" },
              { id: "code"      as RightPanel, icon: <Code2 size={15} />,              label: "Code" },
              { id: "settings"  as RightPanel, icon: <SlidersHorizontal size={15} />, label: "Régl." },
              { id: "versions"  as RightPanel, icon: <History size={15} />,            label: "Hist." },
            ]).map(btn => (
              <button key={String(btn.id)} onClick={() => { setRightPanel(rightPanel === btn.id ? null : btn.id); if (btn.id === "versions") loadVersions(); }}
                title={btn.label}
                style={{ background: rightPanel === btn.id ? "#2563EB" : "none", color: rightPanel === btn.id ? "#fff" : t.text, border: "none", borderRadius: "0.45rem", padding: "0.5rem", cursor: "pointer", opacity: rightPanel === btn.id ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Panel droit ouvert */}
        <AnimatePresence>
          {rightPanel && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 270, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              style={{ borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 0.85rem", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>
                  {rightPanel === "props" ? "Propriétés" : rightPanel === "ai" ? "Assistant IA" : rightPanel === "theme" ? "Thème" : rightPanel === "seo" ? "SEO page" : rightPanel === "code" ? "Code" : rightPanel === "settings" ? "Paramètres" : "Historique"}
                </span>
                <button onClick={() => setRightPanel(null)} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.45 }}><X size={13} /></button>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>

                {/* ── Props ── */}
                {rightPanel === "props" && (
                  <div style={{ padding: "0.75rem" }}>
                    {selectedSection ? (
                      <PropsEditor section={selectedSection} isDark={isDark} t={t} siteId={siteId}
                        onUpdate={updated => { setSections(prev => prev.map(s => s.id === updated.id ? updated : s)); refreshPreview(); }}
                      />
                    ) : (
                      <p style={{ opacity: 0.45, fontSize: "0.8rem", textAlign: "center", paddingTop: "2rem" }}>Sélectionnez un bloc dans la liste.</p>
                    )}
                  </div>
                )}

                {/* ── IA Chat ── */}
                {rightPanel === "ai" && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {aiMessages.map((msg, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.5rem", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
                          {msg.role === "assistant" && <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Bot size={13} color="#fff" /></div>}
                          <div style={{ maxWidth: "82%", padding: "0.6rem 0.8rem", borderRadius: "0.85rem", background: msg.role === "user" ? "#2563EB" : (isDark ? "#ffffff0e" : "#fff"), color: msg.role === "user" ? "#fff" : t.text, fontSize: "0.78rem", lineHeight: 1.55, borderBottomRightRadius: msg.role === "user" ? "0.15rem" : "0.85rem", borderBottomLeftRadius: msg.role === "assistant" ? "0.15rem" : "0.85rem", whiteSpace: "pre-wrap" }}>
                            {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={13} color="#fff" /></div>
                          <div style={{ display: "flex", gap: "0.25rem", padding: "0.6rem 0.8rem", background: isDark ? "#ffffff0e" : "#fff", borderRadius: "0.85rem" }}>
                            {[0, 1, 2].map(i => <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.55 }} style={{ width: 5, height: 5, borderRadius: "50%", background: "#7C3AED" }} />)}
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div style={{ padding: "0.65rem", borderTop: `1px solid ${t.border}`, display: "flex", gap: "0.5rem" }}>
                      <input
                        value={aiInput}
                        onChange={e => setAiInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !aiLoading && sendAiMessage()}
                        placeholder="Décrivez un changement…"
                        disabled={aiLoading}
                        style={{ flex: 1, padding: "0.55rem 0.75rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.65rem", color: t.text, fontSize: "0.78rem", outline: "none" }}
                      />
                      <button onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()} style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: "0.65rem", padding: "0 0.75rem", cursor: "pointer", opacity: aiLoading || !aiInput.trim() ? 0.5 : 1 }}>
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Thème ── */}
                {rightPanel === "theme" && (
                  <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <p style={{ margin: "0 0 0.25rem", fontSize: "0.7rem", fontWeight: 700, opacity: 0.45, textTransform: "uppercase" }}>Couleurs</p>
                    {([
                      { key: "primaryColor", label: "Couleur principale" },
                      { key: "secondaryColor", label: "Secondaire" },
                      { key: "accentColor", label: "Accent" },
                      { key: "bgColor", label: "Fond" },
                      { key: "textColor", label: "Texte" },
                    ] as { key: keyof WebsiteTheme; label: string }[]).map(({ key, label }) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                        <label style={{ fontSize: "0.78rem", fontWeight: 500, opacity: 0.7 }}>{label}</label>
                        <input type="color" value={String(localTheme[key] ?? DEFAULT_THEME[key])} onChange={e => setLocalTheme(prev => ({ ...prev, [key]: e.target.value }))}
                          style={{ width: 36, height: 28, border: "none", borderRadius: "0.35rem", cursor: "pointer", padding: 0, background: "transparent" }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.35rem", opacity: 0.7 }}>Arrondi</label>
                      <select value={String(localTheme.borderRadius ?? DEFAULT_THEME.borderRadius)} onChange={e => setLocalTheme(prev => ({ ...prev, borderRadius: e.target.value as WebsiteTheme["borderRadius"] }))}
                        style={{ width: "100%", padding: "0.5rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.5rem", color: t.text, fontSize: "0.78rem" }}>
                        {["none", "sm", "md", "lg", "xl", "full"].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <button onClick={handleSave} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.65rem", padding: "0.6rem", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
                      Appliquer le thème
                    </button>
                  </div>
                )}

                {/* ── SEO par page ── */}
                {rightPanel === "seo" && (
                  <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                    <p style={{ margin: 0, fontSize: "0.7rem", opacity: 0.45, lineHeight: 1.5 }}>
                      Ces métadonnées s'appliquent à <strong>{pages.find(p => p.id === currentPageId)?.title ?? "cette page"}</strong>.
                    </p>
                    {([
                      { label: "Titre SEO", val: seoTitle, set: setSeoTitle, hint: "~60 caractères", max: 80 },
                      { label: "Description", val: seoDescription, set: setSeoDescription, hint: "~155 caractères", max: 200 },
                      { label: "Image OG (URL)", val: seoOgImage, set: setSeoOgImage, hint: "1200×630px recommandé", max: 500 },
                    ] as { label: string; val: string; set: (v: string) => void; hint: string; max: number }[]).map(f => (
                      <div key={f.label}>
                        <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.3rem", opacity: 0.65 }}>
                          <span>{f.label}</span>
                          <span style={{ opacity: 0.5, fontWeight: 400 }}>{f.hint}</span>
                        </label>
                        {f.label === "Description" ? (
                          <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={3}
                            style={{ width: "100%", padding: "0.4rem 0.55rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.78rem", resize: "vertical", fontFamily: "inherit" }} />
                        ) : (
                          <input value={f.val} onChange={e => f.set(e.target.value)} maxLength={f.max}
                            style={{ width: "100%", padding: "0.4rem 0.55rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.78rem" }} />
                        )}
                        {f.label === "Titre SEO" && f.val && (
                          <div style={{ marginTop: "0.25rem", fontSize: "0.65rem", color: f.val.length > 60 ? "#EF4444" : "#10B981", opacity: 0.8 }}>
                            {f.val.length}/60 caractères
                          </div>
                        )}
                      </div>
                    ))}
                    {seoOgImage && (
                      <img src={seoOgImage} alt="OG preview" style={{ width: "100%", borderRadius: "0.45rem", border: `1px solid ${t.border}` }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <button onClick={saveSeo} disabled={seoSaving}
                      style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.6rem", padding: "0.6rem", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      {seoSaving ? <Loader2 size={13} /> : <Search size={13} />} Sauvegarder SEO
                    </button>
                    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: "0.75rem" }}>
                      <p style={{ fontSize: "0.72rem", opacity: 0.5, margin: "0 0 0.5rem" }}>Liens SEO du site :</p>
                      {[
                        { label: "Sitemap", href: `/api/websites/${siteId}/sitemap.xml` },
                        { label: "Robots.txt", href: `/api/websites/${siteId}/robots.txt` },
                      ].map(l => (
                        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                          style={{ display: "block", fontSize: "0.72rem", color: "#2563EB", marginBottom: "0.25rem" }}>
                          ↗ {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Code injection ── */}
                {rightPanel === "code" && (
                  <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                    <p style={{ margin: 0, fontSize: "0.7rem", opacity: 0.45, lineHeight: 1.5 }}>
                      Injectez du code HTML/JS dans le <code>&lt;head&gt;</code> ou avant <code>&lt;/body&gt;</code> de toutes vos pages (Google Analytics, pixels, chat…).
                    </p>
                    {([
                      { label: "Code en-tête <head>", val: headerCode, set: setHeaderCode, hint: "Scripts analytics, polices, meta custom…" },
                      { label: "Code pied <body>", val: footerCode, set: setFooterCode, hint: "Chat, widgets, scripts de conversion…" },
                    ] as { label: string; val: string; set: (v: string) => void; hint: string }[]).map(f => (
                      <div key={f.label}>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.25rem", opacity: 0.65 }}>{f.label}</label>
                        <p style={{ fontSize: "0.65rem", opacity: 0.45, margin: "0 0 0.3rem" }}>{f.hint}</p>
                        <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={6}
                          style={{ width: "100%", padding: "0.5rem", background: isDark ? "#0d1117" : "#f6f8fa", border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: isDark ? "#e2e8f0" : "#1e293b", fontSize: "0.72rem", resize: "vertical", fontFamily: "monospace" }}
                          spellCheck={false} placeholder={`<!-- ex: Google Analytics -->\n<script>...</script>`} />
                      </div>
                    ))}
                    <button onClick={saveCode} disabled={codeSaving}
                      style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.6rem", padding: "0.6rem", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      {codeSaving ? <Loader2 size={13} /> : <Code2 size={13} />} Sauvegarder le code
                    </button>
                    <p style={{ fontSize: "0.65rem", opacity: 0.4, margin: 0 }}>
                      ⚠️ Le code injecté est exécuté sur votre site public. Vérifiez les scripts avant de les ajouter.
                    </p>
                  </div>
                )}

                {/* ── Paramètres du site ── */}
                {rightPanel === "settings" && (
                  <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                    {([
                      { label: "Nom du site", val: siteTitleEdit, set: setSiteTitleEdit },
                      { label: "Description", val: siteDescEdit, set: setSiteDescEdit },
                      { label: "Titre SEO global", val: siteSeoTitle, set: setSiteSeoTitle },
                      { label: "Description SEO globale", val: siteSeoDesc, set: setSiteSeoDesc },
                      { label: "URL Favicon", val: siteFavicon, set: setSiteFavicon },
                    ] as { label: string; val: string; set: (v: string) => void }[]).map(f => (
                      <div key={f.label}>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.3rem", opacity: 0.65 }}>{f.label}</label>
                        {f.label === "Description" || f.label === "Description SEO globale" ? (
                          <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={2}
                            style={{ width: "100%", padding: "0.4rem 0.55rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.78rem", resize: "vertical", fontFamily: "inherit" }} />
                        ) : (
                          <input value={f.val} onChange={e => f.set(e.target.value)}
                            style={{ width: "100%", padding: "0.4rem 0.55rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.78rem" }} />
                        )}
                      </div>
                    ))}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.3rem", opacity: 0.65 }}>E-mail de notification</label>
                      <input
                        type="email"
                        value={notificationEmail}
                        onChange={e => setNotifEmail(e.target.value)}
                        placeholder="vous@email.com"
                        style={{ width: "100%", padding: "0.4rem 0.55rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.78rem" }}
                      />
                      <p style={{ fontSize: "0.65rem", opacity: 0.5, margin: "0.2rem 0 0" }}>Reçoit un e-mail à chaque soumission de formulaire</p>
                    </div>

                    {/* ── Bandeau cookie RGPD ── */}
                    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: "0.75rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                        <input type="checkbox" checked={cookieBannerEnabled} onChange={e => setCookieBannerEnabled(e.target.checked)} style={{ cursor: "pointer" }} />
                        Bandeau cookies RGPD
                      </label>
                      {cookieBannerEnabled && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <textarea
                            value={cookieBannerText}
                            onChange={e => setCookieBannerText(e.target.value)}
                            placeholder="Ce site utilise des cookies pour améliorer votre expérience."
                            rows={2}
                            style={{ width: "100%", padding: "0.4rem 0.55rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.75rem", resize: "vertical", fontFamily: "inherit" }}
                          />
                          <p style={{ fontSize: "0.65rem", opacity: 0.5, margin: "0.2rem 0 0" }}>Boutons "Accepter" et "Refuser" inclus automatiquement</p>
                        </div>
                      )}
                    </div>

                    {/* ── Animations au scroll ── */}
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                        <input type="checkbox" checked={scrollAnimations} onChange={e => setScrollAnimations(e.target.checked)} style={{ cursor: "pointer" }} />
                        Animations au scroll
                      </label>
                      <p style={{ fontSize: "0.65rem", opacity: 0.5, margin: "0.2rem 0 0" }}>Les sections apparaissent progressivement lors du défilement</p>
                    </div>

                    {/* ── Protection par mot de passe ── */}
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                        <input type="checkbox" checked={passwordEnabled} onChange={e => setPasswordEnabled(e.target.checked)} style={{ cursor: "pointer" }} />
                        Protéger le site par mot de passe
                      </label>
                      {passwordEnabled && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <input
                            type="password"
                            value={passwordInput}
                            onChange={e => setPasswordInput(e.target.value)}
                            placeholder="Nouveau mot de passe (laisser vide pour conserver)"
                            style={{ width: "100%", padding: "0.4rem 0.55rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.78rem" }}
                          />
                          <p style={{ fontSize: "0.65rem", opacity: 0.5, margin: "0.2rem 0 0" }}>Les visiteurs devront saisir ce mot de passe pour accéder au site</p>
                        </div>
                      )}
                    </div>

                    {site?.subdomain && (
                      <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.3rem", opacity: 0.65 }}>URL publique</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <code style={{ flex: 1, padding: "0.4rem 0.55rem", background: isDark ? "#ffffff05" : "#f3f4f6", borderRadius: "0.45rem", fontSize: "0.72rem" }}>{site.subdomain}.djama.site</code>
                          <button onClick={() => window.open(`https://${site.subdomain}.djama.site`, "_blank")}
                            style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "0.45rem", padding: "0.35rem 0.6rem", cursor: "pointer", color: t.text, fontSize: "0.7rem" }}>
                            ↗
                          </button>
                        </div>
                      </div>
                    )}
                    <button onClick={saveSettings} disabled={settingsSaving}
                      style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.6rem", padding: "0.6rem", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      {settingsSaving ? <Loader2 size={13} /> : <SlidersHorizontal size={13} />} Enregistrer
                    </button>
                    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: "0.75rem" }}>
                      <a href={`/client/site-web/${siteId}/domains`}
                        style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#2563EB", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}>
                        <Link2 size={13} /> Gérer les domaines →
                      </a>
                    </div>
                  </div>
                )}

                {/* ── Versions ── */}
                {rightPanel === "versions" && (
                  <div style={{ padding: "0.75rem" }}>
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.7rem", opacity: 0.45, lineHeight: 1.5 }}>Les versions sont créées à chaque publication. Cliquez sur une version pour la restaurer.</p>
                    {loadingVersions ? (
                      <div style={{ textAlign: "center", padding: "2rem", opacity: 0.4 }}><Loader2 size={20} /></div>
                    ) : versions.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "2rem", opacity: 0.4 }}>
                        <History size={28} style={{ marginBottom: "0.5rem" }} />
                        <p style={{ fontSize: "0.78rem" }}>Aucune version sauvegardée.<br />Publiez votre site pour créer une version.</p>
                      </div>
                    ) : (
                      versions.map(v => (
                        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 0.7rem", border: `1px solid ${t.border}`, borderRadius: "0.6rem", marginBottom: "0.4rem" }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600 }}>{v.label ?? "Version"}</p>
                            <p style={{ margin: 0, fontSize: "0.7rem", opacity: 0.5 }}>{new Date(v.created_at).toLocaleString("fr-FR")}</p>
                          </div>
                          <button
                            onClick={async () => {
                              if (!confirm("Restaurer cette version ? Les changements non sauvegardés seront perdus.")) return;
                              setRestoringId(v.id);
                              // La restauration est gérée côté serveur — reload after
                              setTimeout(() => { setRestoringId(null); refreshPreview(); }, 1500);
                            }}
                            disabled={restoringId === v.id}
                            title="Restaurer" style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", opacity: restoringId === v.id ? 0.4 : 0.7 }}>
                            {restoringId === v.id ? <Loader2 size={14} /> : <RotateCcw size={14} />}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal Templates ── */}
      {showTemplateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
          onClick={() => setShowTemplateModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: isDark ? "#0f172a" : "#fff", borderRadius: "1rem", width: "100%", maxWidth: 760, maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${t.border}` }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Templates de page</h2>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", opacity: 0.5 }}>Ajoutez des sections prédéfinies à votre page courante</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.5 }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", padding: "1.25rem 1.5rem" }}>
              {PAGE_TEMPLATES.map(tpl => (
                <div key={tpl.id} onClick={() => applyTemplate(tpl)}
                  style={{ border: `1px solid ${t.border}`, borderRadius: "0.75rem", padding: "1.25rem", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${tpl.color}`; (e.currentTarget as HTMLElement).style.background = isDark ? "#ffffff06" : "#f8faff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${t.border}`; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <div style={{ width: 40, height: 40, borderRadius: "0.5rem", background: tpl.color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>
                      {tpl.icon === "Zap" ? "⚡" : tpl.icon === "Briefcase" ? "💼" : tpl.icon === "UtensilsCrossed" ? "🍽️" : tpl.icon === "Building2" ? "🏢" : tpl.icon === "Hammer" ? "🔨" : "📅"}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 0.3rem", fontWeight: 700, fontSize: "0.9rem" }}>{tpl.label}</p>
                  <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", opacity: 0.55, lineHeight: 1.4 }}>{tpl.desc}</p>
                  <p style={{ margin: 0, fontSize: "0.7rem", opacity: 0.4 }}>{tpl.sections.length} sections</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Éditeur de props ───────────────────────────────────────────────────────────

const IS_IMAGE_KEY = (k: string) => /url|image|img|photo|avatar|logo|thumbnail|banner|background/i.test(k);
const IS_LONG_TEXT = (k: string) => /content|text|body|description|extrait|message|bio|about/i.test(k);
const IS_URL_FIELD = (k: string) => /href|link|url/i.test(k) && !/image|img|photo|avatar|thumbnail/i.test(k);

function PropsEditor({ section, isDark, t, siteId, onUpdate }: {
  section: WebsiteSection;
  isDark: boolean;
  t: ReturnType<typeof tok>;
  siteId: string;
  onUpdate: (s: WebsiteSection) => void;
}) {
  const [props, setProps]         = useState(section.props);
  const [mediaPicker, setMediaPicker] = useState<string | null>(null); // key en cours de sélection
  const [mediaItems,  setMediaItems]  = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading,   setUploading]   = useState(false);

  useEffect(() => setProps(section.props), [section.id, section.props]);

  async function save(newProps: Record<string, unknown>) {
    await fetch(`/api/websites/${siteId}/sections`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id: section.id, props: newProps }),
    });
    onUpdate({ ...section, props: newProps });
  }

  function update(key: string, value: unknown) {
    const u = { ...props, [key]: value };
    setProps(u); save(u);
  }

  async function openMediaPicker(key: string) {
    setMediaPicker(key);
    if (mediaItems.length === 0) {
      setMediaLoading(true);
      const res = await fetch(`/api/websites/${siteId}/media`);
      const d = await res.json() as { media?: MediaItem[] };
      setMediaItems(d.media ?? []);
      setMediaLoading(false);
    }
  }

  async function uploadMedia(key: string, file: File) {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch(`/api/websites/${siteId}/media`, { method: "POST", body: fd });
    const d = await res.json() as { media?: MediaItem };
    if (d.media) {
      setMediaItems(prev => [d.media!, ...prev]);
      update(key, d.media.public_url);
      setMediaPicker(null);
    }
    setUploading(false);
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.4rem 0.55rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.78rem" };

  const entries = Object.entries(props).filter(([, v]) => typeof v !== "object" || v === null);
  const meta = SECTIONS_LIBRARY.find(s => s.type === section.type);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", position: "relative" }}>
      <p style={{ margin: "0 0 0.35rem", fontSize: "0.7rem", fontWeight: 700, opacity: 0.45, textTransform: "uppercase" }}>
        {meta?.label ?? section.type}
      </p>
      {entries.length === 0 && <p style={{ opacity: 0.35, fontSize: "0.78rem", textAlign: "center", padding: "2rem 0" }}>Pas de propriétés simples.</p>}
      {entries.map(([key, value]) => (
        <div key={key}>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.25rem", opacity: 0.6 }}>{key}</label>

          {typeof value === "boolean" ? (
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input type="checkbox" checked={value} onChange={e => update(key, e.target.checked)} />
              <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{value ? "Activé" : "Désactivé"}</span>
            </label>
          ) : typeof value === "number" ? (
            <input type="number" value={value} onChange={e => update(key, Number(e.target.value))} style={inputStyle} />
          ) : IS_IMAGE_KEY(key) ? (
            <div>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <input type="text" value={String(value ?? "")} onChange={e => update(key, e.target.value)} placeholder="https://..." style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => openMediaPicker(key)} title="Médiathèque"
                  style={{ background: "#2563EB20", border: "none", borderRadius: "0.45rem", padding: "0 0.5rem", cursor: "pointer", color: "#2563EB" }}>
                  <ImageIcon size={13} />
                </button>
              </div>
              {typeof value === "string" && value.startsWith("http") && (
                <img src={value} alt="" style={{ width: "100%", marginTop: "0.4rem", borderRadius: "0.35rem", border: `1px solid ${t.border}`, maxHeight: 80, objectFit: "cover" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>
          ) : IS_LONG_TEXT(key) ? (
            <textarea value={String(value ?? "")} onChange={e => update(key, e.target.value)} rows={3}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          ) : IS_URL_FIELD(key) ? (
            <input type="url" value={String(value ?? "")} onChange={e => update(key, e.target.value)} placeholder="https://..." style={inputStyle} />
          ) : (
            <input type="text" value={String(value ?? "")} onChange={e => update(key, e.target.value)} style={inputStyle} />
          )}
        </div>
      ))}

      {/* Modal médiathèque */}
      {mediaPicker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setMediaPicker(null); }}>
          <div style={{ background: isDark ? "#1a1f2e" : "#fff", borderRadius: "1rem", padding: "1.25rem", width: 480, maxWidth: "90vw", maxHeight: "70vh", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700 }}>Médiathèque</span>
              <button onClick={() => setMediaPicker(null)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5 }}>✕</button>
            </div>

            {/* Upload zone */}
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", border: `2px dashed ${t.border}`, borderRadius: "0.65rem", padding: "1rem", cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.6 : 1 }}>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(mediaPicker, f); }} disabled={uploading} />
              {uploading ? <Loader2 size={16} /> : <Upload size={16} />}
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{uploading ? "Upload en cours…" : "Uploader une image"}</span>
            </label>

            {/* Grille médias */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {mediaLoading ? (
                <div style={{ textAlign: "center", padding: "2rem", opacity: 0.4 }}><Loader2 size={24} /></div>
              ) : mediaItems.length === 0 ? (
                <p style={{ textAlign: "center", opacity: 0.4, fontSize: "0.82rem", padding: "2rem 0" }}>Aucune image uploadée</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {mediaItems.map(m => (
                    <div key={m.id} onClick={() => { update(mediaPicker, m.public_url); setMediaPicker(null); }}
                      style={{ cursor: "pointer", borderRadius: "0.45rem", overflow: "hidden", aspectRatio: "1", border: `2px solid transparent`, transition: "border-color 0.15s" }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = "#2563EB")}
                      onMouseOut={e => (e.currentTarget.style.borderColor = "transparent")}>
                      <img src={m.public_url} alt={m.alt ?? m.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
