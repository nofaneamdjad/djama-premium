"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Monitor, Smartphone, Globe, Lock, ShieldAlert, RefreshCw,
  Search, X, Loader2, LogOut, AlertTriangle, ChevronDown,
  CheckCircle2, Clock, Shield, ShieldCheck, Eye, EyeOff,
  Zap, Users, KeyRound,
} from "lucide-react";
import { V } from "@/components/hq";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Device { browser: string; os: string; }

interface AdminSession {
  id:           string;
  ip_address:   string | null;
  user_agent:   string | null;
  device:       Device;
  created_at:   string;
  expires_at:   string;
  last_seen_at: string | null;
  aal:          "aal1" | "aal2";
  is_current:   boolean;
  // Vue globale seulement
  admin_user_id?: string;
  admin?: { id: string; email: string; name: string; role: string; is_active: boolean; };
}

type TabId = "mes-sessions" | "toutes" | "historique";

type AdminRole = "super_admin" | "direction" | "admin" | "finance" | "commercial" | "support" | "tech" | "viewer";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  direction:   "Direction",
  admin:       "Admin",
  finance:     "Finance",
  commercial:  "Commercial",
  support:     "Support",
  tech:        "Informatique",
  viewer:      "Viewer",
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: "#f87171",
  direction:   "#fb923c",
  admin:       "#fbbf24",
  finance:     "#34d399",
  commercial:  "#60a5fa",
  support:     "#a78bfa",
  tech:        "#94a3b8",
  viewer:      "#6b7280",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso ?? "—"; }
}

function relativeTime(iso: string | null) {
  if (!iso) return "jamais";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

function DeviceIcon({ device }: { device: Device }) {
  const isMobile = /iOS|Android/i.test(device.os);
  return isMobile
    ? <Smartphone size={13} style={{ color: V.textFaint }} />
    : <Monitor size={13} style={{ color: V.textFaint }} />;
}

// ─── Composants ───────────────────────────────────────────────────────────────

function SessionCard({
  session,
  onRevoke,
  revoking,
  showAdmin = false,
}: {
  session: AdminSession;
  onRevoke: (id: string, adminId?: string) => void;
  revoking: string | null;
  showAdmin?: boolean;
}) {
  const isExpiring = new Date(session.expires_at).getTime() - Date.now() < 2 * 3600 * 1000;

  return (
    <div
      className="rounded-2xl border p-4 transition"
      style={{
        background:   session.is_current ? `rgba(${V.goldR},0.05)` : V.card,
        borderColor:  session.is_current ? V.goldBorder : V.border,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: session.is_current ? V.goldDim : "rgba(255,255,255,0.04)" }}>
            <DeviceIcon device={session.device} />
          </div>
          <div className="min-w-0">
            {showAdmin && session.admin && (
              <div className="mb-1 flex items-center gap-1.5 flex-wrap">
                <span className="text-[0.78rem] font-semibold truncate"
                  style={{ color: V.text }}>{session.admin.name}</span>
                <span className="text-[0.68rem]" style={{ color: V.textFaint }}>{session.admin.email}</span>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold"
                  style={{
                    background: `${ROLE_COLOR[session.admin.role] ?? "#6b7280"}18`,
                    color:      ROLE_COLOR[session.admin.role] ?? "#6b7280",
                  }}>
                  {ROLE_LABELS[session.admin.role] ?? session.admin.role}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.82rem] font-semibold" style={{ color: V.text }}>
                {session.device.browser} · {session.device.os}
              </span>
              {session.is_current && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold"
                  style={{ background: V.goldDim, color: V.gold }}>
                  <CheckCircle2 size={9} /> Session actuelle
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${
                session.aal === "aal2" ? "" : "opacity-70"
              }`} style={{
                background: session.aal === "aal2" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.10)",
                color:      session.aal === "aal2" ? "#34d399" : "#fbbf24",
              }}>
                {session.aal === "aal2" ? <ShieldCheck size={9} /> : <Shield size={9} />}
                {session.aal === "aal2" ? "MFA" : "Sans MFA"}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 flex-wrap text-[0.73rem]"
              style={{ color: V.textFaint }}>
              <span className="flex items-center gap-1">
                <Globe size={10} /> {session.ip_address ?? "—"}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} /> Connexion : {fmt(session.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Zap size={10} /> Activité : {relativeTime(session.last_seen_at)}
              </span>
              {isExpiring && (
                <span className="flex items-center gap-1" style={{ color: "#fbbf24" }}>
                  <AlertTriangle size={10} /> Expire {relativeTime(session.expires_at)}
                </span>
              )}
            </div>
          </div>
        </div>
        {!session.is_current && (
          <button
            onClick={() => onRevoke(session.id, session.admin_user_id)}
            disabled={revoking === session.id}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[0.75rem] font-semibold transition disabled:opacity-40"
            style={{ borderColor: "rgba(248,113,113,0.25)", color: "#f87171" }}
          >
            {revoking === session.id
              ? <Loader2 size={11} className="animate-spin" />
              : <LogOut size={11} />}
            Révoquer
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function SessionsPage() {
  const [tab,          setTab]         = useState<TabId>("mes-sessions");
  const [sessions,     setSessions]    = useState<AdminSession[]>([]);
  const [allSessions,  setAllSessions] = useState<AdminSession[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [err,          setErr]         = useState<string | null>(null);
  const [revoking,     setRevoking]    = useState<string | null>(null);
  const [search,       setSearch]      = useState("");
  const [roleFilter,   setRoleFilter]  = useState("");
  const [confirmAll,   setConfirmAll]  = useState(false);
  const [lockdownOpen, setLockdownOpen] = useState(false);
  const [lockdownPwd,  setLockdownPwd] = useState("");
  const [lockdownReason, setLockdownReason] = useState("");
  const [lockdownLoading, setLockdownLoading] = useState(false);
  const [lockdownMsg,  setLockdownMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showPwd,      setShowPwd]     = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  /* ── Chargement ─────────────────────────────────────────────────────────── */

  const loadMySessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/sessions");
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setSessions(d.sessions ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, []);

  const loadAllSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/sessions?scope=all");
      if (r.status === 403) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setAllSessions(d.sessions ?? []);
      setIsSuperAdmin(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "mes-sessions") loadMySessions();
    else if (tab === "toutes") loadAllSessions();
  }, [tab, loadMySessions, loadAllSessions]);

  /* ── Révocation ─────────────────────────────────────────────────────────── */

  const revokeSession = useCallback(async (sessionId: string, adminUserId?: string) => {
    setRevoking(sessionId);
    try {
      const params = new URLSearchParams({ id: sessionId });
      if (adminUserId) params.set("admin_id", adminUserId);
      const r = await fetch(`/api/admin/sessions?${params}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error ?? "Échec");
      if (tab === "mes-sessions") await loadMySessions(true);
      else await loadAllSessions(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Échec de la révocation"); }
    finally { setRevoking(null); }
  }, [tab, loadMySessions, loadAllSessions]);

  const revokeAll = useCallback(async () => {
    setLoading(true);
    setConfirmAll(false);
    try {
      const r = await fetch("/api/admin/sessions", { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error ?? "Échec");
      await loadMySessions(false);
    } catch (e) { setErr(e instanceof Error ? e.message : "Échec"); setLoading(false); }
  }, [loadMySessions]);

  /* ── Lockdown global ────────────────────────────────────────────────────── */

  const handleLockdown = useCallback(async () => {
    if (!lockdownPwd || !lockdownReason) return;
    setLockdownLoading(true);
    setLockdownMsg(null);
    try {
      // Obtenir un token re-auth
      const r1 = await fetch("/api/admin/auth/reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: lockdownPwd, purpose: "security" }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.error ?? "Mot de passe incorrect");

      // Déclencher le lockdown
      const r2 = await fetch("/api/admin/sessions/lockdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reauth_token: d1.reauth_token, reason: lockdownReason }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error ?? "Échec du lockdown");

      setLockdownMsg({ type: "ok", text: `Lockdown exécuté — ${d2.sessions_revoked} session(s) révoquée(s).` });
      setLockdownPwd("");
      setLockdownReason("");
      await loadAllSessions(true);
    } catch (e) {
      setLockdownMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally { setLockdownLoading(false); }
  }, [lockdownPwd, lockdownReason, loadAllSessions]);

  /* ── Filtres ────────────────────────────────────────────────────────────── */

  const displaySessions = (tab === "toutes" ? allSessions : sessions).filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || [
      s.ip_address, s.user_agent, s.device.browser, s.device.os,
      s.admin?.email, s.admin?.name,
    ].some(v => v?.toLowerCase().includes(q));
    const matchRole = !roleFilter || s.admin?.role === roleFilter;
    return matchSearch && matchRole;
  });

  const uniqueRoles = [...new Set(allSessions.map(s => s.admin?.role).filter(Boolean))];

  /* ── Tabs ───────────────────────────────────────────────────────────────── */

  const TABS: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "mes-sessions", label: "Mes sessions",     icon: Monitor,  count: sessions.length },
    { id: "toutes",       label: "Toutes",           icon: Users,    count: allSessions.length },
    { id: "historique",   label: "Historique",       icon: Clock },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black" style={{ color: V.text }}>
            <Lock size={18} style={{ color: V.gold }} /> Gestion des sessions
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            Sessions actives des administrateurs — révocation et surveillance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tab === "mes-sessions" && sessions.length > 1 && !confirmAll && (
            <button onClick={() => setConfirmAll(true)}
              className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.78rem] font-semibold transition"
              style={{ borderColor: "rgba(248,113,113,0.25)", color: "#f87171" }}>
              <LogOut size={12} /> Déconnecter partout
            </button>
          )}
          {confirmAll && (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
              style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}>
              <span className="text-[0.75rem]" style={{ color: "#f87171" }}>Confirmer ?</span>
              <button onClick={revokeAll} className="text-[0.75rem] font-bold px-2" style={{ color: "#f87171" }}>Oui</button>
              <button onClick={() => setConfirmAll(false)} className="text-[0.75rem] px-2" style={{ color: V.textFaint }}>Non</button>
            </div>
          )}
          {isSuperAdmin && tab === "toutes" && (
            <button onClick={() => setLockdownOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.78rem] font-semibold transition"
              style={{ borderColor: "rgba(248,113,113,0.4)", color: "#f87171", background: "rgba(248,113,113,0.06)" }}>
              <ShieldAlert size={12} /> Lockdown d'urgence
            </button>
          )}
          <button onClick={() => tab === "toutes" ? loadAllSessions(true) : loadMySessions(true)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.78rem] transition disabled:opacity-40"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Actualiser
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: V.border, background: V.card }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); setRoleFilter(""); }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-[0.78rem] font-semibold transition flex-1 justify-center"
            style={{
              background: tab === t.id ? V.goldDim : "transparent",
              color:      tab === t.id ? V.gold    : V.textMuted,
              border:     tab === t.id ? `1px solid ${V.goldBorder}` : "1px solid transparent",
            }}>
            <t.icon size={12} />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="rounded-full px-1.5 py-0.5 text-[0.63rem] font-bold"
                style={{ background: tab === t.id ? V.goldBorder : "rgba(255,255,255,0.08)", color: tab === t.id ? V.gold : V.textFaint }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filtres (tabs sessions) */}
      {(tab === "mes-sessions" || tab === "toutes") && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="IP, navigateur, email…"
              className="w-full rounded-xl border bg-transparent pl-9 pr-3 py-2 text-[0.82rem] outline-none"
              style={{ borderColor: V.border, color: V.text }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: V.textFaint }}>
                <X size={12} />
              </button>
            )}
          </div>
          {tab === "toutes" && uniqueRoles.length > 0 && (
            <div className="relative">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="rounded-xl border bg-transparent pl-3 pr-7 py-2 text-[0.78rem] appearance-none outline-none"
                style={{ borderColor: V.border, color: V.textMuted }}>
                <option value="">Tous les rôles</option>
                {uniqueRoles.map(r => (
                  <option key={r} value={r!}>{ROLE_LABELS[r!] ?? r}</option>
                ))}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: V.textFaint }} />
            </div>
          )}
        </div>
      )}

      {/* Erreur */}
      {err && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)", color: "#f87171" }}>
          {err}
        </div>
      )}

      {/* Contenu onglet : mes sessions + toutes */}
      {(tab === "mes-sessions" || tab === "toutes") && (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
          </div>
        ) : displaySessions.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Lock size={32} style={{ color: V.textFaint }} />
            <p className="mt-4 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>
              {tab === "toutes" && !isSuperAdmin
                ? "Accès réservé au Super Admin"
                : "Aucune session active"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displaySessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                onRevoke={revokeSession}
                revoking={revoking}
                showAdmin={tab === "toutes"}
              />
            ))}
            <p className="text-right text-[0.72rem]" style={{ color: V.textFaint }}>
              {displaySessions.length} session{displaySessions.length !== 1 ? "s" : ""} affichée{displaySessions.length !== 1 ? "s" : ""}
            </p>
          </div>
        )
      )}

      {/* Contenu onglet : historique */}
      {tab === "historique" && (
        <HistoriqueTab />
      )}

      {/* Modal lockdown */}
      {lockdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-4"
            style={{ background: V.card, borderColor: "rgba(248,113,113,0.3)" }}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(248,113,113,0.1)" }}>
                <ShieldAlert size={18} style={{ color: "#f87171" }} />
              </div>
              <div>
                <h2 className="text-[1rem] font-black" style={{ color: "#f87171" }}>
                  Lockdown d'urgence
                </h2>
                <p className="mt-1 text-[0.78rem]" style={{ color: V.textMuted }}>
                  Révoque TOUTES les sessions actives de TOUS les administrateurs.
                  Action irréversible. Votre propre session sera également révoquée.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[0.75rem] font-semibold mb-1.5" style={{ color: V.textMuted }}>
                  Raison de l'incident *
                </label>
                <input
                  value={lockdownReason}
                  onChange={e => setLockdownReason(e.target.value)}
                  placeholder="Compromission de credentials, intrusion…"
                  className="w-full rounded-xl border bg-transparent px-3 py-2.5 text-[0.82rem] outline-none"
                  style={{ borderColor: V.border, color: V.text }}
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-semibold mb-1.5" style={{ color: V.textMuted }}>
                  Votre mot de passe (ré-authentification) *
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={lockdownPwd}
                    onChange={e => setLockdownPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border bg-transparent px-3 py-2.5 pr-10 text-[0.82rem] outline-none"
                    style={{ borderColor: V.border, color: V.text }}
                  />
                  <button onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: V.textFaint }}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {lockdownMsg && (
              <div className="rounded-xl border px-4 py-3 text-[0.8rem]"
                style={{
                  borderColor: lockdownMsg.type === "ok" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)",
                  background:  lockdownMsg.type === "ok" ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
                  color:       lockdownMsg.type === "ok" ? "#34d399" : "#f87171",
                }}>
                {lockdownMsg.text}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setLockdownOpen(false); setLockdownMsg(null); setLockdownPwd(""); setLockdownReason(""); }}
                className="flex-1 rounded-xl border py-2.5 text-[0.82rem] font-semibold"
                style={{ borderColor: V.border, color: V.textMuted }}>
                Annuler
              </button>
              <button
                onClick={handleLockdown}
                disabled={lockdownLoading || !lockdownPwd || !lockdownReason}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[0.82rem] font-bold disabled:opacity-40"
                style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
                {lockdownLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                Déclencher le lockdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Historique ────────────────────────────────────────────────────────

function HistoriqueTab() {
  const [events,  setEvents]  = useState<HistEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);

  interface HistEvent {
    id: string;
    action: string;
    admin_email: string | null;
    details: Record<string, unknown> | null;
    severity: "info" | "warning" | "critical" | null;
    created_at: string;
  }

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/audit?q=SESSION&limit=100")
      .then(r => r.json())
      .then(d => { setEvents(d.logs ?? []); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  const SEV_COLOR: Record<string, string> = {
    info: "#60a5fa", warning: "#fbbf24", critical: "#f87171",
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
    </div>
  );

  if (err) return (
    <div className="rounded-xl border px-4 py-3 text-[0.82rem]"
      style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)", color: "#f87171" }}>
      {err}
    </div>
  );

  if (events.length === 0) return (
    <div className="flex flex-col items-center py-16 text-center">
      <Clock size={32} style={{ color: V.textFaint }} />
      <p className="mt-4 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>
        Aucun événement de session
      </p>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
              {["Sévérité", "Action", "Admin", "Détails", "Date"].map(h => (
                <th key={h} className="px-4 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                  style={{ color: V.textFaint }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {events.map(ev => (
              <tr key={ev.id}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                className="transition-colors">
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold"
                    style={{ color: SEV_COLOR[ev.severity ?? "info"] ?? SEV_COLOR.info,
                             background: `${SEV_COLOR[ev.severity ?? "info"] ?? SEV_COLOR.info}18` }}>
                    {(ev.severity ?? "info").charAt(0).toUpperCase() + (ev.severity ?? "info").slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[0.78rem] font-mono font-semibold" style={{ color: V.text }}>{ev.action}</span>
                </td>
                <td className="px-4 py-3.5 text-[0.76rem]" style={{ color: V.textMuted }}>
                  {ev.admin_email ?? "—"}
                </td>
                <td className="px-4 py-3.5 text-[0.73rem]" style={{ color: V.textFaint }}>
                  {ev.details && Object.keys(ev.details).length > 0
                    ? Object.entries(ev.details).slice(0, 2).map(([k, v]) =>
                        <span key={k} className="mr-2">{k}: {String(v)}</span>
                      )
                    : "—"}
                </td>
                <td className="px-4 py-3.5 text-[0.73rem]" style={{ color: V.textFaint }}>
                  {fmt(ev.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
