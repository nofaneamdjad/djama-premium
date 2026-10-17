"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Globe, Plus, Pencil, Trash2, ExternalLink, Eye,
  Clock, CheckCircle, Archive, MoreVertical, Layers, BarChart2
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";
import type { Website } from "@/lib/website-builder/types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "#6B7280",
  published: "#10B981",
  archived: "#F59E0B",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  draft: <Clock size={13} />,
  published: <CheckCircle size={13} />,
  archived: <Archive size={13} />,
};

export default function SiteWebPage() {
  const { isDark } = useTheme();
  const t = tok(isDark);
  const router = useRouter();

  const [sites, setSites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/websites")
      .then(r => r.json())
      .then(d => setSites(d.websites ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce site ? Cette action est irréversible.")) return;
    setDeletingId(id);
    await fetch(`/api/websites/${id}`, { method: "DELETE" });
    setSites(prev => prev.filter(s => s.id !== id));
    setDeletingId(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, padding: "2rem" }}>
      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "#2563EB", borderRadius: "0.75rem", padding: "0.6rem", display: "flex" }}>
              <Globe size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Sites web</h1>
              <p style={{ margin: 0, opacity: 0.55, fontSize: "0.875rem" }}>Gérez et publiez vos sites professionnels</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/client/site-web/create")}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "#2563EB", color: "#fff",
              border: "none", borderRadius: "0.75rem",
              padding: "0.65rem 1.25rem", fontWeight: 600,
              fontSize: "0.9rem", cursor: "pointer",
            }}
          >
            <Plus size={16} /> Nouveau site
          </motion.button>
        </div>

        {/* Contenu */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", opacity: 0.4 }}>Chargement…</div>
        ) : sites.length === 0 ? (
          <EmptyState onNew={() => router.push("/client/site-web/create")} isDark={isDark} t={t} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {sites.map(site => (
              <SiteCard
                key={site.id}
                site={site}
                isDark={isDark}
                t={t}
                isDeleting={deletingId === site.id}
                menuOpen={menuOpen === site.id}
                onMenuToggle={() => setMenuOpen(menuOpen === site.id ? null : site.id)}
                onEdit={() => router.push(`/client/site-web/${site.id}/edit`)}
                onStats={() => router.push(`/client/site-web/${site.id}/stats`)}
                onDelete={() => handleDelete(site.id)}
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
  site, isDark, t, isDeleting, menuOpen, onMenuToggle, onEdit, onStats, onDelete
}: {
  site: Website;
  isDark: boolean;
  t: ReturnType<typeof tok>;
  isDeleting: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onEdit: () => void;
  onStats: () => void;
  onDelete: () => void;
}) {
  const statusColor = STATUS_COLOR[site.status] ?? "#6B7280";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }}
      style={{
        background: t.glass,
        border: `1px solid ${t.border}`,
        borderRadius: "1rem",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Miniature */}
      <div
        style={{
          height: 140,
          background: `linear-gradient(135deg, ${(site.theme as { primaryColor?: string })?.primaryColor ?? "#2563EB"}22, ${(site.theme as { primaryColor?: string })?.primaryColor ?? "#2563EB"}55)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {site.thumbnail_url ? (
          <img src={site.thumbnail_url} alt={site.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Globe size={40} color={(site.theme as { primaryColor?: string })?.primaryColor ?? "#2563EB"} opacity={0.6} />
        )}
      </div>

      {/* Corps */}
      <div style={{ padding: "1.1rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {site.name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: statusColor, fontSize: "0.78rem", fontWeight: 600 }}>
              {STATUS_ICON[site.status]} {STATUS_LABEL[site.status]}
            </div>
          </div>

          {/* Menu */}
          <div style={{ position: "relative" }}>
            <button onClick={onMenuToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: t.text, opacity: 0.5 }}>
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "100%", zIndex: 10,
                background: isDark ? "#1e2330" : "#fff",
                border: `1px solid ${t.border}`, borderRadius: "0.75rem",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 150,
                overflow: "hidden",
              }}>
                {[
                  { icon: <Pencil size={14} />, label: "Modifier", action: onEdit },
                  { icon: <Eye size={14} />, label: "Aperçu", action: () => window.open(`/api/websites/${site.id}/preview`, "_blank") },
                  { icon: <BarChart2 size={14} />, label: "Statistiques", action: onStats },
                  { icon: <Trash2 size={14} />, label: "Supprimer", action: onDelete, danger: true },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => { onMenuToggle(); item.action(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.6rem",
                      width: "100%", padding: "0.65rem 1rem",
                      background: "none", border: "none", cursor: "pointer",
                      color: item.danger ? "#EF4444" : t.text, fontSize: "0.875rem", textAlign: "left",
                    }}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Méta */}
        <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.75rem", fontSize: "0.78rem", opacity: 0.55 }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Layers size={12} /> {site.page_count} page{site.page_count !== 1 ? "s" : ""}
          </span>
          {site.subdomain && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <ExternalLink size={12} /> {site.subdomain}.djama.site
            </span>
          )}
        </div>

        {/* Actions rapides */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              background: "#2563EB", color: "#fff",
              border: "none", borderRadius: "0.6rem",
              padding: "0.5rem", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
            }}
          >
            <Pencil size={13} /> Éditer
          </button>
          <button
            onClick={onStats}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              background: isDark ? "#ffffff12" : "#f3f4f6", color: t.text,
              border: "none", borderRadius: "0.6rem",
              padding: "0.5rem 0.65rem", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
            }}
          >
            <BarChart2 size={13} />
          </button>
          <button
            onClick={() => window.open(`/api/websites/${site.id}/preview`, "_blank")}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              background: isDark ? "#ffffff12" : "#f3f4f6", color: t.text,
              border: "none", borderRadius: "0.6rem",
              padding: "0.5rem", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
            }}
          >
            <Eye size={13} /> Aperçu
          </button>
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
      <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🌐</div>
      <h2 style={{ fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>Aucun site web</h2>
      <p style={{ opacity: 0.55, marginBottom: "2rem", lineHeight: 1.6 }}>
        Créez votre premier site professionnel en quelques minutes grâce à nos templates ou à l'IA.
      </p>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
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
