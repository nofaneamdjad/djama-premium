"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2, Plus, Search, Mail, Phone, FileText,
  CheckCircle2, Clock, Eye, Send, Trash2, X, Loader2,
  ExternalLink, User, Calendar, ChevronRight, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

interface PortailClient {
  id: string;
  user_id: string;
  nom: string;
  email: string;
  phone?: string;
  entreprise?: string;
  acces_actif: boolean;
  derniere_connexion?: string;
  created_at: string;
}

export default function PortailClientPage() {
  const [clients, setClients]     = useState<PortailClient[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search,  setSearch]      = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [userId, setUserId]       = useState<string | null>(null);
  const { toasts, add, remove }   = useToastStack();

  const [form, setForm] = useState({
    nom: "", email: "", phone: "", entreprise: "",
  });

  const load = useCallback(async (uid?: string | null) => {
    const resolvedUid = uid ?? userId;
    if (!resolvedUid) return;
    setLoading(true);
    const { data } = await supabase
      .from("portail_clients")
      .select("*")
      .eq("user_id", resolvedUid)
      .order("created_at", { ascending: false });
    setClients((data as PortailClient[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await load(user.id);
    })();
  }, []);

  async function invite() {
    if (!userId || !form.nom.trim() || !form.email.trim()) return;
    const { error } = await supabase.from("portail_clients").insert({
      user_id:    userId,
      nom:        form.nom.trim(),
      email:      form.email.trim(),
      phone:      form.phone.trim() || null,
      entreprise: form.entreprise.trim() || null,
      acces_actif: true,
    });
    if (error) { add("Erreur lors de l'invitation", "error"); return; }
    add(`${form.nom} invité avec succès`, "success");
    setForm({ nom: "", email: "", phone: "", entreprise: "" });
    setShowForm(false);
    await load();
  }

  async function toggleAccess(id: string, current: boolean) {
    await supabase.from("portail_clients").update({ acces_actif: !current }).eq("id", id);
    add(current ? "Accès désactivé" : "Accès activé", "success");
    await load();
  }

  async function deleteClient(id: string, nom: string) {
    if (!confirm(`Supprimer ${nom} du portail ?`)) return;
    await supabase.from("portail_clients").delete().eq("id", id);
    add("Client supprimé", "success");
    await load();
  }

  const filtered = clients.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.entreprise ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const actifs   = clients.filter(c => c.acces_actif).length;
  const inactifs = clients.filter(c => !c.acces_actif).length;

  return (
    <div className="min-h-full bg-[#f6f7f9]">
      <ToastStack toasts={toasts} remove={remove} />

      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "rgba(59,130,246,0.1)" }}>
              <Building2 size={18} style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <h1 className="text-[1rem] font-bold text-gray-900">Portail Client</h1>
              <p className="text-[0.72rem] text-gray-400">
                {clients.length} client{clients.length !== 1 ? "s" : ""} · {actifs} actif{actifs !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "#3b82f6" }}
          >
            <Plus size={15} /> Inviter un client
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Total",    value: clients.length, color: "#3b82f6" },
            { label: "Actifs",   value: actifs,         color: "#10b981" },
            { label: "Inactifs", value: inactifs,       color: "#f43f5e" },
          ].map(s => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            >
              <p className="text-[0.68rem] font-medium text-gray-400">{s.label}</p>
              <p className="mt-1 text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "rgba(59,130,246,0.08)" }}>
              <Building2 size={24} style={{ color: "#3b82f6" }} />
            </div>
            <p className="text-sm font-semibold text-gray-500">
              {search ? "Aucun résultat" : "Aucun client dans le portail"}
            </p>
            {!search && (
              <p className="text-xs text-gray-400">Invitez votre premier client pour commencer</p>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: c.acces_actif ? "#3b82f6" : "#94a3b8" }}>
                  {c.nom.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-800">{c.nom}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold ${
                      c.acces_actif ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      {c.acces_actif ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="flex items-center gap-1 text-[0.68rem] text-gray-400">
                      <Mail size={10} /> {c.email}
                    </span>
                    {c.entreprise && (
                      <span className="flex items-center gap-1 text-[0.68rem] text-gray-400">
                        <Building2 size={10} /> {c.entreprise}
                      </span>
                    )}
                    {c.phone && (
                      <span className="flex items-center gap-1 text-[0.68rem] text-gray-400">
                        <Phone size={10} /> {c.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleAccess(c.id, c.acces_actif)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-gray-100"
                    title={c.acces_actif ? "Désactiver l'accès" : "Activer l'accès"}
                  >
                    {c.acces_actif
                      ? <CheckCircle2 size={15} className="text-green-500" />
                      : <Clock size={15} className="text-gray-300" />
                    }
                  </button>
                  <button
                    onClick={() => deleteClient(c.id, c.nom)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal invitation */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "rgba(59,130,246,0.1)" }}>
                  <User size={15} style={{ color: "#3b82f6" }} />
                </div>
                <h2 className="text-sm font-bold text-gray-900">Inviter un client</h2>
              </div>
              <button onClick={() => setShowForm(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3 p-5">
              {[
                { key: "nom",        label: "Nom complet *",   placeholder: "Marie Dupont",       type: "text"  },
                { key: "email",      label: "Email *",          placeholder: "marie@example.com",  type: "email" },
                { key: "phone",      label: "Téléphone",        placeholder: "+33 6 00 00 00 00",  type: "tel"   },
                { key: "entreprise", label: "Entreprise",       placeholder: "Nom de la société",  type: "text"  },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="mb-1 block text-[0.72rem] font-semibold text-gray-600">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:bg-white"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={invite}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#3b82f6" }}>
                <Send size={13} /> Inviter
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
