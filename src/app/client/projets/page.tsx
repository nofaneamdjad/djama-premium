"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Plus, X, Loader2, Trash2,
  Calendar, Tag, Clock, CheckCircle2, PauseCircle,
  XCircle, AlertCircle, Edit2, BarChart3, Flag,
  Users, Timer, Check, ChevronRight, Circle, FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

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

/* ── Sub-components ── */

function StatusBadge({ status }: { status:Status }) {
  const { label, color, bg, Icon } = STATUS_CONFIG[status];
  return (
    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{color, background:bg}}>
      <Icon size={11}/>{label}
    </span>
  );
}

function ProjectCard({
  project, onEdit, onDelete, onOpen, onChrono, onInvoice, creatingInv, tasks, miles, team,
}: {
  project:Project; onEdit:(p:Project)=>void; onDelete:(id:string)=>void;
  onOpen:(p:Project)=>void; onChrono:()=>void; onInvoice:()=>void; creatingInv:string|null;
  tasks:ProjTask[]; miles:Milestone[]; team:string[];
}) {
  const budgetPct  = project.budget>0 ? Math.min(100,Math.round((project.spent/project.budget)*100)) : 0;
  const overBudget = project.budget>0 && project.spent>project.budget;
  const doneTasks  = tasks.filter(t=>t.done).length;
  const doneMiles  = miles.filter(m=>m.done).length;

  return (
    <motion.div layout initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.97}}
      onClick={()=>onOpen(project)}
      className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-white/[0.04] p-5 backdrop-blur-sm transition-all hover:border-white/12 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/30 cursor-pointer">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{background:project.color}}/>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-white">{project.title}</h3>
            {project.client && <p className="truncate text-xs text-white/40">{project.client}</p>}
          </div>
        </div>
        <StatusBadge status={project.status}/>
      </div>

      {/* Meta dates + category */}
      <div className="flex flex-wrap gap-2 text-xs text-white/35">
        {project.category!=="Autre" && <span className="flex items-center gap-1"><Tag size={10}/>{project.category}</span>}
        {(project.start_date||project.end_date) && (
          <span className="flex items-center gap-1"><Calendar size={10}/>{fmtDate(project.start_date)} → {fmtDate(project.end_date)}</span>
        )}
      </div>

      {/* Budget bar */}
      {project.budget>0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/35">Budget</span>
            <span className={overBudget?"font-bold text-red-400":"text-white/60"}>{fmtEur(project.spent)} / {fmtEur(project.budget)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8">
            <div className="h-full rounded-full transition-all" style={{width:`${budgetPct}%`,background:overBudget?"#ef4444":project.color}}/>
          </div>
        </div>
      )}

      {/* Task progress */}
      {tasks.length>0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/8">
            <div className="h-full rounded-full transition-all" style={{width:`${(doneTasks/tasks.length)*100}%`,background:"#10b981"}}/>
          </div>
          <span className="text-[10px] text-white/30 shrink-0">{doneTasks}/{tasks.length} tâches</span>
        </div>
      )}

      {/* Team + milestones row */}
      {(team.length>0||miles.length>0) && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {team.length>0 && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Users size={11} className="text-white/25 shrink-0"/>
              <div className="flex gap-1 flex-wrap min-w-0">
                {team.slice(0,3).map(n=>(
                  <span key={n} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/40 truncate max-w-[72px]">{n}</span>
                ))}
                {team.length>3 && <span className="text-[10px] text-white/25">+{team.length-3}</span>}
              </div>
            </div>
          )}
          {miles.length>0 && (
            <span className="flex items-center gap-1 text-[10px] text-white/30 ml-auto shrink-0">
              <Flag size={10}/>{doneMiles}/{miles.length} jalons
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {project.description && <p className="line-clamp-2 text-xs text-white/30">{project.description}</p>}

      {/* Actions */}
      <div className="flex gap-2 pt-1" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>onEdit(project)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/8 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/12 hover:text-white">
          <Edit2 size={11}/> Modifier
        </button>
        {project.budget > 0 && (
          <button onClick={onInvoice} disabled={!!creatingInv}
            title="Créer une facture depuis ce projet"
            className="flex items-center justify-center gap-1 rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-3 py-1.5 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.15)] disabled:opacity-40">
            {creatingInv===project.id ? <Loader2 size={11} className="animate-spin"/> : <FileText size={11}/>}
          </button>
        )}
        <button onClick={onChrono}
          title="Voir dans Chrono"
          className="flex items-center justify-center gap-1 rounded-xl border border-white/8 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/40 transition hover:bg-white/12 hover:text-white">
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

/* ── Modal ── */
function ProjectModal({
  draft, setDraft, onSave, onClose, saving, isEdit,
}: {
  draft:Draft; setDraft:React.Dispatch<React.SetStateAction<Draft>>;
  onSave:()=>void; onClose:()=>void; saving:boolean; isEdit:boolean;
}) {
  function field(key:keyof Draft, value:string|number) { setDraft(d=>({...d,[key]:value})); }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <motion.div initial={{scale:0.96,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.96,opacity:0}}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/8 bg-[#0e1420] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{isEdit?"Modifier le projet":"Nouveau projet"}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-white/40 transition hover:bg-white/8 hover:text-white"><X size={18}/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Titre *</label>
            <input value={draft.title??""} onChange={e=>field("title",e.target.value)}
              placeholder="Ex : Site e-commerce Boutique X"
              className="w-full rounded-xl border border-white/8 bg-white/6 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-white/20 focus:bg-white/8"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Client</label>
              <input value={draft.client??""} onChange={e=>field("client",e.target.value)} placeholder="Nom du client"
                className="w-full rounded-xl border border-white/8 bg-white/6 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-white/20 focus:bg-white/8"/>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Catégorie</label>
              <select value={draft.category??"Autre"} onChange={e=>field("category",e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-[#0e1420] px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/20">
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Statut</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as Status[]).map(s=>{
                const {label,color,bg} = STATUS_CONFIG[s];
                const active = draft.status===s;
                return (
                  <button key={s} onClick={()=>field("status",s)}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                    style={active
                      ?{color,background:bg,borderColor:color+"40"}
                      :{color:"rgba(255,255,255,0.4)",borderColor:"rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)"}}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Date début</label>
              <input type="date" value={draft.start_date??""} onChange={e=>field("start_date",e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-white/6 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/8 [color-scheme:dark]"/>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Date fin</label>
              <input type="date" value={draft.end_date??""} onChange={e=>field("end_date",e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-white/6 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/8 [color-scheme:dark]"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Budget (€)</label>
              <input type="number" min="0" value={draft.budget??0} onChange={e=>field("budget",parseFloat(e.target.value)||0)}
                className="w-full rounded-xl border border-white/8 bg-white/6 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/8"/>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Encaissé (€)</label>
              <input type="number" min="0" value={draft.spent??0} onChange={e=>field("spent",parseFloat(e.target.value)||0)}
                className="w-full rounded-xl border border-white/8 bg-white/6 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/8"/>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Couleur</label>
            <div className="flex gap-2">
              {COLORS.map(c=>(
                <button key={c} onClick={()=>field("color",c)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{background:c,outline:draft.color===c?`3px solid ${c}`:"none",outlineOffset:"2px"}}/>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">Description</label>
            <textarea value={draft.description??""} onChange={e=>field("description",e.target.value)}
              placeholder="Contexte, livrables, notes..." rows={3}
              className="w-full resize-none rounded-xl border border-white/8 bg-white/6 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-white/20 focus:bg-white/8"/>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-white/8 bg-white/8 py-2.5 text-sm font-semibold text-white/50 transition hover:bg-white/12 hover:text-white/70">
            Annuler
          </button>
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

/* ── Main ── */
export default function ProjetsPage() {
  const router = useRouter();
  const { toasts, add: toast, remove: removeToast } = useToastStack();

  // DB state
  const [projects,     setProjects]     = useState<Project[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<Status|"tous">("tous");
  const [showModal,    setShowModal]    = useState(false);
  const [editProject,  setEditProject]  = useState<Project|null>(null);
  const [draft,        setDraft]        = useState<Draft>(emptyDraft());
  const [saving,       setSaving]       = useState(false);
  const [confirmDel,   setConfirmDel]   = useState<string|null>(null);

  // View tabs
  const [tab,       setTab]       = useState<"projets"|"gantt">("projets");

  // Detail panel
  const [detailProj, setDetailProj] = useState<Project|null>(null);
  const [detailTab,  setDetailTab]  = useState<"tasks"|"milestones"|"team">("tasks");

  // Sub-data state
  const [projTasks,  setProjTasks]  = useState<ProjTask[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projTeam,   setProjTeam]   = useState<Record<string,string[]>>({});
  const [userId,     setUserId]     = useState<string | null>(null);
  const [creatingInv, setCreatingInv] = useState<string|null>(null);

  // Inputs
  const [taskInput, setTaskInput]     = useState("");
  const [mileTitle, setMileTitle]     = useState("");
  const [mileDate,  setMileDate]      = useState("");
  const [teamInput, setTeamInput]     = useState("");

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
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

  // Gantt data
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

  /* ── CRUD helpers ── */
  function openNew()  { setEditProject(null); setDraft(emptyDraft()); setShowModal(true); }
  function openEdit(p:Project) { setEditProject(p); setDraft({title:p.title,client:p.client,status:p.status,category:p.category,start_date:p.start_date??"",end_date:p.end_date??"",budget:p.budget,spent:p.spent,description:p.description,color:p.color}); setShowModal(true); }

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

  /* ── Task CRUD ── */
  async function addTask(projectId:string) {
    if (!taskInput.trim() || !userId) return;
    const title = taskInput.trim();
    setTaskInput("");
    const {data,error} = await supabase.from("project_tasks").insert({user_id:userId,project_id:projectId,title,done:false}).select().single();
    if (error) { toast("Erreur ajout tâche","error"); return; }
    setProjTasks(prev=>[{id:data.id,projectId,title:data.title,done:false},...prev]);
  }
  async function toggleTask(id:string) {
    const task = projTasks.find(t=>t.id===id);
    if (!task) return;
    const done = !task.done;
    setProjTasks(prev=>prev.map(t=>t.id===id?{...t,done}:t));
    await supabase.from("project_tasks").update({done}).eq("id",id);
  }
  async function deleteTask(id:string) {
    setProjTasks(prev=>prev.filter(t=>t.id!==id));
    await supabase.from("project_tasks").delete().eq("id",id);
  }

  /* ── Milestone CRUD ── */
  async function addMilestone(projectId:string) {
    if (!mileTitle.trim() || !userId) return;
    const title = mileTitle.trim();
    const date  = mileDate || null;
    setMileTitle(""); setMileDate("");
    const {data,error} = await supabase.from("project_milestones").insert({user_id:userId,project_id:projectId,title,date,done:false}).select().single();
    if (error) { toast("Erreur ajout jalon","error"); return; }
    setMilestones(prev=>[{id:data.id,projectId,title:data.title,date:data.date??'',done:false},...prev]);
  }
  async function toggleMilestone(id:string) {
    const m = milestones.find(x=>x.id===id);
    if (!m) return;
    const done = !m.done;
    setMilestones(prev=>prev.map(x=>x.id===id?{...x,done}:x));
    await supabase.from("project_milestones").update({done}).eq("id",id);
  }
  async function deleteMilestone(id:string) {
    setMilestones(prev=>prev.filter(m=>m.id!==id));
    await supabase.from("project_milestones").delete().eq("id",id);
  }

  /* ── Team CRUD ── */
  async function addTeamMember(projectId:string) {
    if (!teamInput.trim() || !userId) return;
    const member_name = teamInput.trim();
    const existing = projTeam[projectId]??[];
    if (existing.includes(member_name)) { setTeamInput(""); return; }
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
      const suffix = Date.now().toString().slice(-5);
      const numero = `FAC-${year}-P${suffix}`;
      const today  = new Date().toISOString().slice(0, 10);

      const { data: doc, error: docErr } = await supabase.from("documents").insert({
        user_id: uid,
        type: "facture",
        numero,
        statut: "brouillon",
        sujet: `Projet — ${project.title}`,
        client_nom: project.client || "",
        client_societe: "",
        date_document: today,
        devise: "EUR",
        total_ht: amount,
        total_tva: tva20,
        total_ttc: Math.round((amount + tva20) * 100) / 100,
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
        document_id: doc.id,
        position: 0,
        description: project.title + (project.description ? `\n${project.description}` : ""),
        unit: "forfait",
        quantity: 1,
        unit_price: amount,
        vat_rate: 20,
        remise_pct: 0,
      });

      toast(`Facture ${numero} créée — redirection…`,"success");
      setTimeout(() => router.push("/client/factures"), 1200);
    } finally {
      setCreatingInv(null);
    }
  }

  /* ── Gantt render ── */
  function renderGantt() {
    if (ganttProjects.length===0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <BarChart3 size={32} className="text-white/15"/>
          <p className="font-bold text-white/40">Aucun projet avec des dates</p>
          <p className="text-sm text-white/25">Ajoutez des dates de début et fin à vos projets pour les voir ici</p>
        </div>
      );
    }

    const range = ganttRange!;
    const months = getMonths(range.start, range.end);
    const today  = new Date();
    const todayOffset = Math.floor((today.getTime()-range.start.getTime())/86400000);
    const totalW = range.totalDays * PX_PER_DAY;
    const labelW = 180;

    return (
      <div className="space-y-4 pb-6">
        {projects.length>ganttProjects.length && (
          <p className="text-xs text-white/30 flex items-center gap-1.5">
            <AlertCircle size={12}/>{projects.length-ganttProjects.length} projet{projects.length-ganttProjects.length>1?"s":""} sans dates masqué{projects.length-ganttProjects.length>1?"s":""} — ajoutez des dates pour les voir
          </p>
        )}
        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.02]">
          <div style={{minWidth: labelW+totalW+32}}>
            {/* Month header */}
            <div className="flex items-center border-b border-white/5" style={{paddingLeft:labelW}}>
              {months.map((mo,i)=>(
                <div key={i} className="shrink-0 border-r border-white/5 px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/25"
                  style={{width:mo.days*PX_PER_DAY}}>
                  {mo.label}
                </div>
              ))}
            </div>

            {/* Project rows */}
            {ganttProjects.map(p=>{
              const startOff = Math.max(0,Math.floor((new Date(p.start_date!).getTime()-range.start.getTime())/86400000));
              const durDays  = Math.max(1,Math.floor((new Date(p.end_date!).getTime()-new Date(p.start_date!).getTime())/86400000));
              const pMiles   = milestones.filter(m=>m.projectId===p.id&&m.date);
              const pTasks   = projTasks.filter(t=>t.projectId===p.id);
              const donePct  = pTasks.length>0 ? (pTasks.filter(t=>t.done).length/pTasks.length)*100 : 0;

              return (
                <div key={p.id} className="group flex items-center border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors cursor-pointer"
                  onClick={()=>{ setDetailProj(p); setDetailTab("tasks"); }}>
                  {/* Label */}
                  <div className="shrink-0 flex items-center gap-2 px-4 py-3" style={{width:labelW}}>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:p.color}}/>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white/80 truncate">{p.title}</p>
                      {p.client && <p className="text-[10px] text-white/30 truncate">{p.client}</p>}
                    </div>
                    <ChevronRight size={12} className="ml-auto text-white/15 group-hover:text-white/30 transition-colors shrink-0"/>
                  </div>

                  {/* Timeline area */}
                  <div className="relative flex-1 h-12" style={{width:totalW}}>
                    {/* Today line */}
                    {todayOffset>=0 && todayOffset<=range.totalDays && (
                      <div className="absolute top-0 bottom-0 w-px z-10"
                        style={{left:todayOffset*PX_PER_DAY,background:"rgba(251,191,36,0.4)"}}/>
                    )}

                    {/* Project bar */}
                    <div className="absolute top-1/2 -translate-y-1/2 rounded-full overflow-hidden"
                      style={{left:startOff*PX_PER_DAY, width:durDays*PX_PER_DAY, height:20, background:`${p.color}25`, border:`1px solid ${p.color}50`}}>
                      {/* Progress fill */}
                      <div className="h-full rounded-full transition-all"
                        style={{width:`${donePct}%`, background:`${p.color}60`}}/>
                    </div>

                    {/* Milestone markers */}
                    {pMiles.map(m=>{
                      const mOff = Math.floor((new Date(m.date).getTime()-range.start.getTime())/86400000);
                      if (mOff<0||mOff>range.totalDays) return null;
                      return (
                        <div key={m.id} className="absolute top-1/2 -translate-y-1/2 z-20 group/ms" style={{left:mOff*PX_PER_DAY-5}}>
                          <div className="w-3 h-3 rotate-45 border transition-all"
                            style={{background:m.done?"#f59e0b20":"#f59e0b40",borderColor:m.done?"#f59e0b":"#f59e0b80"}}/>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover/ms:opacity-100 transition-opacity pointer-events-none z-30">
                            <div className="rounded-lg border border-white/15 bg-[#1a2030] px-2 py-1 text-[10px] text-white/80 whitespace-nowrap">
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

            {/* Today legend */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-px bg-yellow-400/40"/>
                <span className="text-[10px] text-white/25">Aujourd&apos;hui</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2.5 rotate-45 border border-yellow-500/80"/>
                <span className="text-[10px] text-white/25">Jalon</span>
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

    const DTABS = [
      {k:"tasks",      l:"Tâches",    badge:pTasks.length },
      {k:"milestones", l:"Jalons",    badge:pMiles.length },
      {k:"team",       l:"Équipe",    badge:pTeam.length  },
    ] as const;

    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 z-40 flex items-stretch justify-end"
        onClick={e=>{if(e.target===e.currentTarget)setDetailProj(null);}}>
        {/* Backdrop */}
        <div className="flex-1" onClick={()=>setDetailProj(null)}/>

        {/* Panel */}
        <motion.div initial={{x:440}} animate={{x:0}} exit={{x:440}} transition={{type:"spring",stiffness:320,damping:32}}
          className="flex flex-col h-full bg-[#0e1420] border-l border-white/8 shadow-2xl"
          style={{width:"min(440px,100vw)"}}
          onClick={e=>e.stopPropagation()}>

          {/* Panel header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{background:p.color}}/>
                <div className="min-w-0">
                  <h2 className="font-black text-white truncate">{p.title}</h2>
                  {p.client && <p className="text-xs text-white/40 truncate">{p.client}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={()=>{ openEdit(p); setDetailProj(null); }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
                  <Edit2 size={14}/>
                </button>
                <button onClick={()=>setDetailProj(null)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
                  <X size={14}/>
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={p.status}/>
              {pTasks.length>0 && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{background:"rgba(16,185,129,0.12)",color:"#10b981"}}>
                  {doneTasks}/{pTasks.length} tâches
                </span>
              )}
              {pMiles.length>0 && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{background:"rgba(245,158,11,0.12)",color:"#f59e0b"}}>
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

          {/* Sub-tabs */}
          <div className="flex gap-1 px-4 pt-4 pb-0 shrink-0">
            {DTABS.map(({k,l,badge})=>(
              <button key={k} onClick={()=>setDetailTab(k as typeof detailTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={detailTab===k
                  ?{background:`${VIOLET}25`,color:VIOLET,border:`1px solid ${VIOLET}40`}
                  :{background:"transparent",color:"rgba(255,255,255,0.35)",border:"1px solid transparent"}}>
                {l}
                {badge>0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{background:detailTab===k?`${VIOLET}40`:"rgba(255,255,255,0.08)"}}>{badge}</span>}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">

            {/* Tasks */}
            {detailTab==="tasks" && (
              <div className="space-y-3">
                {/* Add task */}
                <div className="flex gap-2">
                  <input value={taskInput} onChange={e=>setTaskInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")addTask(p.id);}}
                    placeholder="Nouvelle tâche…"
                    className="flex-1 bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-sky-500/30 focus:bg-white/[0.06] transition-all"/>
                  <button onClick={()=>addTask(p.id)}
                    className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{background:`${SKY}20`,border:`1px solid ${SKY}30`,color:SKY}}>
                    <Plus size={14}/>
                  </button>
                </div>

                {pTasks.length===0 ? (
                  <p className="text-sm text-white/25 py-6 text-center">Aucune tâche — ajoutez-en ci-dessus</p>
                ) : (
                  <div className="space-y-1.5">
                    {pTasks.map(t=>(
                      <div key={t.id} className="group flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5 hover:border-white/10 transition-all">
                        <button onClick={()=>toggleTask(t.id)} className="shrink-0 transition-all hover:scale-110">
                          {t.done
                            ? <CheckCircle2 size={16} className="text-emerald-400"/>
                            : <Circle size={16} className="text-white/20"/>}
                        </button>
                        <span className={`flex-1 text-sm ${t.done?"line-through text-white/25":"text-white/80"} transition-all`}>{t.title}</span>
                        <button onClick={()=>deleteTask(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={11}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Milestones */}
            {detailTab==="milestones" && (
              <div className="space-y-3">
                {/* Add milestone */}
                <div className="space-y-2 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <input value={mileTitle} onChange={e=>setMileTitle(e.target.value)}
                    placeholder="Titre du jalon…"
                    className="w-full bg-transparent border-b border-white/8 pb-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-all"/>
                  <div className="flex gap-2 items-center">
                    <input type="date" value={mileDate} onChange={e=>setMileDate(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white outline-none [color-scheme:dark] focus:border-sky-500/30 transition-all"/>
                    <button onClick={()=>addMilestone(p.id)} disabled={!mileTitle.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                      style={{background:`${GOLD}20`,border:`1px solid ${GOLD}30`,color:GOLD}}>
                      <Plus size={12}/>Ajouter
                    </button>
                  </div>
                </div>

                {pMiles.length===0 ? (
                  <p className="text-sm text-white/25 py-6 text-center">Aucun jalon défini</p>
                ) : (
                  <div className="space-y-1.5">
                    {pMiles.sort((a,b)=>a.date.localeCompare(b.date)).map(m=>(
                      <div key={m.id} className="group flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5 hover:border-white/10 transition-all">
                        <button onClick={()=>toggleMilestone(m.id)} className="shrink-0 transition-all hover:scale-110">
                          {m.done
                            ? <Flag size={15} className="text-yellow-400"/>
                            : <Flag size={15} className="text-white/20"/>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${m.done?"line-through text-white/25":"text-white/80"}`}>{m.title}</p>
                          {m.date && <p className="text-[10px] text-white/30 flex items-center gap-1"><Calendar size={9}/>{fmtDateShort(m.date)}</p>}
                        </div>
                        <button onClick={()=>deleteMilestone(m.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={11}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Team */}
            {detailTab==="team" && (
              <div className="space-y-3">
                {/* Add member */}
                <div className="flex gap-2">
                  <input value={teamInput} onChange={e=>setTeamInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")addTeamMember(p.id);}}
                    placeholder="Nom du membre…"
                    className="flex-1 bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-sky-500/30 focus:bg-white/[0.06] transition-all"/>
                  <button onClick={()=>addTeamMember(p.id)}
                    className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{background:`${SKY}20`,border:`1px solid ${SKY}30`,color:SKY}}>
                    <Plus size={14}/>
                  </button>
                </div>

                {pTeam.length===0 ? (
                  <p className="text-sm text-white/25 py-6 text-center">Aucun membre assigné</p>
                ) : (
                  <div className="space-y-1.5">
                    {pTeam.map(name=>(
                      <div key={name} className="group flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-4 py-3 hover:border-white/10 transition-all">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                          style={{background:`${p.color}30`,color:p.color}}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm font-medium text-white/75">{name}</span>
                        <button onClick={()=>removeTeamMember(p.id,name)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <X size={11}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Link to equipe module */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <button onClick={()=>router.push("/client/equipe")}
                    className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-all">
                    <Users size={11}/>Gérer l&apos;équipe complète →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel footer */}
          <div className="px-4 pb-5 pt-3 border-t border-white/5 shrink-0 flex gap-2">
            <button onClick={()=>{ openEdit(p); setDetailProj(null); }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/8 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/12 hover:text-white">
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-[#07080e]">
        <Loader2 size={28} className="animate-spin text-violet-400"/>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="relative min-h-screen bg-[#07080e] text-white">
      <div className="space-y-6 px-4 py-6 lg:px-8">
        <ToastStack toasts={toasts} remove={removeToast}/>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/30">Gestion</p>
            <h1 className="text-2xl font-black text-white">Projets</h1>
            <p className="text-sm text-white/40">{projects.length} projet{projects.length!==1?"s":""}</p>
          </div>
          <button onClick={openNew}
            className="group flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#07080e] shadow-lg shadow-white/10 transition hover:scale-[1.02] hover:shadow-white/20 active:scale-[0.98]">
            <Plus size={16}/>Nouveau projet
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {label:"En cours", value:String(kpis.enCours), color:"#3b82f6", sub:"projets actifs"  },
            {label:"Terminés", value:String(kpis.terminé),  color:"#10b981", sub:"projets terminés"},
            {label:"Budget",   value:fmtEur(kpis.budget),   color:GOLD,      sub:"budget total"   },
            {label:"Encaissé", value:fmtEur(kpis.encaissé), color:VIOLET,    sub:"revenus encaissés"},
          ].map(k=>(
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl" style={{background:k.color}}/>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/30">{k.label}</p>
              <p className="mt-1 text-2xl font-black" style={{color:k.color}}>{k.value}</p>
              <p className="text-[0.65rem] text-white/25">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* View tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
            {([["projets","Liste"],["gantt","Gantt"]] as const).map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)}
                className="flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-semibold transition-all"
                style={tab===k
                  ?{background:VIOLET,color:"#fff",boxShadow:`0 2px 12px ${VIOLET}40`}
                  :{color:"rgba(255,255,255,0.4)"}}>
                {k==="gantt" && <BarChart3 size={12}/>}{l}
              </button>
            ))}
          </div>

          {/* Status filters — only in list view */}
          {tab==="projets" && (
            <div className="flex flex-wrap gap-2">
              {([["tous","Tous"],["en_cours","En cours"],["en_attente","En attente"],["terminé","Terminés"],["annulé","Annulés"]] as [Status|"tous",string][]).map(([s,l])=>(
                <button key={s} onClick={()=>setFilter(s)}
                  className="rounded-xl border px-4 py-1.5 text-xs font-semibold transition"
                  style={filter===s
                    ?{background:VIOLET,borderColor:VIOLET,color:"#fff"}
                    :{borderColor:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.04)"}}>
                  {l}{s!=="tous" && <span className="ml-1.5 opacity-60">{projects.filter(p=>p.status===s).length}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {tab==="gantt" ? (
          renderGantt()
        ) : filtered.length===0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/8 bg-white/[0.04]">
              <FolderOpen size={28} className="text-white/20"/>
            </div>
            <p className="font-bold text-white/50">
              {filter==="tous" ? "Aucun projet pour le moment" : `Aucun projet « ${STATUS_CONFIG[filter as Status]?.label??filter} »`}
            </p>
            <p className="text-sm text-white/25">{filter==="tous" ? "Créez votre premier projet" : "Essayez un autre filtre"}</p>
            {filter==="tous" && (
              <button onClick={openNew}
                className="mt-2 rounded-2xl border border-white/10 bg-white/8 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/12">
                Créer mon premier projet
              </button>
            )}
          </div>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map(p=>(
                <ProjectCard key={p.id} project={p}
                  onEdit={openEdit}
                  onDelete={id=>setConfirmDel(id)}
                  onOpen={proj=>{setDetailProj(proj);setDetailTab("tasks");}}
                  onChrono={()=>router.push("/client/chrono")}
                  onInvoice={()=>{ void handleCreateProjectInvoice(p); }}
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
              onClose={()=>setShowModal(false)} saving={saving} isEdit={!!editProject}/>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmDel && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
              <motion.div initial={{scale:0.96}} animate={{scale:1}} exit={{scale:0.96}}
                className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#0e1420] p-6 text-center shadow-2xl">
                <AlertCircle size={36} className="mx-auto mb-3 text-red-400"/>
                <h3 className="mb-1 text-lg font-bold text-white">Supprimer ce projet ?</h3>
                <p className="mb-6 text-sm text-white/40">Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={()=>setConfirmDel(null)}
                    className="flex-1 rounded-xl border border-white/8 bg-white/8 py-2.5 text-sm font-semibold text-white/50 transition hover:bg-white/12">
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

        {/* Detail panel */}
        <AnimatePresence>{detailProj && renderDetailPanel()}</AnimatePresence>
      </div>
    </div>
  );
}
