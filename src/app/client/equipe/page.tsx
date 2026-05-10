"use client";
/**
 * Équipe — Membres · Tâches (Kanban) · Chat · RH · IA
 */

import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, X, Check, Loader2, MessageSquare,
  CheckSquare, Briefcase, Trash2, User, Mail, Phone,
  Building, Calendar, Sparkles, Zap, Send, Search,
  Edit2, ChevronDown, Star, AlertCircle, Clock,
  Video, Hash, AtSign, MoreHorizontal,
} from "lucide-react";
import Toast, { type ToastData } from "@/components/ui/Toast";

/* ══════════════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════════════ */
type MemberRole   = "admin"|"manager"|"employee"|"accountant"|"extern";
type MemberStatus = "active"|"away"|"leave"|"inactive";
type TaskStatus   = "todo"|"in_progress"|"done"|"late";
type TaskPriority = "low"|"normal"|"high"|"urgent";
type AppTab       = "members"|"tasks"|"chat"|"hr";
type LeaveType    = "vacation"|"sick"|"personal"|"training"|"other";
type LeaveStatus  = "pending"|"approved"|"rejected";

interface TeamMember {
  id:string; name:string; email:string; phone:string;
  position:string; department:string; role:MemberRole;
  status:MemberStatus; avatar_color:string;
  entry_date:string|null; notes:string; created_at:string;
}

interface TeamTask {
  id:string; title:string; description:string;
  assigned_to:string|null; assigned_name:string;
  priority:TaskPriority; status:TaskStatus;
  due_date:string|null; project:string;
  estimated_hours:number; created_at:string;
}

interface TeamMessage {
  id:string; sender_name:string; content:string;
  channel:string; mentions:string[]; created_at:string;
}

interface TeamLeave {
  id:string; member_id:string; member_name:string;
  type:LeaveType; start_date:string; end_date:string;
  status:LeaveStatus; reason:string; created_at:string;
}

interface TeamMeeting {
  id:string; title:string; description:string;
  date_at:string; duration_minutes:number;
  location:string; meet_link:string;
  participants:string[]; notes:string; status:string; created_at:string;
}

/* ══════════════════════════════════════════════════════════
   Constants
══════════════════════════════════════════════════════════ */
const SKY = "#0ea5e9";

const STATUSES: { v:MemberStatus; l:string; c:string }[] = [
  { v:"active",   l:"Actif",    c:"#10b981" },
  { v:"away",     l:"Absent",   c:"#f59e0b" },
  { v:"leave",    l:"Congé",    c:"#f87171" },
  { v:"inactive", l:"Inactif",  c:"#64748b" },
];

const ROLES: { v:MemberRole; l:string; c:string }[] = [
  { v:"admin",      l:"Admin",          c:"#c084fc" },
  { v:"manager",    l:"Manager",        c:"#60a5fa" },
  { v:"employee",   l:"Employé",        c:"#94a3b8" },
  { v:"accountant", l:"Comptable",      c:"#34d399" },
  { v:"extern",     l:"Client externe", c:"#fb923c" },
];

const PRIOS: { v:TaskPriority; l:string; c:string }[] = [
  { v:"low",    l:"Faible",  c:"#64748b" },
  { v:"normal", l:"Normal",  c:"#60a5fa" },
  { v:"high",   l:"Élevée",  c:"#f59e0b" },
  { v:"urgent", l:"Urgent",  c:"#f87171" },
];

const TASK_COLS: { k:TaskStatus; l:string; c:string }[] = [
  { k:"todo",        l:"À faire",   c:"#60a5fa" },
  { k:"in_progress", l:"En cours",  c:"#f59e0b" },
  { k:"done",        l:"Terminées", c:"#10b981" },
  { k:"late",        l:"En retard", c:"#f87171" },
];

const LEAVE_TYPES: { v:LeaveType; l:string; e:string }[] = [
  { v:"vacation", l:"Congés payés",   e:"🏖" },
  { v:"sick",     l:"Maladie",        e:"🤒" },
  { v:"personal", l:"Personnel",      e:"👤" },
  { v:"training", l:"Formation",      e:"📚" },
  { v:"other",    l:"Autre",          e:"📋" },
];

const CHANNELS = ["général","dev","design","marketing","direction","rh"];

const AVATAR_COLORS = [
  "#6366f1","#f59e0b","#10b981","#f87171",
  "#60a5fa","#c084fc","#fb923c","#f472b6","#34d399","#0ea5e9",
];

const TABS: { k:AppTab; l:string; e:string }[] = [
  { k:"members", l:"Membres",       e:"👥" },
  { k:"tasks",   l:"Tâches",        e:"✅" },
  { k:"chat",    l:"Chat",          e:"💬" },
  { k:"hr",      l:"RH",            e:"📋" },
];

/* ══════════════════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════════════════ */
const initials = (n:string) =>
  n.trim().split(/\s+/).map(w => w[0]?.toUpperCase()??"").slice(0,2).join("");

const relTime = (iso:string) => {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000)     return "À l'instant";
  if (d < 3_600_000)  return `${Math.floor(d/60_000)} min`;
  if (d < 86_400_000) return `${Math.floor(d/3_600_000)} h`;
  return new Date(iso).toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
};

const fmtDate = (iso:string) =>
  new Date(iso).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});

const daysBetween = (a:string, b:string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1;

function parseMember(r:Record<string,unknown>): TeamMember {
  return {
    id:           r.id as string,
    name:         (r.name as string) ?? "",
    email:        (r.email as string) ?? "",
    phone:        (r.phone as string) ?? "",
    position:     (r.position as string) ?? "",
    department:   (r.department as string) ?? "",
    role:         (r.role as MemberRole) ?? "employee",
    status:       (r.status as MemberStatus) ?? "active",
    avatar_color: (r.avatar_color as string) ?? SKY,
    entry_date:   (r.entry_date as string|null) ?? null,
    notes:        (r.notes as string) ?? "",
    created_at:   (r.created_at as string) ?? "",
  };
}

function parseTask(r:Record<string,unknown>): TeamTask {
  return {
    id:              r.id as string,
    title:           (r.title as string) ?? "",
    description:     (r.description as string) ?? "",
    assigned_to:     (r.assigned_to as string|null) ?? null,
    assigned_name:   (r.assigned_name as string) ?? "",
    priority:        (r.priority as TaskPriority) ?? "normal",
    status:          (r.status as TaskStatus) ?? "todo",
    due_date:        (r.due_date as string|null) ?? null,
    project:         (r.project as string) ?? "",
    estimated_hours: (r.estimated_hours as number) ?? 0,
    created_at:      (r.created_at as string) ?? "",
  };
}

/* ══════════════════════════════════════════════════════════
   Avatar component
══════════════════════════════════════════════════════════ */
function Avatar({ name, color, size=36 }: { name:string; color:string; size?:number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-bold shrink-0 select-none"
      style={{ width:size, height:size, background:`${color}30`, color, border:`2px solid ${color}50`, fontSize:size*0.35 }}>
      {initials(name)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════════ */
export default function EquipePage() {
  /* ── State ── */
  const [tab,      setTab]      = useState<AppTab>("members");
  const [members,  setMembers]  = useState<TeamMember[]>([]);
  const [tasks,    setTasks]    = useState<TeamTask[]>([]);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [leaves,   setLeaves]   = useState<TeamLeave[]>([]);
  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [toastData,setToastData]= useState<ToastData|null>(null);

  /* member modal */
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editMember,      setEditMember]      = useState<TeamMember|null>(null);
  const [mForm,           setMForm]           = useState<Partial<TeamMember>>({});
  const [savingM,         setSavingM]         = useState(false);

  /* task modal */
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask,      setEditTask]      = useState<TeamTask|null>(null);
  const [tForm,         setTForm]         = useState<Partial<TeamTask>>({});
  const [savingT,       setSavingT]       = useState(false);
  const [quickTask,     setQuickTask]     = useState("");
  const [qTaskCol,      setQTaskCol]      = useState<TaskStatus>("todo");

  /* leave modal */
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [lForm,          setLForm]          = useState<Partial<TeamLeave>>({});
  const [savingL,        setSavingL]        = useState(false);

  /* meeting modal */
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetForm,      setMeetForm]      = useState<Partial<TeamMeeting>>({});
  const [savingMeet,    setSavingMeet]    = useState(false);

  /* chat */
  const [chatMsg,     setChatMsg]    = useState("");
  const [chatChannel, setChatChannel]= useState("général");
  const [mySenderName,setMySenderName]= useState("");
  const [sendingMsg,  setSendingMsg]  = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  /* AI */
  const [showAI,   setShowAI]   = useState(false);
  const [aiLoad,   setAiLoad]   = useState(false);
  const [aiResult, setAiResult] = useState("");

  /* ── Load ── */
  const load = useCallback(async () => {
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const uid = user.id;
    const [mR,tkR,msgR,lR,mrR] = await Promise.all([
      supabase.from("team_members").select("*").eq("user_id",uid).order("name"),
      supabase.from("team_tasks").select("*").eq("user_id",uid).order("created_at",{ascending:false}),
      supabase.from("team_messages").select("*").eq("user_id",uid).order("created_at").limit(200),
      supabase.from("team_leaves").select("*").eq("user_id",uid).order("start_date",{ascending:false}),
      supabase.from("team_meetings").select("*").eq("user_id",uid).order("date_at"),
    ]);
    setMembers((mR.data??[]).map(r=>parseMember(r as Record<string,unknown>)));
    setTasks((tkR.data??[]).map(r=>parseTask(r as Record<string,unknown>)));
    setMessages((msgR.data??[]) as TeamMessage[]);
    setLeaves((lR.data??[]) as TeamLeave[]);
    setMeetings((mrR.data??[]) as TeamMeeting[]);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(()=>{ load(); },[load]);

  useEffect(()=>{
    if (tab==="chat") setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:"smooth"}),100);
  },[tab, messages]);

  /* ── Stats ── */
  const stats = useMemo(()=>({
    active:   members.filter(m=>m.status==="active").length,
    inProg:   tasks.filter(t=>t.status==="in_progress").length,
    done:     tasks.filter(t=>t.status==="done").length,
    late:     tasks.filter(t=>t.status==="late").length,
    onLeave:  members.filter(m=>m.status==="leave").length,
    pending:  leaves.filter(l=>l.status==="pending").length,
    nextMeet: meetings.filter(m=>m.status==="planned"&&new Date(m.date_at)>new Date())
                      .sort((a,b)=>new Date(a.date_at).getTime()-new Date(b.date_at).getTime())[0],
  }),[members,tasks,leaves,meetings]);

  /* ── Member CRUD ── */
  function openNewMember() {
    setEditMember(null);
    setMForm({ name:"", email:"", phone:"", position:"", department:"",
      role:"employee", status:"active",
      avatar_color: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
    });
    setShowMemberModal(true);
  }
  function openEditMember(m:TeamMember) {
    setEditMember(m); setMForm({...m}); setShowMemberModal(true);
  }
  async function saveMember() {
    if (!mForm.name?.trim()) return;
    setSavingM(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSavingM(false); return; }
    if (editMember) {
      const { data } = await supabase.from("team_members").update(mForm).eq("id",editMember.id).select().single();
      if (data) setMembers(p=>p.map(m=>m.id===editMember.id ? parseMember(data as Record<string,unknown>) : m));
    } else {
      const { data } = await supabase.from("team_members").insert({...mForm,user_id:user.id}).select().single();
      if (data) setMembers(p=>[parseMember(data as Record<string,unknown>),...p]);
    }
    setSavingM(false); setShowMemberModal(false);
    setToastData({type:"success",msg:editMember?"Membre mis à jour":"Membre ajouté ✓"});
  }
  async function deleteMember(id:string) {
    await supabase.from("team_members").delete().eq("id",id);
    setMembers(p=>p.filter(m=>m.id!==id));
    setShowMemberModal(false);
    setToastData({type:"success",msg:"Membre supprimé"});
  }

  /* ── Task CRUD ── */
  function openNewTask(col:TaskStatus="todo") {
    setEditTask(null);
    setTForm({title:"",description:"",priority:"normal",status:col,project:"",estimated_hours:0});
    setShowTaskModal(true);
  }
  function openEditTask(t:TeamTask) { setEditTask(t); setTForm({...t}); setShowTaskModal(true); }
  async function saveTask() {
    if (!tForm.title?.trim()) return;
    setSavingT(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSavingT(false); return; }
    const assignedMember = members.find(m=>m.id===tForm.assigned_to);
    const payload = {...tForm, assigned_name: assignedMember?.name ?? tForm.assigned_name ?? ""};
    if (editTask) {
      const { data } = await supabase.from("team_tasks").update(payload).eq("id",editTask.id).select().single();
      if (data) setTasks(p=>p.map(t=>t.id===editTask.id?parseTask(data as Record<string,unknown>):t));
    } else {
      const { data } = await supabase.from("team_tasks").insert({...payload,user_id:user.id}).select().single();
      if (data) setTasks(p=>[parseTask(data as Record<string,unknown>),...p]);
    }
    setSavingT(false); setShowTaskModal(false);
    setToastData({type:"success",msg:editTask?"Tâche mise à jour":"Tâche créée ✓"});
  }
  async function deleteTask(id:string) {
    await supabase.from("team_tasks").delete().eq("id",id);
    setTasks(p=>p.filter(t=>t.id!==id));
  }
  async function changeTaskStatus(id:string, status:TaskStatus) {
    await supabase.from("team_tasks").update({status}).eq("id",id);
    setTasks(p=>p.map(t=>t.id===id?{...t,status}:t));
  }
  async function quickAddTask() {
    if (!quickTask.trim()) return;
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("team_tasks").insert({
      user_id:user.id, title:quickTask.trim(), status:qTaskCol,
      priority:"normal",
    }).select().single();
    if (data) setTasks(p=>[parseTask(data as Record<string,unknown>),...p]);
    setQuickTask("");
  }

  /* ── Chat ── */
  async function sendMessage() {
    if (!chatMsg.trim() || !mySenderName.trim()) return;
    setSendingMsg(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSendingMsg(false); return; }
    const { data } = await supabase.from("team_messages").insert({
      user_id:user.id, sender_name:mySenderName.trim(),
      content:chatMsg.trim(), channel:chatChannel,
    }).select().single();
    if (data) setMessages(p=>[...p, data as TeamMessage]);
    setChatMsg(""); setSendingMsg(false);
  }

  /* ── Leave CRUD ── */
  async function saveLeave() {
    if (!lForm.member_id || !lForm.start_date || !lForm.end_date) return;
    setSavingL(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSavingL(false); return; }
    const mem = members.find(m=>m.id===lForm.member_id);
    const { data } = await supabase.from("team_leaves").insert({
      ...lForm, user_id:user.id, member_name: mem?.name ?? lForm.member_name ?? "", status:"pending",
    }).select().single();
    if (data) setLeaves(p=>[data as TeamLeave,...p]);
    setSavingL(false); setShowLeaveModal(false);
    setToastData({type:"success",msg:"Demande de congé envoyée"});
  }
  async function updateLeaveStatus(id:string, status:LeaveStatus) {
    await supabase.from("team_leaves").update({status}).eq("id",id);
    setLeaves(p=>p.map(l=>l.id===id?{...l,status}:l));
  }

  /* ── Meeting CRUD ── */
  async function saveMeeting() {
    if (!meetForm.title?.trim() || !meetForm.date_at) return;
    setSavingMeet(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSavingMeet(false); return; }
    const { data } = await supabase.from("team_meetings").insert({
      ...meetForm, user_id:user.id,
      duration_minutes: meetForm.duration_minutes ?? 60,
      participants: meetForm.participants ?? [],
    }).select().single();
    if (data) setMeetings(p=>[data as TeamMeeting,...p]);
    setSavingMeet(false); setShowMeetModal(false);
    setToastData({type:"success",msg:"Réunion créée ✓"});
  }

  /* ── AI ── */
  async function runAI(prompt:string) {
    setAiLoad(true); setAiResult("");
    const ctx = [
      `Équipe : ${members.length} membres (${stats.active} actifs, ${stats.onLeave} en congé)`,
      `Tâches : ${tasks.filter(t=>t.status==="todo").length} à faire, ${stats.inProg} en cours, ${stats.done} terminées, ${stats.late} en retard`,
      `Membres par tâches : ${members.map(m=>`${m.name} (${tasks.filter(t=>t.assigned_to===m.id&&t.status!=="done").length} tâches actives)`).join(", ")}`,
      `Demandes congés en attente : ${stats.pending}`,
    ].join("\n");
    try {
      const r = await fetch("/api/notes/ai",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"chat",content:ctx,prompt}),
      });
      const j = await r.json() as {result?:string;error?:string};
      setAiResult(j.result ?? j.error ?? "Erreur");
    } catch { setAiResult("Erreur réseau"); }
    finally { setAiLoad(false); }
  }

  /* ── Filtered members ── */
  const filteredMembers = useMemo(()=>{
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m=>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.position.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q)
    );
  },[members,search]);

  /* ── Chat channels ── */
  const channelMessages = messages.filter(m=>m.channel===chatChannel);
  const groupedMsgs = useMemo(()=>{
    const groups: {date:string; msgs:TeamMessage[]}[] = [];
    channelMessages.forEach(m=>{
      const d = m.created_at.split("T")[0];
      const last = groups[groups.length-1];
      if (last?.date===d) last.msgs.push(m);
      else groups.push({date:d,msgs:[m]});
    });
    return groups;
  },[channelMessages]);

  /* ══════════════════════════════════════════════════════
     RENDER TABS
  ══════════════════════════════════════════════════════ */

  /* Members tab */
  function renderMembers() {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
          {[
            { l:"Membres actifs",  v:stats.active,  c:"#10b981", e:"🟢" },
            { l:"Tâches en cours", v:stats.inProg,  c:"#f59e0b", e:"⚡" },
            { l:"En retard",       v:stats.late,    c:"#f87171", e:"⚠️" },
            { l:"En congé",        v:stats.onLeave, c:"#60a5fa", e:"🏖" },
          ].map(s=>(
            <div key={s.l} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <span className="text-xl leading-none">{s.e}</span>
              <div>
                <p className="text-xl font-extrabold" style={{color:s.c}}>{s.v}</p>
                <p className="text-[10px] text-white/35">{s.l}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Member grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Users size={32} className="text-white/15"/>
              <p className="text-white/35 text-sm">{search ? "Aucun résultat" : "Aucun membre dans l'équipe"}</p>
              <button onClick={openNewMember}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{background:`${SKY}18`,border:`1px solid ${SKY}35`,color:SKY}}>
                <Plus size={15}/>Ajouter un membre
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMembers.map(m=>{
                const role    = ROLES.find(r=>r.v===m.role);
                const status  = STATUSES.find(s=>s.v===m.status);
                const mTasks  = tasks.filter(t=>t.assigned_to===m.id&&t.status!=="done").length;
                return (
                  <motion.div key={m.id} layout
                    initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
                    className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 cursor-pointer transition-all hover:border-white/15 hover:bg-white/[0.05]"
                    onClick={()=>openEditMember(m)}>

                    {/* Status dot */}
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
                      style={{background:status?.c??SKY}} title={status?.l}/>

                    <div className="flex items-start gap-3">
                      <Avatar name={m.name} color={m.avatar_color} size={44}/>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{m.name}</p>
                        <p className="text-xs text-white/45 truncate">{m.position || m.department || "—"}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{background:`${role?.c ?? SKY}18`,color:role?.c??SKY}}>
                            {role?.l}
                          </span>
                          {mTasks > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/40">
                              {mTasks} tâche{mTasks>1?"s":""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {(m.email || m.phone) && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1">
                        {m.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-white/35">
                            <Mail size={10}/><span className="truncate">{m.email}</span>
                          </div>
                        )}
                        {m.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-white/35">
                            <Phone size={10}/>{m.phone}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* Tasks tab — Kanban */
  function renderTasks() {
    return (
      <div className="flex gap-4 overflow-x-auto flex-1 p-5 pb-4">
        {TASK_COLS.map(col=>{
          const colTasks = tasks.filter(t=>t.status===col.k);
          return (
            <div key={col.k} className="w-72 xl:w-80 shrink-0 flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              {/* Column header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-2.5 h-2.5 rounded-full" style={{background:col.c}}/>
                <span className="text-sm font-bold text-white/70">{col.l}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/35">{colTasks.length}</span>
                <button onClick={()=>openNewTask(col.k)}
                  className="p-1 rounded-lg text-white/25 hover:text-white hover:bg-white/10 transition-all">
                  <Plus size={13}/>
                </button>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <AnimatePresence>
                  {colTasks.map(t=>{
                    const prio   = PRIOS.find(p=>p.v===t.priority);
                    const member = members.find(m=>m.id===t.assigned_to);
                    const isLate = t.due_date && new Date(t.due_date) < new Date() && t.status !== "done";
                    return (
                      <motion.div key={t.id} layout
                        initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        className="group rounded-xl border border-white/[0.07] bg-[#0b0d14] p-3 cursor-pointer hover:border-white/15 transition-all"
                        onClick={()=>openEditTask(t)}>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                            style={{background:prio?.c??SKY}} title={prio?.l}/>
                          <p className="flex-1 text-sm text-white/80 font-medium leading-snug">{t.title}</p>
                          <button onClick={e=>{e.stopPropagation();deleteTask(t.id);}}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-white/20 hover:text-red-400 transition-all">
                            <X size={12}/>
                          </button>
                        </div>
                        {t.project && (
                          <p className="text-[10px] text-white/30 mt-1 ml-4">📁 {t.project}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 ml-4">
                          {member && (
                            <div className="flex items-center gap-1">
                              <Avatar name={member.name} color={member.avatar_color} size={18}/>
                              <span className="text-[10px] text-white/40">{member.name.split(" ")[0]}</span>
                            </div>
                          )}
                          {t.due_date && (
                            <span className={`ml-auto text-[10px] flex items-center gap-1 ${isLate ? "text-red-400" : "text-white/30"}`}>
                              <Clock size={9}/>{new Date(t.due_date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
                            </span>
                          )}
                        </div>
                        {/* Status changer */}
                        <div className="flex gap-1 mt-2 ml-4 opacity-0 group-hover:opacity-100 transition-all">
                          {TASK_COLS.filter(c=>c.k!==col.k).map(c=>(
                            <button key={c.k}
                              onClick={e=>{e.stopPropagation();changeTaskStatus(t.id,c.k);}}
                              className="text-[9px] px-2 py-0.5 rounded-full border transition-all hover:opacity-90"
                              style={{borderColor:`${c.c}40`,color:c.c,background:`${c.c}12`}}>
                              → {c.l}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Quick add */}
              <div className="p-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-1">
                  <input
                    value={qTaskCol===col.k ? quickTask : ""}
                    onChange={e=>{setQTaskCol(col.k);setQuickTask(e.target.value);}}
                    onKeyDown={e=>{ if(e.key==="Enter"&&qTaskCol===col.k) quickAddTask(); }}
                    placeholder="+ Ajouter…"
                    className="flex-1 bg-transparent text-xs text-white/50 placeholder:text-white/20 focus:outline-none px-2 py-1.5"/>
                  {qTaskCol===col.k && quickTask && (
                    <button onClick={quickAddTask}
                      className="p-1.5 rounded-lg transition-all" style={{background:`${col.c}20`,color:col.c}}>
                      <Check size={11}/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* Chat tab */
  function renderChat() {
    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Channel sidebar */}
        <div className="w-48 shrink-0 border-r border-white/[0.06] bg-[#0b0d14] p-3 space-y-1">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-wider px-2 mb-3">Canaux</p>
          {CHANNELS.map(ch=>(
            <button key={ch} onClick={()=>setChatChannel(ch)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all"
              style={{
                background: chatChannel===ch ? `${SKY}18` : "transparent",
                color:      chatChannel===ch ? SKY : "rgba(255,255,255,.4)",
              }}>
              <Hash size={12}/>{ch}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Channel header */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2 shrink-0">
            <Hash size={14} className="text-white/30"/>
            <span className="font-bold text-sm text-white/80">{chatChannel}</span>
            <span className="text-xs text-white/25 ml-auto">{channelMessages.length} messages</span>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {groupedMsgs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <MessageSquare size={28} className="text-white/15"/>
                <p className="text-white/30 text-sm">Aucun message dans #{chatChannel}</p>
              </div>
            )}
            {groupedMsgs.map(group=>(
              <div key={group.date}>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-white/[0.06]"/>
                  <span className="text-[10px] text-white/25">
                    {new Date(group.date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.06]"/>
                </div>
                <div className="space-y-3">
                  {group.msgs.map(msg=>{
                    const member = members.find(m=>m.name===msg.sender_name);
                    return (
                      <div key={msg.id} className="flex items-start gap-3">
                        <Avatar name={msg.sender_name||"?"} color={member?.avatar_color??SKY} size={32}/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-white">{msg.sender_name}</span>
                            <span className="text-[10px] text-white/25">{relTime(msg.created_at)}</span>
                          </div>
                          <p className="text-sm text-white/70 leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={msgEndRef}/>
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/[0.06] space-y-2 shrink-0">
            {!mySenderName.trim() && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                <AlertCircle size={12} className="text-amber-400 shrink-0"/>
                <input value={mySenderName} onChange={e=>setMySenderName(e.target.value)}
                  placeholder="Votre nom d'affichage…"
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-amber-300/50 focus:outline-none"/>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2.5">
              <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}
                placeholder={`Message #${chatChannel}…`}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"/>
              <button onClick={sendMessage} disabled={sendingMsg||!chatMsg.trim()||!mySenderName.trim()}
                className="p-1.5 rounded-xl transition-all disabled:opacity-30"
                style={{background:`${SKY}25`,color:SKY}}>
                {sendingMsg ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* HR tab */
  function renderHR() {
    const upcomingMeetings = meetings.filter(m=>m.status==="planned"&&new Date(m.date_at)>new Date()).slice(0,5);
    return (
      <div className="flex-1 overflow-y-auto px-5 py-5 grid gap-6 lg:grid-cols-2">

        {/* Leave requests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white/70 flex items-center gap-2">
              <Calendar size={15}/>Congés & Absences
            </h3>
            <button onClick={()=>{ setLForm({type:"vacation",status:"pending"}); setShowLeaveModal(true); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{background:`${SKY}18`,border:`1px solid ${SKY}30`,color:SKY}}>
              <Plus size={12}/>Demande
            </button>
          </div>
          <div className="space-y-2">
            {leaves.slice(0,10).map(l=>{
              const lt   = LEAVE_TYPES.find(x=>x.v===l.type);
              const days = daysBetween(l.start_date, l.end_date);
              const stCfg = l.status==="approved"
                ? {c:"#10b981",l:"Approuvé"}
                : l.status==="rejected"
                ? {c:"#f87171",l:"Refusé"}
                : {c:"#f59e0b",l:"En attente"};
              return (
                <div key={l.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <span className="text-xl leading-none">{lt?.e??""}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{l.member_name}</p>
                    <p className="text-xs text-white/40">
                      {fmtDate(l.start_date)} → {fmtDate(l.end_date)} · {days} jour{days>1?"s":""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{background:`${stCfg.c}18`,color:stCfg.c}}>
                      {stCfg.l}
                    </span>
                    {l.status==="pending" && (
                      <div className="flex gap-1">
                        <button onClick={()=>updateLeaveStatus(l.id,"approved")}
                          className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all">
                          <Check size={11}/>
                        </button>
                        <button onClick={()=>updateLeaveStatus(l.id,"rejected")}
                          className="p-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all">
                          <X size={11}/>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {leaves.length===0 && (
              <p className="text-sm text-white/25 py-4 text-center">Aucune demande de congé</p>
            )}
          </div>
        </section>

        {/* Meetings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white/70 flex items-center gap-2">
              <Video size={15}/>Réunions à venir
            </h3>
            <button onClick={()=>{ setMeetForm({status:"planned",duration_minutes:60,participants:[]}); setShowMeetModal(true); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{background:`${SKY}18`,border:`1px solid ${SKY}30`,color:SKY}}>
              <Plus size={12}/>Réunion
            </button>
          </div>
          <div className="space-y-2">
            {upcomingMeetings.map(m=>{
              const d = new Date(m.date_at);
              return (
                <div key={m.id} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <div className="text-center shrink-0 w-10">
                    <p className="text-[10px] text-white/30 uppercase">{d.toLocaleDateString("fr-FR",{weekday:"short"})}</p>
                    <p className="text-lg font-extrabold leading-none" style={{color:SKY}}>{d.getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-white/35 flex items-center gap-1">
                        <Clock size={10}/>{d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                      </span>
                      <span className="text-[11px] text-white/35">{m.duration_minutes} min</span>
                      {m.meet_link && (
                        <a href={m.meet_link} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] flex items-center gap-1 hover:opacity-80" style={{color:SKY}}
                          onClick={e=>e.stopPropagation()}>
                          <Video size={10}/>Rejoindre
                        </a>
                      )}
                    </div>
                    {m.participants.length>0 && (
                      <p className="text-[10px] text-white/25 mt-1">👥 {m.participants.join(", ")}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {upcomingMeetings.length===0 && (
              <p className="text-sm text-white/25 py-4 text-center">Aucune réunion prévue</p>
            )}
          </div>
        </section>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#080a0f] text-white overflow-hidden">
      <AnimatePresence>
        {toastData && <Toast toast={toastData} onClose={()=>setToastData(null)}/>}
      </AnimatePresence>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] shrink-0 flex-wrap gap-y-2">
        <div className="flex items-center gap-2 mr-auto">
          <span className="text-2xl">👥</span>
          <h1 className="font-bold text-lg">Équipe</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-medium">
            {members.length} membre{members.length!==1?"s":""}
          </span>
        </div>

        {/* Search */}
        {tab==="members" && (
          <div className="relative w-48">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Chercher…"
              className="w-full pl-8 pr-3 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-sky-500/40"/>
          </div>
        )}

        {/* AI */}
        <button onClick={()=>setShowAI(p=>!p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{
            background: showAI ? `${SKY}22` : "rgba(255,255,255,.05)",
            color:      showAI ? SKY : "rgba(255,255,255,.5)",
            border:     `1px solid ${showAI ? `${SKY}40` : "rgba(255,255,255,.08)"}`,
          }}>
          <Sparkles size={13}/>IA Équipe
        </button>

        {/* Add button */}
        <button
          onClick={()=>{
            if (tab==="members") openNewMember();
            else if (tab==="tasks") openNewTask("todo");
            else if (tab==="hr") { setMeetForm({status:"planned",duration_minutes:60,participants:[]}); setShowMeetModal(true); }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
          style={{background:SKY,color:"#fff"}}>
          <Plus size={14}/>
          {tab==="members" ? "Membre" : tab==="tasks" ? "Tâche" : tab==="hr" ? "Réunion" : "Nouveau"}
        </button>
      </div>

      {/* ── AI Panel ── */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            className="border-b border-white/[0.06] bg-[#0b0d14] overflow-hidden shrink-0">
            <div className="px-5 py-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {[
                  {l:"📊 Résumer activité",  p:"Résume l'activité de l'équipe. Qui est productif ? Y a-t-il des blocages ?"},
                  {l:"⚠️ Détecter surcharge",p:"Analyse la charge de travail. Y a-t-il des membres surchargés ? Qui a trop de tâches ?"},
                  {l:"🔄 Répartir tâches",   p:"Propose une meilleure répartition des tâches en cours selon les membres disponibles."},
                  {l:"🎯 Points clés RH",    p:"Quels sont les points RH importants à surveiller (congés, absentéisme, performance) ?"},
                ].map(a=>(
                  <button key={a.l} onClick={()=>runAI(a.p)} disabled={aiLoad}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/8 hover:border-white/20 text-white/55 hover:text-white transition-all disabled:opacity-40">
                    {aiLoad ? <Loader2 size={10} className="animate-spin"/> : null}{a.l}
                  </button>
                ))}
              </div>
              {aiResult && (
                <div className="rounded-xl border border-white/10 p-3 text-xs text-white/65 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto"
                  style={{background:`${SKY}08`}}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold flex items-center gap-1" style={{color:SKY}}>
                      <Zap size={11}/>Analyse IA
                    </span>
                    <button onClick={()=>setAiResult("")} className="text-white/25 hover:text-white"><X size={11}/></button>
                  </div>
                  {aiResult}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ── */}
      <div className="flex border-b border-white/[0.06] shrink-0 px-5">
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px"
            style={{
              color:       tab===t.k ? SKY : "rgba(255,255,255,.4)",
              borderColor: tab===t.k ? SKY : "transparent",
            }}>
            <span>{t.e}</span>{t.l}
            {t.k==="tasks" && stats.late > 0 && (
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{stats.late}</span>
            )}
            {t.k==="hr" && stats.pending > 0 && (
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{stats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 size={24} className="animate-spin text-white/20"/>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {tab==="members" && renderMembers()}
          {tab==="tasks"   && renderTasks()}
          {tab==="chat"    && renderChat()}
          {tab==="hr"      && renderHR()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MEMBER MODAL
      ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showMemberModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={()=>setShowMemberModal(false)}/>
            <motion.div
              initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="fixed inset-x-4 top-[5%] bottom-[5%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 rounded-3xl border border-white/[0.08] bg-[#0e1018] shadow-2xl flex flex-col overflow-hidden"
              onClick={e=>e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0 border-b border-white/[0.06]">
                {mForm.name && <Avatar name={mForm.name} color={mForm.avatar_color??SKY} size={40}/>}
                <div className="flex-1">
                  <p className="font-bold text-sm text-white">{editMember ? "Modifier le membre" : "Nouveau membre"}</p>
                  {editMember && <p className="text-xs text-white/35">Depuis le {fmtDate(editMember.created_at)}</p>}
                </div>
                <button onClick={()=>setShowMemberModal(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                  <X size={15}/>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-white/35 uppercase tracking-wide">Nom complet *</label>
                  <input value={mForm.name??""} onChange={e=>setMForm(p=>({...p,name:e.target.value}))}
                    placeholder="Prénom Nom"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-sky-500/40"/>
                </div>

                {/* Role + Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Rôle</label>
                    <select value={mForm.role??"employee"} onChange={e=>setMForm(p=>({...p,role:e.target.value as MemberRole}))}
                      className="w-full cursor-pointer bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      {ROLES.map(r=><option key={r.v} value={r.v} className="bg-[#0e1018]">{r.l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Statut</label>
                    <select value={mForm.status??"active"} onChange={e=>setMForm(p=>({...p,status:e.target.value as MemberStatus}))}
                      className="w-full cursor-pointer bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      {STATUSES.map(s=><option key={s.v} value={s.v} className="bg-[#0e1018]">{s.l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Position + Department */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {l:"Poste",        k:"position"   as const, icon:<Briefcase size={12}/>, ph:"Ex: Développeur"},
                    {l:"Département",  k:"department" as const, icon:<Building size={12}/>,  ph:"Ex: Tech"},
                  ].map(f=>(
                    <div key={f.k} className="space-y-1">
                      <label className="text-[10px] text-white/35 uppercase tracking-wide">{f.l}</label>
                      <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2">
                        <span className="text-white/25">{f.icon}</span>
                        <input value={(mForm[f.k] as string)??""} onChange={e=>setMForm(p=>({...p,[f.k]:e.target.value}))}
                          placeholder={f.ph}
                          className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none"/>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email + Phone */}
                {[
                  {l:"Email",     k:"email" as const, icon:<Mail size={12}/>,  ph:"prenom@company.com", type:"email"},
                  {l:"Téléphone", k:"phone" as const, icon:<Phone size={12}/>, ph:"+33 6 …",            type:"tel"},
                ].map(f=>(
                  <div key={f.k} className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">{f.l}</label>
                    <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2">
                      <span className="text-white/25">{f.icon}</span>
                      <input type={f.type} value={(mForm[f.k] as string)??""} onChange={e=>setMForm(p=>({...p,[f.k]:e.target.value}))}
                        placeholder={f.ph}
                        className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none"/>
                    </div>
                  </div>
                ))}

                {/* Entry date */}
                <div className="space-y-1">
                  <label className="text-[10px] text-white/35 uppercase tracking-wide">Date d&apos;entrée</label>
                  <input type="date" value={mForm.entry_date??""} onChange={e=>setMForm(p=>({...p,entry_date:e.target.value||null}))}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
                </div>

                {/* Avatar color */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/35 uppercase tracking-wide">Couleur avatar</label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_COLORS.map(c=>(
                      <button key={c} onClick={()=>setMForm(p=>({...p,avatar_color:c}))}
                        className="w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform"
                        style={{background:c,borderColor:mForm.avatar_color===c?"#fff":"transparent"}}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06] shrink-0">
                {editMember && (
                  <button onClick={()=>deleteMember(editMember.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={13}/>Supprimer
                  </button>
                )}
                <button onClick={()=>setShowMemberModal(false)} className="ml-auto px-4 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">
                  Annuler
                </button>
                <button onClick={saveMember} disabled={savingM||!mForm.name?.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
                  style={{background:SKY,color:"#fff"}}>
                  {savingM ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                  {savingM ? "Sauvegarde…" : editMember ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════
          TASK MODAL
      ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showTaskModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={()=>setShowTaskModal(false)}/>
            <motion.div
              initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 rounded-3xl border border-white/[0.08] bg-[#0e1018] shadow-2xl flex flex-col overflow-hidden"
              onClick={e=>e.stopPropagation()}>
              <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0 border-b border-white/[0.06]">
                <CheckSquare size={16} style={{color:SKY}}/>
                <p className="font-bold text-sm">{editTask ? "Modifier la tâche" : "Nouvelle tâche"}</p>
                <button onClick={()=>setShowTaskModal(false)} className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"><X size={15}/></button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <input value={tForm.title??""} onChange={e=>setTForm(p=>({...p,title:e.target.value}))}
                  placeholder="Titre de la tâche *"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-sky-500/40"/>
                <textarea value={tForm.description??""} onChange={e=>setTForm(p=>({...p,description:e.target.value}))}
                  placeholder="Description (optionnel)" rows={2}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder:text-white/20 focus:outline-none resize-none"/>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Assigné à</label>
                    <select value={tForm.assigned_to??""} onChange={e=>setTForm(p=>({...p,assigned_to:e.target.value||null}))}
                      className="w-full cursor-pointer bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      <option value="" className="bg-[#0e1018]">— Non assignée</option>
                      {members.map(m=><option key={m.id} value={m.id} className="bg-[#0e1018]">{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Priorité</label>
                    <select value={tForm.priority??"normal"} onChange={e=>setTForm(p=>({...p,priority:e.target.value as TaskPriority}))}
                      className="w-full cursor-pointer bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      {PRIOS.map(p=><option key={p.v} value={p.v} className="bg-[#0e1018]">{p.l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Échéance</label>
                    <input type="date" value={tForm.due_date??""} onChange={e=>setTForm(p=>({...p,due_date:e.target.value||null}))}
                      className="w-full bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Statut</label>
                    <select value={tForm.status??"todo"} onChange={e=>setTForm(p=>({...p,status:e.target.value as TaskStatus}))}
                      className="w-full cursor-pointer bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      {TASK_COLS.map(c=><option key={c.k} value={c.k} className="bg-[#0e1018]">{c.l}</option>)}
                    </select>
                  </div>
                </div>
                <input value={tForm.project??""} onChange={e=>setTForm(p=>({...p,project:e.target.value}))}
                  placeholder="Projet (optionnel)"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"/>
              </div>
              <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06]">
                {editTask && (
                  <button onClick={()=>{deleteTask(editTask.id);setShowTaskModal(false);}}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={12}/>Supprimer
                  </button>
                )}
                <button onClick={()=>setShowTaskModal(false)} className="ml-auto px-4 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">Annuler</button>
                <button onClick={saveTask} disabled={savingT||!tForm.title?.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                  style={{background:SKY,color:"#fff"}}>
                  {savingT ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                  {savingT ? "Sauvegarde…" : editTask ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════
          LEAVE MODAL
      ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showLeaveModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={()=>setShowLeaveModal(false)}/>
            <motion.div
              initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0}}
              className="fixed inset-x-4 top-[15%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 rounded-3xl border border-white/[0.08] bg-[#0e1018] shadow-2xl"
              onClick={e=>e.stopPropagation()}>
              <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-white/[0.06]">
                <Calendar size={15} style={{color:SKY}}/>
                <p className="font-bold text-sm">Demande de congé / absence</p>
                <button onClick={()=>setShowLeaveModal(false)} className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"><X size={15}/></button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/35 uppercase tracking-wide">Membre</label>
                  <select value={lForm.member_id??""} onChange={e=>setLForm(p=>({...p,member_id:e.target.value}))}
                    className="w-full cursor-pointer bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                    <option value="" className="bg-[#0e1018]">— Choisir un membre</option>
                    {members.map(m=><option key={m.id} value={m.id} className="bg-[#0e1018]">{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/35 uppercase tracking-wide">Type</label>
                  <select value={lForm.type??"vacation"} onChange={e=>setLForm(p=>({...p,type:e.target.value as LeaveType}))}
                    className="w-full cursor-pointer bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                    {LEAVE_TYPES.map(t=><option key={t.v} value={t.v} className="bg-[#0e1018]">{t.e} {t.l}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{l:"Début",k:"start_date"},{l:"Fin",k:"end_date"}].map(f=>(
                    <div key={f.k} className="space-y-1">
                      <label className="text-[10px] text-white/35 uppercase tracking-wide">{f.l}</label>
                      <input type="date" value={(lForm as Record<string,string>)[f.k]??""} onChange={e=>setLForm(p=>({...p,[f.k]:e.target.value}))}
                        className="w-full bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
                    </div>
                  ))}
                </div>
                <input value={lForm.reason??""} onChange={e=>setLForm(p=>({...p,reason:e.target.value}))}
                  placeholder="Motif (optionnel)"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"/>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
                <button onClick={()=>setShowLeaveModal(false)} className="px-4 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">Annuler</button>
                <button onClick={saveLeave} disabled={savingL||!lForm.member_id||!lForm.start_date||!lForm.end_date}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                  style={{background:SKY,color:"#fff"}}>
                  {savingL ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                  {savingL ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════
          MEETING MODAL
      ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showMeetModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={()=>setShowMeetModal(false)}/>
            <motion.div
              initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0}}
              className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 rounded-3xl border border-white/[0.08] bg-[#0e1018] shadow-2xl"
              onClick={e=>e.stopPropagation()}>
              <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-white/[0.06]">
                <Video size={15} style={{color:SKY}}/>
                <p className="font-bold text-sm">Planifier une réunion</p>
                <button onClick={()=>setShowMeetModal(false)} className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"><X size={15}/></button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <input value={meetForm.title??""} onChange={e=>setMeetForm(p=>({...p,title:e.target.value}))}
                  placeholder="Titre de la réunion *"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-sky-500/40"/>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Date & heure</label>
                    <input type="datetime-local" value={meetForm.date_at??""} onChange={e=>setMeetForm(p=>({...p,date_at:e.target.value}))}
                      className="w-full bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Durée (min)</label>
                    <input type="number" value={meetForm.duration_minutes??60} onChange={e=>setMeetForm(p=>({...p,duration_minutes:Number(e.target.value)}))}
                      min={15} max={480} step={15}
                      className="w-full bg-[#0e1018] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
                  </div>
                </div>
                <input value={meetForm.meet_link??""} onChange={e=>setMeetForm(p=>({...p,meet_link:e.target.value}))}
                  placeholder="Lien visio (Google Meet, Zoom…)"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"/>
                <input
                  value={(meetForm.participants??[]).join(", ")}
                  onChange={e=>setMeetForm(p=>({...p,participants:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}))}
                  placeholder="Participants (séparés par virgule)"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"/>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
                <button onClick={()=>setShowMeetModal(false)} className="px-4 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">Annuler</button>
                <button onClick={saveMeeting} disabled={savingMeet||!meetForm.title?.trim()||!meetForm.date_at}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                  style={{background:SKY,color:"#fff"}}>
                  {savingMeet ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                  {savingMeet ? "Sauvegarde…" : "Créer la réunion"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
