"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Mail, Shield, Trash2, ChevronDown, CheckSquare, Square, Building2, RefreshCw, Clock, X, Check } from "lucide-react";
import { useSubscription } from "@/lib/use-require-subscription";

const ROLE_LABELS: Record<string, string> = {
  owner:     "Propriétaire",
  admin:     "Administrateur",
  member:    "Membre",
  accountant:"Comptable",
  readonly:  "Lecture seule",
};

const ROLE_COLORS: Record<string, string> = {
  owner:     "#c9a55a",
  admin:     "#6366f1",
  member:    "#22c55e",
  accountant:"#f59e0b",
  readonly:  "#6b7280",
};

const APP_GROUPS: { label: string; apps: { slug: string; label: string }[] }[] = [
  {
    label: "Finance",
    apps: [
      { slug: "factures",     label: "Factures & Devis" },
      { slug: "depenses",     label: "Dépenses" },
      { slug: "tresorerie",   label: "Trésorerie" },
      { slug: "comptabilite", label: "Comptabilité" },
    ],
  },
  {
    label: "Commercial",
    apps: [
      { slug: "crm",          label: "CRM" },
      { slug: "contrats",     label: "Contrats" },
      { slug: "fournisseurs", label: "Fournisseurs" },
      { slug: "stocks",       label: "Stocks" },
    ],
  },
  {
    label: "Opérations",
    apps: [
      { slug: "productivite", label: "Tâches" },
      { slug: "planning",     label: "Planning" },
      { slug: "equipe",       label: "Équipe" },
      { slug: "projets",      label: "Projets" },
    ],
  },
  {
    label: "Intelligence",
    apps: [
      { slug: "assistant",    label: "Assistant IA" },
      { slug: "sourcing",     label: "Sourcing IA" },
      { slug: "bloc-notes",   label: "Notes" },
      { slug: "checklists",   label: "Checklists" },
    ],
  },
];

type Org = { id: string; name: string; plan: string; owner_id: string };
type OrgMember = { id: string; user_id: string; role: string; joined_at: string; invite_email?: string; permissions: { app_slug: string }[] };
type Invitation = { id: string; invited_email: string; role: string; status: string; expires_at: string };

export default function EquipePage() {
  const { userId } = useSubscription();

  const [org, setOrg]               = useState<Org | null>(null);
  const [members, setMembers]       = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  // Création org
  const [orgName, setOrgName]       = useState("");
  const [creating, setCreating]     = useState(false);

  // Invitation form
  const [invEmail, setInvEmail]     = useState("");
  const [invRole, setInvRole]       = useState("member");
  const [invApps, setInvApps]       = useState<string[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invSuccess, setInvSuccess] = useState("");
  const [invError, setInvError]     = useState("");

  const [tab, setTab] = useState<"members" | "invitations">("members");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const orgRes = await fetch("/api/organizations");
      const orgData = await orgRes.json();
      if (orgData.orgs && orgData.orgs.length > 0) {
        setOrg(orgData.orgs[0]);

        const [membersRes, invRes] = await Promise.all([
          fetch(`/api/organizations/${orgData.orgs[0].id}/members`),
          fetch(`/api/organizations/${orgData.orgs[0].id}/invite`),
        ]);
        const membersData = await membersRes.json();
        const invData     = await invRes.json();
        setMembers(membersData.members ?? []);
        setInvitations((invData.invitations ?? []).filter((i: Invitation) => i.status === "pending"));
      }
    } catch {
      setError("Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreating(true);
    setError("");
    const res  = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setCreating(false); return; }
    await loadData();
    setCreating(false);
  }

  async function sendInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    setInvLoading(true); setInvError(""); setInvSuccess("");
    const res  = await fetch(`/api/organizations/${org.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: invEmail, role: invRole, selectedApps: invApps }),
    });
    const data = await res.json();
    if (!res.ok) { setInvError(data.error); setInvLoading(false); return; }
    setInvSuccess(`Invitation envoyée à ${invEmail} !`);
    setInvEmail(""); setInvApps([]);
    setInvLoading(false);
    await loadData();
  }

  async function removeMember(memberId: string) {
    if (!org) return;
    if (!confirm("Retirer ce membre ? Il perdra immédiatement l'accès aux données de l'organisation.")) return;
    const res = await fetch(`/api/organizations/${org.id}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) { await loadData(); }
    else { const d = await res.json(); alert(d.error); }
  }

  async function cancelInvitation(invitationId: string) {
    if (!org) return;
    const res = await fetch(`/api/organizations/${org.id}/invite`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    if (res.ok) { await loadData(); }
  }

  function toggleApp(slug: string) {
    setInvApps(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="animate-spin text-amber-500" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
          <Users size={20} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Gestion de l'équipe</h1>
          <p className="text-sm text-gray-500">Gérez les membres et les accès de votre organisation</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* ─── Pas d'organisation → création ─── */}
      {!org ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center dark:border-white/10 dark:bg-white/3">
          <Building2 size={40} className="mx-auto mb-4 text-gray-400" />
          <h2 className="mb-2 text-lg font-semibold">Créez votre organisation</h2>
          <p className="mb-6 text-sm text-gray-500">Une organisation vous permet d'inviter des collaborateurs et de partager vos outils DJAMA.</p>
          <form onSubmit={createOrg} className="mx-auto flex max-w-sm flex-col gap-3">
            <input
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Nom de votre entreprise"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-white/5"
              required
              minLength={2}
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
            >
              {creating ? "Création…" : "Créer l'organisation"}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* ─── Info org ─── */}
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/8 dark:bg-white/3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-lg font-bold text-amber-500">
                {org.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{org.name}</p>
                <p className="text-xs text-gray-500">{members.length} membre{members.length > 1 ? "s" : ""}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${org.plan === "premium" ? "bg-green-500/10 text-green-500" : "bg-gray-100 text-gray-500 dark:bg-white/8"}`}>
              {org.plan === "premium" ? "✓ Abonnement actif" : "Plan gratuit"}
            </span>
          </div>

          {/* ─── Tabs ─── */}
          <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-white/8 dark:bg-white/5">
            {[
              { key: "members",     label: `Membres (${members.length})` },
              { key: "invitations", label: `Invitations en attente (${invitations.length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.key ? "bg-white shadow-sm dark:bg-white/10" : "text-gray-500 hover:text-gray-700 dark:hover:text-white/70"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── Tab Membres ─── */}
          {tab === "members" && (
            <div className="space-y-3">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-white/3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: ROLE_COLORS[m.role] ?? "#6b7280" }}>
                      {(m.invite_email ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.invite_email ?? `Utilisateur ${m.user_id.slice(0, 8)}`}</p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium" style={{ color: ROLE_COLORS[m.role] }}>{ROLE_LABELS[m.role] ?? m.role}</span>
                        {m.permissions.length > 0 && ` · ${m.permissions.length} app${m.permissions.length > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.user_id === userId || m.role === "owner" ? (
                      <span className="text-xs text-gray-400">{m.user_id === userId ? "Vous" : "Propriétaire"}</span>
                    ) : (
                      <button
                        onClick={() => removeMember(m.id)}
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                        title="Retirer ce membre"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">Aucun membre pour l'instant.</p>
              )}
            </div>
          )}

          {/* ─── Tab Invitations ─── */}
          {tab === "invitations" && (
            <div className="space-y-3">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-white/3">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-amber-400" />
                    <div>
                      <p className="text-sm font-medium">{inv.invited_email}</p>
                      <p className="text-xs text-gray-500">
                        {ROLE_LABELS[inv.role] ?? inv.role} · Expire le {new Date(inv.expires_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelInvitation(inv.id)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    title="Annuler l'invitation"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              {invitations.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">Aucune invitation en attente.</p>
              )}
            </div>
          )}

          {/* ─── Formulaire d'invitation ─── */}
          <div className="mt-8 rounded-2xl border border-amber-200/40 bg-amber-50/30 p-6 dark:border-amber-500/15 dark:bg-amber-500/5">
            <div className="mb-5 flex items-center gap-2">
              <UserPlus size={18} className="text-amber-500" />
              <h2 className="font-semibold">Inviter un nouveau membre</h2>
            </div>

            {invSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 p-3 text-sm text-green-600">
                <Check size={16} /> {invSuccess}
              </div>
            )}
            {invError && (
              <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{invError}</div>
            )}

            <form onSubmit={sendInvitation} className="space-y-4">
              {/* Email + Rôle */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Email du collaborateur</label>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                    <Mail size={15} className="text-gray-400" />
                    <input
                      type="email"
                      value={invEmail}
                      onChange={e => setInvEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      className="flex-1 bg-transparent text-sm outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="w-44">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Rôle</label>
                  <div className="relative">
                    <select
                      value={invRole}
                      onChange={e => setInvRole(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                    >
                      <option value="admin">Administrateur</option>
                      <option value="member">Membre</option>
                      <option value="accountant">Comptable</option>
                      <option value="readonly">Lecture seule</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Sélection des apps (pour rôles non-admin) */}
              {invRole !== "admin" && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    Applications accessibles <span className="text-gray-400">(les admins ont accès à tout)</span>
                  </label>
                  <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/3">
                    {APP_GROUPS.map(group => (
                      <div key={group.label}>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{group.label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {group.apps.map(app => {
                            const checked = invApps.includes(app.slug);
                            return (
                              <button
                                key={app.slug}
                                type="button"
                                onClick={() => toggleApp(app.slug)}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${checked ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/3 dark:text-gray-400 dark:hover:bg-white/6"}`}
                              >
                                {checked ? <CheckSquare size={14} className="text-amber-500 shrink-0" /> : <Square size={14} className="text-gray-300 shrink-0" />}
                                {app.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    {invApps.length === 0 ? "Aucune application sélectionnée → accès aux pages communes uniquement" : `${invApps.length} application${invApps.length > 1 ? "s" : ""} sélectionnée${invApps.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={invLoading}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
              >
                <Mail size={15} />
                {invLoading ? "Envoi…" : "Envoyer l'invitation"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
