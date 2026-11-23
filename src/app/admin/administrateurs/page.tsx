"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Shield, ShieldCheck, ShieldOff, Plus, Trash2,
  RefreshCw, ChevronDown, Lock, Eye, EyeOff, Loader2,
  CheckCircle2, AlertTriangle, XCircle, UserCog,
} from "lucide-react";
import { V } from "@/components/hq";

// ─── Types ─────────────────────────────────────────────────────────────────

type AdminRole = "super_admin" | "direction" | "admin" | "finance" | "commercial" | "support" | "tech" | "viewer";

interface AdminEntry {
  id:           string;
  email:        string;
  name:         string;
  role:         AdminRole;
  role_label:   string;
  is_active:    boolean;
  mfa_required: boolean;
  last_login:   string | null;
  created_at:   string;
}

const ROLE_OPTIONS: { value: AdminRole; label: string; desc: string }[] = [
  { value: "super_admin", label: "Super Admin",          desc: "Tous droits + sécurité système" },
  { value: "direction",   label: "Direction",            desc: "Management opérationnel" },
  { value: "finance",     label: "Responsable Financier",desc: "Paiements et remboursements" },
  { value: "commercial",  label: "Commercial",           desc: "Clients et abonnements" },
  { value: "support",     label: "Support Client",       desc: "Messages et tickets" },
  { value: "tech",        label: "Informatique",         desc: "Logs et monitoring" },
  { value: "viewer",      label: "Autres employés",      desc: "Lecture seule" },
];

const ROLE_COLOR: Record<AdminRole, string> = {
  super_admin: "#f87171",
  direction:   "#fb923c",
  admin:       "#fbbf24",
  finance:     "#34d399",
  commercial:  "#60a5fa",
  support:     "#a78bfa",
  tech:        "#94a3b8",
  viewer:      "#6b7280",
};

function fmt(iso: string | null) {
  if (!iso) return "Jamais";
  try {
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

// ─── Composant principal ───────────────────────────────────────────────────

export default function AdministrateursPage() {
  const [admins,   setAdmins]   = useState<AdminEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  // Création
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail,   setNewEmail]   = useState("");
  const [newName,    setNewName]    = useState("");
  const [newRole,    setNewRole]    = useState<AdminRole>("viewer");
  const [newMfa,     setNewMfa]     = useState(false);
  const [creating,   setCreating]   = useState(false);

  // Ré-auth dialog
  const [reauthFor,   setReauthFor]   = useState<{ purpose: string; onSuccess: (tok: string) => void } | null>(null);
  const [reauthPwd,   setReauthPwd]   = useState("");
  const [reauthShow,  setReauthShow]  = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthErr,   setReauthErr]   = useState("");

  // Modification inline
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>("viewer");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/administrateurs");
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setAdmins(d.admins ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Re-auth flow ────────────────────────────────────────────────────────

  async function requestReauth(purpose: string): Promise<string> {
    return new Promise((resolve, reject) => {
      setReauthPwd("");
      setReauthErr("");
      setReauthFor({
        purpose,
        onSuccess: (tok) => { setReauthFor(null); resolve(tok); },
      });
      // Reject after close
    });
  }

  async function submitReauth(e: React.FormEvent) {
    e.preventDefault();
    if (!reauthFor || !reauthPwd) return;
    setReauthLoading(true);
    setReauthErr("");
    try {
      const r = await fetch("/api/admin/auth/reauth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password: reauthPwd, purpose: reauthFor.purpose }),
      });
      const d = await r.json();
      if (!r.ok) { setReauthErr(d.error ?? "Erreur"); return; }
      reauthFor.onSuccess(d.reauth_token);
    } catch { setReauthErr("Erreur réseau"); }
    finally { setReauthLoading(false); }
  }

  // ── Création ────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;
    setCreating(true);
    setErr(null);
    try {
      const reauthToken = await requestReauth("admin_create");
      const r = await fetch("/api/admin/administrateurs", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-Reauth-Token": reauthToken },
        body:    JSON.stringify({ email: newEmail.trim(), name: newName.trim(), role: newRole, mfa_required: newMfa }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Erreur"); return; }
      setSuccess(`Admin ${d.admin?.email} créé avec succès. Une invitation a été envoyée.`);
      setShowCreate(false);
      setNewEmail(""); setNewName(""); setNewRole("viewer"); setNewMfa(false);
      await load(true);
    } catch { /* user cancelled reauth */ }
    finally { setCreating(false); }
  }

  // ── Modification de rôle ─────────────────────────────────────────────────

  async function handleRoleChange(id: string, role: AdminRole) {
    try {
      const reauthToken = await requestReauth("perm_change");
      const r = await fetch("/api/admin/administrateurs", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", "X-Reauth-Token": reauthToken },
        body:    JSON.stringify({ id, role }),
      });
      if (!r.ok) { const d = await r.json(); setErr(d.error ?? "Erreur"); return; }
      setSuccess("Rôle mis à jour.");
      setEditId(null);
      await load(true);
    } catch { /* cancelled */ }
  }

  // ── Toggle actif ─────────────────────────────────────────────────────────

  async function handleToggleActive(admin: AdminEntry) {
    const r = await fetch("/api/admin/administrateurs", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: admin.id, is_active: !admin.is_active }),
    });
    if (!r.ok) { const d = await r.json(); setErr(d.error ?? "Erreur"); return; }
    setSuccess(admin.is_active ? `${admin.name} désactivé.` : `${admin.name} réactivé.`);
    await load(true);
  }

  // ── Suppression ──────────────────────────────────────────────────────────

  async function handleDelete(admin: AdminEntry) {
    if (!confirm(`Supprimer définitivement le compte de ${admin.name} (${admin.email}) ?`)) return;
    try {
      const reauthToken = await requestReauth("admin_create");
      const r = await fetch("/api/admin/administrateurs", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json", "X-Reauth-Token": reauthToken },
        body:    JSON.stringify({ id: admin.id }),
      });
      if (!r.ok) { const d = await r.json(); setErr(d.error ?? "Erreur"); return; }
      setSuccess(`${admin.name} supprimé.`);
      await load(true);
    } catch { /* cancelled */ }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black" style={{ color: V.text }}>
            <UserCog size={18} style={{ color: V.gold }} /> Administrateurs
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            7 rôles disponibles — principe du moindre privilège
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.78rem] transition disabled:opacity-40"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Actualiser
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[0.78rem] font-semibold transition"
            style={{ background: V.gold, color: "#000" }}>
            <Plus size={12} /> Inviter un admin
          </button>
        </div>
      </div>

      {/* Alertes */}
      {err && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem] flex items-center gap-2"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)", color: "#f87171" }}>
          <XCircle size={14} /> {err}
        </div>
      )}
      {success && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem] flex items-center gap-2"
          style={{ borderColor: "rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.08)", color: "#34d399" }}>
          <CheckCircle2 size={14} /> {success}
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center py-14">
            <Users size={28} style={{ color: V.textFaint }} />
            <p className="mt-3 text-[0.88rem]" style={{ color: V.textMuted }}>Aucun administrateur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: V.border }}>
                  {["Admin", "Rôle", "MFA", "Statut", "Dernière connexion", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                      style={{ color: V.textFaint }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id} className="border-b transition-colors"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3.5">
                      <p className="text-[0.85rem] font-semibold" style={{ color: V.text }}>{a.name}</p>
                      <p className="text-[0.72rem]" style={{ color: V.textFaint }}>{a.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {editId === a.id ? (
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <select value={editRole} onChange={e => setEditRole(e.target.value as AdminRole)}
                              className="rounded-lg border bg-transparent pl-2.5 pr-7 py-1.5 text-[0.78rem] appearance-none outline-none"
                              style={{ borderColor: V.goldBorder, color: V.text, background: V.surface }}>
                              {ROLE_OPTIONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
                          </div>
                          <button onClick={() => handleRoleChange(a.id, editRole)}
                            className="rounded-lg px-2 py-1.5 text-[0.72rem] font-semibold"
                            style={{ background: V.goldDim, color: V.gold }}>
                            OK
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="text-[0.72rem]" style={{ color: V.textFaint }}>
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditId(a.id); setEditRole(a.role); }}
                          className="flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold"
                            style={{
                              color:        ROLE_COLOR[a.role] ?? V.textMuted,
                              borderColor:  `${ROLE_COLOR[a.role] ?? V.textMuted}40`,
                              background:   `${ROLE_COLOR[a.role] ?? V.textMuted}12`,
                            }}>
                            {a.role_label}
                          </span>
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {a.mfa_required ? (
                        <span className="flex items-center gap-1 text-[0.75rem]" style={{ color: "#34d399" }}>
                          <ShieldCheck size={12} /> Requis
                        </span>
                      ) : (
                        <span className="text-[0.75rem]" style={{ color: V.textFaint }}>Optionnel</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {a.is_active ? (
                        <span className="flex items-center gap-1 text-[0.75rem]" style={{ color: "#34d399" }}>
                          <CheckCircle2 size={11} /> Actif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[0.75rem]" style={{ color: "#f87171" }}>
                          <XCircle size={11} /> Désactivé
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[0.76rem]" style={{ color: V.textFaint }}>
                      {fmt(a.last_login)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleToggleActive(a)}
                          title={a.is_active ? "Désactiver" : "Réactiver"}
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                          style={{ color: a.is_active ? "#fbbf24" : "#34d399", background: "transparent" }}>
                          {a.is_active ? <ShieldOff size={13} /> : <Shield size={13} />}
                        </button>
                        <button onClick={() => handleDelete(a)}
                          title="Supprimer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                          style={{ color: "#f87171" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal création */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: V.card, borderColor: V.border }}>
            <h2 className="mb-4 text-[1rem] font-bold" style={{ color: V.text }}>
              Inviter un administrateur
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Nom complet" required
                className="w-full rounded-xl border bg-transparent px-4 py-2.5 text-[0.85rem] outline-none"
                style={{ borderColor: V.border, color: V.text }} />
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
                type="email" placeholder="Email" required
                className="w-full rounded-xl border bg-transparent px-4 py-2.5 text-[0.85rem] outline-none"
                style={{ borderColor: V.border, color: V.text }} />
              <div className="relative">
                <select value={newRole} onChange={e => setNewRole(e.target.value as AdminRole)}
                  className="w-full rounded-xl border bg-transparent pl-4 pr-9 py-2.5 text-[0.85rem] appearance-none outline-none"
                  style={{ borderColor: V.border, color: V.text, background: V.surface }}>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
              </div>
              <label className="flex items-center gap-2 text-[0.82rem] cursor-pointer" style={{ color: V.textMuted }}>
                <input type="checkbox" checked={newMfa} onChange={e => setNewMfa(e.target.checked)}
                  className="rounded" />
                MFA obligatoire pour ce compte
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={creating || !newEmail.trim() || !newName.trim()}
                  className="flex-1 rounded-xl py-2.5 text-[0.88rem] font-bold transition disabled:opacity-50"
                  style={{ background: V.gold, color: "#000" }}>
                  {creating ? "Envoi…" : "Inviter"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="rounded-xl border px-4 py-2.5 text-[0.88rem] transition"
                  style={{ borderColor: V.border, color: V.textMuted }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ré-auth */}
      {reauthFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-2xl border p-6"
            style={{ background: V.card, borderColor: V.border }}>
            <div className="mb-4 flex items-center gap-2">
              <Lock size={16} style={{ color: V.gold }} />
              <h2 className="text-[1rem] font-bold" style={{ color: V.text }}>
                Confirmation de sécurité
              </h2>
            </div>
            <p className="mb-4 text-[0.78rem]" style={{ color: V.textMuted }}>
              Cette action est critique. Confirmez votre identité en saisissant votre mot de passe.
            </p>
            <form onSubmit={submitReauth} className="space-y-3">
              <div className="relative">
                <input type={reauthShow ? "text" : "password"}
                  value={reauthPwd} onChange={e => setReauthPwd(e.target.value)}
                  placeholder="Mot de passe" autoFocus required
                  className="w-full rounded-xl border bg-transparent px-4 py-2.5 pr-11 text-[0.85rem] outline-none"
                  style={{ borderColor: reauthErr ? "rgba(248,113,113,0.5)" : V.border, color: V.text }} />
                <button type="button" onClick={() => setReauthShow(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: V.textFaint }}>
                  {reauthShow ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {reauthErr && (
                <p className="text-[0.76rem] text-center" style={{ color: "#f87171" }}>
                  <AlertTriangle size={11} className="inline mr-1" />{reauthErr}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={reauthLoading || !reauthPwd}
                  className="flex-1 rounded-xl py-2.5 text-[0.88rem] font-bold transition disabled:opacity-50"
                  style={{ background: V.gold, color: "#000" }}>
                  {reauthLoading ? "Vérification…" : "Confirmer"}
                </button>
                <button type="button" onClick={() => setReauthFor(null)}
                  className="rounded-xl border px-4 py-2.5 text-[0.88rem] transition"
                  style={{ borderColor: V.border, color: V.textMuted }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
