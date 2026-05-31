"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Banknote, Plus, Search, Users, Trash2, X, Loader2,
  CheckCircle2, Clock, Download, Calendar, ChevronDown,
  TrendingUp, User, Euro,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";

const ease = [0.16, 1, 0.3, 1] as const;

interface Employe {
  id: string;
  user_id: string;
  nom: string;
  poste?: string;
  salaire_brut: number;
  date_embauche?: string;
  type_contrat: "CDI" | "CDD" | "Freelance" | "Stage" | "Alternance";
  actif: boolean;
  created_at: string;
}

const CONTRATS = ["CDI", "CDD", "Freelance", "Stage", "Alternance"] as const;

function calcNetApprox(brut: number): number {
  return Math.round(brut * 0.78);
}
function calcCharges(brut: number): number {
  return Math.round(brut * 0.42);
}

export default function PaieRHPage() {
  const [employes, setEmployes]   = useState<Employe[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search,  setSearch]      = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [userId, setUserId]       = useState<string | null>(null);
  const { toasts, push, remove }  = useToastStack();

  const [form, setForm] = useState({
    nom: "", poste: "", salaire_brut: "",
    date_embauche: "", type_contrat: "CDI" as typeof CONTRATS[number],
  });

  const load = useCallback(async (uid?: string | null) => {
    const resolvedUid = uid ?? userId;
    if (!resolvedUid) return;
    setLoading(true);
    const { data } = await supabase
      .from("employes")
      .select("*")
      .eq("user_id", resolvedUid)
      .order("created_at", { ascending: false });
    setEmployes((data as Employe[]) ?? []);
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

  async function addEmploye() {
    if (!userId || !form.nom.trim() || !form.salaire_brut) return;
    const brut = parseFloat(form.salaire_brut);
    if (isNaN(brut) || brut <= 0) { push({ type: "error", message: "Salaire invalide" }); return; }
    const { error } = await supabase.from("employes").insert({
      user_id:      userId,
      nom:          form.nom.trim(),
      poste:        form.poste.trim() || null,
      salaire_brut: brut,
      date_embauche: form.date_embauche || null,
      type_contrat: form.type_contrat,
      actif:        true,
    });
    if (error) { push({ type: "error", message: "Erreur lors de l'ajout" }); return; }
    push({ type: "success", message: `${form.nom} ajouté` });
    setForm({ nom: "", poste: "", salaire_brut: "", date_embauche: "", type_contrat: "CDI" });
    setShowForm(false);
    await load();
  }

  async function deleteEmploye(id: string, nom: string) {
    if (!confirm(`Supprimer ${nom} ?`)) return;
    await supabase.from("employes").delete().eq("id", id);
    push({ type: "success", message: "Employé supprimé" });
    await load();
  }

  const filtered = employes.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    (e.poste ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const actifs       = employes.filter(e => e.actif);
  const masseTotal   = actifs.reduce((s, e) => s + e.salaire_brut, 0);
  const chargesTotal = actifs.reduce((s, e) => s + calcCharges(e.salaire_brut), 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const CONTRAT_COLOR: Record<string, string> = {
    CDI: "#10b981", CDD: "#f59e0b", Freelance: "#8b5cf6",
    Stage: "#06b6d4", Alternance: "#f97316",
  };

  return (
    <div className="min-h-full bg-[#f6f7f9]">
      <ToastStack toasts={toasts} onClose={remove} />

      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "rgba(16,185,129,0.1)" }}>
              <Banknote size={18} style={{ color: "#10b981" }} />
            </div>
            <div>
              <h1 className="text-[1rem] font-bold text-gray-900">Paie & RH</h1>
              <p className="text-[0.72rem] text-gray-400">
                {actifs.length} employé{actifs.length !== 1 ? "s" : ""} actif{actifs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "#10b981" }}
          >
            <Plus size={15} /> Ajouter un employé
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Effectif",        value: actifs.length.toString(),  color: "#10b981", Icon: Users       },
            { label: "Masse salariale", value: fmt(masseTotal),           color: "#c9a55a", Icon: Banknote    },
            { label: "Charges patron",  value: fmt(chargesTotal),         color: "#f43f5e", Icon: TrendingUp  },
            { label: "Coût total",      value: fmt(masseTotal + chargesTotal), color: "#8b5cf6", Icon: Euro  },
          ].map(({ label, value, color, Icon }) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ background: `${color}15` }}>
                  <Icon size={12} style={{ color }} />
                </div>
                <p className="text-[0.65rem] font-medium text-gray-400">{label}</p>
              </div>
              <p className="text-lg font-black" style={{ color }}>{value}</p>
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
            placeholder="Rechercher un employé…"
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
              style={{ background: "rgba(16,185,129,0.08)" }}>
              <Users size={24} style={{ color: "#10b981" }} />
            </div>
            <p className="text-sm font-semibold text-gray-500">
              {search ? "Aucun résultat" : "Aucun employé enregistré"}
            </p>
            {!search && (
              <p className="text-xs text-gray-400">Ajoutez votre premier employé pour suivre la paie</p>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filtered.map((e, i) => {
              const net     = calcNetApprox(e.salaire_brut);
              const charges = calcCharges(e.salaire_brut);
              const color   = CONTRAT_COLOR[e.type_contrat] ?? "#6b7280";
              return (
                <motion.div key={e.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-3 p-4">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ background: color }}>
                      {e.nom.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-sm font-semibold text-gray-800">{e.nom}</p>
                        <span className="rounded-full px-2 py-0.5 text-[0.58rem] font-bold"
                          style={{ background: `${color}18`, color }}>
                          {e.type_contrat}
                        </span>
                      </div>
                      {e.poste && (
                        <p className="mt-0.5 text-[0.68rem] text-gray-400">{e.poste}</p>
                      )}
                      {e.date_embauche && (
                        <p className="mt-0.5 flex items-center gap-1 text-[0.65rem] text-gray-300">
                          <Calendar size={9} />
                          Embauché le {new Date(e.date_embauche).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>

                    {/* Salaires */}
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-black text-gray-800">{fmt(e.salaire_brut)}</p>
                      <p className="text-[0.65rem] text-gray-400">brut · net {fmt(net)}</p>
                      <p className="text-[0.62rem] text-red-400">+{fmt(charges)} charges</p>
                    </div>

                    {/* Delete */}
                    <button onClick={() => deleteEmploye(e.id, e.nom)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Mobile salaire */}
                  <div className="border-t border-gray-50 px-4 py-2 sm:hidden">
                    <div className="flex justify-between text-[0.7rem]">
                      <span className="text-gray-400">Brut</span>
                      <span className="font-bold text-gray-700">{fmt(e.salaire_brut)}</span>
                    </div>
                    <div className="flex justify-between text-[0.7rem]">
                      <span className="text-gray-400">Net estimé</span>
                      <span className="font-semibold text-green-600">{fmt(net)}</span>
                    </div>
                    <div className="flex justify-between text-[0.7rem]">
                      <span className="text-gray-400">Charges patron</span>
                      <span className="font-semibold text-red-400">{fmt(charges)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal ajout */}
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
                  style={{ background: "rgba(16,185,129,0.1)" }}>
                  <User size={15} style={{ color: "#10b981" }} />
                </div>
                <h2 className="text-sm font-bold text-gray-900">Ajouter un employé</h2>
              </div>
              <button onClick={() => setShowForm(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {[
                { key: "nom",          label: "Nom complet *",  placeholder: "Jean Martin",  type: "text"   },
                { key: "poste",        label: "Poste",           placeholder: "Développeur",  type: "text"   },
                { key: "salaire_brut", label: "Salaire brut (€) *", placeholder: "2 500",    type: "number" },
                { key: "date_embauche",label: "Date d'embauche", placeholder: "",             type: "date"   },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="mb-1 block text-[0.72rem] font-semibold text-gray-600">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    min={type === "number" ? "0" : undefined}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-green-400 focus:bg-white"
                  />
                </div>
              ))}

              {/* Type de contrat */}
              <div>
                <label className="mb-1 block text-[0.72rem] font-semibold text-gray-600">Type de contrat</label>
                <div className="flex flex-wrap gap-2">
                  {CONTRATS.map(c => (
                    <button key={c}
                      onClick={() => setForm(f => ({ ...f, type_contrat: c }))}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                      style={form.type_contrat === c
                        ? { background: CONTRAT_COLOR[c], color: "white", borderColor: CONTRAT_COLOR[c] }
                        : { background: "transparent", color: "#6b7280", borderColor: "#e5e7eb" }
                      }
                    >{c}</button>
                  ))}
                </div>
              </div>

              {/* Aperçu net */}
              {form.salaire_brut && !isNaN(parseFloat(form.salaire_brut)) && (
                <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2.5">
                  <p className="text-[0.68rem] font-semibold text-green-700">
                    Net estimé ≈ {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(calcNetApprox(parseFloat(form.salaire_brut)))}
                    <span className="ml-2 font-normal text-green-600">
                      · Charges ≈ {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(calcCharges(parseFloat(form.salaire_brut)))}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={addEmploye}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#10b981" }}>
                <CheckCircle2 size={14} /> Ajouter
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
