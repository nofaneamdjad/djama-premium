"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, MoreHorizontal, Mail, Shield, RefreshCw, Loader2, Users, Download, X, Check } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const visible = new Set<number>();
  visible.add(1);
  visible.add(totalPages);
  for (let p = Math.max(1, page - 1); p <= Math.min(totalPages, page + 1); p++) visible.add(p);
  const pageNums = Array.from(visible).sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2 pb-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] text-[0.8rem] text-white/35 transition-colors hover:border-white/[0.15] hover:text-white/65 disabled:opacity-30"
      >
        ←
      </button>
      {pageNums.map((p, i) => {
        const prev = pageNums[i - 1];
        return (
          <div key={p} className="flex items-center gap-1.5">
            {prev && p - prev > 1 && <span className="text-[0.75rem] text-white/20">…</span>}
            <button
              onClick={() => onChange(p)}
              className={`flex h-8 min-w-[2rem] items-center justify-center rounded-xl px-2 text-[0.8rem] font-semibold transition-all ${
                p === page
                  ? "bg-[rgba(201,165,90,0.15)] text-[#c9a55a] border border-[rgba(201,165,90,0.3)]"
                  : "border border-white/[0.07] text-white/35 hover:border-white/[0.15] hover:text-white/65"
              }`}
            >
              {p}
            </button>
          </div>
        );
      })}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] text-[0.8rem] text-white/35 transition-colors hover:border-white/[0.15] hover:text-white/65 disabled:opacity-30"
      >
        →
      </button>
      <span className="ml-2 text-[0.73rem] text-white/20">{total} total · page {page}/{totalPages}</span>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Client = {
  id: string;
  email: string;
  full_name: string | null;
  statut: string | null;
  abonnement: string | null;
  stripe_customer_id?: string | null;
  subscription_active: boolean | null;
  created_at: string;
  updated_at?: string;
};

type UserAccess = {
  id: string;
  email: string;
  name: string;
  espace_premium: boolean;
  coaching_ia: boolean;
  soutien_scolaire: boolean;
  outils_saas: boolean;
  source: string;
  notes: string | null;
  created_at: string;
};

// Unified view for display
type DisplayClient = {
  id: string;
  name: string;
  email: string;
  source: string;
  status: string;
  badges: string[];
  createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusStyle(s: string) {
  if (s === "actif" || s === "active")   return "text-[#4ade80] bg-[rgba(74,222,128,0.10)]";
  if (s === "inactif" || s === "inactive") return "text-[#f87171] bg-[rgba(248,113,113,0.10)]";
  if (s === "en attente")                return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
  return "text-white/40 bg-white/[0.06]";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(clients: DisplayClient[]) {
  const headers = ["Nom", "Email", "Source", "Statut", "Accès / Offres", "Date"];
  const rows = clients.map(c => [
    c.name, c.email, c.source, c.status,
    c.badges.join(" | "),
    formatDate(c.createdAt),
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `clients_${new Date().toISOString().split("T")[0]}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Create Client Modal ──────────────────────────────────────────────────────

type CreateForm = {
  name: string; email: string; phone: string;
  source: string; espace_premium: boolean; coaching_ia: boolean;
  soutien_scolaire: boolean; outils_saas: boolean; notes: string;
};

const EMPTY_FORM: CreateForm = {
  name: "", email: "", phone: "", source: "manual",
  espace_premium: false, coaching_ia: false,
  soutien_scolaire: false, outils_saas: false, notes: "",
};

function CreateClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nom et email sont requis.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const supabase = getSupabase();
      const { error: dbErr } = await supabase.from("user_access").insert([{
        name:             form.name.trim(),
        email:            form.email.trim().toLowerCase(),
        phone:            form.phone.trim() || null,
        source:           form.source,
        espace_premium:   form.espace_premium,
        coaching_ia:      form.coaching_ia,
        soutien_scolaire: form.soutien_scolaire,
        outils_saas:      form.outils_saas,
        notes:            form.notes.trim() || null,
      }]);
      if (dbErr) throw dbErr;
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full rounded-xl border border-white/[0.07] bg-[#111115] px-4 py-2.5 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none focus:border-[rgba(201,165,90,0.4)] transition-colors";
  const chk = "flex items-center gap-2.5 text-[0.82rem] text-white/55 cursor-pointer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#18181c] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <h2 className="text-[0.98rem] font-black text-white">Ajouter un client</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-white/35 hover:bg-white/[0.08] hover:text-white/70 transition-colors">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Nom *</label>
              <input className={inp} placeholder="Jean Dupont" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Email *</label>
              <input type="email" className={inp} placeholder="jean@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Téléphone</label>
              <input className={inp} placeholder="+33 6 …" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Source</label>
              <select className={inp} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                <option value="manual">Manuel</option>
                <option value="contact">Contact</option>
                <option value="devis">Devis</option>
                <option value="stripe">Stripe</option>
                <option value="migrated">Migré</option>
              </select>
            </div>
          </div>
          <div>
            <p className="mb-2.5 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Accès</p>
            <div className="grid grid-cols-2 gap-2.5">
              {([
                ["espace_premium",   "Espace premium"  ],
                ["coaching_ia",      "Coaching IA"     ],
                ["soutien_scolaire", "Soutien scolaire"],
                ["outils_saas",      "Outils SaaS"     ],
              ] as [keyof CreateForm, string][]).map(([key, label]) => (
                <label key={key} className={chk}>
                  <input
                    type="checkbox"
                    checked={form[key] as boolean}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#c9a55a]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Notes</label>
            <textarea rows={2} className={inp} placeholder="Notes internes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && (
            <p className="rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[0.78rem] text-[#f87171]">{error}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[0.83rem] font-semibold text-white/40 hover:text-white/70 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c9a55a] py-2.5 text-[0.83rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Créer le client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminClients() {
  const [search,       setSearch]       = useState("");
  const [loading,      setLoading]      = useState(true);
  const [clients,      setClients]      = useState<DisplayClient[]>([]);
  const [filterStatus, setFilterStatus] = useState<"tous" | "actif" | "inactif">("tous");
  const [page,         setPage]         = useState(1);
  const [showCreate,   setShowCreate]   = useState(false);

  async function fetchClients(silent = false) {
    if (!silent) setLoading(true);
    try {
      const supabase = getSupabase();

      const [clientsRes, accessRes] = await Promise.all([
        supabase.from("clients").select("id, email, full_name, statut, abonnement, subscription_active, created_at").order("created_at", { ascending: false }),
        supabase.from("user_access").select("id, email, name, espace_premium, coaching_ia, soutien_scolaire, outils_saas, source, notes, created_at").order("created_at", { ascending: false }),
      ]);

      const clientsData: Client[] = clientsRes.data ?? [];
      const accessData: UserAccess[] = accessRes.data ?? [];

      // Merge: clients table first, then user_access that aren't in clients
      const merged: DisplayClient[] = [];
      const seenEmails = new Set<string>();

      for (const c of clientsData) {
        seenEmails.add(c.email);
        const badges: string[] = [];
        if (c.subscription_active) badges.push("Abonnement actif");
        if (c.abonnement)          badges.push(c.abonnement);
        merged.push({
          id:        c.id,
          name:      c.full_name || c.email,
          email:     c.email,
          source:    "stripe",
          status:    c.statut || (c.subscription_active ? "actif" : "inactif"),
          badges,
          createdAt: c.created_at,
        });
      }

      for (const ua of accessData) {
        if (seenEmails.has(ua.email)) continue;
        seenEmails.add(ua.email);
        const badges: string[] = [];
        if (ua.espace_premium)   badges.push("Espace premium");
        if (ua.coaching_ia)      badges.push("Coaching IA");
        if (ua.soutien_scolaire) badges.push("Soutien scolaire");
        if (ua.outils_saas)      badges.push("Outils SaaS");
        const hasAccess = ua.espace_premium || ua.coaching_ia || ua.soutien_scolaire || ua.outils_saas;
        merged.push({
          id:        ua.id,
          name:      ua.name || ua.email,
          email:     ua.email,
          source:    ua.source,
          status:    hasAccess ? "actif" : "inactif",
          badges,
          createdAt: ua.created_at,
        });
      }

      setClients(merged);
    } catch (err) {
      console.error("[AdminClients] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === "tous" || c.status === filterStatus;
    return matchSearch && matchFilter;
  });

  // Reset page when filters change
  useEffect(() => setPage(1), [search, filterStatus]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const actifCount  = clients.filter(c => c.status === "actif").length;
  const inactifCount = clients.filter(c => c.status === "inactif").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Clients</h1>
          <p className="mt-1 text-[0.8rem] text-white/35">
            {loading ? "Chargement…" : `${clients.length} client${clients.length !== 1 ? "s" : ""} enregistrés`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            disabled={loading || filtered.length === 0}
            title="Exporter en CSV"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[0.8rem] text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-40"
          >
            <Download size={13} />
            CSV
          </button>
          <button
            onClick={() => fetchClients(true)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[0.8rem] text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#c9a55a] px-4 py-2.5 text-[0.82rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90"
          >
            <UserPlus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: clients.length, color: "rgba(255,255,255,0.5)", icon: Users },
          { label: "Actifs",   value: actifCount,     color: "#4ade80",               icon: Shield },
          { label: "Inactifs", value: inactifCount,   color: "#f87171",               icon: Users },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#18181c] px-4 py-4">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/25 mb-1.5">{s.label}</p>
            {loading ? (
              <div className="h-7 w-12 rounded-lg bg-white/[0.07] animate-pulse" />
            ) : (
              <p className="text-[1.6rem] font-black" style={{ color: s.color }}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        {(["tous", "actif", "inactif"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`rounded-xl px-3.5 py-2 text-[0.8rem] font-semibold transition-all ${
              filterStatus === f
                ? "bg-[rgba(201,165,90,0.13)] text-[#c9a55a] border border-[rgba(201,165,90,0.25)]"
                : "text-white/40 hover:bg-white/[0.05] hover:text-white/65 border border-transparent"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            className="w-full rounded-xl border border-white/[0.07] bg-[#18181c] py-2.5 pl-10 pr-4 text-[0.84rem] text-white placeholder-white/20 outline-none transition-colors focus:border-[rgba(201,165,90,0.35)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#18181c]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-[#c9a55a]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] mb-3">
              <Users size={20} className="text-white/20" />
            </div>
            <p className="text-[0.88rem] font-semibold text-white/30">Aucun client trouvé</p>
            <p className="text-[0.75rem] text-white/20 mt-1">
              {search ? "Essayez un autre terme de recherche." : "Aucun client enregistré pour l'instant."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {["Nom", "Email", "Source", "Accès / Offre", "Statut", "Date", ""].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em] text-white/25">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paginated.map(c => (
                  <tr key={c.id} className="group transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(201,165,90,0.12)] text-[0.65rem] font-black text-[#c9a55a]">
                          {initials(c.name)}
                        </div>
                        <span className="text-[0.84rem] font-semibold text-white/85">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[0.82rem] text-white/45">{c.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block rounded-lg px-2 py-0.5 text-[0.72rem] font-medium ${
                        c.source === "stripe"   ? "text-[#60a5fa] bg-[rgba(96,165,250,0.09)]" :
                        c.source === "manual"   ? "text-[#a78bfa] bg-[rgba(167,139,250,0.09)]" :
                        c.source === "migrated" ? "text-white/35 bg-white/[0.05]" :
                        "text-white/35 bg-white/[0.05]"
                      }`}>{c.source}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.badges.length > 0 ? c.badges.map(b => (
                          <span key={b} className="inline-block rounded-lg bg-white/[0.05] px-2 py-0.5 text-[0.71rem] font-medium text-white/55">{b}</span>
                        )) : (
                          <span className="text-[0.78rem] text-white/20">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${statusStyle(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[0.8rem] text-white/30">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`mailto:${c.email}`}
                          title="Envoyer un email"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] text-white/35 transition-all hover:bg-white/[0.1] hover:text-white/70"
                        >
                          <Mail size={12} />
                        </a>
                        <button
                          title="Plus d'actions"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] text-white/35 transition-all hover:bg-white/[0.1] hover:text-white/70"
                        >
                          <MoreHorizontal size={12} />
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
      <Pagination page={page} total={filtered.length} onChange={setPage} />
      {showCreate && (
        <CreateClientModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchClients(true); }}
        />
      )}
    </div>
  );
}
