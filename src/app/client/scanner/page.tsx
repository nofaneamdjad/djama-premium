"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import {
  ScanLine, Upload, Camera, Trash2, RefreshCw, Download, Copy,
  CheckCircle, AlertTriangle, Clock, FileText, Image as ImageIcon,
  Receipt, ShoppingBag, CreditCard, Package, BarChart2, FileEdit, File,
  Sparkles, MessageSquare, Zap, ChevronRight, X, Search, Filter,
  Building2, User, Send, Loader2, ArrowLeft,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
type DocType = "facture" | "recu" | "contrat" | "carte" | "photo" | "bon_commande" | "releve" | "devis" | "autre";
type DocStatus = "uploading" | "uploaded" | "analyzing" | "analyzed" | "error";

interface ScannedDoc {
  id: string;
  title: string;
  doc_type: DocType;
  status: DocStatus;
  mime_type: string;
  file_size: number | null;
  file_path?: string;
  ocr_text?: string | null;
  ai_extracted?: Record<string, unknown> | null;
  tags: string[];
  notes?: string | null;
  created_at: string;
  analyzed_at?: string | null;
  signed_url?: string | null;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

// ── Constants ─────────────────────────────────────────────────────────
const GOLD = "#c9a55a";

const TYPE_META: Record<DocType, { label: string; color: string; icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }> }> = {
  facture:      { label: "Facture",        color: "#f59e0b", icon: Receipt },
  recu:         { label: "Reçu",           color: "#10b981", icon: ShoppingBag },
  contrat:      { label: "Contrat",        color: "#6366f1", icon: FileText },
  carte:        { label: "Carte de visite",color: "#ec4899", icon: CreditCard },
  photo:        { label: "Photo",          color: "#3b82f6", icon: ImageIcon },
  bon_commande: { label: "Bon de commande",color: "#f97316", icon: Package },
  releve:       { label: "Relevé",         color: "#14b8a6", icon: BarChart2 },
  devis:        { label: "Devis",          color: "#c9a55a", icon: FileEdit },
  autre:        { label: "Autre",          color: "#6b7280", icon: File },
};

const ANALYZE_STEPS = [
  { key: "ocr",         label: "Extraction OCR du texte…",          duration: 12000 },
  { key: "classifying", label: "Classification du document…",        duration: 8000 },
  { key: "extracting",  label: "Extraction des données structurées…", duration: 12000 },
  { key: "saving",      label: "Enregistrement des résultats…",       duration: 4000 },
];

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Main Component ────────────────────────────────────────────────────
export default function ScannerPage() {
  const { isDark } = useTheme();

  // State
  const [docs, setDocs] = useState<ScannedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ScannedDoc | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStepIdx, setAnalyzeStepIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"info" | "text" | "ai" | "actions">("info");
  const [filter, setFilter] = useState<"all" | DocType>("all");
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ label: string; data: Record<string, unknown> } | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const analyzeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Colors ───────────────────────────────────────────────────────────
  const bg = isDark ? "rgba(15,15,20,0.97)" : "rgba(248,247,244,0.97)";
  const surface = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const text = isDark ? "#e8e6e0" : "#1a1a1a";
  const textMuted = isDark ? "rgba(232,230,224,0.45)" : "rgba(26,26,26,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  // ── Load docs ────────────────────────────────────────────────────────
  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scanner/documents");
      if (res.ok) {
        const { documents } = await res.json() as { documents: ScannedDoc[] };
        setDocs(documents);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  // ── Load detail ──────────────────────────────────────────────────────
  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setChatMessages([]);
    try {
      const res = await fetch(`/api/scanner/documents/${id}`);
      if (res.ok) {
        const { document } = await res.json() as { document: ScannedDoc };
        setDetail(document);
        setNewTitle(document.title);
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      loadDetail(activeId);
      setActiveTab("info");
    } else {
      setDetail(null);
    }
  }, [activeId, loadDetail]);

  // ── Upload ───────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (files: File[]) => {
    if (!files.length || uploading) return;
    const file = files[0];
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/scanner/documents", { method: "POST", body: form });
      if (!res.ok) {
        const { error } = await res.json() as { error: string };
        alert(error || "Erreur lors de l'upload.");
        return;
      }
      const { document } = await res.json() as { document: ScannedDoc };
      setDocs(prev => [document, ...prev]);
      setActiveId(document.id);
    } finally {
      setUploading(false);
    }
  }, [uploading]);

  // ── Analyze ──────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async (id: string) => {
    if (analyzing) return;
    setAnalyzing(true);
    setAnalyzeStepIdx(0);

    // Animate steps while API call runs
    let stepIdx = 0;
    const advance = () => {
      stepIdx++;
      if (stepIdx < ANALYZE_STEPS.length) {
        setAnalyzeStepIdx(stepIdx);
        const t = setTimeout(advance, ANALYZE_STEPS[stepIdx].duration);
        analyzeTimers.current.push(t);
      }
    };
    const t0 = setTimeout(advance, ANALYZE_STEPS[0].duration);
    analyzeTimers.current.push(t0);

    try {
      const res = await fetch(`/api/scanner/documents/${id}/analyze`, { method: "POST" });
      // Clear timers
      analyzeTimers.current.forEach(clearTimeout);
      analyzeTimers.current = [];

      if (res.ok) {
        const { document } = await res.json() as { document: ScannedDoc };
        setDocs(prev => prev.map(d => d.id === id ? { ...d, ...document } : d));
        setDetail(prev => prev ? { ...prev, ...document } : document);
        setActiveTab("info");
      } else {
        const { error } = await res.json() as { error: string };
        alert(error || "Erreur lors de l'analyse.");
        setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "error" } : d));
      }
    } catch {
      analyzeTimers.current.forEach(clearTimeout);
      analyzeTimers.current = [];
      alert("Erreur réseau. Réessayez.");
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing]);

  // Auto-analyze after upload
  useEffect(() => {
    if (detail?.status === "uploaded" && !analyzing) {
      // slight delay so user sees the document
      const t = setTimeout(() => handleAnalyze(detail.id), 800);
      return () => clearTimeout(t);
    }
  }, [detail?.id, detail?.status, analyzing, handleAnalyze]);

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer ce document définitivement ?")) return;
    await fetch(`/api/scanner/documents/${id}`, { method: "DELETE" });
    setDocs(prev => prev.filter(d => d.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  // ── Rename ───────────────────────────────────────────────────────────
  const handleRename = useCallback(async () => {
    if (!detail || !newTitle.trim()) { setEditingTitle(false); return; }
    setEditingTitle(false);
    const res = await fetch(`/api/scanner/documents/${detail.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (res.ok) {
      const { document } = await res.json() as { document: ScannedDoc };
      setDetail(prev => prev ? { ...prev, title: document.title } : prev);
      setDocs(prev => prev.map(d => d.id === detail.id ? { ...d, title: document.title } : d));
    }
  }, [detail, newTitle]);

  // ── Chat ─────────────────────────────────────────────────────────────
  const handleChat = useCallback(async () => {
    if (!detail || !chatInput.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput.trim() };
    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch(`/api/scanner/documents/${detail.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      if (res.ok) {
        const { reply } = await res.json() as { reply: string };
        setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
      }
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [detail, chatInput, chatMessages, chatLoading]);

  // ── Copy OCR ─────────────────────────────────────────────────────────
  const handleCopyOcr = useCallback(async () => {
    if (!detail?.ocr_text) return;
    try {
      await navigator.clipboard.writeText(detail.ocr_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard refused */ }
  }, [detail]);

  // ── Drag & Drop ──────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleUpload(files);
  }, [handleUpload]);

  // ── Filtered docs ────────────────────────────────────────────────────
  const filteredDocs = docs.filter(d => {
    if (filter !== "all" && d.doc_type !== filter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Render helpers ────────────────────────────────────────────────────
  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    background: active ? GOLD : "transparent",
    color: active ? "#1a1005" : textMuted,
    border: `1px solid ${active ? GOLD : border}`,
    cursor: "pointer",
    transition: "all .15s",
  });

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? GOLD : textMuted,
    background: "transparent",
    border: "none",
    borderBottom: `2px solid ${active ? GOLD : "transparent"}`,
    cursor: "pointer",
    transition: "all .15s",
    whiteSpace: "nowrap",
  });

  // ── Extracted data renderer ──────────────────────────────────────────
  const renderExtracted = (extracted: Record<string, unknown>, type: DocType) => {
    if (!extracted || !Object.keys(extracted).length) return null;
    const rows: { label: string; value: string }[] = [];
    const fmt = (v: unknown): string => {
      if (v === null || v === undefined) return "—";
      if (Array.isArray(v)) return v.map(i => typeof i === "object" ? JSON.stringify(i) : String(i)).join(", ");
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    };
    const LABELS: Record<string, string> = {
      vendor: "Fournisseur", invoice_number: "N° Facture", date: "Date",
      due_date: "Échéance", amount_ttc: "Montant TTC", amount_ht: "Montant HT",
      tax_amount: "TVA", currency: "Devise", payment_method: "Paiement",
      name: "Nom", organization: "Organisation", job_title: "Poste",
      email: "Email", phone: "Téléphone", address: "Adresse", website: "Site web",
      parties: "Parties", date_signature: "Signature", validity_period: "Durée",
      contract_type: "Type contrat", key_clauses: "Clauses clés",
      order_number: "N° Commande", total: "Total", total_ht: "Total HT",
      total_ttc: "Total TTC", validity_date: "Validité jusqu'au",
      bank: "Banque", account_number: "Compte", period: "Période", balance: "Solde",
      amount: "Montant", summary: "Résumé",
    };
    for (const [k, v] of Object.entries(extracted)) {
      if (k === "items") continue;
      rows.push({ label: LABELS[k] ?? k, value: fmt(v) });
    }
    const items = extracted.items as { description?: string; qty?: number; unit_price?: number; total?: number }[] | undefined;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {rows.map(r => (
            <div key={r.label} style={{ background: inputBg, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: 13, color: text, fontWeight: 500, wordBreak: "break-word" }}>{r.value}</div>
            </div>
          ))}
        </div>
        {items && items.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Lignes ({type === "facture" || type === "bon_commande" || type === "devis" ? "articles" : "items"})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {items.map((item, i) => (
                <div key={i} style={{ background: inputBg, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: text, flex: 1 }}>{item.description ?? "—"}</span>
                  {item.qty !== undefined && <span style={{ fontSize: 12, color: textMuted }}>× {item.qty}</span>}
                  {item.unit_price !== undefined && <span style={{ fontSize: 12, color: textMuted }}>{item.unit_price} €</span>}
                  {item.total !== undefined && <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>{item.total} €</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Smart actions ─────────────────────────────────────────────────────
  const SMART_ACTIONS: Record<DocType, { label: string; icon: React.FC<{ size?: number; color?: string }> }[]> = {
    facture:      [{ label: "Créer une dépense", icon: Receipt }, { label: "Enregistrer fournisseur CRM", icon: Building2 }],
    recu:         [{ label: "Créer une dépense", icon: Receipt }, { label: "Ajouter aux notes", icon: FileText }],
    contrat:      [{ label: "Créer contact CRM", icon: Building2 }, { label: "Ajouter aux notes", icon: FileText }],
    carte:        [{ label: "Créer contact CRM", icon: User }, { label: "Envoyer un email", icon: Send }],
    photo:        [{ label: "Ajouter aux notes", icon: FileText }],
    bon_commande: [{ label: "Créer une dépense", icon: Receipt }, { label: "Enregistrer fournisseur CRM", icon: Building2 }],
    releve:       [{ label: "Ajouter aux notes", icon: FileText }],
    devis:        [{ label: "Ajouter aux notes", icon: FileText }, { label: "Enregistrer fournisseur CRM", icon: Building2 }],
    autre:        [{ label: "Ajouter aux notes", icon: FileText }],
  };

  // ── Sidebar ───────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div style={{
      width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
      borderRight: `1px solid ${border}`, background: isDark ? "rgba(10,10,14,0.6)" : "rgba(245,244,241,0.8)",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ScanLine size={18} color={GOLD} strokeWidth={1.5} />
            <span style={{ fontSize: 14, fontWeight: 700, color: text, letterSpacing: ".03em" }}>SCANNER</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{ padding: "6px 8px", borderRadius: 8, background: inputBg, border: `1px solid ${border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              title="Prendre une photo"
            >
              <Camera size={14} color={GOLD} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ padding: "6px 10px", borderRadius: 8, background: GOLD, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              {uploading ? <Loader2 size={14} color="#1a1005" style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={14} color="#1a1005" strokeWidth={2} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1005" }}>Importer</span>
            </button>
          </div>
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={13} color={textMuted} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px 7px 30px", borderRadius: 8, background: inputBg, border: `1px solid ${border}`, color: text, fontSize: 13, outline: "none" }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${border}`, display: "flex", gap: 4, flexWrap: "wrap" }}>
        {(["all", "facture", "recu", "contrat", "carte", "autre"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={pillStyle(filter === f)}>
            {f === "all" ? "Tous" : TYPE_META[f as DocType]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Doc list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: textMuted, fontSize: 13 }}>Chargement…</div>
        ) : filteredDocs.length === 0 ? (
          <div style={{ padding: "20px 16px", color: textMuted, fontSize: 13, textAlign: "center" }}>
            {docs.length === 0 ? "Aucun document — importez ou prenez une photo" : "Aucun résultat"}
          </div>
        ) : filteredDocs.map(doc => {
          const meta = TYPE_META[doc.doc_type] ?? TYPE_META.autre;
          const Icon = meta.icon;
          const isActive = activeId === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => setActiveId(doc.id)}
              style={{
                width: "100%", textAlign: "left", padding: "10px 14px", border: "none",
                background: isActive ? (isDark ? "rgba(201,165,90,0.08)" : "rgba(201,165,90,0.07)") : "transparent",
                borderLeft: `2px solid ${isActive ? GOLD : "transparent"}`,
                cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start",
                transition: "all .1s",
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Icon size={16} color={meta.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? GOLD : text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 2, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: textMuted }}>{fmtDate(doc.created_at)}</span>
                  {doc.status === "analyzed" && <CheckCircle size={10} color="#10b981" />}
                  {doc.status === "analyzing" && <Loader2 size={10} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />}
                  {doc.status === "error" && <AlertTriangle size={10} color="#ef4444" />}
                  {doc.status === "uploaded" && <Clock size={10} color={textMuted} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Drop zone (main empty state) ──────────────────────────────────────
  const DropZone = () => (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
        background: dragOver ? (isDark ? "rgba(201,165,90,0.06)" : "rgba(201,165,90,0.04)") : "transparent",
        transition: "background .2s",
      }}
    >
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: isDark ? "rgba(201,165,90,0.1)" : "rgba(201,165,90,0.08)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${dragOver ? GOLD : border}`, transition: "border .2s" }}>
        <ScanLine size={32} color={GOLD} strokeWidth={1.2} />
      </div>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: text, marginBottom: 8 }}>Scanner un document</div>
        <div style={{ fontSize: 14, color: textMuted, lineHeight: 1.6 }}>Glissez un fichier ici, importez depuis votre appareil ou prenez une photo directement.</div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{ padding: "10px 20px", borderRadius: 10, background: GOLD, border: "none", color: "#1a1005", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Upload size={16} strokeWidth={2} /> {uploading ? "Import…" : "Importer un fichier"}
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          style={{ padding: "10px 20px", borderRadius: 10, background: surface, border: `1px solid ${border}`, color: text, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Camera size={16} strokeWidth={1.5} /> Appareil photo
        </button>
      </div>
      <div style={{ fontSize: 12, color: textMuted }}>JPEG, PNG, WebP, GIF, PDF — max 10 Mo</div>
    </div>
  );

  // ── Analyze progress overlay ──────────────────────────────────────────
  const AnalyzeProgress = () => (
    <div style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24, zIndex: 20,
      background: isDark ? "rgba(10,10,14,0.75)" : "rgba(248,247,244,0.85)",
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 4 }}>Analyse en cours…</div>
        <div style={{ fontSize: 13, color: textMuted }}>{ANALYZE_STEPS[analyzeStepIdx]?.label}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {ANALYZE_STEPS.map((step, i) => (
          <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", border: `2px solid ${i <= analyzeStepIdx ? GOLD : border}`,
              background: i < analyzeStepIdx ? GOLD : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .3s",
            }}>
              {i < analyzeStepIdx ? <CheckCircle size={16} color="#1a1005" /> :
               i === analyzeStepIdx ? <Loader2 size={14} color={GOLD} style={{ animation: "spin 1s linear infinite" }} /> :
               <div style={{ width: 6, height: 6, borderRadius: "50%", background: border }} />}
            </div>
            {i < ANALYZE_STEPS.length - 1 && (
              <div style={{ width: 2, height: 16, background: i < analyzeStepIdx ? GOLD : border, transition: "background .3s" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Detail view ───────────────────────────────────────────────────────
  const DetailView = ({ doc }: { doc: ScannedDoc }) => {
    const meta = TYPE_META[doc.doc_type] ?? TYPE_META.autre;
    const Icon = meta.icon;
    const isImage = doc.mime_type?.startsWith("image/");
    const extracted = (doc.ai_extracted ?? {}) as Record<string, unknown>;
    const smartActions = SMART_ACTIONS[doc.doc_type] ?? SMART_ACTIONS.autre;

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {analyzing && <AnalyzeProgress />}

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button onClick={() => setActiveId(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: textMuted }}>
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={16} color={meta.color} />
          </div>
          {editingTitle ? (
            <input
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onBlur={handleRename} onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditingTitle(false); }}
              autoFocus
              style={{ flex: 1, fontSize: 15, fontWeight: 600, color: text, background: inputBg, border: `1px solid ${GOLD}`, borderRadius: 6, padding: "4px 8px", outline: "none" }}
            />
          ) : (
            <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: text, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onDoubleClick={() => setEditingTitle(true)}>
              {doc.title}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, background: `${meta.color}18`, padding: "3px 8px", borderRadius: 6 }}>{meta.label}</span>
            {doc.status !== "analyzed" && doc.status !== "analyzing" && (
              <button onClick={() => handleAnalyze(doc.id)} style={{ padding: "6px 12px", borderRadius: 8, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, color: GOLD, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={12} /> Analyser
              </button>
            )}
            <button onClick={() => handleDelete(doc.id)} style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: textMuted }}>
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${border}`, flexShrink: 0, padding: "0 4px" }}>
          {(["info", "text", "ai", "actions"] as const).map(tab => {
            const labels = { info: "Informations", text: "Texte OCR", ai: "Intelligence IA", actions: "Actions" };
            const icons = {
              info: <FileText size={12} />,
              text: <FileEdit size={12} />,
              ai: <Sparkles size={12} />,
              actions: <Zap size={12} />,
            };
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{icons[tab]} {labels[tab]}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {/* Preview (always shown at top) */}
          {isImage && doc.signed_url && (
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "center", background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)" }}>
              <img
                src={doc.signed_url}
                alt={doc.title}
                style={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain", borderRadius: 8, border: `1px solid ${border}` }}
              />
            </div>
          )}

          <div style={{ padding: "16px 20px", flex: 1 }}>

            {/* INFO TAB */}
            {activeTab === "info" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Meta */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Type", value: meta.label },
                    { label: "Statut", value: doc.status === "analyzed" ? "Analysé" : doc.status === "error" ? "Erreur" : doc.status === "analyzing" ? "En cours…" : "Importé" },
                    { label: "Taille", value: fmtSize(doc.file_size) || "—" },
                    { label: "Importé le", value: fmtDate(doc.created_at) },
                    ...(doc.analyzed_at ? [{ label: "Analysé le", value: fmtDate(doc.analyzed_at) }] : []),
                  ].map(r => (
                    <div key={r.label} style={{ background: inputBg, borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 10, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: 13, color: text, fontWeight: 500 }}>{r.value}</div>
                    </div>
                  ))}
                </div>
                {/* Extracted data */}
                {doc.status === "analyzed" && Object.keys(extracted).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Données extraites</div>
                    {renderExtracted(extracted, doc.doc_type)}
                  </div>
                )}
                {doc.status !== "analyzed" && doc.status !== "analyzing" && (
                  <div style={{ padding: "20px 0", textAlign: "center", color: textMuted, fontSize: 13 }}>
                    <Sparkles size={20} color={GOLD} strokeWidth={1.5} style={{ marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                    Cliquez sur "Analyser" pour extraire automatiquement les données du document.
                  </div>
                )}
              </div>
            )}

            {/* TEXT TAB */}
            {activeTab === "text" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Texte extrait (OCR)</span>
                  {doc.ocr_text && (
                    <button onClick={handleCopyOcr} style={{ padding: "5px 10px", borderRadius: 7, background: inputBg, border: `1px solid ${border}`, color: text, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      {copied ? <CheckCircle size={12} color="#10b981" /> : <Copy size={12} strokeWidth={1.5} />} {copied ? "Copié !" : "Copier"}
                    </button>
                  )}
                </div>
                {doc.ocr_text ? (
                  <pre style={{ background: inputBg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", fontSize: 13, color: text, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                    {doc.ocr_text}
                  </pre>
                ) : (
                  <div style={{ padding: "24px 0", textAlign: "center", color: textMuted, fontSize: 13 }}>
                    {doc.status === "analyzed" ? "Aucun texte détecté dans ce document." : "Analysez le document pour extraire le texte."}
                  </div>
                )}
              </div>
            )}

            {/* AI TAB — chat */}
            {activeTab === "ai" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
                {!doc.ocr_text ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: textMuted, fontSize: 13 }}>
                    <MessageSquare size={20} color={textMuted} strokeWidth={1.5} style={{ display: "block", margin: "0 auto 8px" }} />
                    Analysez d'abord le document pour pouvoir discuter avec l'IA.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 10 }}>
                    <div style={{ fontSize: 12, color: textMuted, paddingBottom: 4 }}>Posez des questions sur le contenu du document.</div>
                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, minHeight: 120 }}>
                      {chatMessages.length === 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {[
                            "Résume ce document",
                            "Quel est le montant total ?",
                            "Qui sont les parties ?",
                            "Quelle est la date d'échéance ?",
                          ].map(q => (
                            <button key={q} onClick={() => { setChatInput(q); }} style={{ padding: "6px 12px", borderRadius: 20, background: inputBg, border: `1px solid ${border}`, color: text, fontSize: 12, cursor: "pointer" }}>
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                      {chatMessages.map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                          <div style={{
                            maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            background: m.role === "user" ? GOLD : inputBg,
                            color: m.role === "user" ? "#1a1005" : text,
                            fontSize: 13, lineHeight: 1.6,
                          }}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div style={{ display: "flex" }}>
                          <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: inputBg }}>
                            <Loader2 size={14} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${border}` }}>
                      <input
                        value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                        placeholder="Posez une question sur ce document…"
                        style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: text, fontSize: 13, outline: "none" }}
                      />
                      <button onClick={handleChat} disabled={!chatInput.trim() || chatLoading} style={{ padding: "9px 14px", borderRadius: 10, background: GOLD, border: "none", cursor: "pointer", opacity: (!chatInput.trim() || chatLoading) ? 0.5 : 1 }}>
                        <Send size={14} color="#1a1005" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACTIONS TAB */}
            {activeTab === "actions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Actions intelligentes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {smartActions.map(action => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => {
                          if (!doc.ocr_text) { alert("Analysez d'abord le document."); return; }
                          setConfirmAction({ label: action.label, data: extracted });
                        }}
                        style={{
                          padding: "12px 16px", borderRadius: 10, background: surface, border: `1px solid ${border}`,
                          color: text, fontSize: 13, fontWeight: 500, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                          transition: "all .15s",
                        }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${GOLD}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ActionIcon size={15} color={GOLD} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{action.label}</div>
                          <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>À partir des données extraites</div>
                        </div>
                        <ChevronRight size={14} color={textMuted} strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
                {/* Download */}
                {doc.signed_url && (
                  <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${border}` }}>
                    <a
                      href={doc.signed_url}
                      download={doc.title}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "10px 16px", borderRadius: 10, background: surface, border: `1px solid ${border}`,
                        color: text, fontSize: 13, fontWeight: 500, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
                      }}
                    >
                      <Download size={15} color={textMuted} strokeWidth={1.5} />
                      Télécharger le fichier original
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Confirm action modal ──────────────────────────────────────────────
  const ConfirmModal = () => {
    if (!confirmAction) return null;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
        <div style={{ background: isDark ? "#18181f" : "#ffffff", borderRadius: 14, padding: 24, width: 400, maxWidth: "90vw", border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: text }}>{confirmAction.label}</span>
            <button onClick={() => setConfirmAction(null)} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ background: inputBg, borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: textMuted, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: text, marginBottom: 6 }}>Données qui seront utilisées :</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
              {JSON.stringify(confirmAction.data, null, 2).slice(0, 400)}
            </pre>
          </div>
          <div style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}30`, borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: GOLD }}>
            Cette fonctionnalité est en cours de développement et sera disponible prochainement.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: "9px", borderRadius: 9, background: inputBg, border: `1px solid ${border}`, color: text, fontSize: 13, cursor: "pointer" }}>
              Annuler
            </button>
            <button onClick={() => { setConfirmAction(null); }} style={{ flex: 1, padding: "9px", borderRadius: 9, background: GOLD, border: "none", color: "#1a1005", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Confirmer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", background: bg, color: text, fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden", position: "relative" }}>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files; if (f?.length) handleUpload(Array.from(f)); e.target.value = ""; }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => { const f = e.target.files; if (f?.length) handleUpload(Array.from(f)); e.target.value = ""; }} />

      <Sidebar />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {detailLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 size={24} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : detail ? (
          <DetailView doc={detail} />
        ) : (
          <DropZone />
        )}
      </div>

      <ConfirmModal />
    </div>
  );
}
