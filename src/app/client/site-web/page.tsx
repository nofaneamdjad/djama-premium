"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Globe, Plus, Pencil, Trash2, ExternalLink, Eye,
  Clock, CheckCircle, Archive, MoreVertical, Layers, BarChart2, Link2,
  ClipboardList, Download, CornerUpRight, Copy, Search,
  Power, PowerOff, RotateCcw, Check, X,
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";
import type { Website } from "@/lib/website-builder/types";

const STATUS_LABEL: Record<string, string> = {
  draft:     "Brouillon",
  published: "Publié",
  archived:  "Archivé",
};
const STATUS_COLOR: Record<string, string> = {
  draft:     "#6B7280",
  published: "#10B981",
  archived:  "#F59E0B",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  draft:     <Clock size={12} />,
  published: <CheckCircle size={12} />,
  archived:  <Archive size={12} />,
};

type FilterTab = "all" | "published" | "draft" | "archived";
type SortKey   = "updated" | "name" | "status";

export default function SiteWebPage() {
  const { isDark } = useTheme();
  const t = tok(isDark);
  const router = useRouter();

  const [sites,         setSites]         = useState<Website[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState<FilterTab>("all");
  const [search,        setSearch]        = useState("");
  const [sort,          setSort]          = useState<SortKey>("updated");
  const [menuOpen,      setMenuOpen]      = useState<string | null>(null);
  const [renamingId,    setRenamingId]    = useState<string | null>(null);
  const [renameVal,     setRenameVal]     = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/websites")
      .then(r => r.json())
      .then(d => setSites(d.websites ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      setMenuOpen(null);
      e.stopPropagation();
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  useEffect(() => {
    if (renamingId) renameRef.current?.focus();
  }, [renamingId]);

  const counts = {
    all:       sites.length,
    published: sites.filter(s => s.status === "published").length,
    draft:     sites.filter(s => s.status === "draft").length,
    archived:  sites.filter(s => s.status === "archived").length,
  };

  const filtered = sites
    .filter(s => {
      if (filter !== "all" && s.status !== filter) return false;
      if (search.trim() && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "name")   return a.name.localeCompare(b.name, "fr");
      if (sort === "status") return a.status.localeCompare(b.status);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function patchSite(id: string, body: Record<string, unknown>) {
    setActionLoading(id);
    const res  = await fetch(`/api/websites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) setSites(prev => prev.map(s => s.id === id ? { ...s, ...data.website } : s));
    setActionLoading(null);
    return res.ok;
  }

  async function publishSite(id: string, publish: boolean) {
    setActionLoading(id);
    const res = await fetch(`/api/websites/${id}/publish`, {
      method: publish ? "POST" : "DELETE",
    });
    if (res.ok) {
      setSites(prev => prev.map(s =>
        s.id === id ? { ...s, status: publish ? "published" : "draft" } : s));
    }
    setActionLoading(null);
  }

  async function duplicateSite(id: string) {
    setActionLoading(id);
    const res  = await fetch(`/api/websites/${id}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.website) setSites(prev => [data.website, ...prev]);
    setActionLoading(null);
  }

  async function deleteSite(id: string, name: string) {
    if (!window.confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    setActionLoading(id);
    await fetch(`/api/websites/${id}`, { method: "DELETE" });
    setSites(prev => prev.filter(s => s.id !== id));
    setActionLoading(null);
  }

  async function submitRename(id: string) {
    if (renameVal.trim() && renameVal.trim() !== sites.find(s => s.id === id)?.name) {
      await patchSite(id, { name: renameVal.trim() });
    }
    setRenamingId(null);
  }

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all",       label: `Tous (${counts.all})` },
    { key: "published", label: `Publiés (${counts.published})` },
    { key: "draft",     label: `Brouillons (${counts.draft})` },
    { key: "archived",  label: `Archivés (${counts.archived})` },
  ];

  // ── Styles utilitaires ────────────────────────────────────────────────────────

  const btn = (color = "#2563EB"): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
    background: color, color: "#fff", border: "none", borderRadius: "0.6rem",
    padding: "0.48rem 0.85rem", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
  });

  const ghostBtn: React.CSSProperties = {
    ...btn(),
    background: isDark ? "#ffffff12" : "#f3f4f6",
    color: t.text,
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "#2563EB", borderRadius: "0.75rem", padding: "0.6rem", display: "flex" }}>
              <Globe size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Mes sites</h1>
              <p style={{ margin: 0, opacity: 0.5, fontSize: "0.82rem" }}>
                {loading ? "Chargement…" : `${counts.all} site${counts.all !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/client/site-web/create")}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "#2563EB", color: "#fff",
              border: "none", borderRadius: "0.75rem",
              padding: "0.65rem 1.25rem", fontWeight: 600,
              fontSize: "0.875rem", cursor: "pointer",
            }}
          >
            <Plus size={16} /> Créer un site
          </motion.button>
        </div>

        {/* Search + Sort */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={14} style={{
              position: "absolute", left: "0.8rem", top: "50%",
              transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none",
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un site…"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "0.6rem 0.75rem 0.6rem 2.25rem",
                background: isDark ? "#ffffff08" : "#f9fafb",
                border: `1px solid ${t.border}`,
                borderRadius: "0.65rem", color: t.text,
                fontSize: "0.875rem", outline: "none",
              }}
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            style={{
              padding: "0.6rem 0.9rem",
              background: isDark ? "#ffffff08" : "#f9fafb",
              border: `1px solid ${t.border}`,
              borderRadius: "0.65rem", color: t.text,
              fontSize: "0.875rem", cursor: "pointer",
            }}
          >
            <option value="updated">Tri : plus récents</option>
            <option value="name">Tri : nom A→Z</option>
            <option value="status">Tri : statut</option>
          </select>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "0", marginBottom: "1.75rem",
          borderBottom: `1px solid ${t.border}`,
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "0.55rem 1rem",
                background: "none", border: "none",
                borderBottom: filter === tab.key ? "2px solid #2563EB" : "2px solid transparent",
                color: filter === tab.key ? "#2563EB" : t.text,
                fontWeight: filter === tab.key ? 600 : 400,
                fontSize: "0.84rem", cursor: "pointer",
                opacity: filter === tab.key ? 1 : 0.5,
                marginBottom: -1,
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", opacity: 0.4 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          sites.length === 0
            ? <EmptyState onNew={() => router.push("/client/site-web/create")} isDark={isDark} t={t} />
            : <div style={{ textAlign: "center", padding: "3rem", opacity: 0.45, fontSize: "0.9rem" }}>
                Aucun site ne correspond à votre recherche.
              </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {filtered.map(site => (
              <SiteCard
                key={site.id}
                site={site}
                isDark={isDark}
                t={t}
                isLoading={actionLoading === site.id}
                menuOpen={menuOpen === site.id}
                isRenaming={renamingId === site.id}
                renameVal={renameVal}
                renameRef={renameRef}
                onMenuToggle={e => { e.stopPropagation(); setMenuOpen(menuOpen === site.id ? null : site.id); }}
                onEdit={() => router.push(`/client/site-web/${site.id}/edit`)}
                onPreview={() => window.open(`/api/websites/${site.id}/preview`, "_blank")}
                onStats={() => router.push(`/client/site-web/${site.id}/stats`)}
                onDomains={() => router.push(`/client/site-web/${site.id}/domains`)}
                onSubmissions={() => router.push(`/client/site-web/${site.id}/submissions`)}
                onRedirections={() => router.push(`/client/site-web/${site.id}/redirections`)}
                onExport={() => window.open(`/api/websites/${site.id}/export`, "_blank")}
                onDuplicate={() => { setMenuOpen(null); duplicateSite(site.id); }}
                onRename={() => { setMenuOpen(null); setRenamingId(site.id); setRenameVal(site.name); }}
                onRenameChange={v => setRenameVal(v)}
                onRenameSubmit={() => submitRename(site.id)}
                onRenameCancel={() => setRenamingId(null)}
                onPublish={() => { setMenuOpen(null); publishSite(site.id, true); }}
                onDepublish={() => { setMenuOpen(null); publishSite(site.id, false); }}
                onArchive={() => { setMenuOpen(null); patchSite(site.id, { status: "archived" }); }}
                onRestore={() => { setMenuOpen(null); patchSite(site.id, { status: "draft" }); }}
                onDelete={() => { setMenuOpen(null); deleteSite(site.id, site.name); }}
                ghostBtn={ghostBtn}
                btn={btn}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Carte site ─────────────────────────────────────────────────────────────────

function SiteCard({
  site, isDark, t, isLoading, menuOpen, isRenaming, renameVal, renameRef,
  onMenuToggle, onEdit, onPreview, onStats, onDomains, onSubmissions,
  onRedirections, onExport, onDuplicate, onRename, onRenameChange,
  onRenameSubmit, onRenameCancel, onPublish, onDepublish, onArchive,
  onRestore, onDelete, ghostBtn, btn,
}: {
  site: Website;
  isDark: boolean;
  t: ReturnType<typeof tok>;
  isLoading: boolean;
  menuOpen: boolean;
  isRenaming: boolean;
  renameVal: string;
  renameRef: React.RefObject<HTMLInputElement | null>;
  onMenuToggle: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onPreview: () => void;
  onStats: () => void;
  onDomains: () => void;
  onSubmissions: () => void;
  onRedirections: () => void;
  onExport: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onPublish: () => void;
  onDepublish: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  ghostBtn: React.CSSProperties;
  btn: (color?: string) => React.CSSProperties;
}) {
  const theme = site.theme as { primaryColor?: string };
  const primary = theme?.primaryColor ?? "#2563EB";
  const statusColor = STATUS_COLOR[site.status] ?? "#6B7280";
  const domain = site.subdomain ? `${site.subdomain}.djama.site` : site.custom_domain ?? null;

  const menuItems = [
    { icon: <Pencil size={14} />,       label: "Modifier",        action: onEdit },
    { icon: <Eye size={14} />,           label: "Aperçu",          action: onPreview },
    { icon: <Copy size={14} />,          label: "Dupliquer",       action: onDuplicate },
    { icon: <Pencil size={14} />,       label: "Renommer",        action: onRename },
    ...(site.status === "published"
      ? [{ icon: <PowerOff size={14} />, label: "Dépublier",   action: onDepublish }]
      : site.status === "draft"
        ? [{ icon: <Power size={14} />,  label: "Publier",     action: onPublish },
           { icon: <Archive size={14} />, label: "Archiver",   action: onArchive }]
        : [{ icon: <RotateCcw size={14} />, label: "Restaurer", action: onRestore }]),
    { icon: <BarChart2 size={14} />,    label: "Statistiques",    action: onStats },
    { icon: <Link2 size={14} />,        label: "Domaines",        action: onDomains },
    { icon: <ClipboardList size={14} />, label: "Soumissions",   action: onSubmissions },
    { icon: <CornerUpRight size={14} />, label: "Redirections",  action: onRedirections },
    { icon: <Download size={14} />,     label: "Exporter HTML",   action: onExport },
    { icon: <Trash2 size={14} />,       label: "Supprimer",       action: onDelete, danger: true },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isLoading ? 0.5 : 1, y: 0 }}
      style={{
        background: t.glass,
        border: `1px solid ${t.border}`,
        borderRadius: "1rem",
        overflow: "visible",
        position: "relative",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Miniature */}
      <div style={{
        height: 130,
        background: `linear-gradient(135deg, ${primary}22, ${primary}55)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "1rem 1rem 0 0", overflow: "hidden",
      }}>
        {site.thumbnail_url ? (
          <img src={site.thumbnail_url} alt={site.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Globe size={38} color={primary} opacity={0.5} />
        )}
      </div>

      {/* Corps */}
      <div style={{ padding: "1rem 1.1rem 1.1rem" }}>

        {/* Titre + menu */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isRenaming ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <input
                  ref={renameRef}
                  value={renameVal}
                  onChange={e => onRenameChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") onRenameSubmit(); if (e.key === "Escape") onRenameCancel(); }}
                  style={{
                    flex: 1, padding: "0.3rem 0.5rem",
                    background: isDark ? "#ffffff12" : "#f3f4f6",
                    border: `1px solid #2563EB`,
                    borderRadius: "0.4rem", color: t.text, fontSize: "0.875rem",
                  }}
                />
                <button onClick={onRenameSubmit} style={{ background: "none", border: "none", cursor: "pointer", color: "#10B981", padding: "0.2rem" }}>
                  <Check size={16} />
                </button>
                <button onClick={onRenameCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "0.2rem" }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {site.name}
              </h2>
            )}
          </div>

          {/* Menu contextuel */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={onMenuToggle}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: t.text, opacity: 0.5 }}
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute", right: 0, top: "100%", zIndex: 50,
                  background: isDark ? "#1e2330" : "#fff",
                  border: `1px solid ${t.border}`, borderRadius: "0.75rem",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 165,
                  overflow: "hidden",
                }}
              >
                {menuItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.6rem",
                      width: "100%", padding: "0.6rem 1rem",
                      background: "none", border: "none", cursor: "pointer",
                      color: (item as { danger?: boolean }).danger ? "#EF4444" : t.text,
                      fontSize: "0.84rem", textAlign: "left",
                    }}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statut + domaine */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: statusColor, fontSize: "0.78rem", fontWeight: 600 }}>
            {STATUS_ICON[site.status]} {STATUS_LABEL[site.status]}
          </span>
          {domain && (
            <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#2563EB", fontSize: "0.75rem", textDecoration: "none" }}>
              <ExternalLink size={11} /> {domain}
            </a>
          )}
        </div>

        {/* Méta */}
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", opacity: 0.45, marginBottom: "0.9rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Layers size={11} /> {site.page_count} page{site.page_count !== 1 ? "s" : ""}
          </span>
          <span>
            Modifié {new Date(site.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        </div>

        {/* Actions rapides */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={onEdit} style={{ ...btn(), flex: 1 }}>
            <Pencil size={13} /> Éditer
          </button>
          <button onClick={onPreview} style={{ ...ghostBtn, flex: 1 }}>
            <Eye size={13} /> Aperçu
          </button>
          {site.status !== "published" && site.status !== "archived" && (
            <button onClick={onPublish} style={{ ...btn("#10B981") }}>
              <Power size={13} />
            </button>
          )}
          {site.status === "published" && (
            <button onClick={onDepublish} style={{ ...ghostBtn }}>
              <PowerOff size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onNew, isDark, t }: { onNew: () => void; isDark: boolean; t: ReturnType<typeof tok> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: "center", padding: "5rem 2rem",
        background: t.glass, border: `1px solid ${t.border}`,
        borderRadius: "1.5rem", maxWidth: 520, margin: "0 auto",
      }}
    >
      <div style={{ width: 64, height: 64, borderRadius: "1rem", background: "#2563EB22", border: "1px solid #2563EB44", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
        <Globe size={28} color="#2563EB" opacity={0.7} />
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "0.5rem" }}>Aucun site créé</h2>
      <p style={{ opacity: 0.5, marginBottom: "2rem", lineHeight: 1.6, fontSize: "0.9rem" }}>
        Créez votre premier site professionnel en quelques minutes avec l'IA, un modèle ou depuis zéro.
      </p>
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={onNew}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "#2563EB", color: "#fff",
          border: "none", borderRadius: "0.75rem",
          padding: "0.75rem 1.75rem", fontWeight: 700,
          fontSize: "0.95rem", cursor: "pointer",
        }}
      >
        <Plus size={16} /> Créer mon premier site
      </motion.button>
    </motion.div>
  );
}
