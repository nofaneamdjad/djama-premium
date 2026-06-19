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

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface CompanyInfo {
  nom: string;
  siret: string;
  adresse: string;
  telephone: string;
  email: string;
  site: string;
  effectif: string;
  chiffre_affaires: string;
  references: string;
  domaines: string;
}

interface UploadedFile {
  id: string;
  name: string;
  category: string;
  size: number;
  mimeType: string;
  base64?: string;
  text?: string;
}

interface Requirement {
  label: string;
  obligatoire: boolean;
  detail: string;
}

interface CritereNotation {
  critere: string;
  poids: string;
  detail: string;
}

interface PieceDossier {
  nom: string;
  obligatoire: boolean;
  present: boolean;
}

interface AnalysisResult {
  summary: string;
  type_marche: string;
  objet: string;
  pouvoir_adjudicateur: string;
  budget_estime: string | null;
  echeance_depot: string | null;
  duree_marche: string | null;
  requirements: Requirement[];
  criteres_notation: CritereNotation[];
  pieces_dossier: PieceDossier[];
  pieces_manquantes: string[];
  points_forts: string[];
  points_vigilance: string[];
  taux_succes: number;
  conseils: string[];
  documents_detectes: string[];
}

interface GeneratedDoc {
  id: string;
  title: string;
  content: string;
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const indigo = "#818cf8";
const blue = "#60a5fa";
const emerald = "#34d399";

const STEPS = [
  { id: 1, label: "Entreprise", icon: Building2, short: "Infos" },
  { id: 2, label: "Documents", icon: Upload, short: "Upload" },
  { id: 3, label: "Analyse IA", icon: Brain, short: "Analyse" },
  { id: 4, label: "Génération", icon: Sparkles, short: "Génère" },
  { id: 5, label: "Vérification", icon: CheckCircle2, short: "Vérifie" },
  { id: 6, label: "Export", icon: Download, short: "Export" },
];

const FILE_CATEGORIES = [
  { id: "cahier_charges", label: "Cahier des charges" },
  { id: "reglement", label: "Règlement de consultation" },
  { id: "cctp", label: "CCTP" },
  { id: "ccap", label: "CCAP" },
  { id: "dpgf", label: "DPGF / BPU" },
  { id: "autre", label: "Autre document" },
];

const DOC_OPTIONS = [
  { id: "memoire_technique", label: "Mémoire technique", icon: BookOpen, desc: "Présentation méthodologie & compétences" },
  { id: "lettre_candidature", label: "Lettre de candidature DC1", icon: FileText, desc: "Déclaration légale de candidature" },
  { id: "offre_commerciale", label: "Offre commerciale & prix", icon: Euro, desc: "Décomposition prix et conditions" },
  { id: "planning", label: "Planning prévisionnel", icon: Clock, desc: "Phasage et jalons du projet" },
  { id: "note_methodologie", label: "Note méthodologique", icon: Target, desc: "Approche technique détaillée" },
  { id: "dc2", label: "DC2 — Déclaration candidat", icon: ClipboardList, desc: "Formulaire officiel DC2" },
  { id: "attestations", label: "Liste des attestations", icon: FileCheck, desc: "Documents administratifs requis" },
  { id: "synthese_executive", label: "Synthèse exécutive", icon: Zap, desc: "Résumé percutant pour décideurs" },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result.split(",")[1]);
    };
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
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FIELD
───────────────────────────────────────────────────────── */
function Field({
  label, value, onChange, placeholder = "", required = false, type = "text", hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.72rem] font-semibold text-white/50 uppercase tracking-wider">
        {label}{required && <span className="ml-1 text-indigo-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl px-3.5 py-2.5 text-[0.85rem] text-white/85 placeholder:text-white/22 outline-none transition"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(129,140,248,0.5)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
      />
      {hint && <p className="text-[0.67rem] text-white/30">{hint}</p>}
    </div>
  );
}

function TextareaField({
  label, value, onChange, placeholder = "", rows = 3, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.72rem] font-semibold text-white/50 uppercase tracking-wider">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-xl px-3.5 py-2.5 text-[0.85rem] text-white/85 placeholder:text-white/22 outline-none transition resize-none"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(129,140,248,0.5)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
      />
      {hint && <p className="text-[0.67rem] text-white/30">{hint}</p>}
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
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={{
                  background: done ? "rgba(129,140,248,0.9)" : active ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.05)",
                  border: active ? "1.5px solid rgba(129,140,248,0.7)" : done ? "none" : "1px solid rgba(255,255,255,0.09)",
                  color: done ? "#fff" : active ? indigo : "rgba(255,255,255,0.3)",
                }}
              >
                {done ? <Check size={13} /> : <Icon size={13} />}
              </div>
              <span
                className="text-[0.6rem] font-semibold hidden sm:block"
                style={{ color: active ? indigo : done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)" }}
              >
                {step.short}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mx-1.5 h-[1px] w-6 sm:w-10 shrink-0"
                style={{ background: done ? "rgba(129,140,248,0.6)" : "rgba(255,255,255,0.07)" }}
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
function SuccessRing({ taux }: { taux: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - taux / 100);
  const color = taux >= 70 ? emerald : taux >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="text-center">
        <span className="block text-xl font-black text-white">{taux}%</span>
        <span className="block text-[0.55rem] font-semibold text-white/40">SUCCÈS</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export default function AppelOffrePage() {
  const [step, setStep] = useState(1);

  /* Company info */
  const [company, setCompany] = useState<CompanyInfo>({
    nom: "", siret: "", adresse: "", telephone: "",
    email: "", site: "", effectif: "", chiffre_affaires: "",
    references: "", domaines: "",
  });

  /* Files */
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Analysis */
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  /* Generation */
  const [selectedDocs, setSelectedDocs] = useState<string[]>(DOC_OPTIONS.map(d => d.id));
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  /* Verification */
  const [verifChecks, setVerifChecks] = useState<Record<string, boolean>>({});

  const updateCompany = (field: keyof CompanyInfo) => (val: string) =>
    setCompany(c => ({ ...c, [field]: val }));

  /* ── File handling ── */
  const processFile = useCallback(async (f: File): Promise<UploadedFile> => {
    const isPdf = f.type === "application/pdf";
    const isText = f.type.startsWith("text/") || f.name.endsWith(".txt") || f.name.endsWith(".md");
    let base64: string | undefined;
    let text: string | undefined;

    if (isPdf) {
      base64 = await readFileAsBase64(f);
    } else if (isText) {
      text = await readFileAsText(f);
    }

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      category: "autre",
      size: f.size,
      mimeType: f.type || "application/octet-stream",
      base64,
      text,
    };
  }, []);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const processed = await Promise.all(arr.map(processFile));
    setFiles(prev => [...prev, ...processed]);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  /* ── Analysis ── */
  const runAnalysis = async () => {
    setStep(3);           // Afficher l'écran de chargement immédiatement
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/sourcing/appel-offre/analyze", {
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

  /* ── Generation ── */
  const runGeneration = async () => {
    if (!analysis) return;
    setGenerating(true);
    setGenerateError(null);
    setGeneratedDocs([]);
    setActiveDocTab("");
    try {
      const res = await fetch("/api/sourcing/appel-offre/generate", {
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

  /* ── Copy ── */
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

  const handleCopy = (id: string, content: string) => {
    copyToClipboard(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Download ── */
  const pdfMeta = () => ({
    mode: "appel-offre" as const,
    entreprise: company.nom || "Candidat",
    marche: analysis?.objet ?? analysis?.summary ?? "Appel d'offre",
    acheteur: analysis?.pouvoir_adjudicateur ?? "",
  });

  const downloadDoc = async (doc: GeneratedDoc) => {
    const { downloadSingleDocPDF } = await import("@/lib/sourcing-pdf");
    downloadSingleDocPDF(doc, pdfMeta());
  };

  const downloadAllDocs = async () => {
    const { downloadSourcingPDF } = await import("@/lib/sourcing-pdf");
    downloadSourcingPDF(generatedDocs, pdfMeta());
  };

  const exportPDF = async () => {
    const { downloadSourcingPDF } = await import("@/lib/sourcing-pdf");
    downloadSourcingPDF(generatedDocs, pdfMeta());
  };

  /* ─────── RENDERS ─────── */

  const renderStep1 = () => (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Informations de votre entreprise</h2>
        <p className="text-[0.78rem] text-white/38">Ces données seront intégrées dans tous les documents générés.</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Raison sociale" value={company.nom} onChange={updateCompany("nom")}
              placeholder="ACME Solutions SAS" required />
          </div>
          <Field label="SIRET" value={company.siret} onChange={updateCompany("siret")}
            placeholder="12345678901234" hint="14 chiffres" />
          <Field label="Téléphone" value={company.telephone} onChange={updateCompany("telephone")}
            placeholder="+33 1 23 45 67 89" type="tel" />
          <div className="sm:col-span-2">
            <Field label="Adresse" value={company.adresse} onChange={updateCompany("adresse")}
              placeholder="12 rue de la Paix, 75001 Paris" />
          </div>
          <Field label="Email" value={company.email} onChange={updateCompany("email")}
            placeholder="contact@entreprise.fr" type="email" required />
          <Field label="Site web" value={company.site} onChange={updateCompany("site")}
            placeholder="www.entreprise.fr" />
          <Field label="Effectif" value={company.effectif} onChange={updateCompany("effectif")}
            placeholder="ex : 25 salariés" />
          <Field label="Chiffre d'affaires" value={company.chiffre_affaires} onChange={updateCompany("chiffre_affaires")}
            placeholder="ex : 2,4 M€" />
          <div className="sm:col-span-2">
            <TextareaField label="Domaines d'activité" value={company.domaines} onChange={updateCompany("domaines")}
              placeholder="Développement web, conseil IT, intégration logiciels..." rows={2} />
          </div>
          <div className="sm:col-span-2">
            <TextareaField label="Références clients" value={company.references} onChange={updateCompany("references")}
              placeholder="Mairie de Lyon (2023) — Refonte SI RH — 180 000 €&#10;Région PACA (2022) — Développement portail citoyen — 220 000 €" rows={3}
              hint="Listez vos références similaires, une par ligne. Elles seront mises en avant dans le mémoire technique." />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Documents du marché</h2>
        <p className="text-[0.78rem] text-white/38">
          Déposez les documents de l'appel d'offre. Les PDFs sont lus nativement par l'IA.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className="relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all"
        style={{
          borderColor: dragOver ? "rgba(129,140,248,0.6)" : "rgba(255,255,255,0.1)",
          background: dragOver ? "rgba(129,140,248,0.05)" : "rgba(255,255,255,0.02)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md"
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}>
            <Upload size={24} style={{ color: indigo }} />
          </div>
          <div>
            <p className="text-[0.88rem] font-semibold text-white/70">
              Glissez vos documents ou <span style={{ color: indigo }}>parcourez</span>
            </p>
            <p className="mt-1 text-[0.72rem] text-white/30">
              PDF, DOCX, TXT — Cahier des charges, CCTP, règlement...
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card>
          <div className="space-y-2.5">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(129,140,248,0.1)" }}>
                  <File size={14} style={{ color: indigo }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8rem] font-semibold text-white/80">{f.name}</p>
                  <p className="text-[0.65rem] text-white/30">{formatBytes(f.size)}</p>
                </div>
                <select
                  value={f.category}
                  onChange={e => setFiles(prev => prev.map(p => p.id === f.id ? { ...p, category: e.target.value } : p))}
                  className="rounded-lg px-2.5 py-1.5 text-[0.7rem] text-white/60 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {FILE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <button onClick={() => setFiles(prev => prev.filter(p => p.id !== f.id))}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/25 transition hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {files.length === 0 && (
        <p className="text-center text-[0.75rem] text-white/25">
          Vous pouvez continuer sans document — l'IA effectuera une analyse générique.
        </p>
      )}
    </div>
  );

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
            <p className="text-[1rem] font-black text-white/80">Analyse en cours…</p>
            <p className="mt-1 text-[0.78rem] text-white/38">L'IA lit vos documents et analyse le marché</p>
          </div>
          <Loader2 size={20} className="animate-spin text-white/30" />
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
            <p className="font-semibold text-white/80 mb-1">Erreur d'analyse</p>
            <p className="text-[0.78rem] text-white/40">{analyzeError}</p>
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
          <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Analyse de votre dossier</h2>
          <p className="text-[0.78rem] text-white/38">Résultats de l'analyse IA — vérifiez avant de générer.</p>
        </div>

        {/* Overview row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Type", value: analysis.type_marche, icon: Award },
            { label: "Budget", value: analysis.budget_estime || "N/A", icon: Euro },
            { label: "Délai", value: analysis.echeance_depot || "N/A", icon: Clock },
            { label: "Durée", value: analysis.duree_marche || "N/A", icon: TrendingUp },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[0.62rem] font-semibold text-white/35 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-[0.82rem] font-black text-white/80 truncate">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Summary + taux */}
        <div className="flex gap-4">
          <Card className="flex-1">
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-2">Objet du marché</p>
            <p className="text-[0.9rem] font-bold text-white/85 mb-3">{analysis.objet}</p>
            <p className="text-[0.8rem] text-white/55 leading-relaxed">{analysis.summary}</p>
          </Card>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <SuccessRing taux={analysis.taux_succes || 0} />
            <p className="text-[0.65rem] text-white/35 text-center max-w-[80px]">Taux de réussite estimé</p>
          </div>
        </div>

        {/* Critères de notation */}
        {analysis.criteres_notation?.length > 0 && (
          <Card>
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Critères de notation</p>
            <div className="space-y-2">
              {analysis.criteres_notation.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-black text-white"
                    style={{ background: `rgba(129,140,248,${0.15 + i * 0.05})` }}>
                    {c.poids}
                  </span>
                  <div>
                    <p className="text-[0.82rem] font-semibold text-white/80">{c.critere}</p>
                    <p className="text-[0.72rem] text-white/40">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Points forts / vigilance */}
        <div className="grid sm:grid-cols-2 gap-4">
          {analysis.points_forts?.length > 0 && (
            <Card>
              <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Points forts</p>
              <div className="space-y-1.5">
                {analysis.points_forts.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: emerald }} />
                    <p className="text-[0.78rem] text-white/65">{p}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {analysis.points_vigilance?.length > 0 && (
            <Card>
              <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Points de vigilance</p>
              <div className="space-y-1.5">
                {analysis.points_vigilance.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
                    <p className="text-[0.78rem] text-white/65">{p}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Pièces manquantes */}
        {analysis.pieces_manquantes?.length > 0 && (
          <Card>
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Pièces à préparer</p>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {analysis.pieces_manquantes.map((p, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-[0.75rem] text-white/60">{p}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Conseils */}
        {analysis.conseils?.length > 0 && (
          <Card>
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Conseils stratégiques</p>
            <div className="space-y-2">
              {analysis.conseils.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Star size={12} className="mt-1 shrink-0" style={{ color: "#f59e0b" }} />
                  <p className="text-[0.8rem] text-white/60">{c}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderStep4 = () => {
    if (!analysis) return null;

    if (!generating && generatedDocs.length === 0) {
      return (
        <div className="space-y-5 max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Sélectionnez les documents à générer</h2>
            <p className="text-[0.78rem] text-white/38">Choisissez les documents dont vous avez besoin pour votre candidature.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {DOC_OPTIONS.map(opt => {
              const sel = selectedDocs.includes(opt.id);
              const Icon = opt.icon;
              return (
                <button key={opt.id}
                  onClick={() => setSelectedDocs(prev => sel ? prev.filter(d => d !== opt.id) : [...prev, opt.id])}
                  className="flex items-start gap-3 rounded-xl p-3.5 text-left transition-all"
                  style={{
                    background: sel ? "rgba(129,140,248,0.08)" : "rgba(255,255,255,0.025)",
                    border: `1px solid ${sel ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.07)"}`,
                  }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: sel ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.04)" }}>
                    <Icon size={15} style={{ color: sel ? indigo : "rgba(255,255,255,0.35)" }} />
                  </div>
                  <div>
                    <p className="text-[0.82rem] font-semibold" style={{ color: sel ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.55)" }}>
                      {opt.label}
                    </p>
                    <p className="text-[0.68rem] text-white/30">{opt.desc}</p>
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
              <p className="text-[0.78rem] text-red-300">{generateError}</p>
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
            <p className="text-[1rem] font-black text-white/80">Génération en cours…</p>
            <p className="mt-1 text-[0.78rem] text-white/38">
              Rédaction de {selectedDocs.length} documents professionnels — cela peut prendre 2-3 minutes
            </p>
          </div>
          <Loader2 size={20} className="animate-spin text-white/30" />
        </div>
      );
    }

    /* Documents générés */
    const activeDoc = generatedDocs.find(d => d.id === activeDocTab);

    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-[1.1rem] font-black text-white/88 mb-0.5">Documents générés</h2>
            <p className="text-[0.75rem] text-white/38">{generatedDocs.length} documents prêts à être complétés</p>
          </div>
          <button onClick={() => { setGeneratedDocs([]); setActiveDocTab(""); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.75rem] text-white/40 transition hover:text-white/60"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <RefreshCw size={12} /> Régénérer
          </button>
        </div>

        <div className="flex gap-4 min-h-[480px]">
          {/* Tab list */}
          <div className="flex flex-col gap-1 w-48 shrink-0">
            {generatedDocs.map(d => {
              const opt = DOC_OPTIONS.find(o => o.id === d.id);
              const Icon = opt?.icon || FileText;
              return (
                <button key={d.id}
                  onClick={() => setActiveDocTab(d.id)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    background: activeDocTab === d.id ? "rgba(129,140,248,0.1)" : "transparent",
                    border: `1px solid ${activeDocTab === d.id ? "rgba(129,140,248,0.3)" : "transparent"}`,
                  }}>
                  <Icon size={13} style={{ color: activeDocTab === d.id ? indigo : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                  <span className="text-[0.72rem] font-semibold leading-tight"
                    style={{ color: activeDocTab === d.id ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)" }}>
                    {d.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {activeDoc && (
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${editingDocId === activeDoc.id ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.07)"}` }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-[0.82rem] font-black text-white/80">{activeDoc.title}</span>
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
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
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
                      <button onClick={() => startEdit(activeDoc)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold transition"
                        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}>
                        <Pencil size={12} /> Éditer
                      </button>
                      <button onClick={() => handleCopy(activeDoc.id, activeDoc.content)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold transition"
                        style={{ background: "rgba(255,255,255,0.05)", color: copiedId === activeDoc.id ? emerald : "rgba(255,255,255,0.45)" }}>
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
                    className="w-full h-full min-h-[380px] resize-none outline-none font-mono text-[0.78rem] leading-relaxed"
                    style={{ background: "transparent", color: "rgba(255,255,255,0.78)", caretColor: indigo }}
                    autoFocus
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-[0.78rem] leading-relaxed text-white/65 font-mono">
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

  const renderStep5 = () => {
    const checks = [
      { id: "kbis", label: "KBIS de moins de 3 mois" },
      { id: "urssaf", label: "Attestation de vigilance URSSAF" },
      { id: "impots", label: "Attestation fiscale (DGFiP)" },
      { id: "assurance", label: "Attestation d'assurance RC pro" },
      { id: "dc1", label: "DC1 signé et daté" },
      { id: "dc2", label: "DC2 complété" },
      { id: "memoire", label: "Mémoire technique inclus" },
      { id: "offre_prix", label: "Offre financière / BPU" },
      { id: "references", label: "Attestations de références" },
      { id: "delai", label: "Dépôt avant la date limite" },
      { id: "signature", label: "Tous les documents signés" },
      { id: "format", label: "Format PDF/dématérialisé conforme" },
    ];

    const checkedCount = checks.filter(c => verifChecks[c.id]).length;
    const pct = Math.round((checkedCount / checks.length) * 100);

    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Vérification finale</h2>
          <p className="text-[0.78rem] text-white/38">Confirmez chaque point avant de soumettre votre dossier.</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.15)" }}>
          <div className="h-1.5 flex-1 rounded-full bg-white/08 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? emerald : `rgba(129,140,248,0.8)` }} />
          </div>
          <span className="text-[0.78rem] font-black" style={{ color: pct === 100 ? emerald : indigo }}>
            {checkedCount}/{checks.length}
          </span>
        </div>

        <Card>
          <div className="space-y-1.5">
            {checks.map(c => (
              <button key={c.id}
                onClick={() => setVerifChecks(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-all"
                style={{ background: verifChecks[c.id] ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.02)" }}>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition"
                  style={{
                    background: verifChecks[c.id] ? emerald : "rgba(255,255,255,0.06)",
                    border: `1px solid ${verifChecks[c.id] ? emerald : "rgba(255,255,255,0.1)"}`,
                  }}>
                  {verifChecks[c.id] && <Check size={11} className="text-white" />}
                </div>
                <span className="text-[0.82rem]" style={{ color: verifChecks[c.id] ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)" }}>
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
              <p className="text-[0.72rem] text-white/45">Votre candidature est prête pour soumission.</p>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const renderStep6 = () => (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[1.1rem] font-black text-white/88 mb-1">Exporter votre dossier</h2>
        <p className="text-[0.78rem] text-white/38">Téléchargez vos documents dans le format de votre choix.</p>
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
            <p className="text-[0.9rem] font-black text-white/85">PDF complet</p>
            <p className="text-[0.75rem] text-white/40">Tous les documents en un seul fichier PDF professionnel</p>
          </div>
          <Download size={18} style={{ color: indigo }} />
        </button>

        <button onClick={downloadAllDocs}
          className="flex items-center gap-4 rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <Package size={22} className="text-white/40" />
          </div>
          <div className="flex-1">
            <p className="text-[0.9rem] font-black text-white/75">Documents individuels (PDF)</p>
            <p className="text-[0.75rem] text-white/35">Chaque document dans son propre PDF professionnel</p>
          </div>
          <Download size={18} className="text-white/35" />
        </button>

        {generatedDocs.length > 0 && (
          <Card>
            <p className="text-[0.72rem] font-semibold text-white/40 uppercase tracking-wider mb-3">Documents individuels</p>
            <div className="space-y-2">
              {generatedDocs.map(doc => {
                const opt = DOC_OPTIONS.find(o => o.id === doc.id);
                const Icon = opt?.icon || FileText;
                return (
                  <div key={doc.id} className="flex items-center gap-3">
                    <Icon size={14} style={{ color: "rgba(255,255,255,0.3)" }} className="shrink-0" />
                    <span className="flex-1 text-[0.8rem] text-white/60">{doc.title}</span>
                    <button onClick={() => handleCopy(doc.id, doc.content)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.68rem] text-white/35 transition hover:text-white/60"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
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
        <p className="text-[0.75rem] text-white/45">
          <strong className="text-white/65">Conseil :</strong> Relisez chaque document et personnalisez les passages entre crochets avant soumission. Ces documents sont des bases professionnelles à adapter à votre contexte exact.
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
    if (needsGenerate) return true; // "Générer" toujours actif
    if (step === 4) return generatedDocs.length > 0;
    if (step === 5) return true;
    return true;
  };

  const handleNext = async () => {
    if (step === 2) { await runAnalysis(); return; }
    if (needsGenerate) { await runGeneration(); return; }
    setStep(s => Math.min(s + 1, 6));
  };

  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: "#07080e" }}>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(160deg,#07080e,#0c0e1a,#07080e)" }}>
        <div className="pointer-events-none absolute -top-10 -left-8 h-40 w-40 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle,#818cf8,transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-6 right-16 h-28 w-28 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle,#60a5fa,transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,rgba(129,140,248,0.45),rgba(96,165,250,0.18),transparent)" }} />

        <div className="relative px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/client/sourcing"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/[0.06]"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <ArrowLeft size={15} className="text-white/50" />
            </Link>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.25)" }}>
                <Target size={17} style={{ color: indigo }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-[0.95rem] font-black text-white/88 leading-tight truncate">
                  Répondre à un appel d'offre
                </h1>
                <p className="text-[0.65rem] text-white/35">Assistant IA — Marchés publics & privés</p>
              </div>
            </div>
          </div>
          <StepIndicator current={step} />
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
        <div className="shrink-0 border-t px-4 py-3 sm:px-6"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(7,8,14,0.95)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between max-w-3xl mx-auto gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={step === 1}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.82rem] font-semibold transition disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
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

            <span className="text-[0.72rem] text-white/25">
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
