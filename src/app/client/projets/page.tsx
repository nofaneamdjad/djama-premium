"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Plus, X, Loader2, Trash2,
  Calendar, Tag, Clock, CheckCircle2, PauseCircle,
  XCircle, AlertCircle, Edit2, BarChart3, Flag,
  Users, Timer, ChevronRight, Circle, FileText,
  Folder, BookOpen, Download, Copy, Check, Sparkles,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import { useTheme } from "@/lib/theme-context";

/* ── Types ── */
type Status = "en_cours" | "terminé" | "en_attente" | "annulé";

interface Project {
  id: string; user_id: string; title: string; client: string; status: Status;
  category: string; start_date: string | null; end_date: string | null;
  budget: number; spent: number; description: string; color: string;
  created_at: string; updated_at: string;
}

type Draft = Partial<Omit<Project, "id" | "user_id" | "created_at" | "updated_at">>;

interface ProjTask    { id:string; projectId:string; title:string; done:boolean; }
interface Milestone   { id:string; projectId:string; title:string; date:string; done:boolean; }

interface CdcSection { id:string; titre:string; contenu:string; }
interface CdcData    { titre:string; sections:CdcSection[]; }

interface PlanPhase  { titre:string; debut:string; fin:string; color:string; }
interface PlanJalon  { titre:string; date:string; }
interface PlanTache  { titre:string; }
interface PlanProjet {
  titre:string; description:string; category:string; color:string;
  debut:string; fin:string;
  phases:PlanPhase[]; jalons:PlanJalon[]; taches:PlanTache[];
}

/* ── Constants ── */
const VIOLET       = "#8b5cf6";
const GOLD         = "#c9a55a";
const SKY          = "#0ea5e9";
const PX_PER_DAY   = 5;

const STATUS_CONFIG: Record<Status, { label:string; color:string; bg:string; Icon:React.ComponentType<{size?:number}> }> = {
  en_cours:   { label:"En cours",   color:"#3b82f6", bg:"rgba(59,130,246,0.12)",  Icon:Clock        },
  terminé:    { label:"Terminé",    color:"#10b981", bg:"rgba(16,185,129,0.12)",  Icon:CheckCircle2 },
  en_attente: { label:"En attente", color:"#f59e0b", bg:"rgba(245,158,11,0.12)",  Icon:PauseCircle  },
  annulé:     { label:"Annulé",     color:"#ef4444", bg:"rgba(239,68,68,0.12)",   Icon:XCircle      },
};

const COLORS     = ["#8b5cf6","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4","#c9a55a"];
const CATEGORIES = ["Design","Développement","Marketing","Conseil","Rédaction","Comptabilité","Juridique","Autre"];

function emptyDraft(): Draft {
  return { title:"", client:"", status:"en_cours", category:"Autre", start_date:"", end_date:"", budget:0, spent:0, description:"", color:VIOLET };
}
function fmtEur(n:number) { return n.toLocaleString("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}); }
function fmtDate(d:string|null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
}
function fmtDateShort(d:string) {
  return new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
}

/* ── PDF CDC ── */
async function downloadCdcPdf(cdc: CdcData) {
  type JPDF = {
    setFont:(f:string,s:string)=>void; setFontSize:(n:number)=>void;
    setTextColor:(r:number,g:number,b:number)=>void;
    setFillColor:(r:number,g:number,b:number)=>void;
    setDrawColor:(r:number,g:number,b:number)=>void;
    setLineWidth:(n:number)=>void;
    text:(t:string,x:number,y:number,o?:{align?:string})=>void;
    line:(x1:number,y1:number,x2:number,y2:number)=>void;
    rect:(x:number,y:number,w:number,h:number,s?:string)=>void;
    roundedRect:(x:number,y:number,w:number,h:number,rx:number,ry:number,s?:string)=>void;
    splitTextToSize:(t:string,w:number)=>string[];
    addPage:()=>void; save:(name:string)=>void;
  };
  const { jsPDF } = (await import("jspdf")) as { jsPDF: new (o?:{format?:string}) => JPDF };
  const doc = new jsPDF({ format: "a4" });

  const PW=210,PH=297,BAR=5,ML=18,MR=18,CS=ML+BAR,CW=PW-CS-MR,FY=278;
  type RGB=[number,number,number];
  const V:RGB=[139,92,246],VL:RGB=[237,233,254],DARK:RGB=[14,20,32];
  const GRAY:RGB=[70,75,100],MUTED:RGB=[128,132,155],WHITE:RGB=[255,255,255];
  const BORD:RGB=[218,212,240],HDR:RGB=[20,10,45];
  const sf=(c:RGB)=>doc.setFillColor(c[0],c[1],c[2]);
  const sd=(c:RGB)=>doc.setDrawColor(c[0],c[1],c[2]);
  const st=(c:RGB)=>doc.setTextColor(c[0],c[1],c[2]);
  const dateStr=new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});

  function chrome(cont=false){
    // Footer
    sd(BORD); doc.setLineWidth(0.25); doc.line(CS,FY,PW-MR,FY);
    doc.setFont("helvetica","normal"); doc.setFontSize(6); st(MUTED);
    doc.text(cdc.titre.slice(0,65),CS,FY+5);
    doc.text(dateStr,PW-MR,FY+5,{align:"right"});
    // Accent bar (drawn last to overlay everything)
    sf(V); doc.rect(0,0,BAR,PH,"F");
    // Continuation header
    if(cont){
      sf(VL); doc.rect(BAR,0,PW-BAR,11,"F");
      doc.setFont("helvetica","bold"); doc.setFontSize(6.5); st(V);
      doc.text("CAHIER DES CHARGES",CS,7);
      doc.setFont("helvetica","normal"); st(MUTED);
      doc.text(cdc.titre.slice(0,45),PW-MR,7,{align:"right"});
    }
  }

  // ── Page 1 header ──────────────────────────────────────────────────────────
  const HH=52;
  sf(HDR); doc.rect(0,0,PW,HH,"F");
  doc.setFont("helvetica","bold"); doc.setFontSize(7); st(V);
  doc.text("CAHIER DES CHARGES",CS,13);
  sd(V); doc.setLineWidth(0.6); doc.line(CS,15.5,CS+36,15.5);
  const ttLines=doc.splitTextToSize(cdc.titre,CW-8);
  doc.setFontSize(ttLines.length>1?15:19); st(WHITE);
  let ty=28;
  for(const tl of ttLines.slice(0,2)){doc.text(tl,CS,ty);ty+=7.5;}
  doc.setFont("helvetica","normal"); doc.setFontSize(7.5); st([165,150,210] as RGB);
  doc.text(`Document du ${dateStr}`,CS,HH-9);
  sf([55,20,110] as RGB); doc.roundedRect(PW-MR-40,HH-21,40,10,4,4,"F");
  doc.setFont("helvetica","bold"); doc.setFontSize(6.5); st(WHITE);
  doc.text(`${cdc.sections.length} sections`,PW-MR-20,HH-15,{align:"center"});
  chrome(false);
  let y=HH+13;

  // ── Sections ───────────────────────────────────────────────────────────────
  const BC:RGB[]=[[139,92,246],[99,102,241],[79,70,229],[109,40,217],[124,58,237],[91,33,182],[118,75,162],[76,29,149]];
  for(let i=0;i<cdc.sections.length;i++){
    const sec=cdc.sections[i];
    if(y+20>FY){doc.addPage();chrome(true);y=18;}
    // Title row
    sf(VL); doc.roundedRect(CS,y,CW,10,2,2,"F");
    sf(BC[i%BC.length]); doc.roundedRect(CS,y,10,10,2,2,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(6.5); st(WHITE);
    doc.text(String(i+1).padStart(2,"0"),CS+5,y+6.5,{align:"center"});
    doc.setFont("helvetica","bold"); doc.setFontSize(9); st(DARK);
    doc.text(sec.titre,CS+14,y+6.5);
    y+=15;
    // Content
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5);
    for(const rl of sec.contenu.split("\n")){
      const tr=rl.trim();
      if(!tr){y+=2.5;continue;}
      const isBullet=tr.startsWith("-");
      const txt=isBullet?"•  "+tr.slice(1).trimStart():tr;
      const wrapped=doc.splitTextToSize(txt,CW-(isBullet?5:0));
      for(const wl of wrapped){
        if(y+5.5>FY){doc.addPage();chrome(true);y=18;doc.setFont("helvetica","normal");doc.setFontSize(8.5);}
        st(isBullet?GRAY:MUTED);
        doc.text(wl,isBullet?CS+5:CS,y);
        y+=4.8;
      }
    }
    y+=10;
  }

  doc.save(`CDC-${cdc.titre.replace(/[^a-zA-Z0-9À-ÿ]/g,"-").slice(0,40)}.pdf`);
}

/* ── Gantt helpers ── */
function getMonths(start:Date, end:Date): {label:string; days:number}[] {
  const out: {label:string; days:number}[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    const last = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
    out.push({ label: d.toLocaleDateString("fr-FR",{month:"short",year:"2-digit"}), days: last });
    d.setMonth(d.getMonth()+1);
  }
  return out;
}

/* ── StatusBadge ── */
function StatusBadge({ status }: { status:Status }) {
  const { label, color, bg, Icon } = STATUS_CONFIG[status];
  return (
    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{color, background:bg}}>
      <Icon size={11}/>{label}
    </span>
  );
}

/* ── ProjectCard ── */
function ProjectCard({
  project, onEdit, onDelete, onOpen, onChrono, onInvoice, onCdc, creatingInv, tasks, miles, team, isDark,
}: {
  project:Project; onEdit:(p:Project)=>void; onDelete:(id:string)=>void;
  onOpen:(p:Project)=>void; onChrono:()=>void; onInvoice:()=>void; onCdc:()=>void;
  creatingInv:string|null; tasks:ProjTask[]; miles:Milestone[]; team:string[]; isDark:boolean;
}) {
  const budgetPct  = project.budget>0 ? Math.min(100,Math.round((project.spent/project.budget)*100)) : 0;
  const overBudget = project.budget>0 && project.spent>project.budget;
  const doneTasks  = tasks.filter(t=>t.done).length;
  const doneMiles  = miles.filter(m=>m.done).length;

  const cardCls   = isDark
    ? "border-white/6 bg-white/[0.04] hover:border-white/12 hover:bg-white/[0.06] hover:shadow-black/30"
    : "border-black/8 bg-white shadow-sm hover:border-black/12 hover:bg-slate-50 hover:shadow-slate-200/80";
  const textPri   = isDark ? "text-white"    : "text-[#0e1420]";
  const textSec   = isDark ? "text-white/40" : "text-black/40";
  const textMuted = isDark ? "text-white/35" : "text-black/35";
  const textFaint = isDark ? "text-white/30" : "text-black/30";
  const barBg     = isDark ? "bg-white/8"    : "bg-black/8";
  const chipCls   = isDark ? "bg-white/8 text-white/40"  : "bg-black/5 text-black/40";
  const btnBase   = isDark
    ? "border-white/8 bg-white/8 text-white/60 hover:bg-white/12 hover:text-white"
    : "border-black/8 bg-black/5 text-black/50 hover:bg-black/8 hover:text-[#0e1420]";

  return (
    <motion.div layout initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.97}}
      onClick={()=>onOpen(project)}
      className={`flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur-sm transition-all hover:shadow-lg cursor-pointer ${cardCls}`}>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{background:project.color}}/>
          <div className="min-w-0">
            <h3 className={`truncate font-bold ${textPri}`}>{project.title}</h3>
            {project.client && <p className={`truncate text-xs ${textSec}`}>{project.client}</p>}
          </div>
        </div>
        <StatusBadge status={project.status}/>
      </div>

      <div className={`flex flex-wrap gap-2 text-xs ${textMuted}`}>
        {project.category!=="Autre" && <span className="flex items-center gap-1"><Tag size={10}/>{project.category}</span>}
        {(project.start_date||project.end_date) && (
          <span className="flex items-center gap-1"><Calendar size={10}/>{fmtDate(project.start_date)} → {fmtDate(project.end_date)}</span>
        )}
      </div>

      {project.budget>0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className={textMuted}>Budget</span>
            <span className={overBudget ? "font-bold text-red-400" : (isDark ? "text-white/60" : "text-black/60")}>
              {fmtEur(project.spent)} / {fmtEur(project.budget)}
            </span>
          </div>
          <div className={`h-1.5 rounded-full ${barBg}`}>
            <div className="h-full rounded-full transition-all" style={{width:`${budgetPct}%`,background:overBudget?"#ef4444":project.color}}/>
          </div>
        </div>
      )}

      {tasks.length>0 && (
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-1.5 rounded-full ${barBg}`}>
            <div className="h-full rounded-full transition-all" style={{width:`${(doneTasks/tasks.length)*100}%`,background:"#10b981"}}/>
          </div>
          <span className={`text-[10px] shrink-0 ${textFaint}`}>{doneTasks}/{tasks.length} tâches</span>
        </div>
      )}

      {(team.length>0||miles.length>0) && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {team.length>0 && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Users size={11} className={`shrink-0 ${isDark ? "text-white/25" : "text-black/25"}`}/>
              <div className="flex gap-1 flex-wrap min-w-0">
                {team.slice(0,3).map(n=>(
                  <span key={n} className={`text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[72px] ${chipCls}`}>{n}</span>
                ))}
                {team.length>3 && <span className={`text-[10px] ${isDark ? "text-white/25" : "text-black/25"}`}>+{team.length-3}</span>}
              </div>
            </div>
          )}
          {miles.length>0 && (
            <span className={`flex items-center gap-1 text-[10px] ml-auto shrink-0 ${textFaint}`}>
              <Flag size={10}/>{doneMiles}/{miles.length} jalons
            </span>
          )}
        </div>
      )}

      {project.description && <p className={`line-clamp-2 text-xs ${textFaint}`}>{project.description}</p>}

      <div className="flex gap-2 pt-1" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>onEdit(project)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-1.5 text-xs font-semibold transition ${btnBase}`}>
          <Edit2 size={11}/> Modifier
        </button>
        <button onClick={onCdc}
          title="Cahier des charges IA"
          className="flex items-center justify-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
          style={{borderColor:`${VIOLET}30`,background:`${VIOLET}10`,color:VIOLET}}>
          <BookOpen size={11}/>
        </button>
        {project.budget > 0 && (
          <button onClick={onInvoice} disabled={!!creatingInv}
            title="Créer une facture"
            className="flex items-center justify-center gap-1 rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-3 py-1.5 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.15)] disabled:opacity-40">
            {creatingInv===project.id ? <Loader2 size={11} className="animate-spin"/> : <FileText size={11}/>}
          </button>
        )}
        <button onClick={onChrono} title="Chrono"
          className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${isDark ? "border-white/8 bg-white/8 text-white/40 hover:bg-white/12 hover:text-white" : "border-black/8 bg-black/5 text-black/35 hover:bg-black/8 hover:text-[#0e1420]"}`}>
          <Timer size={11}/>
        </button>
        <button onClick={()=>onDelete(project.id)}
          className="flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/6 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/12">
          <Trash2 size={11}/>
        </button>
      </div>
    </motion.div>
  );
}

/* ── ProjectModal ── */
function ProjectModal({
  draft, setDraft, onSave, onClose, saving, isEdit, isDark,
}: {
  draft:Draft; setDraft:React.Dispatch<React.SetStateAction<Draft>>;
  onSave:()=>void; onClose:()=>void; saving:boolean; isEdit:boolean; isDark:boolean;
}) {
  function field(key:keyof Draft, value:string|number) { setDraft(d=>({...d,[key]:value})); }

  const modalBg   = isDark ? "bg-[#0e1420] border-white/8" : "bg-white border-black/8";
  const titleCls  = isDark ? "text-white"    : "text-[#0e1420]";
  const closeCls  = isDark ? "text-white/40 hover:bg-white/8 hover:text-white" : "text-black/40 hover:bg-black/5 hover:text-[#0e1420]";
  const labelCls  = isDark ? "text-white/40" : "text-black/40";
  const inputCls  = isDark
    ? "border-white/8 bg-white/6 text-white placeholder:text-white/25 focus:border-white/20 focus:bg-white/8"
    : "border-black/10 bg-slate-50 text-[#0e1420] placeholder:text-black/25 focus:border-violet-300 focus:bg-white";
  const selectCls = isDark ? "border-white/8 bg-[#0e1420] text-white" : "border-black/10 bg-white text-[#0e1420]";
  const cancelCls = isDark
    ? "border-white/8 bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70"
    : "border-black/8 bg-black/5 text-black/40 hover:bg-black/8 hover:text-black/60";

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <motion.div initial={{scale:0.96,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.96,opacity:0}}
        className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl ${modalBg}`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className={`text-lg font-bold ${titleCls}`}>{isEdit?"Modifier le projet":"Nouveau projet"}</h2>
          <button onClick={onClose} className={`rounded-xl p-2 transition ${closeCls}`}><X size={18}/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Titre *</label>
            <input value={draft.title??""} onChange={e=>field("title",e.target.value)}
              placeholder="Ex : Site e-commerce Boutique X"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Client</label>
              <input value={draft.client??""} onChange={e=>field("client",e.target.value)} placeholder="Nom du client"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
            </div>
            <div>
              <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Catégorie / Dossier</label>
              <select value={draft.category??"Autre"} onChange={e=>field("category",e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${selectCls}`}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Statut</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as Status[]).map(s=>{
                const {label,color,bg} = STATUS_CONFIG[s];
                const active = draft.status===s;
                return (
                  <button key={s} onClick={()=>field("status",s)}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                    style={active?{color,background:bg,borderColor:color+"40"}
                      :isDark?{color:"rgba(255,255,255,0.4)",borderColor:"rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)"}
                      :{color:"rgba(0,0,0,0.4)",borderColor:"rgba(0,0,0,0.08)",background:"rgba(0,0,0,0.03)"}}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Date début</label>
              <input type="date" value={draft.start_date??""} onChange={e=>field("start_date",e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls} ${isDark?"[color-scheme:dark]":"[color-scheme:light]"}`}/>
            </div>
            <div>
              <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Date fin</label>
              <input type="date" value={draft.end_date??""} onChange={e=>field("end_date",e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls} ${isDark?"[color-scheme:dark]":"[color-scheme:light]"}`}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Budget (€)</label>
              <input type="number" min="0" value={draft.budget??0} onChange={e=>field("budget",parseFloat(e.target.value)||0)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
            </div>
            <div>
              <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Encaissé (€)</label>
              <input type="number" min="0" value={draft.spent??0} onChange={e=>field("spent",parseFloat(e.target.value)||0)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
            </div>
          </div>
          <div>
            <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Couleur</label>
            <div className="flex gap-2">
              {COLORS.map(c=>(
                <button key={c} onClick={()=>field("color",c)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{background:c,outline:draft.color===c?`3px solid ${c}`:"none",outlineOffset:"2px"}}/>
              ))}
            </div>
          </div>
          <div>
            <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Description</label>
            <textarea value={draft.description??""} onChange={e=>field("description",e.target.value)}
              placeholder="Contexte, livrables, notes..." rows={3}
              className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${cancelCls}`}>Annuler</button>
          <button onClick={onSave} disabled={saving||!draft.title?.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50 shadow-lg"
            style={{background:VIOLET}}>
            {saving && <Loader2 size={14} className="animate-spin"/>}
            {isEdit?"Enregistrer":"Créer le projet"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── CahierDesChargesModal ── */
function CahierDesChargesModal({ onClose, isDark, initialName, initialDesc }: {
  onClose:()=>void; isDark:boolean; initialName?:string; initialDesc?:string;
}) {
  const [step,    setStep]    = useState<"form"|"loading"|"result">("form");
  const [nom,     setNom]     = useState(initialName  || "");
  const [desc,    setDesc]    = useState(initialDesc  || "");
  const [budget,  setBudget]  = useState("");
  const [delai,   setDelai]   = useState("");
  const [tech,    setTech]    = useState("");
  const [cdc,     setCdc]     = useState<CdcData | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [copied,  setCopied]  = useState(false);
  const [dlPdf,   setDlPdf]   = useState(false);

  const modalBg  = isDark ? "bg-[#0e1420] border-white/8"  : "bg-white border-black/8";
  const labelCls = isDark ? "text-white/40" : "text-black/40";
  const inputCls = isDark
    ? "border-white/8 bg-white/6 text-white placeholder:text-white/20 focus:border-violet-500/40 focus:bg-white/8"
    : "border-black/10 bg-slate-50 text-[#0e1420] placeholder:text-black/20 focus:border-violet-300 focus:bg-white";
  const titleCls = isDark ? "text-white" : "text-[#0e1420]";
  const secBg    = isDark ? "bg-white/[0.03] border-white/6" : "bg-slate-50 border-black/6";
  const secTitle = isDark ? "text-white/80" : "text-[#0e1420]/80";
  const secBody  = isDark ? "text-white/55" : "text-black/55";

  async function generate() {
    if (!desc.trim()) return;
    setStep("loading"); setError(null);
    try {
      const res = await fetch("/api/projets/cahier-charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, description: desc, budget, delai, tech }),
      });
      const json = await res.json() as { cdc?: CdcData; error?: string };
      if (!res.ok || !json.cdc) {
        setError(json.error || "Erreur lors de la génération.");
        setStep("form");
        return;
      }
      setCdc(json.cdc);
      setStep("result");
    } catch {
      setError("Erreur réseau.");
      setStep("form");
    }
  }

  async function copyAll() {
    if (!cdc) return;
    const text = `${cdc.titre}\n\n` + cdc.sections.map(s=>`## ${s.titre}\n${s.contenu}`).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  }

  async function handleDownloadPdf() {
    if (!cdc) return;
    setDlPdf(true);
    try { await downloadCdcPdf(cdc); } catch {}
    setDlPdf(false);
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <motion.div initial={{scale:0.96,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.96,opacity:0}}
        className={`flex flex-col max-h-[90vh] w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${modalBg}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark?"border-white/6":"border-black/6"} shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{background:`${VIOLET}20`}}>
              <Sparkles size={14} style={{color:VIOLET}}/>
            </div>
            <div>
              <h2 className={`text-sm font-black ${titleCls}`}>Cahier des charges IA</h2>
              <p className={`text-[10px] ${isDark?"text-white/35":"text-black/35"}`}>
                {step==="form" ? "Décrivez votre projet" : step==="loading" ? "Génération en cours…" : cdc?.titre}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition ${isDark?"text-white/40 hover:bg-white/8 hover:text-white":"text-black/40 hover:bg-black/5 hover:text-[#0e1420]"}`}>
            <X size={16}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Form step */}
          {step==="form" && (
            <div className="p-6 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">{error}</div>
              )}
              <div>
                <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Nom du projet (optionnel)</label>
                <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex : Application mobile de livraison"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
              </div>
              <div>
                <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Description du projet *</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={5}
                  placeholder="Décrivez votre projet en détail : objectifs, cibles, fonctionnalités souhaitées, contexte métier…"
                  className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Budget estimé (optionnel)</label>
                  <input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Ex : 15 000 €"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
                </div>
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Délai souhaité (optionnel)</label>
                  <input value={delai} onChange={e=>setDelai(e.target.value)} placeholder="Ex : 3 mois"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
                </div>
              </div>
              <div>
                <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Technologies / contraintes (optionnel)</label>
                <input value={tech} onChange={e=>setTech(e.target.value)} placeholder="Ex : React, Node.js, doit s'intégrer à Salesforce"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
              </div>
            </div>
          )}

          {/* Loading step */}
          {step==="loading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{background:`${VIOLET}15`}}>
                  <Sparkles size={28} style={{color:VIOLET}} className="animate-pulse"/>
                </div>
                <Loader2 size={14} className="animate-spin absolute -bottom-1 -right-1 text-violet-400"/>
              </div>
              <div className="text-center">
                <p className={`font-bold ${isDark?"text-white":"text-[#0e1420]"}`}>L&apos;IA rédige votre cahier des charges</p>
                <p className={`text-sm mt-1 ${isDark?"text-white/40":"text-black/40"}`}>Cela prend environ 15 secondes…</p>
              </div>
            </div>
          )}

          {/* Result step */}
          {step==="result" && cdc && (
            <div className="p-6 space-y-3">
              <h3 className={`text-base font-black ${titleCls}`}>{cdc.titre}</h3>
              {cdc.sections.map((sec, i)=>(
                <div key={sec.id} className={`rounded-xl border p-4 ${secBg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{background:`${VIOLET}20`,color:VIOLET}}>
                      {String(i+1).padStart(2,"0")}
                    </span>
                    <h4 className={`text-xs font-black uppercase tracking-wide ${isDark?"text-white/70":"text-black/70"}`}>{sec.titre}</h4>
                  </div>
                  <div className={`text-xs leading-relaxed whitespace-pre-wrap ${secBody}`}>{sec.contenu}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t shrink-0 flex gap-2 ${isDark?"border-white/6":"border-black/6"}`}>
          {step==="form" && (
            <>
              <button onClick={onClose}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${isDark?"border-white/8 bg-white/6 text-white/50 hover:bg-white/10":"border-black/8 bg-black/4 text-black/40 hover:bg-black/8"}`}>
                Annuler
              </button>
              <button onClick={()=>void generate()} disabled={!desc.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50 shadow-lg"
                style={{background:VIOLET}}>
                <Sparkles size={14}/>Générer le cahier des charges
              </button>
            </>
          )}
          {step==="result" && cdc && (
            <>
              <button onClick={()=>{ setCdc(null); setStep("form"); setError(null); }}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${isDark?"border-white/8 bg-white/6 text-white/50 hover:bg-white/10":"border-black/8 bg-black/4 text-black/40 hover:bg-black/8"}`}>
                Recommencer
              </button>
              <button onClick={()=>void copyAll()}
                className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${isDark?"border-white/8 bg-white/8 text-white/60 hover:bg-white/12":"border-black/8 bg-black/5 text-black/50 hover:bg-black/8"}`}>
                {copied ? <><Check size={13} className="text-emerald-400"/>Copié</> : <><Copy size={13}/>Copier</>}
              </button>
              <button onClick={()=>void handleDownloadPdf()} disabled={dlPdf}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50 shadow-lg"
                style={{background:VIOLET}}>
                {dlPdf ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                Télécharger PDF
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── GanttPlanModal ── */
function GanttPlanModal({ onClose, isDark, onCreated }: {
  onClose:()=>void; isDark:boolean;
  onCreated:(p:Project, tasks:ProjTask[], jalons:Milestone[])=>void;
}) {
  const [step,     setStep]    = useState<"form"|"loading"|"result">("form");
  const [nom,      setNom]     = useState("");
  const [desc,     setDesc]    = useState("");
  const [budget,   setBudget]  = useState("");
  const [delai,    setDelai]   = useState("");
  const [debut,    setDebut]   = useState(new Date().toISOString().slice(0,10));
  const [plan,     setPlan]    = useState<PlanProjet|null>(null);
  const [error,    setError]   = useState<string|null>(null);
  const [creating, setCreating]= useState(false);

  const modalBg  = isDark ? "bg-[#0e1420] border-white/8"  : "bg-white border-black/8";
  const labelCls = isDark ? "text-white/40" : "text-black/40";
  const inputCls = isDark
    ? "border-white/8 bg-white/6 text-white placeholder:text-white/20 focus:border-violet-500/40 focus:bg-white/8"
    : "border-black/10 bg-slate-50 text-[#0e1420] placeholder:text-black/20 focus:border-violet-300 focus:bg-white";
  const titleCls = isDark ? "text-white" : "text-[#0e1420]";
  const divCls   = isDark ? "border-white/6" : "border-black/6";

  async function generate() {
    if (!desc.trim()) return;
    setStep("loading"); setError(null);
    try {
      const res  = await fetch("/api/projets/planification", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ description:desc, nom, budget, delai, debut }),
      });
      const json = await res.json() as { plan?:PlanProjet; error?:string };
      if (!res.ok || !json.plan) { setError(json.error||"Erreur."); setStep("form"); return; }
      setPlan(json.plan);
      setStep("result");
    } catch { setError("Erreur réseau."); setStep("form"); }
  }

  async function createProject() {
    if (!plan || creating) return;
    setCreating(true);
    try {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) { setError("Non connecté."); return; }

      const { data:proj, error:projErr } = await supabase.from("projects").insert({
        user_id:user.id, title:plan.titre, client:"", status:"en_cours",
        category:plan.category, start_date:plan.debut, end_date:plan.fin,
        budget:0, spent:0, description:plan.description, color:plan.color,
        updated_at:new Date().toISOString(),
      }).select().single();
      if (projErr||!proj) { setError(projErr?.message||"Erreur création."); return; }

      const newTasks: ProjTask[] = [];
      if (plan.taches.length>0) {
        const { data:td } = await supabase.from("project_tasks").insert(
          plan.taches.map((t,i)=>({ user_id:user.id, project_id:proj.id, title:t.titre, done:false, position:i }))
        ).select();
        if (td) for (const r of td) newTasks.push({id:r.id,projectId:proj.id,title:r.title,done:false});
      }

      const newMiles: Milestone[] = [];
      if (plan.jalons.length>0) {
        const { data:md } = await supabase.from("project_milestones").insert(
          plan.jalons.map(j=>({ user_id:user.id, project_id:proj.id, title:j.titre, date:j.date, done:false }))
        ).select();
        if (md) for (const r of md) newMiles.push({id:r.id,projectId:proj.id,title:r.title,date:r.date??'',done:false});
      }

      onCreated(proj as Project, newTasks, newMiles);
      onClose();
    } finally { setCreating(false); }
  }

  /* Mini-Gantt preview */
  function miniGantt() {
    if (!plan) return null;
    const S = new Date(plan.debut).getTime();
    const E = new Date(plan.fin).getTime();
    const T = Math.max(1, E - S);
    const pct  = (d:string) => Math.max(0, Math.min(100,((new Date(d).getTime()-S)/T)*100));
    const wPct = (d1:string, d2:string) => Math.max(2, ((new Date(d2).getTime()-new Date(d1).getTime())/T)*100);
    const totalDays = Math.round(T / 86400000);

    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-black text-sm ${titleCls}`}>{plan.titre}</h4>
            <p className={`text-[10px] mt-0.5 ${isDark?"text-white/35":"text-black/35"}`}>
              {fmtDate(plan.debut)} → {fmtDate(plan.fin)} · {totalDays} jours
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
            style={{background:`${plan.color}20`}}>
            <div className="w-3 h-3 rounded-full" style={{background:plan.color}}/>
          </div>
        </div>

        {/* Phase bars */}
        <div className={`rounded-xl border p-3 space-y-1.5 ${isDark?"border-white/6 bg-white/[0.02]":"border-black/6 bg-slate-50"}`}>
          {plan.phases.map((ph,i)=>(
            <div key={i} className="relative h-7 flex items-center">
              <div className={`absolute inset-0 rounded-lg ${isDark?"bg-white/[0.02]":"bg-black/[0.02]"}`}/>
              <div className="absolute h-5 rounded-lg flex items-center px-2 overflow-hidden transition-all"
                style={{
                  left:`${pct(ph.debut)}%`,
                  width:`${wPct(ph.debut,ph.fin)}%`,
                  background:`${ph.color||plan.color}25`,
                  border:`1.5px solid ${ph.color||plan.color}50`,
                }}>
                <span className="text-[9px] font-bold truncate" style={{color:ph.color||plan.color}}>{ph.titre}</span>
              </div>
              {/* Jalon diamonds on this phase */}
              {plan.jalons.filter(j=>{
                const jt=new Date(j.date).getTime();
                return jt>=new Date(ph.debut).getTime()&&jt<=new Date(ph.fin).getTime();
              }).map((j,ji)=>(
                <div key={ji} title={j.titre}
                  className="absolute top-0.5 z-10 w-2.5 h-2.5 rotate-45"
                  style={{left:`${pct(j.date)}%`,transform:"translateX(-50%) rotate(45deg)",background:"#f59e0b",border:"1.5px solid #f59e0b80"}}/>
              ))}
            </div>
          ))}
          {/* Milestones that don't fall in any phase */}
          <div className={`flex justify-between text-[9px] pt-0.5 ${isDark?"text-white/20":"text-black/20"}`}>
            <span>{fmtDateShort(plan.debut)}</span>
            <span>{fmtDateShort(plan.fin)}</span>
          </div>
        </div>

        {/* Jalons */}
        {plan.jalons.length>0 && (
          <div className="flex flex-wrap gap-1.5">
            {plan.jalons.map((j,i)=>(
              <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{background:"rgba(245,158,11,0.12)",color:"#f59e0b"}}>
                ◆ {j.titre} · {fmtDateShort(j.date)}
              </span>
            ))}
          </div>
        )}

        {/* Tâches */}
        {plan.taches.length>0 && (
          <div className={`rounded-xl border p-3 ${isDark?"border-white/6 bg-white/[0.02]":"border-black/6 bg-slate-50"}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark?"text-white/30":"text-black/30"}`}>
              {plan.taches.length} tâches générées
            </p>
            <div className="grid grid-cols-2 gap-1">
              {plan.taches.map((t,i)=>(
                <div key={i} className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{background:plan.color}}/>
                  <span className={`text-[10px] leading-relaxed ${isDark?"text-white/55":"text-black/55"}`}>{t.titre}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{scale:0.96,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.96,opacity:0}}
        className={`flex flex-col max-h-[90vh] w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${modalBg}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divCls} shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{background:"rgba(59,130,246,0.15)"}}>
              <BarChart3 size={14} className="text-blue-400"/>
            </div>
            <div>
              <h2 className={`text-sm font-black ${titleCls}`}>Planification Gantt IA</h2>
              <p className={`text-[10px] ${isDark?"text-white/35":"text-black/35"}`}>
                {step==="form"?"Décrivez votre projet":step==="loading"?"Génération du plan…":"Plan généré — prêt à créer"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition ${isDark?"text-white/40 hover:bg-white/8 hover:text-white":"text-black/40 hover:bg-black/5 hover:text-[#0e1420]"}`}>
            <X size={16}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Form */}
          {step==="form" && (
            <div className="p-6 space-y-4">
              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">{error}</div>}
              <div>
                <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Nom du projet (optionnel)</label>
                <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex : Refonte site e-commerce"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
              </div>
              <div>
                <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Description du projet *</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4}
                  placeholder="Décrivez votre projet : objectifs, livrables, équipe, contraintes techniques…"
                  className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Date de début</label>
                  <input type="date" value={debut} onChange={e=>setDebut(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputCls} ${isDark?"[color-scheme:dark]":"[color-scheme:light]"}`}/>
                </div>
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Délai souhaité</label>
                  <input value={delai} onChange={e=>setDelai(e.target.value)} placeholder="Ex : 3 mois"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputCls}`}/>
                </div>
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] ${labelCls}`}>Budget (optionnel)</label>
                  <input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Ex : 20 000 €"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputCls}`}/>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {step==="loading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{background:"rgba(59,130,246,0.12)"}}>
                  <BarChart3 size={28} className="text-blue-400 animate-pulse"/>
                </div>
                <Loader2 size={14} className="animate-spin absolute -bottom-1 -right-1 text-blue-400"/>
              </div>
              <div className="text-center">
                <p className={`font-bold ${isDark?"text-white":"text-[#0e1420]"}`}>L&apos;IA planifie votre projet</p>
                <p className={`text-sm mt-1 ${isDark?"text-white/40":"text-black/40"}`}>Génération des phases, jalons et tâches…</p>
              </div>
            </div>
          )}

          {/* Result */}
          {step==="result" && plan && (
            <div className="p-6">{miniGantt()}</div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${divCls} shrink-0 flex gap-2`}>
          {step==="form" && (
            <>
              <button onClick={onClose}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${isDark?"border-white/8 bg-white/6 text-white/50 hover:bg-white/10":"border-black/8 bg-black/4 text-black/40 hover:bg-black/8"}`}>
                Annuler
              </button>
              <button onClick={()=>void generate()} disabled={!desc.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50 shadow-lg"
                style={{background:"#3b82f6"}}>
                <Sparkles size={14}/>Générer le plan Gantt
              </button>
            </>
          )}
          {step==="result" && plan && (
            <>
              <button onClick={()=>{setPlan(null);setStep("form");setError(null);}}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${isDark?"border-white/8 bg-white/6 text-white/50 hover:bg-white/10":"border-black/8 bg-black/4 text-black/40 hover:bg-black/8"}`}>
                Recommencer
              </button>
              <button onClick={()=>void createProject()} disabled={creating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50 shadow-lg"
                style={{background:"#3b82f6"}}>
                {creating ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
                {creating ? "Création en cours…" : `Créer le projet (${plan.taches.length} tâches · ${plan.jalons.length} jalons)`}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main ── */
export default function ProjetsPage() {
  const router = useRouter();
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const { isDark } = useTheme();

  const [projects,     setProjects]     = useState<Project[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<Status|"tous">("tous");
  const [showModal,    setShowModal]    = useState(false);
  const [editProject,  setEditProject]  = useState<Project|null>(null);
  const [draft,        setDraft]        = useState<Draft>(emptyDraft());
  const [saving,       setSaving]       = useState(false);
  const [confirmDel,   setConfirmDel]   = useState<string|null>(null);

  const [tab,       setTab]       = useState<"projets"|"gantt"|"dossiers">("projets");
  const [detailProj, setDetailProj] = useState<Project|null>(null);
  const [detailTab,  setDetailTab]  = useState<"tasks"|"milestones"|"team">("tasks");

  const [projTasks,  setProjTasks]  = useState<ProjTask[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projTeam,   setProjTeam]   = useState<Record<string,string[]>>({});
  const [userId,     setUserId]     = useState<string | null>(null);
  const [creatingInv, setCreatingInv] = useState<string|null>(null);

  const [taskInput, setTaskInput]   = useState("");
  const [mileTitle, setMileTitle]   = useState("");
  const [mileDate,  setMileDate]    = useState("");
  const [teamInput, setTeamInput]   = useState("");

  // Cahier des charges
  const [showCdc,    setShowCdc]    = useState(false);
  const [cdcProject, setCdcProject] = useState<Project|null>(null);

  // Planification IA
  const [showPlan, setShowPlan] = useState(false);

  // Folders expanded state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(CATEGORIES));

  // Theme helpers
  const pageBg      = isDark ? "bg-[#07080e] text-white"    : "bg-[#f0f2fb] text-[#0e1420]";
  const textPrimary = isDark ? "text-white"    : "text-[#0e1420]";
  const textSec     = isDark ? "text-white/40" : "text-black/40";
  const textMuted   = isDark ? "text-white/30" : "text-black/30";
  const cardBase    = isDark ? "border-white/6 bg-white/[0.04]" : "border-black/8 bg-white shadow-sm";
  const divider     = isDark ? "border-white/5" : "border-black/5";
  const inputCls    = isDark
    ? "bg-white/[0.04] border-white/8 text-white placeholder:text-white/20 focus:border-sky-500/30 focus:bg-white/[0.06]"
    : "bg-white border-black/10 text-[#0e1420] placeholder:text-black/20 focus:border-violet-300";

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (process.env.NODE_ENV !== "development") { router.replace("/login"); return; } return; }
      setUserId(user.id);
      const [projRes, tasksRes, milesRes, teamRes] = await Promise.all([
        supabase.from("projects").select("*").eq("user_id", user.id).order("created_at",{ascending:false}).limit(500),
        supabase.from("project_tasks").select("*").eq("user_id", user.id),
        supabase.from("project_milestones").select("*").eq("user_id", user.id),
        supabase.from("project_team").select("*").eq("user_id", user.id),
      ]);
      if (projRes.error) { toast("Erreur réseau — impossible de charger les projets","error"); return; }
      setProjects((projRes.data??[]) as Project[]);
      setProjTasks((tasksRes.data??[]).map(r=>({id:r.id,projectId:r.project_id,title:r.title,done:r.done})));
      setMilestones((milesRes.data??[]).map(r=>({id:r.id,projectId:r.project_id,title:r.title,date:r.date??'',done:r.done})));
      const team: Record<string,string[]> = {};
      for (const r of (teamRes.data??[])) {
        if (!team[r.project_id]) team[r.project_id] = [];
        team[r.project_id].push(r.member_name);
      }
      setProjTeam(team);
    } catch { toast("Erreur réseau","error"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(()=>{ void load(); }, [load]);

  const filtered = useMemo(()=>
    filter==="tous" ? projects : projects.filter(p=>p.status===filter),
    [projects,filter]
  );

  const kpis = useMemo(()=>({
    enCours:  projects.filter(p=>p.status==="en_cours").length,
    terminé:  projects.filter(p=>p.status==="terminé").length,
    budget:   projects.reduce((s,p)=>s+p.budget,0),
    encaissé: projects.reduce((s,p)=>s+p.spent,0),
  }),[projects]);

  const ganttProjects = useMemo(()=>projects.filter(p=>p.start_date&&p.end_date),[projects]);

  const ganttRange = useMemo(()=>{
    if (ganttProjects.length===0) return null;
    let minD = new Date(ganttProjects[0].start_date!);
    let maxD = new Date(ganttProjects[0].end_date!);
    for (const p of ganttProjects) {
      const s=new Date(p.start_date!), e=new Date(p.end_date!);
      if (s<minD) minD=s; if (e>maxD) maxD=e;
    }
    const start = new Date(minD.getFullYear(),minD.getMonth(),1);
    const end   = new Date(maxD.getFullYear(),maxD.getMonth()+1,0);
    const totalDays = Math.max(1,Math.ceil((end.getTime()-start.getTime())/86400000)+1);
    return { start, end, totalDays };
  },[ganttProjects]);

  function openNew()  { setEditProject(null); setDraft(emptyDraft()); setShowModal(true); }
  function openEdit(p:Project) {
    setEditProject(p);
    setDraft({title:p.title,client:p.client,status:p.status,category:p.category,
      start_date:p.start_date??"",end_date:p.end_date??"",
      budget:p.budget,spent:p.spent,description:p.description,color:p.color});
    setShowModal(true);
  }
  function openCdc(p?:Project) {
    setCdcProject(p||null);
    setShowCdc(true);
  }
  function handlePlanCreated(p:Project, tasks:ProjTask[], miles:Milestone[]) {
    setProjects(prev=>[p,...prev]);
    setProjTasks(prev=>[...tasks,...prev]);
    setMilestones(prev=>[...miles,...prev]);
    toast(`Projet "${p.title}" créé avec ${tasks.length} tâches et ${miles.length} jalons`,"success");
    setTab("gantt");
  }
  function toggleFolder(cat:string) {
    setExpandedFolders(prev=>{
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  async function saveProject() {
    if (!draft.title?.trim()) { toast("Le titre est requis.","error"); return; }
    setSaving(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { setSaving(false); toast("Session expirée.","error"); return; }
    const payload = {
      title:draft.title.trim(), client:draft.client?.trim()??"", status:draft.status??"en_cours",
      category:draft.category??"Autre", start_date:draft.start_date||null, end_date:draft.end_date||null,
      budget:draft.budget??0, spent:draft.spent??0, description:draft.description??"",
      color:draft.color??VIOLET, updated_at:new Date().toISOString(),
    };
    if (editProject) {
      const {data,error} = await supabase.from("projects").update(payload).eq("id",editProject.id).select().single();
      if (error) { toast("Erreur mise à jour.","error"); setSaving(false); return; }
      if (data) setProjects(p=>p.map(x=>x.id===editProject.id?data as Project:x));
      toast("Projet mis à jour","success");
    } else {
      const {data,error} = await supabase.from("projects").insert({...payload,user_id:user.id}).select().single();
      if (error) { toast("Erreur création.","error"); setSaving(false); return; }
      if (data) setProjects(p=>[data as Project,...p]);
      toast("Projet créé","success");
    }
    setSaving(false); setShowModal(false);
  }

  async function deleteProject(id:string) {
    const {error} = await supabase.from("projects").delete().eq("id",id);
    if (error) { toast("Erreur suppression.","error"); return; }
    setProjects(p=>p.filter(x=>x.id!==id));
    if (detailProj?.id===id) setDetailProj(null);
    setConfirmDel(null); toast("Projet supprimé","success");
  }

  async function addTask(projectId:string) {
    if (!taskInput.trim() || !userId) return;
    const title = taskInput.trim(); setTaskInput("");
    const {data,error} = await supabase.from("project_tasks").insert({user_id:userId,project_id:projectId,title,done:false}).select().single();
    if (error) { toast("Erreur ajout tâche","error"); return; }
    setProjTasks(prev=>[{id:data.id,projectId,title:data.title,done:false},...prev]);
  }
  async function toggleTask(id:string) {
    const task = projTasks.find(t=>t.id===id); if (!task) return;
    const done = !task.done;
    setProjTasks(prev=>prev.map(t=>t.id===id?{...t,done}:t));
    await supabase.from("project_tasks").update({done}).eq("id",id);
  }
  async function deleteTask(id:string) {
    setProjTasks(prev=>prev.filter(t=>t.id!==id));
    await supabase.from("project_tasks").delete().eq("id",id);
  }

  async function addMilestone(projectId:string) {
    if (!mileTitle.trim() || !userId) return;
    const title = mileTitle.trim(); const date = mileDate || null;
    setMileTitle(""); setMileDate("");
    const {data,error} = await supabase.from("project_milestones").insert({user_id:userId,project_id:projectId,title,date,done:false}).select().single();
    if (error) { toast("Erreur ajout jalon","error"); return; }
    setMilestones(prev=>[{id:data.id,projectId,title:data.title,date:data.date??'',done:false},...prev]);
  }
  async function toggleMilestone(id:string) {
    const m = milestones.find(x=>x.id===id); if (!m) return;
    const done = !m.done;
    setMilestones(prev=>prev.map(x=>x.id===id?{...x,done}:x));
    await supabase.from("project_milestones").update({done}).eq("id",id);
  }
  async function deleteMilestone(id:string) {
    setMilestones(prev=>prev.filter(m=>m.id!==id));
    await supabase.from("project_milestones").delete().eq("id",id);
  }

  async function addTeamMember(projectId:string) {
    if (!teamInput.trim() || !userId) return;
    const member_name = teamInput.trim();
    if ((projTeam[projectId]??[]).includes(member_name)) { setTeamInput(""); return; }
    setTeamInput("");
    const {error} = await supabase.from("project_team").insert({user_id:userId,project_id:projectId,member_name});
    if (error) { toast("Erreur ajout membre","error"); return; }
    setProjTeam(prev=>({...prev,[projectId]:[...(prev[projectId]??[]),member_name]}));
  }
  async function removeTeamMember(projectId:string, name:string) {
    setProjTeam(prev=>({...prev,[projectId]:(prev[projectId]??[]).filter(n=>n!==name)}));
    await supabase.from("project_team").delete().eq("project_id",projectId).eq("member_name",name);
  }

  async function handleCreateProjectInvoice(project: Project) {
    if (creatingInv) return;
    setCreatingInv(project.id);
    try {
      const uid = userId;
      if (!uid) { toast("Non connecté.","error"); return; }
      const amount = project.budget > 0 ? project.budget : 0;
      const tva20  = Math.round(amount * 0.2 * 100) / 100;
      const year   = new Date().getFullYear();
      const numero = `FAC-${year}-P${Date.now().toString().slice(-5)}`;
      const today  = new Date().toISOString().slice(0, 10);
      const { data: doc, error: docErr } = await supabase.from("documents").insert({
        user_id: uid, type: "facture", numero, statut: "brouillon",
        sujet: `Projet — ${project.title}`, client_nom: project.client || "",
        client_societe: "", date_document: today, devise: "EUR",
        total_ht: amount, total_tva: tva20, total_ttc: Math.round((amount + tva20) * 100) / 100,
        emetteur_nom: "", emetteur_email: "", emetteur_adresse: "", emetteur_ville: "",
        emetteur_code_postal: "", emetteur_pays: "", emetteur_siret: "", emetteur_tva: "",
        emetteur_logo: "", rib_titulaire: "", rib_iban: "", rib_bic: "", rib_banque: "",
        client_email: "", client_telephone: "", client_adresse: "", client_ville: "",
        client_code_postal: "", client_pays: "", client_tva: "",
        remise_pct: 0, acompte: 0, notes: "", conditions: "", mentions_legales: "",
        couleur: "#c9a55a", template: "modern",
      }).select("id").single();
      if (docErr || !doc) { toast(docErr?.message ?? "Erreur création","error"); return; }
      await supabase.from("document_items").insert({
        document_id: doc.id, position: 0,
        description: project.title + (project.description ? `\n${project.description}` : ""),
        unit: "forfait", quantity: 1, unit_price: amount, vat_rate: 20, remise_pct: 0,
      });
      toast(`Facture ${numero} créée — redirection…`,"success");
      setTimeout(() => router.push("/client/factures"), 1200);
    } finally { setCreatingInv(null); }
  }

  /* ── Dossiers render ── */
  function renderDossiers() {
    if (projects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Folder size={32} className={isDark ? "text-white/15" : "text-black/15"}/>
          <p className={`font-bold ${isDark ? "text-white/40" : "text-black/40"}`}>Aucun projet pour le moment</p>
          <p className={`text-sm ${isDark ? "text-white/25" : "text-black/25"}`}>Créez votre premier projet pour l&apos;organiser en dossiers</p>
          <button onClick={openNew}
            className={`mt-2 rounded-2xl border px-6 py-2.5 text-sm font-bold transition ${isDark ? "border-white/10 bg-white/8 text-white hover:bg-white/12" : "border-black/10 bg-black/5 text-[#0e1420] hover:bg-black/8"}`}>
            Nouveau projet
          </button>
        </div>
      );
    }

    const usedCats = CATEGORIES.filter(c => projects.some(p => p.category === c));

    return (
      <div className="space-y-3 pb-6">
        {usedCats.map(cat => {
          const catProjects = projects.filter(p => p.category === cat);
          if (catProjects.length === 0) return null;
          const isOpen = expandedFolders.has(cat);
          const accentColor = catProjects[0]?.color || VIOLET;
          const doneCount = catProjects.filter(p => p.status === "terminé").length;

          return (
            <div key={cat} className={`rounded-2xl border overflow-hidden ${cardBase}`}>
              <button
                onClick={() => toggleFolder(cat)}
                className={`w-full flex items-center gap-3 px-5 py-4 transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50"}`}>
                {/* Folder icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{background:`${accentColor}18`}}>
                  <Folder size={16} style={{color:accentColor}}/>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`font-bold text-sm ${textPrimary}`}>{cat}</p>
                  <p className={`text-[10px] mt-0.5 ${textMuted}`}>
                    {catProjects.length} projet{catProjects.length>1?"s":""}{doneCount>0 ? ` · ${doneCount} terminé${doneCount>1?"s":""}` : ""}
                  </p>
                </div>
                {/* Mini color dots */}
                <div className="flex gap-1 mr-2">
                  {catProjects.slice(0,5).map(p=>(
                    <div key={p.id} className="w-2 h-2 rounded-full" style={{background:p.color}}/>
                  ))}
                </div>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${isDark?"text-white/30":"text-black/30"} ${isOpen?"rotate-180":""}`}/>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                    exit={{height:0,opacity:0}} transition={{duration:0.2}}>
                    <div className={`border-t ${divider}`}>
                      <div className="p-3 space-y-2">
                        {catProjects.map(p => {
                          const pTasks = projTasks.filter(t=>t.projectId===p.id);
                          const done   = pTasks.filter(t=>t.done).length;
                          return (
                            <div key={p.id}
                              onClick={()=>{setDetailProj(p);setDetailTab("tasks");}}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${isDark?"border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10":"border-black/5 bg-slate-50/60 hover:bg-white hover:border-black/10 hover:shadow-sm"}`}>
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:p.color}}/>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${textPrimary}`}>{p.title}</p>
                                {p.client && <p className={`text-[10px] truncate ${textMuted}`}>{p.client}</p>}
                              </div>
                              <StatusBadge status={p.status}/>
                              {pTasks.length>0 && (
                                <span className={`text-[10px] shrink-0 ${isDark?"text-white/30":"text-black/30"}`}>{done}/{pTasks.length}</span>
                              )}
                              <div className="flex gap-1 shrink-0" onClick={e=>e.stopPropagation()}>
                                <button onClick={()=>openCdc(p)} title="Cahier des charges"
                                  className="p-1 rounded-lg transition"
                                  style={{color:VIOLET}}>
                                  <BookOpen size={12}/>
                                </button>
                                <button onClick={()=>openEdit(p)} title="Modifier"
                                  className={`p-1 rounded-lg transition ${isDark?"text-white/30 hover:text-white":"text-black/30 hover:text-[#0e1420]"}`}>
                                  <Edit2 size={12}/>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── Gantt render ── */
  function renderGantt() {
    if (ganttProjects.length===0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-3xl border ${isDark ? "border-white/8 bg-white/[0.04]" : "border-black/8 bg-white shadow-sm"}`}>
            <BarChart3 size={28} className={isDark ? "text-white/20" : "text-black/20"}/>
          </div>
          <p className={`font-bold ${isDark ? "text-white/40" : "text-black/40"}`}>Aucun projet avec des dates</p>
          <p className={`text-sm ${isDark ? "text-white/25" : "text-black/25"}`}>Ajoutez des dates à vos projets — ou laissez l&apos;IA planifier pour vous</p>
          <button onClick={()=>setShowPlan(true)}
            className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            style={{background:"#3b82f6"}}>
            <Sparkles size={14}/>Planifier un projet avec l&apos;IA
          </button>
        </div>
      );
    }

    const range  = ganttRange!;
    const months = getMonths(range.start, range.end);
    // Button rendered before the Gantt table
    const today  = new Date();
    const todayOffset = Math.floor((today.getTime()-range.start.getTime())/86400000);
    const totalW = range.totalDays * PX_PER_DAY;
    const labelW = 180;

    return (
      <div className="space-y-4 pb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {projects.length>ganttProjects.length ? (
            <p className={`text-xs flex items-center gap-1.5 ${textMuted}`}>
              <AlertCircle size={12}/>
              {projects.length-ganttProjects.length} projet{projects.length-ganttProjects.length>1?"s":""} sans dates masqué{projects.length-ganttProjects.length>1?"s":""}
            </p>
          ) : <div/>}
          <button onClick={()=>setShowPlan(true)}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition hover:scale-[1.02]"
            style={{borderColor:"rgba(59,130,246,0.25)",background:"rgba(59,130,246,0.08)",color:"#3b82f6"}}>
            <Sparkles size={11}/>Nouveau projet avec l&apos;IA
          </button>
        </div>
        <div className={`overflow-x-auto rounded-2xl border ${isDark ? "border-white/8 bg-white/[0.02]" : "border-black/8 bg-white shadow-sm"}`}>
          <div style={{minWidth: labelW+totalW+32}}>
            <div className={`flex items-center border-b ${divider}`} style={{paddingLeft:labelW}}>
              {months.map((mo,i)=>(
                <div key={i} className={`shrink-0 border-r px-2 py-2.5 text-[10px] font-black uppercase tracking-widest ${divider} ${isDark ? "text-white/25" : "text-black/25"}`}
                  style={{width:mo.days*PX_PER_DAY}}>{mo.label}</div>
              ))}
            </div>
            {ganttProjects.map(p=>{
              const startOff = Math.max(0,Math.floor((new Date(p.start_date!).getTime()-range.start.getTime())/86400000));
              const durDays  = Math.max(1,Math.floor((new Date(p.end_date!).getTime()-new Date(p.start_date!).getTime())/86400000));
              const pMiles   = milestones.filter(m=>m.projectId===p.id&&m.date);
              const pTasks   = projTasks.filter(t=>t.projectId===p.id);
              const donePct  = pTasks.length>0 ? (pTasks.filter(t=>t.done).length/pTasks.length)*100 : 0;
              return (
                <div key={p.id} className={`group flex items-center border-b transition-colors cursor-pointer ${divider} ${isDark ? "hover:bg-white/[0.015]" : "hover:bg-slate-50"}`}
                  onClick={()=>{ setDetailProj(p); setDetailTab("tasks"); }}>
                  <div className="shrink-0 flex items-center gap-2 px-4 py-3" style={{width:labelW}}>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:p.color}}/>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isDark ? "text-white/80" : "text-[#0e1420]/80"}`}>{p.title}</p>
                      {p.client && <p className={`text-[10px] truncate ${textMuted}`}>{p.client}</p>}
                    </div>
                    <ChevronRight size={12} className={`ml-auto transition-colors shrink-0 ${isDark ? "text-white/15 group-hover:text-white/30" : "text-black/15 group-hover:text-black/30"}`}/>
                  </div>
                  <div className="relative flex-1 h-12" style={{width:totalW}}>
                    {todayOffset>=0 && todayOffset<=range.totalDays && (
                      <div className="absolute top-0 bottom-0 w-px z-10" style={{left:todayOffset*PX_PER_DAY,background:"rgba(251,191,36,0.4)"}}/>
                    )}
                    <div className="absolute top-1/2 -translate-y-1/2 rounded-full overflow-hidden"
                      style={{left:startOff*PX_PER_DAY, width:durDays*PX_PER_DAY, height:20, background:`${p.color}25`, border:`1px solid ${p.color}50`}}>
                      <div className="h-full rounded-full transition-all" style={{width:`${donePct}%`, background:`${p.color}60`}}/>
                    </div>
                    {pMiles.map(m=>{
                      const mOff = Math.floor((new Date(m.date).getTime()-range.start.getTime())/86400000);
                      if (mOff<0||mOff>range.totalDays) return null;
                      return (
                        <div key={m.id} className="absolute top-1/2 -translate-y-1/2 z-20 group/ms" style={{left:mOff*PX_PER_DAY-5}}>
                          <div className="w-3 h-3 rotate-45 border transition-all" style={{background:m.done?"#f59e0b20":"#f59e0b40",borderColor:m.done?"#f59e0b":"#f59e0b80"}}/>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover/ms:opacity-100 transition-opacity pointer-events-none z-30">
                            <div className={`rounded-lg border px-2 py-1 text-[10px] whitespace-nowrap shadow-md ${isDark ? "border-white/15 bg-[#1a2030] text-white/80" : "border-black/10 bg-white text-[#0e1420]/80"}`}>
                              {m.title}{m.date&&` · ${fmtDateShort(m.date)}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className={`flex items-center gap-3 px-4 py-2.5 border-t ${divider}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-px bg-yellow-400/40"/>
                <span className={`text-[10px] ${isDark ? "text-white/25" : "text-black/25"}`}>Aujourd&apos;hui</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2.5 rotate-45 border border-yellow-500/80"/>
                <span className={`text-[10px] ${isDark ? "text-white/25" : "text-black/25"}`}>Jalon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Detail panel ── */
  function renderDetailPanel() {
    if (!detailProj) return null;
    const p      = detailProj;
    const pTasks = projTasks.filter(t=>t.projectId===p.id);
    const pMiles = milestones.filter(m=>m.projectId===p.id);
    const pTeam  = projTeam[p.id] ?? [];
    const doneTasks = pTasks.filter(t=>t.done).length;
    const doneMiles = pMiles.filter(m=>m.done).length;
    const panelBg  = isDark ? "bg-[#0e1420] border-l border-white/8" : "bg-white border-l border-black/8";
    const rowBase  = isDark ? "border-white/6 bg-white/[0.025] hover:border-white/10" : "border-black/6 bg-slate-50 hover:border-black/10";
    const iconBtn  = isDark ? "text-white/40 hover:text-white hover:bg-white/8" : "text-black/40 hover:text-[#0e1420] hover:bg-black/5";
    const DTABS = [
      {k:"tasks",      l:"Tâches",    badge:pTasks.length },
      {k:"milestones", l:"Jalons",    badge:pMiles.length },
      {k:"team",       l:"Équipe",    badge:pTeam.length  },
    ] as const;

    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 z-40 flex items-stretch justify-end"
        onClick={e=>{if(e.target===e.currentTarget)setDetailProj(null);}}>
        <div className="flex-1" onClick={()=>setDetailProj(null)}/>
        <motion.div initial={{x:440}} animate={{x:0}} exit={{x:440}} transition={{type:"spring",stiffness:320,damping:32}}
          className={`flex flex-col h-full shadow-2xl ${panelBg}`}
          style={{width:"min(440px,100vw)"}}
          onClick={e=>e.stopPropagation()}>
          <div className={`px-6 pt-6 pb-4 border-b shrink-0 ${divider}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{background:p.color}}/>
                <div className="min-w-0">
                  <h2 className={`font-black truncate ${textPrimary}`}>{p.title}</h2>
                  {p.client && <p className={`text-xs truncate ${textSec}`}>{p.client}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={()=>openCdc(p)} title="Cahier des charges IA"
                  className="p-1.5 rounded-lg transition" style={{color:VIOLET}}>
                  <BookOpen size={14}/>
                </button>
                <button onClick={()=>{ openEdit(p); setDetailProj(null); }}
                  className={`p-1.5 rounded-lg transition-all ${iconBtn}`}><Edit2 size={14}/></button>
                <button onClick={()=>setDetailProj(null)}
                  className={`p-1.5 rounded-lg transition-all ${iconBtn}`}><X size={14}/></button>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={p.status}/>
              {pTasks.length>0 && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{background:"rgba(16,185,129,0.12)",color:"#10b981"}}>
                  {doneTasks}/{pTasks.length} tâches
                </span>
              )}
              {pMiles.length>0 && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{background:"rgba(245,158,11,0.12)",color:"#f59e0b"}}>
                  {doneMiles}/{pMiles.length} jalons
                </span>
              )}
              <button onClick={()=>router.push("/client/chrono")}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-semibold ml-auto transition-all hover:opacity-80"
                style={{background:`${SKY}18`,color:SKY}}>
                <Timer size={10}/>Chrono
              </button>
            </div>
          </div>
          <div className="flex gap-1 px-4 pt-4 pb-0 shrink-0">
            {DTABS.map(({k,l,badge})=>(
              <button key={k} onClick={()=>setDetailTab(k as typeof detailTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={detailTab===k
                  ?{background:`${VIOLET}25`,color:VIOLET,border:`1px solid ${VIOLET}40`}
                  :{background:"transparent",color:isDark?"rgba(255,255,255,0.35)":"rgba(0,0,0,0.35)",border:"1px solid transparent"}}>
                {l}
                {badge>0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{background:detailTab===k?`${VIOLET}40`:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)"}}>{badge}</span>}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {detailTab==="tasks" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input value={taskInput} onChange={e=>setTaskInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")addTask(p.id);}}
                    placeholder="Nouvelle tâche…"
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition-all ${inputCls}`}/>
                  <button onClick={()=>addTask(p.id)} className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{background:`${SKY}20`,border:`1px solid ${SKY}30`,color:SKY}}><Plus size={14}/></button>
                </div>
                {pTasks.length===0 ? (
                  <p className={`text-sm py-6 text-center ${isDark?"text-white/25":"text-black/25"}`}>Aucune tâche — ajoutez-en ci-dessus</p>
                ) : (
                  <div className="space-y-1.5">
                    {pTasks.map(t=>(
                      <div key={t.id} className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${rowBase}`}>
                        <button onClick={()=>toggleTask(t.id)} className="shrink-0 transition-all hover:scale-110">
                          {t.done ? <CheckCircle2 size={16} className="text-emerald-400"/> : <Circle size={16} className={isDark?"text-white/20":"text-black/20"}/>}
                        </button>
                        <span className={`flex-1 text-sm transition-all ${t.done?(isDark?"line-through text-white/25":"line-through text-black/25"):(isDark?"text-white/80":"text-[#0e1420]/80")}`}>{t.title}</span>
                        <button onClick={()=>deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={11}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {detailTab==="milestones" && (
              <div className="space-y-3">
                <div className={`space-y-2 rounded-xl border p-3 ${isDark?"border-white/8 bg-white/[0.02]":"border-black/8 bg-slate-50"}`}>
                  <input value={mileTitle} onChange={e=>setMileTitle(e.target.value)} placeholder="Titre du jalon…"
                    className={`w-full bg-transparent border-b pb-2 text-sm outline-none transition-all ${isDark?"border-white/8 text-white placeholder:text-white/20 focus:border-white/20":"border-black/8 text-[#0e1420] placeholder:text-black/20 focus:border-violet-300"}`}/>
                  <div className="flex gap-2 items-center">
                    <input type="date" value={mileDate} onChange={e=>setMileDate(e.target.value)}
                      className={`flex-1 rounded-xl border px-3 py-1.5 text-sm outline-none transition-all ${isDark?"bg-white/[0.04] border-white/8 text-white [color-scheme:dark]":"bg-white border-black/10 text-[#0e1420] [color-scheme:light]"}`}/>
                    <button onClick={()=>addMilestone(p.id)} disabled={!mileTitle.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                      style={{background:`${GOLD}20`,border:`1px solid ${GOLD}30`,color:GOLD}}>
                      <Plus size={12}/>Ajouter
                    </button>
                  </div>
                </div>
                {pMiles.length===0 ? (
                  <p className={`text-sm py-6 text-center ${isDark?"text-white/25":"text-black/25"}`}>Aucun jalon défini</p>
                ) : (
                  <div className="space-y-1.5">
                    {pMiles.sort((a,b)=>a.date.localeCompare(b.date)).map(m=>(
                      <div key={m.id} className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${rowBase}`}>
                        <button onClick={()=>toggleMilestone(m.id)} className="shrink-0 transition-all hover:scale-110">
                          {m.done ? <Flag size={15} className="text-yellow-400"/> : <Flag size={15} className={isDark?"text-white/20":"text-black/20"}/>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${m.done?(isDark?"line-through text-white/25":"line-through text-black/25"):(isDark?"text-white/80":"text-[#0e1420]/80")}`}>{m.title}</p>
                          {m.date && <p className={`text-[10px] flex items-center gap-1 ${isDark?"text-white/30":"text-black/30"}`}><Calendar size={9}/>{fmtDateShort(m.date)}</p>}
                        </div>
                        <button onClick={()=>deleteMilestone(m.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={11}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {detailTab==="team" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input value={teamInput} onChange={e=>setTeamInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")addTeamMember(p.id);}}
                    placeholder="Nom du membre…"
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition-all ${inputCls}`}/>
                  <button onClick={()=>addTeamMember(p.id)} className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{background:`${SKY}20`,border:`1px solid ${SKY}30`,color:SKY}}><Plus size={14}/></button>
                </div>
                {pTeam.length===0 ? (
                  <p className={`text-sm py-6 text-center ${isDark?"text-white/25":"text-black/25"}`}>Aucun membre assigné</p>
                ) : (
                  <div className="space-y-1.5">
                    {pTeam.map(name=>(
                      <div key={name} className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${rowBase}`}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                          style={{background:`${p.color}30`,color:p.color}}>{name.charAt(0).toUpperCase()}</div>
                        <span className={`flex-1 text-sm font-medium ${isDark?"text-white/75":"text-[#0e1420]/75"}`}>{name}</span>
                        <button onClick={()=>removeTeamMember(p.id,name)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"><X size={11}/></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className={`mt-4 pt-4 border-t ${divider}`}>
                  <button onClick={()=>router.push("/client/equipe")}
                    className={`flex items-center gap-2 text-xs transition-all ${isDark?"text-white/30 hover:text-white/60":"text-black/30 hover:text-black/60"}`}>
                    <Users size={11}/>Gérer l&apos;équipe complète →
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={`px-4 pb-5 pt-3 border-t shrink-0 flex gap-2 ${divider}`}>
            <button onClick={()=>{ openEdit(p); setDetailProj(null); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition ${isDark?"border-white/8 bg-white/8 text-white/60 hover:bg-white/12 hover:text-white":"border-black/8 bg-black/5 text-black/50 hover:bg-black/8 hover:text-[#0e1420]"}`}>
              <Edit2 size={13}/>Modifier le projet
            </button>
            <button onClick={()=>router.push("/client/chrono")}
              className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              style={{background:`${SKY}18`,border:`1px solid ${SKY}30`,color:SKY}}>
              <Timer size={13}/>Chrono
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${isDark ? "bg-[#07080e]" : "bg-[#f0f2fb]"}`}>
        <Loader2 size={28} className="animate-spin text-violet-400"/>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${pageBg}`}>
      <div className="space-y-6 px-4 py-6 lg:px-8">
        <ToastStack toasts={toasts} remove={removeToast}/>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className={`mb-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] ${textMuted}`}>Gestion</p>
            <h1 className={`text-2xl font-black ${textPrimary}`}>Projets</h1>
            <p className={`text-sm ${textSec}`}>{projects.length} projet{projects.length!==1?"s":""}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>openCdc()}
              className="flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition hover:scale-[1.02] active:scale-[0.98]"
              style={{borderColor:`${VIOLET}30`,background:`${VIOLET}10`,color:VIOLET}}>
              <Sparkles size={14}/>Cahier des charges IA
            </button>
            <button onClick={openNew}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black shadow-lg transition hover:scale-[1.02] active:scale-[0.98] ${
                isDark ? "bg-white text-[#07080e] shadow-white/10 hover:shadow-white/20"
                       : "bg-[#0e1420] text-white shadow-[#0e1420]/15 hover:shadow-[#0e1420]/25"
              }`}>
              <Plus size={16}/>Nouveau projet
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {label:"En cours", value:String(kpis.enCours), color:"#3b82f6", sub:"projets actifs"  },
            {label:"Terminés", value:String(kpis.terminé),  color:"#10b981", sub:"projets terminés"},
            {label:"Budget",   value:fmtEur(kpis.budget),   color:GOLD,      sub:"budget total"   },
            {label:"Encaissé", value:fmtEur(kpis.encaissé), color:VIOLET,    sub:"revenus encaissés"},
          ].map(k=>(
            <div key={k.label} className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm ${cardBase}`}>
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl" style={{background:k.color}}/>
              <p className={`text-[0.65rem] font-bold uppercase tracking-[0.18em] ${textMuted}`}>{k.label}</p>
              <p className="mt-1 text-2xl font-black" style={{color:k.color}}>{k.value}</p>
              <p className={`text-[0.65rem] ${isDark ? "text-white/25" : "text-black/25"}`}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs + filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className={`flex gap-1 rounded-2xl border p-1 ${isDark ? "border-white/8 bg-white/[0.03]" : "border-black/8 bg-white shadow-sm"}`}>
            {([["projets","Liste"],["dossiers","Dossiers"],["gantt","Gantt"]] as const).map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold transition-all"
                style={tab===k
                  ?{background:VIOLET,color:"#fff",boxShadow:`0 2px 12px ${VIOLET}40`}
                  :{color:isDark?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.4)"}}>
                {k==="gantt" && <BarChart3 size={12}/>}
                {k==="dossiers" && <Folder size={12}/>}
                {l}
              </button>
            ))}
          </div>

          {tab==="projets" && (
            <div className="flex flex-wrap gap-2">
              {([["tous","Tous"],["en_cours","En cours"],["en_attente","En attente"],["terminé","Terminés"],["annulé","Annulés"]] as [Status|"tous",string][]).map(([s,l])=>(
                <button key={s} onClick={()=>setFilter(s)}
                  className="rounded-xl border px-4 py-1.5 text-xs font-semibold transition"
                  style={filter===s
                    ?{background:VIOLET,borderColor:VIOLET,color:"#fff"}
                    :isDark
                      ?{borderColor:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.04)"}
                      :{borderColor:"rgba(0,0,0,0.08)",color:"rgba(0,0,0,0.4)",background:"rgba(0,0,0,0.03)"}}>
                  {l}{s!=="tous" && <span className="ml-1.5 opacity-60">{projects.filter(p=>p.status===s).length}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {tab==="gantt" ? renderGantt()
        : tab==="dossiers" ? renderDossiers()
        : filtered.length===0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-3xl border ${isDark ? "border-white/8 bg-white/[0.04]" : "border-black/8 bg-white shadow-sm"}`}>
              <FolderOpen size={28} className={isDark ? "text-white/20" : "text-black/20"}/>
            </div>
            <p className={`font-bold ${isDark ? "text-white/50" : "text-black/50"}`}>
              {filter==="tous" ? "Aucun projet pour le moment" : `Aucun projet « ${STATUS_CONFIG[filter as Status]?.label??filter} »`}
            </p>
            <p className={`text-sm ${isDark ? "text-white/25" : "text-black/25"}`}>
              {filter==="tous" ? "Créez votre premier projet" : "Essayez un autre filtre"}
            </p>
            {filter==="tous" && (
              <button onClick={openNew}
                className={`mt-2 rounded-2xl border px-6 py-2.5 text-sm font-bold transition ${isDark ? "border-white/10 bg-white/8 text-white hover:bg-white/12" : "border-black/10 bg-black/5 text-[#0e1420] hover:bg-black/8"}`}>
                Créer mon premier projet
              </button>
            )}
          </div>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map(p=>(
                <ProjectCard key={p.id} project={p} isDark={isDark}
                  onEdit={openEdit}
                  onDelete={id=>setConfirmDel(id)}
                  onOpen={proj=>{setDetailProj(proj);setDetailTab("tasks");}}
                  onChrono={()=>router.push("/client/chrono")}
                  onInvoice={()=>{ void handleCreateProjectInvoice(p); }}
                  onCdc={()=>openCdc(p)}
                  creatingInv={creatingInv}
                  tasks={projTasks.filter(t=>t.projectId===p.id)}
                  miles={milestones.filter(m=>m.projectId===p.id)}
                  team={projTeam[p.id]??[]}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showModal && (
            <ProjectModal draft={draft} setDraft={setDraft} onSave={saveProject}
              onClose={()=>setShowModal(false)} saving={saving} isEdit={!!editProject} isDark={isDark}/>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCdc && (
            <CahierDesChargesModal
              onClose={()=>{ setShowCdc(false); setCdcProject(null); }}
              isDark={isDark}
              initialName={cdcProject?.title}
              initialDesc={cdcProject?.description}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPlan && (
            <GanttPlanModal
              onClose={()=>setShowPlan(false)}
              isDark={isDark}
              onCreated={handlePlanCreated}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmDel && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
              <motion.div initial={{scale:0.96}} animate={{scale:1}} exit={{scale:0.96}}
                className={`w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white"}`}>
                <AlertCircle size={36} className="mx-auto mb-3 text-red-400"/>
                <h3 className={`mb-1 text-lg font-bold ${textPrimary}`}>Supprimer ce projet ?</h3>
                <p className={`mb-6 text-sm ${textSec}`}>Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={()=>setConfirmDel(null)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${isDark?"border-white/8 bg-white/8 text-white/50 hover:bg-white/12":"border-black/8 bg-black/5 text-black/40 hover:bg-black/8"}`}>
                    Annuler
                  </button>
                  <button onClick={()=>void deleteProject(confirmDel)}
                    className="flex-1 rounded-xl bg-red-500/15 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/25">
                    Supprimer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{detailProj && renderDetailPanel()}</AnimatePresence>
      </div>
    </div>
  );
}
