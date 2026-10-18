"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Globe, ArrowLeft, Pencil, Eye, Power, PowerOff,
  Copy, Archive, ExternalLink, Link2, BarChart2,
  ClipboardList, CornerUpRight, Download, Layers,
  CheckCircle, Clock, RotateCcw, Users, History,
  Loader2, Plus, Settings, Trash2, UserPlus, X,
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";
import type { Website, WebsitePage, WebsiteVersion } from "@/lib/website-builder/types";

interface StatsQuick { totalVisits: number; uniqueVisitors: number; totalSubmissions: number }
interface Member { id: string; user_id: string; email: string; role: string; created_at: string }

const STATUS_COLOR: Record<string, string> = {
  draft: "#6B7280", published: "#10B981", archived: "#F59E0B",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon", published: "Publié", archived: "Archivé",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  draft: <Clock size={13} />, published: <CheckCircle size={13} />, archived: <Archive size={13} />,
};
const ROLE_LABEL: Record<string, string> = {
  owner: "Propriétaire", admin: "Administrateur", editor: "Éditeur", viewer: "Lecteur",
};

export default function SiteDetailPage() {
  const { isDark } = useTheme();
  const t = tok(isDark);
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [site,     setSite]     = useState<Website | null>(null);
  const [pages,    setPages]    = useState<WebsitePage[]>([]);
  const [stats,    setStats]    = useState<StatsQuick | null>(null);
  const [versions, setVersions] = useState<WebsiteVersion[]>([]);
  const [members,  setMembers]  = useState<Member[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState("editor");
  const [inviteError, setInviteError] = useState("");
  const [inviting,    setInviting]    = useState(false);
  const [restoring,   setRestoring]   = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [siteRes, statsRes, versRes, membersRes] = await Promise.allSettled([
        fetch(`/api/websites/${siteId}`),
        fetch(`/api/websites/${siteId}/stats?period=7d`),
        fetch(`/api/websites/${siteId}/versions`),
        fetch(`/api/websites/${siteId}/members`),
      ]);

      if (siteRes.status === "fulfilled" && siteRes.value.ok) {
        const d = await siteRes.value.json() as { website: Website; pages: WebsitePage[] };
        setSite(d.website); setPages(d.pages ?? []);
      }
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        setStats(await statsRes.value.json() as StatsQuick);
      }
      if (versRes.status === "fulfilled" && versRes.value.ok) {
        const d = await versRes.value.json() as { versions: WebsiteVersion[] };
        setVersions(d.versions ?? []);
      }
      if (membersRes.status === "fulfilled" && membersRes.value.ok) {
        const d = await membersRes.value.json() as { members: Member[] };
        setMembers(d.members ?? []);
      }
      setLoading(false);
    };
    load();
  }, [siteId]);

  async function publishSite(publish: boolean) {
    setActionLoading("publish");
    const res = await fetch(`/api/websites/${siteId}/publish`, { method: publish ? "POST" : "DELETE" });
    if (res.ok) setSite(prev => prev ? { ...prev, status: publish ? "published" : "draft" } : prev);
    setActionLoading(null);
  }

  async function duplicateSite() {
    setActionLoading("duplicate");
    const res  = await fetch(`/api/websites/${siteId}/duplicate`, { method: "POST" });
    const data = await res.json() as { website?: Website };
    if (res.ok && data.website) router.push(`/client/site-web/${data.website.id}`);
    else setActionLoading(null);
  }

  async function restoreVersion(versionId: string) {
    setRestoring(versionId);
    const res = await fetch(`/api/websites/${siteId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", versionId }),
    });
    if (res.ok) window.location.reload();
    setRestoring(null);
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) { setInviteError("Email requis."); return; }
    setInviting(true); setInviteError("");
    const res  = await fetch(`/api/websites/${siteId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const data = await res.json() as { member?: Member; error?: string };
    if (res.ok && data.member) {
      setMembers(prev => [...prev, data.member!]);
      setInviteEmail("");
    } else {
      setInviteError(data.error ?? "Erreur");
    }
    setInviting(false);
  }

  async function removeMember(userId: string) {
    await fetch(`/api/websites/${siteId}/members/${userId}`, { method: "DELETE" });
    setMembers(prev => prev.filter(m => m.user_id !== userId));
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} color="#2563EB" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!site) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, color: t.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <Globe size={40} opacity={0.3} />
        <p style={{ opacity: 0.5 }}>Site introuvable</p>
        <button onClick={() => router.push("/client/site-web")} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.65rem", padding: "0.6rem 1.25rem", cursor: "pointer", fontWeight: 600 }}>
          Retour
        </button>
      </div>
    );
  }

  const theme = site.theme as { primaryColor?: string };
  const primary = theme?.primaryColor ?? "#2563EB";
  const domain = site.subdomain ? `${site.subdomain}.djama.site` : site.custom_domain ?? null;
  const publicUrl = domain ? `https://${domain}` : null;
  const statusColor = STATUS_COLOR[site.status] ?? "#6B7280";

  const card = (style?: React.CSSProperties): React.CSSProperties => ({
    background: t.glass, border: `1px solid ${t.border}`,
    borderRadius: "0.85rem", padding: "1.25rem 1.5rem",
    ...style,
  });

  const actionBtn = (bg: string, color = "#fff"): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "0.4rem",
    background: bg, color, border: "none", borderRadius: "0.6rem",
    padding: "0.55rem 1rem", fontWeight: 600, fontSize: "0.82rem",
    cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.6 : 1,
  });

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: `1px solid ${t.border}`, background: t.glass, gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => router.push("/client/site-web")} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.55 }}>
            <ArrowLeft size={17} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: "0.6rem", background: `${primary}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe size={18} color={primary} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{site.name}</h1>
            {domain && (
              <a href={publicUrl!} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", color: "#2563EB", textDecoration: "none", opacity: 0.8 }}>
                <ExternalLink size={10} /> {domain}
              </a>
            )}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: statusColor, fontSize: "0.78rem", fontWeight: 600, background: `${statusColor}18`, padding: "0.2rem 0.65rem", borderRadius: 9999 }}>
            {STATUS_ICON[site.status]} {STATUS_LABEL[site.status]}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => router.push(`/client/site-web/${siteId}/edit`)} style={actionBtn("#2563EB")}>
            <Pencil size={14} /> Éditer
          </button>
          <button onClick={() => window.open(`/api/websites/${siteId}/preview`, "_blank")} style={actionBtn(isDark ? "#ffffff15" : "#f3f4f6", t.text)}>
            <Eye size={14} /> Aperçu
          </button>
          {site.status === "published" ? (
            <button onClick={() => publishSite(false)} style={actionBtn("#F59E0B1a", "#F59E0B")} disabled={!!actionLoading}>
              <PowerOff size={14} /> Dépublier
            </button>
          ) : (
            <button onClick={() => publishSite(true)} style={actionBtn("#10B981")} disabled={!!actionLoading}>
              {actionLoading === "publish" ? <Loader2 size={14} /> : <Power size={14} />} Publier
            </button>
          )}
          <button onClick={duplicateSite} style={actionBtn(isDark ? "#ffffff10" : "#f3f4f6", t.text)} disabled={!!actionLoading}>
            {actionLoading === "duplicate" ? <Loader2 size={14} /> : <Copy size={14} />}
          </button>
          <button onClick={() => window.open(`/api/websites/${siteId}/export`, "_blank")} style={actionBtn(isDark ? "#ffffff10" : "#f3f4f6", t.text)}>
            <Download size={14} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.75rem 1.5rem", display: "grid", gap: "1.25rem", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto" }}>

        {/* ── Publication ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={card()}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Globe size={15} color="#2563EB" />
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Publication</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Row label="Statut">
              <span style={{ color: statusColor, fontWeight: 600, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {STATUS_ICON[site.status]} {STATUS_LABEL[site.status]}
              </span>
            </Row>
            <Row label="URL publique">
              {publicUrl
                ? <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <ExternalLink size={11} /> {domain}
                  </a>
                : <span style={{ opacity: 0.4, fontSize: "0.8rem" }}>Non configuré</span>
              }
            </Row>
            {site.published_at && (
              <Row label="Dernière publication">
                <span style={{ fontSize: "0.8rem", opacity: 0.65 }}>
                  {new Date(site.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </Row>
            )}
            <Row label="Langue">
              <span style={{ fontSize: "0.8rem" }}>{site.lang?.toUpperCase() ?? "FR"}</span>
            </Row>
            <Row label="Pages">
              <span style={{ fontSize: "0.8rem" }}>{site.page_count} page{site.page_count !== 1 ? "s" : ""} · {site.published_pages} publiée{site.published_pages !== 1 ? "s" : ""}</span>
            </Row>
          </div>
        </motion.div>

        {/* ── Domaines ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} style={card()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Link2 size={15} color="#7C3AED" />
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Domaines</span>
            </div>
            <button
              onClick={() => router.push(`/client/site-web/${siteId}/domains`)}
              style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "0.5rem", padding: "0.3rem 0.65rem", cursor: "pointer", color: t.text, fontSize: "0.75rem", fontWeight: 600 }}>
              Gérer
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {site.subdomain ? (
              <DomainRow label="Sous-domaine" url={`${site.subdomain}.djama.site`} verified={true} t={t} />
            ) : (
              <p style={{ opacity: 0.4, fontSize: "0.82rem", margin: 0 }}>Aucun sous-domaine configuré</p>
            )}
            {site.custom_domain ? (
              <DomainRow label="Domaine custom" url={site.custom_domain} verified={false} t={t} />
            ) : (
              <button
                onClick={() => router.push(`/client/site-web/${siteId}/domains`)}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: `1px dashed ${t.border}`, borderRadius: "0.55rem", padding: "0.6rem 0.85rem", cursor: "pointer", color: "#7C3AED", fontSize: "0.8rem", fontWeight: 600 }}>
                <Plus size={13} /> Connecter un domaine personnalisé
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Statistiques rapides ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={card()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BarChart2 size={15} color="#10B981" />
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Statistiques · 7 jours</span>
            </div>
            <button
              onClick={() => router.push(`/client/site-web/${siteId}/stats`)}
              style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "0.5rem", padding: "0.3rem 0.65rem", cursor: "pointer", color: t.text, fontSize: "0.75rem", fontWeight: 600 }}>
              Détails
            </button>
          </div>
          {stats ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              {[
                { label: "Visites", value: stats.totalVisits, color: "#2563EB" },
                { label: "Visiteurs", value: stats.uniqueVisitors, color: "#7C3AED" },
                { label: "Formulaires", value: stats.totalSubmissions, color: "#10B981" },
              ].map(kpi => (
                <div key={kpi.label} style={{ textAlign: "center", padding: "0.75rem", background: `${kpi.color}10`, borderRadius: "0.65rem" }}>
                  <p style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: kpi.color }}>{kpi.value.toLocaleString("fr-FR")}</p>
                  <p style={{ fontSize: "0.7rem", opacity: 0.6, margin: "0.2rem 0 0" }}>{kpi.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ opacity: 0.35, fontSize: "0.82rem", margin: 0 }}>
              {site.status !== "published" ? "Publiez le site pour voir les statistiques." : "Aucune donnée pour la période."}
            </p>
          )}
        </motion.div>

        {/* ── Pages ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} style={card()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={15} color="#F59E0B" />
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Pages ({pages.length})</span>
            </div>
            <button
              onClick={() => router.push(`/client/site-web/${siteId}/edit`)}
              style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "0.5rem", padding: "0.3rem 0.65rem", cursor: "pointer", color: t.text, fontSize: "0.75rem", fontWeight: 600 }}>
              Gérer
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {pages.length === 0
              ? <p style={{ opacity: 0.4, fontSize: "0.82rem", margin: 0 }}>Aucune page</p>
              : pages.slice(0, 6).map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 0.6rem", background: isDark ? "#ffffff06" : "#f8fafc", borderRadius: "0.5rem" }}>
                  {p.is_homepage && <span style={{ fontSize: "0.62rem", background: "#2563EB", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: 9999, fontWeight: 700 }}>HOME</span>}
                  <span style={{ fontSize: "0.82rem", flex: 1 }}>{p.title}</span>
                  <span style={{ fontSize: "0.7rem", opacity: 0.45, fontFamily: "monospace" }}>/{p.slug}</span>
                  <span style={{ fontSize: "0.68rem", color: p.status === "published" ? "#10B981" : "#6B7280" }}>
                    {p.status === "published" ? "●" : "○"}
                  </span>
                </div>
              ))
            }
            {pages.length > 6 && (
              <p style={{ fontSize: "0.75rem", opacity: 0.45, margin: "0.25rem 0 0", textAlign: "center" }}>
                +{pages.length - 6} autres pages
              </p>
            )}
          </div>
        </motion.div>

        {/* ── Versions ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={card()}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <History size={15} color="#6B7280" />
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Historique des versions</span>
          </div>
          {versions.length === 0 ? (
            <p style={{ opacity: 0.4, fontSize: "0.82rem", margin: 0 }}>Aucune version sauvegardée</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {versions.slice(0, 5).map(v => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.65rem", background: isDark ? "#ffffff06" : "#f8fafc", borderRadius: "0.5rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600 }}>{v.label ?? "Version sans nom"}</p>
                    <p style={{ margin: 0, fontSize: "0.7rem", opacity: 0.45 }}>
                      {new Date(v.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={() => restoreVersion(v.id)}
                    disabled={restoring === v.id}
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.45rem", padding: "0.3rem 0.6rem", cursor: "pointer", color: t.text, fontSize: "0.72rem", fontWeight: 600 }}>
                    {restoring === v.id ? <Loader2 size={11} /> : <RotateCcw size={11} />} Restaurer
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Équipe ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={card()}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Users size={15} color="#EC4899" />
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Équipe ({members.length})</span>
          </div>

          {/* Inviter */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && inviteMember()}
              placeholder="email@exemple.com"
              style={{ flex: 1, minWidth: 140, padding: "0.5rem 0.75rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${inviteError ? "#EF4444" : t.border}`, borderRadius: "0.5rem", color: t.text, fontSize: "0.8rem" }}
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              style={{ padding: "0.5rem 0.65rem", background: isDark ? "#ffffff08" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: "0.5rem", color: t.text, fontSize: "0.8rem", cursor: "pointer" }}>
              <option value="admin">Admin</option>
              <option value="editor">Éditeur</option>
              <option value="viewer">Lecteur</option>
            </select>
            <button onClick={inviteMember} disabled={inviting} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "#EC4899", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 0.85rem", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>
              {inviting ? <Loader2 size={13} /> : <UserPlus size={13} />} Inviter
            </button>
          </div>
          {inviteError && <p style={{ fontSize: "0.75rem", color: "#EF4444", margin: "0 0 0.5rem" }}>{inviteError}</p>}

          {/* Liste membres */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {members.length === 0
              ? <p style={{ opacity: 0.4, fontSize: "0.82rem", margin: 0 }}>Aucun membre pour l'instant</p>
              : members.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.65rem", background: isDark ? "#ffffff06" : "#f8fafc", borderRadius: "0.5rem" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EC489920", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={13} color="#EC4899" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</p>
                  </div>
                  <span style={{ fontSize: "0.68rem", background: "#EC489918", color: "#EC4899", padding: "0.15rem 0.5rem", borderRadius: 9999, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                  {m.role !== "owner" && (
                    <button onClick={() => removeMember(m.user_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "0.15rem", opacity: 0.7 }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))
            }
          </div>
        </motion.div>

        {/* ── Liens rapides ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} style={{ ...card(), gridColumn: "1 / -1" }}>
          <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0 0 0.85rem" }}>Accès rapides</p>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {[
              { icon: <ClipboardList size={14} />, label: "Soumissions", action: () => router.push(`/client/site-web/${siteId}/submissions`) },
              { icon: <CornerUpRight size={14} />, label: "Redirections", action: () => router.push(`/client/site-web/${siteId}/redirections`) },
              { icon: <Download size={14} />, label: "Exporter HTML", action: () => window.open(`/api/websites/${siteId}/export`, "_blank") },
              { icon: <Settings size={14} />, label: "Paramètres", action: () => router.push(`/client/site-web/${siteId}/edit?tab=settings`) },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: isDark ? "#ffffff08" : "#f3f4f6", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.5rem 0.9rem", cursor: "pointer", color: t.text, fontSize: "0.82rem", fontWeight: 600 }}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// ── Utilitaires ───────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
      <span style={{ fontSize: "0.78rem", opacity: 0.5, flexShrink: 0 }}>{label}</span>
      <div style={{ textAlign: "right" }}>{children}</div>
    </div>
  );
}

function DomainRow({ label, url, verified, t }: { label: string; url: string; verified: boolean; t: ReturnType<typeof tok> }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.5rem 0.75rem", background: `${verified ? "#10B981" : "#F59E0B"}10`, border: `1px solid ${verified ? "#10B98130" : "#F59E0B30"}`, borderRadius: "0.55rem" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.7rem", opacity: 0.5 }}>{label}</p>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600 }}>{url}</p>
      </div>
      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: verified ? "#10B981" : "#F59E0B", whiteSpace: "nowrap" }}>
        {verified ? "✓ Actif" : "En attente"}
      </span>
    </div>
  );
}
