"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Building2, Upload, Brain, FileText, CheckCircle2,
  Download, ChevronRight, ChevronLeft, X, Loader2, File,
  Trash2, Check, AlertTriangle, Info, Star, Shield,
  Clock, TrendingUp, Phone, Mail, Globe, MapPin,
  Hash, Euro, Award, Sparkles, Copy, RefreshCw,
  Target, Users, BookOpen, Zap, FileCheck,
  ClipboardList, Archive, Package, Pencil, RotateCcw, Save,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface CompanyInfo {
  nom: string; siret: string; adresse: string; telephone: string;
  email: string; site: string; effectif: string; chiffre_affaires: string;
  references: string; domaines: string;
}
interface UploadedFile {
  id: string; name: string; category: string; size: number;
  mimeType: string; base64?: string; text?: string;
}
interface Requirement { label: string; obligatoire: boolean; detail: string; }
interface CritereNotation { critere: string; poids: string; detail: string; }
interface PieceDossier { nom: string; obligatoire: boolean; present: boolean; }
interface AnalysisResult {
  summary: string; type_marche: string; objet: string; pouvoir_adjudicateur: string;
  budget_estime: string | null; echeance_depot: string | null; duree_marche: string | null;
  requirements: Requirement[]; criteres_notation: CritereNotation[];
  pieces_dossier: PieceDossier[]; pieces_manquantes: string[];
  points_forts: string[]; points_vigilance: string[];
  taux_succes: number; conseils: string[]; documents_detectes: string[];
}
interface GeneratedDoc { id: string; title: string; content: string; }

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const indigo = "#818cf8";
const blue = "#60a5fa";
const emerald = "#34d399";

const STEPS = [
  { id: 1, label: "Entreprise", icon: Building2, short: "Infos" },
  { id: 2, label: "Documents",  icon: Upload,     short: "Upload" },
  { id: 3, label: "Analyse IA", icon: Brain,       short: "Analyse" },
  { id: 4, label: "Génération", icon: Sparkles,    short: "Génère" },
  { id: 5, label: "Vérification",icon: CheckCircle2,short: "Vérifie" },
  { id: 6, label: "Export",     icon: Download,    short: "Export" },
];

const FILE_CATEGORIES = [
  { id: "cahier_charges", label: "Cahier des charges" },
  { id: "reglement",      label: "Règlement de consultation" },
  { id: "cctp",           label: "CCTP" },
  { id: "ccap",           label: "CCAP" },
  { id: "dpgf",           label: "DPGF / BPU" },
  { id: "autre",          label: "Autre document" },
];

const DOC_OPTIONS = [
  { id: "memoire_technique",   label: "Mémoire technique",        icon: BookOpen,     desc: "Présentation méthodologie & compétences" },
  { id: "lettre_candidature",  label: "Lettre de candidature DC1",icon: FileText,     desc: "Déclaration légale de candidature" },
  { id: "offre_commerciale",   label: "Offre commerciale & prix", icon: Euro,         desc: "Décomposition prix et conditions" },
  { id: "planning",            label: "Planning prévisionnel",    icon: Clock,        desc: "Phasage et jalons du projet" },
  { id: "note_methodologie",   label: "Note méthodologique",      icon: Target,       desc: "Approche technique détaillée" },
  { id: "dc2",                 label: "DC2 — Déclaration candidat",icon: ClipboardList,desc: "Formulaire officiel DC2" },
  { id: "attestations",        label: "Liste des attestations",   icon: FileCheck,    desc: "Documents administratifs requis" },
  { id: "synthese_executive",  label: "Synthèse exécutive",       icon: Zap,          desc: "Résumé percutant pour décideurs" },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
function copyToClipboard(text: string) { navigator.clipboard.writeText(text).catch(() => {}); }
async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => { const r = e.target?.result as string; resolve(r.split(",")[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}

/* ─────────────────────────────────────────────────────────
   CARD
───────────────────────────────────────────────────────── */
function Card({ children, className = "", isDark = true }: { children: React.ReactNode; className?: string; isDark?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: isDark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.88)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(12,24,100,0.09)"}`,
        boxShadow: isDark ? "none" : "0 2px 14px rgba(12,24,100,0.06)",
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FIELD
───────────────────────────────────────────────────────── */
function Field({
  label, value, onChange, placeholder = "", required = false, type = "text", hint, isDark = true,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string; hint?: string; isDark?: boolean;
}) {
  const borderDefault = isDark ? "rgba(255,255,255,0.09)" : "rgba(12,24,100,0.12)";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.72rem] font-semibold uppercase tracking-wider"
        style={{ color: isDark ? "rgba(255,255,255,0.50)" : "rgba(12,18,50,0.55)" }}>
        {label}{required && <span className="ml-1 text-indigo-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl px-3.5 py-2.5 text-[0.85rem] outline-none transition"
        style={{
          background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
          border: `1px solid ${borderDefault}`,
          color: isDark ? "rgba(255,255,255,0.85)" : "#111827",
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(129,140,248,0.5)")}
        onBlur={e => (e.target.style.borderColor = borderDefault)}
      />
      {hint && (
        <p className="text-[0.67rem]" style={{ color: isDark ? "rgba(255,255,255,0.30)" : "rgba(12,18,50,0.45)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TEXTAREA FIELD
───────────────────────────────────────────────────────── */
function TextareaField({
  label, value, onChange, placeholder = "", rows = 3, hint, isDark = true,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; hint?: string; isDark?: boolean;
}) {
  const borderDefault = isDark ? "rgba(255,255,255,0.09)" : "rgba(12,24,100,0.12)";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.72rem] font-semibold uppercase tracking-wider"
        style={{ color: isDark ? "rgba(255,255,255,0.50)" : "rgba(12,18,50,0.55)" }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-xl px-3.5 py-2.5 text-[0.85rem] outline-none transition resize-none"
        style={{
          background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
          border: `1px solid ${borderDefault}`,
          color: isDark ? "rgba(255,255,255,0.85)" : "#111827",
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(129,140,248,0.5)")}
        onBlur={e => (e.target.style.borderColor = borderDefault)}
      />
      {hint && (
        <p className="text-[0.67rem]" style={{ color: isDark ? "rgba(255,255,255,0.30)" : "rgba(12,18,50,0.45)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────────────────── */
function StepIndicator({ current, isDark = true }: { current: number; isDark?: boolean }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto scrollbar-none py-1">
      {STEPS.map((step, i) => {
        const done   = current > step.id;
        const active = current === step.id;
        const Icon   = step.icon;
        return (
          <div key={step.id} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={{
                  background: done
                    ? "rgba(129,140,248,0.9)"
                    : active
                      ? "rgba(129,140,248,0.15)"
                      : isDark ? "rgba(255,255,255,0.05)" : "rgba(12,24,100,0.06)",
                  border: active
                    ? "1.5px solid rgba(129,140,248,0.7)"
                    : done
                      ? "none"
                      : `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(12,24,100,0.14)"}`,
                  color: done
                    ? "#fff"
                    : active
                      ? indigo
                      : isDark ? "rgba(255,255,255,0.3)" : "rgba(12,18,50,0.45)",
                }}
              >
                {done ? <Check size={13} /> : <Icon size={13} />}
              </div>
              <span
                className="text-[0.6rem] font-semibold hidden sm:block"
                style={{
                  color: active
                    ? indigo
                    : done
                      ? isDark ? "rgba(255,255,255,0.55)" : "rgba(12,18,50,0.65)"
                      : isDark ? "rgba(255,255,255,0.25)" : "rgba(12,18,50,0.38)",
                }}
              >
                {step.short}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mx-1.5 h-[1px] w-6 sm:w-10 shrink-0"
                style={{ background: done ? "rgba(129,140,248,0.6)" : isDark ? "rgba(255,255,255,0.07)" : "rgba(12,24,100,0.12)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TAUX SUCCÈS RING
───────────────────────────────────────────────────────── */
function SuccessRing({ taux, isDark = true }: { taux: number; isDark?: boolean }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - taux / 100);
  const color = taux >= 70 ? emerald : taux >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none"
          stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.08)"} strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="text-center">
        <span className="block text-xl font-black" style={{ color: isDark ? "#ffffff" : "#0d0f1a" }}>{taux}%</span>
        <span className="block text-[0.55rem] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.40)" : "rgba(12,18,50,0.50)" }}>
          SUCCÈS
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export default function AppelOffrePage() {
  const { isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [company, setCompany] = useState<CompanyInfo>({
    nom: "", siret: "", adresse: "", telephone: "",
    email: "", site: "", effectif: "", chiffre_affaires: "",
    references: "", domaines: "",
  });
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(DOC_OPTIONS.map(d => d.id));
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [verifChecks, setVerifChecks] = useState<Record<string, boolean>>({});
  const [regeneratingDocId, setRegeneratingDocId] = useState<string | null>(null);

  const updateCompany = (field: keyof CompanyInfo) => (val: string) =>
    setCompany(c => ({ ...c, [field]: val }));

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const processFile = useCallback(async (f: File): Promise<UploadedFile | null> => {
    if (f.size > MAX_FILE_SIZE) {
      alert(`"${f.name}" dépasse la limite de 10 Mo. Compressez le fichier et réessayez.`);
      return null;
    }
    if (f.name.endsWith(".doc") && !f.name.endsWith(".docx")) {
      alert(`"${f.name}" est au format .doc (ancien Word binaire) qui ne peut pas être lu. Convertissez-le en .docx ou en PDF.`);
      return null;
    }
    const isPdf  = f.type === "application/pdf";
    const isText = f.type.startsWith("text/") || f.name.endsWith(".txt") || f.name.endsWith(".md") || f.name.endsWith(".docx");
    let base64: string | undefined;
    let text:   string | undefined;
    if (isPdf)       base64 = await readFileAsBase64(f);
    else if (isText) text   = await readFileAsText(f);
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name, category: "autre", size: f.size,
      mimeType: f.type || "application/octet-stream",
      base64, text,
    };
  }, []);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const results = await Promise.all(arr.map(processFile));
    setFiles(prev => [...prev, ...results.filter((r): r is UploadedFile => r !== null)]);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const runAnalysis = async () => {
    setStep(3);
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalysis(null);
    try {
      const res  = await fetch("/api/sourcing/appel-offre/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ company, files }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setAnalysis(data as AnalysisResult);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setAnalyzing(false);
    }
  };

  const runGeneration = async () => {
    if (!analysis) return;
    setGenerating(true);
    setGenerateError(null);
    setGeneratedDocs([]);
    setActiveDocTab("");
    try {
      const res  = await fetch("/api/sourcing/appel-offre/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ company, analysis, selectedDocs, files }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      const docs = data.documents || [];
      setGeneratedDocs(docs);
      if (docs.length) setActiveDocTab(docs[0].id);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setGenerating(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setCompany({ nom: "", siret: "", adresse: "", telephone: "", email: "", site: "", effectif: "", chiffre_affaires: "", references: "", domaines: "" });
    setFiles([]);
    setAnalysis(null);
    setAnalyzeError(null);
    setGeneratedDocs([]);
    setSelectedDocs(DOC_OPTIONS.map(d => d.id));
    setActiveDocTab("");
    setEditingDocId(null);
    setEditContent("");
  };

  const startEdit  = (doc: GeneratedDoc) => { setEditingDocId(doc.id); setEditContent(doc.content); };
  const saveEdit   = () => { setGeneratedDocs(prev => prev.map(d => d.id === editingDocId ? { ...d, content: editContent } : d)); setEditingDocId(null); };
  const cancelEdit = () => { setEditingDocId(null); setEditContent(""); };

  const regenerateDoc = async (docId: string) => {
    if (!analysis) return;
    setRegeneratingDocId(docId);
    try {
      const res  = await fetch("/api/sourcing/appel-offre/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, analysis, selectedDocs: [docId], files }),
      });
      const data = await res.json();
      if (res.ok && data.documents?.[0])
        setGeneratedDocs(prev => prev.map(d => d.id === docId ? data.documents[0] : d));
    } finally {
      setRegeneratingDocId(null);
    }
  };

  const handleCopy = (id: string, content: string) => {
    copyToClipboard(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pdfMeta = () => ({
    mode: "appel-offre" as const,
    entreprise: company.nom || "Candidat",
    marche:     analysis?.objet ?? analysis?.summary ?? "Appel d'offre",
    acheteur:   analysis?.pouvoir_adjudicateur ?? "",
  });

  const downloadDoc     = async (doc: GeneratedDoc) => { const { downloadSingleDocPDF } = await import("@/lib/sourcing-pdf"); downloadSingleDocPDF(doc, pdfMeta()); };
  const downloadAllDocs = async () => { const { downloadSourcingPDF } = await import("@/lib/sourcing-pdf"); downloadSourcingPDF(generatedDocs, pdfMeta()); };
  const exportPDF       = async () => { const { downloadSourcingPDF } = await import("@/lib/sourcing-pdf"); downloadSourcingPDF(generatedDocs, pdfMeta()); };

  /* ── colour tokens ── */
  const T = {
    text88:  isDark ? "rgba(255,255,255,0.88)" : "#0d0f1a",
    text80:  isDark ? "rgba(255,255,255,0.80)" : "rgba(12,18,50,0.82)",
    text70:  isDark ? "rgba(255,255,255,0.70)" : "rgba(12,18,50,0.68)",
    text60:  isDark ? "rgba(255,255,255,0.60)" : "rgba(12,18,50,0.60)",
    text55:  isDark ? "rgba(255,255,255,0.55)" : "rgba(12,18,50,0.57)",
    text50:  isDark ? "rgba(255,255,255,0.50)" : "rgba(12,18,50,0.55)",
    text45:  isDark ? "rgba(255,255,255,0.45)" : "rgba(12,18,50,0.52)",
    text40:  isDark ? "rgba(255,255,255,0.40)" : "rgba(12,18,50,0.50)",
    text38:  isDark ? "rgba(255,255,255,0.38)" : "rgba(12,18,50,0.48)",
    text35:  isDark ? "rgba(255,255,255,0.35)" : "rgba(12,18,50,0.48)",
    text30:  isDark ? "rgba(255,255,255,0.30)" : "rgba(12,18,50,0.42)",
    text25:  isDark ? "rgba(255,255,255,0.25)" : "rgba(12,18,50,0.38)",
    text22:  isDark ? "rgba(255,255,255,0.22)" : "rgba(12,18,50,0.35)",
    bg025:   isDark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.88)",
    bg03:    isDark ? "rgba(255,255,255,0.03)"  : "rgba(255,255,255,0.82)",
    bg04:    isDark ? "rgba(255,255,255,0.04)"  : "#ffffff",
    bg05:    isDark ? "rgba(255,255,255,0.05)"  : "rgba(12,24,100,0.06)",
    bg06:    isDark ? "rgba(255,255,255,0.06)"  : "rgba(12,24,100,0.06)",
    bg08:    isDark ? "rgba(255,255,255,0.08)"  : "rgba(12,24,100,0.07)",
    bd06:    isDark ? "rgba(255,255,255,0.06)"  : "rgba(12,24,100,0.09)",
    bd07:    isDark ? "rgba(255,255,255,0.07)"  : "rgba(12,24,100,0.09)",
    bd09:    isDark ? "rgba(255,255,255,0.09)"  : "rgba(12,24,100,0.12)",
    bd10:    isDark ? "rgba(255,255,255,0.10)"  : "rgba(12,24,100,0.13)",
    rootBg:  isDark ? "#07080e"                 : "#f0f2fb",
    hdrBg:   isDark ? "linear-gradient(160deg,#07080e,#0c0e1a,#07080e)" : "linear-gradient(160deg,#f4f5fc,#eef0fb,#f4f5fc)",
    ftBg:    isDark ? "rgba(7,8,14,0.95)"       : "rgba(244,245,252,0.97)",
  };

  /* ─────── STEP 1 ─────── */
  const renderStep1 = () => (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[1.1rem] font-black mb-1" style={{ color: T.text88 }}>
          Informations de votre entreprise
        </h2>
        <p className="text-[0.78rem]" style={{ color: T.text38 }}>
          Ces données seront intégrées dans tous les documents générés.
        </p>
      </div>
      <Card isDark={isDark}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Raison sociale" value={company.nom} onChange={updateCompany("nom")}
              placeholder="ACME Solutions SAS" required isDark={isDark} />
          </div>
          <Field label="SIRET" value={company.siret} onChange={updateCompany("siret")}
            placeholder="12345678901234" hint="14 chiffres" isDark={isDark} />
          <Field label="Téléphone" value={company.telephone} onChange={updateCompany("telephone")}
            placeholder="+33 1 23 45 67 89" type="tel" isDark={isDark} />
          <div className="sm:col-span-2">
            <Field label="Adresse" value={company.adresse} onChange={updateCompany("adresse")}
              placeholder="12 rue de la Paix, 75001 Paris" isDark={isDark} />
          </div>
          <Field label="Email" value={company.email} onChange={updateCompany("email")}
            placeholder="contact@entreprise.fr" type="email" required isDark={isDark} />
          <Field label="Site web" value={company.site} onChange={updateCompany("site")}
            placeholder="www.entreprise.fr" isDark={isDark} />
          <Field label="Effectif" value={company.effectif} onChange={updateCompany("effectif")}
            placeholder="ex : 25 salariés" isDark={isDark} />
          <Field label="Chiffre d'affaires" value={company.chiffre_affaires} onChange={updateCompany("chiffre_affaires")}
            placeholder="ex : 2,4 M€" isDark={isDark} />
          <div className="sm:col-span-2">
            <TextareaField label="Domaines d'activité" value={company.domaines} onChange={updateCompany("domaines")}
              placeholder="Développement web, conseil IT, intégration logiciels..." rows={2} isDark={isDark} />
          </div>
          <div className="sm:col-span-2">
            <TextareaField label="Références clients" value={company.references} onChange={updateCompany("references")}
              placeholder="Mairie de Lyon (2023) — Refonte SI RH — 180 000 €&#10;Région PACA (2022) — Développement portail citoyen — 220 000 €"
              rows={3} hint="Listez vos références similaires, une par ligne. Elles seront mises en avant dans le mémoire technique."
              isDark={isDark} />
          </div>
        </div>
      </Card>
    </div>
  );

  /* ─────── STEP 2 ─────── */
  const renderStep2 = () => (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[1.1rem] font-black mb-1" style={{ color: T.text88 }}>Documents du marché</h2>
        <p className="text-[0.78rem]" style={{ color: T.text38 }}>
          Déposez les documents de l'appel d'offre. Les PDFs sont lus nativement par l'IA.
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className="relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all"
        style={{
          borderColor: dragOver ? "rgba(129,140,248,0.6)" : T.bd10,
          background:  dragOver ? "rgba(129,140,248,0.05)" : T.bg025,
        }}
      >
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.md"
          className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}>
            <Upload size={24} style={{ color: indigo }} />
          </div>
          <div>
            <p className="text-[0.88rem] font-semibold" style={{ color: T.text70 }}>
              Glissez vos documents ou <span style={{ color: indigo }}>parcourez</span>
            </p>
            <p className="mt-1 text-[0.72rem]" style={{ color: T.text30 }}>
              PDF, DOCX, TXT — Cahier des charges, CCTP, règlement...
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <Card isDark={isDark}>
          <div className="space-y-2.5">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: T.bg03, border: `1px solid ${T.bd06}` }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(129,140,248,0.1)" }}>
                  <File size={14} style={{ color: indigo }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8rem] font-semibold" style={{ color: T.text80 }}>{f.name}</p>
                  <p className="text-[0.65rem]" style={{ color: T.text30 }}>{formatBytes(f.size)}</p>
                </div>
                <select
                  value={f.category}
                  onChange={e => setFiles(prev => prev.map(p => p.id === f.id ? { ...p, category: e.target.value } : p))}
                  className="rounded-lg px-2.5 py-1.5 text-[0.7rem] outline-none"
                  style={{
                    background: T.bg05,
                    border: `1px solid ${T.bd07}`,
                    color: T.text60,
                  }}
                >
                  {FILE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <button onClick={() => setFiles(prev => prev.filter(p => p.id !== f.id))}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-red-500/10 hover:text-red-400"
                  style={{ color: T.text25 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {files.length === 0 && (
        <p className="text-center text-[0.75rem]" style={{ color: T.text25 }}>
          Vous pouvez continuer sans document — l'IA effectuera une analyse générique.
        </p>
      )}
    </div>
  );

  /* ─────── STEP 3 ─────── */
  const renderStep3 = () => {
    if (analyzing) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -m-8 rounded-full opacity-15"
              style={{ background: `radial-gradient(circle,${indigo},transparent 70%)` }} />
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}>
              <Brain size={36} style={{ color: indigo }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[1rem] font-black" style={{ color: T.text80 }}>Analyse en cours…</p>
            <p className="mt-1 text-[0.78rem]" style={{ color: T.text38 }}>L'IA lit vos documents et analyse le marché</p>
          </div>
          <Loader2 size={20} className="animate-spin" style={{ color: T.text30 }} />
        </div>
      );
    }

    if (analyzeError) {
      return (
        <div className="flex flex-col items-center gap-4 py-12 max-w-md mx-auto text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: T.text80 }}>Erreur d'analyse</p>
            <p className="text-[0.78rem]" style={{ color: T.text40 }}>{analyzeError}</p>
          </div>
          <button onClick={runAnalysis}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.82rem] font-semibold transition"
            style={{ background: "rgba(129,140,248,0.12)", color: indigo, border: "1px solid rgba(129,140,248,0.25)" }}>
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      );
    }

    if (!analysis) return null;

    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[1.1rem] font-black mb-1" style={{ color: T.text88 }}>Analyse de votre dossier</h2>
          <p className="text-[0.78rem]" style={{ color: T.text38 }}>Résultats de l'analyse IA — vérifiez avant de générer.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Type",   value: analysis.type_marche,             icon: Award },
            { label: "Budget", value: analysis.budget_estime   || "N/A", icon: Euro },
            { label: "Délai",  value: analysis.echeance_depot  || "N/A", icon: Clock },
            { label: "Durée",  value: analysis.duree_marche    || "N/A", icon: TrendingUp },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-3"
              style={{ background: T.bg025, border: `1px solid ${T.bd06}` }}>
              <p className="text-[0.62rem] font-semibold uppercase tracking-wider mb-1" style={{ color: T.text35 }}>
                {item.label}
              </p>
              <p className="text-[0.82rem] font-black truncate" style={{ color: T.text80 }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Card isDark={isDark} className="flex-1">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider mb-2" style={{ color: T.text40 }}>
              Objet du marché
            </p>
            <p className="text-[0.9rem] font-bold mb-3" style={{ color: T.text80 }}>{analysis.objet}</p>
            <p className="text-[0.8rem] leading-relaxed" style={{ color: T.text55 }}>{analysis.summary}</p>
          </Card>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <SuccessRing taux={analysis.taux_succes || 0} isDark={isDark} />
            <p className="text-[0.65rem] text-center max-w-[80px]" style={{ color: T.text35 }}>
              Taux de réussite estimé
            </p>
          </div>
        </div>

        {analysis.criteres_notation?.length > 0 && (
          <Card isDark={isDark}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: T.text40 }}>
              Critères de notation
            </p>
            <div className="space-y-2">
              {analysis.criteres_notation.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-black text-white"
                    style={{ background: `rgba(129,140,248,${0.15 + i * 0.05})` }}>
                    {c.poids}
                  </span>
                  <div>
                    <p className="text-[0.82rem] font-semibold" style={{ color: T.text80 }}>{c.critere}</p>
                    <p className="text-[0.72rem]" style={{ color: T.text40 }}>{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {analysis.points_forts?.length > 0 && (
            <Card isDark={isDark}>
              <p className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: T.text40 }}>
                Points forts
              </p>
              <div className="space-y-1.5">
                {analysis.points_forts.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: emerald }} />
                    <p className="text-[0.78rem]" style={{ color: T.text60 }}>{p}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {analysis.points_vigilance?.length > 0 && (
            <Card isDark={isDark}>
              <p className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: T.text40 }}>
                Points de vigilance
              </p>
              <div className="space-y-1.5">
                {analysis.points_vigilance.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
                    <p className="text-[0.78rem]" style={{ color: T.text60 }}>{p}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {analysis.pieces_manquantes?.length > 0 && (
          <Card isDark={isDark}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: T.text40 }}>
              Pièces à préparer
            </p>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {analysis.pieces_manquantes.map((p, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-[0.75rem]" style={{ color: T.text60 }}>{p}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {analysis.conseils?.length > 0 && (
          <Card isDark={isDark}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: T.text40 }}>
              Conseils stratégiques
            </p>
            <div className="space-y-2">
              {analysis.conseils.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Star size={12} className="mt-1 shrink-0" style={{ color: "#f59e0b" }} />
                  <p className="text-[0.8rem]" style={{ color: T.text60 }}>{c}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  /* ─────── STEP 4 ─────── */
  const renderStep4 = () => {
    if (!analysis) return null;

    if (!generating && generatedDocs.length === 0) {
      return (
        <div className="space-y-5 max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-[1.1rem] font-black mb-1" style={{ color: T.text88 }}>
              Sélectionnez les documents à générer
            </h2>
            <p className="text-[0.78rem]" style={{ color: T.text38 }}>
              Choisissez les documents dont vous avez besoin pour votre candidature.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {DOC_OPTIONS.map(opt => {
              const sel  = selectedDocs.includes(opt.id);
              const Icon = opt.icon;
              return (
                <button key={opt.id}
                  onClick={() => setSelectedDocs(prev => sel ? prev.filter(d => d !== opt.id) : [...prev, opt.id])}
                  className="flex items-start gap-3 rounded-xl p-3.5 text-left transition-all"
                  style={{
                    background: sel ? "rgba(129,140,248,0.08)" : T.bg025,
                    border: `1px solid ${sel ? "rgba(129,140,248,0.35)" : T.bd07}`,
                  }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: sel ? "rgba(129,140,248,0.15)" : T.bg05 }}>
                    <Icon size={15} style={{ color: sel ? indigo : T.text35 }} />
                  </div>
                  <div>
                    <p className="text-[0.82rem] font-semibold" style={{ color: sel ? T.text88 : T.text55 }}>
                      {opt.label}
                    </p>
                    <p className="text-[0.68rem]" style={{ color: T.text30 }}>{opt.desc}</p>
                  </div>
                  {sel && <Check size={14} className="ml-auto mt-0.5 shrink-0" style={{ color: indigo }} />}
                </button>
              );
            })}
          </div>
          {generateError && (
            <div className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-[0.78rem] text-red-400">{generateError}</p>
            </div>
          )}
          <button
            onClick={runGeneration}
            disabled={selectedDocs.length === 0 || generating}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 font-black text-[0.9rem] transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,rgba(129,140,248,0.9),rgba(96,165,250,0.8))", color: "#fff" }}
          >
            <Sparkles size={16} />
            Générer {selectedDocs.length} document{selectedDocs.length > 1 ? "s" : ""}
          </button>
        </div>
      );
    }

    if (generating) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -m-8 rounded-full opacity-15"
              style={{ background: `radial-gradient(circle,${indigo},transparent 70%)` }} />
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}>
              <Sparkles size={36} style={{ color: indigo }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[1rem] font-black" style={{ color: T.text80 }}>Génération en cours…</p>
            <p className="mt-1 text-[0.78rem]" style={{ color: T.text38 }}>
              Rédaction de {selectedDocs.length} documents professionnels — cela peut prendre 2-3 minutes
            </p>
          </div>
          <Loader2 size={20} className="animate-spin" style={{ color: T.text30 }} />
        </div>
      );
    }

    const activeDoc = generatedDocs.find(d => d.id === activeDocTab);

    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-[1.1rem] font-black mb-0.5" style={{ color: T.text88 }}>Documents générés</h2>
            <p className="text-[0.75rem]" style={{ color: T.text38 }}>
              {generatedDocs.length} documents prêts à être complétés
            </p>
          </div>
          <button onClick={() => { setGeneratedDocs([]); setActiveDocTab(""); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.75rem] transition"
            style={{ background: T.bg05, border: `1px solid ${T.bd07}`, color: T.text40 }}>
            <RefreshCw size={12} /> Régénérer
          </button>
        </div>

        <div className="flex gap-4 min-h-[480px]">
          <div className="flex flex-col gap-1 w-48 shrink-0">
            {generatedDocs.map(d => {
              const opt  = DOC_OPTIONS.find(o => o.id === d.id);
              const Icon = opt?.icon || FileText;
              const active = activeDocTab === d.id;
              return (
                <button key={d.id}
                  onClick={() => setActiveDocTab(d.id)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    background: active ? "rgba(129,140,248,0.1)" : "transparent",
                    border: `1px solid ${active ? "rgba(129,140,248,0.3)" : "transparent"}`,
                  }}>
                  <Icon size={13} style={{ color: active ? indigo : T.text30, flexShrink: 0 }} />
                  <span className="text-[0.72rem] font-semibold leading-tight"
                    style={{ color: active ? T.text80 : T.text40 }}>
                    {d.title}
                  </span>
                </button>
              );
            })}
          </div>

          {activeDoc && (
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
              style={{
                background: T.bg025,
                border: `1px solid ${editingDocId === activeDoc.id ? "rgba(129,140,248,0.35)" : T.bd07}`,
              }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${T.bd06}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[0.82rem] font-black" style={{ color: T.text80 }}>{activeDoc.title}</span>
                  {editingDocId === activeDoc.id && (
                    <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wider"
                      style={{ background: "rgba(129,140,248,0.15)", color: indigo }}>
                      Édition
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingDocId === activeDoc.id ? (
                    <>
                      <button onClick={cancelEdit}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold transition"
                        style={{ background: T.bg05, color: T.text45 }}>
                        <X size={12} /> Annuler
                      </button>
                      <button onClick={saveEdit}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold"
                        style={{ background: "rgba(129,140,248,0.15)", color: indigo, border: "1px solid rgba(129,140,248,0.3)" }}>
                        <Save size={12} /> Sauvegarder
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => regenerateDoc(activeDoc.id)}
                        disabled={regeneratingDocId === activeDoc.id}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold transition disabled:opacity-40"
                        style={{ background: T.bg04, color: T.text35 }}>
                        {regeneratingDocId === activeDoc.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <RefreshCw size={12} />}
                      </button>
                      <button onClick={() => startEdit(activeDoc)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold transition"
                        style={{ background: T.bg04, color: T.text40 }}>
                        <Pencil size={12} /> Éditer
                      </button>
                      <button onClick={() => handleCopy(activeDoc.id, activeDoc.content)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold transition"
                        style={{ background: T.bg05, color: copiedId === activeDoc.id ? emerald : T.text45 }}>
                        {copiedId === activeDoc.id ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
                      </button>
                      <button onClick={() => downloadDoc(activeDoc)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold transition"
                        style={{ background: "rgba(129,140,248,0.08)", color: indigo, border: "1px solid rgba(129,140,248,0.2)" }}>
                        <Download size={12} /> PDF
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
                    className="w-full min-h-[380px] max-h-[540px] resize-none outline-none font-mono text-[0.78rem] leading-relaxed overflow-y-auto"
                    style={{ background: "transparent", color: T.text80, caretColor: indigo }}
                    autoFocus
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-[0.78rem] leading-relaxed font-mono"
                    style={{ color: T.text60 }}>
                    {activeDoc.content}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ─────── STEP 5 ─────── */
  const renderStep5 = () => {
    const checks = [
      { id: "kbis",      label: "KBIS de moins de 3 mois" },
      { id: "urssaf",    label: "Attestation de vigilance URSSAF" },
      { id: "impots",    label: "Attestation fiscale (DGFiP)" },
      { id: "assurance", label: "Attestation d'assurance RC pro" },
      { id: "dc1",       label: "DC1 signé et daté" },
      { id: "dc2",       label: "DC2 complété" },
      { id: "memoire",   label: "Mémoire technique inclus" },
      { id: "offre_prix",label: "Offre financière / BPU" },
      { id: "references",label: "Attestations de références" },
      { id: "delai",     label: "Dépôt avant la date limite" },
      { id: "signature", label: "Tous les documents signés" },
      { id: "format",    label: "Format PDF/dématérialisé conforme" },
    ];
    const checkedCount = checks.filter(c => verifChecks[c.id]).length;
    const pct = Math.round((checkedCount / checks.length) * 100);

    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[1.1rem] font-black mb-1" style={{ color: T.text88 }}>Vérification finale</h2>
          <p className="text-[0.78rem]" style={{ color: T.text38 }}>
            Confirmez chaque point avant de soumettre votre dossier.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.15)" }}>
          <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: T.bg08 }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? emerald : "rgba(129,140,248,0.8)" }} />
          </div>
          <span className="text-[0.78rem] font-black" style={{ color: pct === 100 ? emerald : indigo }}>
            {checkedCount}/{checks.length}
          </span>
        </div>

        <Card isDark={isDark}>
          <div className="space-y-1.5">
            {checks.map(c => (
              <button key={c.id}
                onClick={() => setVerifChecks(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-all"
                style={{
                  background: verifChecks[c.id]
                    ? "rgba(52,211,153,0.05)"
                    : isDark ? "rgba(255,255,255,0.02)" : "rgba(12,24,100,0.02)",
                }}>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition"
                  style={{
                    background: verifChecks[c.id] ? emerald : T.bg06,
                    border: `1px solid ${verifChecks[c.id] ? emerald : T.bd10}`,
                  }}>
                  {verifChecks[c.id] && <Check size={11} className="text-white" />}
                </div>
                <span className="text-[0.82rem]"
                  style={{ color: verifChecks[c.id] ? T.text70 : T.text50 }}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {pct === 100 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }}>
            <Shield size={18} style={{ color: emerald }} />
            <div>
              <p className="text-[0.85rem] font-black" style={{ color: emerald }}>Dossier complet !</p>
              <p className="text-[0.72rem]" style={{ color: T.text45 }}>Votre candidature est prête pour soumission.</p>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  /* ─────── STEP 6 ─────── */
  const renderStep6 = () => (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[1.1rem] font-black mb-1" style={{ color: T.text88 }}>Exporter votre dossier</h2>
        <p className="text-[0.78rem]" style={{ color: T.text38 }}>
          Téléchargez vos documents dans le format de votre choix.
        </p>
      </div>

      <div className="grid gap-4">
        <button onClick={exportPDF}
          className="flex items-center gap-4 rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
          style={{ background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.25)" }}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(129,140,248,0.15)" }}>
            <FileText size={22} style={{ color: indigo }} />
          </div>
          <div className="flex-1">
            <p className="text-[0.9rem] font-black" style={{ color: T.text88 }}>PDF complet</p>
            <p className="text-[0.75rem]" style={{ color: T.text40 }}>
              Tous les documents en un seul fichier PDF professionnel
            </p>
          </div>
          <Download size={18} style={{ color: indigo }} />
        </button>

        <button onClick={downloadAllDocs}
          className="flex items-center gap-4 rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
          style={{ background: T.bg025, border: `1px solid ${T.bd07}` }}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: T.bg05 }}>
            <Package size={22} style={{ color: T.text40 }} />
          </div>
          <div className="flex-1">
            <p className="text-[0.9rem] font-black" style={{ color: T.text80 }}>Documents individuels (PDF)</p>
            <p className="text-[0.75rem]" style={{ color: T.text35 }}>
              Chaque document dans son propre PDF professionnel
            </p>
          </div>
          <Download size={18} style={{ color: T.text35 }} />
        </button>

        {generatedDocs.length > 0 && (
          <Card isDark={isDark}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: T.text40 }}>
              Documents individuels
            </p>
            <div className="space-y-2">
              {generatedDocs.map(doc => {
                const opt  = DOC_OPTIONS.find(o => o.id === doc.id);
                const Icon = opt?.icon || FileText;
                return (
                  <div key={doc.id} className="flex items-center gap-3">
                    <Icon size={14} style={{ color: T.text30 }} className="shrink-0" />
                    <span className="flex-1 text-[0.8rem]" style={{ color: T.text60 }}>{doc.title}</span>
                    <button onClick={() => handleCopy(doc.id, doc.content)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.68rem] transition"
                      style={{ background: T.bg04, color: T.text35 }}>
                      {copiedId === doc.id ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                    <button onClick={() => downloadDoc(doc)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.68rem] transition"
                      style={{ background: "rgba(129,140,248,0.07)", color: indigo }}>
                      <Download size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.12)" }}>
        <Info size={14} className="mt-0.5 shrink-0" style={{ color: blue }} />
        <p className="text-[0.75rem]" style={{ color: T.text45 }}>
          <strong style={{ color: T.text60 }}>Conseil :</strong>{" "}
          Relisez chaque document et personnalisez les passages entre crochets avant soumission.
          Ces documents sont des bases professionnelles à adapter à votre contexte exact.
        </p>
      </div>
    </div>
  );

  /* ── NAV BUTTONS ── */
  const needsGenerate = step === 4 && generatedDocs.length === 0 && !generating;
  const canProceed = () => {
    if (step === 1) return company.nom.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return analysis !== null;
    if (needsGenerate) return true;
    if (step === 4) return generatedDocs.length > 0;
    return true;
  };
  const handleNext = async () => {
    if (step === 2)    { await runAnalysis();   return; }
    if (needsGenerate) { await runGeneration(); return; }
    setStep(s => Math.min(s + 1, 6));
  };
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: T.rootBg }}>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden shrink-0" style={{ background: T.hdrBg }}>
        <div className="pointer-events-none absolute -top-10 -left-8 h-40 w-40 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle,#818cf8,transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-6 right-16 h-28 w-28 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle,#60a5fa,transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: isDark
            ? "linear-gradient(90deg,rgba(129,140,248,0.45),rgba(96,165,250,0.18),transparent)"
            : "linear-gradient(90deg,rgba(129,140,248,0.25),rgba(96,165,250,0.10),transparent)" }} />

        <div className="relative px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/client/sourcing"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition"
              style={{
                border: `1px solid ${T.bd07}`,
                background: "transparent",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = T.bg05)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <ArrowLeft size={15} style={{ color: T.text50 }} />
            </Link>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.25)" }}>
                <Target size={17} style={{ color: indigo }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-[0.95rem] font-black leading-tight truncate" style={{ color: T.text88 }}>
                  Répondre à un appel d'offre
                </h1>
                <p className="text-[0.65rem]" style={{ color: T.text35 }}>
                  Assistant IA — Marchés publics & privés
                </p>
              </div>
            </div>
          </div>
          <StepIndicator current={step} isDark={isDark} />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 sm:px-6 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
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

      {/* ── FOOTER NAV ── */}
      {!analyzing && !generating && (
        <div className="shrink-0 px-4 py-3 sm:px-6"
          style={{
            borderTop: `1px solid ${T.bd06}`,
            background: T.ftBg,
            backdropFilter: "blur(12px)",
          }}>
          <div className="flex items-center justify-between max-w-3xl mx-auto gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={step === 1}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.82rem] font-semibold transition disabled:opacity-30"
                style={{
                  background: T.bg04,
                  color: T.text55,
                  border: `1px solid ${T.bd07}`,
                }}
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              {step > 1 && (
                <button onClick={resetWizard}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[0.78rem] font-semibold transition"
                  style={{ color: "rgba(239,100,100,0.72)" }}>
                  <RotateCcw size={13} /> Recommencer
                </button>
              )}
            </div>

            <span className="text-[0.72rem]" style={{ color: T.text25 }}>
              Étape {step} / {STEPS.length}
            </span>

            {step < 6 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.82rem] font-black transition-all disabled:opacity-35 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,rgba(129,140,248,0.85),rgba(96,165,250,0.75))", color: "#fff" }}
              >
                {step === 2
                  ? (<><Brain size={15} /> Analyser</>)
                  : needsGenerate
                    ? (<><Sparkles size={15} /> Générer {selectedDocs.length} doc{selectedDocs.length > 1 ? "s" : ""}</>)
                    : (<>Suivant <ChevronRight size={15} /></>)
                }
              </button>
            ) : (
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.82rem] font-black transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,rgba(129,140,248,0.85),rgba(96,165,250,0.75))", color: "#fff" }}
              >
                <Download size={15} /> Exporter PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
