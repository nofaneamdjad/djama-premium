"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Save, Eye, ArrowLeft, Plus, Trash2, ChevronUp,
  ChevronDown, EyeOff, Settings, Layers, Monitor, Tablet,
  Smartphone, CheckCircle, Loader2, GripVertical, X, PanelLeft
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";
import { SECTIONS_LIBRARY, SECTION_CATEGORIES } from "@/lib/website-builder/sections-meta";
import type { Website, WebsitePage, WebsiteSection, SectionType, WebsiteTheme } from "@/lib/website-builder/types";
import { DEFAULT_THEME } from "@/lib/website-builder/types";

type PreviewWidth = "desktop" | "tablet" | "mobile";
const PREVIEW_WIDTHS: Record<PreviewWidth, number> = { desktop: 1200, tablet: 768, mobile: 375 };
const PREVIEW_ICONS: Record<PreviewWidth, React.ReactNode> = {
  desktop: <Monitor size={14} />,
  tablet: <Tablet size={14} />,
  mobile: <Smartphone size={14} />,
};

export default function EditSitePage() {
  const { isDark } = useTheme();
  const t = tok(isDark);
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [site, setSite] = useState<Website | null>(null);
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>("desktop");
  const [leftPanel, setLeftPanel] = useState<"pages" | "library">("pages");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propsPanelOpen, setPropsPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [libCategory, setLibCategory] = useState("contenu");
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  // Charger le site + pages
  useEffect(() => {
    fetch(`/api/websites/${siteId}`)
      .then(r => r.json())
      .then(d => {
        if (d.website) {
          setSite(d.website as Website);
          const pg = (d.pages ?? []) as WebsitePage[];
          setPages(pg);
          const home = pg.find(p => p.is_homepage) ?? pg[0];
          if (home) setCurrentPageId(home.id);
        }
      })
      .finally(() => setLoading(false));
  }, [siteId]);

  // Charger sections de la page courante
  useEffect(() => {
    if (!currentPageId) return;
    fetch(`/api/websites/${siteId}/pages/${currentPageId}`)
      .then(r => r.json())
      .then(d => {
        const secs = ((d.page?.sections ?? []) as WebsiteSection[])
          .sort((a, b) => a.position - b.position);
        setSections(secs);
        setPreviewKey(k => k + 1);
      });
  }, [currentPageId, siteId]);

  const refreshPreview = useCallback(() => setPreviewKey(k => k + 1), []);

  // Sauvegarder l'ordre des sections
  async function saveOrder(newSections: WebsiteSection[]) {
    for (const [i, sec] of newSections.entries()) {
      if (sec.position !== i) {
        await fetch(`/api/websites/${siteId}/sections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section_id: sec.id, position: i }),
        });
      }
    }
  }

  // Ajouter une section
  async function addSection(type: SectionType) {
    if (!currentPageId) return;
    const res = await fetch(`/api/websites/${siteId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: currentPageId, type }),
    });
    const data = await res.json() as { section?: WebsiteSection };
    if (data.section) {
      setSections(prev => [...prev, data.section!]);
      refreshPreview();
    }
  }

  // Supprimer une section
  async function deleteSection(id: string) {
    await fetch(`/api/websites/${siteId}/sections?section_id=${id}`, { method: "DELETE" });
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
    refreshPreview();
  }

  // Toggler visibilité
  async function toggleVisibility(sec: WebsiteSection) {
    await fetch(`/api/websites/${siteId}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id: sec.id, visible: !sec.visible }),
    });
    setSections(prev => prev.map(s => s.id === sec.id ? { ...s, visible: !s.visible } : s));
    refreshPreview();
  }

  // Déplacer une section
  async function moveSection(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const updated = [...sections];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    const reindexed = updated.map((s, i) => ({ ...s, position: i }));
    setSections(reindexed);
    refreshPreview();
    await saveOrder(reindexed);
  }

  // Sauvegarder le site (nom, thème)
  async function handleSave() {
    if (!site) return;
    setSaving(true);
    await fetch(`/api/websites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: site.name, theme: site.theme }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Publier
  async function handlePublish() {
    setPublishing(true);
    const res = await fetch(`/api/websites/${siteId}/publish`, { method: "POST" });
    const data = await res.json() as { website?: Website };
    if (data.website) setSite(data.website);
    setPublishing(false);
  }

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const theme: WebsiteTheme = { ...DEFAULT_THEME, ...(site?.theme as Partial<WebsiteTheme>) };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="#2563EB" />
      </div>
    );
  }

  if (!site) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", color: t.text }}>
        Site introuvable.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: t.bg, color: t.text, overflow: "hidden" }}>

      {/* ── Barre supérieure ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1rem", height: 52, borderBottom: `1px solid ${t.border}`, flexShrink: 0, gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => router.push("/client/site-web")} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.6, padding: "0.25rem" }}>
            <ArrowLeft size={18} />
          </button>
          <Globe size={16} color="#2563EB" />
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{site.name}</span>
          {site.status === "published" && (
            <span style={{ fontSize: "0.7rem", fontWeight: 600, background: "#10B98120", color: "#10B981", padding: "0.2rem 0.6rem", borderRadius: 9999 }}>Publié</span>
          )}
        </div>

        {/* Preview widths */}
        <div style={{ display: "flex", gap: "0.25rem", background: isDark ? "#ffffff12" : "#f3f4f6", borderRadius: "0.5rem", padding: "0.2rem" }}>
          {(["desktop", "tablet", "mobile"] as PreviewWidth[]).map(w => (
            <button
              key={w}
              onClick={() => setPreviewWidth(w)}
              style={{
                background: previewWidth === w ? "#2563EB" : "transparent",
                color: previewWidth === w ? "#fff" : t.text,
                border: "none", borderRadius: "0.35rem",
                padding: "0.35rem 0.6rem", cursor: "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              {PREVIEW_ICONS[w]}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => window.open(`/api/websites/${siteId}/preview`, "_blank")}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.6rem", padding: "0.45rem 0.85rem", cursor: "pointer", color: t.text, fontSize: "0.82rem", fontWeight: 600 }}
          >
            <Eye size={14} /> Aperçu
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: saved ? "#10B981" : "#2563EB", color: "#fff", border: "none", borderRadius: "0.6rem", padding: "0.45rem 0.85rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
          >
            {saved ? <CheckCircle size={14} /> : saving ? <Loader2 size={14} /> : <Save size={14} />}
            {saved ? "Sauvegardé" : saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#7C3AED", color: "#fff", border: "none", borderRadius: "0.6rem", padding: "0.45rem 0.85rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
          >
            {publishing ? <Loader2 size={14} /> : <Globe size={14} />}
            {publishing ? "Publication…" : "Publier"}
          </button>
        </div>
      </div>

      {/* ── Corps principal ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Panneau gauche : Pages + Bibliothèque ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              style={{ borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}
            >
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: `1px solid ${t.border}` }}>
                {(["pages", "library"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setLeftPanel(p)}
                    style={{
                      flex: 1, padding: "0.6rem 0.5rem", border: "none", cursor: "pointer",
                      background: leftPanel === p ? (isDark ? "#ffffff10" : "#f0f4ff") : "transparent",
                      color: leftPanel === p ? "#2563EB" : t.text, fontWeight: 600, fontSize: "0.78rem",
                      borderBottom: leftPanel === p ? "2px solid #2563EB" : "2px solid transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                    }}
                  >
                    {p === "pages" ? <><Layers size={12} /> Pages</> : <><Plus size={12} /> Blocs</>}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>

                {/* ── Pages ── */}
                {leftPanel === "pages" && (
                  <>
                    {pages.map(page => (
                      <div
                        key={page.id}
                        onClick={() => setCurrentPageId(page.id)}
                        style={{
                          padding: "0.6rem 0.75rem", borderRadius: "0.6rem", cursor: "pointer", marginBottom: "0.25rem",
                          background: currentPageId === page.id ? "#2563EB20" : "transparent",
                          border: currentPageId === page.id ? "1px solid #2563EB40" : "1px solid transparent",
                          fontSize: "0.85rem", fontWeight: currentPageId === page.id ? 600 : 400,
                        }}
                      >
                        {page.is_homepage ? "🏠 " : "📄 "}{page.title}
                      </div>
                    ))}
                    <button
                      onClick={async () => {
                        const title = prompt("Titre de la nouvelle page :");
                        if (!title) return;
                        const res = await fetch(`/api/websites/${siteId}/pages`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ title }),
                        });
                        const d = await res.json() as { page?: WebsitePage };
                        if (d.page) setPages(prev => [...prev, d.page!]);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: "0.4rem", width: "100%", background: "none", border: `1px dashed ${t.border}`, borderRadius: "0.6rem", padding: "0.5rem 0.75rem", cursor: "pointer", color: t.text, opacity: 0.6, fontSize: "0.82rem", marginTop: "0.5rem" }}
                    >
                      <Plus size={12} /> Nouvelle page
                    </button>
                  </>
                )}

                {/* ── Bibliothèque blocs ── */}
                {leftPanel === "library" && (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.75rem" }}>
                      {SECTION_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setLibCategory(cat.id)}
                          style={{
                            background: libCategory === cat.id ? "#2563EB" : (isDark ? "#ffffff12" : "#f3f4f6"),
                            color: libCategory === cat.id ? "#fff" : t.text,
                            border: "none", borderRadius: 9999, padding: "0.25rem 0.65rem",
                            fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    {SECTIONS_LIBRARY.filter(s => s.category === libCategory).map(sec => (
                      <div
                        key={sec.type}
                        onClick={() => addSection(sec.type)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: "0.6rem",
                          padding: "0.65rem 0.75rem", borderRadius: "0.6rem", cursor: "pointer",
                          border: `1px solid ${t.border}`, marginBottom: "0.4rem",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = isDark ? "#ffffff08" : "#f0f4ff")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem" }}>{sec.label}</p>
                          <p style={{ margin: 0, opacity: 0.5, fontSize: "0.72rem", lineHeight: 1.4 }}>{sec.description}</p>
                        </div>
                        <Plus size={13} style={{ flexShrink: 0, marginTop: "0.1rem", opacity: 0.5 }} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Centre : Prévisualisation + sections ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{ position: "absolute", top: "0.75rem", left: "0.75rem", zIndex: 5, background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.5rem", padding: "0.35rem", cursor: "pointer", color: t.text }}
          >
            <PanelLeft size={14} />
          </button>

          {/* Preview iframe */}
          <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", padding: "1.5rem", background: isDark ? "#0d1117" : "#f1f5f9" }}>
            <div style={{ width: PREVIEW_WIDTHS[previewWidth], maxWidth: "100%", transition: "width 0.3s" }}>
              <iframe
                ref={iframeRef}
                key={previewKey}
                src={`/api/websites/${siteId}/preview?page_id=${currentPageId}`}
                style={{ width: "100%", height: 600, border: "none", borderRadius: "0.75rem", boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}
                title="Aperçu"
              />
            </div>
          </div>

          {/* Section list */}
          <div style={{ borderTop: `1px solid ${t.border}`, maxHeight: 220, overflowY: "auto", padding: "0.75rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 700, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Sections — {sections.length}
            </p>
            {sections.length === 0 ? (
              <p style={{ opacity: 0.4, fontSize: "0.82rem", textAlign: "center", padding: "1rem" }}>Cliquez sur un bloc dans la bibliothèque pour l'ajouter.</p>
            ) : (
              sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  onClick={() => { setSelectedSectionId(sec.id === selectedSectionId ? null : sec.id); setPropsPanelOpen(true); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.45rem 0.6rem", borderRadius: "0.5rem", cursor: "pointer",
                    background: selectedSectionId === sec.id ? "#2563EB20" : "transparent",
                    border: selectedSectionId === sec.id ? "1px solid #2563EB40" : "1px solid transparent",
                    marginBottom: "0.2rem", opacity: sec.visible ? 1 : 0.4,
                  }}
                >
                  <GripVertical size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: 500 }}>{SECTIONS_LIBRARY.find(s => s.type === sec.type)?.label ?? sec.type}</span>
                  <button onClick={e => { e.stopPropagation(); moveSection(idx, -1); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.15rem", opacity: 0.5, color: t.text }}><ChevronUp size={12} /></button>
                  <button onClick={e => { e.stopPropagation(); moveSection(idx, 1); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.15rem", opacity: 0.5, color: t.text }}><ChevronDown size={12} /></button>
                  <button onClick={e => { e.stopPropagation(); toggleVisibility(sec); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.15rem", opacity: 0.5, color: t.text }}>{sec.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                  <button onClick={e => { e.stopPropagation(); deleteSection(sec.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.15rem", color: "#EF4444", opacity: 0.7 }}><Trash2 size={12} /></button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Panneau droit : Propriétés ── */}
        <AnimatePresence>
          {propsPanelOpen && selectedSection && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              style={{ borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Settings size={14} color="#2563EB" />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Propriétés</span>
                </div>
                <button onClick={() => setPropsPanelOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.5 }}><X size={14} /></button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
                <PropsEditor
                  section={selectedSection}
                  isDark={isDark}
                  t={t}
                  siteId={siteId}
                  onUpdate={(updated) => {
                    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
                    refreshPreview();
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Éditeur de props basique ───────────────────────────────────────────────────

function PropsEditor({
  section, isDark, t, siteId, onUpdate
}: {
  section: WebsiteSection;
  isDark: boolean;
  t: ReturnType<typeof tok>;
  siteId: string;
  onUpdate: (sec: WebsiteSection) => void;
}) {
  const [props, setProps] = useState<Record<string, unknown>>(section.props);

  useEffect(() => setProps(section.props), [section.id, section.props]);

  async function save(newProps: Record<string, unknown>) {
    await fetch(`/api/websites/${siteId}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id: section.id, props: newProps }),
    });
    onUpdate({ ...section, props: newProps });
  }

  function updateProp(key: string, value: unknown) {
    const updated = { ...props, [key]: value };
    setProps(updated);
    save(updated);
  }

  // Rendu de chaque prop selon son type
  const entries = Object.entries(props).filter(([k]) => typeof props[k] !== "object" || props[k] === null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: 700, opacity: 0.5, textTransform: "uppercase" }}>
        {SECTIONS_LIBRARY.find(s => s.type === section.type)?.label ?? section.type}
      </p>
      {entries.map(([key, value]) => (
        <div key={key}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.3rem", opacity: 0.7 }}>
            {key}
          </label>
          {typeof value === "boolean" ? (
            <input type="checkbox" checked={value} onChange={e => updateProp(key, e.target.checked)} />
          ) : typeof value === "number" ? (
            <input
              type="number"
              value={value}
              onChange={e => updateProp(key, Number(e.target.value))}
              style={{ width: "100%", padding: "0.4rem 0.6rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.5rem", color: t.text, fontSize: "0.82rem" }}
            />
          ) : (
            <input
              type="text"
              value={String(value ?? "")}
              onChange={e => updateProp(key, e.target.value)}
              style={{ width: "100%", padding: "0.4rem 0.6rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.5rem", color: t.text, fontSize: "0.82rem" }}
            />
          )}
        </div>
      ))}
      {entries.length === 0 && (
        <p style={{ opacity: 0.4, fontSize: "0.8rem", textAlign: "center", padding: "2rem 0" }}>
          Ce bloc n'a pas de propriétés simples à éditer.
        </p>
      )}
    </div>
  );
}
