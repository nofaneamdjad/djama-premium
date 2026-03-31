"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText, Plus, Trash2, FileDown, Save, X, Search,
  CheckCircle2, AlertCircle, Loader2, ArrowLeft, ChevronDown,
  RefreshCw, Building2, User, FileText, Send, BadgeCheck,
  AlertTriangle, ImagePlus, Palette, Landmark,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

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
  /* Émetteur */
  emetteur_nom:     string;
  emetteur_email:   string;
  emetteur_adresse: string;
  emetteur_siret:   string;
  emetteur_logo:    string;
  /* Client */
  client_nom:       string;
  client_email:     string;
  client_adresse:   string;
  /* Dates */
  date_document:    string;
  date_echeance:    string;
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

const EMPTY_ITEM  = (): DocItem  => ({ position:0, description:"", quantity:1, unit_price:0, vat_rate:20 });

const EMPTY_DRAFT = (): DraftDoc => ({
  type:"facture", numero:"", statut:"brouillon",
  emetteur_nom:"", emetteur_email:"", emetteur_adresse:"", emetteur_siret:"", emetteur_logo:"",
  client_nom:"", client_email:"", client_adresse:"",
  date_document: new Date().toISOString().slice(0,10),
  date_echeance:"",
  rib_titulaire:"", rib_iban:"", rib_bic:"", rib_banque:"",
  notes:"", conditions:"",
  couleur:"#c9a55a",
});

/* ═══════════════════════════════════════════════════════════
   UTILITAIRES
═══════════════════════════════════════════════════════════ */
function calcTotals(items: DocItem[]) {
  let ht=0, tva=0;
  for (const it of items) {
    const lineHT = it.quantity * it.unit_price;
    ht  += lineHT;
    tva += lineHT * it.vat_rate / 100;
  }
  return { ht:r2(ht), tva:r2(tva), ttc:r2(ht+tva) };
}
function r2(n:number){ return Math.round(n*100)/100; }

function fmtEur(n:number){
  return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(n);
}
function fmtDate(iso:string){
  if(!iso) return "—";
  const [y,m,d]=iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(y,m-1,d));
}
function newNumero(type:DocType, docs:Document[]):string {
  const prefix = type==="facture"?"FAC":"DEV";
  const n = docs.filter(d=>d.type===type).length+1;
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(3,"0")}`;
}
function hexToRgb(hex:string):[number,number,number]{
  const r=parseInt(hex.slice(1,3),16);
  const g=parseInt(hex.slice(3,5),16);
  const b=parseInt(hex.slice(5,7),16);
  return [isNaN(r)?201:r, isNaN(g)?165:g, isNaN(b)?90:b];
}
function contrastColor(hex:string):"#0a0a0a"|"#ffffff"{
  const [r,g,b]=hexToRgb(hex);
  return (0.299*r+0.587*g+0.114*b)/255 > 0.55 ? "#0a0a0a" : "#ffffff";
}

/* Formate IBAN en groupes de 4 */
function fmtIban(iban:string){ return iban.replace(/\s/g,"").replace(/(.{4})/g,"$1 ").trim(); }

/* ═══════════════════════════════════════════════════════════
   PDF EXPORT
═══════════════════════════════════════════════════════════ */
function exportPDF(draft:DraftDoc, items:DocItem[], totals:ReturnType<typeof calcTotals>){
  const pdf = new jsPDF({unit:"mm",format:"a4"});
  const W=210, mgL=18, mgR=192;
  const col  = draft.couleur||"#c9a55a";
  const [cr,cg,cb] = hexToRgb(col);
  const onCol = contrastColor(col)==="#0a0a0a" ? [10,10,10] : [255,255,255];
  const st = STATUTS[draft.statut];

  /* ─ Header sombre ─ */
  pdf.setFillColor(8,10,15);
  pdf.rect(0,0,W,56,"F");
  pdf.setFillColor(cr,cg,cb);
  pdf.rect(0,53,W,1.8,"F");

  /* Logo */
  let logoEndX = mgL;
  if(draft.emetteur_logo){
    try{
      const ext = draft.emetteur_logo.includes("image/png")?"PNG":
                  draft.emetteur_logo.includes("image/webp")?"WEBP":"JPEG";
      pdf.addImage(draft.emetteur_logo,ext,mgL,7,30,30);
      logoEndX = mgL+34;
    }catch{ /* image invalide */ }
  }

  /* Type + numéro */
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8);
  pdf.setTextColor(cr,cg,cb);
  pdf.text(draft.type.toUpperCase(), logoEndX, 16);
  pdf.setFontSize(21); pdf.setTextColor(255,255,255);
  pdf.text(draft.numero||(draft.type==="facture"?"FACTURE":"DEVIS"), logoEndX, 28);

  /* Infos droite */
  pdf.setFont("helvetica","normal"); pdf.setFontSize(7.5); pdf.setTextColor(170,170,170);
  pdf.text(`Statut : ${st.label}`,                    mgR, 14, {align:"right"});
  pdf.text(`Émis le ${fmtDate(draft.date_document)}`,  mgR, 20, {align:"right"});
  if(draft.date_echeance)
    pdf.text(`Échéance : ${fmtDate(draft.date_echeance)}`, mgR, 26, {align:"right"});

  /* ─ Bloc Émetteur / Client ─ */
  let y=66;
  pdf.setFont("helvetica","bold"); pdf.setFontSize(7); pdf.setTextColor(160,160,160);
  pdf.text("DE", mgL, y);
  pdf.text("POUR", W/2+4, y);

  y+=5;
  pdf.setFontSize(10); pdf.setFont("helvetica","bold"); pdf.setTextColor(20,20,20);
  pdf.text(draft.emetteur_nom||"(Émetteur)", mgL,   y);
  pdf.text(draft.client_nom  ||"(Client)",   W/2+4, y);

  y+=5;
  pdf.setFont("helvetica","normal"); pdf.setFontSize(8); pdf.setTextColor(80,80,80);
  const emLines = pdf.splitTextToSize(
    [draft.emetteur_email,
     draft.emetteur_adresse,
     draft.emetteur_siret?`SIRET : ${draft.emetteur_siret}`:""]
     .filter(Boolean).join("\n"),80) as string[];
  const clLines = pdf.splitTextToSize(
    [draft.client_email, draft.client_adresse].filter(Boolean).join("\n"),80) as string[];
  pdf.text(emLines, mgL,   y);
  pdf.text(clLines, W/2+4, y);

  /* ─ Tableau lignes ─ */
  y = Math.max(y+emLines.length*4.8, y+clLines.length*4.8)+10;

  pdf.setFillColor(cr,cg,cb);
  pdf.rect(mgL-2,y-5,mgR-mgL+4,8,"F");
  pdf.setFont("helvetica","bold"); pdf.setFontSize(7.5);
  pdf.setTextColor(onCol[0],onCol[1],onCol[2]);
  pdf.text("Description", mgL,  y);
  pdf.text("Qté",         120,  y,{align:"right"});
  pdf.text("P.U. HT",     140,  y,{align:"right"});
  pdf.text("TVA",         155,  y,{align:"right"});
  pdf.text("Total HT",    mgR,  y,{align:"right"});

  y+=5;
  pdf.setFont("helvetica","normal"); pdf.setFontSize(8.5);
  for(const [i,it] of items.entries()){
    if(y>255){pdf.addPage();y=18;}
    const lineHT=r2(it.quantity*it.unit_price);
    if(i%2===0){pdf.setFillColor(248,248,250);pdf.rect(mgL-2,y-3.5,mgR-mgL+4,7,"F");}
    pdf.setTextColor(25,25,25);
    const descLines=pdf.splitTextToSize(it.description||"(description)",80) as string[];
    pdf.text(descLines,mgL,y);
    pdf.setTextColor(60,60,60);
    pdf.text(String(it.quantity),    120,y,{align:"right"});
    pdf.text(fmtEur(it.unit_price),  140,y,{align:"right"});
    pdf.text(`${it.vat_rate}%`,      155,y,{align:"right"});
    pdf.setFont("helvetica","bold");
    pdf.text(fmtEur(lineHT),         mgR,y,{align:"right"});
    pdf.setFont("helvetica","normal");
    y+=descLines.length*5.2+1.5;
  }

  /* ─ Totaux ─ */
  y+=4;
  pdf.setDrawColor(cr,cg,cb); pdf.setLineWidth(0.5);
  pdf.line(mgL,y,mgR,y); y+=6;

  for(const [lbl,val] of [["Sous-total HT",totals.ht],["TVA",totals.tva]] as [string,number][]){
    pdf.setFont("helvetica","normal"); pdf.setTextColor(100,100,100);
    pdf.text(lbl, 148,y);
    pdf.setFont("helvetica","bold"); pdf.setTextColor(40,40,40);
    pdf.text(fmtEur(val),mgR,y,{align:"right"});
    y+=5;
  }
  y+=1;
  pdf.setFillColor(cr,cg,cb);
  pdf.roundedRect(138,y-1,mgR-138+2,10,1.5,1.5,"F");
  pdf.setTextColor(onCol[0],onCol[1],onCol[2]);
  pdf.setFont("helvetica","bold"); pdf.setFontSize(9.5);
  pdf.text("TOTAL TTC",142,y+6.2);
  pdf.text(fmtEur(totals.ttc),mgR,y+6.2,{align:"right"});
  y+=15;

  /* ─ RIB / Coordonnées bancaires ─ */
  const hasRib = draft.rib_titulaire||draft.rib_iban||draft.rib_bic||draft.rib_banque;
  if(hasRib){
    if(y>255){pdf.addPage();y=18;}
    /* Fond léger */
    pdf.setFillColor(245,247,250);
    const ribStartY=y;
    /* Calcul hauteur estimée */
    const ribLines = [
      draft.rib_titulaire?`Titulaire : ${draft.rib_titulaire}`:"",
      draft.rib_banque?`Banque : ${draft.rib_banque}`:"",
      draft.rib_iban?`IBAN : ${fmtIban(draft.rib_iban)}`:"",
      draft.rib_bic?`BIC : ${draft.rib_bic}`:"",
    ].filter(Boolean);
    const ribH = 8+ribLines.length*5+4;
    pdf.roundedRect(mgL-2,ribStartY-2,mgR-mgL+4,ribH,2,2,"F");

    /* Barre couleur gauche */
    pdf.setFillColor(cr,cg,cb);
    pdf.roundedRect(mgL-2,ribStartY-2,3,ribH,1,1,"F");

    pdf.setFont("helvetica","bold"); pdf.setFontSize(8); pdf.setTextColor(cr,cg,cb);
    pdf.text("Coordonnées bancaires", mgL+4, y+1);
    y+=7;

    pdf.setFont("helvetica","normal"); pdf.setFontSize(8.5); pdf.setTextColor(40,40,40);
    for(const line of ribLines){
      if(y>270){pdf.addPage();y=18;}
      pdf.text(line, mgL+4, y);
      y+=5;
    }
    y+=6;
  }

  /* ─ Notes & Conditions ─ */
  if(draft.notes){
    if(y>260){pdf.addPage();y=18;}
    pdf.setFont("helvetica","bold"); pdf.setFontSize(8); pdf.setTextColor(cr,cg,cb);
    pdf.text("Notes", mgL, y); y+=4.5;
    pdf.setFont("helvetica","normal"); pdf.setFontSize(8); pdf.setTextColor(60,60,60);
    const nl=pdf.splitTextToSize(draft.notes,W-36) as string[];
    pdf.text(nl,mgL,y); y+=nl.length*4.5+4;
  }
  if(draft.conditions){
    if(y>260){pdf.addPage();y=18;}
    pdf.setFont("helvetica","bold"); pdf.setFontSize(8); pdf.setTextColor(cr,cg,cb);
    pdf.text("Conditions de paiement", mgL, y); y+=4.5;
    pdf.setFont("helvetica","normal"); pdf.setFontSize(8); pdf.setTextColor(60,60,60);
    pdf.text(pdf.splitTextToSize(draft.conditions,W-36) as string[], mgL, y);
  }

  /* ─ Footer ─ */
  pdf.setFillColor(8,10,15);
  pdf.rect(0,284,W,13,"F");
  pdf.setFontSize(7); pdf.setFont("helvetica","normal"); pdf.setTextColor(120,120,120);
  pdf.text(draft.emetteur_nom||"DJAMA", mgL, 291);
  pdf.text(draft.numero||draft.type, mgR, 291, {align:"right"});

  const safe=(draft.numero||draft.type).replace(/[^a-z0-9-]/gi,"_");
  pdf.save(`${safe}.pdf`);
}

/* ═══════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════════════ */
function StatutBadge({statut}:{statut:DocStatut}){
  const s=STATUTS[statut];
  return(
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
      style={{color:s.color,background:s.bg,border:`1px solid ${s.border}`}}>
      <s.Icon size={9}/>{s.label}
    </span>
  );
}

function Toast({toast,onClose}:{toast:{type:"success"|"error";msg:string};onClose:()=>void}){
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[onClose]);
  return(
    <motion.div initial={{opacity:0,y:24,scale:0.95}} animate={{opacity:1,y:0,scale:1}}
      exit={{opacity:0,y:8}} transition={{duration:0.28,ease}}
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl ${
        toast.type==="success"?"border-green-500/20 bg-[rgba(15,23,42,0.97)] text-green-300"
                              :"border-red-500/20 bg-[rgba(15,23,42,0.97)] text-red-300"}`}>
      {toast.type==="success"
        ?<CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-400"/>
        :<AlertCircle  size={15} className="mt-0.5 shrink-0 text-red-400"/>}
      <span className="flex-1 text-sm font-medium leading-snug">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 shrink-0 text-white/30 hover:text-white/60"><X size={12}/></button>
    </motion.div>
  );
}

function DInput({label,value,onChange,placeholder,type="text",small}:
  {label?:string;value:string;onChange:(v:string)=>void;placeholder?:string;type?:string;small?:boolean}){
  const [focused,setFocused]=useState(false);
  const cls=small
    ?"w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none transition hover:border-white/20"
    :"w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20";
  return(
    <div>
      {label&&<label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{label}</label>}
      <div className="relative">
        <motion.div animate={{opacity:focused?1:0}} transition={{duration:0.15}}
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{boxShadow:"0 0 0 2px rgba(201,165,90,0.35)"}}/>
        <input type={type} value={value} onChange={e=>onChange(e.target.value)}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          placeholder={placeholder} className={cls}/>
      </div>
    </div>
  );
}

function DTextarea({label,value,onChange,placeholder,rows=3}:
  {label?:string;value:string;onChange:(v:string)=>void;placeholder?:string;rows?:number}){
  return(
    <div>
      {label&&<label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.4)]"/>
    </div>
  );
}

function ColorPicker({value,onChange}:{value:string;onChange:(v:string)=>void}){
  const ref=useRef<HTMLInputElement>(null);
  const isPreset=COLOR_PRESETS.some(p=>p.hex===value);
  return(
    <div>
      <label className="mb-2 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
        <Palette size={9} className="mr-1 inline-block"/>Couleur du document
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {COLOR_PRESETS.map(p=>(
          <button key={p.hex} title={p.label} onClick={()=>onChange(p.hex)}
            className="relative h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
            style={{background:p.hex,borderColor:value===p.hex?"#fff":"transparent"}}>
            {value===p.hex&&<span className="absolute inset-0 flex items-center justify-center">
              <span className="h-2 w-2 rounded-full" style={{background:contrastColor(p.hex)}}/>
            </span>}
          </button>
        ))}
        <div className="relative">
          <div className="h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2 transition-transform hover:scale-110"
            style={{background:isPreset?"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)":value,
                    borderColor:!isPreset?"#fff":"transparent"}}
            title="Couleur personnalisée"
            onClick={()=>ref.current?.click()}/>
          <input ref={ref} type="color" value={value} onChange={e=>onChange(e.target.value)}
            className="absolute inset-0 h-0 w-0 opacity-0 pointer-events-none"/>
        </div>
      </div>
    </div>
  );
}

function LogoUploader({value,onChange}:{value:string;onChange:(b64:string)=>void}){
  const ref=useRef<HTMLInputElement>(null);
  function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value="";
  }
  return(
    <div>
      <label className="mb-2 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
        <ImagePlus size={9} className="mr-1 inline-block"/>Logo entreprise
      </label>
      <div className="flex items-center gap-3">
        {value?(
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Logo" className="h-12 w-auto max-w-[120px] rounded-lg border border-white/10 bg-white/5 object-contain p-1"/>
            <button onClick={()=>onChange("")}
              className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-red-500/30 bg-[#0f1117] text-red-400 transition group-hover:flex">
              <X size={10}/>
            </button>
          </div>
        ):(
          <div onClick={()=>ref.current?.click()}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/3 text-white/25 transition hover:border-white/30 hover:text-white/40">
            <ImagePlus size={18}/>
          </div>
        )}
        <button onClick={()=>ref.current?.click()}
          className="text-[0.7rem] font-semibold text-white/35 underline-offset-2 transition hover:text-white/60 hover:underline">
          {value?"Remplacer":"Importer le logo"}
        </button>
        <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden"/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function FacturesPage(){
  const [documents,  setDocuments]  = useState<Document[]>([]);
  const [selected,   setSelected]   = useState<Document|null>(null);
  const [draft,      setDraft]      = useState<DraftDoc|null>(null);
  const [items,      setItems]      = useState<DocItem[]>([EMPTY_ITEM()]);
  const [dirty,      setDirty]      = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [converting, setConverting] = useState(false);
  const [toast,      setToast]      = useState<{type:"success"|"error";msg:string}|null>(null);
  const [query,      setQuery]      = useState("");
  const [filterType, setFilterType] = useState<"tous"|DocType>("tous");
  const [mobileView, setMobileView] = useState<"list"|"editor">("list");
  const [confirmDel, setConfirmDel] = useState(false);

  const totals = useMemo(()=>calcTotals(items),[items]);

  /* ── Charger ── */
  const fetchDocs = useCallback(async()=>{
    setLoadingAll(true);
    const{data,error}=await supabase.from("documents").select("*").order("updated_at",{ascending:false});
    if(error){
      console.error("[fetchDocs] Supabase error:", error);
      showToast("error",`Chargement impossible : ${error.message}`);
    } else {
      setDocuments((data as Document[])??[]);
    }
    setLoadingAll(false);
  },[]);

  useEffect(()=>{ fetchDocs(); },[fetchDocs]);

  function showToast(type:"success"|"error", msg:string){ setToast({type,msg}); }

  /* ── Ouvrir ── */
  async function openDoc(doc:Document){
    setSelected(doc);
    setDraft({
      type:             doc.type,
      numero:           doc.numero,
      statut:           doc.statut,
      emetteur_nom:     doc.emetteur_nom     ?? "",
      emetteur_email:   doc.emetteur_email   ?? "",
      emetteur_adresse: doc.emetteur_adresse ?? "",
      emetteur_siret:   doc.emetteur_siret   ?? "",
      emetteur_logo:    doc.emetteur_logo    ?? "",
      client_nom:       doc.client_nom       ?? "",
      client_email:     doc.client_email     ?? "",
      client_adresse:   doc.client_adresse   ?? "",
      date_document:    doc.date_document,
      date_echeance:    doc.date_echeance    ?? "",
      rib_titulaire:    doc.rib_titulaire    ?? "",
      rib_iban:         doc.rib_iban         ?? "",
      rib_bic:          doc.rib_bic          ?? "",
      rib_banque:       doc.rib_banque       ?? "",
      notes:            doc.notes            ?? "",
      conditions:       doc.conditions       ?? "",
      couleur:          doc.couleur          ?? "#c9a55a",
    });
    const{data}=await supabase.from("document_items").select("*").eq("document_id",doc.id).order("position");
    setItems((data as DocItem[])?.length ? (data as DocItem[]) : [EMPTY_ITEM()]);
    setDirty(false);
    setMobileView("editor");
  }

  /* ── Nouveau ── */
  function newDoc(type:DocType="facture"){
    setSelected(null);
    setDraft({...EMPTY_DRAFT(), type, numero:newNumero(type,documents)});
    setItems([EMPTY_ITEM()]);
    setDirty(true);
    setMobileView("editor");
  }

  /* ── Mise à jour draft ── */
  function updDraft(k:keyof DraftDoc, v:string){
    setDraft(d=>d?{...d,[k]:v}:d);
    setDirty(true);
  }

  /* ── Lignes ── */
  function updItem(idx:number, k:keyof DocItem, v:string|number){
    setItems(p=>p.map((it,i)=>i===idx?{...it,[k]:v}:it));
    setDirty(true);
  }
  function addItem(){ setItems(p=>[...p,{...EMPTY_ITEM(),position:p.length}]); setDirty(true); }
  function removeItem(idx:number){ setItems(p=>p.filter((_,i)=>i!==idx).map((it,i)=>({...it,position:i}))); setDirty(true); }

  /* ── SAUVEGARDER ── */
  async function handleSave(){
    if(!draft){ showToast("error","Aucun document ouvert."); return; }
    setSaving(true);

    /* Auth */
    const{data:{user}, error:authErr}=await supabase.auth.getUser();
    if(authErr||!user){
      console.error("[handleSave] auth error:", authErr);
      showToast("error","Non connecté. Veuillez vous reconnecter.");
      setSaving(false); return;
    }

    /* Payload — colonnes nommées explicitement */
    const payload = {
      type:             draft.type,
      numero:           draft.numero,
      statut:           draft.statut,
      emetteur_nom:     draft.emetteur_nom,
      emetteur_email:   draft.emetteur_email,
      emetteur_adresse: draft.emetteur_adresse,
      emetteur_siret:   draft.emetteur_siret,
      emetteur_logo:    draft.emetteur_logo,
      client_nom:       draft.client_nom,
      client_email:     draft.client_email,
      client_adresse:   draft.client_adresse,
      date_document:    draft.date_document,
      date_echeance:    draft.date_echeance || null,
      rib_titulaire:    draft.rib_titulaire,
      rib_iban:         draft.rib_iban,
      rib_bic:          draft.rib_bic,
      rib_banque:       draft.rib_banque,
      notes:            draft.notes,
      conditions:       draft.conditions,
      couleur:          draft.couleur,
      total_ht:         totals.ht,
      total_tva:        totals.tva,
      total_ttc:        totals.ttc,
    };

    console.log("[handleSave] payload →", payload);

    let docId = selected?.id;

    /* INSERT ou UPDATE */
    if(selected){
      const{error}=await supabase.from("documents").update(payload).eq("id",selected.id);
      if(error){
        console.error("[handleSave] UPDATE error:", error);
        showToast("error",`Erreur : ${error.message}${error.details?` — ${error.details}`:""}`);
        setSaving(false); return;
      }
    } else {
      const{data,error}=await supabase
        .from("documents")
        .insert({...payload, user_id:user.id})
        .select()
        .single();
      if(error){
        console.error("[handleSave] INSERT error:", error);
        showToast("error",`Erreur : ${error.message}${error.details?` — ${error.details}`:""}`);
        setSaving(false); return;
      }
      docId=(data as Document).id;
    }

    /* Lignes : supprime les anciennes puis réinsère */
    if(docId){
      const{error:delErr}=await supabase.from("document_items").delete().eq("document_id",docId);
      if(delErr) console.warn("[handleSave] delete items warn:", delErr);

      if(items.length){
        const rows=items.map((it,i)=>({
          document_id:  docId,
          position:     i,
          description:  it.description,
          quantity:     it.quantity,
          unit_price:   it.unit_price,
          vat_rate:     it.vat_rate,
        }));
        console.log("[handleSave] inserting items →", rows.length, "lignes");
        const{error:insErr}=await supabase.from("document_items").insert(rows);
        if(insErr){
          console.error("[handleSave] INSERT items error:", insErr);
          showToast("error",`Lignes : ${insErr.message}`);
          setSaving(false); return;
        }
      }
    }

    /* Rechargement */
    showToast("success","✓ Document enregistré avec succès !");
    setDirty(false);
    setSaving(false);
    await fetchDocs();
    if(docId){
      const{data,error}=await supabase.from("documents").select("*").eq("id",docId).single();
      if(error) console.warn("[handleSave] reload single:", error);
      else if(data) setSelected(data as Document);
    }
  }

  /* ── Supprimer ── */
  async function handleDelete(){
    if(!selected) return;
    setDeleting(true);
    const{error}=await supabase.from("documents").delete().eq("id",selected.id);
    setDeleting(false); setConfirmDel(false);
    if(error){ showToast("error",error.message); return; }
    setDocuments(p=>p.filter(d=>d.id!==selected.id));
    setSelected(null); setDraft(null); setMobileView("list");
    showToast("success","Document supprimé.");
  }

  /* ── Statut ── */
  async function handleStatut(statut:DocStatut){
    if(!selected) return;
    const{error}=await supabase.from("documents").update({statut}).eq("id",selected.id);
    if(error){ showToast("error",error.message); return; }
    setSelected(s=>s?{...s,statut}:s);
    setDraft(d=>d?{...d,statut}:d);
    setDocuments(p=>p.map(d=>d.id===selected.id?{...d,statut}:d));
    showToast("success",`Statut : ${STATUTS[statut].label}`);
  }

  /* ── Convertir devis → facture ── */
  async function handleConvert(){
    if(!selected||selected.type!=="devis") return;
    setConverting(true);
    const{data:{user}}=await supabase.auth.getUser();
    if(!user){ setConverting(false); return; }
    const newNum=newNumero("facture",documents);
    const{data:newDoc,error}=await supabase.from("documents").insert({
      user_id:          user.id,
      type:             "facture",
      numero:           newNum,
      statut:           "brouillon",
      emetteur_nom:     selected.emetteur_nom,
      emetteur_email:   selected.emetteur_email,
      emetteur_adresse: selected.emetteur_adresse,
      emetteur_siret:   selected.emetteur_siret,
      emetteur_logo:    selected.emetteur_logo    ?? "",
      client_nom:       selected.client_nom,
      client_email:     selected.client_email,
      client_adresse:   selected.client_adresse,
      date_document:    new Date().toISOString().slice(0,10),
      date_echeance:    selected.date_echeance,
      rib_titulaire:    selected.rib_titulaire    ?? "",
      rib_iban:         selected.rib_iban         ?? "",
      rib_bic:          selected.rib_bic          ?? "",
      rib_banque:       selected.rib_banque       ?? "",
      notes:            selected.notes,
      conditions:       selected.conditions,
      couleur:          selected.couleur          ?? "#c9a55a",
      total_ht:         selected.total_ht,
      total_tva:        selected.total_tva,
      total_ttc:        selected.total_ttc,
    }).select().single();
    if(error||!newDoc){
      console.error("[handleConvert] error:", error);
      showToast("error","Erreur lors de la conversion.");
      setConverting(false); return;
    }
    const{data:srcItems}=await supabase.from("document_items").select("*").eq("document_id",selected.id);
    if(srcItems?.length){
      await supabase.from("document_items").insert(
        (srcItems as (DocItem&{document_id:string})[]).map((it,i)=>({
          document_id:(newDoc as Document).id, position:i,
          description:it.description, quantity:it.quantity,
          unit_price:it.unit_price, vat_rate:it.vat_rate,
        }))
      );
    }
    setConverting(false);
    showToast("success",`Devis converti → ${newNum}`);
    await fetchDocs();
    openDoc(newDoc as Document);
  }

  /* ── Filtres ── */
  const filtered=useMemo(()=>{
    let list=[...documents];
    if(filterType!=="tous") list=list.filter(d=>d.type===filterType);
    if(query.trim()){
      const q=query.toLowerCase();
      list=list.filter(d=>d.numero.toLowerCase().includes(q)||d.client_nom.toLowerCase().includes(q));
    }
    return list;
  },[documents,filterType,query]);

  const activeColor = draft?.couleur||"#c9a55a";

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return(
    <div className="flex flex-col bg-[#080a0f]">

      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[15%] top-[8%] h-[500px] w-[500px] rounded-full bg-[rgba(176,141,87,0.04)] blur-[140px]"/>
        <div className="absolute bottom-[5%] right-[10%] h-[400px] w-[400px] rounded-full bg-[rgba(34,197,94,0.03)] blur-[120px]"/>
      </div>

      {/* ── Sub-header page ── */}
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.88)] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.09)]">
              <ReceiptText size={16} style={{color:"#c9a55a"}}/>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Factures & Devis</h1>
              <p className="text-[0.65rem] text-white/30">{documents.length} document{documents.length!==1?"s":""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>newDoc("devis")}
              className="hidden items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80 sm:flex">
              <Plus size={12}/> Devis
            </button>
            <button onClick={()=>newDoc("facture")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition hover:shadow-[0_6px_24px_rgba(201,165,90,0.45)]">
              <Plus size={14}/> Facture
            </button>
          </div>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-5 px-5 py-5 sm:px-5">

        {/* ══ Liste ══ */}
        <aside className={`flex w-full flex-col border-r border-white/6 bg-[rgba(15,17,23,0.6)] sm:w-[300px] sm:flex-none sm:rounded-[1.5rem] sm:border sm:border-white/8 ${mobileView==="editor"?"hidden sm:flex":"flex"}`}>
          <div className="space-y-2.5 border-b border-white/6 p-4">
            <div className="relative">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"/>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Numéro, client…"
                className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)]"/>
              {query&&<button onClick={()=>setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"><X size={12}/></button>}
            </div>
            <div className="flex gap-1.5">
              {(["tous","facture","devis"] as const).map(t=>(
                <button key={t} onClick={()=>setFilterType(t)}
                  className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition ${filterType===t?"bg-white/12 text-white":"text-white/30 hover:text-white/60"}`}>
                  {t==="tous"?"Tous":t==="facture"?"Factures":"Devis"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingAll?(
              <div className="flex items-center justify-center py-14"><Loader2 size={20} className="animate-spin text-white/20"/></div>
            ):filtered.length===0?(
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <ReceiptText size={22} className="text-white/15"/>
                <p className="text-sm text-white/25">{query?"Aucun résultat":"Aucun document"}</p>
                {!query&&<button onClick={()=>newDoc("facture")}
                  className="mt-1 flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.25)] px-3 py-1.5 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.09)]">
                  <Plus size={12}/> Créer un document
                </button>}
              </div>
            ):(
              <AnimatePresence initial={false}>
                {filtered.map(doc=>(
                  <motion.button key={doc.id} layout
                    initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}}
                    transition={{duration:0.22,ease}}
                    onClick={()=>openDoc(doc)}
                    className={`group w-full border-b border-white/5 px-4 py-3.5 text-left transition hover:bg-white/4 ${selected?.id===doc.id?"bg-white/6":""}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-widest ${
                        doc.type==="facture"?"bg-[rgba(201,165,90,0.12)] text-[#c9a55a]":"bg-[rgba(59,130,246,0.12)] text-blue-400"}`}>
                        {doc.type}
                      </span>
                      <StatutBadge statut={doc.statut}/>
                    </div>
                    <p className="text-sm font-bold text-white/90">{doc.numero||"(sans numéro)"}</p>
                    <p className="text-xs text-white/40 truncate">{doc.client_nom||"(client)"}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[0.65rem] text-white/25">{fmtDate(doc.date_document)}</span>
                      <span className="text-xs font-bold" style={{color:doc.couleur||"#c9a55a"}}>{fmtEur(doc.total_ttc)}</span>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </aside>

        {/* ══ Éditeur ══ */}
        <main className={`flex flex-1 flex-col overflow-hidden ${mobileView==="list"?"hidden sm:flex":"flex"}`}>
          {!draft?(
            <motion.div initial={{opacity:0}} animate={{opacity:1}}
              className="flex h-full flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.4)] p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)]">
                <ReceiptText size={28} style={{color:"#c9a55a"}}/>
              </div>
              <div>
                <p className="text-base font-bold text-white">Sélectionnez ou créez un document</p>
                <p className="mt-1 text-sm text-white/30">Factures et devis professionnels</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>newDoc("devis")}
                  className="flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-400/8 px-4 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-400/15">
                  <Plus size={14}/> Nouveau devis
                </button>
                <button onClick={()=>newDoc("facture")}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-sm font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition">
                  <Plus size={14}/> Nouvelle facture
                </button>
              </div>
            </motion.div>
          ):(
            <motion.div key={selected?.id??"new"} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
              transition={{duration:0.3,ease}}
              className="flex h-full flex-col overflow-hidden rounded-none bg-[rgba(15,17,23,0.6)] sm:rounded-[1.5rem] sm:border sm:border-white/8">

              {/* ── Toolbar ── */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/6 px-5 py-3">
                <button onClick={()=>setMobileView("list")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition sm:hidden">
                  <ArrowLeft size={13}/>
                </button>
                <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
                  {(["facture","devis"] as DocType[]).map(t=>(
                    <button key={t} onClick={()=>{updDraft("type",t);if(!selected)setDraft(d=>d?{...d,numero:newNumero(t,documents)}:d);}}
                      className={`rounded-lg px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider transition ${draft.type===t?"bg-gradient-to-r from-[#c9a55a] to-[#b08d45] text-[#0a0a0a]":"text-white/40 hover:text-white/70"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <select value={draft.statut}
                    onChange={e=>selected?handleStatut(e.target.value as DocStatut):updDraft("statut",e.target.value)}
                    className="appearance-none rounded-xl border py-1.5 pl-3 pr-7 text-[0.65rem] font-bold uppercase tracking-wider outline-none cursor-pointer transition"
                    style={(()=>{const s=STATUTS[draft.statut];return{color:s.color,background:s.bg,borderColor:s.border};})()}>
                    {(Object.keys(STATUTS) as DocStatut[]).map(s=>(
                      <option key={s} value={s} style={{background:"#0f1117",color:"#fff"}}>{STATUTS[s].label}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60"/>
                </div>
                {dirty&&(
                  <span className="hidden items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] px-2.5 py-1 text-[0.6rem] font-semibold text-[#c9a55a] sm:inline-flex">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9a55a]"/>Non sauvegardé
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {selected?.type==="devis"&&(
                    <button onClick={handleConvert} disabled={converting}
                      className="hidden items-center gap-1.5 rounded-xl border border-blue-400/20 px-3 py-2 text-xs font-semibold text-blue-400/70 transition hover:border-blue-400/40 hover:text-blue-400 disabled:opacity-40 sm:flex">
                      {converting?<Loader2 size={12} className="animate-spin"/>:<RefreshCw size={12}/>} → Facture
                    </button>
                  )}
                  <button onClick={()=>exportPDF(draft,items,totals)}
                    className="hidden items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80 sm:flex"
                    title="Exporter en PDF">
                    <FileDown size={13}/> PDF
                  </button>
                  {selected&&(
                    <button onClick={()=>setConfirmDel(true)} disabled={deleting}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400/70 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40">
                      {deleting?<Loader2 size={13} className="animate-spin"/>:<Trash2 size={13}/>}
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving||!dirty}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: saving||!dirty
                        ? "rgba(100,100,100,0.3)"
                        : `linear-gradient(135deg, ${activeColor}, ${activeColor}bb)`,
                      color: saving||!dirty ? "#666" : contrastColor(activeColor),
                    }}>
                    {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}
                    {saving?"Enregistrement…":"Enregistrer"}
                  </button>
                </div>
              </div>

              {/* ── Corps éditeur ── */}
              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
                <div className="mx-auto max-w-3xl space-y-7">

                  {/* Aperçu mini-header */}
                  <div className="overflow-hidden rounded-[1.25rem] border border-white/8">
                    <div className="flex items-center gap-4 px-5 py-4"
                      style={{background:"linear-gradient(135deg,#080a0f 0%,rgba(8,10,15,0.92) 100%)",borderBottom:`2px solid ${activeColor}`}}>
                      {draft.emetteur_logo?(
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={draft.emetteur_logo} alt="Logo" className="h-10 w-auto max-w-[80px] rounded object-contain"/>
                      ):(
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                          <Building2 size={16} style={{color:activeColor}}/>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest" style={{color:activeColor}}>{draft.type}</p>
                        <p className="text-sm font-extrabold text-white truncate">{draft.numero||"(numéro)"}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[0.6rem] text-white/30">{fmtDate(draft.date_document)}</p>
                        <p className="text-base font-black" style={{color:activeColor}}>{fmtEur(totals.ttc)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Infos document */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <DInput label="Numéro" value={draft.numero} onChange={v=>updDraft("numero",v)} placeholder="FAC-2026-001"/>
                    <DInput label="Date" type="date" value={draft.date_document} onChange={v=>updDraft("date_document",v)}/>
                    <DInput label="Échéance" type="date" value={draft.date_echeance} onChange={v=>updDraft("date_echeance",v)}/>
                  </div>

                  {/* Couleur */}
                  <ColorPicker value={activeColor} onChange={v=>updDraft("couleur",v)}/>

                  {/* Émetteur | Client */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Building2 size={13} style={{color:activeColor}}/>
                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">Votre entreprise</span>
                      </div>
                      <div className="space-y-2.5">
                        <LogoUploader value={draft.emetteur_logo} onChange={v=>updDraft("emetteur_logo",v)}/>
                        <DInput value={draft.emetteur_nom}     onChange={v=>updDraft("emetteur_nom",v)}     placeholder="Nom / Société"/>
                        <DInput value={draft.emetteur_email}   onChange={v=>updDraft("emetteur_email",v)}   placeholder="email@exemple.com"/>
                        <DInput value={draft.emetteur_adresse} onChange={v=>updDraft("emetteur_adresse",v)} placeholder="Adresse complète"/>
                        <DInput value={draft.emetteur_siret}   onChange={v=>updDraft("emetteur_siret",v)}   placeholder="SIRET"/>
                      </div>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <User size={13} className="text-blue-400"/>
                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">Client</span>
                      </div>
                      <div className="space-y-2.5">
                        <DInput value={draft.client_nom}     onChange={v=>updDraft("client_nom",v)}     placeholder="Nom du client"/>
                        <DInput value={draft.client_email}   onChange={v=>updDraft("client_email",v)}   placeholder="email@client.com"/>
                        <DInput value={draft.client_adresse} onChange={v=>updDraft("client_adresse",v)} placeholder="Adresse du client"/>
                      </div>
                    </div>
                  </div>

                  {/* Coordonnées bancaires */}
                  <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Landmark size={13} style={{color:activeColor}}/>
                      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">Coordonnées bancaires</span>
                      <span className="ml-auto text-[0.58rem] text-white/20">optionnel — apparaît dans le PDF</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DInput label="Titulaire du compte" value={draft.rib_titulaire} onChange={v=>updDraft("rib_titulaire",v)} placeholder="Prénom NOM"/>
                      <DInput label="Banque"              value={draft.rib_banque}    onChange={v=>updDraft("rib_banque",v)}    placeholder="Nom de la banque"/>
                      <div className="sm:col-span-2">
                        <DInput label="IBAN" value={draft.rib_iban} onChange={v=>updDraft("rib_iban",v)} placeholder="FR76 3000 6000 0112 3456 7890 189"/>
                      </div>
                      <DInput label="BIC / SWIFT" value={draft.rib_bic} onChange={v=>updDraft("rib_bic",v)} placeholder="BNPAFRPP"/>
                    </div>
                  </div>

                  {/* Lignes de prestation */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-white/40">Prestations</span>
                      <button onClick={addItem}
                        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                        style={{color:activeColor,borderColor:`${activeColor}44`,background:`${activeColor}11`}}>
                        <Plus size={12}/> Ajouter une ligne
                      </button>
                    </div>
                    <div className="mb-1 hidden grid-cols-[1fr_60px_80px_70px_80px_32px] gap-2 px-3 sm:grid">
                      {["Description","Qté","Prix HT","TVA %","Total HT",""].map(h=>(
                        <span key={h} className="text-[0.6rem] font-bold uppercase tracking-wider text-white/25">{h}</span>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {items.map((it,idx)=>{
                          const lineHT=r2(it.quantity*it.unit_price);
                          return(
                            <motion.div key={idx} layout initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-16}}
                              transition={{duration:0.2,ease}}
                              className="group grid grid-cols-1 gap-2 rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.5)] p-3 sm:grid-cols-[1fr_60px_80px_70px_80px_32px] sm:items-center">
                              <DInput small value={it.description} onChange={v=>updItem(idx,"description",v)} placeholder="Description de la prestation"/>
                              <DInput small type="number" value={String(it.quantity)}   onChange={v=>updItem(idx,"quantity",  parseFloat(v)||0)} placeholder="1"/>
                              <DInput small type="number" value={String(it.unit_price)} onChange={v=>updItem(idx,"unit_price",parseFloat(v)||0)} placeholder="0.00"/>
                              <select value={it.vat_rate} onChange={e=>updItem(idx,"vat_rate",parseFloat(e.target.value))}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none transition hover:border-white/20">
                                {VAT_RATES.map(r=><option key={r} value={r} style={{background:"#0f1117"}}>{r}%</option>)}
                              </select>
                              <div className="flex items-center justify-end">
                                <span className="text-xs font-bold" style={{color:activeColor}}>{fmtEur(lineHT)}</span>
                              </div>
                              <button onClick={()=>removeItem(idx)} disabled={items.length===1}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/15 text-red-400/40 transition hover:border-red-500/35 hover:text-red-400 disabled:opacity-20 opacity-0 group-hover:opacity-100">
                                <Trash2 size={11}/>
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Totaux */}
                  <div className="flex justify-end">
                    <div className="w-full max-w-xs rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.6)] p-5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/50">Sous-total HT</span>
                        <span className="text-sm font-semibold text-white/80">{fmtEur(totals.ht)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/50">TVA</span>
                        <span className="text-sm font-semibold text-white/80">{fmtEur(totals.tva)}</span>
                      </div>
                      <div className="border-t border-white/8 pt-2.5 flex items-center justify-between">
                        <span className="text-base font-extrabold text-white">Total TTC</span>
                        <span className="text-xl font-black" style={{color:activeColor}}>{fmtEur(totals.ttc)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes & conditions */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DTextarea label="Notes" value={draft.notes} onChange={v=>updDraft("notes",v)} placeholder="Informations complémentaires…" rows={3}/>
                    <DTextarea label="Conditions de paiement" value={draft.conditions} onChange={v=>updDraft("conditions",v)} placeholder="Paiement à 30 jours…" rows={3}/>
                  </div>

                  {/* Actions mobile */}
                  <div className="flex flex-wrap gap-3 sm:hidden">
                    {selected?.type==="devis"&&(
                      <button onClick={handleConvert} disabled={converting}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-400/20 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-400/8 disabled:opacity-40">
                        {converting?<Loader2 size={12} className="animate-spin"/>:<RefreshCw size={12}/>} → Facture
                      </button>
                    )}
                    <button onClick={()=>exportPDF(draft,items,totals)}
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

      {/* ── Confirmation suppression ── */}
      <AnimatePresence>
        {confirmDel&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div initial={{scale:0.93,y:16,opacity:0}} animate={{scale:1,y:0,opacity:1}}
              exit={{scale:0.95,y:8,opacity:0}} transition={{duration:0.3,ease}}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                <Trash2 size={18} className="text-red-400"/>
              </div>
              <h3 className="text-base font-extrabold text-white">Supprimer ce document ?</h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={()=>setConfirmDel(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20">Annuler</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50">
                  {deleting&&<Loader2 size={13} className="animate-spin"/>}Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </div>
  );
}
