"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, CheckCircle2, XCircle, Mail, RotateCcw,
  CreditCard, Landmark, Users, Clock, AlertCircle,
  Loader2, BanknoteIcon,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   /admin/coaching-ia
   Tableau de bord admin — gestion des accès Coaching IA DJAMA
─────────────────────────────────────────────────────────────── */

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_PASS ?? "";

interface Client {
  email:                        string;
  full_name:                    string | null;
  coaching_ia_active:           boolean;
  coaching_ia_expires:          string | null;
  coaching_ia_payment_method:   string | null;
  coaching_ia_pending_transfer: boolean;
  updated_at:                   string;
}

type ActionStatus = "idle" | "loading" | "success" | "error";

function paymentIcon(method: string | null) {
  if (method === "stripe")   return <CreditCard size={12} className="text-[#a78bfa]" />;
  if (method === "paypal")   return <span className="text-[0.55rem] font-black text-[#FFD140]">PP</span>;
  if (method === "virement") return <Landmark size={12} className="text-[#60a5fa]" />;
  return <BanknoteIcon size={12} className="text-white/30" />;
}

function paymentLabel(method: string | null) {
  if (method === "stripe")   return "Stripe";
  if (method === "paypal")   return "PayPal";
  if (method === "virement") return "Virement";
  return "—";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function isExpired(expires: string | null) {
  if (!expires) return false;
  return new Date(expires) < new Date();
}

export default function AdminCoachingIA() {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<"all" | "active" | "pending">("all");
  const [actions,  setActions]  = useState<Record<string, ActionStatus>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  /* ── Fetch clients ─────────────────────────────────────── */
  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("email", search.trim());
    params.set("status", filter);

    const res = await fetch(`/api/admin/coaching-ia?${params}`, {
      headers: { "x-admin-token": ADMIN_TOKEN },
    });
    const data = await res.json() as { clients?: Client[] };
    setClients(data.clients ?? []);
    setLoading(false);
  }, [search, filter]);

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  /* ── Action ────────────────────────────────────────────── */
  async function doAction(
    email: string,
    action: "activate" | "deactivate" | "resend_email" | "confirm_transfer"
  ) {
    setActions((p) => ({ ...p, [email + action]: "loading" }));
    setMessages((p) => ({ ...p, [email]: "" }));

    const res = await fetch("/api/admin/coaching-ia", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": ADMIN_TOKEN },
      body:    JSON.stringify({ action, email }),
    });
    const data = await res.json() as { success?: boolean; message?: string; error?: string };

    setActions((p) => ({ ...p, [email + action]: res.ok ? "success" : "error" }));
    setMessages((p) => ({ ...p, [email]: data.message ?? data.error ?? "" }));

    if (res.ok) setTimeout(fetchClients, 800);
  }

  /* ── Stats ─────────────────────────────────────────────── */
  const total    = clients.length;
  const active   = clients.filter((c) => c.coaching_ia_active && !isExpired(c.coaching_ia_expires)).length;
  const pending  = clients.filter((c) => c.coaching_ia_pending_transfer && !c.coaching_ia_active).length;
  const expired  = clients.filter((c) => c.coaching_ia_active && isExpired(c.coaching_ia_expires)).length;

  return (
    <div className="min-h-screen bg-[#07080e] px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.08)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#a78bfa]">
              Admin DJAMA
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Gestion Coaching IA</h1>
          <p className="mt-1 text-sm text-white/35">
            Gérer les accès, confirmer les virements et renvoyer les emails.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total",    value: total,   icon: Users,        color: "#a78bfa" },
            { label: "Actifs",   value: active,  icon: CheckCircle2, color: "#34d399" },
            { label: "En attente virement", value: pending, icon: Clock, color: "#f9a826" },
            { label: "Expirés",  value: expired, icon: AlertCircle,  color: "#ef4444" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon size={14} style={{ color }} />
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
                  {label}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Filtres + Recherche */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(["all", "active", "pending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === f
                    ? "border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)] text-[#a78bfa]"
                    : "border border-white/[0.08] text-white/40 hover:text-white/70"
                }`}
              >
                {f === "all" ? "Tous" : f === "active" ? "Actifs" : "En attente"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
            <Search size={14} className="text-white/30" />
            <input
              type="text"
              placeholder="Rechercher par email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 bg-transparent text-sm text-white placeholder-white/25 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
          {/* En-têtes */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-white/[0.07] bg-white/[0.03] px-5 py-3 text-[0.6rem] font-bold uppercase tracking-widest text-white/25">
            <span>Client</span>
            <span className="text-right">Méthode</span>
            <span className="text-right">Expire</span>
            <span className="text-right">Statut</span>
            <span className="text-right">Actions</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[#a78bfa]" />
            </div>
          ) : clients.length === 0 ? (
            <div className="py-12 text-center text-sm text-white/30">
              Aucun client trouvé
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {clients.map((client) => {
                const expired_access = isExpired(client.coaching_ia_expires);
                const isPending      = client.coaching_ia_pending_transfer && !client.coaching_ia_active;

                return (
                  <div
                    key={client.email}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02]"
                  >
                    {/* Client info */}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white/80">
                        {client.full_name ?? "—"}
                      </p>
                      <p className="truncate text-xs text-white/35">{client.email}</p>
                      {messages[client.email] && (
                        <p className="mt-1 text-[0.65rem] text-[#a78bfa]">
                          {messages[client.email]}
                        </p>
                      )}
                    </div>

                    {/* Méthode paiement */}
                    <div className="flex items-center gap-1.5">
                      {paymentIcon(client.coaching_ia_payment_method)}
                      <span className="text-xs text-white/35">
                        {paymentLabel(client.coaching_ia_payment_method)}
                      </span>
                    </div>

                    {/* Expiration */}
                    <span className={`text-right text-xs ${
                      expired_access ? "text-red-400" : "text-white/35"
                    }`}>
                      {formatDate(client.coaching_ia_expires)}
                    </span>

                    {/* Statut badge */}
                    <div className="flex justify-end">
                      {isPending ? (
                        <span className="rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.1)] px-2 py-0.5 text-[0.6rem] font-bold text-[#f9a826]">
                          ⏳ Virement
                        </span>
                      ) : client.coaching_ia_active && !expired_access ? (
                        <span className="rounded-full border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)] px-2 py-0.5 text-[0.6rem] font-bold text-[#34d399]">
                          ✓ Actif
                        </span>
                      ) : expired_access ? (
                        <span className="rounded-full border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-2 py-0.5 text-[0.6rem] font-bold text-red-400">
                          Expiré
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/[0.1] px-2 py-0.5 text-[0.6rem] font-bold text-white/25">
                          Inactif
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <ActionButton
                          onClick={() => doAction(client.email, "confirm_transfer")}
                          status={actions[client.email + "confirm_transfer"] ?? "idle"}
                          title="Confirmer le virement"
                          color="#f9a826"
                        >
                          <CheckCircle2 size={13} />
                        </ActionButton>
                      )}

                      {!client.coaching_ia_active && !isPending && (
                        <ActionButton
                          onClick={() => doAction(client.email, "activate")}
                          status={actions[client.email + "activate"] ?? "idle"}
                          title="Activer l'accès"
                          color="#34d399"
                        >
                          <CheckCircle2 size={13} />
                        </ActionButton>
                      )}

                      {client.coaching_ia_active && (
                        <ActionButton
                          onClick={() => doAction(client.email, "deactivate")}
                          status={actions[client.email + "deactivate"] ?? "idle"}
                          title="Désactiver l'accès"
                          color="#ef4444"
                        >
                          <XCircle size={13} />
                        </ActionButton>
                      )}

                      <ActionButton
                        onClick={() => doAction(client.email, "resend_email")}
                        status={actions[client.email + "resend_email"] ?? "idle"}
                        title="Renvoyer l'email d'accès"
                        color="#a78bfa"
                      >
                        <Mail size={13} />
                      </ActionButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bouton rafraîchir */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchClients}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-xs text-white/40 transition hover:border-white/[0.15] hover:text-white/70 disabled:opacity-50"
          >
            <RotateCcw size={12} className={loading ? "animate-spin" : ""} />
            Rafraîchir
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Composant bouton d'action ─────────────────────────────── */
function ActionButton({
  onClick, status, title, color, children,
}: {
  onClick:  () => void;
  status:   ActionStatus;
  title:    string;
  color:    string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={status === "loading"}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] transition hover:bg-white/[0.07] disabled:opacity-50"
      style={{ color: status === "success" ? "#34d399" : status === "error" ? "#ef4444" : color }}
    >
      {status === "loading"
        ? <Loader2 size={13} className="animate-spin" />
        : children
      }
    </button>
  );
}
