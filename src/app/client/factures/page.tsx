"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText, Plus, Trash2, FileDown, Save, X, Search,
  Loader2, ArrowLeft, ChevronDown,
  RefreshCw, Building2, User, FileText, Send, BadgeCheck,
  AlertTriangle, ImagePlus, Palette, Landmark, Eye, Percent,
  Mail, Link2, Copy, Check, Globe,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEur, fmtDate } from "@/lib/format";
import Toast, { type ToastData } from "@/components/ui/Toast";
import type { TemplateType }      from "@/lib/pdf/types";
import type { PreviewData }       from "@/components/invoice/shared";
import { TemplateSelector }       from "@/components/invoice/TemplateSelector";
import { InvoiceTemplate }        from "@/components/invoice/InvoiceTemplate";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type DocType   = "facture" | "devis";
type DocStatut = "brouillon" | "envoyé" | "payé" | "en_retard";

interface DocItem {
  id?:         string;
  position:    number;
  description: string;
  quantity:    number;
  unit_price:  number;
  vat_rate:    number;
}

interface Document {
  id:               string;
  user_id:          string;
  type:             DocType;
  numero:           string;
  statut:           DocStatut;
  /* Objet */
  sujet:            string;
  /* Émetteur */
  emetteur_nom:     string;
  emetteur_email:   string;
  emetteur_adresse: string;
  emetteur_siret:   string;
  emetteur_logo:    string;
  /* Client */
  client_nom:       string;
  client_societe:   string;
  client_email:     string;
  client_telephone: string;
  client_adresse:   string;
  /* Dates */
  date_document:    string;
  date_echeance:    string;
  /* Remise & Acompte */
  remise_pct:       number;
  acompte:          number;
  /* RIB */
  rib_titulaire:    string;
  rib_iban:         string;
  rib_bic:          string;
  rib_banque:       string;
  /* Mémos */
  notes:            string;
  conditions:       string;
  /* Couleur */
  couleur:          string;
  /* Template PDF */
  template:         TemplateType;
  /* Totaux */
  total_ht:         number;
  total_tva:        number;
  total_ttc:        number;
  /* Timestamps */
  created_at:       string;
  updated_at:       string;
}

type DraftDoc = Omit<Document,
  "id"|"user_id"|"created_at"|"updated_at"|"total_ht"|"total_tva"|"total_ttc">;

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

const STATUTS: Record<DocStatut,{label:string;color:string;bg:string;border:string;Icon:React.ElementType}> = {
  brouillon: { label:"Brouillon", color:"#94a3b8", bg:"rgba(148,163,184,0.1)", border:"rgba(148,163,184,0.25)", Icon:FileText     },
  envoyé:    { label:"Envoyé",    color:"#60a5fa", bg:"rgba(59,130,246,0.1)",  border:"rgba(59,130,246,0.25)",  Icon:Send          },
  payé:      { label:"Payé",      color:"#4ade80", bg:"rgba(34,197,94,0.1)",   border:"rgba(34,197,94,0.25)",   Icon:BadgeCheck    },
  en_retard: { label:"En retard", color:"#f87171", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.25)",   Icon:AlertTriangle },
};

const COLOR_PRESETS = [
  { hex:"#c9a55a", label:"Or DJAMA" },
  { hex:"#60a5fa", label:"Bleu"     },
  { hex:"#4ade80", label:"Vert"     },
  { hex:"#a78bfa", label:"Violet"   },
  { hex:"#f97316", label:"Orange"   },
  { hex:"#f472b6", label:"Rose"     },
  { hex:"#e2e8f0", label:"Blanc"    },
];

const VAT_RATES = [0, 5.5, 10, 20];

const EMPTY_ITEM = (): DocItem => ({
  position: 0, description: "", quantity: 1, unit_price: 0, vat_rate: 20,
});

const EMPTY_DRAFT = (): DraftDoc => ({
  type:"facture", numero:"", statut:"brouillon",
  sujet:"",
  emetteur_nom:"", emetteur_email:"", emetteur_adresse:"", emetteur_siret:"", emetteur_logo:"",
  client_nom:"", client_societe:"", client_email:"", client_telephone:"", client_adresse:"",
  date_document: new Date().toISOString().slice(0,10),
  date_echeance:"",
  remise_pct: 0, acompte: 0,
  rib_titulaire:"", rib_iban:"", rib_bic:"", rib_banque:"",
  notes:"", conditions:"",
  couleur:"#c9a55a",
  template: "modern" as TemplateType,
});

/* ═══════════════════════════════════════════════════════════
   UTILITAIRES
═══════════════════════════════════════════════════════════ */
function calcTotals(items: DocItem[], remise_pct = 0, acompte = 0) {
  let htRaw = 0, tvaRaw = 0;
  for (const it of items) {
    const lineHT = it.quantity * it.unit_price;
    htRaw  += lineHT;
    tvaRaw += lineHT * it.vat_rate / 100;
  }
  const subtotal_ht = r2(htRaw);
  const remise      = r2(subtotal_ht * remise_pct / 100);
  const ht          = r2(subtotal_ht - remise);
  const factor      = subtotal_ht > 0 ? ht / subtotal_ht : 1;
  const tva         = r2(tvaRaw * factor);
  const ttc         = r2(ht + tva);
  const acompteVal  = r2(Math.min(acompte, ttc));
  return { subtotal_ht, remise, ht, tva, ttc, acompte: acompteVal };
}
function r2(n: number) { return Math.round(n * 100) / 100; }

function newNumero(type: DocType, docs: Document[]): string {
  const prefix = type === "facture" ? "FAC" : "DEV";
  const n = docs.filter(d => d.type === type).length + 1;
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(3, "0")}`;
}
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [isNaN(r) ? 201 : r, isNaN(g) ? 165 : g, isNaN(b) ? 90 : b];
}
function contrastColor(hex: string): "#0a0a0a"|"#ffffff" {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#0a0a0a" : "#ffffff";
}

/* ═══════════════════════════════════════════════════════════
   PDF EXPORT
═══════════════════════════════════════════════════════════ */
async function exportPDFWithTemplate(
  draft:  DraftDoc,
  items:  DocItem[],
  totals: ReturnType<typeof calcTotals>,
) {
  const { generatePdf } = await import("@/lib/pdf/generatePdf");

  // TVA dominante (première ligne)
  const mainTaxRate = items[0]?.vat_rate ?? 20;

  await generatePdf({
    type:            draft.type === "facture" ? "invoice" : "quote",
    template:        draft.template ?? "modern",
    reference:       draft.numero || (draft.type === "facture" ? "FACTURE" : "DEVIS"),
    issue_date:      draft.date_document,
    due_date:        draft.type === "facture" ? (draft.date_echeance || null) : null,
    valid_until:     draft.type === "devis"   ? (draft.date_echeance || null) : null,

    /* Client */
    client_name:     draft.client_nom      || "(Client)",
    client_company:  draft.client_societe  || null,
    client_email:    draft.client_email,
    client_phone:    draft.client_telephone || null,
    client_address:  draft.client_adresse  || null,

    /* Objet */
    subject:         draft.sujet || draft.numero || (draft.type === "facture" ? "Facture" : "Devis"),

    /* Lignes */
    items: items.map(it => ({
      description: it.description || "(description)",
      quantity:    it.quantity,
      unit_price:  it.unit_price,
      total:       r2(it.quantity * it.unit_price),
      tax_rate:    it.vat_rate,
    })),

    /* Totaux */
    subtotal:      totals.subtotal_ht,
    discount_rate: draft.remise_pct > 0 ? draft.remise_pct : null,
    discount:      totals.remise > 0    ? totals.remise    : null,
    tax_rate:      mainTaxRate,
    tax_amount:    totals.tva,
    total:         totals.ttc,

    /* Acompte */
    deposit:       draft.acompte > 0 ? draft.acompte      : null,
    deposit_label: draft.acompte > 0 ? "Acompte verse"    : null,

    /* RIB */
    rib_titulaire: draft.rib_titulaire || null,
    rib_iban:      draft.rib_iban      || null,
    rib_bic:       draft.rib_bic       || null,
    rib_banque:    draft.rib_banque    || null,

    /* Notes */
    notes:         draft.notes      || null,
    footer_text:   draft.conditions || null,

    /* Entreprise */
    company: {
      logoUrl:  draft.emetteur_logo    || null,
      name:     draft.emetteur_nom     || "DJAMA",
      email:    draft.emetteur_email,
      address:  draft.emetteur_adresse,
      siret:    draft.emetteur_siret,
      iban:     draft.rib_iban || "",
    },
  });
}

/* ═══════════════════════════════════════════════════════════
   ADAPTER — DraftDoc → PreviewData
═══════════════════════════════════════════════════════════ */
function draftToPreviewData(
  draft:  DraftDoc,
  items:  DocItem[],
  totals: ReturnType<typeof calcTotals>,
): PreviewData {
  return {
    type:           draft.type === "facture" ? "invoice" : "quote",
    reference:      draft.numero || (draft.type === "facture" ? "FAC-2026-001" : "DEV-2026-001"),
    issue_date:     draft.date_document,
    due_date:       draft.date_echeance || null,
    client_name:    draft.client_nom   || "Client",
    client_email:   draft.client_email,
    client_company: draft.client_societe || null,
    client_address: draft.client_adresse || null,
    subject:        draft.sujet || draft.numero || (draft.type === "facture" ? "Facture" : "Devis"),
    items: items.map(it => ({
      description: it.description || "Prestation",
      quantity:    it.quantity,
      unit_price:  it.unit_price,
      total:       r2(it.quantity * it.unit_price),
    })),
    subtotal:   totals.subtotal_ht,
    tax_rate:   items[0]?.vat_rate ?? 20,
    tax_amount: totals.tva,
    total:      totals.ttc,
    notes:      draft.notes || null,
    company: {
      name:    draft.emetteur_nom  || "DJAMA",
      email:   draft.emetteur_email,
      logoUrl: draft.emetteur_logo || null,
    },
  };
}

/* ═══════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════════════ */
function StatutBadge({ statut }: { statut: DocStatut }) {
  const s = STATUTS[statut];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ color:s.color, background:s.bg, border:`1px solid ${s.border}` }}>
      <s.Icon size={9}/>{s.label}
    </span>
  );
}

function DInput({ label, value, onChange, placeholder, type="text", small }:
  { label?:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; small?:boolean }) {
  const [focused, setFocused] = useState(false);
  const cls = small
    ? "w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none transition hover:border-white/20"
    : "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20";
  return (
    <div>
      {label && <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{label}</label>}
      <div className="relative">
        <motion.div animate={{ opacity: focused ? 1 : 0 }} transition={{ duration: 0.15 }}
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ boxShadow: "0 0 0 2px rgba(201,165,90,0.35)" }}/>
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder} className={cls}/>
      </div>
    </div>
  );
}

function DTextarea({ label, value, onChange, placeholder, rows=3 }:
  { label?:string; value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number }) {
  return (
    <div>
      {label && <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.4)]"/>
    </div>
  );
}

function ColorPicker({ value, onChange }: { value:string; onChange:(v:string)=>void }) {
  const ref = useRef<HTMLInputElement>(null);
  const isPreset = COLOR_PRESETS.some(p => p.hex === value);
  return (
    <div>
      <label className="mb-2 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
        <Palette size={9} className="mr-1 inline-block"/>Couleur du document
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {COLOR_PRESETS.map(p => (
          <button key={p.hex} title={p.label} onClick={() => onChange(p.hex)}
            className="relative h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
            style={{ background:p.hex, borderColor: value === p.hex ? "#fff" : "transparent" }}>
            {value === p.hex && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-2 w-2 rounded-full" style={{ background: contrastColor(p.hex) }}/>
              </span>
            )}
          </button>
        ))}
        <div className="relative">
          <div className="h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2 transition-transform hover:scale-110"
            style={{ background: isPreset ? "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" : value,
                     borderColor: !isPreset ? "#fff" : "transparent" }}
            onClick={() => ref.current?.click()}/>
          <input ref={ref} type="color" value={value} onChange={e => onChange(e.target.value)}
            className="absolute inset-0 h-0 w-0 opacity-0 pointer-events-none"/>
        </div>
      </div>
    </div>
  );
}

function LogoUploader({ value, onChange }: { value:string; onChange:(b64:string)=>void }) {
  const ref = useRef<HTMLInputElement>(null);
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  return (
    <div>
      <label className="mb-2 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
        <ImagePlus size={9} className="mr-1 inline-block"/>Logo entreprise
      </label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Logo" className="h-12 w-auto max-w-[120px] rounded-lg border border-white/10 bg-white/5 object-contain p-1"/>
            <button onClick={() => onChange("")}
              className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-red-500/30 bg-[#0f1117] text-red-400 transition group-hover:flex">
              <X size={10}/>
            </button>
          </div>
        ) : (
          <div onClick={() => ref.current?.click()}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/3 text-white/25 transition hover:border-white/30 hover:text-white/40">
            <ImagePlus size={18}/>
          </div>
        )}
        <button onClick={() => ref.current?.click()}
          className="text-[0.7rem] font-semibold text-white/35 underline-offset-2 transition hover:text-white/60 hover:underline">
          {value ? "Remplacer" : "Importer le logo"}
        </button>
        <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden"/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function FacturesPage() {
  const [documents,   setDocuments]   = useState<Document[]>([]);
  const [selected,    setSelected]    = useState<Document|null>(null);
  const [draft,       setDraft]       = useState<DraftDoc|null>(null);
  const [items,       setItems]       = useState<DocItem[]>([EMPTY_ITEM()]);
  const [dirty,       setDirty]       = useState(false);
  const [loadingAll,  setLoadingAll]  = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [converting,  setConverting]  = useState(false);
  const [toast,       setToast]       = useState<ToastData | null>(null);
  const [query,       setQuery]       = useState("");
  const [filterType,  setFilterType]  = useState<"tous"|DocType>("tous");
  const [mobileView,  setMobileView]  = useState<"list"|"editor">("list");
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  /* ── Email modal ── */
  const [emailModal,   setEmailModal]   = useState(false);
  const [emailTo,      setEmailTo]      = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMsg,     setEmailMsg]     = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  /* ── Payment link modal ── */
  const [payLinkModal,   setPayLinkModal]   = useState(false);
  const [payLinkLoading, setPayLinkLoading] = useState(false);
  const [payLinkUrl,     setPayLinkUrl]     = useState("");
  const [copied,         setCopied]         = useState(false);

  /* ── Portail client modal ── */
  const [portalModal,   setPortalModal]   = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalUrl,     setPortalUrl]     = useState("");
  const [portalCopied,  setPortalCopied]  = useState(false);

  const totals = useMemo(
    () => calcTotals(items, draft?.remise_pct ?? 0, draft?.acompte ?? 0),
    [items, draft?.remise_pct, draft?.acompte]
  );

  /* ── Charger ── */
  const fetchDocs = useCallback(async () => {
    setLoadingAll(true);
    const { data, error } = await supabase.from("documents").select("*").order("updated_at", { ascending: false }).limit(200);
    if (error) {
      console.error("[fetchDocs]", error);
      showToast("error", `Chargement impossible : ${error.message}`);
    } else {
      setDocuments((data as Document[]) ?? []);
    }
    setLoadingAll(false);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  function showToast(type: "success"|"error", msg: string) { setToast({ type, msg } as ToastData); }

  /* ── Ouvrir ── */
  async function openDoc(doc: Document) {
    setSelected(doc);
    setDraft({
      type:             doc.type,
      numero:           doc.numero,
      statut:           doc.statut,
      sujet:            doc.sujet             ?? "",
      emetteur_nom:     doc.emetteur_nom      ?? "",
      emetteur_email:   doc.emetteur_email    ?? "",
      emetteur_adresse: doc.emetteur_adresse  ?? "",
      emetteur_siret:   doc.emetteur_siret    ?? "",
      emetteur_logo:    doc.emetteur_logo     ?? "",
      client_nom:       doc.client_nom        ?? "",
      client_societe:   doc.client_societe    ?? "",
      client_email:     doc.client_email      ?? "",
      client_telephone: doc.client_telephone  ?? "",
      client_adresse:   doc.client_adresse    ?? "",
      date_document:    doc.date_document,
      date_echeance:    doc.date_echeance     ?? "",
      remise_pct:       doc.remise_pct        ?? 0,
      acompte:          doc.acompte           ?? 0,
      rib_titulaire:    doc.rib_titulaire     ?? "",
      rib_iban:         doc.rib_iban          ?? "",
      rib_bic:          doc.rib_bic           ?? "",
      rib_banque:       doc.rib_banque        ?? "",
      notes:            doc.notes             ?? "",
      conditions:       doc.conditions        ?? "",
      couleur:          doc.couleur           ?? "#c9a55a",
      template:         (doc.template as TemplateType) ?? "modern",
    });
    const { data } = await supabase.from("document_items").select("*").eq("document_id", doc.id).order("position");
    setItems((data as DocItem[])?.length ? (data as DocItem[]) : [EMPTY_ITEM()]);
    setDirty(false);
    setMobileView("editor");
  }

  /* ── Nouveau ── */
  function newDoc(type: DocType = "facture") {
    setSelected(null);
    setDraft({ ...EMPTY_DRAFT(), type, numero: newNumero(type, documents) });
    setItems([EMPTY_ITEM()]);
    setDirty(true);
    setMobileView("editor");
  }

  function updDraft(k: keyof DraftDoc, v: string | number) {
    setDraft(d => d ? { ...d, [k]: v } : d);
    setDirty(true);
  }

  /* ── Lignes ── */
  function updItem(idx: number, k: keyof DocItem, v: string|number) {
    setItems(p => p.map((it, i) => i === idx ? { ...it, [k]: v } : it));
    setDirty(true);
  }
  function addItem()  { setItems(p => [...p, { ...EMPTY_ITEM(), position: p.length }]); setDirty(true); }
  function removeItem(idx: number) {
    setItems(p => p.filter((_, i) => i !== idx).map((it, i) => ({ ...it, position: i })));
    setDirty(true);
  }

  /* ── SAUVEGARDER ── */
  async function handleSave() {
    if (!draft) { showToast("error", "Aucun document ouvert."); return; }
    setSaving(true);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      showToast("error", "Non connecté."); setSaving(false); return;
    }

    const payload = {
      type:             draft.type,
      numero:           draft.numero,
      statut:           draft.statut,
      sujet:            draft.sujet,
      emetteur_nom:     draft.emetteur_nom,
      emetteur_email:   draft.emetteur_email,
      emetteur_adresse: draft.emetteur_adresse,
      emetteur_siret:   draft.emetteur_siret,
      emetteur_logo:    draft.emetteur_logo,
      client_nom:       draft.client_nom,
      client_societe:   draft.client_societe,
      client_email:     draft.client_email,
      client_telephone: draft.client_telephone,
      client_adresse:   draft.client_adresse,
      date_document:    draft.date_document,
      date_echeance:    draft.date_echeance || null,
      remise_pct:       draft.remise_pct,
      acompte:          draft.acompte,
      rib_titulaire:    draft.rib_titulaire,
      rib_iban:         draft.rib_iban,
      rib_bic:          draft.rib_bic,
      rib_banque:       draft.rib_banque,
      notes:            draft.notes,
      conditions:       draft.conditions,
      couleur:          draft.couleur,
      template:         draft.template ?? "modern",
      total_ht:         totals.ht,
      total_tva:        totals.tva,
      total_ttc:        totals.ttc,
    };

    let docId = selected?.id;

    if (selected) {
      const { error } = await supabase.from("documents").update(payload).eq("id", selected.id);
      if (error) {
        const msg = [error.message, error.details, error.hint].filter(Boolean).join(" | ");
        showToast("error", `Erreur : ${msg}`); setSaving(false); return;
      }
    } else {
      const { data, error } = await supabase.from("documents").insert({ ...payload, user_id: user.id }).select().single();
      if (error) {
        const msg = [error.message, error.details, error.hint].filter(Boolean).join(" | ");
        showToast("error", `Erreur : ${msg}`); setSaving(false); return;
      }
      docId = (data as Document).id;
    }

    if (docId) {
      await supabase.from("document_items").delete().eq("document_id", docId);
      if (items.length) {
        const rows = items.map((it, i) => ({
          document_id: docId, position: i,
          description: it.description, quantity: it.quantity,
          unit_price: it.unit_price, vat_rate: it.vat_rate,
        }));
        const { error } = await supabase.from("document_items").insert(rows);
        if (error) { showToast("error", `Lignes : ${error.message}`); setSaving(false); return; }
      }
    }

    showToast("success", "Document enregistré ✓");
    setDirty(false);
    setSaving(false);
    await fetchDocs();
    if (docId) {
      const { data } = await supabase.from("documents").select("*").eq("id", docId).single();
      if (data) setSelected(data as Document);
    }
  }

  /* ── Supprimer ── */
  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    const { error } = await supabase.from("documents").delete().eq("id", selected.id);
    setDeleting(false); setConfirmDel(false);
    if (error) { showToast("error", error.message); return; }
    setDocuments(p => p.filter(d => d.id !== selected.id));
    setSelected(null); setDraft(null); setMobileView("list");
    showToast("success", "Document supprimé.");
  }

  /* ── Statut ── */
  async function handleStatut(statut: DocStatut) {
    if (!selected) return;
    const { error } = await supabase.from("documents").update({ statut }).eq("id", selected.id);
    if (error) { showToast("error", error.message); return; }
    setSelected(s => s ? { ...s, statut } : s);
    setDraft(d => d ? { ...d, statut } : d);
    setDocuments(p => p.map(d => d.id === selected.id ? { ...d, statut } : d));
    showToast("success", `Statut : ${STATUTS[statut].label}`);
  }

  /* ── Convertir devis → facture ── */
  async function handleConvert() {
    if (!selected || selected.type !== "devis") return;
    setConverting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setConverting(false); return; }
    const newNum = newNumero("facture", documents);
    const { data: newDoc, error } = await supabase.from("documents").insert({
      user_id: user.id, type: "facture", numero: newNum, statut: "brouillon",
      sujet: selected.sujet ?? "",
      emetteur_nom: selected.emetteur_nom, emetteur_email: selected.emetteur_email,
      emetteur_adresse: selected.emetteur_adresse, emetteur_siret: selected.emetteur_siret,
      emetteur_logo: selected.emetteur_logo ?? "",
      client_nom: selected.client_nom, client_societe: selected.client_societe ?? "",
      client_email: selected.client_email, client_telephone: selected.client_telephone ?? "",
      client_adresse: selected.client_adresse,
      date_document: new Date().toISOString().slice(0, 10),
      date_echeance: selected.date_echeance,
      remise_pct: selected.remise_pct ?? 0, acompte: 0,
      rib_titulaire: selected.rib_titulaire ?? "", rib_iban: selected.rib_iban ?? "",
      rib_bic: selected.rib_bic ?? "", rib_banque: selected.rib_banque ?? "",
      notes: selected.notes, conditions: selected.conditions,
      couleur: selected.couleur ?? "#c9a55a", template: selected.template ?? "modern",
      total_ht: selected.total_ht, total_tva: selected.total_tva, total_ttc: selected.total_ttc,
    }).select().single();
    if (error || !newDoc) {
      showToast("error", "Erreur lors de la conversion."); setConverting(false); return;
    }
    const { data: srcItems } = await supabase.from("document_items").select("*").eq("document_id", selected.id);
    if (srcItems?.length) {
      await supabase.from("document_items").insert(
        (srcItems as (DocItem & { document_id: string })[]).map((it, i) => ({
          document_id: (newDoc as Document).id, position: i,
          description: it.description, quantity: it.quantity,
          unit_price: it.unit_price, vat_rate: it.vat_rate,
        }))
      );
    }
    setConverting(false);
    showToast("success", `Devis converti → ${newNum}`);
    await fetchDocs();
    openDoc(newDoc as Document);
  }

  /* ── Envoyer par email ── */
  function openEmailModal() {
    if (!draft || !selected) return;
    setEmailTo(draft.client_email || "");
    setEmailSubject(`${draft.type === "facture" ? "Facture" : "Devis"} ${draft.numero} — ${draft.emetteur_nom || "DJAMA"}`);
    setEmailMsg(`Bonjour ${draft.client_nom || ""},\n\nVeuillez trouver ci-dessous les détails de votre ${draft.type === "facture" ? "facture" : "devis"}.\n\nRestant à votre disposition pour toute question.`);
    setEmailModal(true);
  }

  async function handleSendEmail() {
    if (!selected || !emailTo) return;
    setSendingEmail(true);
    try {
      const res = await fetch("/api/factures/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: selected.id,
          to_email:    emailTo,
          to_name:     draft?.client_nom,
          subject:     emailSubject,
          message:     emailMsg,
        }),
      });
      if (!res.ok) throw new Error("Erreur envoi");
      showToast("success", "Email envoyé ✓");
      setEmailModal(false);
    } catch {
      showToast("error", "Erreur lors de l'envoi de l'email");
    } finally {
      setSendingEmail(false);
    }
  }

  /* ── Lien de paiement Stripe ── */
  async function handlePaymentLink() {
    if (!selected || !draft) return;
    setPayLinkLoading(true);
    setPayLinkUrl("");
    setPayLinkModal(true);
    try {
      const res = await fetch("/api/stripe/payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:      totals.ttc,
          description: draft.sujet || `${draft.type === "facture" ? "Facture" : "Devis"} ${draft.numero}`,
          document_id: selected.id,
          reference:   draft.numero,
          client_email:draft.client_email,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "Erreur Stripe");
      setPayLinkUrl(data.url || "");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur Stripe";
      showToast("error", msg);
      setPayLinkModal(false);
    } finally {
      setPayLinkLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!payLinkUrl) return;
    await navigator.clipboard.writeText(payLinkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── Portail client ── */
  async function handlePortalLink() {
    if (!draft) return;
    setPortalLoading(true);
    setPortalUrl("");
    setPortalModal(true);
    try {
      const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
      const res = await fetch("/api/portail/generer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          client_nom:   draft.client_nom,
          client_email: draft.client_email,
          expires_days: 30,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "Erreur portail");
      setPortalUrl(data.url || "");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur génération portail";
      showToast("error", msg);
      setPortalModal(false);
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleCopyPortal() {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    setPortalCopied(true);
    setTimeout(() => setPortalCopied(false), 2000);
  }

  /* ── Filtres ── */
  const filtered = useMemo(() => {
    let list = [...documents];
    if (filterType !== "tous") list = list.filter(d => d.type === filterType);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(d => d.numero.toLowerCase().includes(q) || d.client_nom.toLowerCase().includes(q));
    }
    return list;
  }, [documents, filterType, query]);

  const activeColor = draft?.couleur || "#c9a55a";

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col bg-[#080a0f]">

      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[15%] top-[8%] h-[500px] w-[500px] rounded-full bg-[rgba(176,141,87,0.04)] blur-[140px]"/>
        <div className="absolute bottom-[5%] right-[10%] h-[400px] w-[400px] rounded-full bg-[rgba(34,197,94,0.03)] blur-[120px]"/>
      </div>

      {/* ── Sub-header ── */}
      <div className="border-b border-white/[0.06] bg-[rgba(10,11,16,0.92)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-sm" style={{ background: "#4ade8030" }} />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{ backgroundColor: "#4ade8014", borderColor: "#4ade8028" }}>
                <ReceiptText size={18} style={{ color: "#4ade80" }} />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Factures & Devis</h1>
              <p className="text-[0.65rem] text-white/30">{documents.length} document{documents.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => newDoc("devis")}
              className="hidden items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08] sm:flex">
              <Plus size={12}/> Devis
            </button>
            <button onClick={() => newDoc("facture")}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#080a0f] transition hover:opacity-90"
              style={{ background: "#4ade80", boxShadow: "0 4px 16px #4ade8040" }}>
              <Plus size={13}/> Facture
            </button>
          </div>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-5 px-5 py-5 sm:px-5">

        {/* ══ Liste ══ */}
        <aside className={`flex w-full flex-col border-r border-white/6 bg-[rgba(15,17,23,0.6)] sm:w-[300px] sm:flex-none sm:rounded-[1.5rem] sm:border sm:border-white/8 ${mobileView === "editor" ? "hidden sm:flex" : "flex"}`}>
          <div className="space-y-2.5 border-b border-white/6 p-4">
            <div className="relative">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"/>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Numéro, client…"
                className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)]"/>
              {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"><X size={12}/></button>}
            </div>
            <div className="flex gap-1.5">
              {(["tous", "facture", "devis"] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition ${filterType === t ? "bg-white/12 text-white" : "text-white/30 hover:text-white/60"}`}>
                  {t === "tous" ? "Tous" : t === "facture" ? "Factures" : "Devis"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingAll ? (
              <div className="flex items-center justify-center py-14"><Loader2 size={20} className="animate-spin text-white/20"/></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <ReceiptText size={22} className="text-white/15"/>
                <p className="text-sm text-white/25">{query ? "Aucun résultat" : "Aucun document"}</p>
                {!query && (
                  <button onClick={() => newDoc("facture")}
                    className="mt-1 flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.25)] px-3 py-1.5 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.09)]">
                    <Plus size={12}/> Créer un document
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map(doc => (
                  <motion.button key={doc.id} layout
                    initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-12 }}
                    transition={{ duration:0.22, ease }}
                    onClick={() => openDoc(doc)}
                    className={`group w-full border-b border-white/5 px-4 py-3.5 text-left transition hover:bg-white/4 ${selected?.id === doc.id ? "bg-white/6" : ""}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-widest ${
                        doc.type === "facture" ? "bg-[rgba(201,165,90,0.12)] text-[#c9a55a]" : "bg-[rgba(59,130,246,0.12)] text-blue-400"}`}>
                        {doc.type}
                      </span>
                      <StatutBadge statut={doc.statut}/>
                    </div>
                    <p className="text-sm font-bold text-white/90">{doc.numero || "(sans numéro)"}</p>
                    {doc.sujet && <p className="text-xs text-white/50 truncate">{doc.sujet}</p>}
                    <p className="text-xs text-white/40 truncate">{doc.client_nom || "(client)"}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[0.65rem] text-white/25">{fmtDate(doc.date_document)}</span>
                      <span className="text-xs font-bold" style={{ color: doc.couleur || "#c9a55a" }}>{fmtEur(doc.total_ttc)}</span>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </aside>

        {/* ══ Éditeur ══ */}
        <main className={`flex flex-1 flex-col overflow-hidden ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
          {!draft ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex h-full flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.4)] p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)]">
                <ReceiptText size={28} style={{ color: "#c9a55a" }}/>
              </div>
              <div>
                <p className="text-base font-bold text-white">Sélectionnez ou créez un document</p>
                <p className="mt-1 text-sm text-white/30">Factures et devis professionnels</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => newDoc("devis")}
                  className="flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-400/8 px-4 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-400/15">
                  <Plus size={14}/> Nouveau devis
                </button>
                <button onClick={() => newDoc("facture")}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-sm font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition">
                  <Plus size={14}/> Nouvelle facture
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={selected?.id ?? "new"} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.3, ease }}
              className="flex h-full flex-col overflow-hidden rounded-none bg-[rgba(15,17,23,0.6)] sm:rounded-[1.5rem] sm:border sm:border-white/8">

              {/* ── Toolbar ── */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/6 px-5 py-3">
                <button onClick={() => setMobileView("list")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition sm:hidden">
                  <ArrowLeft size={13}/>
                </button>
                {/* Type toggle */}
                <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
                  {(["facture", "devis"] as DocType[]).map(t => (
                    <button key={t} onClick={() => { updDraft("type", t); if (!selected) setDraft(d => d ? { ...d, numero: newNumero(t, documents) } : d); }}
                      className={`rounded-lg px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider transition ${draft.type === t ? "bg-gradient-to-r from-[#c9a55a] to-[#b08d45] text-[#0a0a0a]" : "text-white/40 hover:text-white/70"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {/* Statut */}
                <div className="relative">
                  <select value={draft.statut}
                    onChange={e => selected ? handleStatut(e.target.value as DocStatut) : updDraft("statut", e.target.value)}
                    className="appearance-none rounded-xl border py-1.5 pl-3 pr-7 text-[0.65rem] font-bold uppercase tracking-wider outline-none cursor-pointer transition"
                    style={(() => { const s = STATUTS[draft.statut]; return { color:s.color, background:s.bg, borderColor:s.border }; })()}>
                    {(Object.keys(STATUTS) as DocStatut[]).map(s => (
                      <option key={s} value={s} style={{ background:"#0f1117", color:"#fff" }}>{STATUTS[s].label}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60"/>
                </div>
                {dirty && (
                  <span className="hidden items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] px-2.5 py-1 text-[0.6rem] font-semibold text-[#c9a55a] sm:inline-flex">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9a55a]"/>Non sauvegardé
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {selected?.type === "devis" && (
                    <button onClick={handleConvert} disabled={converting}
                      className="hidden items-center gap-1.5 rounded-xl border border-blue-400/20 px-3 py-2 text-xs font-semibold text-blue-400/70 transition hover:border-blue-400/40 hover:text-blue-400 disabled:opacity-40 sm:flex">
                      {converting ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>} → Facture
                    </button>
                  )}
                  {/* Aperçu */}
                  <button onClick={() => setShowPreview(true)}
                    className="hidden items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80 sm:flex"
                    title="Aperçu du document">
                    <Eye size={13}/> Aperçu
                  </button>
                  {/* PDF */}
                  <button onClick={() => exportPDFWithTemplate(draft, items, totals)}
                    className="hidden items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80 sm:flex"
                    title="Exporter en PDF">
                    <FileDown size={13}/> PDF
                  </button>
                  {/* Email */}
                  {selected && (
                    <button onClick={openEmailModal}
                      className="hidden items-center gap-1.5 rounded-xl border border-[rgba(56,189,248,0.2)] px-3 py-2 text-xs font-semibold text-sky-400/70 transition hover:border-[rgba(56,189,248,0.4)] hover:text-sky-400 sm:flex"
                      title="Envoyer par email">
                      <Mail size={13}/> Email
                    </button>
                  )}
                  {/* Stripe payment link */}
                  {selected && draft.type === "facture" && (
                    <button onClick={handlePaymentLink} disabled={payLinkLoading}
                      className="hidden items-center gap-1.5 rounded-xl border border-[rgba(167,139,250,0.2)] px-3 py-2 text-xs font-semibold text-[#a78bfa]/70 transition hover:border-[rgba(167,139,250,0.4)] hover:text-[#a78bfa] disabled:opacity-40 sm:flex"
                      title="Créer un lien de paiement Stripe">
                      {payLinkLoading ? <Loader2 size={13} className="animate-spin"/> : <Link2 size={13}/>} Paiement
                    </button>
                  )}
                  {/* Portail client */}
                  {selected && draft.client_nom && (
                    <button onClick={handlePortalLink} disabled={portalLoading}
                      className="hidden items-center gap-1.5 rounded-xl border border-[rgba(34,211,238,0.2)] px-3 py-2 text-xs font-semibold text-[#22d3ee]/70 transition hover:border-[rgba(34,211,238,0.4)] hover:text-[#22d3ee] disabled:opacity-40 sm:flex"
                      title="Générer un portail client sécurisé">
                      {portalLoading ? <Loader2 size={13} className="animate-spin"/> : <Globe size={13}/>} Portail
                    </button>
                  )}
                  {selected && (
                    <button onClick={() => setConfirmDel(true)} disabled={deleting}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400/70 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40">
                      {deleting ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>}
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving || !dirty}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: saving || !dirty ? "rgba(100,100,100,0.3)" : `linear-gradient(135deg, ${activeColor}, ${activeColor}bb)`,
                      color: saving || !dirty ? "#666" : contrastColor(activeColor),
                    }}>
                    {saving ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>

              {/* ── Corps éditeur ── */}
              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
                <div className="mx-auto max-w-3xl space-y-7">

                  {/* Aperçu mini-header */}
                  <div className="overflow-hidden rounded-[1.25rem] border border-white/8">
                    <div className="flex items-center gap-4 px-5 py-4"
                      style={{ background:"linear-gradient(135deg,#080a0f 0%,rgba(8,10,15,0.92) 100%)", borderBottom:`2px solid ${activeColor}` }}>
                      {draft.emetteur_logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={draft.emetteur_logo} alt="Logo" className="h-10 w-auto max-w-[80px] rounded object-contain"/>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                          <Building2 size={16} style={{ color: activeColor }}/>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest" style={{ color: activeColor }}>{draft.type}</p>
                        <p className="text-sm font-extrabold text-white truncate">{draft.numero || "(numéro)"}</p>
                        {draft.sujet && <p className="text-[0.65rem] text-white/40 truncate">{draft.sujet}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[0.6rem] text-white/30">{fmtDate(draft.date_document)}</p>
                        <p className="text-base font-black" style={{ color: activeColor }}>{fmtEur(totals.ttc)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Infos document */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <DInput label="Numéro" value={draft.numero} onChange={v => updDraft("numero", v)} placeholder="FAC-2026-001"/>
                    <DInput label="Date d'émission" type="date" value={draft.date_document} onChange={v => updDraft("date_document", v)}/>
                    <DInput label={draft.type === "facture" ? "Date d'échéance" : "Valable jusqu'au"} type="date" value={draft.date_echeance} onChange={v => updDraft("date_echeance", v)}/>
                  </div>

                  {/* Objet */}
                  <DInput label="Objet / Intitulé *" value={draft.sujet} onChange={v => updDraft("sujet", v)} placeholder="Développement application web, Mission de conseil…"/>

                  {/* Couleur */}
                  <ColorPicker value={activeColor} onChange={v => updDraft("couleur", v)}/>

                  {/* Template PDF */}
                  <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                    <TemplateSelector
                      value={draft.template ?? "modern"}
                      onChange={v => { setDraft(d => d ? { ...d, template: v } : d); setDirty(true); }}
                      data={draftToPreviewData(draft, items, totals)}
                    />
                  </div>

                  {/* Émetteur | Client */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Émetteur */}
                    <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Building2 size={13} style={{ color: activeColor }}/>
                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">Votre entreprise</span>
                      </div>
                      <div className="space-y-2.5">
                        <LogoUploader value={draft.emetteur_logo} onChange={v => updDraft("emetteur_logo", v)}/>
                        <DInput value={draft.emetteur_nom}     onChange={v => updDraft("emetteur_nom", v)}     placeholder="Nom / Société"/>
                        <DInput value={draft.emetteur_email}   onChange={v => updDraft("emetteur_email", v)}   placeholder="email@exemple.com"/>
                        <DInput value={draft.emetteur_adresse} onChange={v => updDraft("emetteur_adresse", v)} placeholder="Adresse complète"/>
                        <DInput value={draft.emetteur_siret}   onChange={v => updDraft("emetteur_siret", v)}   placeholder="SIRET"/>
                      </div>
                    </div>
                    {/* Client */}
                    <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <User size={13} className="text-blue-400"/>
                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">Client</span>
                      </div>
                      <div className="space-y-2.5">
                        <DInput value={draft.client_nom}       onChange={v => updDraft("client_nom", v)}       placeholder="Prénom Nom du contact"/>
                        <DInput value={draft.client_societe}   onChange={v => updDraft("client_societe", v)}   placeholder="Société / Entreprise"/>
                        <DInput value={draft.client_email}     onChange={v => updDraft("client_email", v)}     placeholder="email@client.com"/>
                        <DInput value={draft.client_telephone} onChange={v => updDraft("client_telephone", v)} placeholder="+33 6 00 00 00 00"/>
                        <DInput value={draft.client_adresse}   onChange={v => updDraft("client_adresse", v)}   placeholder="Adresse du client"/>
                      </div>
                    </div>
                  </div>

                  {/* Coordonnées bancaires */}
                  <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Landmark size={13} style={{ color: activeColor }}/>
                      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">Coordonnées bancaires</span>
                      <span className="ml-auto text-[0.58rem] text-white/20">optionnel — apparaît dans le PDF</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DInput label="Titulaire du compte" value={draft.rib_titulaire} onChange={v => updDraft("rib_titulaire", v)} placeholder="Prénom NOM"/>
                      <DInput label="Banque"              value={draft.rib_banque}    onChange={v => updDraft("rib_banque", v)}    placeholder="Nom de la banque"/>
                      <div className="sm:col-span-2">
                        <DInput label="IBAN" value={draft.rib_iban} onChange={v => updDraft("rib_iban", v)} placeholder="FR76 3000 6000 0112 3456 7890 189"/>
                      </div>
                      <DInput label="BIC / SWIFT" value={draft.rib_bic} onChange={v => updDraft("rib_bic", v)} placeholder="BNPAFRPP"/>
                    </div>
                  </div>

                  {/* Lignes de prestation */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-white/40">Prestations</span>
                      <button onClick={addItem}
                        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                        style={{ color:activeColor, borderColor:`${activeColor}44`, background:`${activeColor}11` }}>
                        <Plus size={12}/> Ajouter une ligne
                      </button>
                    </div>
                    <div className="mb-1 hidden grid-cols-[1fr_60px_80px_70px_80px_32px] gap-2 px-3 sm:grid">
                      {["Description", "Qté", "Prix HT", "TVA %", "Total HT", ""].map(h => (
                        <span key={h} className="text-[0.6rem] font-bold uppercase tracking-wider text-white/25">{h}</span>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {items.map((it, idx) => {
                          const lineHT = r2(it.quantity * it.unit_price);
                          return (
                            <motion.div key={idx} layout initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-16 }}
                              transition={{ duration:0.2, ease }}
                              className="group grid grid-cols-1 gap-2 rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.5)] p-3 sm:grid-cols-[1fr_60px_80px_70px_80px_32px] sm:items-center">
                              <DInput small value={it.description} onChange={v => updItem(idx, "description", v)} placeholder="Description de la prestation"/>
                              <DInput small type="number" value={String(it.quantity)}   onChange={v => updItem(idx, "quantity",   parseFloat(v) || 0)} placeholder="1"/>
                              <DInput small type="number" value={String(it.unit_price)} onChange={v => updItem(idx, "unit_price", parseFloat(v) || 0)} placeholder="0.00"/>
                              <select value={it.vat_rate} onChange={e => updItem(idx, "vat_rate", parseFloat(e.target.value))}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none transition hover:border-white/20">
                                {VAT_RATES.map(r => <option key={r} value={r} style={{ background:"#0f1117" }}>{r}%</option>)}
                              </select>
                              <div className="flex items-center justify-end">
                                <span className="text-xs font-bold" style={{ color: activeColor }}>{fmtEur(lineHT)}</span>
                              </div>
                              <button onClick={() => removeItem(idx)} disabled={items.length === 1}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/15 text-red-400/40 transition hover:border-red-500/35 hover:text-red-400 disabled:opacity-20 opacity-0 group-hover:opacity-100">
                                <Trash2 size={11}/>
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Remise & Acompte */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Percent size={12} style={{ color: activeColor }}/>
                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">Remise globale</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="number" min="0" max="100" step="0.5"
                          value={draft.remise_pct || ""}
                          onChange={e => updDraft("remise_pct", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.4)]"/>
                        <span className="text-sm text-white/40">%</span>
                        {totals.remise > 0 && (
                          <span className="text-sm font-bold text-red-400/80">− {fmtEur(totals.remise)}</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <BadgeCheck size={12} className="text-green-400"/>
                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">Acompte versé</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="number" min="0" step="0.01"
                          value={draft.acompte || ""}
                          onChange={e => updDraft("acompte", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.4)]"/>
                        <span className="text-sm text-white/40">€</span>
                      </div>
                    </div>
                  </div>

                  {/* Totaux */}
                  <div className="flex justify-end">
                    <div className="w-full max-w-xs rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.6)] p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/50">Sous-total HT</span>
                        <span className="text-sm font-semibold text-white/80">{fmtEur(totals.subtotal_ht)}</span>
                      </div>
                      {totals.remise > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/50">Remise ({draft.remise_pct}%)</span>
                          <span className="text-sm font-semibold text-red-400">− {fmtEur(totals.remise)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/50">TVA</span>
                        <span className="text-sm font-semibold text-white/80">{fmtEur(totals.tva)}</span>
                      </div>
                      <div className="border-t border-white/8 pt-2 flex items-center justify-between">
                        <span className="text-base font-extrabold text-white">Total TTC</span>
                        <span className="text-xl font-black" style={{ color: activeColor }}>{fmtEur(totals.ttc)}</span>
                      </div>
                      {totals.acompte > 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/50">Acompte versé</span>
                            <span className="text-sm font-semibold text-green-400">− {fmtEur(totals.acompte)}</span>
                          </div>
                          <div className="border-t border-white/8 pt-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-white/70">Net à payer</span>
                            <span className="text-base font-black" style={{ color: activeColor }}>{fmtEur(totals.ttc - totals.acompte)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes & conditions */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DTextarea label="Notes au client" value={draft.notes} onChange={v => updDraft("notes", v)} placeholder="Informations complémentaires…" rows={3}/>
                    <DTextarea label="Conditions de paiement" value={draft.conditions} onChange={v => updDraft("conditions", v)} placeholder="Paiement à 30 jours nets…" rows={3}/>
                  </div>

                  {/* Actions mobile */}
                  <div className="flex flex-wrap gap-3 sm:hidden">
                    {selected?.type === "devis" && (
                      <button onClick={handleConvert} disabled={converting}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-400/20 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-400/8 disabled:opacity-40">
                        {converting ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>} → Facture
                      </button>
                    )}
                    <button onClick={() => setShowPreview(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-white/20">
                      <Eye size={13}/> Aperçu
                    </button>
                    <button onClick={() => exportPDFWithTemplate(draft, items, totals)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-white/20">
                      <FileDown size={13}/> Exporter PDF
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* ══ MODAL APERÇU ══ */}
      <AnimatePresence>
        {showPreview && draft && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
            {/* Barre supérieure */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[rgba(15,17,23,0.95)] px-6 py-3">
              <div className="flex items-center gap-3">
                <Eye size={15} style={{ color: activeColor }}/>
                <span className="text-sm font-bold text-white">
                  Aperçu — {draft.numero || (draft.type === "facture" ? "Facture" : "Devis")}
                </span>
                {draft.sujet && <span className="text-xs text-white/40">{draft.sujet}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { exportPDFWithTemplate(draft, items, totals); }}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition hover:opacity-90">
                  <FileDown size={13}/> Télécharger PDF
                </button>
                <button onClick={() => setShowPreview(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-white/40 transition hover:border-white/20 hover:text-white/80">
                  <X size={15}/>
                </button>
              </div>
            </div>
            {/* Preview scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-8">
              <div className="mx-auto w-full max-w-[620px]">
                <div className="overflow-hidden rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                  <InvoiceTemplate
                    type={draft.template ?? "modern"}
                    data={draftToPreviewData(draft, items, totals)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Confirmation suppression ══ */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale:0.93, y:16, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.95, y:8, opacity:0 }} transition={{ duration:0.3, ease }}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                <Trash2 size={18} className="text-red-400"/>
              </div>
              <h3 className="text-base font-extrabold text-white">Supprimer ce document ?</h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setConfirmDel(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20">Annuler</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50">
                  {deleting && <Loader2 size={13} className="animate-spin"/>}Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Modal Email ══ */}
      <AnimatePresence>
        {emailModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale:0.93, y:16, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.95, y:8, opacity:0 }} transition={{ duration:0.3, ease }}
              className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/8">
                    <Mail size={15} className="text-sky-400"/>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Envoyer par email</h3>
                    <p className="text-[0.65rem] text-white/30">{draft?.numero}</p>
                  </div>
                </div>
                <button onClick={() => setEmailModal(false)} className="text-white/25 hover:text-white/60"><X size={15}/></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Destinataire</label>
                  <input value={emailTo} onChange={e => setEmailTo(e.target.value)}
                    placeholder="email@client.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-sky-400/40"/>
                </div>
                <div>
                  <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Objet</label>
                  <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-sky-400/40"/>
                </div>
                <div>
                  <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Message</label>
                  <textarea value={emailMsg} onChange={e => setEmailMsg(e.target.value)} rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-sky-400/40"/>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setEmailModal(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20">Annuler</button>
                <button onClick={handleSendEmail} disabled={sendingEmail || !emailTo}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-sky-500 disabled:opacity-50">
                  {sendingEmail ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                  {sendingEmail ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Modal Lien de paiement ══ */}
      <AnimatePresence>
        {payLinkModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale:0.93, y:16, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.95, y:8, opacity:0 }} transition={{ duration:0.3, ease }}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)]">
                    <Link2 size={15} className="text-[#a78bfa]"/>
                  </div>
                  <h3 className="text-sm font-extrabold text-white">Lien de paiement</h3>
                </div>
                <button onClick={() => setPayLinkModal(false)} className="text-white/25 hover:text-white/60"><X size={15}/></button>
              </div>
              {payLinkLoading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#a78bfa]"/>
                  <p className="text-sm text-white/40">Génération du lien Stripe…</p>
                </div>
              ) : payLinkUrl ? (
                <div className="space-y-3">
                  <p className="text-sm text-white/55">Lien de paiement créé pour <strong className="text-white">{fmtEur(totals.ttc)}</strong></p>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                    <span className="flex-1 truncate text-xs text-white/60">{payLinkUrl}</span>
                    <button onClick={handleCopyLink}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:text-white/80">
                      {copied ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCopyLink}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] py-2.5 text-sm font-semibold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.15)]">
                      {copied ? <Check size={13}/> : <Copy size={13}/>}
                      {copied ? "Copié !" : "Copier"}
                    </button>
                    <a href={payLinkUrl} target="_blank" rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] py-2.5 text-sm font-bold text-white transition hover:opacity-90">
                      Ouvrir →
                    </a>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Modal Portail client ══ */}
      <AnimatePresence>
        {portalModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale:0.93, y:16, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.95, y:8, opacity:0 }} transition={{ duration:0.3, ease }}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(34,211,238,0.25)] bg-[rgba(34,211,238,0.08)]">
                    <Globe size={15} className="text-[#22d3ee]"/>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Portail client</h3>
                    <p className="text-[0.62rem] text-white/35">{draft?.client_nom}</p>
                  </div>
                </div>
                <button onClick={() => setPortalModal(false)} className="text-white/25 hover:text-white/60"><X size={15}/></button>
              </div>
              {portalLoading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#22d3ee]"/>
                  <p className="text-sm text-white/40">Génération du lien…</p>
                </div>
              ) : portalUrl ? (
                <div className="space-y-3">
                  <p className="text-sm text-white/55">
                    Partagez ce lien sécurisé avec <strong className="text-white">{draft?.client_nom}</strong>.
                    <br/><span className="text-xs text-white/30">Valide 30 jours.</span>
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                    <span className="flex-1 truncate text-xs text-white/55">{portalUrl}</span>
                    <button onClick={handleCopyPortal}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:text-white/80">
                      {portalCopied ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCopyPortal}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(34,211,238,0.25)] bg-[rgba(34,211,238,0.08)] py-2.5 text-sm font-semibold text-[#22d3ee] transition hover:bg-[rgba(34,211,238,0.15)]">
                      {portalCopied ? <Check size={13}/> : <Copy size={13}/>}
                      {portalCopied ? "Copié !" : "Copier"}
                    </button>
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#0ea5e9] py-2.5 text-sm font-bold text-[#09090b] transition hover:opacity-90">
                      Aperçu →
                    </a>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)}/>}
      </AnimatePresence>
    </div>
  );
}
