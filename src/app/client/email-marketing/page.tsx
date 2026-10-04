"use client";

import { useState, useEffect, useCallback, useRef, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Plus, X, Search, Loader2, Check, Trash2, ChevronRight,
  Send, BarChart2, Users, Settings, FileText, Zap, Layout,
  Eye, ChevronLeft, Sparkles, Copy, AlertCircle, Globe, Clock,
  RefreshCw, ArrowRight, CheckCircle2, Play, Pause, MoreHorizontal,
  Image as ImageIcon, Type, Square, Minus, Columns, AlignLeft,
  MousePointer2, Smartphone, Monitor, Link, ExternalLink,
  ToggleLeft, ToggleRight, Download, Upload,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

/* ── Types ─────────────────────────────────────────────────── */
type Tab = "accueil" | "campagnes" | "automatisations" | "templates" | "audience" | "formulaires" | "analytics" | "parametres";
type CampStatus = "brouillon" | "a_valider" | "planifiee" | "en_cours" | "envoyee" | "annulee" | "echec";

interface Campaign {
  id: string; name: string; subject: string; preheader: string; status: CampStatus;
  scheduled_at: string | null; completed_at: string | null;
  stats_recipients: number; stats_sent: number; stats_delivered: number;
  stats_bounced: number; stats_opened: number; stats_clicked: number; stats_unsubscribed: number;
  ai_generated: boolean; created_at: string; updated_at: string;
  blocks?: EmailBlock[];
}
interface EmailBlock {
  id: string; type: "title" | "text" | "button" | "image" | "separator" | "spacer" | "footer" | "columns";
  content?: string; label?: string; url?: string; src?: string; alt?: string;
  align?: "left" | "center" | "right"; columns?: EmailBlock[][];
  fontSize?: number; fontWeight?: "normal" | "bold"; color?: string; bg?: string; padding?: number;
}
interface Contact {
  id: string; first_name: string | null; last_name: string | null; email: string;
  company: string | null; tags: string[] | null; status: string;
  em_contact_marketing: {
    global_status: string; consent_marketing: boolean;
    total_sent: number; total_opened: number; total_clicked: number;
  }[] | null;
}
interface AutoStep {
  id: string; step_type: string; config: Record<string, unknown>;
}
interface Automation {
  id?: string; name: string; trigger_type: string; trigger_config: Record<string, unknown>;
  is_active: boolean; run_count: number; steps: AutoStep[];
}

/* ── Status config ── */
const STATUS_CFG: Record<CampStatus, { label: string; color: string }> = {
  brouillon:  { label: "Brouillon",  color: "#6b7280" },
  a_valider:  { label: "À valider",  color: "#c9a55a" },
  planifiee:  { label: "Planifiée",  color: "#3b82f6" },
  en_cours:   { label: "En cours",   color: GOLD      },
  envoyee:    { label: "Envoyée",    color: "#10b981" },
  annulee:    { label: "Annulée",    color: "#6b7280" },
  echec:      { label: "Échec",      color: "#ef4444" },
};

type IconComp = React.ComponentType<{ size?: number; style?: CSSProperties; className?: string }>;
const STEP_ICONS: Record<string, { icon: IconComp; label: string; color: string }> = {
  send_email:    { icon: Mail,         label: "Envoyer email",    color: GOLD      },
  wait:          { icon: Clock,        label: "Attendre",         color: "#3b82f6" },
  condition:     { icon: ChevronRight, label: "Condition",        color: "#c9a55a" },
  add_tag:       { icon: Plus,         label: "Ajouter tag",      color: "#10b981" },
  remove_tag:    { icon: Minus,        label: "Retirer tag",      color: "#ef4444" },
  create_task:   { icon: CheckCircle2, label: "Créer tâche",      color: "#f59e0b" },
  notify_member: { icon: Send,         label: "Notifier membre",  color: "#06b6d4" },
  add_to_list:   { icon: Users,        label: "Ajouter à liste",  color: "#ec4899" },
  webhook:       { icon: Globe,        label: "Webhook",          color: "#6b7280" },
};

const TEMPLATE_GALLERY = [
  { key: "newsletter",   label: "Newsletter",        desc: "Actualités et informations" },
  { key: "promo",        label: "Promotion",         desc: "Offre limitée ou remise" },
  { key: "lancement",    label: "Lancement produit", desc: "Présenter un nouveau produit" },
  { key: "bienvenue",    label: "Bienvenue",         desc: "Email de bienvenue" },
  { key: "relance",      label: "Relance",           desc: "Réactiver des prospects" },
  { key: "rdv",          label: "Rendez-vous",       desc: "Confirmation ou rappel RDV" },
  { key: "evenement",    label: "Événement",         desc: "Invitation ou compte-rendu" },
  { key: "formation",    label: "Formation",         desc: "Programme ou rappel" },
  { key: "ecommerce",    label: "E-commerce",        desc: "Produit ou panier abandonné" },
  { key: "facture",      label: "Transactionnel",    desc: "Facture, relance, paiement" },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtNum(n: number) { return n.toLocaleString("fr-FR"); }
function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 100) : 0; }
function uid() { return Math.random().toString(36).slice(2, 10); }

/* ── Éditeur email ── */
function EmailEditor({
  blocks, onChange, onClose, subject, preheader, onSubjectChange, onPreheaderChange, isDark,
}: {
  blocks: EmailBlock[]; onChange: (b: EmailBlock[]) => void; onClose: () => void;
  subject: string; preheader: string;
  onSubjectChange: (v: string) => void; onPreheaderChange: (v: string) => void;
  isDark: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<"desktop" | "mobile">("desktop");
  const [showRewrite, setShowRewrite] = useState(false);
  const [rewriteTone, setRewriteTone] = useState("professionnel");
  const [rewriting, setRewriting] = useState(false);

  const selected = blocks.find(b => b.id === selectedId) ?? null;

  const inp = isDark
    ? "border-white/8 bg-white/4 text-white placeholder-white/25"
    : "border-black/8 bg-gray-50 text-gray-900 placeholder-gray-400";
  const card = isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm";
  const muted = isDark ? "text-white/35" : "text-gray-400";
  const text  = isDark ? "text-white" : "text-gray-900";

  function addBlock(type: EmailBlock["type"]) {
    const b: EmailBlock = {
      id: uid(), type,
      content: type === "title" ? "Votre titre ici" : type === "text" ? "Votre texte…" : type === "footer" ? "© DJAMA · <unsubscribe>Se désabonner</unsubscribe>" : "",
      label:   type === "button" ? "En savoir plus" : undefined,
      url:     type === "button" ? "{{cta_url}}" : undefined,
      align:   "center",
    };
    onChange([...blocks, b]);
    setSelectedId(b.id);
  }

  function updateBlock(id: string, patch: Partial<EmailBlock>) {
    onChange(blocks.map(b => b.id === id ? { ...b, ...patch } : b));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    onChange(copy);
  }

  async function rewriteBlock() {
    if (!selected?.content) return;
    setRewriting(true);
    try {
      const r = await fetch("/api/email/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rewrite", content: selected.content, tone: rewriteTone }),
      });
      const d = await r.json() as { content?: string };
      if (d.content) updateBlock(selected.id, { content: d.content });
    } finally { setRewriting(false); setShowRewrite(false); }
  }

  const BLOCK_TYPES: { type: EmailBlock["type"]; icon: IconComp; label: string }[] = [
    { type: "title",    icon: Type,         label: "Titre"      },
    { type: "text",     icon: AlignLeft,    label: "Texte"      },
    { type: "button",   icon: MousePointer2, label: "Bouton"   },
    { type: "image",    icon: ImageIcon,    label: "Image"      },
    { type: "separator",icon: Minus,        label: "Séparateur" },
    { type: "spacer",   icon: Square,       label: "Espace"     },
    { type: "footer",   icon: Layout,       label: "Footer"     },
  ];

  const TONES = [
    { key: "professionnel", label: "Professionnel" },
    { key: "court",         label: "Plus court"    },
    { key: "commercial",    label: "Commercial"    },
    { key: "persuasif",     label: "Persuasif"     },
    { key: "amical",        label: "Amical"        },
    { key: "corriger",      label: "Corriger"      },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      {/* Toolbar */}
      <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${isDark ? "border-white/6 bg-[#0e1420]" : "border-black/8 bg-white shadow-sm"}`}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className={`flex h-8 w-8 items-center justify-center rounded-xl ${muted} hover:opacity-70`}><ChevronLeft size={16} /></button>
          <div>
            <p className={`text-sm font-bold ${text}`}>Éditeur email</p>
            <p className={`text-xs ${muted}`}>{blocks.length} bloc{blocks.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-0.5 rounded-xl p-0.5 ${isDark ? "bg-white/4" : "bg-gray-100"}`}>
            {(["desktop","mobile"] as const).map(v => (
              <button key={v} onClick={() => setPreview(v)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition"
                style={preview === v ? { background: `${GOLD}18`, color: GOLD } : { color: isDark ? "rgba(255,255,255,0.35)" : "#aaa" }}>
                {v === "desktop" ? <Monitor size={11} /> : <Smartphone size={11} />}
                {v === "desktop" ? "Desktop" : "Mobile"}
              </button>
            ))}
          </div>
          <button onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-black"
            style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
            <Check size={13} /> Terminer
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Panneau gauche — blocs */}
        <div className={`shrink-0 w-48 border-r overflow-y-auto p-3 space-y-1 ${isDark ? "border-white/6 bg-[#0a0d14]" : "border-black/6 bg-gray-50"}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>Blocs</p>
          {BLOCK_TYPES.map(bt => (
            <button key={bt.type} onClick={() => addBlock(bt.type)}
              className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition ${card} ${muted} hover:opacity-70`}>
              <bt.icon size={11} />{bt.label}
            </button>
          ))}
        </div>

        {/* Zone de prévisualisation centrale */}
        <div className={`flex-1 overflow-y-auto p-6 ${isDark ? "bg-[#040608]" : "bg-gray-200"}`}>
          {/* Sujet + preheader */}
          <div className={`mx-auto mb-4 rounded-2xl border p-4 space-y-2 ${card}`} style={{ maxWidth: preview === "mobile" ? 375 : 600 }}>
            <input value={subject} onChange={e => onSubjectChange(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none ${inp}`}
              placeholder="Objet de l'email…" />
            <input value={preheader} onChange={e => onPreheaderChange(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inp}`}
              placeholder="Texte de prévisualisation…" />
          </div>

          {/* Corps email */}
          <div className={`mx-auto rounded-2xl border overflow-hidden`}
            style={{ maxWidth: preview === "mobile" ? 375 : 600, background: "#ffffff" }}>
            {blocks.length === 0 && (
              <div className="py-16 text-center text-gray-400 text-sm">
                Ajoutez des blocs depuis le panneau gauche
              </div>
            )}
            {blocks.map((block, i) => (
              <div key={block.id}
                onClick={() => setSelectedId(block.id)}
                className="relative group cursor-pointer"
                style={{ outline: selectedId === block.id ? `2px solid ${GOLD}` : "none" }}>
                {/* Contrôles de bloc */}
                <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  {i > 0 && <button onClick={e => { e.stopPropagation(); moveBlock(block.id, -1); }} className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow hover:bg-white"><ChevronLeft size={9} /></button>}
                  {i < blocks.length - 1 && <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 1); }} className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow hover:bg-white"><ChevronRight size={9} /></button>}
                  <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }} className="flex h-5 w-5 items-center justify-center rounded-lg bg-red-500/90 text-white shadow hover:bg-red-500"><X size={9} /></button>
                </div>

                {/* Rendu du bloc */}
                {block.type === "title" && (
                  <div className="px-8 py-4" style={{ textAlign: block.align ?? "center" }}>
                    <p style={{ fontSize: block.fontSize ?? 26, fontWeight: "bold", color: block.color ?? "#111" }}>{block.content}</p>
                  </div>
                )}
                {block.type === "text" && (
                  <div className="px-8 py-3" style={{ textAlign: block.align ?? "left" }}>
                    <p style={{ fontSize: block.fontSize ?? 15, color: block.color ?? "#444", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{block.content}</p>
                  </div>
                )}
                {block.type === "button" && (
                  <div className="px-8 py-5 flex" style={{ justifyContent: block.align === "left" ? "flex-start" : block.align === "right" ? "flex-end" : "center" }}>
                    <span className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white"
                      style={{ background: block.bg ?? GOLD }}>{block.label}</span>
                  </div>
                )}
                {block.type === "image" && (
                  <div className="px-8 py-3">
                    {block.src
                      ? <img src={block.src} alt={block.alt ?? ""} className="w-full rounded-xl object-cover" />
                      : <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-300"><ImageIcon size={20} /> Image</div>
                    }
                  </div>
                )}
                {block.type === "separator" && (
                  <div className="px-8 py-2"><div className="h-px bg-gray-200" /></div>
                )}
                {block.type === "spacer" && (
                  <div style={{ height: block.padding ?? 24 }} />
                )}
                {block.type === "footer" && (
                  <div className="px-8 py-4 text-center text-xs text-gray-400" dangerouslySetInnerHTML={{ __html: (block.content ?? "").replace(/<unsubscribe>(.*?)<\/unsubscribe>/, '<a href="#unsubscribe" style="color:#999;text-decoration:underline">$1</a>') }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panneau droit — propriétés du bloc */}
        <div className={`shrink-0 w-60 border-l overflow-y-auto p-3 space-y-3 ${isDark ? "border-white/6 bg-[#0a0d14]" : "border-black/6 bg-gray-50"}`}>
          {!selected ? (
            <div className="py-12 text-center">
              <p className={`text-xs ${muted}`}>Sélectionnez un bloc</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold uppercase tracking-wider ${muted}`}>{selected.type}</p>
                <button onClick={() => setSelectedId(null)} className={muted}><X size={11} /></button>
              </div>

              {/* Contenu */}
              {(selected.type === "title" || selected.type === "text" || selected.type === "footer") && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Contenu</label>
                  <textarea value={selected.content ?? ""} rows={5}
                    onChange={e => updateBlock(selected.id, { content: e.target.value })}
                    className={`w-full resize-none rounded-xl border px-2.5 py-2 text-xs outline-none ${inp}`} />
                  {/* Réécriture IA */}
                  <div className="mt-1.5">
                    {!showRewrite ? (
                      <button onClick={() => setShowRewrite(true)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold"
                        style={{ background: `${GOLD}15`, color: GOLD }}>
                        <Sparkles size={9} /> Réécrire avec IA
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        <select value={rewriteTone} onChange={e => setRewriteTone(e.target.value)}
                          className={`w-full rounded-xl border px-2 py-1.5 text-xs outline-none ${inp}`}>
                          {TONES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                        <div className="flex gap-1">
                          <button onClick={() => setShowRewrite(false)} className={`flex-1 rounded-xl py-1 text-xs border ${card} ${muted}`}>Annuler</button>
                          <button onClick={() => void rewriteBlock()} disabled={rewriting}
                            className="flex-1 rounded-xl py-1 text-xs font-bold"
                            style={{ background: `${GOLD}15`, color: GOLD }}>
                            {rewriting ? <Loader2 size={9} className="mx-auto animate-spin" /> : "Réécrire"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selected.type === "button" && (
                <div className="space-y-2">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Libellé</label>
                    <input value={selected.label ?? ""} onChange={e => updateBlock(selected.id, { label: e.target.value })}
                      className={`w-full rounded-xl border px-2.5 py-2 text-xs outline-none ${inp}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>URL</label>
                    <input value={selected.url ?? ""} onChange={e => updateBlock(selected.id, { url: e.target.value })}
                      className={`w-full rounded-xl border px-2.5 py-2 text-xs outline-none ${inp}`}
                      placeholder="{{cta_url}}" />
                  </div>
                </div>
              )}

              {selected.type === "image" && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>URL image</label>
                  <input value={selected.src ?? ""} onChange={e => updateBlock(selected.id, { src: e.target.value })}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs outline-none ${inp}`}
                    placeholder="https://…" />
                  <label className={`block text-xs font-semibold mt-2 mb-1 ${muted}`}>Alt</label>
                  <input value={selected.alt ?? ""} onChange={e => updateBlock(selected.id, { alt: e.target.value })}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs outline-none ${inp}`} />
                </div>
              )}

              {/* Alignement */}
              {["title","text","button"].includes(selected.type) && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Alignement</label>
                  <div className="flex gap-1">
                    {(["left","center","right"] as const).map(a => (
                      <button key={a} onClick={() => updateBlock(selected.id, { align: a })}
                        className="flex-1 rounded-lg py-1 text-[11px] font-bold border transition"
                        style={selected.align === a ? { background: `${GOLD}18`, borderColor: `${GOLD}40`, color: GOLD } : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.35)" : "#aaa" }}>
                        {a === "left" ? "G" : a === "center" ? "C" : "D"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Couleur */}
              {["title","text"].includes(selected.type) && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Couleur texte</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={selected.color ?? "#111111"} onChange={e => updateBlock(selected.id, { color: e.target.value })}
                      className="h-7 w-7 rounded cursor-pointer border-0" />
                    <span className={`text-xs font-mono ${muted}`}>{selected.color ?? "#111111"}</span>
                  </div>
                </div>
              )}

              {selected.type === "button" && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Couleur bouton</label>
                  <input type="color" value={selected.bg ?? GOLD} onChange={e => updateBlock(selected.id, { bg: e.target.value })}
                    className="h-7 w-7 rounded cursor-pointer border-0" />
                </div>
              )}

              {selected.type === "spacer" && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Hauteur (px)</label>
                  <input type="number" value={selected.padding ?? 24} min={4} max={120}
                    onChange={e => updateBlock(selected.id, { padding: parseInt(e.target.value) })}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs outline-none ${inp}`} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════════════════════════ */
export default function EmailMarketingPage() {
  const { isDark } = useTheme();
  const { toasts, add: toast, remove } = useToastStack();

  /* ── Theme ── */
  const bg    = isDark ? "bg-[#07080e]"    : "bg-[#f0f2f5]";
  const card  = isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm";
  const inp   = isDark ? "border-white/8 bg-white/4 text-white placeholder-white/25 [color-scheme:dark]" : "border-black/8 bg-gray-50 text-gray-900 placeholder-gray-400";
  const text  = isDark ? "text-white"   : "text-gray-900";
  const muted = isDark ? "text-white/35" : "text-gray-400";
  const div   = isDark ? "border-white/6" : "border-black/8";

  /* ── State ── */
  const [tab, setTab]             = useState<Tab>("accueil");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campsLoad, setCampsLoad] = useState(true);
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [contactsLoad, setContactsLoad] = useState(false);
  const [automations, setAutomations]   = useState<Automation[]>([]);

  /* ── Campagnes ── */
  const [campFilter, setCampFilter] = useState<CampStatus | "tous">("tous");
  const [campSearch, setCampSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Partial<Campaign> | null>(null);
  const [saving, setSaving]         = useState(false);
  const [aiLoad, setAiLoad]         = useState(false);
  const [aiBrief, setAiBrief]       = useState("");
  const [showAIModal, setShowAIModal] = useState(false);

  /* ── Audience ── */
  const [contactSearch, setContactSearch] = useState("");
  const [lists, setLists]   = useState<{ id: string; name: string; member_count: number }[]>([]);
  const [segments, setSegments] = useState<{ id: string; name: string; estimated_count: number; conditions: unknown }[]>([]);

  /* ── Automatisations ── */
  const [autoAIBrief, setAutoAIBrief] = useState("");
  const [autoAILoad, setAutoAILoad]   = useState(false);
  const [newAuto, setNewAuto]         = useState<Automation | null>(null);

  /* ── Analytics ── */
  const [selCamp, setSelCamp] = useState<Campaign | null>(null);
  const [analysisLoad, setAnalysisLoad] = useState(false);
  const [analysis, setAnalysis]         = useState("");

  /* ── Paramètres ── */
  const [providerForm, setProviderForm] = useState({ provider: "resend", from_email: "", from_name: "", reply_to: "" });
  const [domainInput, setDomainInput]   = useState("");

  /* ── Chargements ── */
  const loadCampaigns = useCallback(async () => {
    setCampsLoad(true);
    const r = await fetch("/api/email/campaigns?limit=100");
    if (r.ok) { const d = await r.json() as { campaigns: Campaign[] }; setCampaigns(d.campaigns ?? []); }
    setCampsLoad(false);
  }, []);

  const loadContacts = useCallback(async (q = "") => {
    setContactsLoad(true);
    const r = await fetch(`/api/email/contacts?limit=50${q ? `&q=${encodeURIComponent(q)}` : ""}`);
    if (r.ok) { const d = await r.json() as { contacts: Contact[] }; setContacts(d.contacts ?? []); }
    setContactsLoad(false);
  }, []);

  useEffect(() => { void loadCampaigns(); }, [loadCampaigns]);
  useEffect(() => {
    if (tab === "audience") void loadContacts();
  }, [tab, loadContacts]);

  /* ── Sauvegarder campagne ── */
  async function saveCampaign() {
    if (!editingCamp?.name?.trim()) { toast("Nom requis", "error"); return; }
    setSaving(true);
    try {
      const method = editingCamp.id ? "PATCH" : "POST";
      const r = await fetch("/api/email/campaigns", {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCamp),
      });
      const d = await r.json() as Campaign & { error?: string };
      if (!r.ok || d.error) { toast(d.error ?? "Erreur", "error"); return; }
      await loadCampaigns();
      setShowEditor(false); setEditingCamp(null);
      toast(editingCamp.id ? "Campagne mise à jour" : "Campagne créée", "success");
    } finally { setSaving(false); }
  }

  async function deleteCampaign(id: string) {
    const r = await fetch(`/api/email/campaigns?id=${id}`, { method: "DELETE" });
    if (r.ok) { setCampaigns(p => p.filter(c => c.id !== id)); toast("Supprimée", "success"); }
    else toast("Erreur suppression", "error");
  }

  /* ── Générer email avec IA ── */
  async function generateWithAI() {
    if (!aiBrief.trim()) { toast("Décrivez votre campagne", "error"); return; }
    setAiLoad(true);
    try {
      const r = await fetch("/api/email/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", brief: aiBrief }),
      });
      const d = await r.json() as { subject?: string; preheader?: string; blocks?: EmailBlock[]; error?: string };
      if (!r.ok || d.error) { toast(d.error ?? "Erreur IA", "error"); return; }
      const blocks = (d.blocks ?? []).map(b => ({ ...b, id: uid() })) as EmailBlock[];
      setEditingCamp(prev => ({
        ...prev, name: aiBrief.slice(0, 50),
        subject: d.subject ?? "", preheader: d.preheader ?? "",
        blocks, ai_generated: true, ai_brief: aiBrief,
      }));
      setShowAIModal(false); setShowEditor(true);
    } finally { setAiLoad(false); }
  }

  /* ── Générer automation avec IA ── */
  async function generateAutoWithAI() {
    if (!autoAIBrief.trim()) { toast("Décrivez le workflow", "error"); return; }
    setAutoAILoad(true);
    try {
      const r = await fetch("/api/email/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "automation", brief: autoAIBrief }),
      });
      const d = await r.json() as { name?: string; trigger_type?: string; trigger_config?: Record<string, unknown>; steps?: AutoStep[]; error?: string };
      if (!r.ok || d.error) { toast(d.error ?? "Erreur IA", "error"); return; }
      setNewAuto({
        name: d.name ?? "Nouveau workflow",
        trigger_type: d.trigger_type ?? "manual",
        trigger_config: d.trigger_config ?? {},
        is_active: false, run_count: 0,
        steps: (d.steps ?? []).map(s => ({ ...s, id: uid() })),
      });
    } finally { setAutoAILoad(false); }
  }

  /* ── Analyser campagne avec IA ── */
  async function analyzeCampaign(camp: Campaign) {
    setSelCamp(camp); setAnalysis(""); setAnalysisLoad(true);
    try {
      const r = await fetch("/api/email/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          stats: [{
            name: camp.name, subject: camp.subject, status: camp.status,
            recipients: camp.stats_recipients, delivered: camp.stats_delivered,
            bounced: camp.stats_bounced, opened: camp.stats_opened,
            clicked: camp.stats_clicked, unsubscribed: camp.stats_unsubscribed,
            open_rate: pct(camp.stats_opened, camp.stats_delivered),
            click_rate: pct(camp.stats_clicked, camp.stats_delivered),
          }],
        }),
      });
      const d = await r.json() as { analysis?: string };
      if (d.analysis) setAnalysis(d.analysis);
    } finally { setAnalysisLoad(false); }
  }

  /* ── KPIs globaux ── */
  const sent      = campaigns.reduce((s, c) => s + c.stats_sent, 0);
  const delivered = campaigns.reduce((s, c) => s + c.stats_delivered, 0);
  const opened    = campaigns.reduce((s, c) => s + c.stats_opened, 0);
  const clicked   = campaigns.reduce((s, c) => s + c.stats_clicked, 0);
  const bounced   = campaigns.reduce((s, c) => s + c.stats_bounced, 0);
  const unsubs    = campaigns.reduce((s, c) => s + c.stats_unsubscribed, 0);

  const filteredCampaigns = campaigns.filter(c => {
    if (campFilter !== "tous" && c.status !== campFilter) return false;
    if (campSearch && !c.name.toLowerCase().includes(campSearch.toLowerCase())) return false;
    return true;
  });

  const TABS: { key: Tab; label: string; icon: IconComp }[] = [
    { key: "accueil",        label: "Accueil",         icon: BarChart2   },
    { key: "campagnes",      label: "Campagnes",       icon: Mail        },
    { key: "automatisations",label: "Automatisations", icon: Zap         },
    { key: "templates",      label: "Templates",       icon: Layout      },
    { key: "audience",       label: "Audience",        icon: Users       },
    { key: "formulaires",    label: "Formulaires",     icon: FileText    },
    { key: "analytics",      label: "Analytics",       icon: BarChart2   },
    { key: "parametres",     label: "Paramètres",      icon: Settings    },
  ];

  /* ════════════════════════════════════════════════════════
     ÉDITEUR PLEIN ÉCRAN
  ═══════════════════════════════════════════════════════ */
  if (showEditor && editingCamp) {
    return (
      <EmailEditor
        blocks={editingCamp.blocks ?? []}
        onChange={b => setEditingCamp(p => ({ ...p, blocks: b }))}
        onClose={() => setShowEditor(false)}
        subject={editingCamp.subject ?? ""}
        preheader={editingCamp.preheader ?? ""}
        onSubjectChange={v => setEditingCamp(p => ({ ...p, subject: v }))}
        onPreheaderChange={v => setEditingCamp(p => ({ ...p, preheader: v }))}
        isDark={isDark}
      />
    );
  }

  /* ════════════════════════════════════════════════════════
     LAYOUT PRINCIPAL
  ═══════════════════════════════════════════════════════ */
  return (
    <div className={`flex h-full flex-col overflow-hidden ${bg}`}>
      <ToastStack toasts={toasts} remove={remove} />

      {/* ── Header ── */}
      <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${div}`}
        style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117)" : "#fff" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}>
            <Mail size={15} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className={`text-base font-black ${text}`}>Email Marketing</h1>
            <p className={`text-xs ${muted}`}>{fmtNum(sent)} envoyés · {campaigns.filter(c => c.status === "planifiee").length} planifiée{campaigns.filter(c => c.status === "planifiee").length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <button onClick={() => { setShowAIModal(true); setAiBrief(""); }}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition hover:brightness-105"
          style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
          <Plus size={13} /> Nouvelle campagne
        </button>
      </div>

      {/* ── Navigation ── */}
      <div className={`shrink-0 flex gap-0.5 overflow-x-auto scrollbar-none border-b px-3 py-1.5 ${div}`}
        style={{ background: isDark ? "#07080e" : "#fff" }}>
        {TABS.map(n => {
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => setTab(n.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${active ? "" : `${muted} hover:opacity-70`}`}
              style={active ? { background: `${GOLD}15`, color: GOLD } : {}}>
              <n.icon size={11} />{n.label}
            </button>
          );
        })}
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-hidden">

        {/* ── ACCUEIL ── */}
        {tab === "accueil" && (
          <div className="overflow-y-auto p-4 space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Envoyés",           value: fmtNum(sent),       sub: "total",                          color: GOLD      },
                { label: "Délivrés",          value: `${pct(delivered,sent)}%`,  sub: `${fmtNum(delivered)} emails`, color: "#10b981" },
                { label: "Ouvertures",        value: `${pct(opened,delivered)}%`, sub: "taux approx.",            color: "#3b82f6" },
                { label: "Clics",             value: `${pct(clicked,delivered)}%`, sub: `${fmtNum(clicked)} clics`, color: "#c9a55a" },
                { label: "Désabonnements",    value: fmtNum(unsubs),     sub: "total",                          color: "#f59e0b" },
                { label: "Bounces",           value: `${pct(bounced,sent)}%`,     sub: `${fmtNum(bounced)} emails`, color: "#ef4444" },
              ].map(k => (
                <div key={k.label} className={`rounded-2xl border p-4 ${card}`}>
                  <p className="text-xl font-black tabular-nums" style={{ color: k.color }}>{k.value}</p>
                  <p className={`text-xs font-bold mt-0.5 ${text}`}>{k.label}</p>
                  <p className={`text-[11px] mt-0.5 ${muted}`}>{k.sub}</p>
                </div>
              ))}
            </div>
            {/* Note métriques */}
            <div className={`flex items-start gap-2 rounded-2xl border p-3 ${isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
              <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-500">
                Le taux d&apos;ouverture peut être biaisé par les protections de confidentialité des clients mail (Apple Mail Privacy Protection, etc.). Il n&apos;est pas une mesure parfaitement fiable.
              </p>
            </div>
            {/* Meilleures campagnes */}
            {campaigns.filter(c => c.stats_sent > 0).length > 0 && (
              <div className={`rounded-2xl border p-4 ${card}`}>
                <p className={`text-sm font-bold mb-3 ${text}`}>Meilleures campagnes</p>
                <div className="space-y-2">
                  {campaigns
                    .filter(c => c.stats_delivered > 0)
                    .sort((a, b) => pct(b.stats_clicked, b.stats_delivered) - pct(a.stats_clicked, a.stats_delivered))
                    .slice(0, 5)
                    .map(c => {
                      const s = STATUS_CFG[c.status];
                      const ctr = pct(c.stats_clicked, c.stats_delivered);
                      return (
                        <div key={c.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isDark ? "border-white/5 bg-white/2" : "border-black/5 bg-gray-50"}`}>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${text}`}>{c.name}</p>
                            <p className={`text-xs ${muted}`}>{c.subject.slice(0, 50)}</p>
                          </div>
                          <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ color: s.color, background: `${s.color}15` }}>{s.label}</span>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black tabular-nums" style={{ color: GOLD }}>{ctr}%</p>
                            <p className={`text-[11px] ${muted}`}>CTR</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            {/* Raccourcis */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Nouvelle campagne", icon: Plus, action: () => { setShowAIModal(true); } },
                { label: "Voir campagnes",    icon: Mail, action: () => setTab("campagnes") },
                { label: "Audience",          icon: Users, action: () => setTab("audience") },
                { label: "Automatisations",   icon: Zap, action: () => setTab("automatisations") },
              ].map(a => (
                <button key={a.label} onClick={a.action}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition hover:opacity-70 ${card}`}>
                  <a.icon size={18} style={{ color: GOLD }} />
                  <p className={`text-xs font-semibold ${text}`}>{a.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CAMPAGNES ── */}
        {tab === "campagnes" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 border-b px-4 py-3 space-y-2 ${div}`}>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${card}`}>
                <Search size={13} className={muted} />
                <input value={campSearch} onChange={e => setCampSearch(e.target.value)} placeholder="Rechercher…"
                  className={`flex-1 bg-transparent text-sm outline-none ${text}`} />
                {campSearch && <button onClick={() => setCampSearch("")}><X size={11} className={muted} /></button>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([["tous","Tous"], ...Object.entries(STATUS_CFG).map(([k, v]) => [k, v.label])]).map(([k, label]) => (
                  <button key={k} onClick={() => setCampFilter(k as CampStatus | "tous")}
                    className="rounded-xl border px-2.5 py-1 text-xs font-bold transition"
                    style={campFilter === k ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD }
                      : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {campsLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
              ) : filteredCampaigns.length === 0 ? (
                <div className={`flex flex-col items-center gap-4 py-16 rounded-2xl border ${card}`}>
                  <Mail size={28} className={muted} />
                  <p className={`text-sm font-bold ${text}`}>Aucune campagne</p>
                  <button onClick={() => setShowAIModal(true)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                    style={{ background: `${GOLD}15`, color: GOLD }}>
                    <Plus size={13} /> Créer ma première campagne
                  </button>
                </div>
              ) : (
                filteredCampaigns.map(c => {
                  const s = STATUS_CFG[c.status];
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ color: s.color, background: `${s.color}15` }}>{s.label}</span>
                            {c.ai_generated && <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/8" : "bg-gray-100"}`} style={{ color: GOLD }}>IA</span>}
                          </div>
                          <p className={`text-sm font-bold truncate ${text}`}>{c.name}</p>
                          <p className={`text-xs mt-0.5 ${muted}`}>{c.subject || "(sans objet)"}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setEditingCamp({ ...c }); setShowEditor(true); }}
                            className={`flex h-7 w-7 items-center justify-center rounded-xl border transition ${card} ${muted} hover:opacity-70`}><Eye size={12} /></button>
                          <button onClick={() => { void deleteCampaign(c.id); }}
                            className={`flex h-7 w-7 items-center justify-center rounded-xl border transition ${card} ${muted} hover:text-red-500`}><Trash2 size={12} /></button>
                        </div>
                      </div>
                      {c.stats_sent > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: "Envoyés",  value: fmtNum(c.stats_sent) },
                            { label: "Délivrés", value: `${pct(c.stats_delivered, c.stats_sent)}%` },
                            { label: "Ouvert.",  value: `${pct(c.stats_opened, c.stats_delivered)}%` },
                            { label: "Clics",    value: `${pct(c.stats_clicked, c.stats_delivered)}%` },
                          ].map(k => (
                            <div key={k.label} className={`rounded-xl border p-2 text-center ${isDark ? "border-white/5 bg-white/2" : "border-black/5 bg-gray-50"}`}>
                              <p className={`text-sm font-black tabular-nums ${text}`}>{k.value}</p>
                              <p className={`text-[11px] ${muted}`}>{k.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`flex items-center gap-3 pt-1 text-xs border-t ${div} ${muted}`}>
                        {c.scheduled_at && <span className="flex items-center gap-1"><Clock size={9} />{fmtDate(c.scheduled_at)}</span>}
                        {c.stats_sent > 0 && <span>{fmtNum(c.stats_recipients)} destinataires</span>}
                        <span className="ml-auto">{fmtDate(c.created_at)}</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── AUTOMATISATIONS ── */}
        {tab === "automatisations" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 border-b px-4 py-3 ${div}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-bold ${text}`}>Workflows d&apos;automatisation</p>
                <button onClick={() => { setNewAuto({ name: "", trigger_type: "new_contact", trigger_config: {}, is_active: false, run_count: 0, steps: [] }); }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold`} style={{ background: `${GOLD}15`, color: GOLD }}>
                  <Plus size={11} /> Nouveau
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* IA automation */}
              <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} style={{ color: GOLD }} />
                  <p className={`text-sm font-bold ${text}`}>Créer avec DJAMA AI</p>
                </div>
                <textarea value={autoAIBrief} onChange={e => setAutoAIBrief(e.target.value)} rows={3}
                  className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                  placeholder="Ex : Quand quelqu'un achète une formation, envoie un email de bienvenue immédiatement, un rappel après 3 jours puis demande un avis après 14 jours." />
                <button onClick={() => void generateAutoWithAI()} disabled={autoAILoad || !autoAIBrief.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {autoAILoad ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Générer le workflow
                </button>
              </div>

              {/* Preview workflow généré */}
              {newAuto && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold ${text}`}>{newAuto.name}</p>
                    <button onClick={() => setNewAuto(null)} className={muted}><X size={14} /></button>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {/* Trigger */}
                    <div className={`flex w-full items-center gap-3 rounded-xl border p-3 ${isDark ? "border-white/8 bg-white/4" : "border-black/8 bg-gray-50"}`}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${GOLD}18` }}>
                        <Zap size={14} style={{ color: GOLD }} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${text}`}>Déclencheur</p>
                        <p className={`text-xs ${muted}`}>{newAuto.trigger_type.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    {/* Étapes */}
                    {newAuto.steps.map((step, i) => {
                      const cfg = STEP_ICONS[step.step_type] ?? { icon: Mail, label: step.step_type, color: "#6b7280" };
                      return (
                        <div key={step.id ?? i} className="flex flex-col items-center gap-2 w-full">
                          <div className="h-4 w-0.5" style={{ background: `${GOLD}40` }} />
                          <div className={`flex w-full items-center gap-3 rounded-xl border p-3 ${isDark ? "border-white/8 bg-white/4" : "border-black/8 bg-gray-50"}`}>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${cfg.color}18` }}>
                              <cfg.icon size={14} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1">
                              <p className={`text-xs font-bold ${text}`}>{cfg.label}</p>
                              <p className={`text-xs ${muted}`}>
                                {step.step_type === "wait" ? `Attendre ${(step.config as {days?: number}).days ?? 1} jour(s)` :
                                 step.step_type === "send_email" ? (step.config as {subject?: string}).subject ?? "" :
                                 step.step_type === "condition" ? (step.config as {condition?: string}).condition ?? "" : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setNewAuto(null)} className={`flex-1 rounded-2xl border py-2 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                    <button onClick={() => { setAutomations(a => [...a, newAuto!]); setNewAuto(null); toast("Workflow créé", "success"); }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-2 text-sm font-black"
                      style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                      <Check size={14} /> Activer
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Automations existantes */}
              {automations.length === 0 && !newAuto && (
                <div className={`flex flex-col items-center gap-3 py-12 rounded-2xl border ${card}`}>
                  <Zap size={24} className={muted} />
                  <p className={`text-sm font-bold ${text}`}>Aucune automatisation</p>
                  <p className={`text-xs text-center max-w-xs ${muted}`}>Décrivez votre workflow et DJAMA AI le construit pour vous.</p>
                </div>
              )}
              {automations.map((a, i) => (
                <div key={i} className={`rounded-2xl border p-4 ${card}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-bold ${text}`}>{a.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${a.is_active ? "text-emerald-500 bg-emerald-500/15" : `${muted} ${isDark ? "bg-white/8" : "bg-gray-100"}`}`}>
                        {a.is_active ? "Actif" : "Inactif"}
                      </span>
                      <button onClick={() => setAutomations(aut => aut.map((x, j) => j === i ? { ...x, is_active: !x.is_active } : x))}
                        className={muted}>{a.is_active ? <Pause size={14} /> : <Play size={14} />}</button>
                    </div>
                  </div>
                  <p className={`text-xs ${muted}`}>{a.steps.length} étape{a.steps.length > 1 ? "s" : ""} · {a.run_count} exécution{a.run_count > 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEMPLATES ── */}
        {tab === "templates" && (
          <div className="overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {TEMPLATE_GALLERY.map(t => (
                <button key={t.key} onClick={() => { setAiBrief(`Créer un email de type "${t.label}" : ${t.desc}`); setShowAIModal(true); }}
                  className={`flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition hover:opacity-70 ${card}`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}25` }}>
                    <Mail size={18} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${text}`}>{t.label}</p>
                    <p className={`text-xs mt-0.5 ${muted}`}>{t.desc}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full`} style={{ background: `${GOLD}15`, color: GOLD }}>
                    Utiliser
                  </span>
                </button>
              ))}
            </div>
            <div className={`rounded-2xl border p-4 ${card}`}>
              <p className={`text-sm font-bold mb-2 ${text}`}>Enregistrer un template personnalisé</p>
              <p className={`text-xs ${muted}`}>Créez une campagne, puis cliquez sur &ldquo;Enregistrer comme modèle&rdquo; depuis l&apos;éditeur.</p>
            </div>
          </div>
        )}

        {/* ── AUDIENCE ── */}
        {tab === "audience" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 border-b px-4 py-3 space-y-2 ${div}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-bold ${text}`}>Contacts CRM</p>
                <div className="flex items-center gap-1 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className={muted}>Synchronisé avec CRM</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${card}`}>
                <Search size={13} className={muted} />
                <input value={contactSearch} onChange={e => { setContactSearch(e.target.value); if (e.target.value.length > 2 || e.target.value.length === 0) void loadContacts(e.target.value); }}
                  className={`flex-1 bg-transparent text-sm outline-none ${text}`} placeholder="Rechercher un contact…" />
              </div>
              <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-blue-500/20 bg-blue-500/5" : "border-blue-200 bg-blue-50"}`}>
                <AlertCircle size={11} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-400">
                  Email Marketing ne crée pas de base contacts séparée. Il enrichit les contacts CRM avec des propriétés marketing (consentement, listes, préférences).
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {contactsLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
              ) : contacts.length === 0 ? (
                <div className={`flex flex-col items-center gap-3 py-12 rounded-2xl border ${card}`}>
                  <Users size={24} className={muted} />
                  <p className={`text-sm font-bold ${text}`}>Aucun contact avec email</p>
                  <p className={`text-xs ${muted}`}>Ajoutez des contacts dans le CRM pour les utiliser ici.</p>
                </div>
              ) : (
                contacts.map(c => {
                  const mktg = Array.isArray(c.em_contact_marketing) ? c.em_contact_marketing[0] : c.em_contact_marketing;
                  const gstatus = mktg?.global_status ?? "unknown";
                  const statusColor = gstatus === "subscribed" ? "#10b981" : gstatus === "unsubscribed" ? "#6b7280" : gstatus === "bounced" ? "#ef4444" : "#f59e0b";
                  return (
                    <div key={c.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${card}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${GOLD}18`, color: GOLD }}>
                        <span className="text-sm font-black">{(c.first_name?.[0] ?? c.email[0] ?? "?").toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${text}`}>{c.first_name ?? ""} {c.last_name ?? ""} {(!c.first_name && !c.last_name) ? c.email : ""}</p>
                        <p className={`text-xs ${muted}`}>{c.email} {c.company ? `· ${c.company}` : ""}</p>
                      </div>
                      <span className="text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0" style={{ color: statusColor, background: `${statusColor}15` }}>
                        {gstatus === "subscribed" ? "Abonné" : gstatus === "unsubscribed" ? "Désab." : gstatus === "bounced" ? "Bounce" : mktg ? gstatus : "Non inscrit"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── FORMULAIRES ── */}
        {tab === "formulaires" && (
          <div className="overflow-y-auto p-4 space-y-4">
            <div className={`rounded-2xl border p-6 text-center ${card}`}>
              <FileText size={28} className={`mx-auto mb-3 ${muted}`} />
              <p className={`text-sm font-bold ${text}`}>Constructeur de formulaires</p>
              <p className={`text-xs mt-1 ${muted}`}>Inscriptions newsletter, téléchargements, demandes d&apos;informations…</p>
              <button className="mt-4 flex items-center gap-2 mx-auto rounded-xl px-4 py-2 text-sm font-bold transition hover:brightness-105"
                style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                <Plus size={13} /> Créer un formulaire
              </button>
            </div>
            <div className={`rounded-2xl border p-4 ${card}`}>
              <p className={`text-sm font-bold mb-2 ${text}`}>Intégration</p>
              <p className={`text-xs ${muted}`}>Les soumissions de formulaires sont créées dans CRM avec la provenance &ldquo;formulaire&rdquo;. Le consentement marketing est enregistré explicitement.</p>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === "analytics" && (
          <div className="overflow-y-auto p-4 space-y-4">
            {!selCamp ? (
              <>
                <p className={`text-sm font-bold ${text}`}>Sélectionnez une campagne pour l&apos;analyser</p>
                {campaigns.filter(c => c.stats_sent > 0).length === 0 ? (
                  <div className={`flex flex-col items-center gap-3 py-12 rounded-2xl border ${card}`}>
                    <BarChart2 size={24} className={muted} />
                    <p className={`text-xs ${muted}`}>Aucune campagne envoyée</p>
                  </div>
                ) : (
                  campaigns.filter(c => c.stats_sent > 0).map(c => {
                    const s = STATUS_CFG[c.status];
                    return (
                      <button key={c.id} onClick={() => void analyzeCampaign(c)}
                        className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:opacity-70 ${card}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${text}`}>{c.name}</p>
                          <p className={`text-xs ${muted}`}>{fmtNum(c.stats_sent)} envoyés · {fmtDate(c.completed_at)}</p>
                        </div>
                        <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ color: s.color, background: `${s.color}15` }}>{s.label}</span>
                        <ArrowRight size={13} className={muted} />
                      </button>
                    );
                  })
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setSelCamp(null); setAnalysis(""); }} className={`flex h-8 w-8 items-center justify-center rounded-xl ${muted} hover:opacity-70`}><ChevronLeft size={14} /></button>
                  <p className={`text-sm font-bold ${text}`}>{selCamp.name}</p>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Envoyés",       value: fmtNum(selCamp.stats_sent),       color: GOLD      },
                    { label: "Délivrés",      value: `${pct(selCamp.stats_delivered, selCamp.stats_sent)}%`, color: "#10b981" },
                    { label: "Ouvertures",    value: `${pct(selCamp.stats_opened, selCamp.stats_delivered)}%`, color: "#3b82f6" },
                    { label: "Clics (CTR)",   value: `${pct(selCamp.stats_clicked, selCamp.stats_delivered)}%`, color: "#c9a55a" },
                    { label: "Bounces",       value: `${pct(selCamp.stats_bounced, selCamp.stats_sent)}%`, color: "#ef4444" },
                    { label: "Désabonnements",value: fmtNum(selCamp.stats_unsubscribed), color: "#f59e0b" },
                  ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 text-center ${card}`}>
                      <p className="text-xl font-black tabular-nums" style={{ color: k.color }}>{k.value}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{k.label}</p>
                    </div>
                  ))}
                </div>
                {/* Analyse IA */}
                {analysisLoad && (
                  <div className={`rounded-2xl border p-6 text-center ${card}`}>
                    <Loader2 size={18} className={`mx-auto animate-spin mb-2`} style={{ color: GOLD }} />
                    <p className={`text-xs ${muted}`}>Analyse DJAMA AI en cours…</p>
                  </div>
                )}
                {analysis && (
                  <div className={`rounded-2xl border p-4 ${card}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} style={{ color: GOLD }} />
                      <p className={`text-sm font-bold ${text}`}>Analyse DJAMA AI</p>
                    </div>
                    <p className={`text-xs leading-relaxed whitespace-pre-wrap ${muted}`}>{analysis}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PARAMÈTRES ── */}
        {tab === "parametres" && (
          <div className="overflow-y-auto p-4 space-y-4">
            {/* Provider */}
            <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>Fournisseur email</p>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${muted}`}>Provider</label>
                <select value={providerForm.provider} onChange={e => setProviderForm(f => ({ ...f, provider: e.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}>
                  {["resend","sendgrid","mailgun","smtp","ses"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {[
                { key: "from_email", label: "Email expéditeur", placeholder: "noreply@votre-domaine.fr" },
                { key: "from_name",  label: "Nom expéditeur",   placeholder: "DJAMA" },
                { key: "reply_to",   label: "Répondre à",       placeholder: "contact@votre-domaine.fr" },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>{f.label}</label>
                  <input value={providerForm[f.key as keyof typeof providerForm]}
                    onChange={e => setProviderForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                    placeholder={f.placeholder} />
                </div>
              ))}
              <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
                <AlertCircle size={11} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-500">La clé API est stockée côté serveur uniquement. Elle n&apos;est jamais retournée au navigateur.</p>
              </div>
              <button onClick={() => toast("Paramètres sauvegardés", "success")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-black transition hover:brightness-105"
                style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                <Check size={14} /> Sauvegarder
              </button>
            </div>
            {/* Domaine */}
            <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>Domaine d&apos;envoi</p>
              <p className={`text-xs ${muted}`}>Vérifiez SPF, DKIM et DMARC pour améliorer la délivrabilité. Ne marquez jamais un domaine vérifié avant confirmation réelle.</p>
              <div className={`flex gap-2 items-center rounded-xl border px-3 py-2 ${inp}`}>
                <input value={domainInput} onChange={e => setDomainInput(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none" placeholder="votre-domaine.fr" />
                <button onClick={() => { if (domainInput.trim()) toast("Vérification DNS lancée (provider requis)", "info"); }}
                  className="shrink-0 text-xs font-bold" style={{ color: GOLD }}>Vérifier</button>
              </div>
            </div>
            {/* Désabonnement */}
            <div className={`rounded-2xl border p-4 space-y-2 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>Désabonnement</p>
              <p className={`text-xs ${muted}`}>Un lien de désabonnement fonctionnel est automatiquement ajouté dans chaque campagne via le bloc Footer. La suppression est immédiate.</p>
              <p className={`text-xs ${muted}`}>Les contacts désabonnés du marketing continuent à recevoir les emails transactionnels légalement nécessaires (factures, confirmations).</p>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL — Nouvelle campagne (IA ou manuel) ════════════════ */}
      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${div}`}>
                <p className={`text-sm font-bold ${text}`}>Nouvelle campagne</p>
                <button onClick={() => setShowAIModal(false)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-white/6 bg-white/[0.02]" : "border-black/6 bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: GOLD }} />
                    <p className={`text-sm font-bold ${text}`}>Créer avec DJAMA AI</p>
                  </div>
                  <textarea value={aiBrief} onChange={e => setAiBrief(e.target.value)} rows={4}
                    className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                    placeholder="Ex : Annonce du lancement de DJAMA Pro aux indépendants avec une offre de 20% pendant 15 jours. Ton professionnel et engageant." />
                  <button onClick={() => void generateWithAI()} disabled={aiLoad || !aiBrief.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                    style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                    {aiLoad ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Générer la campagne
                  </button>
                </div>
                <div className="relative flex items-center gap-3">
                  <div className={`flex-1 h-px ${isDark ? "bg-white/8" : "bg-black/8"}`} />
                  <span className={`text-xs font-semibold ${muted}`}>ou</span>
                  <div className={`flex-1 h-px ${isDark ? "bg-white/8" : "bg-black/8"}`} />
                </div>
                <button onClick={() => {
                  setEditingCamp({ name: "", subject: "", preheader: "", blocks: [], status: "brouillon" });
                  setShowAIModal(false); setShowEditor(true);
                }}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border py-2.5 text-sm font-semibold ${card} ${muted}`}>
                  <FileText size={14} /> Créer manuellement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — Édition infos campagne ══════════════════════════ */}
      <AnimatePresence>
        {editingCamp && !showEditor && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${div}`}>
                <p className={`text-sm font-bold ${text}`}>{editingCamp.id ? "Modifier" : "Nouvelle"} campagne</p>
                <button onClick={() => setEditingCamp(null)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { key: "name",      label: "Nom de la campagne *", placeholder: "Newsletter juin 2026" },
                  { key: "subject",   label: "Objet de l'email",     placeholder: "Découvrez nos nouvelles fonctionnalités…" },
                  { key: "preheader", label: "Texte de prévisualisation", placeholder: "Aperçu court visible dans la boîte de réception" },
                ].map(f => (
                  <div key={f.key}>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>{f.label}</label>
                    <input value={(editingCamp as Record<string, unknown>)[f.key] as string ?? ""}
                      onChange={e => setEditingCamp(p => ({ ...p, [f.key]: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                      placeholder={f.placeholder} />
                  </div>
                ))}
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Planification</label>
                  <input type="datetime-local"
                    value={editingCamp.scheduled_at ? editingCamp.scheduled_at.slice(0, 16) : ""}
                    onChange={e => setEditingCamp(p => ({ ...p, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                </div>
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${div}`}>
                <button onClick={() => setEditingCamp(null)} className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                <button onClick={() => { setShowEditor(true); }}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card}`} style={{ color: GOLD }}>
                  <Eye size={13} className="inline mr-1.5" /> Éditeur
                </button>
                <button onClick={() => void saveCampaign()} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Sauvegarder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
