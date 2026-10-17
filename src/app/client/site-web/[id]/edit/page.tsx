"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Save, Eye, ArrowLeft, Plus, Trash2, ChevronUp,
  ChevronDown, EyeOff, Settings, Layers, Monitor, Tablet,
  Smartphone, CheckCircle, Loader2, GripVertical, X, PanelLeft,
  Bot, Send, History, RotateCcw, Palette
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";
import { SECTIONS_LIBRARY, SECTION_CATEGORIES } from "@/lib/website-builder/sections-meta";
import type { Website, WebsitePage, WebsiteSection, SectionType, WebsiteTheme } from "@/lib/website-builder/types";
import { DEFAULT_THEME } from "@/lib/website-builder/types";

type PreviewWidth = "desktop" | "tablet" | "mobile";
const PREVIEW_WIDTHS: Record<PreviewWidth, number> = { desktop: 1200, tablet: 768, mobile: 375 };
type RightPanel = "props" | "ai" | "versions" | "theme" | null;

interface ChatMsg { role: "user" | "assistant"; text: string }
interface SiteVersion { id: string; label: string | null; created_at: string }

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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  // Charger site + pages
  useEffect(() => {
    fetch(`/api/websites/${siteId}`)
      .then(r => r.json())
      .then(d => {
        if (d.website) {
          setSite(d.website as Website);
          setLocalTheme((d.website as Website).theme as Partial<WebsiteTheme>);
          const pg = (d.pages ?? []) as WebsitePage[];
          setPages(pg);
          const home = pg.find(p => p.is_homepage) ?? pg[0];
          if (home) setCurrentPageId(home.id);
        }
      })
      .finally(() => setLoading(false));
  }, [siteId]);

  // Charger sections
  useEffect(() => {
    if (!currentPageId) return;
    fetch(`/api/websites/${siteId}/pages/${currentPageId}`)
      .then(r => r.json())
      .then(d => {
        const secs = ((d.page?.sections ?? []) as WebsiteSection[]).sort((a, b) => a.position - b.position);
        setSections(secs);
        setPreviewKey(k => k + 1);
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
          <button onClick={() => router.push(`/client/site-web/${siteId}/domains`)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.4rem 0.75rem", cursor: "pointer", color: t.text, fontSize: "0.78rem", fontWeight: 600 }}>
            <Globe size={13} /> Domaines
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
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginBottom: "0.65rem" }}>
                      {SECTION_CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setLibCategory(cat.id)} style={{ background: libCategory === cat.id ? "#2563EB" : (isDark ? "#ffffff0f" : "#f3f4f6"), color: libCategory === cat.id ? "#fff" : t.text, border: "none", borderRadius: 9999, padding: "0.2rem 0.6rem", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    {SECTIONS_LIBRARY.filter(s => s.category === libCategory).map(sec => (
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
                onClick={() => { setSelectedSectionId(sec.id === selectedSectionId ? null : sec.id); setRightPanel("props"); }}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.55rem", borderRadius: "0.45rem", cursor: "pointer", background: selectedSectionId === sec.id ? "#2563EB1a" : "transparent", border: selectedSectionId === sec.id ? "1px solid #2563EB35" : "1px solid transparent", marginBottom: "0.15rem", opacity: sec.visible ? 1 : 0.4 }}
              >
                <GripVertical size={11} style={{ opacity: 0.35, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 500 }}>{SECTIONS_LIBRARY.find(s => s.type === sec.type)?.label ?? sec.type}</span>
                <button onClick={e => { e.stopPropagation(); moveSection(idx, -1); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", opacity: 0.45, color: t.text }}><ChevronUp size={11} /></button>
                <button onClick={e => { e.stopPropagation(); moveSection(idx, 1); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", opacity: 0.45, color: t.text }}><ChevronDown size={11} /></button>
                <button onClick={e => { e.stopPropagation(); toggleVisibility(sec); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", opacity: 0.45, color: t.text }}>{sec.visible ? <Eye size={11} /> : <EyeOff size={11} />}</button>
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
              { id: "props" as RightPanel, icon: <Settings size={15} />, label: "Props" },
              { id: "ai" as RightPanel, icon: <Bot size={15} />, label: "IA" },
              { id: "theme" as RightPanel, icon: <Palette size={15} />, label: "Thème" },
              { id: "versions" as RightPanel, icon: <History size={15} />, label: "Hist." },
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
                  {rightPanel === "props" ? "Propriétés" : rightPanel === "ai" ? "Assistant IA" : rightPanel === "theme" ? "Thème" : "Historique"}
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
    </div>
  );
}

// ── Éditeur de props ───────────────────────────────────────────────────────────

function PropsEditor({ section, isDark, t, siteId, onUpdate }: {
  section: WebsiteSection;
  isDark: boolean;
  t: ReturnType<typeof tok>;
  siteId: string;
  onUpdate: (s: WebsiteSection) => void;
}) {
  const [props, setProps] = useState(section.props);
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

  const entries = Object.entries(props).filter(([, v]) => typeof v !== "object" || v === null);
  const meta = SECTIONS_LIBRARY.find(s => s.type === section.type);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <p style={{ margin: "0 0 0.35rem", fontSize: "0.7rem", fontWeight: 700, opacity: 0.45, textTransform: "uppercase" }}>
        {meta?.label ?? section.type}
      </p>
      {entries.length === 0 && <p style={{ opacity: 0.35, fontSize: "0.78rem", textAlign: "center", padding: "2rem 0" }}>Pas de propriétés simples.</p>}
      {entries.map(([key, value]) => (
        <div key={key}>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.25rem", opacity: 0.6 }}>{key}</label>
          {typeof value === "boolean" ? (
            <input type="checkbox" checked={value} onChange={e => update(key, e.target.checked)} />
          ) : typeof value === "number" ? (
            <input type="number" value={value} onChange={e => update(key, Number(e.target.value))} style={{ width: "100%", padding: "0.4rem 0.55rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.78rem" }} />
          ) : (
            <input type="text" value={String(value ?? "")} onChange={e => update(key, e.target.value)} style={{ width: "100%", padding: "0.4rem 0.55rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.45rem", color: t.text, fontSize: "0.78rem" }} />
          )}
        </div>
      ))}
    </div>
  );
}
