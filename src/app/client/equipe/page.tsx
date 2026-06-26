"use client";

import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, X, Check, Loader2, MessageSquare,
  CheckSquare, Briefcase, Trash2, User, Mail, Phone,
  Building, Calendar, Sparkles, Zap, Send, Search,
  Edit2, ChevronDown, Star, AlertCircle, Clock,
  Video, Hash, AtSign, MoreHorizontal,
  Umbrella, Thermometer, BookOpen, FileText,
  BarChart2, AlertTriangle, RefreshCw, Target, Folder,
  Key, Copy, ShieldCheck, ShieldOff,
  Award, Network, ChevronLeft, ChevronRight, Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

type MemberRole   = "admin"|"manager"|"employee"|"accountant"|"extern";
type MemberStatus = "active"|"away"|"leave"|"inactive";
type TaskStatus   = "todo"|"in_progress"|"done"|"late";
type TaskPriority = "low"|"normal"|"high"|"urgent";
type AppTab       = "members"|"tasks"|"chat"|"hr"|"orga"|"evals";
type LeaveType    = "vacation"|"sick"|"personal"|"training"|"other";
type LeaveStatus  = "pending"|"approved"|"rejected";

interface TeamMember {
  id:string; name:string; email:string; phone:string;
  position:string; department:string; role:MemberRole;
  status:MemberStatus; avatar_color:string;
  entry_date:string|null; notes:string; created_at:string;
  auth_user_id?:string|null;
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

const LEAVE_TYPES: { v:LeaveType; l:string; icon:LucideIcon }[] = [
  { v:"vacation", l:"Congés payés",   icon: Umbrella },
  { v:"sick",     l:"Maladie",        icon: Thermometer },
  { v:"personal", l:"Personnel",      icon: User },
  { v:"training", l:"Formation",      icon: BookOpen },
  { v:"other",    l:"Autre",          icon: FileText },
];

const CHANNELS = ["général","dev","design","marketing","direction","rh"];

const AVATAR_COLORS = [
  "#6366f1","#f59e0b","#10b981","#f87171",
  "#60a5fa","#c084fc","#fb923c","#f472b6","#34d399","#0ea5e9",
];

const TABS: { k:AppTab; l:string; icon:LucideIcon }[] = [
  { k:"members", l:"Membres",  icon: Users        },
  { k:"tasks",   l:"Tâches",   icon: CheckSquare  },
  { k:"chat",    l:"Chat",     icon: MessageSquare},
  { k:"hr",      l:"RH",       icon: Briefcase    },
  { k:"orga",    l:"Organi.",  icon: Network      },
  { k:"evals",   l:"Évals",    icon: Award        },
];

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

interface Evaluation {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  score: number;
  notes: string;
}

const EVAL_KEY = "equipe_evaluations_v1";
const TS_KEY   = "equipe_timesheet_v1";

function loadEvals(): Evaluation[] {
  try { return JSON.parse(localStorage.getItem(EVAL_KEY) ?? "[]") as Evaluation[]; }
  catch { return []; }
}
function saveEvals(evs: Evaluation[]) { localStorage.setItem(EVAL_KEY, JSON.stringify(evs)); }

function loadTimesheet(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(TS_KEY) ?? "{}") as Record<string, number>; }
  catch { return {}; }
}
function saveTimesheet(ts: Record<string, number>) { localStorage.setItem(TS_KEY, JSON.stringify(ts)); }

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

function Avatar({ name, color, size=36 }: { name:string; color:string; size?:number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-bold shrink-0 select-none"
      style={{ width:size, height:size, background:`${color}30`, color, border:`2px solid ${color}50`, fontSize:size*0.35 }}>
      {initials(name)}
    </div>
  );
}

export default function EquipePage() {
  const router = useRouter();
    const [tab,      setTab]      = useState<AppTab>("members");
  const [members,  setMembers]  = useState<TeamMember[]>([]);
  const [tasks,    setTasks]    = useState<TeamTask[]>([]);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [leaves,   setLeaves]   = useState<TeamLeave[]>([]);
  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const { toasts, add: toast, remove: removeToast } = useToastStack();

    const [showMemberModal, setShowMemberModal] = useState(false);
  const [editMember,      setEditMember]      = useState<TeamMember|null>(null);
  const [mForm,           setMForm]           = useState<Partial<TeamMember>>({});
  const [savingM,         setSavingM]         = useState(false);
  const [mFormError,      setMFormError]      = useState<string|null>(null);

    const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask,      setEditTask]      = useState<TeamTask|null>(null);
  const [tForm,         setTForm]         = useState<Partial<TeamTask>>({});
  const [savingT,       setSavingT]       = useState(false);
  const [quickTask,     setQuickTask]     = useState("");
  const [qTaskCol,      setQTaskCol]      = useState<TaskStatus>("todo");

    const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [lForm,          setLForm]          = useState<Partial<TeamLeave>>({});
  const [savingL,        setSavingL]        = useState(false);

    const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetForm,      setMeetForm]      = useState<Partial<TeamMeeting>>({});
  const [savingMeet,    setSavingMeet]    = useState(false);

    const [chatMsg,     setChatMsg]    = useState("");
  const [chatChannel, setChatChannel]= useState("général");
  const [mySenderName,setMySenderName]= useState("");
  const [sendingMsg,  setSendingMsg]  = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

    const [showAI,   setShowAI]   = useState(false);
  const [aiLoad,   setAiLoad]   = useState(false);
  const [aiResult, setAiResult] = useState("");

    const [credTarget,  setCredTarget]  = useState<TeamMember|null>(null);
  const [credEmail,   setCredEmail]   = useState("");
  const [credPwd,     setCredPwd]     = useState("");
  const [creatingCred,setCreatingCred]= useState(false);
  const [credResult,  setCredResult]  = useState<{email:string;password:string;needsConfirmation:boolean}|null>(null);

  function genPassword() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
    return "Djama-" + Array.from({length:7}, ()=>chars[Math.floor(Math.random()*chars.length)]).join("");
  }

  function openCredModal(m: TeamMember) {
    setCredTarget(m);
    setCredEmail(m.email ?? "");
    setCredPwd(genPassword());
    setCredResult(null);
  }

  async function createMemberAccount() {
    if (!credTarget || !credEmail.trim() || !credPwd.trim()) return;
    setCreatingCred(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const chefId = currentUser?.id ?? "";
      const res = await fetch("/api/equipe/create-member-account", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ memberId:credTarget.id, name:credTarget.name, email:credEmail.trim(), password:credPwd.trim(), chefId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast(err.error ?? "Erreur création compte", "error");
      } else {
        const data = await res.json() as { auth_user_id?: string; needs_confirmation?: boolean };
        setCredResult({ email:credEmail.trim(), password:credPwd.trim(), needsConfirmation:!!data.needs_confirmation });
        setMembers(p=>p.map(m=>m.id===credTarget.id ? {...m,auth_user_id:data.auth_user_id} : m));
        toast("Compte créé avec succès !", "success");
      }
    } catch { toast("Erreur réseau", "error"); }
    finally { setCreatingCred(false); }
  }

    const load = useCallback(async () => {
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const uid = user.id;
      const [mR,tkR,msgR,lR,mrR] = await Promise.all([
        supabase.from("team_members").select("*").eq("user_id",uid).order("name").limit(200),
        supabase.from("team_tasks").select("*").eq("user_id",uid).order("created_at",{ascending:false}).limit(500),
        supabase.from("team_messages").select("*").eq("user_id",uid).order("created_at").limit(200),
        supabase.from("team_leaves").select("*").eq("user_id",uid).order("start_date",{ascending:false}).limit(200),
        supabase.from("team_meetings").select("*").eq("user_id",uid).order("date_at").limit(200),
      ]);
      setMembers((mR.data??[]).map(r=>parseMember(r as Record<string,unknown>)));
      setTasks((tkR.data??[]).map(r=>parseTask(r as Record<string,unknown>)));
      setMessages((msgR.data??[]) as TeamMessage[]);
      setLeaves((lR.data??[]) as TeamLeave[]);
      setMeetings((mrR.data??[]) as TeamMeeting[]);
    } catch {
      toast("Erreur réseau — impossible de charger l'équipe", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(()=>{ load(); },[load]);

  useEffect(()=>{
    if (tab==="chat") setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:"smooth"}),100);
  },[tab, messages]);

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

  /* ── Evaluations ── */
  const [evals,        setEvals]        = useState<Evaluation[]>([]);
  const [evalForm,     setEvalForm]     = useState<Partial<Evaluation>>({ score:3 });
  const [showEvalForm, setShowEvalForm] = useState(false);

  /* ── Timesheet ── */
  const [tsData,    setTsData]    = useState<Record<string,number>>({});
  const [tsWeekOff, setTsWeekOff] = useState(0);

  /* ── Agenda absences ── */
  const [agMon,  setAgMon]  = useState(()=>new Date().getMonth());
  const [agYear, setAgYear] = useState(()=>new Date().getFullYear());

  useEffect(()=>{ setEvals(loadEvals()); setTsData(loadTimesheet()); }, []);

  const evalsByMember = useMemo(()=>{
    const map = new Map<string,{sum:number;count:number}>();
    for (const ev of evals) {
      const p = map.get(ev.memberId) ?? {sum:0,count:0};
      map.set(ev.memberId, {sum:p.sum+ev.score, count:p.count+1});
    }
    return map;
  }, [evals]);

  const tsWeekDays = useMemo(()=>{
    const today = new Date();
    const dow = today.getDay()===0 ? 6 : today.getDay()-1;
    const mon = new Date(today);
    mon.setDate(today.getDate() - dow + tsWeekOff*7);
    return Array.from({length:7},(_,i)=>{
      const d = new Date(mon); d.setDate(mon.getDate()+i);
      return d.toISOString().slice(0,10);
    });
  }, [tsWeekOff]);

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
    if (!mForm.name?.trim()) { setMFormError("Le nom est requis."); return; }
    setMFormError(null);
    setSavingM(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSavingM(false); setMFormError("Non connecté. Rechargez la page."); return; }
    const { auth_user_id: _omit, id: _id, created_at: _ca, ...cleanForm } = mForm as TeamMember & { auth_user_id?: string|null };
    if (editMember) {
      const { data, error } = await supabase.from("team_members").update(cleanForm).eq("id",editMember.id).select().single();
      if (error) { setSavingM(false); setMFormError(error.message); return; }
      if (data) setMembers(p=>p.map(m=>m.id===editMember.id ? parseMember(data as Record<string,unknown>) : m));
    } else {
      const { data, error } = await supabase.from("team_members").insert({...cleanForm,user_id:user.id}).select().single();
      if (error) { setSavingM(false); setMFormError(error.message); return; }
      if (data) setMembers(p=>[parseMember(data as Record<string,unknown>),...p]);
    }
    setSavingM(false); setShowMemberModal(false); setMFormError(null);
    toast(editMember ? "Membre mis à jour" : "Membre ajouté", "success");
  }
  async function deleteMember(id:string) {
    const { error } = await supabase.from("team_members").delete().eq("id",id);
    if (error) { toast("Erreur lors de la suppression", "error"); return; }
    setMembers(p=>p.filter(m=>m.id!==id));
    setShowMemberModal(false);
    toast("Membre supprimé", "success");
  }

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
      const { data, error } = await supabase.from("team_tasks").update(payload).eq("id",editTask.id).select().single();
      if (error) { toast("Erreur lors de la mise à jour", "error"); setSavingT(false); return; }
      if (data) setTasks(p=>p.map(t=>t.id===editTask.id?parseTask(data as Record<string,unknown>):t));
    } else {
      const { data, error } = await supabase.from("team_tasks").insert({...payload,user_id:user.id}).select().single();
      if (error) { toast("Erreur lors de la création", "error"); setSavingT(false); return; }
      if (data) setTasks(p=>[parseTask(data as Record<string,unknown>),...p]);
    }
    setSavingT(false); setShowTaskModal(false);
    toast(editTask ? "Tâche mise à jour" : "Tâche créée", "success");
  }
  async function deleteTask(id:string) {
    const { error } = await supabase.from("team_tasks").delete().eq("id",id);
    if (error) { toast("Erreur lors de la suppression", "error"); return; }
    setTasks(p=>p.filter(t=>t.id!==id));
  }
  async function changeTaskStatus(id:string, status:TaskStatus) {
    const { error } = await supabase.from("team_tasks").update({status}).eq("id",id);
    if (error) { toast("Erreur lors du changement de statut", "error"); return; }
    setTasks(p=>p.map(t=>t.id===id?{...t,status}:t));
  }
  async function quickAddTask() {
    if (!quickTask.trim()) return;
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: taskErr } = await supabase.from("team_tasks").insert({
      user_id:user.id, title:quickTask.trim(), status:qTaskCol,
      priority:"normal",
    }).select().single();
    if (taskErr) { toast("Erreur lors de la création de la tâche", "error"); return; }
    if (data) setTasks(p=>[parseTask(data as Record<string,unknown>),...p]);
    setQuickTask("");
  }

    async function sendMessage() {
    if (!chatMsg.trim() || !mySenderName.trim()) return;
    setSendingMsg(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSendingMsg(false); return; }
    const { data, error } = await supabase.from("team_messages").insert({
      user_id:user.id, sender_name:mySenderName.trim(),
      content:chatMsg.trim(), channel:chatChannel,
    }).select().single();
    if (error) { toast("Erreur lors de l'envoi", "error"); setSendingMsg(false); return; }
    if (data) setMessages(p=>[...p, data as TeamMessage]);
    setChatMsg(""); setSendingMsg(false);
  }

    async function saveLeave() {
    if (!lForm.member_id || !lForm.start_date || !lForm.end_date) return;
    setSavingL(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSavingL(false); return; }
    const mem = members.find(m=>m.id===lForm.member_id);
    const { data, error } = await supabase.from("team_leaves").insert({
      ...lForm, user_id:user.id, member_name: mem?.name ?? lForm.member_name ?? "", status:"pending",
    }).select().single();
    if (error) { toast("Erreur lors de la demande de congé", "error"); setSavingL(false); return; }
    if (data) setLeaves(p=>[data as TeamLeave,...p]);
    setSavingL(false); setShowLeaveModal(false);
    toast("Demande de congé envoyée", "success");
  }
  async function updateLeaveStatus(id:string, status:LeaveStatus) {
    const { error } = await supabase.from("team_leaves").update({status}).eq("id",id);
    if (error) { toast("Erreur lors de la mise à jour du congé", "error"); return; }
    setLeaves(p=>p.map(l=>l.id===id?{...l,status}:l));
  }

    async function saveMeeting() {
    if (!meetForm.title?.trim() || !meetForm.date_at) return;
    setSavingMeet(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSavingMeet(false); return; }
    const { data, error } = await supabase.from("team_meetings").insert({
      ...meetForm, user_id:user.id,
      duration_minutes: meetForm.duration_minutes ?? 60,
      participants: meetForm.participants ?? [],
    }).select().single();
    if (error) { toast("Erreur lors de la création de la réunion", "error"); setSavingMeet(false); return; }
    if (data) setMeetings(p=>[data as TeamMeeting,...p]);
    setSavingMeet(false); setShowMeetModal(false);
    toast("Réunion créée", "success");
  }

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
      if (!r.ok) { setAiResult(j.error ?? `Erreur ${r.status}`); return; }
      setAiResult(j.result ?? j.error ?? "Erreur");
    } catch { setAiResult("Erreur réseau"); }
    finally { setAiLoad(false); }
  }

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

    function renderMembers() {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
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

                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <button
                        onClick={e=>{e.stopPropagation();openCredModal(m);}}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-medium transition-all"
                        style={m.auth_user_id
                          ? {background:"rgba(16,185,129,0.08)",color:"#10b981",border:"1px solid rgba(16,185,129,0.2)"}
                          : {background:"rgba(201,165,90,0.08)",color:"#c9a55a",border:"1px solid rgba(201,165,90,0.2)"}}>
                        {m.auth_user_id ? <ShieldCheck size={11}/> : <Key size={11}/>}
                        {m.auth_user_id ? "Compte actif" : "Créer identifiants"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

    function renderTasks() {
    return (
      <div className="flex gap-4 overflow-x-auto flex-1 p-5 pb-4">
        {TASK_COLS.map(col=>{
          const colTasks = tasks.filter(t=>t.status===col.k);
          return (
            <div key={col.k} className="w-72 xl:w-80 shrink-0 flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-2.5 h-2.5 rounded-full" style={{background:col.c}}/>
                <span className="text-sm font-bold text-white/70">{col.l}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/35">{colTasks.length}</span>
                <button onClick={()=>openNewTask(col.k)}
                  className="p-1 rounded-lg text-white/25 hover:text-white hover:bg-white/10 transition-all">
                  <Plus size={13}/>
                </button>
              </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <AnimatePresence>
                  {colTasks.map(t=>{
                    const prio   = PRIOS.find(p=>p.v===t.priority);
                    const member = members.find(m=>m.id===t.assigned_to);
                    const isLate = t.due_date && new Date(t.due_date) < new Date() && t.status !== "done";
                    return (
                      <motion.div key={t.id} layout
                        initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        className="group rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 cursor-pointer hover:border-white/15 transition-all"
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
                          <p className="text-[10px] text-white/30 mt-1 ml-4 flex items-center gap-1">
                            <Folder size={9}/>{t.project}
                          </p>
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

    function renderChat() {
    return (
      <div className="flex flex-1 overflow-hidden">
                <div className="w-48 shrink-0 border-r border-white/[0.06] bg-white/[0.025] p-3 space-y-1">
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

                <div className="flex flex-col flex-1 min-w-0">
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2 shrink-0">
            <Hash size={14} className="text-white/30"/>
            <span className="font-bold text-sm text-white/80">{chatChannel}</span>
            <span className="text-xs text-white/25 ml-auto">{channelMessages.length} messages</span>
          </div>

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

    function renderHR() {
    const upcomingMeetings = meetings.filter(m=>m.status==="planned"&&new Date(m.date_at)>new Date()).slice(0,5);

    // Agenda absences: build calendar grid for agMon/agYear
    const firstDay = new Date(agYear, agMon, 1);
    const lastDay  = new Date(agYear, agMon+1, 0);
    // Monday-first offset
    const startDow = firstDay.getDay()===0 ? 6 : firstDay.getDay()-1;
    const totalCells = startDow + lastDay.getDate();
    const weeks = Math.ceil(totalCells / 7);
    const calCells: (number|null)[] = Array.from({length: weeks*7}, (_,i)=> {
      const d = i - startDow + 1;
      return (d >= 1 && d <= lastDay.getDate()) ? d : null;
    });

    // Set of "day ISO" → leave color for approved leaves in this month
    const leaveDays = new Map<string,{name:string;color:string}[]>();
    for (const l of leaves) {
      if (l.status === "rejected") continue;
      const s = new Date(l.start_date); const e = new Date(l.end_date);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
        if (d.getMonth() !== agMon || d.getFullYear() !== agYear) continue;
        const key = d.toISOString().slice(0,10);
        const arr = leaveDays.get(key) ?? [];
        const LEAVE_COLORS:Record<string,string> = {vacation:"#0ea5e9",sick:"#f87171",personal:"#a78bfa",training:"#34d399"};
        arr.push({name: l.member_name, color: LEAVE_COLORS[l.type] ?? "#0ea5e9"});
        leaveDays.set(key, arr);
      }
    }

    // Timesheet: export helper
    function exportTimesheet() {
      const lines = ["Membre;" + tsWeekDays.join(";") + ";Total"];
      for (const m of members) {
        const hrs = tsWeekDays.map(d => tsData[`${m.id}_${d}`] ?? 0);
        const total = hrs.reduce((a,b)=>a+b,0);
        lines.push(`"${m.name}";` + hrs.join(";") + `;${total}`);
      }
      const blob = new Blob(["﻿"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download="feuille_de_temps.csv"; a.click(); URL.revokeObjectURL(url);
    }

    return (
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Row 1: 2-col grid */}
        <div className="grid gap-6 lg:grid-cols-2">
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
                    {lt && <lt.icon size={16} className="text-white/40 shrink-0"/>}
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
                        <p className="text-[10px] text-white/25 mt-1 flex items-center gap-1">
                          <Users size={9}/>{m.participants.join(", ")}
                        </p>
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

        {/* Agenda absences — monthly calendar */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white/70 flex items-center gap-2">
              <Calendar size={15}/>Agenda absences
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={()=>{ if(agMon===0){setAgMon(11);setAgYear(y=>y-1);}else setAgMon(m=>m-1); }}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
                <ChevronLeft size={14}/>
              </button>
              <span className="text-xs font-bold text-white/60 w-24 text-center">
                {new Date(agYear,agMon,1).toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
              </span>
              <button onClick={()=>{ if(agMon===11){setAgMon(0);setAgYear(y=>y+1);}else setAgMon(m=>m+1); }}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
                <ChevronRight size={14}/>
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="grid grid-cols-7 mb-2">
              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d=>(
                <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-white/25 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calCells.map((day,idx)=>{
                if (!day) return <div key={idx}/>;
                const iso = `${agYear}-${String(agMon+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const leaveInfo = leaveDays.get(iso);
                const isToday = iso === new Date().toISOString().slice(0,10);
                return (
                  <div key={idx} className="relative flex flex-col items-center py-1.5 rounded-lg transition-all group"
                    style={{
                      background: leaveInfo ? `${leaveInfo[0].color}18` : "transparent",
                      border: isToday ? `1px solid ${SKY}60` : "1px solid transparent",
                    }}>
                    <span className="text-[11px] font-semibold"
                      style={{color: isToday ? SKY : leaveInfo ? "#fff" : "rgba(255,255,255,0.45)"}}>
                      {day}
                    </span>
                    {leaveInfo && (
                      <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
                        {leaveInfo.slice(0,3).map((li,i)=>(
                          <div key={i} className="w-1 h-1 rounded-full" style={{background:li.color}}/>
                        ))}
                      </div>
                    )}
                    {/* Tooltip on hover */}
                    {leaveInfo && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="rounded-lg border border-white/15 bg-[#1a2030] px-2.5 py-1.5 text-[10px] text-white/80 whitespace-nowrap shadow-xl">
                          {leaveInfo.map(li=>li.name).join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            {leaveDays.size > 0 && (
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
                {Array.from(new Set(leaves.filter(l=>l.status!=="rejected").map(l=>l.member_name))).slice(0,6).map(name=>{
                  const l = leaves.find(x=>x.member_name===name);
                  const LEAVE_COLORS2:Record<string,string> = {vacation:"#0ea5e9",sick:"#f87171",personal:"#a78bfa",training:"#34d399"};
                  const dotColor = l ? (LEAVE_COLORS2[l.type] ?? SKY) : SKY;
                  return (
                    <div key={name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{background:dotColor}}/>
                      <span className="text-[10px] text-white/40">{name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Feuille de temps — weekly grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white/70 flex items-center gap-2">
              <Clock size={15}/>Feuille de temps
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button onClick={()=>setTsWeekOff(w=>w-1)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
                  <ChevronLeft size={14}/>
                </button>
                <span className="text-xs text-white/50 w-28 text-center">
                  {new Date(tsWeekDays[0]).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
                  {" – "}
                  {new Date(tsWeekDays[6]).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
                </span>
                <button onClick={()=>setTsWeekOff(w=>w+1)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
                  <ChevronRight size={14}/>
                </button>
              </div>
              {members.length>0 && (
                <button onClick={exportTimesheet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all">
                  <Download size={11}/>CSV
                </button>
              )}
            </div>
          </div>
          {members.length === 0 ? (
            <p className="text-sm text-white/25 py-6 text-center">Ajoutez des membres pour saisir leurs heures</p>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-2.5 text-white/30 font-semibold w-36">Membre</th>
                    {tsWeekDays.map(d=>(
                      <th key={d} className="px-2 py-2.5 text-center font-semibold"
                        style={{color:d===new Date().toISOString().slice(0,10)?SKY:"rgba(255,255,255,0.3)"}}>
                        <span className="block text-[9px] uppercase">{new Date(d).toLocaleDateString("fr-FR",{weekday:"short"})}</span>
                        <span>{new Date(d).getDate()}</span>
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center text-white/30 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m,mi)=>{
                    const hrs = tsWeekDays.map(d => tsData[`${m.id}_${d}`] ?? 0);
                    const total = hrs.reduce((a,b)=>a+b,0);
                    return (
                      <tr key={m.id} className={mi%2===0?"bg-white/[0.01]":""}>
                        <td className="px-4 py-2 font-semibold text-white/70 truncate max-w-[9rem]">
                          <div className="flex items-center gap-2">
                            <Avatar name={m.name} color={m.avatar_color} size={20}/>
                            <span className="truncate">{m.name}</span>
                          </div>
                        </td>
                        {tsWeekDays.map(d=>{
                          const key = `${m.id}_${d}`;
                          return (
                            <td key={d} className="px-1 py-1 text-center">
                              <input type="number" min={0} max={24} step={0.5}
                                value={tsData[key] ?? ""}
                                placeholder="—"
                                onChange={e=>{
                                  const v = parseFloat(e.target.value);
                                  const updated = {...tsData};
                                  if (isNaN(v) || e.target.value==="") { delete updated[key]; }
                                  else { updated[key] = Math.min(24, Math.max(0, v)); }
                                  setTsData(updated); saveTimesheet(updated);
                                }}
                                className="w-10 text-center bg-transparent border border-transparent rounded-lg py-1 text-white/60 placeholder:text-white/15 focus:outline-none focus:border-sky-500/30 focus:bg-white/5 transition-all hover:border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center font-bold"
                          style={{color:total>0?SKY:"rgba(255,255,255,0.2)"}}>
                          {total > 0 ? `${total}h` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr className="border-t border-white/5 bg-white/[0.015]">
                    <td className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/25">Total</td>
                    {tsWeekDays.map(d=>{
                      const dayTotal = members.reduce((sum,m)=>(sum + (tsData[`${m.id}_${d}`] ?? 0)),0);
                      return (
                        <td key={d} className="px-1 py-2 text-center text-[11px] font-bold"
                          style={{color:dayTotal>0?"#34d399":"rgba(255,255,255,0.15)"}}>
                          {dayTotal > 0 ? `${dayTotal}h` : "—"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center text-[11px] font-black" style={{color:"#34d399"}}>
                      {members.reduce((sum,m)=>sum+tsWeekDays.reduce((s,d)=>s+(tsData[`${m.id}_${d}`]??0),0),0)}h
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderOrga() {
    const TIERS: {role:MemberRole;l:string;bg:string}[] = [
      {role:"admin",      l:"Direction",  bg:"#c084fc"},
      {role:"manager",    l:"Management", bg:"#60a5fa"},
      {role:"accountant", l:"Support",    bg:"#34d399"},
      {role:"employee",   l:"Équipe",     bg:SKY      },
      {role:"extern",     l:"Externes",   bg:"#fb923c"},
    ];
    const byRole: Record<MemberRole, TeamMember[]> = {admin:[],manager:[],accountant:[],employee:[],extern:[]};
    for (const m of members) byRole[m.role ?? "employee"].push(m);
    const activeTiers = TIERS.filter(t => byRole[t.role].length > 0);

    if (members.length === 0) return (
      <div className="flex flex-1 items-center justify-center flex-col gap-4 py-20">
        <Network size={32} className="text-white/15"/><p className="text-white/35 text-sm">Aucun membre — ajoutez-en d&apos;abord</p>
      </div>
    );

    return (
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {activeTiers.map((tier, ti) => (
          <div key={tier.role}>
            <div className="flex items-center gap-3 mb-4">
              {ti > 0 && <div className="absolute left-1/2 -translate-x-1/2 w-px h-6 bg-white/8" style={{position:"absolute"}}/>}
              <div className="h-px flex-1 bg-white/5"/>
              <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border"
                style={{color:tier.bg,borderColor:`${tier.bg}40`,background:`${tier.bg}10`}}>{tier.l}</span>
              <div className="h-px flex-1 bg-white/5"/>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {byRole[tier.role].map(m => {
                const role   = ROLES.find(r=>r.v===m.role);
                const status = STATUSES.find(s=>s.v===m.status);
                const mTasks = tasks.filter(t=>t.assigned_to===m.id&&t.status!=="done").length;
                const ev     = evalsByMember.get(m.id);
                return (
                  <motion.div key={m.id} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 w-36 cursor-pointer hover:border-white/15 hover:bg-white/5 transition-all"
                    onClick={()=>openEditMember(m)}>
                    <div className="relative">
                      <Avatar name={m.name} color={m.avatar_color} size={44}/>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#07080e]"
                        style={{background:status?.c??SKY}}/>
                    </div>
                    <div className="text-center min-w-0 w-full">
                      <p className="text-[12px] font-bold text-white truncate">{m.name}</p>
                      <p className="text-[10px] text-white/40 truncate">{m.position || role?.l}</p>
                      <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                        {mTasks>0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{mTasks} tâche{mTasks>1?"s":""}</span>}
                        {ev && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/12 text-yellow-400">★ {(ev.sum/ev.count).toFixed(1)}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderEvals() {
    function saveEval() {
      if (!evalForm.memberId) return;
      const mem  = members.find(m=>m.id===evalForm.memberId);
      const entry: Evaluation = {
        id: Math.random().toString(36).slice(2,10),
        memberId:   evalForm.memberId!,
        memberName: mem?.name ?? "",
        date:       new Date().toISOString().slice(0,10),
        score:      evalForm.score ?? 3,
        notes:      evalForm.notes ?? "",
      };
      const updated = [entry, ...evals];
      setEvals(updated); saveEvals(updated);
      setShowEvalForm(false); setEvalForm({score:3});
    }

    function deleteEval(id: string) {
      const updated = evals.filter(e=>e.id!==id);
      setEvals(updated); saveEvals(updated);
    }

    function exportEvalCSV() {
      const lines = ["Membre;Date;Note;Commentaires"];
      for (const ev of evals) lines.push(`"${ev.memberName}";"${ev.date}";${ev.score};"${ev.notes.replace(/"/g,'""')}"`);
      const blob = new Blob(["﻿"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download="evaluations.csv"; a.click(); URL.revokeObjectURL(url);
    }

    return (
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">{evals.length} évaluation{evals.length!==1?"s":""}</p>
          <div className="flex gap-2">
            {evals.length>0&&<button onClick={exportEvalCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"><Download size={11}/>CSV</button>}
            <button onClick={()=>{setEvalForm({score:3});setShowEvalForm(v=>!v);}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{background:`${SKY}18`,border:`1px solid ${SKY}30`,color:SKY}}>
              <Plus size={12}/>Évaluation
            </button>
          </div>
        </div>

        {/* New eval form */}
        <AnimatePresence>
          {showEvalForm && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <p className="text-xs font-semibold text-white/50">Nouvelle évaluation</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30 uppercase tracking-wide">Membre</label>
                  <select value={evalForm.memberId??""} onChange={e=>setEvalForm(p=>({...p,memberId:e.target.value}))}
                    className="w-full cursor-pointer bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                    <option value="" className="bg-[#0e1420]">— Choisir</option>
                    {members.map(m=><option key={m.id} value={m.id} className="bg-[#0e1420]">{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30 uppercase tracking-wide">Note générale (1–5)</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.025] border border-white/[0.08] rounded-xl">
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>setEvalForm(p=>({...p,score:n}))}
                        className="transition-all hover:scale-110"
                        style={{color:(evalForm.score??3)>=n?"#f59e0b":"rgba(255,255,255,0.15)",fontSize:18}}>★</button>
                    ))}
                    <span className="ml-auto text-xs text-white/40">{evalForm.score}/5</span>
                  </div>
                </div>
              </div>
              <textarea value={evalForm.notes??""} onChange={e=>setEvalForm(p=>({...p,notes:e.target.value}))}
                placeholder="Points forts, axes d'amélioration, objectifs…" rows={3}
                className="w-full bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 placeholder:text-white/20 outline-none resize-none focus:border-sky-500/40"/>
              <div className="flex gap-2">
                <button onClick={saveEval} disabled={!evalForm.memberId}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all"
                  style={{background:SKY}}><Check size={12}/>Enregistrer</button>
                <button onClick={()=>setShowEvalForm(false)} className="px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">Annuler</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avg scores per member */}
        {evalsByMember.size > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {members.filter(m=>evalsByMember.has(m.id)).map(m=>{
              const ev = evalsByMember.get(m.id)!;
              const avg = ev.sum/ev.count;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
                  <Avatar name={m.name} color={m.avatar_color} size={36}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{m.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1,2,3,4,5].map(n=>(
                        <span key={n} style={{color:avg>=n?"#f59e0b":"rgba(255,255,255,0.12)",fontSize:12}}>★</span>
                      ))}
                      <span className="ml-1 text-[11px] text-white/40">{avg.toFixed(1)} ({ev.count})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Evaluations list */}
        {evals.length === 0 && !showEvalForm ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Award size={32} className="text-white/15"/>
            <p className="text-white/35 text-sm">Aucune évaluation enregistrée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {evals.map(ev=>{
              const m = members.find(x=>x.id===ev.memberId);
              return (
                <div key={ev.id} className="group flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3.5">
                  {m && <Avatar name={m.name} color={m.avatar_color} size={32}/>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white">{ev.memberName}</p>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(n=><span key={n} style={{color:ev.score>=n?"#f59e0b":"rgba(255,255,255,0.12)",fontSize:11}}>★</span>)}
                      </div>
                      <span className="ml-auto text-[10px] text-white/25">{fmtDate(ev.date)}</span>
                    </div>
                    {ev.notes && <p className="text-xs text-white/45 mt-1 leading-relaxed line-clamp-2">{ev.notes}</p>}
                  </div>
                  <button onClick={()=>deleteEval(ev.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={11}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

    return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#07080e] text-white overflow-hidden">
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* Animated header */}
      <div className="relative overflow-hidden shrink-0" style={{ background: "linear-gradient(160deg,#07080e,#0d1117,#07080e)" }}>
        <div className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#c9a55a,transparent)" }}/>
        <div className="pointer-events-none absolute -bottom-8 right-16 h-24 w-24 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle,#0ea5e9,transparent)" }}/>

        {/* Main row */}
        <div className="relative flex items-center gap-3 px-5 pt-4 pb-3 flex-wrap gap-y-2">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] shrink-0">
            <Users size={17} style={{ color: "#c9a55a" }}/>
          </motion.div>
          <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }} className="mr-auto">
            <h1 className="text-base font-bold text-white tracking-tight">Équipe</h1>
            <p className="text-[0.62rem] text-white/35">{members.length} membre{members.length!==1?"s":""} · {stats.active} actif{stats.active!==1?"s":""}</p>
          </motion.div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Chercher…"
              className="pl-8 pr-3 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a55a]/40 w-36 [color-scheme:dark]"/>
          </div>
          <button onClick={()=>setShowAI(p=>!p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${showAI
              ? "border-sky-500/50 bg-sky-500/20 text-sky-300"
              : "border-white/[0.08] text-white/50 hover:border-sky-500/30 hover:text-sky-300"}`}>
            <Sparkles size={12}/>IA Équipe
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={()=>{
              if (tab==="members") openNewMember();
              else if (tab==="tasks") openNewTask("todo");
              else if (tab==="hr") { setMeetForm({status:"planned",duration_minutes:60,participants:[]}); setShowMeetModal(true); }
              else if (tab==="evals") { setEvalForm({score:3}); setShowEvalForm(true); }
              else if (tab==="orga") openNewMember();
            }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a", boxShadow: "0 2px 12px rgba(201,165,90,0.28)" }}>
            <Plus size={13}/>
            {tab==="members"||tab==="orga" ? "Membre" : tab==="tasks" ? "Tâche" : tab==="hr" ? "Réunion" : tab==="evals" ? "Évaluation" : "Nouveau"}
          </motion.button>
        </div>

        {/* KPI strip */}
        <div className="relative px-5 pb-2">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Actifs",    value: stats.active,  icon: Users        },
              { label: "En cours",  value: stats.inProg,  icon: CheckSquare  },
              { label: "En retard", value: stats.late,    icon: AlertCircle  },
              { label: "En congé",  value: stats.onLeave, icon: Briefcase    },
            ].map((kpi, i) => {
              const KpiIcon = kpi.icon;
              return (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-white/[0.06] bg-white/[0.03]">
                  <KpiIcon size={11} style={{ color: "#c9a55a" }} className="shrink-0"/>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white leading-none">{kpi.value}</p>
                    <p className="text-[0.55rem] text-white/35 uppercase tracking-wide mt-0.5 truncate">{kpi.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="relative px-5 flex gap-0.5">
          {TABS.map(t => (
            <button key={t.k} onClick={()=>setTab(t.k)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all ${tab===t.k ? "text-white" : "text-white/35 hover:text-white/60"}`}>
              <t.icon size={12}/>{t.l}
              {t.k==="tasks" && stats.late > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{stats.late}</span>
              )}
              {t.k==="hr" && stats.pending > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{stats.pending}</span>
              )}
              {tab===t.k && (
                <motion.div layoutId="equipe-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "#c9a55a" }}/>
              )}
            </button>
          ))}
        </div>

        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),transparent)" }}/>
      </div>

      <AnimatePresence>
        {showAI && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            className="border-b border-white/[0.06] bg-white/[0.025] overflow-hidden shrink-0">
            <div className="px-5 py-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {([
                  {Icon:BarChart2,     l:"Résumer activité",  p:"Résume l'activité de l'équipe. Qui est productif ? Y a-t-il des blocages ?"},
                  {Icon:AlertTriangle, l:"Détecter surcharge", p:"Analyse la charge de travail. Y a-t-il des membres surchargés ? Qui a trop de tâches ?"},
                  {Icon:RefreshCw,     l:"Répartir tâches",   p:"Propose une meilleure répartition des tâches en cours selon les membres disponibles."},
                  {Icon:Target,        l:"Points clés RH",    p:"Quels sont les points RH importants à surveiller (congés, absentéisme, performance) ?"},
                ] as {Icon:LucideIcon;l:string;p:string}[]).map(a=>(
                  <button key={a.l} onClick={()=>runAI(a.p)} disabled={aiLoad}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/8 hover:border-white/20 text-white/55 hover:text-white transition-all disabled:opacity-40">
                    {aiLoad ? <Loader2 size={10} className="animate-spin"/> : <a.Icon size={10}/>}{a.l}
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
          {tab==="orga"    && renderOrga()}
          {tab==="evals"   && renderEvals()}
        </div>
      )}

            <AnimatePresence>
        {showMemberModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={()=>{setShowMemberModal(false);setMFormError(null);}}/>
            <motion.div
              initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="fixed inset-x-4 top-[5%] bottom-[5%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 rounded-3xl border border-white/[0.08] bg-white/[0.025] shadow-2xl flex flex-col overflow-hidden"
              onClick={e=>e.stopPropagation()}>

                            <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0 border-b border-white/[0.06]">
                {mForm.name && <Avatar name={mForm.name} color={mForm.avatar_color??SKY} size={40}/>}
                <div className="flex-1">
                  <p className="font-bold text-sm text-white">{editMember ? "Modifier le membre" : "Nouveau membre"}</p>
                  {editMember && <p className="text-xs text-white/35">Depuis le {fmtDate(editMember.created_at)}</p>}
                </div>
                <button onClick={()=>{setShowMemberModal(false);setMFormError(null);}} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                  <X size={15}/>
                </button>
              </div>

                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                                <div className="space-y-1">
                  <label className="text-[10px] text-white/35 uppercase tracking-wide">Nom complet *</label>
                  <input value={mForm.name??""} onChange={e=>{setMForm(p=>({...p,name:e.target.value}));setMFormError(null);}}
                    placeholder="Prénom Nom"
                    className={`w-full bg-white/[0.05] border rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none ${mFormError?"border-red-500/60 focus:border-red-500/80":"border-white/[0.08] focus:border-sky-500/40"}`}/>
                  {mFormError && <p className="text-xs text-red-400 mt-1">{mFormError}</p>}
                </div>

                                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Rôle</label>
                    <select value={mForm.role??"employee"} onChange={e=>setMForm(p=>({...p,role:e.target.value as MemberRole}))}
                      className="w-full cursor-pointer bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      {ROLES.map(r=><option key={r.v} value={r.v} className="bg-white/[0.025]">{r.l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Statut</label>
                    <select value={mForm.status??"active"} onChange={e=>setMForm(p=>({...p,status:e.target.value as MemberStatus}))}
                      className="w-full cursor-pointer bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      {STATUSES.map(s=><option key={s.v} value={s.v} className="bg-white/[0.025]">{s.l}</option>)}
                    </select>
                  </div>
                </div>

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

                                <div className="space-y-1">
                  <label className="text-[10px] text-white/35 uppercase tracking-wide">Date d&apos;entrée</label>
                  <input type="date" value={mForm.entry_date??""} onChange={e=>setMForm(p=>({...p,entry_date:e.target.value||null}))}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
                </div>

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

                            <div className="shrink-0 border-t border-white/[0.06]">
                {mFormError && (
                  <div className="px-5 pt-3 pb-0">
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{mFormError}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 px-5 py-4">
                {editMember && (
                  <button onClick={()=>deleteMember(editMember.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={13}/>Supprimer
                  </button>
                )}
                <button onClick={()=>{setShowMemberModal(false);setMFormError(null);}} className="ml-auto px-4 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">
                  Annuler
                </button>
                <button onClick={saveMember} disabled={savingM}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
                  style={{background:SKY,color:"#fff"}}>
                  {savingM ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                  {savingM ? "Sauvegarde…" : editMember ? "Mettre à jour" : "Ajouter"}
                </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

            <AnimatePresence>
        {showTaskModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={()=>setShowTaskModal(false)}/>
            <motion.div
              initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 rounded-3xl border border-white/[0.08] bg-white/[0.025] shadow-2xl flex flex-col overflow-hidden"
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
                      className="w-full cursor-pointer bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      <option value="" className="bg-white/[0.025]">— Non assignée</option>
                      {members.map(m=><option key={m.id} value={m.id} className="bg-white/[0.025]">{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Priorité</label>
                    <select value={tForm.priority??"normal"} onChange={e=>setTForm(p=>({...p,priority:e.target.value as TaskPriority}))}
                      className="w-full cursor-pointer bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      {PRIOS.map(p=><option key={p.v} value={p.v} className="bg-white/[0.025]">{p.l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Échéance</label>
                    <input type="date" value={tForm.due_date??""} onChange={e=>setTForm(p=>({...p,due_date:e.target.value||null}))}
                      className="w-full bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Statut</label>
                    <select value={tForm.status??"todo"} onChange={e=>setTForm(p=>({...p,status:e.target.value as TaskStatus}))}
                      className="w-full cursor-pointer bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                      {TASK_COLS.map(c=><option key={c.k} value={c.k} className="bg-white/[0.025]">{c.l}</option>)}
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

            <AnimatePresence>
        {showLeaveModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={()=>setShowLeaveModal(false)}/>
            <motion.div
              initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0}}
              className="fixed inset-x-4 top-[15%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 rounded-3xl border border-white/[0.08] bg-white/[0.025] shadow-2xl"
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
                    className="w-full cursor-pointer bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                    <option value="" className="bg-white/[0.025]">— Choisir un membre</option>
                    {members.map(m=><option key={m.id} value={m.id} className="bg-white/[0.025]">{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/35 uppercase tracking-wide">Type</label>
                  <select value={lForm.type??"vacation"} onChange={e=>setLForm(p=>({...p,type:e.target.value as LeaveType}))}
                    className="w-full cursor-pointer bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none appearance-none">
                    {LEAVE_TYPES.map(t=><option key={t.v} value={t.v} className="bg-white/[0.025]">{t.l}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{l:"Début",k:"start_date"},{l:"Fin",k:"end_date"}].map(f=>(
                    <div key={f.k} className="space-y-1">
                      <label className="text-[10px] text-white/35 uppercase tracking-wide">{f.l}</label>
                      <input type="date" value={(lForm as Record<string,string>)[f.k]??""} onChange={e=>setLForm(p=>({...p,[f.k]:e.target.value}))}
                        className="w-full bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
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

            <AnimatePresence>
        {showMeetModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={()=>setShowMeetModal(false)}/>
            <motion.div
              initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0}}
              className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 rounded-3xl border border-white/[0.08] bg-white/[0.025] shadow-2xl"
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
                      className="w-full bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/35 uppercase tracking-wide">Durée (min)</label>
                    <input type="number" value={meetForm.duration_minutes??60} onChange={e=>setMeetForm(p=>({...p,duration_minutes:Number(e.target.value)}))}
                      min={15} max={480} step={15}
                      className="w-full bg-white/[0.025] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none [color-scheme:dark]"/>
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

      {/* ── Modal Identifiants Membre ── */}
      <AnimatePresence>
        {credTarget && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50" onClick={()=>{setCredTarget(null);setCredResult(null);}}/>
            <motion.div
              initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="fixed inset-x-4 top-[15%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-[51] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden"
              style={{background:"#0f1520"}}
              onClick={e=>e.stopPropagation()}>

              <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/[0.07]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:"rgba(201,165,90,0.12)"}}>
                  <Key size={16} style={{color:"#c9a55a"}}/>
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Identifiants membre</p>
                  <p className="text-[11px] text-white/35">{credTarget.name}</p>
                </div>
                <button onClick={()=>{setCredTarget(null);setCredResult(null);}}
                  className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"><X size={15}/></button>
              </div>

              <div className="px-5 py-5 space-y-4">
                {!credResult ? (
                  <>
                    <p className="text-xs text-white/45 leading-relaxed">
                      Créez un compte pour <strong className="text-white/70">{credTarget.name}</strong>.
                      Il pourra se connecter sur <span className="text-[#c9a55a]">/membre/login</span> avec ces identifiants.
                    </p>
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/35 uppercase tracking-wide">Email</label>
                      <input value={credEmail} onChange={e=>setCredEmail(e.target.value)} type="email"
                        placeholder="email@exemple.com"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a55a]/40"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/35 uppercase tracking-wide">Mot de passe</label>
                      <div className="flex gap-2">
                        <input value={credPwd} onChange={e=>setCredPwd(e.target.value)}
                          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a55a]/40 font-mono tracking-wider"/>
                        <button onClick={()=>setCredPwd(genPassword())} title="Regénérer"
                          className="px-3 rounded-xl border border-white/[0.08] text-white/30 hover:text-white hover:bg-white/8 transition-all">
                          <RefreshCw size={13}/>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={()=>{setCredTarget(null);setCredResult(null);}}
                        className="px-4 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">Annuler</button>
                      <button onClick={createMemberAccount} disabled={creatingCred||!credEmail.trim()||!credPwd.trim()}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-all"
                        style={{background:"linear-gradient(135deg,#c9a55a,#b08d45)",color:"#0a0a0a"}}>
                        {creatingCred ? <Loader2 size={12} className="animate-spin"/> : <ShieldCheck size={12}/>}
                        {creatingCred ? "Création…" : "Créer le compte"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 p-3 rounded-2xl" style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)"}}>
                      <ShieldCheck size={16} className="text-emerald-400 shrink-0"/>
                      <p className="text-xs text-emerald-300 font-medium">Compte créé avec succès !</p>
                    </div>
                    {credResult?.needsConfirmation ? (
                      <div className="flex items-start gap-2 p-3 rounded-2xl" style={{background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)"}}>
                        <Mail size={14} className="text-amber-400 shrink-0 mt-0.5"/>
                        <p className="text-xs text-amber-300 leading-relaxed">
                          Le membre doit confirmer son email avant de se connecter.<br/>
                          Vérifiez aussi les spams.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 p-3 rounded-2xl" style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)"}}>
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5"/>
                        <p className="text-xs text-emerald-300 leading-relaxed">
                          Le membre peut se connecter <strong>immédiatement</strong> avec ces identifiants.
                        </p>
                      </div>
                    )}
                    <p className="text-[11px] text-white/40">Transmettez ces identifiants à <strong className="text-white/60">{credTarget.name}</strong> :</p>
                    {[
                      {l:"URL de connexion", v:typeof window !== "undefined" ? (window.location.hostname==="localhost"?"https://djama.space":window.location.origin)+"/membre/login" : "https://djama.space/membre/login"},
                      {l:"Email", v:credResult.email},
                      {l:"Mot de passe", v:credResult.password},
                    ].map(row=>(
                      <div key={row.l} className="space-y-1">
                        <label className="text-[10px] text-white/30 uppercase tracking-wide">{row.l}</label>
                        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5">
                          <span className="flex-1 text-sm text-white/80 font-mono truncate">{row.v}</span>
                          <button onClick={()=>{
                            try { navigator.clipboard.writeText(row.v); }
                            catch { const el=document.createElement("textarea"); el.value=row.v; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
                            toast("Copié !", "success");
                          }} className="text-white/25 hover:text-[#c9a55a] transition-all shrink-0">
                            <Copy size={13}/>
                          </button>
                        </div>
                      </div>
                    ))}
                    <button onClick={()=>{setCredTarget(null);setCredResult(null);}}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{background:"linear-gradient(135deg,#c9a55a,#b08d45)",color:"#0a0a0a"}}>
                      Fermer
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
