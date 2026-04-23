"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Edit2,
  ChevronRight,
  Download,
  Eye,
  Send,
  Receipt,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { downloadContractPDF, openContractPDF } from "@/lib/contract-pdf";

/* ═══════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════ */
type ContractType = "prestation" | "nda" | "cdi" | "cdd" | "autre";
type ContractStatus = "brouillon" | "envoyé" | "signé" | "expiré";

interface Contract {
  id: string;
  user_id: string;
  title: string;
  client_name: string;
  contract_type: ContractType;   // colonne Supabase : contract_type
  content: string;
  status: ContractStatus;
  amount: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

type DraftForm = {
  title: string;
  client_name: string;
  type: ContractType;
  amount: string;
  start_date: string;
  end_date: string;
  specifics: string;
};

/* ═══════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

const CONTRACT_TYPES: Record<ContractType, string> = {
  prestation: "Prestation de services",
  nda: "NDA / Confidentialité",
  cdi: "CDI",
  cdd: "CDD",
  autre: "Autre",
};

const STATUS_STYLES: Record<
  ContractStatus,
  { label: string; text: string; bg: string; border: string }
> = {
  brouillon: {
    label: "Brouillon",
    text: "text-white/40",
    bg: "bg-white/[0.05]",
    border: "border-white/10",
  },
  envoyé: {
    label: "Envoyé",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  signé: {
    label: "Signé",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  expiré: {
    label: "Expiré",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

const STATUS_FLOW: ContractStatus[] = ["brouillon", "envoyé", "signé"];

const EMPTY_FORM = (): DraftForm => ({
  title: "",
  client_name: "",
  type: "prestation",
  amount: "",
  start_date: "",
  end_date: "",
  specifics: "",
});

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
type ToastType = "success" | "error" | "info";
interface ToastMsg {
  id: number;
  type: ToastType;
  text: string;
}

function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.35, ease }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl backdrop-blur-sm
              ${t.type === "success" ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300" : ""}
              ${t.type === "error" ? "bg-red-500/15 border-red-500/25 text-red-300" : ""}
              ${t.type === "info" ? "bg-white/10 border-white/15 text-white/80" : ""}
            `}
          >
            <span>{t.text}</span>
            <button
              onClick={() => remove(t.id)}
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);
  const add = useCallback((text: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, add, remove };
}

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

/* ═══════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════ */
export default function ContratsPage() {
  const { toasts, add: toast, remove: removeToast } = useToast();

  /* ── data ── */
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  /* ── selection ── */
  const [selected, setSelected] = useState<Contract | null>(null);
  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── modal ── */
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM());
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);

  /* ── mobile panel ── */
  const [mobilePanel, setMobilePanel] = useState(false);

  /* ── prestataire info (depuis auth.users) ── */
  const [userEmail, setUserEmail]     = useState<string | undefined>();
  const [userFullName, setUserFullName] = useState<string | undefined>();

  /* ────────────────── fetch ────────────────── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email ?? undefined);
      /* user_metadata peut contenir full_name selon le provider */
      const meta = user.user_metadata as Record<string, string> | undefined;
      setUserFullName(meta?.full_name ?? meta?.name ?? undefined);

      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setContracts(data as Contract[]);
      setLoading(false);
    })();
  }, []);

  /* ────────────────── select contract ────────────────── */
  const selectContract = useCallback((c: Contract) => {
    setSelected(c);
    setEditContent(c.content ?? "");
    setMobilePanel(true);
  }, []);

  /* ────────────────── auto-save (2s debounce) ────────────────── */
  const handleContentChange = useCallback(
    (value: string) => {
      setEditContent(value);
      if (!selected) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        const { error } = await supabase
          .from("contracts")
          .update({ content: value })
          .eq("id", selected.id);
        setSaving(false);
        if (!error) {
          setContracts((prev) =>
            prev.map((c) => (c.id === selected.id ? { ...c, content: value } : c))
          );
          setSelected((prev) => (prev ? { ...prev, content: value } : prev));
        }
      }, 2000);
    },
    [selected]
  );

  /* ────────────────── status toggle ────────────────── */
  const handleStatusChange = useCallback(
    async (newStatus: ContractStatus) => {
      if (!selected) return;
      const { error } = await supabase
        .from("contracts")
        .update({ status: newStatus })
        .eq("id", selected.id);
      if (!error) {
        setContracts((prev) =>
          prev.map((c) => (c.id === selected.id ? { ...c, status: newStatus } : c))
        );
        setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
        toast(`Statut mis à jour : ${STATUS_STYLES[newStatus].label}`, "success");
      }
    },
    [selected, toast]
  );

  /* ────────────────── copy ────────────────── */
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(editContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Copié dans le presse-papiers", "success");
  }, [editContent, toast]);

  /* ────────────────── PDF ────────────────── */
  const getPDFData = useCallback(() => {
    if (!selected) return null;
    return {
      /* Contrat */
      title:       selected.title,
      client_name: selected.client_name,
      type:        selected.contract_type,
      content:     editContent,
      amount:      selected.amount,
      start_date:  selected.start_date,
      end_date:    selected.end_date,
      created_at:  selected.created_at,
      /* Prestataire — depuis le profil auth */
      prestataire_nom:   userFullName,
      prestataire_email: userEmail,
    };
  }, [selected, editContent, userEmail, userFullName]);

  const handleDownloadPDF = useCallback(() => {
    const data = getPDFData();
    if (!data) return;
    if (!data.content.trim()) {
      toast("Le contrat est vide — ajoutez du contenu avant de générer le PDF", "error");
      return;
    }
    try {
      downloadContractPDF(data);
      toast("PDF téléchargé ✓", "success");
    } catch (e) {
      console.error("[pdf] download error", e);
      toast("Erreur lors de la génération du PDF", "error");
    }
  }, [getPDFData, toast]);

  const handleViewPDF = useCallback(() => {
    const data = getPDFData();
    if (!data) return;
    if (!data.content.trim()) {
      toast("Le contrat est vide — ajoutez du contenu avant de prévisualiser", "error");
      return;
    }
    try {
      openContractPDF(data);
    } catch (e) {
      console.error("[pdf] view error", e);
      toast("Erreur lors de l'ouverture du PDF", "error");
    }
  }, [getPDFData, toast]);

  const handleSendToClient = useCallback(() => {
    if (!selected) return;
    const subject = encodeURIComponent(`Contrat : ${selected.title}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver ci-joint le contrat « ${selected.title} ».\n\nN'hésitez pas à me contacter pour toute question.\n\nCordialement`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    toast("Téléchargez le PDF puis joignez-le à votre email ✓", "info");
  }, [selected, toast]);

  const handleToFacture = useCallback(() => {
    if (!selected) return;
    const params = new URLSearchParams({
      from:       "contrat",
      title:      selected.title,
      client:     selected.client_name,
      ...(selected.amount != null ? { amount: String(selected.amount) } : {}),
    });
    window.location.href = `/client/factures?${params.toString()}`;
  }, [selected]);

  /* ────────────────── delete ────────────────── */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Supprimer ce contrat ?")) return;
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (!error) {
        setContracts((prev) => prev.filter((c) => c.id !== id));
        if (selected?.id === id) {
          setSelected(null);
          setMobilePanel(false);
        }
        toast("Contrat supprimé", "info");
      }
    },
    [selected, toast]
  );

  /* ────────────────── create contract (brouillon vide) ────────────────── */
  const handleCreateContract = useCallback(
    async (generatedContent = "") => {
      if (!form.title || !form.client_name) {
        toast("Titre et nom du client requis", "error");
        return;
      }
      if (!userId) return;
      setCreating(true);
      try {
        const payload = {
          user_id:       userId,
          title:         form.title,
          client_name:   form.client_name,
          contract_type: form.type,          // ✅ nom exact de la colonne Supabase
          content:       generatedContent,
          status:        "brouillon",         // pas de CHECK constraint → OK
          amount:        form.amount ? parseFloat(form.amount) : null,
          start_date:    form.start_date || null,
          end_date:      form.end_date || null,
        };
        console.log("[contrats] payload →", JSON.stringify(payload, null, 2));
        const { data, error } = await supabase
          .from("contracts")
          .insert(payload)
          .select()
          .single();
        if (error) {
          console.error("[contrats] Supabase error →", error);
          throw new Error(error.message ?? "Erreur lors de la création");
        }
        const newC = data as Contract;
        setContracts((prev) => [newC, ...prev]);
        setShowModal(false);
        setForm(EMPTY_FORM());
        selectContract(newC);
        /* ✅ Un seul toast succès — jamais en même temps qu'une erreur */
        toast(
          generatedContent
            ? "Contrat généré — ouvert en édition ✓"
            : "Brouillon créé — ouvert en édition ✓",
          "success"
        );
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : "Erreur lors de la création", "error");
      } finally {
        setCreating(false);
      }
    },
    [form, userId, toast, selectContract]
  );

  /* ────────────────── AI generation ────────────────── */
  const handleGenerate = useCallback(async () => {
    if (!form.title || !form.client_name) {
      toast("Titre et nom du client requis", "error");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/contrats/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:            form.type,
          client_name:     form.client_name,
          title:           form.title,
          amount:          form.amount ? parseFloat(form.amount) : undefined,
          start_date:      form.start_date || undefined,
          end_date:        form.end_date || undefined,
          specifics:       form.specifics || undefined,
          prestataire_nom: userFullName,   // passé au LLM si disponible
        }),
      });
      const json = await res.json() as { content?: string; error?: string };
      /* ⚠️ Pas de toast ici — handleCreateContract gère succès ET erreur */
      if (!res.ok || json.error) throw new Error(json.error ?? "Erreur de génération");
      await handleCreateContract(json.content ?? "");
    } catch (err: unknown) {
      /* ❌ Erreur uniquement dans le catch — jamais les deux en même temps */
      toast(err instanceof Error ? err.message : "Erreur de génération", "error");
    } finally {
      setGenerating(false);
    }
  }, [form, toast, handleCreateContract]);

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  const gold = "#c9a55a";

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <Toast toasts={toasts} remove={removeToast} />

      {/* ── Header ── */}
      <div className="border-b border-white/[0.06] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={20} style={{ color: gold }} />
          <h1 className="text-lg font-semibold tracking-tight">Contrats</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: gold + "20", color: gold, border: `1px solid ${gold}35` }}
        >
          <Plus size={15} />
          Nouveau contrat
        </motion.button>
      </div>

      {/* ── Body: split layout ── */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* ── Left: list ── */}
        <div
          className={`flex flex-col border-r border-white/[0.06] overflow-y-auto
            ${selected ? "hidden md:flex md:w-[340px] lg:w-[380px]" : "flex w-full md:w-[340px] lg:w-[380px]"}
          `}
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw size={20} className="animate-spin text-white/30" />
            </div>
          ) : contracts.length === 0 ? (
            <EmptyState onNew={() => setShowModal(true)} gold={gold} />
          ) : (
            <div className="p-4 flex flex-col gap-2">
              {contracts.map((c) => (
                <ContractCard
                  key={c.id}
                  contract={c}
                  isSelected={selected?.id === c.id}
                  onSelect={() => selectContract(c)}
                  onDelete={handleDelete}
                  gold={gold}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: detail panel ── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.4, ease }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* panel header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.06] gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => { setSelected(null); setMobilePanel(false); }}
                      className="md:hidden text-white/40 hover:text-white/70 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border font-medium"
                      style={{ color: gold, borderColor: gold + "40", backgroundColor: gold + "15" }}
                    >
                      {CONTRACT_TYPES[selected.contract_type]}
                    </span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <h2 className="text-base font-semibold truncate">{selected.title}</h2>
                  <p className="text-sm text-white/40 mt-0.5">
                    {selected.client_name}
                    {selected.amount != null && <> · {fmtEur(selected.amount)}</>}
                    {selected.start_date && <> · {fmtDate(selected.start_date)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {saving && <RefreshCw size={14} className="animate-spin text-white/30" />}
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
                    title="Copier"
                  >
                    {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} className="text-white/50" />}
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={15} className="text-white/50 hover:text-red-400" />
                  </button>
                </div>
              </div>

              {/* status toggle */}
              <div className="flex items-center gap-2 px-6 py-3 border-b border-white/[0.06]">
                <span className="text-xs text-white/30 mr-1">Statut :</span>
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all
                      ${selected.status === s
                        ? `${STATUS_STYLES[s].text} ${STATUS_STYLES[s].bg} ${STATUS_STYLES[s].border} font-medium`
                        : "text-white/25 bg-transparent border-white/10 hover:border-white/20 hover:text-white/50"
                      }`}
                  >
                    {STATUS_STYLES[s].label}
                  </button>
                ))}
              </div>

              {/* ── PDF Actions bar ── */}
              <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/[0.06] bg-white/[0.015] flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/20 mr-1">PDF</span>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleViewPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.07] hover:text-white/90 transition-all"
                >
                  <Eye size={12} />
                  Aperçu
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: gold + "18",
                    color: gold,
                    border: `1px solid ${gold}35`,
                  }}
                >
                  <Download size={12} />
                  Télécharger
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSendToClient}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.07] hover:text-white/90 transition-all"
                >
                  <Send size={12} />
                  Envoyer
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleToFacture}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white/80 transition-all ml-auto"
                >
                  <Receipt size={12} />
                  → Facture
                </motion.button>
              </div>

              {/* textarea */}
              <div className="flex-1 overflow-auto p-6">
                <textarea
                  value={editContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full h-full min-h-[400px] bg-white/[0.03] border border-white/[0.06] rounded-xl p-5
                    font-mono text-sm text-white/80 leading-relaxed resize-none focus:outline-none
                    focus:border-white/15 focus:bg-white/[0.04] transition-colors placeholder:text-white/20"
                  placeholder="Le contenu du contrat apparaît ici. Utilisez le bouton « Générer avec l'IA » pour rédiger automatiquement."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* empty right when list exists but nothing selected */}
        {!selected && contracts.length > 0 && (
          <div className="hidden md:flex flex-1 items-center justify-center text-white/20 text-sm gap-2">
            <Edit2 size={16} />
            Sélectionnez un contrat
          </div>
        )}
      </div>

      {/* ── Modal: nouveau contrat ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.4, ease }}
              className="w-full max-w-lg bg-[#0e1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h3 className="font-semibold text-base">Nouveau contrat</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                {/* title + client */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-white/40 mb-1.5">Intitulé *</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Mission développement web"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-white/40 mb-1.5">Nom du client *</label>
                    <input
                      value={form.client_name}
                      onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))}
                      placeholder="Entreprise ou particulier"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>

                {/* type */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Type de contrat</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(CONTRACT_TYPES) as [ContractType, string][]).map(([k, v]) => (
                      <button
                        key={k}
                        onClick={() => setForm((p) => ({ ...p, type: k }))}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                          ${form.type === k
                            ? "border-transparent font-medium"
                            : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                          }`}
                        style={
                          form.type === k
                            ? { backgroundColor: gold + "20", color: gold, borderColor: gold + "40" }
                            : {}
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* amount + dates */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Montant (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="1500"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Début</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Fin</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>

                {/* specifics */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Précisions pour l'IA (optionnel)
                  </label>
                  <textarea
                    value={form.specifics}
                    onChange={(e) => setForm((p) => ({ ...p, specifics: e.target.value }))}
                    placeholder="Clauses spécifiques, livrables, conditions particulières…"
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors resize-none"
                  />
                </div>

                {/* actions */}
                <div className="flex gap-3 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGenerate}
                    disabled={generating || creating}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(135deg, ${gold}20, ${gold}10)`,
                      color: gold,
                      border: `1px solid ${gold}40`,
                    }}
                  >
                    {generating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles size={16} />
                        </motion.div>
                        Rédaction en cours…
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        Générer avec l'IA
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCreateContract()}
                    disabled={generating || creating}
                    className="px-5 py-3 rounded-xl text-sm font-medium bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition-all disabled:opacity-50"
                  >
                    {creating ? <RefreshCw size={14} className="animate-spin" /> : "Créer vide"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════ */
function StatusBadge({ status }: { status: ContractStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.text} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  );
}

function ContractCard({
  contract,
  isSelected,
  onSelect,
  onDelete,
  gold,
}: {
  contract: Contract;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
  gold: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      className={`group relative flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-all
        ${isSelected
          ? "border-white/15 bg-white/[0.06]"
          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
        }`}
    >
      {isSelected && (
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
          style={{ backgroundColor: gold }}
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{contract.title}</p>
          <p className="text-xs text-white/40 mt-0.5 truncate">{contract.client_name}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={contract.status} />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(contract.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 text-white/30 transition-all"
          >
            <Trash2 size={13} />
          </button>
          <ChevronRight size={14} className="text-white/20" />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded-full border font-medium"
          style={{ color: gold + "cc", borderColor: gold + "30", backgroundColor: gold + "0d" }}
        >
          {CONTRACT_TYPES[contract.contract_type]}
        </span>
        {contract.amount != null && (
          <span className="text-xs text-white/35">
            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(contract.amount)}
          </span>
        )}
        <span className="text-xs text-white/25 ml-auto">
          {new Date(contract.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </motion.div>
  );
}

function EmptyState({ onNew, gold }: { onNew: () => void; gold: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: gold + "15", border: `1px solid ${gold}25` }}
      >
        <FileText size={28} style={{ color: gold }} />
      </div>
      <div>
        <p className="text-base font-medium text-white/70">Aucun contrat</p>
        <p className="text-sm text-white/30 mt-1">
          Créez votre premier contrat et laissez l'IA le rédiger pour vous.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNew}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{ backgroundColor: gold + "20", color: gold, border: `1px solid ${gold}35` }}
      >
        <Plus size={15} />
        Nouveau contrat
      </motion.button>
    </div>
  );
}
