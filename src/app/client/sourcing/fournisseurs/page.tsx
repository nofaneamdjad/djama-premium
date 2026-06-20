"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Factory, Search, Brain, Globe, Package,
  Download, ChevronRight, ChevronLeft, Check, Loader2,
  AlertTriangle, Star, Shield, Clock, TrendingUp,
  Euro, Award, Sparkles, Copy, RefreshCw, Target,
  BookOpen, Zap, FileCheck, ClipboardList, FileText,
  MessageSquare, BarChart3, Truck, Map, ShoppingBag,
  CheckCircle2, Info, ExternalLink, Flag, ChevronDown,
  Pencil, RotateCcw, X as XIcon, Save,
  Mail, Phone, MessageCircle, BadgeCheck,
} from "lucide-react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface SearchRequest {
  produit: string;
  quantite: string;
  budget: string;
  pays_cible: string;
  pays_utilisateur: string;
  delai: string;
  qualite: string;
  type_produit: string;
  criteres_speciaux: string;
}

interface Supplier {
  id: string;
  nom: string;
  pays: string;
  ville: string;
  plateforme: string;
  url?: string;
  site_web?: string;
  prix_unite: string;
  moq: string;
  delai_fab: string;
  delai_transport: string;
  niveau_confiance: number;
  certifications: string[];
  avantages: string[];
  inconvenients: string[];
  risques: string[];
  description: string;
}

interface PaysCom {
  pays: string;
  score: number;
  raison: string;
  prix_moyen: string;
  delai_moyen: string;
}

interface SearchResult {
  suppliers: Supplier[];
  pays_recommandes: PaysCom[];
  analyse_marche: {
    prix_marche_fr: string;
    prix_import_estime: string;
    marge_potentielle: string;
    concurrence: string;
    tendances: string;
    conseils_marche: string;
  };
  logistique: {
    fret_aerien: { prix_estime: string; delai: string; seuil_recommande: string; transporteurs: string[] };
    fret_maritime: { prix_estime: string; delai: string; seuil_recommande: string; transporteurs: string[] };
    douanes: { taux_droits: string; tva_import: string; documents_requis: string[]; code_taric: string; montant_estime: string };
    cout_total_estime: string;
  };
  risques_globaux: string[];
  recommandation: string;
  sources_recherchees: string[];
}

interface GeneratedDoc {
  id: string;
  title: string;
  content: string;
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const blue = "#60a5fa";
const emerald = "#34d399";
const amber = "#f59e0b";
const indigo = "#818cf8";

const STEPS = [
  { id: 1, icon: Target, short: "Besoin" },
  { id: 2, icon: Search, short: "Recherche" },
  { id: 3, icon: Factory, short: "Fournisseurs" },
  { id: 4, icon: Truck, short: "Logistique" },
  { id: 5, icon: FileText, short: "Documents" },
  { id: 6, icon: Download, short: "Export" },
];

const QUALITE_OPTIONS = [
  { id: "economique", label: "Économique", desc: "Prix bas, qualité basique" },
  { id: "standard", label: "Standard", desc: "Bon rapport qualité/prix" },
  { id: "premium", label: "Premium", desc: "Haute qualité, certifications" },
];

const TYPE_OPTIONS = [
  { id: "generique", label: "Produit générique", desc: "Pas de personnalisation" },
  { id: "marque_propre", label: "Marque propre (OEM)", desc: "Avec mon logo/branding" },
  { id: "oem_odm", label: "Design sur mesure (ODM)", desc: "Produit modifié ou créé" },
];

const PAYS_OPTIONS = [
  "Chine", "Inde", "Turquie", "Vietnam", "Bangladesh",
  "Maroc", "Tunisie", "Europe", "USA", "International (optimiser)",
];

const PAYS_UTILISATEUR_GROUPS = [
  {
    groupe: "France",
    options: ["France métropolitaine"],
  },
  {
    groupe: "DOM-TOM / DROM-COM",
    options: [
      "Mayotte", "La Réunion", "Guadeloupe", "Martinique",
      "Guyane", "Saint-Martin", "Saint-Barthélemy",
      "Saint-Pierre-et-Miquelon", "Polynésie française",
      "Nouvelle-Calédonie", "Wallis-et-Futuna",
    ],
  },
  {
    groupe: "Afrique francophone",
    options: [
      "Sénégal", "Côte d'Ivoire", "Cameroun", "Madagascar",
      "Mali", "Burkina Faso", "Bénin", "Togo", "Niger",
      "Tchad", "Congo-Brazzaville", "RD Congo", "Gabon",
      "Maroc", "Algérie", "Tunisie", "Mauritanie",
    ],
  },
  {
    groupe: "Europe / Amériques / Autres",
    options: [
      "Belgique", "Suisse", "Luxembourg", "Monaco",
      "Canada (Québec)", "Haïti", "Maurice", "Comores", "Autre",
    ],
  },
];

const ALL_PAYS_UTILISATEUR = PAYS_UTILISATEUR_GROUPS.flatMap(g => g.options);

const DELAI_OPTIONS = [
  "Urgent (< 30 jours)", "Normal (1-2 mois)", "Long terme (3-6 mois)", "Flexible",
];

const DOC_OPTIONS = [
  { id: "rfq_fr", label: "Email RFQ (Français)", icon: FileText, desc: "Demande de devis professionnelle" },
  { id: "rfq_en", label: "Email RFQ (English)", icon: FileText, desc: "Request for Quotation in English" },
  { id: "whatsapp_fr", label: "Message WhatsApp (FR)", icon: MessageSquare, desc: "Message court et percutant" },
  { id: "whatsapp_en", label: "WhatsApp Message (EN)", icon: MessageSquare, desc: "Short professional message" },
  { id: "negociation", label: "Stratégie de négociation", icon: Target, desc: "Script et tactiques d'achat" },
  { id: "contrat", label: "Contrat fournisseur", icon: Shield, desc: "Template contrat d'achat" },
  { id: "cahier_charges", label: "Cahier des charges", icon: ClipboardList, desc: "Spécifications produit détaillées" },
  { id: "tableau_comparatif", label: "Tableau comparatif", icon: BarChart3, desc: "Comparaison fournisseurs" },
  { id: "questions_fournisseur", label: "Questions clés", icon: Zap, desc: "Liste questions à poser" },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/* ─────────────────────────────────────────────────────────
   TERRITOIRE DROPDOWN (custom — 100% dark)
───────────────────────────────────────────────────────── */
function TerritoireDropdown({
  value,
  onChange,
  groups,
}: {
  value: string;
  onChange: (v: string) => void;
  groups: { groupe: string; options: string[] }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[0.85rem] outline-none transition text-left"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(96,165,250,0.6)" : "rgba(96,165,250,0.25)"}`,
          color: value ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
        }}
      >
        <span>{value || "Sélectionner votre territoire..."}</span>
        <ChevronDown
          size={15}
          className="shrink-0 transition-transform"
          style={{
            color: "rgba(96,165,250,0.6)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              background: "#0d1117",
              border: "1px solid rgba(96,165,250,0.2)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
              transformOrigin: "top",
            }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl overflow-hidden max-h-72 overflow-y-auto"
          >
            {groups.map(g => (
              <div key={g.groupe}>
                {/* Group header */}
                <div
                  className="px-3.5 py-2 text-[0.62rem] font-black uppercase tracking-widest"
                  style={{
                    color: "rgba(96,165,250,0.5)",
                    background: "rgba(96,165,250,0.04)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {g.groupe}
                </div>
                {/* Options */}
                {g.options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[0.83rem] transition-colors"
                    style={{
                      background: value === opt ? "rgba(96,165,250,0.10)" : "transparent",
                      color: value === opt ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.62)",
                    }}
                    onMouseEnter={e => {
                      if (value !== opt) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={e => {
                      if (value !== opt) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {value === opt && (
                      <Check size={12} style={{ color: "#60a5fa", flexShrink: 0 }} />
                    )}
                    {value !== opt && <span className="w-3 shrink-0" />}
                    {opt}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CARD
───────────────────────────────────────────────────────── */
function Card({ children, className = "", accent }: { children: React.ReactNode; className?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`}
      style={{
        background: accent ? "rgba(96,165,250,0.04)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${accent ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.07)"}`,
      }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CONFIDENCE RING
───────────────────────────────────────────────────────── */
function ConfidenceRing({ value, size = 48 }: { value: number; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  const color = value >= 75 ? emerald : value >= 50 ? amber : "#ef4444";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[0.6rem] font-black text-white">{value}%</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────────────────── */
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto scrollbar-none py-1">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={{
                  background: done ? "rgba(96,165,250,0.9)" : active ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.05)",
                  border: active ? "1.5px solid rgba(96,165,250,0.7)" : done ? "none" : "1px solid rgba(255,255,255,0.09)",
                  color: done ? "#fff" : active ? blue : "rgba(255,255,255,0.3)",
                }}>
                {done ? <Check size={13} /> : <Icon size={13} />}
              </div>
              <span className="text-[0.6rem] font-semibold hidden sm:block"
                style={{ color: active ? blue : done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)" }}>
                {step.short}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-1.5 h-[1px] w-5 sm:w-9 shrink-0"
                style={{ background: done ? "rgba(96,165,250,0.6)" : "rgba(255,255,255,0.07)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FIELD
───────────────────────────────────────────────────────── */
function Field({ label, value, onChange, placeholder = "", required = false, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.72rem] font-semibold text-white/50 uppercase tracking-wider">
        {label}{required && <span className="ml-1 text-blue-400">*</span>}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="rounded-xl px-3.5 py-2.5 text-[0.85rem] text-white/85 placeholder:text-white/22 outline-none transition"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(96,165,250,0.5)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")} />
      {hint && <p className="text-[0.67rem] text-white/30">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.72rem] font-semibold text-white/50 uppercase tracking-wider">
        {label}{required && <span className="ml-1 text-blue-400">*</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="rounded-xl px-3.5 py-2.5 text-[0.85rem] text-white/75 outline-none transition"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <option value="">Sélectionner...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────── */
export default function FournisseursPage() {
  const [step, setStep] = useState(1);

  /* Form */
  const [request, setRequest] = useState<SearchRequest>({
    produit: "", quantite: "", budget: "", pays_cible: "",
    pays_utilisateur: "", delai: "", qualite: "standard",
    type_produit: "generique", criteres_speciaux: "",
  });

  /* Search */
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  /* Docs */
  const [selectedDocs, setSelectedDocs] = useState<string[]>(DOC_OPTIONS.map(d => d.id));
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeDocTab, setActiveDocTab] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  useEffect(() => { setEditingDocId(null); setEditContent(""); }, [activeDocTab]);

  const update = (field: keyof SearchRequest) => (val: string) =>
    setRequest(r => ({ ...r, [field]: val }));

  /* ── Search ── */
  const runSearch = async () => {
    if (!request.produit.trim()) return;
    setSearching(true);
    setSearchError(null);
    setStep(2);
    try {
      const res = await fetch("/api/sourcing/fournisseurs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setSearchResult(data as SearchResult);
      setStep(3);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Erreur inconnue");
      setStep(1);
    } finally {
      setSearching(false);
    }
  };

  /* ── Generate docs ── */
  const runGenerate = async () => {
    if (!searchResult) return;
    setGenerating(true);
    setGenerateError(null);
    setStep(5);
    try {
      const res = await fetch("/api/sourcing/fournisseurs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request,
          searchResult,
          selectedDocs,
          selectedSupplier: selectedSupplierId
            ? searchResult.suppliers.find(s => (s.id || String(searchResult.suppliers.indexOf(s))) === selectedSupplierId) ?? null
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setGeneratedDocs(data.documents || []);
      if (data.documents?.length) setActiveDocTab(data.documents[0].id);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Erreur inconnue");
      setStep(4);
    } finally {
      setGenerating(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setRequest({ produit: "", quantite: "", budget: "", pays_cible: "", pays_utilisateur: "", delai: "", qualite: "standard", type_produit: "generique", criteres_speciaux: "" });
    setSearchResult(null);
    setSearchError(null);
    setGeneratedDocs([]);
    setGenerateError(null);
    setSelectedDocs(DOC_OPTIONS.map(d => d.id));
    setActiveDocTab("");
    setEditingDocId(null);
    setEditContent("");
    setSelectedSupplierId(null);
  };

  const startEdit = (doc: GeneratedDoc) => {
    setEditingDocId(doc.id);
    setEditContent(doc.content);
  };

  const saveEdit = () => {
    setGeneratedDocs(prev => prev.map(d => d.id === editingDocId ? { ...d, content: editContent } : d));
    setEditingDocId(null);
  };

  const cancelEdit = () => {
    setEditingDocId(null);
    setEditContent("");
  };

  const [regeneratingDocId, setRegeneratingDocId] = useState<string | null>(null);

  const regenerateDoc = async (docId: string) => {
    if (!searchResult) return;
    setRegeneratingDocId(docId);
    try {
      const res = await fetch("/api/sourcing/fournisseurs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request, searchResult, selectedDocs: [docId],
          selectedSupplier: selectedSupplierId
            ? searchResult.suppliers.find(s => (s.id || String(searchResult.suppliers.indexOf(s))) === selectedSupplierId) ?? null
            : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.documents?.[0]) {
        setGeneratedDocs(prev => prev.map(d => d.id === docId ? data.documents[0] : d));
      }
    } finally {
      setRegeneratingDocId(null);
    }
  };

  const handleCopy = (id: string, content: string) => {
    copyToClipboard(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadDoc = async (doc: GeneratedDoc) => {
    const { downloadSingleDocPDF } = await import("@/lib/sourcing-pdf");
    downloadSingleDocPDF(doc, {
      mode: "fournisseurs",
      produit: request.produit,
      territoire: request.pays_utilisateur,
    });
  };

  const exportPDF = async () => {
    if (!generatedDocs.length) return;
    const { downloadSourcingPDF } = await import("@/lib/sourcing-pdf");
    downloadSourcingPDF(generatedDocs, {
      mode: "fournisseurs",
      produit: request.produit,
      territoire: request.pays_utilisateur,
    });
  };

  /* ─────── RENDERS ─────── */

  const renderStep1 = () => (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Décrivez votre besoin</h2>
        <p className="text-[0.78rem] text-white/38">L'IA cherchera les meilleurs fournisseurs mondiaux pour vous.</p>
      </div>

      {searchError && (
        <div className="flex items-center gap-2.5 rounded-xl p-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <p className="text-[0.78rem] text-red-300">{searchError}</p>
        </div>
      )}

      {/* Territoire utilisateur */}
      <div className="rounded-2xl p-4"
        style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.18)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={14} style={{ color: blue }} />
          <p className="text-[0.72rem] font-semibold uppercase tracking-wider" style={{ color: blue }}>
            Votre pays / territoire de destination *
          </p>
        </div>
        <TerritoireDropdown
          value={request.pays_utilisateur}
          onChange={update("pays_utilisateur")}
          groups={PAYS_UTILISATEUR_GROUPS}
        />
        {request.pays_utilisateur && (
          <p className="mt-2 text-[0.68rem] text-white/40">
            {request.pays_utilisateur === "Mayotte" && "⚠️ Mayotte : hors UE douanière — réglementation import spécifique (OCT)"}
            {(request.pays_utilisateur === "La Réunion" || request.pays_utilisateur === "Guadeloupe" || request.pays_utilisateur === "Martinique") && "ℹ️ DROM : Octroi de mer à la place de la TVA, droits douane spécifiques"}
            {request.pays_utilisateur === "Guyane" && "ℹ️ Guyane : pas de TVA, Octroi de mer, fret depuis Europe ou Brésil"}
            {request.pays_utilisateur === "Nouvelle-Calédonie" && "ℹ️ Nouvelle-Calédonie : hors UE, TGC locale, fret Pacifique"}
            {request.pays_utilisateur === "Polynésie française" && "ℹ️ Polynésie : hors UE, TVA propre (13%), fret Pacifique long"}
            {request.pays_utilisateur === "France métropolitaine" && "✓ France métro : règles EU standard, TVA 20%, fret direct"}
          </p>
        )}
      </div>

      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Produit recherché" value={request.produit} onChange={update("produit")}
              placeholder="ex : Bouteilles isothermes 500ml personnalisées" required />
          </div>
          <Field label="Quantité souhaitée" value={request.quantite} onChange={update("quantite")}
            placeholder="ex : 500 unités / mois" />
          <Field label="Budget disponible" value={request.budget} onChange={update("budget")}
            placeholder="ex : 5 000 € ou 3 € / unité max" />
          <SelectField label="Pays source (fournisseur)" value={request.pays_cible} onChange={update("pays_cible")}
            options={PAYS_OPTIONS} />
          <SelectField label="Délai de livraison" value={request.delai} onChange={update("delai")}
            options={DELAI_OPTIONS} />
        </div>
      </Card>

      {/* Qualité */}
      <Card>
        <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Niveau de qualité</p>
        <div className="grid grid-cols-3 gap-2.5">
          {QUALITE_OPTIONS.map(q => (
            <button key={q.id} onClick={() => update("qualite")(q.id)}
              className="flex flex-col gap-1 rounded-xl p-3 text-left transition-all"
              style={{
                background: request.qualite === q.id ? "rgba(96,165,250,0.10)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${request.qualite === q.id ? "rgba(96,165,250,0.35)" : "rgba(255,255,255,0.07)"}`,
              }}>
              <span className="text-[0.82rem] font-bold" style={{ color: request.qualite === q.id ? blue : "rgba(255,255,255,0.65)" }}>
                {q.label}
              </span>
              <span className="text-[0.68rem] text-white/35">{q.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Type */}
      <Card>
        <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Type de produit</p>
        <div className="grid grid-cols-3 gap-2.5">
          {TYPE_OPTIONS.map(t => (
            <button key={t.id} onClick={() => update("type_produit")(t.id)}
              className="flex flex-col gap-1 rounded-xl p-3 text-left transition-all"
              style={{
                background: request.type_produit === t.id ? "rgba(96,165,250,0.10)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${request.type_produit === t.id ? "rgba(96,165,250,0.35)" : "rgba(255,255,255,0.07)"}`,
              }}>
              <span className="text-[0.78rem] font-bold leading-tight" style={{ color: request.type_produit === t.id ? blue : "rgba(255,255,255,0.65)" }}>
                {t.label}
              </span>
              <span className="text-[0.65rem] text-white/35">{t.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Critères spéciaux */}
      <Card>
        <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-2">Critères spéciaux (optionnel)</p>
        <textarea value={request.criteres_speciaux} onChange={e => update("criteres_speciaux")(e.target.value)}
          placeholder="Certifications requises, matériaux spécifiques, conditions particulières..."
          rows={2} className="w-full rounded-xl px-3.5 py-2.5 text-[0.85rem] text-white/75 placeholder:text-white/22 outline-none resize-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
          onFocus={e => (e.target.style.borderColor = "rgba(96,165,250,0.5)")}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")} />
      </Card>

      {/* Sources info */}
      <div className="flex items-start gap-2.5 rounded-xl p-3"
        style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.12)" }}>
        <Info size={13} className="mt-0.5 shrink-0" style={{ color: blue }} />
        <p className="text-[0.72rem] text-white/45">
          L'IA recherche sur <span className="text-white/65 font-semibold">Alibaba, Made-in-China, Global Sources, Europages, IndiaMART</span> et d'autres plateformes pour trouver de vrais fournisseurs actuels.
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -m-10 rounded-full opacity-15"
          style={{ background: `radial-gradient(circle,${blue},transparent 70%)` }} />
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.2)" }}>
          <Search size={36} style={{ color: blue }} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-[1rem] font-black text-white/80">Recherche en cours…</p>
        <p className="mt-1.5 text-[0.78rem] text-white/40 max-w-xs">
          L'IA analyse les plateformes mondiales pour trouver les meilleurs fournisseurs de <strong className="text-white/60">{request.produit}</strong>
        </p>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {["Alibaba", "Made-in-China", "Global Sources", "IndiaMART", "Europages"].map((s, i) => (
          <motion.span key={s}
            initial={{ opacity: 0.2 }} animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold"
            style={{ background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.15)", color: blue }}>
            {s}
          </motion.span>
        ))}
      </div>
      <Loader2 size={18} className="animate-spin text-white/25 mt-2" />
    </div>
  );

  const renderStep3 = () => {
    if (!searchResult) return null;
    const { suppliers = [], pays_recommandes = [], analyse_marche, risques_globaux = [], recommandation, sources_recherchees = [] } = searchResult;

    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[1.1rem] font-black text-white/88 mb-0.5">Fournisseurs recommandés</h2>
            <p className="text-[0.75rem] text-white/38">{suppliers.length} fournisseurs • sources : {sources_recherchees.join(", ")}</p>
          </div>
          <button onClick={() => { setSearchResult(null); setStep(1); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.72rem] text-white/35 transition hover:text-white/55"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <RefreshCw size={11} /> Nouvelle recherche
          </button>
        </div>

        {/* Recommandation IA */}
        {recommandation && (
          <Card accent>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(96,165,250,0.12)" }}>
                <Sparkles size={14} style={{ color: blue }} />
              </div>
              <div>
                <p className="text-[0.7rem] font-semibold text-blue-400/70 uppercase tracking-wider mb-1">Recommandation IA</p>
                <p className="text-[0.82rem] text-white/70 leading-relaxed">{recommandation}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Pays recommandés */}
        {pays_recommandes.length > 0 && (
          <div>
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-2.5">Pays les plus adaptés</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {pays_recommandes.slice(0, 3).map((p, i) => (
                <Card key={i}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[0.88rem] font-black text-white/85">{p.pays}</p>
                      <p className="text-[0.65rem] text-white/35 mt-0.5">{p.prix_moyen}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
                      style={{ background: `rgba(52,211,153,${0.05 + i * 0.02})`, border: "1px solid rgba(52,211,153,0.15)" }}>
                      <span className="text-[0.68rem] font-black" style={{ color: emerald }}>{p.score}%</span>
                    </div>
                  </div>
                  <p className="text-[0.72rem] text-white/45 leading-relaxed">{p.raison}</p>
                  <p className="mt-1.5 text-[0.65rem] text-white/30">Délai total : {p.delai_moyen}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Supplier cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider">Fournisseurs identifiés</p>
            {selectedSupplierId && (
              <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-black"
                style={{ background: "rgba(52,211,153,0.12)", color: emerald, border: "1px solid rgba(52,211,153,0.25)" }}>
                <BadgeCheck size={11} /> 1 fournisseur sélectionné
              </span>
            )}
          </div>
          {suppliers.map((s, i) => {
            const isSelected = selectedSupplierId === (s.id || String(i));
            const suppId = s.id || String(i);
            const waText = encodeURIComponent(
              `Bonjour,\n\nJe suis intéressé(e) par votre produit : ${request.produit}.\n` +
              `Quantité souhaitée : ${request.quantite || "à définir"}\n` +
              `Pourriez-vous m'envoyer un devis avec : prix unitaire, MOQ, délai de fabrication, conditions de paiement ?\n\nMerci.`
            );
            const waLink = `https://wa.me/?text=${waText}`;
            const mailSubject = encodeURIComponent(`Demande de devis — ${request.produit}`);
            const mailBody = encodeURIComponent(
              `Bonjour,\n\nNous souhaitons commander : ${request.produit}\nQuantité : ${request.quantite || "à définir"}\nBudget : ${request.budget || "à discuter"}\n\nMerci de nous transmettre votre meilleur devis.\n\nCordialement`
            );

            return (
              <motion.div key={suppId}
                animate={{ scale: isSelected ? 1.005 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                <div className="rounded-2xl p-4 transition-all"
                  style={{
                    background: isSelected ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.02)",
                    border: isSelected
                      ? "1.5px solid rgba(52,211,153,0.45)"
                      : "1px solid rgba(255,255,255,0.07)",
                    boxShadow: isSelected ? "0 0 24px rgba(52,211,153,0.08)" : "none",
                  }}>

                  {/* Selected banner */}
                  {isSelected && (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
                      style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                      <BadgeCheck size={14} style={{ color: emerald }} />
                      <span className="text-[0.72rem] font-black" style={{ color: emerald }}>
                        Fournisseur sélectionné — les documents seront générés pour ce fournisseur
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Confidence */}
                    <div className="shrink-0">
                      <ConfidenceRing value={s.niveau_confiance} size={52} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[0.9rem] font-black text-white/88 truncate">{s.nom}</p>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold text-white/50"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {s.plateforme}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[0.72rem] text-white/50">
                          <Flag size={10} /> {s.pays}{s.ville ? `, ${s.ville}` : ""}
                        </span>
                        {s.certifications?.map(c => (
                          <span key={c} className="text-[0.62rem] font-semibold rounded px-1.5 py-0.5"
                            style={{ background: "rgba(52,211,153,0.07)", color: "rgba(52,211,153,0.7)" }}>
                            {c}
                          </span>
                        ))}
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                        {[
                          { label: "Prix unité", val: s.prix_unite },
                          { label: "MOQ", val: s.moq },
                          { label: "Fab.", val: s.delai_fab },
                          { label: "Transport", val: s.delai_transport },
                        ].map(m => (
                          <div key={m.label} className="rounded-lg px-2.5 py-1.5"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="text-[0.58rem] text-white/35 uppercase">{m.label}</p>
                            <p className="text-[0.75rem] font-bold text-white/75 mt-0.5">{m.val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Pros / Cons */}
                      <div className="grid sm:grid-cols-2 gap-2 mb-3">
                        {s.avantages?.length > 0 && (
                          <div className="space-y-1">
                            {s.avantages.slice(0, 2).map((a, j) => (
                              <div key={j} className="flex items-center gap-1.5">
                                <CheckCircle2 size={10} style={{ color: emerald }} className="shrink-0" />
                                <span className="text-[0.7rem] text-white/55">{a}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {s.inconvenients?.length > 0 && (
                          <div className="space-y-1">
                            {s.inconvenients.slice(0, 2).map((c, j) => (
                              <div key={j} className="flex items-center gap-1.5">
                                <AlertTriangle size={10} className="text-amber-400 shrink-0" />
                                <span className="text-[0.7rem] text-white/45">{c}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ── BARRE ACTIONS : contact + sélection ── */}
                      <div className="flex items-center justify-between gap-2 pt-3 flex-wrap"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>

                        {/* Icônes contact */}
                        <div className="flex items-center gap-2">
                          {s.url && (
                            <a href={s.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.68rem] font-semibold transition hover:scale-105"
                              style={{ background: "rgba(96,165,250,0.1)", color: blue, border: "1px solid rgba(96,165,250,0.22)" }}>
                              <ExternalLink size={11} /> {s.plateforme}
                            </a>
                          )}
                          {s.site_web && (
                            <a href={s.site_web} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.68rem] font-semibold transition hover:scale-105"
                              style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.22)" }}>
                              <Globe size={11} /> Site web
                            </a>
                          )}
                          <a href={waLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.68rem] font-semibold transition hover:scale-105"
                            style={{ background: "rgba(37,211,102,0.1)", color: "#25d366", border: "1px solid rgba(37,211,102,0.22)" }}>
                            <MessageCircle size={11} /> WhatsApp
                          </a>
                          <a href={`mailto:?subject=${mailSubject}&body=${mailBody}`}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.68rem] font-semibold transition hover:scale-105"
                            style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.18)" }}>
                            <Mail size={11} /> Email RFQ
                          </a>
                        </div>

                        {/* Bouton sélection */}
                        <button
                          onClick={() => setSelectedSupplierId(isSelected ? null : suppId)}
                          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.75rem] font-black transition-all hover:scale-105 active:scale-95"
                          style={isSelected ? {
                            background: "rgba(52,211,153,0.18)",
                            color: emerald,
                            border: "1.5px solid rgba(52,211,153,0.45)",
                          } : {
                            background: "rgba(255,255,255,0.05)",
                            color: "rgba(255,255,255,0.5)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}>
                          {isSelected
                            ? <><BadgeCheck size={13} /> Sélectionné</>
                            : <><Check size={13} /> Choisir ce fournisseur</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Analyse marché */}
        {analyse_marche && (
          <Card>
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Intelligence commerciale</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Prix marché France", val: analyse_marche.prix_marche_fr },
                { label: "Prix import estimé", val: analyse_marche.prix_import_estime },
                { label: "Marge potentielle", val: analyse_marche.marge_potentielle },
              ].map(m => (
                <div key={m.label} className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[0.62rem] text-white/35 uppercase mb-1">{m.label}</p>
                  <p className="text-[0.9rem] font-black text-white/80">{m.val}</p>
                </div>
              ))}
            </div>
            {analyse_marche.tendances && (
              <p className="mt-3 text-[0.75rem] text-white/50 leading-relaxed border-t border-white/[0.06] pt-3">
                {analyse_marche.tendances}
              </p>
            )}
          </Card>
        )}

        {/* Risques */}
        {risques_globaux.length > 0 && (
          <Card>
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Points de vigilance</p>
            <div className="space-y-1.5">
              {risques_globaux.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Shield size={12} className="mt-0.5 shrink-0 text-amber-400" />
                  <p className="text-[0.78rem] text-white/60">{r}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderStep4 = () => {
    if (!searchResult?.logistique) return null;
    const { logistique } = searchResult;

    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Analyse logistique</h2>
          <p className="text-[0.78rem] text-white/38">Coûts de transport, douanes et TVA estimés.</p>
        </div>

        {/* Fret aérien */}
        {logistique.fret_aerien && (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(96,165,250,0.1)" }}>
                <Zap size={16} style={{ color: blue }} />
              </div>
              <div>
                <p className="text-[0.88rem] font-black text-white/85">Fret aérien</p>
                <p className="text-[0.65rem] text-white/35">{logistique.fret_aerien.delai}</p>
              </div>
              <div className="ml-auto">
                <p className="text-[0.85rem] font-black text-white/80">{logistique.fret_aerien.prix_estime}</p>
              </div>
            </div>
            <p className="text-[0.72rem] text-white/45 mb-2">{logistique.fret_aerien.seuil_recommande}</p>
            <div className="flex flex-wrap gap-1.5">
              {logistique.fret_aerien.transporteurs?.map(t => (
                <span key={t} className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold text-white/50"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {t}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Fret maritime */}
        {logistique.fret_maritime && (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(52,211,153,0.1)" }}>
                <Truck size={16} style={{ color: emerald }} />
              </div>
              <div>
                <p className="text-[0.88rem] font-black text-white/85">Fret maritime</p>
                <p className="text-[0.65rem] text-white/35">{logistique.fret_maritime.delai}</p>
              </div>
              <div className="ml-auto">
                <p className="text-[0.85rem] font-black text-white/80">{logistique.fret_maritime.prix_estime}</p>
              </div>
            </div>
            <p className="text-[0.72rem] text-white/45 mb-2">{logistique.fret_maritime.seuil_recommande}</p>
            <div className="flex flex-wrap gap-1.5">
              {logistique.fret_maritime.transporteurs?.map(t => (
                <span key={t} className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold text-white/50"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {t}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Douanes */}
        {logistique.douanes && (
          <Card>
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Douanes & Fiscalité</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-[0.6rem] text-white/35 uppercase mb-1">Droits douane</p>
                <p className="text-[0.9rem] font-black text-amber-400">{logistique.douanes.taux_droits}</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-[0.6rem] text-white/35 uppercase mb-1">TVA import</p>
                <p className="text-[0.9rem] font-black text-amber-400">{logistique.douanes.tva_import}</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-[0.6rem] text-white/35 uppercase mb-1">Coût total estimé</p>
                <p className="text-[0.75rem] font-black text-white/70">{logistique.douanes.montant_estime}</p>
              </div>
            </div>
            {logistique.douanes.documents_requis?.length > 0 && (
              <div>
                <p className="text-[0.65rem] text-white/35 uppercase mb-1.5">Documents requis</p>
                <div className="flex flex-wrap gap-1.5">
                  {logistique.douanes.documents_requis.map(d => (
                    <span key={d} className="rounded-lg px-2.5 py-1 text-[0.68rem] font-semibold text-white/55"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Coût total */}
        {logistique.cout_total_estime && (
          <Card accent>
            <div className="flex items-center gap-3">
              <TrendingUp size={18} style={{ color: blue }} />
              <div>
                <p className="text-[0.72rem] text-white/45 uppercase tracking-wider">Coût total rendu France</p>
                <p className="text-[0.9rem] font-black text-white/85 mt-0.5">{logistique.cout_total_estime}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderStep5 = () => {
    if (generating) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -m-8 rounded-full opacity-15"
              style={{ background: `radial-gradient(circle,${blue},transparent 70%)` }} />
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.2)" }}>
              <Sparkles size={36} style={{ color: blue }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[1rem] font-black text-white/80">Génération des documents…</p>
            <p className="mt-1 text-[0.78rem] text-white/38">{selectedDocs.length} documents créés en parallèle</p>
          </div>
          <Loader2 size={20} className="animate-spin text-white/30" />
        </div>
      );
    }

    /* Selection mode */
    if (!generatedDocs.length) {
      return (
        <div className="space-y-5 max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Outils de contact & documents</h2>
            <p className="text-[0.78rem] text-white/38">Sélectionnez les documents à générer pour ce sourcing.</p>
          </div>
          {generateError && (
            <div className="flex items-center gap-2 rounded-xl p-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
              <p className="text-[0.75rem] text-red-300">{generateError}</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-2.5">
            {DOC_OPTIONS.map(opt => {
              const sel = selectedDocs.includes(opt.id);
              const Icon = opt.icon;
              return (
                <button key={opt.id}
                  onClick={() => setSelectedDocs(prev => sel ? prev.filter(d => d !== opt.id) : [...prev, opt.id])}
                  className="flex items-start gap-3 rounded-xl p-3.5 text-left transition-all"
                  style={{
                    background: sel ? "rgba(96,165,250,0.07)" : "rgba(255,255,255,0.025)",
                    border: `1px solid ${sel ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.07)"}`,
                  }}>
                  <Icon size={14} className="mt-0.5 shrink-0" style={{ color: sel ? blue : "rgba(255,255,255,0.3)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8rem] font-semibold leading-tight"
                      style={{ color: sel ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)" }}>
                      {opt.label}
                    </p>
                    <p className="text-[0.66rem] text-white/28 mt-0.5">{opt.desc}</p>
                  </div>
                  {sel && <Check size={13} className="shrink-0 mt-0.5" style={{ color: blue }} />}
                </button>
              );
            })}
          </div>
          {!selectedSupplierId && (
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-3"
              style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <AlertTriangle size={13} style={{ color: "#fbbf24", flexShrink: 0 }} />
              <p className="text-[0.75rem]" style={{ color: "rgba(251,191,36,0.8)" }}>
                Retournez à l'étape 3 et choisissez un fournisseur — les documents seront personnalisés pour lui.
              </p>
            </div>
          )}
          <button onClick={runGenerate} disabled={!selectedDocs.length}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 font-black text-[0.9rem] transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,rgba(96,165,250,0.85),rgba(129,140,248,0.75))", color: "#fff" }}>
            <Sparkles size={16} /> Générer {selectedDocs.length} document{selectedDocs.length > 1 ? "s" : ""}
          </button>
        </div>
      );
    }

    /* Docs viewer */
    const activeDoc = generatedDocs.find(d => d.id === activeDocTab);
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-[1.1rem] font-black text-white/88 mb-0.5">Documents générés</h2>
            <p className="text-[0.72rem] text-white/38">{generatedDocs.length} documents prêts à l'emploi</p>
          </div>
          <button onClick={() => { setGeneratedDocs([]); setActiveDocTab(""); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.72rem] text-white/35 transition hover:text-white/55"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <RefreshCw size={11} /> Régénérer
          </button>
        </div>
        <div className="flex gap-4 min-h-[440px]">
          <div className="flex flex-col gap-1 w-44 shrink-0">
            {generatedDocs.map(d => {
              const opt = DOC_OPTIONS.find(o => o.id === d.id);
              const Icon = opt?.icon || FileText;
              return (
                <button key={d.id} onClick={() => setActiveDocTab(d.id)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    background: activeDocTab === d.id ? "rgba(96,165,250,0.1)" : "transparent",
                    border: `1px solid ${activeDocTab === d.id ? "rgba(96,165,250,0.3)" : "transparent"}`,
                  }}>
                  <Icon size={12} style={{ color: activeDocTab === d.id ? blue : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                  <span className="text-[0.68rem] font-semibold leading-tight"
                    style={{ color: activeDocTab === d.id ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.38)" }}>
                    {d.title}
                  </span>
                </button>
              );
            })}
          </div>
          {activeDoc && (
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${editingDocId === activeDoc.id ? "rgba(96,165,250,0.35)" : "rgba(255,255,255,0.07)"}` }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-[0.8rem] font-black text-white/80">{activeDoc.title}</span>
                  {editingDocId === activeDoc.id && (
                    <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wider"
                      style={{ background: "rgba(96,165,250,0.15)", color: blue }}>
                      Édition
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingDocId === activeDoc.id ? (
                    <>
                      <button onClick={cancelEdit}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-semibold transition"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
                        <XIcon size={11} /> Annuler
                      </button>
                      <button onClick={saveEdit}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-semibold"
                        style={{ background: "rgba(96,165,250,0.15)", color: blue, border: "1px solid rgba(96,165,250,0.3)" }}>
                        <Save size={11} /> Sauvegarder
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => regenerateDoc(activeDoc.id)}
                        disabled={regeneratingDocId === activeDoc.id}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-semibold transition disabled:opacity-40"
                        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}>
                        {regeneratingDocId === activeDoc.id
                          ? <Loader2 size={11} className="animate-spin" />
                          : <RefreshCw size={11} />}
                      </button>
                      <button onClick={() => startEdit(activeDoc)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-semibold transition"
                        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}>
                        <Pencil size={11} /> Éditer
                      </button>
                      <button onClick={() => handleCopy(activeDoc.id, activeDoc.content)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-semibold transition"
                        style={{ background: "rgba(255,255,255,0.05)", color: copiedId === activeDoc.id ? emerald : "rgba(255,255,255,0.45)" }}>
                        {copiedId === activeDoc.id ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
                      </button>
                      <button onClick={() => downloadDoc(activeDoc)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-semibold"
                        style={{ background: "rgba(96,165,250,0.08)", color: blue, border: "1px solid rgba(96,165,250,0.2)" }}>
                        <Download size={11} /> PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {editingDocId === activeDoc.id ? (
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full min-h-[320px] max-h-[520px] resize-none outline-none font-mono text-[0.77rem] leading-relaxed overflow-y-auto"
                    style={{ background: "transparent", color: "rgba(255,255,255,0.75)", caretColor: blue }}
                    autoFocus
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-[0.77rem] leading-relaxed text-white/60 font-mono">{activeDoc.content}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep6 = () => (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Exporter le dossier sourcing</h2>
        <p className="text-[0.78rem] text-white/38">Téléchargez votre stratégie fournisseur complète.</p>
      </div>
      <div className="grid gap-4">
        {generatedDocs.length > 0 && (
          <button onClick={exportPDF}
            className="flex items-center gap-4 rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
            style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.25)" }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(96,165,250,0.15)" }}>
              <FileText size={22} style={{ color: blue }} />
            </div>
            <div className="flex-1">
              <p className="text-[0.9rem] font-black text-white/85">PDF complet</p>
              <p className="text-[0.75rem] text-white/40">Tous les documents en un PDF professionnel</p>
            </div>
            <Download size={18} style={{ color: blue }} />
          </button>
        )}
        {generatedDocs.length > 0 && (
          <button onClick={async () => { for (const d of generatedDocs) await downloadDoc(d); }}
            className="flex items-center gap-4 rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <Package size={22} className="text-white/40" />
            </div>
            <div className="flex-1">
              <p className="text-[0.9rem] font-black text-white/75">Documents individuels (PDF)</p>
              <p className="text-[0.75rem] text-white/35">Chaque document dans son propre PDF</p>
            </div>
            <Download size={18} className="text-white/35" />
          </button>
        )}
        {generatedDocs.length === 0 && (
          <div className="text-center py-10 text-white/30">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-[0.82rem]">Générez d'abord des documents à l'étape précédente</p>
          </div>
        )}
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.12)" }}>
          <Info size={13} className="mt-0.5 shrink-0" style={{ color: blue }} />
          <p className="text-[0.72rem] text-white/42">
            <strong className="text-white/62">Conseil :</strong> Vérifiez et personnalisez les documents avant envoi. Demandez toujours un échantillon avant toute commande ferme.
          </p>
        </div>
      </div>
    </div>
  );

  /* ── NAV ── */
  const canProceed = () => {
    if (step === 1) return request.produit.trim().length > 0 && request.pays_utilisateur.trim().length > 0;
    if (step === 2) return false;
    if (step === 3) return searchResult !== null;
    if (step === 4) return true;
    if (step === 5) return true;
    return true;
  };

  const handleNext = async () => {
    if (step === 1) { await runSearch(); return; }
    setStep(s => Math.min(s + 1, 6));
  };

  const handlePrev = () => {
    if (step === 3) { setStep(1); return; }
    setStep(s => Math.max(s - 1, 1));
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: "#07080e" }}>

      {/* HEADER */}
      <div className="relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(160deg,#07080e,#0a0f1a,#07080e)" }}>
        <div className="pointer-events-none absolute -top-10 -left-8 h-40 w-40 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle,#60a5fa,transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-6 right-16 h-28 w-28 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle,#34d399,transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,rgba(96,165,250,0.45),rgba(52,211,153,0.18),transparent)" }} />
        <div className="relative px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/client/sourcing"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/[0.06]"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <ArrowLeft size={15} className="text-white/50" />
            </Link>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)" }}>
                <Factory size={17} style={{ color: blue }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-[0.95rem] font-black text-white/88 leading-tight truncate">
                  Trouver des fournisseurs
                </h1>
                <p className="text-[0.65rem] text-white/35">Assistant IA — Sourcing mondial</p>
              </div>
            </div>
          </div>
          <StepIndicator current={step} />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 sm:px-6 pb-24">
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
              {step === 6 && renderStep6()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* FOOTER */}
      {step !== 2 && !searching && !generating && (
        <div className="shrink-0 border-t px-4 py-3 sm:px-6"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(7,8,14,0.95)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between max-w-3xl mx-auto gap-3">
            <div className="flex items-center gap-2">
              <button onClick={handlePrev} disabled={step === 1}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.82rem] font-semibold transition disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <ChevronLeft size={16} /> Précédent
              </button>
              {step > 1 && (
                <button onClick={resetWizard}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[0.78rem] font-semibold transition"
                  style={{ color: "rgba(255,100,100,0.65)" }}>
                  <RotateCcw size={13} /> Recommencer
                </button>
              )}
            </div>
            <span className="text-[0.72rem] text-white/25">Étape {step} / {STEPS.length}</span>
            {step < 6 ? (
              <button onClick={handleNext} disabled={!canProceed()}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.82rem] font-black transition-all disabled:opacity-35 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,rgba(96,165,250,0.85),rgba(52,211,153,0.6))", color: "#fff" }}>
                {step === 1 ? (<><Search size={15} /> Rechercher</>) : (<>Suivant <ChevronRight size={15} /></>)}
              </button>
            ) : (
              <button onClick={exportPDF} disabled={!generatedDocs.length}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.82rem] font-black transition-all active:scale-[0.98] disabled:opacity-35"
                style={{ background: "linear-gradient(135deg,rgba(96,165,250,0.85),rgba(52,211,153,0.6))", color: "#fff" }}>
                <Download size={15} /> Exporter PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
