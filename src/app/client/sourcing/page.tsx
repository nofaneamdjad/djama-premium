"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence }                            from "framer-motion";
import {
  Search, Send, RefreshCw, X, Download, ChevronRight,
  Building2, ListChecks, Lightbulb, FileText,
  CheckCircle2, Factory, Sparkles, Package, AlertCircle,
  Brain, Star, ShieldCheck, TrendingUp,
  History, Table2, Handshake, PlusCircle, Trash2,
  Check, Users, ChevronDown, Loader2,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { GuideMessage, GuideSection, GuideItem } from "@/lib/sourcing/generateGuide";
import { useTheme } from "@/lib/theme-context";
import { APP_ICONS } from "@/components/AppIcons";

interface SourcingItem extends GuideItem {
  name?:        string;
  country?:     string;
  type?:        string;
  description?: string;
  tip?:         string;
}

interface SourcingSection extends GuideSection {
  type:  "supplier_list" | "steps" | "checklist" | "tips" | "text";
  title: string;
  items: SourcingItem[];
}

interface SourcingAction {
  label:   string;
  icon?:   string;
  type:    "generate_pdf" | "link";
  href?:   string;
  variant: "primary" | "secondary" | "warning" | "ghost";
}

interface SourcingApiResponse {
  text?:        string;
  reasoning?:   string;
  sections?:    SourcingSection[];
  actions?:     SourcingAction[];
  suggestions?: string[];
  error?:       string;
}

interface ChatMsg {
  id:           string;
  role:         "user" | "assistant";
  content:      string;
  reasoning?:   string;
  sections?:    SourcingSection[];
  actions?:     SourcingAction[];
  suggestions?: string[];
  loading?:     boolean;
  isError?:     boolean;
  retryText?:   string;
}

interface HistorySession {
  id:       string;
  title:    string;
  date:     string;
  messages: ChatMsg[];
}

type NegStatus = "En cours" | "Offre reçue" | "Accepté" | "Refusé";

interface Negotiation {
  id:        string;
  supplier:  string;
  status:    NegStatus;
  notes:     string;
  amount?:   string;
  createdAt: string;
  updatedAt: string;
}


const NEG_STATUS_STYLE: Record<NegStatus, string> = {
  "En cours":    "bg-blue-500/12 border-blue-500/25 text-blue-400",
  "Offre reçue": "bg-amber-500/12 border-amber-500/25 text-amber-400",
  "Accepté":     "bg-emerald-500/12 border-emerald-500/25 text-emerald-400",
  "Refusé":      "bg-red-500/12 border-red-500/25 text-red-400",
};

const ease = [0.16, 1, 0.3, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes = parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-bold text-white/90">{p.slice(2, -2)}</strong>;
    }
    return p.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < p.split("\n").length - 1 && <br />}
      </span>
    ));
  });
  return <span className={className}>{nodes}</span>;
}

const QUICKSTART = [
  {
    icon: Factory,
    color: "#60a5fa",
    bg:    "rgba(59,130,246,0.08)",
    border:"rgba(59,130,246,0.18)",
    label: "Trouver des fournisseurs",
    desc:  "Assistant IA — sourcing mondial en 6 étapes",
    question: "",
    href: "/client/sourcing/fournisseurs",
  },
  {
    icon: FileText,
    color: "#4ade80",
    bg:    "rgba(74,222,128,0.08)",
    border:"rgba(74,222,128,0.18)",
    label: "Répondre à un appel d'offre",
    desc:  "Assistant IA — dossier complet en 6 étapes",
    question: "",
    href: "/client/sourcing/appel-offre",
  },
  {
    icon: Package,
    color: "#c9a55a",
    bg:    "rgba(201,165,90,0.08)",
    border:"rgba(201,165,90,0.18)",
    label: "Négocier avec un fournisseur",
    desc:  "Arguments, tactiques, conditions",
    question: "Comment négocier les meilleures conditions avec un fournisseur ? Donne-moi une stratégie complète : préparation, BATNA, tactiques de négociation, arguments concrets, clauses contractuelles clés et conditions de paiement à obtenir.",
  },
  {
    icon: Building2,
    color: "#a78bfa",
    bg:    "rgba(167,139,250,0.08)",
    border:"rgba(167,139,250,0.18)",
    label: "Marchés publics & privés",
    desc:  "Plateformes, seuils, procédures, stratégie",
    question: "Comment accéder aux marchés publics et privés ? Quelles plateformes utiliser selon le pays, quels seuils s'appliquent, comment préparer un dossier gagnant et quelle stratégie adopter pour remporter des contrats ?",
  },
];

const ACTION_STYLE: Record<string, string> = {
  primary:   "bg-blue-500/12 border-blue-500/25 text-blue-400 hover:bg-blue-500/22",
  warning:   "bg-amber-500/12 border-amber-500/25 text-amber-400 hover:bg-amber-500/22",
  secondary: "bg-white/6 border-white/8 text-white/50 hover:bg-white/8 hover:text-white/70",
  ghost:     "border-transparent text-white/30 hover:text-white/55",
};

function ReasoningBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 overflow-hidden rounded-2xl border border-violet-500/18 bg-violet-500/[0.05]"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-violet-500/[0.04]"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
          <Brain size={13} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-medium text-violet-400/80">
            Analyse stratégique
          </p>
        </div>
        <ChevronRight
          size={13}
          className={`text-violet-400/50 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
          >
            <div className="border-t border-violet-500/10 px-4 py-3">
              <RichText
                text={text}
                className="text-[13px] text-violet-200/70 leading-relaxed"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SupplierCard({ item }: { item: SourcingItem }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-[13px] font-bold text-white/92">{item.name}</p>
        <div className="flex gap-1.5 flex-wrap">
          {item.country && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
              {item.country}
            </span>
          )}
          {item.type && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 border border-white/8 text-white/40 font-semibold">
              {item.type}
            </span>
          )}
        </div>
      </div>
      {item.description && (
        <RichText text={item.description} className="text-[12px] text-white/60 leading-relaxed" />
      )}
      {item.tip && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/[0.07] border border-amber-500/15 px-3 py-2.5">
          <Star size={11} className="text-amber-400 shrink-0 mt-0.5" />
          <RichText text={item.tip} className="text-[11px] text-amber-300/80 leading-relaxed" />
        </div>
      )}
    </div>
  );
}

function StepItem({ item, index }: { item: SourcingItem; index: number }) {
  return (
    <div className="flex gap-3.5 pb-4 last:pb-0">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold text-white">
        {index + 1}
      </div>
      <div className="flex-1 border-b border-white/5 last:border-0 pb-4 last:pb-0">
        <p className="text-[13px] font-bold text-white/88 leading-snug mb-1">
          {(item.name ?? "").replace(/^\d+\.\s*/, "")}
        </p>
        {item.description && (
          <RichText text={item.description} className="text-[12px] text-white/55 leading-relaxed" />
        )}
      </div>
    </div>
  );
}

function ChecklistItem({ item }: { item: SourcingItem }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="w-4 h-4 rounded border border-emerald-500/35 bg-emerald-500/[0.08] flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 size={10} className="text-emerald-400" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-white/75 leading-snug">{item.name}</p>
        {item.description && (
          <RichText text={item.description} className="text-[11px] text-white/40 leading-relaxed mt-0.5" />
        )}
      </div>
    </div>
  );
}

function TipItem({ item }: { item: SourcingItem }) {
  return (
    <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-4 py-3.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={12} className="text-amber-400 shrink-0" />
        <p className="text-[12px] font-bold text-amber-400">{item.name}</p>
      </div>
      {item.description && (
        <RichText text={item.description} className="text-[12px] text-amber-200/55 leading-relaxed" />
      )}
    </div>
  );
}

function SectionBlock({ section }: { section: SourcingSection }) {
  const iconMap: Record<string, React.ElementType> = {
    supplier_list: Factory,
    steps:         ListChecks,
    checklist:     CheckCircle2,
    tips:          ShieldCheck,
    text:          FileText,
  };
  const Icon = iconMap[section.type] ?? FileText;

  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    supplier_list: { text: "text-blue-400",    bg: "bg-blue-500/8",    border: "border-blue-500/15"    },
    steps:         { text: "text-sky-400",     bg: "bg-sky-500/8",     border: "border-sky-500/15"     },
    checklist:     { text: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/15" },
    tips:          { text: "text-amber-400",   bg: "bg-amber-500/8",   border: "border-amber-500/15"   },
    text:          { text: "text-white/40",    bg: "bg-white/4",  border: "border-white/8"        },
  };
  const col = colorMap[section.type] ?? colorMap.text;

  return (
    <div className="mt-5">
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border ${col.bg} ${col.border}`}>
        <Icon size={13} className={col.text} />
        <p className={`text-[11px] font-semibold ${col.text}`}>
          {section.title}
        </p>
        <span className="ml-auto text-[10px] text-white/20 font-medium">
          {section.items.length} élément{section.items.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className={`space-y-${section.type === "steps" ? "0" : "2"} ${section.type === "steps" ? "pl-1" : ""}`}>
        {section.items.map((item, i) => {
          if (section.type === "supplier_list") return <SupplierCard   key={i} item={item} />;
          if (section.type === "steps")         return <StepItem       key={i} item={item} index={i} />;
          if (section.type === "checklist")     return <ChecklistItem  key={i} item={item} />;
          if (section.type === "tips")          return <TipItem        key={i} item={item} />;
          return (
            <p key={i} className="text-[13px] text-white/60 leading-relaxed">
              {item.name}{item.description ? " — " + item.description : ""}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ action, onPdf }: { action: SourcingAction; onPdf: () => void }) {
  const style = ACTION_STYLE[action.variant] ?? ACTION_STYLE.secondary;
  const cls   = `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all ${style}`;

  if (action.type === "generate_pdf") {
    return (
      <button onClick={onPdf} className={cls}>
        <Download size={13} />
        {action.label}
      </button>
    );
  }
  if (action.href) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={cls}>
        <ChevronRight size={13} />
        {action.label}
      </a>
    );
  }
  return <button className={cls}><ChevronRight size={13} />{action.label}</button>;
}

function MessageBubble({
  msg,
  onSuggestion,
  onPdf,
  onRetry,
}: {
  msg:          ChatMsg;
  onSuggestion: (text: string) => void;
  onPdf:        () => void;
  onRetry:      (text: string) => void;
}) {
  const { isDark } = useTheme();

  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease }}
        className="flex justify-end"
      >
        <div className="max-w-[82%] rounded-3xl rounded-br-lg px-4 py-3"
          style={{
            background: isDark ? "rgba(99,102,241,0.14)" : "rgba(79,70,229,0.08)",
            border: `1px solid ${isDark ? "rgba(99,102,241,0.22)" : "rgba(79,70,229,0.20)"}`,
          }}>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{ color: isDark ? "rgba(255,255,255,0.88)" : "#1e1b4b" }}>
            {msg.content}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease }}
      className="flex gap-3"
    >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
        msg.isError
          ? "bg-red-500/10 border-red-500/20"
          : "bg-blue-500/12 border-blue-500/20"
      }`}>
        {msg.isError
          ? <AlertCircle size={13} className="text-red-400" />
          : <TrendingUp size={13} className="text-blue-400" />
        }
      </div>

      <div className="flex-1 min-w-0">

                {msg.loading && (
          <div className="rounded-3xl rounded-tl-lg bg-white/4 border border-white/6 px-5 py-5 mb-2.5">
            <div className="flex items-center gap-2 mb-2">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-400/65 animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
                />
              ))}
            </div>
            <p className="text-[11px] text-white/25 animate-pulse">Analyse en cours — réponse complète…</p>
          </div>
        )}

                {!msg.loading && msg.isError && (
          <div className="rounded-3xl rounded-tl-lg bg-red-500/[0.06] border border-red-500/20 px-4 py-3.5 mb-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-red-300 mb-1">
                  Service temporairement indisponible
                </p>
                <p className="text-[12px] text-red-300/60 leading-relaxed mb-3">
                  {msg.content}
                </p>
                {msg.retryText && (
                  <button
                    onClick={() => onRetry(msg.retryText!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/12 border border-red-500/22 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all"
                  >
                    <RefreshCw size={11} />
                    Réessayer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

                {!msg.loading && !msg.isError && (
          <>
            <div className="rounded-3xl rounded-tl-lg bg-white/4 border border-white/6 px-5 py-5 mb-3">

                            {msg.content && (
                <div className="mb-1">
                  <RichText
                    text={msg.content}
                    className="text-[13px] text-white/75 leading-relaxed"
                  />
                </div>
              )}

                            {msg.reasoning && msg.reasoning.trim() && (
                <ReasoningBlock text={msg.reasoning} />
              )}

                            {(msg.sections ?? []).map((section, i) => (
                <SectionBlock key={i} section={section} />
              ))}

                            {(msg.sections ?? []).length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] text-white/20">
                    <Sparkles size={9} />
                    {(msg.sections ?? []).length} sections
                  </span>
                  <span className="text-[10px] text-white/15">·</span>
                  <span className="text-[10px] text-white/20">
                    {(msg.sections ?? []).reduce((acc, s) => acc + s.items.length, 0)} points couverts
                  </span>
                  <span className="text-[10px] text-white/15">·</span>
                  <span className="flex items-center gap-1 text-[10px] text-blue-400/50">
                    <TrendingUp size={9} />
                    Analyse Sonnet IA
                  </span>
                </div>
              )}
            </div>

                        {(msg.actions ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {(msg.actions ?? []).map((a, i) => (
                  <ActionBtn key={i} action={a} onPdf={onPdf} />
                ))}
              </div>
            )}

                        {(msg.suggestions ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(msg.suggestions ?? []).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestion(s)}
                    className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full border border-white/8 text-white/35 hover:text-white/65 hover:border-white/20 transition-all"
                  >
                    <ChevronRight size={10} className="shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function ComparisonMatrix({ suppliers }: { suppliers: SourcingItem[] }) {
  if (suppliers.length < 2) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="mt-6 rounded-2xl border border-indigo-500/18 bg-indigo-500/[0.04] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-indigo-500/12">
        <Table2 size={13} className="text-indigo-400" />
        <p className="text-[11px] font-semibold text-indigo-400">Matrice comparative — {suppliers.length} fournisseurs</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/6">
              <th className="px-4 py-2.5 text-[10px] font-semibold text-white/35 uppercase tracking-wide">Fournisseur</th>
              <th className="px-4 py-2.5 text-[10px] font-semibold text-white/35 uppercase tracking-wide">Pays</th>
              <th className="px-4 py-2.5 text-[10px] font-semibold text-white/35 uppercase tracking-wide">Type</th>
              <th className="px-4 py-2.5 text-[10px] font-semibold text-white/35 uppercase tracking-wide min-w-[180px]">Point clé</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, i) => (
              <tr key={i} className="border-b border-white/4 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="text-[12px] font-bold text-white/85">{s.name ?? "—"}</p>
                </td>
                <td className="px-4 py-3">
                  {s.country
                    ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">{s.country}</span>
                    : <span className="text-[11px] text-white/25">—</span>}
                </td>
                <td className="px-4 py-3">
                  {s.type
                    ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 border border-white/8 text-white/45">{s.type}</span>
                    : <span className="text-[11px] text-white/25">—</span>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">
                    {s.tip ?? s.description?.slice(0, 100) ?? "—"}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function NegotiationsPanel() {
  const { isDark } = useTheme();
  const [negs,        setNegs]        = useState<Negotiation[]>([]);
  const [authUid,     setAuthUid]     = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState<Partial<Negotiation>>({ status: "En cours" });
  const [editId,      setEditId]      = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAuthUid(user.id);
      const { data } = await supabase.from("sourcing_negotiations").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setNegs(data.map((r: Record<string,unknown>) => ({
        id: String(r.id), supplier: String(r.supplier), status: String(r.status) as NegStatus,
        notes: String(r.notes ?? ""), amount: r.amount ? String(r.amount) : "",
        createdAt: String(r.created_at), updatedAt: String(r.updated_at),
      })));
    })();
  }, []);

  async function saveNeg() {
    if (!form.supplier?.trim() || !authUid) return;
    const now = new Date().toISOString();
    if (editId) {
      const payload = { supplier: form.supplier!, status: form.status ?? "En cours", notes: form.notes ?? "", amount: form.amount ?? "", updated_at: now };
      const { data } = await supabase.from("sourcing_negotiations").update(payload).eq("id", editId).eq("user_id", authUid).select().single();
      if (data) setNegs(prev => prev.map(n => n.id === editId ? { ...n, ...form, updatedAt: now } as Negotiation : n));
    } else {
      const payload = { user_id: authUid, supplier: form.supplier!, status: form.status ?? "En cours", notes: form.notes ?? "", amount: form.amount ?? "" };
      const { data } = await supabase.from("sourcing_negotiations").insert(payload).select().single();
      if (data) {
        const newNeg: Negotiation = { id: String((data as Record<string,unknown>).id), supplier: form.supplier!, status: form.status ?? "En cours", notes: form.notes ?? "", amount: form.amount ?? "", createdAt: now, updatedAt: now };
        setNegs(prev => [newNeg, ...prev]);
      }
    }
    setShowForm(false); setForm({ status: "En cours" }); setEditId(null);
  }

  async function deleteNeg(id: string) {
    await supabase.from("sourcing_negotiations").delete().eq("id", id);
    setNegs(prev => prev.filter(n => n.id !== id));
  }

  function startEdit(n: Negotiation) {
    setForm({ supplier: n.supplier, status: n.status, notes: n.notes, amount: n.amount });
    setEditId(n.id); setShowForm(true);
  }

  const counts: Record<NegStatus, number> = {
    "En cours": 0, "Offre reçue": 0, "Accepté": 0, "Refusé": 0,
  };
  for (const n of negs) counts[n.status] = (counts[n.status] ?? 0) + 1;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-40">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {(Object.entries(counts) as [NegStatus, number][]).map(([st, cnt]) => (
          <div key={st} className={`rounded-xl border px-3 py-2.5 ${NEG_STATUS_STYLE[st]}`}>
            <p className="text-[18px] font-black leading-none">{cnt}</p>
            <p className="text-[10px] mt-0.5 opacity-70">{st}</p>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] text-white/40 font-semibold">{negs.length} négociation{negs.length !== 1 ? "s" : ""}</p>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ status: "En cours" }); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${isDark ? "bg-indigo-500/12 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20" : "border text-white"}`}
          style={!isDark ? { background: "linear-gradient(135deg,#c9a55a,#b08d45)", borderColor: "transparent", boxShadow: "0 2px 8px rgba(176,141,69,0.25)" } : undefined}>
          <PlusCircle size={13}/> Nouvelle
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="mb-4 rounded-2xl border border-white/10 bg-white/4 p-4 space-y-3">
            <p className="text-[12px] font-semibold text-white/60">{editId ? "Modifier" : "Nouvelle négociation"}</p>
            <input value={form.supplier ?? ""} onChange={e => setForm(p => ({...p, supplier: e.target.value}))}
              placeholder="Nom du fournisseur *"
              className="w-full rounded-xl bg-white/6 border border-white/8 px-3 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/40" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.status ?? "En cours"} onChange={e => setForm(p => ({...p, status: e.target.value as NegStatus}))}
                className="rounded-xl bg-white/6 border border-white/8 px-3 py-2 text-[12px] text-white/70 outline-none appearance-none cursor-pointer">
                {(["En cours","Offre reçue","Accepté","Refusé"] as NegStatus[]).map(s => (
                  <option key={s} value={s} className={isDark ? "bg-[#0e1420]" : "bg-white"}>{s}</option>
                ))}
              </select>
              <input value={form.amount ?? ""} onChange={e => setForm(p => ({...p, amount: e.target.value}))}
                placeholder="Montant (ex: 15 000 €)"
                className="rounded-xl bg-white/6 border border-white/8 px-3 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/40" />
            </div>
            <textarea value={form.notes ?? ""} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
              placeholder="Notes, conditions, prochaines étapes…" rows={3}
              className="w-full rounded-xl bg-white/6 border border-white/8 px-3 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/40 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => { void saveNeg(); }} disabled={!form.supplier?.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[12px] font-semibold transition-all disabled:opacity-40"
                style={{ background: isDark ? "#6366f1" : "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
                <Check size={12}/> {editId ? "Mettre à jour" : "Créer"}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm({ status: "En cours" }); }}
                className="px-3 py-2 rounded-xl text-[12px] text-white/40 hover:text-white hover:bg-white/8 transition-all">
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {negs.length === 0 && !showForm && (
        <div className="text-center py-16">
          <Handshake size={32} className="text-white/12 mx-auto mb-3" />
          <p className="text-[13px] text-white/25">Aucune négociation suivie</p>
          <p className="text-[11px] text-white/15 mt-1">Crée une entrée pour chaque fournisseur en cours</p>
        </div>
      )}
      <div className="space-y-3">
        <AnimatePresence>
          {negs.map(n => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-white/88 truncate">{n.supplier}</p>
                  {n.amount && <p className="text-[11px] text-white/35 mt-0.5">{n.amount}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${NEG_STATUS_STYLE[n.status]}`}>{n.status}</span>
                </div>
              </div>
              {n.notes && <p className="text-[12px] text-white/45 leading-relaxed mb-3 whitespace-pre-wrap line-clamp-3">{n.notes}</p>}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <p className="text-[10px] text-white/20 flex-1">
                  {new Date(n.updatedAt).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                </p>
                {(["En cours","Offre reçue","Accepté","Refusé"] as NegStatus[]).filter(s => s !== n.status).map(s => (
                  <button key={s} onClick={() => {
                    const updated = negs.map(x => x.id === n.id ? { ...x, status: s, updatedAt: new Date().toISOString() } : x);
                    setNegs(updated);
                    if (authUid) void supabase.from("sourcing_negotiations").update({ status: s, updated_at: new Date().toISOString() }).eq("id", n.id).eq("user_id", authUid);
                  }} className="text-[10px] px-2 py-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/6 transition-all">
                    → {s}
                  </button>
                ))}
                <button onClick={() => startEdit(n)} className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/8 transition-all">
                  <Check size={11}/>
                </button>
                <button onClick={() => { void deleteNeg(n.id); }} className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={11}/>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SourcingPage() {
  const { isDark } = useTheme();
  const [messages,     setMessages]     = useState<ChatMsg[]>([]);
  const [input,        setInput]        = useState("");
  const [sending,      setSending]      = useState(false);
  const [pdfLoading,   setPdfLoading]   = useState(false);
  const [tab,          setTab]          = useState<"chat"|"negs">("chat");
  const [history,      setHistory]      = useState<HistorySession[]>([]);
  const [showHistory,  setShowHistory]  = useState(false);
  const [crmLoading,   setCrmLoading]   = useState(false);
  const [crmDone,      setCrmDone]      = useState(false);
  const [authUserId,   setAuthUserId]   = useState<string | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const msgHistory = useRef<ChatMsg[]>([]);

  useEffect(() => { msgHistory.current = messages; }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAuthUserId(user.id);
      const { data } = await supabase.from("sourcing_sessions").select("id,title,messages,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      if (data) setHistory(data.map((r: Record<string,unknown>) => ({ id: String(r.id), title: String(r.title), date: String(r.created_at), messages: (r.messages as ChatMsg[]) ?? [] })));
    })();
  }, []);

  const allSuppliers = useMemo(() => {
    const result: SourcingItem[] = [];
    for (const msg of messages) {
      for (const sec of msg.sections ?? []) {
        if (sec.type === "supplier_list") result.push(...sec.items);
      }
    }
    return result;
  }, [messages]);

    const sendToAPI = useCallback(async (
    text:    string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    aiId:    string,
  ) => {
    try {
      const res = await fetch("/api/sourcing/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null) as SourcingApiResponse | null;
        throw new Error(errData?.error ?? `Erreur serveur (${res.status})`);
      }

      const rawData = await res.json() as SourcingApiResponse;

            let resolved = rawData;
      if (typeof rawData.text === "string") {
        const t = rawData.text.trim();
        if (t.startsWith("{")) {
          try {
            const inner = JSON.parse(t) as SourcingApiResponse;
            if (inner.text !== undefined || (inner.sections && inner.sections.length > 0)) {
              resolved = {
                text:        inner.text        ?? "",
                reasoning:   inner.reasoning   ?? "",
                sections:    inner.sections    ?? [],
                actions:     inner.actions     ?? rawData.actions     ?? [],
                suggestions: inner.suggestions ?? rawData.suggestions ?? [],
              };
            }
          } catch { /* double-parse optionnel — rawData utilisé tel quel */ }
        }
      }

            const VALID = ["supplier_list", "steps", "checklist", "tips", "text"] as const;
      type ValidType = typeof VALID[number];
      const normSections: SourcingSection[] = (resolved.sections ?? []).map(s => ({
        ...s,
        type: (VALID.includes((s.type ?? "").toLowerCase() as ValidType)
          ? (s.type ?? "").toLowerCase()
          : "text") as ValidType,
      }));

      setMessages(prev => prev.map(m =>
        m.id === aiId
          ? {
              ...m,
              content:     resolved.text        ?? "",
              reasoning:   resolved.reasoning   ?? "",
              sections:    normSections,
              actions:     resolved.actions     ?? [],
              suggestions: resolved.suggestions ?? [],
              loading:     false,
            }
          : m,
      ));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Erreur inconnue. Réessaie dans un instant.";
      setMessages(prev => prev.map(m =>
        m.id === aiId
          ? { ...m, content: errMsg, isError: true, retryText: text, loading: false }
          : m,
      ));
    } finally {
      setSending(false);
    }
  }, []);

    const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;

    const userId = uid();
    const aiId   = uid();

    const history = msgHistory.current
      .filter(m => !m.loading && !m.isError && m.content.trim().length > 0)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [
      ...prev,
      { id: userId, role: "user",      content: msg },
      { id: aiId,   role: "assistant", content: "", loading: true },
    ]);
    setInput("");
    setSending(true);

    if (inputRef.current) inputRef.current.style.height = "auto";

    await sendToAPI(msg, history, aiId);
  }, [input, sending, sendToAPI]);

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  }

  function newChat() {
    const validMsgs = messages.filter(m => !m.loading && !m.isError && m.content.trim());
    if (validMsgs.length > 0 && authUserId) {
      const title = messages.find(m => m.role === "user")?.content.slice(0, 65) ?? "Session";
      const cleanMsgs = messages.filter(m => !m.loading);
      void supabase.from("sourcing_sessions").insert({ user_id: authUserId, title, messages: cleanMsgs }).select("id,title,created_at").single()
        .then(({ data }) => {
          if (data) {
            const session: HistorySession = { id: String((data as Record<string,unknown>).id), title, date: String((data as Record<string,unknown>).created_at), messages: cleanMsgs };
            setHistory(prev => [session, ...prev].slice(0, 20));
          }
        });
    }
    setMessages([]); setInput(""); setSending(false);
    setShowHistory(false); setCrmDone(false);
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  const exportToCRM = useCallback(async () => {
    if (!allSuppliers.length || crmLoading) return;
    setCrmLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const rows = allSuppliers.filter(s => s.name).map(s => ({
        user_id: user.id,
        name: s.name ?? "",
        email: "", phone: "", company: s.name ?? "",
        country: s.country ?? "",
        notes: [s.description, s.tip].filter(Boolean).join("\n"),
        status: "prospect" as const,
        type: "prospect" as const,
        source: "Sourcing IA",
        tags: ["fournisseur", ...(s.type ? [s.type] : [])],
      }));
      await supabase.from("contacts").insert(rows);
      setCrmDone(true);
    } finally {
      setCrmLoading(false);
    }
  }, [allSuppliers, crmLoading]);

    const handleGeneratePdf = useCallback(async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const { generateGuide } = await import("@/lib/sourcing/generateGuide");
      const guideMessages: GuideMessage[] = msgHistory.current
        .filter(m => !m.loading)
        .map(m => ({
          role:     m.role,
          content:  m.content,
          sections: m.sections,
        }));
      const firstQ = guideMessages.find(m => m.role === "user")?.content ?? "Guide Sourcing & Marchés";
      await generateGuide(guideMessages, firstQ);
    } finally {
      setPdfLoading(false);
    }
  }, [pdfLoading]);

  const hasMessages = messages.length > 0;
  const hasAiMsg    = messages.some(m => m.role === "assistant" && !m.loading);

    return (
    <div className={`min-h-screen pb-40 ${isDark ? "bg-[#07080e] text-white" : "bg-[#f0f2fb] text-gray-900 sr-light"}`}>
      {!isDark && (
        <style>{`
          .sr-light [class*="border-white/"] { border-color: rgba(12,24,100,0.09) !important; }
          .sr-light .bg-white\/3  { background-color: rgba(12,24,100,0.025) !important; }
          .sr-light .bg-white\/4  { background-color: rgba(12,24,100,0.03) !important; }
          .sr-light [class*="bg-white/6"]  { background-color: rgba(12,24,100,0.04) !important; }
          .sr-light [class*="bg-white/8"]  { background-color: rgba(12,24,100,0.05) !important; }
          .sr-light .border-white\/10 { border-color: rgba(12,24,100,0.10) !important; }
          .sr-light [class*="hover:bg-white/"]:hover { background-color: rgba(12,24,100,0.06) !important; }
          .sr-light .text-white { color: #111827 !important; }
          .sr-light [class*="text-white/9"],.sr-light [class*="text-white/8"] { color: rgba(12,18,50,0.82) !important; }
          .sr-light [class*="text-white/7"] { color: rgba(12,18,50,0.65) !important; }
          .sr-light [class*="text-white/6"],.sr-light [class*="text-white/5"] { color: rgba(12,18,50,0.52) !important; }
          .sr-light [class*="text-white/4"],.sr-light [class*="text-white/3"] { color: rgba(12,18,50,0.35) !important; }
          .sr-light [class*="text-white/2"],.sr-light [class*="text-white/1"] { color: rgba(12,18,50,0.20) !important; }
          .sr-light [class*="hover:text-white/"]:hover { color: rgba(12,18,50,0.65) !important; }
          .sr-light textarea.bg-transparent { color: #111827 !important; }
          .sr-light textarea::placeholder { color: rgba(12,18,50,0.30) !important; }
          .sr-light input::placeholder { color: rgba(12,18,50,0.30) !important; }
        `}</style>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />
      )}

      {/* ── HEADER premium ── */}
      <div className="relative overflow-hidden shrink-0"
        style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0c0e1a,#07080e)" : "linear-gradient(160deg,#eef0f8,#e8ebf5,#eef0f8)" }}>
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-10 -left-8 h-36 w-36 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle,#818cf8,transparent 70%)" }}/>
        <div className="pointer-events-none absolute -bottom-6 right-12 h-24 w-24 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle,#60a5fa,transparent 70%)" }}/>
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,rgba(129,140,248,0.5),rgba(96,165,250,0.2),transparent)" }}/>

        <div className="relative mx-auto flex max-w-2xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
              {APP_ICONS["/client/sourcing"]}
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Sourcing IA</h1>
              <p className="text-[0.65rem] text-white/32">Fournisseurs · Marchés · Analyse Sonnet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* History dropdown */}
            <div className="relative">
              <button onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/6 px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/8">
                <History size={12}/>{history.length > 0 && <span className="text-[10px] text-indigo-400">{history.length}</span>}
                <ChevronDown size={10}/>
              </button>
              <AnimatePresence>
                {showHistory && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className={`absolute right-0 top-full mt-1 w-72 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden ${isDark ? "bg-[#0d1117]" : "bg-white"}`}>
                    <div className="px-4 py-3 border-b border-white/6">
                      <p className="text-[11px] font-semibold text-white/50">Historique sourcings</p>
                    </div>
                    {history.length === 0 ? (
                      <p className="px-4 py-4 text-[11px] text-white/25">Aucun historique</p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {history.map(s => (
                          <button key={s.id} onClick={() => {
                            setMessages(s.messages);
                            setShowHistory(false);
                            setCrmDone(false);
                          }}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/4 transition-colors border-b border-white/4 last:border-0 text-left">
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-white/75 font-medium truncate">{s.title}</p>
                              <p className="text-[10px] text-white/30 mt-0.5">
                                {new Date(s.date).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"2-digit" })}
                              </p>
                            </div>
                            <ChevronRight size={11} className="text-white/20 shrink-0 mt-1" />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export CRM */}
            {allSuppliers.length > 0 && (
              <button onClick={() => void exportToCRM()} disabled={crmLoading || crmDone}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/15 disabled:opacity-50">
                {crmLoading ? <Loader2 size={12} className="animate-spin"/> : crmDone ? <Check size={12}/> : <Users size={12}/>}
                {crmDone ? "Exporté" : "→ CRM"}
              </button>
            )}

            {hasAiMsg && (
              <button onClick={handleGeneratePdf} disabled={pdfLoading}
                className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/6 px-3.5 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/8 disabled:opacity-40">
                {pdfLoading ? <RefreshCw size={12} className="animate-spin"/> : <Download size={12}/>}
                {pdfLoading ? "Génération…" : "PDF"}
              </button>
            )}
            {hasMessages && (
              <button onClick={newChat}
                className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/6 px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/8">
                <X size={13}/> Nouveau
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className={`border-b border-white/6 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2fb]"}`}>
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pt-1">
          {([["chat","Chat IA",Search],["negs","Négociations",Handshake]] as [typeof tab, string, React.ElementType][]).map(([t,label,Icon]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-all ${
                tab === t
                  ? `border-indigo-500 ${isDark ? "text-white/85" : "text-indigo-700"}`
                  : `border-transparent ${isDark ? "text-white/35 hover:text-white/55" : "text-gray-400 hover:text-gray-600"}`
              }`}>
              <Icon size={12}/>{label}
            </button>
          ))}
        </div>
      </div>

      {tab === "negs" ? <NegotiationsPanel /> : (
            <div className="max-w-2xl mx-auto px-4 pt-5">

                <AnimatePresence>
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
            >
                            {/* ── HERO ── */}
              <div className="relative text-center mb-8 pt-8 pb-2">
                {/* ambient orbs */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full opacity-[0.10]"
                  style={{ background: "radial-gradient(circle,#818cf8,transparent 70%)" }}/>
                <div className="pointer-events-none absolute top-8 left-1/2 ml-20 h-28 w-28 rounded-full opacity-[0.06]"
                  style={{ background: "radial-gradient(circle,#60a5fa,transparent 70%)" }}/>

                {/* Icon */}
                <div className="relative inline-flex mb-5">
                  <div className="pointer-events-none absolute inset-0 -m-10 rounded-full opacity-25"
                    style={{ background: "radial-gradient(circle,#818cf8,transparent 65%)" }}/>
                  <div className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-3xl"
                    style={{
                      background: isDark ? "linear-gradient(145deg,rgba(129,140,248,0.22),rgba(96,165,250,0.10))" : "linear-gradient(145deg,rgba(129,140,248,0.12),rgba(96,165,250,0.06))",
                      border: "1px solid rgba(129,140,248,0.25)",
                      boxShadow: isDark ? "0 0 40px rgba(129,140,248,0.22), 0 8px 32px rgba(0,0,0,0.4)" : "0 0 24px rgba(129,140,248,0.12), 0 4px 16px rgba(12,24,100,0.08)",
                    }}>
                    <Sparkles size={34} style={{ color: "#a5b4fc" }} />
                  </div>
                </div>

                {/* Title with gradient */}
                <h2 className="text-[1.55rem] font-black tracking-tight mb-2"
                  style={isDark ? {
                    background: "linear-gradient(135deg,#e0e7ff 0%,#a5b4fc 40%,#93c5fd 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  } : {
                    color: "#3730a3",
                  }}>
                  Expert Sourcing & Marchés IA
                </h2>

                <p className="text-[0.8rem] text-white/38 max-w-xs mx-auto leading-relaxed mb-4">
                  Analyses complètes, raisonnement stratégique, guides actionnables.<br/>
                  Propulsé par <span className="text-white/55 font-semibold">Claude Sonnet</span>.
                </p>

                {/* Chips */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "rgba(52,211,153,0.8)" }}>
                    <CheckCircle2 size={10} /> Réponses longues
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold"
                    style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "rgba(167,139,250,0.8)" }}>
                    <Brain size={10} /> Raisonnement stratégique
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold"
                    style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "rgba(96,165,250,0.8)" }}>
                    <Download size={10} /> Export PDF
                  </span>
                </div>

                {/* Thin separator */}
                <div className="mx-auto mt-6 h-px w-24 opacity-30 rounded-full"
                  style={{ background: "linear-gradient(90deg,transparent,#818cf8,transparent)" }}/>
              </div>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                {QUICKSTART.map((card, i) => {
                  const cardClass = "flex flex-col items-start gap-2.5 p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.99]";
                  const cardStyle = isDark
                    ? { background: card.bg, borderColor: card.border }
                    : { background: "#ffffff", borderColor: card.border, boxShadow: "0 2px 12px rgba(12,24,100,0.07)" };
                  const inner = (
                    <>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(12,24,100,0.06)" }}>
                        <card.icon size={16} style={{ color: card.color }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-white/88 leading-snug">{card.label}</p>
                        <p className="text-[11px] text-white/38 mt-0.5">{card.desc}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold mt-auto" style={{ color: card.color }}>
                        {card.href ? "Lancer le wizard" : "Analyse complète"} <ChevronRight size={10} />
                      </div>
                    </>
                  );
                  return card.href ? (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.25, ease }}>
                      <Link href={card.href} className={cardClass} style={cardStyle}>{inner}</Link>
                    </motion.div>
                  ) : (
                    <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.25, ease }}
                      onClick={() => handleSend(card.question)}
                      className={cardClass} style={cardStyle}>
                      {inner}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-center text-[11px] pb-4"
                style={{ color: isDark ? "rgba(255,255,255,0.20)" : "rgba(12,18,50,0.45)" }}>
                Ou décris directement ta situation dans le champ ci-dessous
              </p>
            </motion.div>
          )}
        </AnimatePresence>

                {hasMessages && (
          <div className="space-y-6 pb-4">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onSuggestion={text => handleSend(text)}
                  onPdf={handleGeneratePdf}
                  onRetry={text => handleSend(text)}
                />
              ))}
            </AnimatePresence>
            {allSuppliers.length >= 2 && (
              <ComparisonMatrix suppliers={allSuppliers} />
            )}
            <div ref={bottomRef} />
          </div>
        )}
        {!hasMessages && <div ref={bottomRef} />}
      </div>
      )}

      {tab === "chat" && <div className={`fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl border-t border-white/6 ${isDark ? "bg-[#07080e]/98" : "bg-[#f0f2fb]/95"}`}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2.5 rounded-2xl border border-white/8 bg-white/6 px-4 py-2.5 transition-colors focus-within:border-[rgba(129,140,248,0.3)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Décris ta situation, ton secteur, ton pays… Plus tu es précis, plus la réponse sera utile."
              rows={1}
              disabled={sending}
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/25 outline-none resize-none leading-relaxed max-h-32 scrollbar-none disabled:opacity-40"
              style={{ height: "24px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all disabled:cursor-not-allowed disabled:opacity-25"
              style={{ backgroundColor: "#818cf820", borderColor: "#818cf830", color: "#818cf8" }}
            >
              {sending
                ? <RefreshCw size={13} className="animate-spin" />
                : <Send size={13} />
              }
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-white/15">
            Entrée pour envoyer · Maj+Entrée pour saut de ligne · Réponse complète ~10-30s
          </p>
        </div>
      </div>}
    </div>
  );
}
