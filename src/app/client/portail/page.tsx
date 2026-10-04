"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Mail, Phone, Trash2, X, Loader2, FileText,
  CheckCircle2, Copy, Check, Edit3, Save, Send, MessageSquare,
  Users, ArrowUpRight, Building2, Upload, Download, ExternalLink,
  ShieldCheck, Key, Ban, Clock, RefreshCw, Eye, EyeOff,
  ToggleRight, Lock, Unlock, Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";
import { useTheme } from "@/lib/theme-context";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

/* ── Types ──────────────────────────────────────────────────────────────── */
type PortalStatus = "invited" | "active" | "suspended" | "expired";
type DrawerTab    = "info" | "permissions" | "factures" | "projets" | "documents" | "messages" | "activite";

interface PortalPermissions {
  factures:  boolean;
  projets:   boolean;
  documents: boolean;
  messages:  boolean;
  contrats:  boolean;
}

interface PortalAccess {
  id:                  string;
  user_id:             string;
  nom:                 string;
  email:               string;
  phone?:              string;
  entreprise?:         string;
  contact_id?:         string;
  portal_status:       PortalStatus;
  invitation_token?:   string;
  invitation_sent_at?: string;
  portal_activated_at?:string;
  portal_user_id?:     string;
  permissions:         PortalPermissions;
  welcome_message?:    string;
  derniere_connexion?: string;
  created_at:          string;
}

interface CrmContact {
  id:      string;
  name:    string;
  email?:  string;
  phone?:  string;
  company?:string;
}

interface PortailMsg { id: string; from: "admin"|"client"; text: string; date: string; }
interface PortailDoc { id: string; name: string; size: number; type: string; url: string; uploadedAt: string; uploadedBy: "admin"|"client"; }
interface LinkedDoc  { id: string; type: string; numero: string; sujet: string; total_ttc: number; statut: string; date_document: string; }
interface LinkedProj { id: string; nom: string; status: string; progress: number; color: string; end_date?: string; }
interface AuditEntry { id: string; action: string; resource_type?: string; metadata: Record<string,unknown>; created_at: string; }

/* ── Constantes UI ──────────────────────────────────────────────────────── */
const PS: Record<PortalStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  invited:   { label:"Invitation envoyée", color:"#f59e0b", bg:"rgba(245,158,11,0.12)",   border:"rgba(245,158,11,0.25)",   dot:"bg-amber-400"  },
  active:    { label:"Actif",              color:"#10b981", bg:"rgba(16,185,129,0.12)",    border:"rgba(16,185,129,0.25)",   dot:"bg-emerald-400 animate-pulse" },
  suspended: { label:"Suspendu",           color:"#ef4444", bg:"rgba(239,68,68,0.12)",     border:"rgba(239,68,68,0.25)",    dot:"bg-red-400"    },
  expired:   { label:"Expiré",             color:"#6b7280", bg:"rgba(107,114,128,0.12)",   border:"rgba(107,114,128,0.25)", dot:"bg-gray-400"   },
};

const PERM_LABELS: Record<keyof PortalPermissions, string> = {
  factures:  "Factures & Devis",
  projets:   "Projets",
  documents: "Documents",
  messages:  "Messagerie",
  contrats:  "Contrats",
};

const DEFAULT_PERMS: PortalPermissions = {
  factures: true, projets: true, documents: true, messages: true, contrats: false,
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#c9a55a,#b08d45)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#3b82f6,#2563eb)",
  "linear-gradient(135deg,#c9a55a,#b08d45)",
  "linear-gradient(135deg,#ec4899,#db2777)",
  "linear-gradient(135deg,#14b8a6,#0d9488)",
];
function avatarGrad(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length];
}
function fmtSize(b: number) {
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b/1024).toFixed(0)} Ko`;
  return `${(b/(1024*1024)).toFixed(1)} Mo`;
}
function fmtDate(s?: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  function copy() { navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(()=>setOk(false),1500); }); }
  return (
    <button onClick={copy} className="rounded-md p-1 text-white/25 transition hover:bg-white/8 hover:text-white/60">
      {ok ? <Check size={11} className="text-emerald-400"/> : <Copy size={11}/>}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function PortailClientPage() {
  const { isDark } = useTheme();
  const router      = useRouter();

  /* ── État principal ── */
  const [accesses,   setAccesses]   = useState<PortalAccess[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState<PortalStatus|"all">("all");
  const [userId,     setUserId]     = useState<string|null>(null);
  const [origin,     setOrigin]     = useState("");

  /* ── Drawer ── */
  const [drawer,     setDrawer]     = useState<PortalAccess|null>(null);
  const [drawerTab,  setDrawerTab]  = useState<DrawerTab>("info");
  const [drawerMsgs, setDrawerMsgs] = useState<PortailMsg[]>([]);
  const [drawerDocs, setDrawerDocs] = useState<PortailDoc[]>([]);
  const [drawerInv,  setDrawerInv]  = useState<LinkedDoc[]>([]);
  const [drawerProj, setDrawerProj] = useState<LinkedProj[]>([]);
  const [drawerAudit,setDrawerAudit]= useState<AuditEntry[]>([]);
  const [drawerLoad, setDrawerLoad] = useState(false);
  const [msgInput,   setMsgInput]   = useState("");
  const [notes,      setNotes]      = useState("");
  const [editNotes,  setEditNotes]  = useState(false);
  const [savingN,    setSavingN]    = useState(false);
  const [uploadingDoc,setUploadingDoc]=useState(false);
  const [sendingInv, setSendingInv] = useState(false);

  /* ── Modal Donner accès ── */
  const [showGrant,    setShowGrant]    = useState(false);
  const [crmSearch,    setCrmSearch]    = useState("");
  const [crmResults,   setCrmResults]   = useState<CrmContact[]>([]);
  const [crmLoading,   setCrmLoading]   = useState(false);
  const [selContact,   setSelContact]   = useState<CrmContact|null>(null);
  const [grantPerms,   setGrantPerms]   = useState<PortalPermissions>(DEFAULT_PERMS);
  const [grantWelcome, setGrantWelcome] = useState("");
  const [granting,     setGranting]     = useState(false);

  const msgEndRef  = useRef<HTMLDivElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);
  const { toasts, add, remove } = useToastStack();

  useEffect(()=>{ setOrigin(window.location.origin); },[]);

  /* ── Chargement accès portail ── */
  const load = useCallback(async (uid?: string|null) => {
    const id = uid ?? userId;
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from("portail_clients")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    setAccesses((data ?? []) as PortalAccess[]);
    setLoading(false);
  }, [userId]);

  useEffect(()=>{
    (async()=>{
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await load(user.id);
    })();
  },[]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Chargement lazy drawer ── */
  useEffect(()=>{
    if (!drawer) { setDrawerMsgs([]); setDrawerDocs([]); setDrawerInv([]); setDrawerProj([]); setDrawerAudit([]); return; }
    setDrawerTab("info");
    setNotes(drawer.welcome_message ?? "");
    setEditNotes(false);
    setMsgInput("");
    void loadDrawerData(drawer);
  },[drawer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    if (drawerTab === "messages") setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
  },[drawerMsgs,drawerTab]);

  async function loadDrawerData(pc: PortalAccess) {
    setDrawerLoad(true);
    await Promise.all([
      // Messages
      supabase.from("portail_messages").select("id,from_role,text,created_at")
        .eq("portail_client_id", pc.id).order("created_at",{ascending:true})
        .then(({data})=>setDrawerMsgs((data??[]).map((r: {id:string;from_role:string;text:string;created_at:string})=>({id:r.id,from:r.from_role as "admin"|"client",text:r.text,date:r.created_at})))),
      // Docs partagés
      supabase.from("portail_docs").select("id,name,file_type,size,url,uploaded_by,created_at")
        .eq("portail_client_id", pc.id).order("created_at",{ascending:false})
        .then(({data})=>setDrawerDocs((data??[]).map((r:{id:string;name:string;file_type:string;size:number;url:string;uploaded_by:string;created_at:string})=>({id:r.id,name:r.name,type:r.file_type,size:r.size,url:r.url,uploadedBy:r.uploaded_by as "admin"|"client",uploadedAt:r.created_at})))),
      // Factures/devis liés au contact
      pc.contact_id
        ? supabase.from("documents").select("id,type,numero,sujet,total_ttc,statut,date_document")
            .eq("user_id", pc.user_id).in("type",["facture","devis","avoir"])
            .order("date_document",{ascending:false}).limit(20)
            .then(({data})=>setDrawerInv((data??[]) as LinkedDoc[]))
        : Promise.resolve(),
      // Projets liés
      pc.contact_id
        ? supabase.from("projects").select("id,nom,status,progress,color,end_date")
            .eq("user_id", pc.user_id).eq("crm_contact_id", pc.contact_id)
            .order("created_at",{ascending:false}).limit(10)
            .then(({data})=>setDrawerProj((data??[]) as unknown as LinkedProj[]))
        : Promise.resolve(),
      // Audit log
      supabase.from("portal_audit_log").select("id,action,resource_type,metadata,created_at")
        .eq("portal_client_id", pc.id).order("created_at",{ascending:false}).limit(20)
        .then(({data})=>setDrawerAudit((data??[]) as AuditEntry[])),
    ]);
    setDrawerLoad(false);
  }

  /* ── KPIs ── */
  const counts = {
    all:       accesses.length,
    active:    accesses.filter(a=>a.portal_status==="active").length,
    invited:   accesses.filter(a=>a.portal_status==="invited").length,
    suspended: accesses.filter(a=>a.portal_status==="suspended").length,
    expired:   accesses.filter(a=>a.portal_status==="expired").length,
  };

  /* ── Filtrage ── */
  const filtered = accesses.filter(a => {
    const q = search.toLowerCase();
    return (!q || a.nom.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.entreprise??"").toLowerCase().includes(q))
        && (filter==="all" || a.portal_status===filter);
  });

  /* ── Recherche CRM ── */
  useEffect(()=>{
    if (!userId || crmSearch.trim().length < 2) { setCrmResults([]); return; }
    setCrmLoading(true);
    const t = setTimeout(async()=>{
      const q = crmSearch.trim();
      const { data } = await supabase.from("contacts")
        .select("id,name,email,phone,company")
        .eq("user_id", userId)
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`)
        .limit(8);
      setCrmResults((data??[]) as CrmContact[]);
      setCrmLoading(false);
    }, 300);
    return ()=>clearTimeout(t);
  },[crmSearch, userId]);

  /* ── Donner accès ── */
  async function grantAccess() {
    if (!userId) return;
    setGranting(true);
    const newAccess = {
      user_id:         userId,
      nom:             selContact?.name  ?? crmSearch,
      email:           selContact?.email ?? "",
      phone:           selContact?.phone,
      entreprise:      selContact?.company,
      contact_id:      selContact?.id,
      portal_status:   "invited" as PortalStatus,
      permissions:     grantPerms,
      welcome_message: grantWelcome || null,
    };
    const { data, error } = await supabase.from("portail_clients").insert(newAccess).select("*").single();
    if (error || !data) { add("Erreur lors de la création", "error"); setGranting(false); return; }

    // Audit
    await supabase.from("portal_audit_log").insert({
      org_user_id: userId, portal_client_id: data.id,
      action: "acces_accorde", metadata: { email: data.email, permissions: grantPerms },
    });

    add(`Accès créé pour ${newAccess.nom}`, "success");
    setShowGrant(false);
    setSelContact(null); setCrmSearch(""); setCrmResults([]); setGrantPerms(DEFAULT_PERMS); setGrantWelcome("");
    setGranting(false);
    await load();
    // Ouvrir le drawer directement sur la nouvelle fiche
    setDrawer(data as PortalAccess);
  }

  /* ── Changer le statut d'accès ── */
  async function changeStatus(id: string, status: PortalStatus) {
    await supabase.from("portail_clients").update({ portal_status: status }).eq("id", id).eq("user_id", userId!);
    setAccesses(prev => prev.map(a => a.id===id ? {...a,portal_status:status} : a));
    if (drawer?.id===id) setDrawer(d => d ? {...d,portal_status:status} : d);
    if (userId) {
      await supabase.from("portal_audit_log").insert({
        org_user_id: userId, portal_client_id: id,
        action: status==="suspended"?"acces_revoque":"acces_accorde",
        metadata: { new_status: status },
      });
    }
    add(`Statut mis à jour : ${PS[status].label}`, "success");
  }

  /* ── Supprimer ── */
  async function del(id: string, nom: string) {
    if (!confirm(`Supprimer l'accès portail de ${nom} ? Cette action est irréversible.`)) return;
    await supabase.from("portail_clients").delete().eq("id", id);
    if (drawer?.id===id) setDrawer(null);
    add("Accès supprimé", "success");
    await load();
  }

  /* ── Permissions ── */
  async function savePerms(perms: PortalPermissions) {
    if (!drawer || !userId) return;
    await supabase.from("portail_clients").update({ permissions: perms }).eq("id", drawer.id).eq("user_id", userId);
    setAccesses(prev => prev.map(a => a.id===drawer.id ? {...a,permissions:perms} : a));
    setDrawer(d => d ? {...d,permissions:perms} : d);
    await supabase.from("portal_audit_log").insert({
      org_user_id: userId, portal_client_id: drawer.id,
      action: "changement_permission", metadata: { permissions: perms },
    });
    add("Permissions mises à jour", "success");
  }

  /* ── Notes / welcome ── */
  async function saveNotes() {
    if (!drawer || !userId) return;
    setSavingN(true);
    await supabase.from("portail_clients").update({ welcome_message: notes }).eq("id", drawer.id).eq("user_id", userId);
    setDrawer(d => d ? {...d,welcome_message:notes} : d);
    setSavingN(false); setEditNotes(false);
    add("Message de bienvenue sauvegardé", "success");
  }

  /* ── Envoyer invitation ── */
  async function sendInvitation() {
    if (!drawer) return;
    setSendingInv(true);
    try {
      const r = await fetch("/api/portail/inviter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portal_client_id: drawer.id }),
      });
      const body = await r.json() as { ok?: boolean; sent_to?: string; error?: string };
      if (body.ok) {
        add(`Invitation envoyée à ${body.sent_to}`, "success");
        await load();
        setDrawer(d => d ? {...d,portal_status:"invited",invitation_sent_at:new Date().toISOString()} : d);
      } else {
        add(body.error ?? "Erreur d'envoi", "error");
      }
    } catch { add("Erreur réseau", "error"); }
    setSendingInv(false);
  }

  /* ── Messages ── */
  async function sendMsg() {
    if (!msgInput.trim() || !drawer || !userId) return;
    const text = msgInput.trim();
    setMsgInput("");
    const { data, error } = await supabase.from("portail_messages")
      .insert({ portail_client_id: drawer.id, user_id: userId, from_role: "admin", text })
      .select("id,from_role,text,created_at").single();
    if (error) { add("Erreur envoi message", "error"); return; }
    setDrawerMsgs(prev => [...prev, { id: data.id, from:"admin", text: data.text, date: data.created_at }]);
  }

  /* ── Documents ── */
  async function handleDocUpload(files: FileList|null) {
    if (!files || !drawer || !userId) return;
    setUploadingDoc(true);
    let added = 0;
    for (const file of Array.from(files)) {
      const storagePath = `${userId}/${drawer.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("portail-docs").upload(storagePath, file, { upsert: true });
      if (upErr) continue;
      const { data: { publicUrl } } = supabase.storage.from("portail-docs").getPublicUrl(storagePath);
      const { error: dbErr } = await supabase.from("portail_docs").insert({
        portail_client_id: drawer.id, user_id: userId,
        name: file.name, file_type: file.type, size: file.size,
        url: publicUrl, storage_path: storagePath, uploaded_by: "admin",
      });
      if (!dbErr) added++;
    }
    setUploadingDoc(false);
    if (added > 0) { add(`${added} document${added>1?"s":""} partagé${added>1?"s":""}`, "success"); await loadDrawerData(drawer); }
  }

  async function deleteDoc(docId: string) {
    if (!drawer) return;
    await supabase.from("portail_docs").delete().eq("id", docId);
    setDrawerDocs(prev => prev.filter(d => d.id!==docId));
  }

  /* ── URL portail ── */
  const portalUrl = drawer ? `${origin}/portail/client/${drawer.id}?token=${drawer.invitation_token??""}` : "";

  const rowBase = isDark
    ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.06]"
    : "border-black/[0.06] bg-white hover:border-black/[0.1] hover:bg-slate-50";

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className={`relative flex flex-col min-h-screen ${isDark?"bg-[#07080e]":"bg-[#f4f5f9]"}`}>
      <ToastStack toasts={toasts} remove={remove}/>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden shrink-0" style={{background:isDark?"linear-gradient(160deg,#07080e,#0d1117,#07080e)":"linear-gradient(160deg,#f0f2f5,#f5f7fa,#f0f2f5)"}}>
        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full opacity-[0.06]" style={{background:"radial-gradient(circle,#c9a55a,transparent 70%)"}}/>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{background:"linear-gradient(90deg,transparent,rgba(201,165,90,0.3),transparent)"}}/>
        <div className="relative px-4 sm:px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className={`text-xl font-black tracking-tight ${isDark?"text-white":"text-gray-900"}`}>Portail Client</h1>
                <p className={`text-xs mt-0.5 ${isDark?"text-white/40":"text-gray-500"}`}>
                  {accesses.length} accès · {counts.active} actifs
                </p>
              </div>
            </div>
            <button onClick={()=>setShowGrant(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:brightness-110"
              style={{background:"linear-gradient(135deg,#c9a55a,#b08d45)",color:"#0a0a0a"}}>
              <Key size={13}/> Donner accès au portail
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 w-full">

        {/* ── KPIs ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label:"Total accès",     value:counts.all,       color:isDark?"#ffffff":"#0e1420", Icon:Users      },
            { label:"Actifs",          value:counts.active,    color:"#10b981",                  Icon:CheckCircle2 },
            { label:"En attente",      value:counts.invited,   color:"#f59e0b",                  Icon:Clock       },
            { label:"Suspendus",       value:counts.suspended, color:"#ef4444",                  Icon:Ban         },
          ].map(({label,value,color,Icon})=>(
            <div key={label} className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm ${isDark?"border-white/6 bg-white/4":"border-black/8 bg-white shadow-sm"}`}>
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl" style={{background:color}}/>
              <p className="mb-2 text-2xl font-black" style={{color}}>{value}</p>
              <div className="flex items-center gap-1.5">
                <Icon size={11} style={{color}} className="opacity-70"/>
                <p className={`text-xs font-semibold ${isDark?"text-white/40":"text-[#0e1420]/50"}`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={`flex flex-1 items-center gap-2.5 rounded-2xl border px-4 py-3 backdrop-blur-sm ${isDark?"border-white/8 bg-white/4":"border-black/8 bg-white shadow-sm"}`}>
            <Search size={14} className={isDark?"text-white/30":"text-[#0e1420]/30"}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client, une entreprise…"
              className={`flex-1 bg-transparent text-sm outline-none ${isDark?"text-white placeholder-white/25":"text-[#0e1420] placeholder-[#0e1420]/30"}`}/>
            {search && <button onClick={()=>setSearch("")}><X size={13} className={isDark?"text-white/30":"text-[#0e1420]/30"}/></button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {(["all","active","invited","suspended","expired"] as const).map(k=>{
              const s = k!=="all" ? PS[k] : null;
              const active = filter===k;
              return (
                <button key={k} onClick={()=>setFilter(k)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    active ? "" : isDark
                      ? "border border-white/8 bg-white/4 text-white/40 hover:text-white/70"
                      : "border border-black/8 bg-white text-[#0e1420]/40 hover:text-[#0e1420]/70 shadow-sm"
                  }`}
                  style={active&&s ? {background:s.bg,border:`1px solid ${s.border}`,color:s.color}
                    : active ? {background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)"} : {}}>
                  {k==="all" ? "Tous" : PS[k as PortalStatus].label}
                  <span className="rounded-full px-1.5 py-0.5 text-[11px]"
                    style={active ? {background:"rgba(0,0,0,0.2)"} : {background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}>
                    {k==="all" ? counts.all : accesses.filter(a=>a.portal_status===k).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LISTE ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={24} className={`animate-spin ${isDark?"text-white/20":"text-[#0e1420]/20"}`}/></div>
        ) : filtered.length===0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-3xl border ${isDark?"border-white/8 bg-white/4":"border-black/8 bg-white shadow-sm"}`}>
              <ShieldCheck size={24} className={isDark?"text-white/20":"text-[#0e1420]/20"}/>
            </div>
            <div>
              <p className={`font-bold ${isDark?"text-white/50":"text-[#0e1420]/50"}`}>{search?"Aucun résultat":"Aucun portail créé"}</p>
              <p className={`mt-1 text-sm ${isDark?"text-white/25":"text-[#0e1420]/30"}`}>{search?"Essaie un autre mot-clé":"Accordez l'accès portail à vos clients CRM"}</p>
            </div>
            {!search && (
              <button onClick={()=>setShowGrant(true)} className="flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-bold transition"
                style={{background:`${GOLD}15`,borderColor:`${GOLD}30`,color:GOLD}}>
                <Key size={14}/> Donner accès au portail
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a,i)=>{
              const s = PS[a.portal_status];
              return (
                <motion.div key={a.id}
                  initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                  transition={{delay:i*0.05,duration:0.3,ease}}
                  onClick={()=>setDrawer(a)}
                  className={`group relative cursor-pointer overflow-hidden rounded-3xl border p-6 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 ${isDark?"border-white/6 bg-white/4 hover:border-white/12 hover:bg-white/7 hover:shadow-xl hover:shadow-black/30":"border-black/8 bg-white shadow-sm hover:border-black/12 hover:shadow-md"}`}>
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-15 blur-2xl" style={{background:s.color}}/>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white shadow-lg" style={{background:avatarGrad(a.id)}}>
                      {(a.nom||"?")[0].toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5" style={{background:s.bg,borderColor:s.border}}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`}/>
                      <span className="text-xs font-bold" style={{color:s.color}}>{s.label}</span>
                    </div>
                  </div>
                  <p className={`mb-0.5 text-base font-bold ${isDark?"text-white":"text-[#0e1420]"}`}>{a.nom}</p>
                  {a.entreprise && (
                    <p className={`mb-3 flex items-center gap-1.5 text-xs ${isDark?"text-white/40":"text-[#0e1420]/45"}`}><Building2 size={10}/> {a.entreprise}</p>
                  )}
                  {a.email && (
                    <p className={`flex items-center gap-1.5 text-xs mb-3 ${isDark?"text-white/35":"text-[#0e1420]/40"}`}><Mail size={10}/>{a.email}</p>
                  )}
                  <div className={`mt-3 flex items-center justify-between border-t pt-3 ${isDark?"border-white/5":"border-black/5"}`}>
                    <p className={`text-xs ${isDark?"text-white/25":"text-[#0e1420]/30"}`}>
                      {a.invitation_sent_at ? `Invité le ${fmtDate(a.invitation_sent_at)}` : `Créé le ${fmtDate(a.created_at)}`}
                    </p>
                    <div className={`flex items-center gap-1 text-xs font-semibold transition ${isDark?"text-white/25 group-hover:text-white/50":"text-[#0e1420]/25 group-hover:text-[#0e1420]/50"}`}>
                      Gérer <ArrowUpRight size={10}/>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ DRAWER ══════════ */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDrawer(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{x:"100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}}
              transition={{duration:0.3,ease}}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-hidden bg-[#0e1420] shadow-2xl border-l border-white/6">

              {/* Drawer header */}
              <div className="relative shrink-0 overflow-hidden border-b border-white/6 px-6 py-5">
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-15 blur-3xl" style={{background:PS[drawer.portal_status]?.color}}/>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white shadow-xl" style={{background:avatarGrad(drawer.id)}}>
                    {(drawer.nom||"?")[0].toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>del(drawer.id,drawer.nom)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 text-white/25 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 size={13}/>
                    </button>
                    <button onClick={()=>setDrawer(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/8 hover:text-white/70">
                      <X size={16}/>
                    </button>
                  </div>
                </div>
                <h2 className="text-lg font-black text-white">{drawer.nom}</h2>
                {drawer.entreprise && (
                  <p className="flex items-center gap-1.5 text-sm text-white/40 mt-0.5"><Building2 size={12}/>{drawer.entreprise}</p>
                )}

                {/* Statut + actions rapides */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5" style={{background:PS[drawer.portal_status].bg,borderColor:PS[drawer.portal_status].border}}>
                    <span className={`h-1.5 w-1.5 rounded-full ${PS[drawer.portal_status].dot}`}/>
                    <span className="text-xs font-bold" style={{color:PS[drawer.portal_status].color}}>{PS[drawer.portal_status].label}</span>
                  </div>
                  {drawer.email && (
                    <a href={`mailto:${drawer.email}`} className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/8 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/14 hover:text-white">
                      <Mail size={12}/> Email
                    </a>
                  )}
                  {drawer.phone && (
                    <a href={`tel:${drawer.phone}`} className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/8 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/14 hover:text-white">
                      <Phone size={12}/> Appel
                    </a>
                  )}
                </div>

                {/* Tab bar */}
                <div className="mt-4 flex gap-0.5 overflow-x-auto scrollbar-none">
                  {(["info","permissions","factures","projets","documents","messages","activite"] as DrawerTab[]).map(t=>(
                    <button key={t} onClick={()=>setDrawerTab(t)}
                      className={`flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition-all capitalize ${
                        drawerTab===t ? "bg-white/12 text-white" : "text-white/35 hover:text-white/60"
                      }`}>
                      {t==="activite" ? "Activité" : t.charAt(0).toUpperCase()+t.slice(1)}
                      {t==="messages" && drawerMsgs.filter(m=>m.from==="client").length>0 && (
                        <span className="ml-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] text-white">{drawerMsgs.filter(m=>m.from==="client").length}</span>
                      )}
                      {t==="documents" && drawerDocs.length>0 && (
                        <span className="ml-0.5 rounded-full bg-sky-500/80 px-1.5 py-0.5 text-[10px] text-white">{drawerDocs.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer body */}
              <div className={`flex-1 overflow-y-auto p-5 ${drawerTab==="messages"?"flex flex-col":"space-y-3"}`}>

                {/* ── INFO ── */}
                {drawerTab==="info" && (
                  <div className="space-y-3">
                    {/* Lien portail */}
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
                      <div className="mb-2.5 flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Lien portail</p>
                        <div className="flex gap-1.5">
                          {drawer.portal_status!=="active" && (
                            <button onClick={()=>changeStatus(drawer.id,"active")}
                              className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20">
                              <Unlock size={9}/> Activer
                            </button>
                          )}
                          {drawer.portal_status==="active" && (
                            <button onClick={()=>changeStatus(drawer.id,"suspended")}
                              className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400 transition hover:bg-red-500/20">
                              <Lock size={9}/> Suspendre
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/30 px-3 py-2">
                        <code className="flex-1 truncate text-xs text-sky-400">{portalUrl}</code>
                        <CopyBtn text={portalUrl}/>
                        <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 rounded-md p-1 text-white/25 transition hover:text-white/60">
                          <ExternalLink size={11}/>
                        </a>
                      </div>
                    </div>

                    {/* Invitation */}
                    <div className="rounded-2xl border border-white/6 bg-white/4 px-4 py-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white/70">Invitation par email</p>
                          <p className="text-xs text-white/30">
                            {drawer.invitation_sent_at ? `Envoyée le ${fmtDate(drawer.invitation_sent_at)}` : "Pas encore envoyée"}
                          </p>
                        </div>
                        <button onClick={sendInvitation} disabled={sendingInv || !drawer.email}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40">
                          {sendingInv ? <Loader2 size={11} className="animate-spin"/> : <Send size={11}/>}
                          {drawer.invitation_sent_at ? "Renvoyer" : "Envoyer l'invitation"}
                        </button>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="rounded-2xl border border-white/6 bg-white/4 px-4 py-3">
                      <div className="space-y-2">
                        {[
                          {label:"Accès créé le",       value:fmtDate(drawer.created_at)},
                          {label:"Invitation envoyée",  value:fmtDate(drawer.invitation_sent_at)},
                          {label:"Compte activé",       value:fmtDate(drawer.portal_activated_at)},
                          {label:"Dernière connexion",  value:fmtDate(drawer.derniere_connexion)},
                        ].map(r=>(
                          <div key={r.label} className="flex items-center justify-between text-xs">
                            <span className="text-white/30">{r.label}</span>
                            <span className="font-semibold text-white/70">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Note de bienvenue */}
                    <div className="rounded-2xl border border-white/6 bg-white/4 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-white/6 px-4 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-widest text-white/25">Message de bienvenue</p>
                        {!editNotes ? (
                          <button onClick={()=>{setEditNotes(true)}} className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs font-bold text-white/40 transition hover:text-white/70">
                            <Edit3 size={9}/> Modifier
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={()=>{setEditNotes(false);setNotes(drawer.welcome_message??"");}} className="text-xs text-white/30 hover:text-white/60 transition">Annuler</button>
                            <button onClick={saveNotes} disabled={savingN}
                              className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-400 transition">
                              {savingN ? <Loader2 size={9} className="animate-spin"/> : <Save size={9}/>} Sauver
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {editNotes ? (
                          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} placeholder="Bienvenue dans votre espace client…"
                            className="w-full resize-none bg-transparent text-sm text-white/80 placeholder-white/20 outline-none"/>
                        ) : notes ? (
                          <p className="whitespace-pre-wrap text-sm text-white/70">{notes}</p>
                        ) : (
                          <p className="text-sm text-white/25 text-center py-4">Aucun message de bienvenue</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PERMISSIONS ── */}
                {drawerTab==="permissions" && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/25 mb-4">Accès autorisés</p>
                      <div className="space-y-3">
                        {(Object.keys(PERM_LABELS) as (keyof PortalPermissions)[]).map(key=>{
                          const enabled = drawer.permissions?.[key] ?? false;
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-white/80">{PERM_LABELS[key]}</p>
                                <p className="text-xs text-white/35">{enabled ? "Visible dans le portail" : "Masqué dans le portail"}</p>
                              </div>
                              <button onClick={()=>{
                                const next = {...drawer.permissions,[key]:!enabled};
                                setDrawer(d=>d?{...d,permissions:next}:d);
                                void savePerms(next);
                              }} className={`relative h-5 w-9 shrink-0 rounded-full border transition-all ${enabled?"border-emerald-500/40 bg-emerald-500/30":"border-white/15 bg-white/8"}`}>
                                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${enabled?"translate-x-4":"translate-x-0.5"}`}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Statut d'accès */}
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/25 mb-3">Statut d'accès</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["invited","active","suspended","expired"] as PortalStatus[]).map(s=>{
                          const ps = PS[s];
                          const active = drawer.portal_status===s;
                          return (
                            <button key={s} onClick={()=>changeStatus(drawer.id,s)}
                              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                                active ? "" : "border-white/6 bg-white/3 text-white/30 hover:bg-white/7 hover:text-white/60"
                              }`}
                              style={active ? {borderColor:ps.border,background:ps.bg,color:ps.color} : {}}>
                              <span className={`h-1.5 w-1.5 rounded-full ${active?ps.dot:"bg-white/20"}`}/>
                              {ps.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── FACTURES ── */}
                {drawerTab==="factures" && (
                  <div className="space-y-3">
                    {!drawer.permissions?.factures && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
                        <p className="text-xs text-amber-400">Les factures sont masquées dans le portail. Activez l'accès dans l'onglet Permissions.</p>
                      </div>
                    )}
                    {drawerLoad ? (
                      <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin" style={{color:GOLD}}/></div>
                    ) : drawerInv.length===0 ? (
                      <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <FileText size={24} className="text-white/12"/>
                        <p className="text-sm text-white/30">Aucun document trouvé</p>
                        {!drawer.contact_id && <p className="text-xs text-white/20">Liez ce portail à un contact CRM pour voir ses factures</p>}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {drawerInv.map(d=>{
                          const typeColor = d.type==="facture"?"#10b981":d.type==="devis"?"#3b82f6":GOLD;
                          return (
                            <div key={d.id} onClick={()=>router.push("/client/factures")}
                              className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 px-4 py-3 cursor-pointer hover:border-white/12 hover:bg-white/7 transition-all">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white/80 truncate">{d.sujet||d.numero}</p>
                                <p className="text-xs text-white/30">{d.numero} · {fmtDate(d.date_document)}</p>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{background:`${typeColor}15`,color:typeColor}}>{d.type}</span>
                              <span className="text-xs font-bold tabular-nums" style={{color:GOLD}}>{d.total_ttc.toLocaleString("fr-FR",{style:"currency",currency:"EUR"})}</span>
                              <span className="text-xs text-white/25">{d.statut}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button onClick={()=>router.push("/client/factures")}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-all">
                      <FileText size={11}/> Aller aux factures →
                    </button>
                  </div>
                )}

                {/* ── PROJETS ── */}
                {drawerTab==="projets" && (
                  <div className="space-y-3">
                    {!drawer.permissions?.projets && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
                        <p className="text-xs text-amber-400">Les projets sont masqués dans le portail.</p>
                      </div>
                    )}
                    {drawerLoad ? (
                      <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin" style={{color:GOLD}}/></div>
                    ) : drawerProj.length===0 ? (
                      <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <Settings size={24} className="text-white/12"/>
                        <p className="text-sm text-white/30">Aucun projet lié</p>
                        {!drawer.contact_id && <p className="text-xs text-white/20">Liez ce portail à un contact CRM avec des projets</p>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {drawerProj.map(p=>(
                          <div key={p.id} onClick={()=>router.push("/client/projets")}
                            className="rounded-2xl border border-white/6 bg-white/4 px-4 py-3 cursor-pointer hover:border-white/12 hover:bg-white/7 transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold text-white/80 truncate">{p.nom}</p>
                              <span className="text-xs text-white/30 shrink-0 ml-2">{p.end_date ? fmtDate(p.end_date) : "—"}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/8">
                              <div className="h-full rounded-full" style={{width:`${p.progress??0}%`,background:p.color??GOLD}}/>
                            </div>
                            <p className="mt-1.5 text-xs text-white/30">{p.progress??0}% · {p.status}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={()=>router.push("/client/projets")}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-all">
                      <Settings size={11}/> Aller aux projets →
                    </button>
                  </div>
                )}

                {/* ── DOCUMENTS ── */}
                {drawerTab==="documents" && (
                  <div className="space-y-3">
                    <input ref={docFileRef} type="file" className="hidden" multiple
                      onChange={e=>{void handleDocUpload(e.target.files); e.target.value="";}}/>
                    <button onClick={()=>docFileRef.current?.click()} disabled={uploadingDoc}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 py-4 text-xs font-semibold text-white/35 transition hover:border-white/25 hover:text-white/55 disabled:opacity-50">
                      {uploadingDoc ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>}
                      {uploadingDoc ? "Upload…" : "Partager un document"}
                    </button>
                    {drawerLoad ? (
                      <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin" style={{color:GOLD}}/></div>
                    ) : drawerDocs.length===0 ? (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <FileText size={24} className="text-white/12"/>
                        <p className="text-sm text-white/30">Aucun document partagé</p>
                        <p className="text-xs text-white/20">Les fichiers partagés ici sont visibles dans le portail</p>
                      </div>
                    ) : (
                      drawerDocs.map(doc=>(
                        <div key={doc.id} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 p-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8">
                            <FileText size={14} className="text-white/40"/>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{doc.name}</p>
                            <p className="text-xs text-white/30">{fmtSize(doc.size)} · {fmtDate(doc.uploadedAt)}</p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/20 transition hover:bg-sky-500/10 hover:text-sky-400">
                                <Download size={12}/>
                              </a>
                            )}
                            <button onClick={()=>deleteDoc(doc.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-white/20 transition hover:bg-red-500/10 hover:text-red-400">
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── MESSAGES ── */}
                {drawerTab==="messages" && (
                  <>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                      {drawerLoad ? (
                        <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin" style={{color:GOLD}}/></div>
                      ) : drawerMsgs.length===0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                          <MessageSquare size={28} className="text-white/12"/>
                          <p className="text-sm text-white/30">Aucun message</p>
                        </div>
                      ) : (
                        drawerMsgs.map(m=>(
                          <div key={m.id} className={`flex ${m.from==="admin"?"justify-end":"justify-start"}`}>
                            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                              m.from==="admin"
                                ? "rounded-br-sm border border-white/10 bg-white/10"
                                : "rounded-bl-sm border border-white/6 bg-white/5"
                            }`}>
                              <p className="text-sm leading-snug text-white/85">{m.text}</p>
                              <p className="mt-1 text-[11px] text-white/25">
                                {m.from==="admin"?"Vous":drawer.nom.split(" ")[0]} · {new Date(m.date).toLocaleString("fr-FR",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"})}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={msgEndRef}/>
                    </div>
                    <div className="mt-3 flex shrink-0 gap-2">
                      <input value={msgInput} onChange={e=>setMsgInput(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void sendMsg();}}}
                        placeholder={`Message à ${drawer.nom.split(" ")[0]}…`}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/20 focus:bg-white/8"/>
                      <button onClick={()=>void sendMsg()} disabled={!msgInput.trim()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-white/50 transition hover:bg-white/15 hover:text-white disabled:opacity-30">
                        <Send size={14}/>
                      </button>
                    </div>
                  </>
                )}

                {/* ── ACTIVITÉ ── */}
                {drawerTab==="activite" && (
                  <div className="space-y-2">
                    {drawerLoad ? (
                      <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin" style={{color:GOLD}}/></div>
                    ) : drawerAudit.length===0 ? (
                      <p className="text-sm text-white/25 text-center py-8">Aucune activité enregistrée</p>
                    ) : (
                      drawerAudit.map(a=>(
                        <div key={a.id} className="flex items-start gap-3 py-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{background:GOLD}}/>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-white/70 font-medium capitalize">{a.action.replace(/_/g," ")}</p>
                            {a.resource_type && <p className="text-xs text-white/35">{a.resource_type}</p>}
                            <p className="text-xs text-white/25 mt-0.5">{fmtDate(a.created_at)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ MODAL DONNER ACCÈS ══════════ */}
      <AnimatePresence>
        {showGrant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <motion.div initial={{opacity:0,scale:0.95,y:16}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.95}} transition={{duration:0.22,ease}}
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/8 bg-[#0e1420] shadow-2xl">

              <div className="border-b border-white/6 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{background:`${GOLD}20`}}>
                      <Key size={15} style={{color:GOLD}}/>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Donner accès au portail</h2>
                      <p className="text-xs text-white/30">Recherchez un client CRM existant</p>
                    </div>
                  </div>
                  <button onClick={()=>{setShowGrant(false);setSelContact(null);setCrmSearch("");setCrmResults([]);setGrantPerms(DEFAULT_PERMS);setGrantWelcome("");}}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white/60">
                    <X size={15}/>
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Recherche CRM */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/40">
                    Rechercher dans le CRM *
                  </label>
                  <div className={`flex items-center gap-2.5 rounded-xl border ${selContact?"border-emerald-500/30 bg-emerald-500/5":"border-white/10 bg-white/5"} px-3.5 py-2.5`}>
                    <Search size={13} className="text-white/30 shrink-0"/>
                    <input value={selContact?`${selContact.name}${selContact.company?` — ${selContact.company}`:""}`:`${crmSearch}`}
                      onChange={e=>{ if(selContact)setSelContact(null); setCrmSearch(e.target.value); }}
                      placeholder="Nom, email, entreprise…"
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"/>
                    {selContact && <CheckCircle2 size={14} className="text-emerald-400 shrink-0"/>}
                    {crmLoading && <Loader2 size={13} className="animate-spin text-white/30 shrink-0"/>}
                  </div>

                  {/* Résultats CRM */}
                  {crmResults.length>0 && !selContact && (
                    <div className="mt-1.5 rounded-xl border border-white/8 bg-[#07080e] overflow-hidden">
                      {crmResults.map(c=>(
                        <button key={c.id} onClick={()=>{setSelContact(c);setCrmSearch("");setCrmResults([]);}}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white" style={{background:avatarGrad(c.id)}}>
                            {(c.name||"?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white/80 truncate">{c.name}</p>
                            <p className="text-xs text-white/35 truncate">{c.company?`${c.company} · `:""}{c.email}</p>
                          </div>
                        </button>
                      ))}
                      <button onClick={()=>router.push("/client/crm")}
                        className="flex w-full items-center justify-center gap-1.5 px-4 py-2.5 border-t border-white/6 text-xs text-white/25 hover:text-white/50 transition">
                        <ArrowUpRight size={11}/> Créer un contact dans le CRM
                      </button>
                    </div>
                  )}
                  {crmSearch.length>=2 && crmResults.length===0 && !crmLoading && !selContact && (
                    <div className="mt-1.5 rounded-xl border border-white/6 bg-[#07080e] px-4 py-3">
                      <p className="text-xs text-white/30 text-center">Aucun contact trouvé</p>
                      <button onClick={()=>{setShowGrant(false);router.push("/client/crm");}}
                        className="flex w-full items-center justify-center gap-1.5 mt-2 text-xs text-white/40 hover:text-white/70 transition">
                        <ArrowUpRight size={11}/> Créer un contact dans le CRM
                      </button>
                    </div>
                  )}
                </div>

                {/* Permissions */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-white/40">Ce client pourra voir</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PERM_LABELS) as (keyof PortalPermissions)[]).map(key=>{
                      const on = grantPerms[key];
                      return (
                        <button key={key} type="button"
                          onClick={()=>setGrantPerms(p=>({...p,[key]:!on}))}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                            on ? "" : "border-white/8 bg-white/3 text-white/30 hover:bg-white/6 hover:text-white/50"
                          }`}
                          style={on ? {borderColor:"rgba(201,165,90,0.3)",background:"rgba(201,165,90,0.08)",color:GOLD} : {}}>
                          <div className={`h-3 w-3 rounded-sm border flex items-center justify-center shrink-0 ${on?"border-transparent":"border-white/20"}`}
                            style={on?{background:GOLD}:{}}>
                            {on && <Check size={8} className="text-black stroke-[3]"/>}
                          </div>
                          {PERM_LABELS[key]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message de bienvenue */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/40">Message de bienvenue (optionnel)</label>
                  <textarea value={grantWelcome} onChange={e=>setGrantWelcome(e.target.value)} rows={2}
                    placeholder="Bienvenue dans votre espace client personnel…"
                    className="w-full rounded-xl border border-white/8 bg-white/4 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/16 focus:bg-white/6 resize-none"/>
                </div>
              </div>

              <div className="flex gap-2 border-t border-white/6 px-5 py-4">
                <button onClick={()=>{setShowGrant(false);setSelContact(null);setCrmSearch("");setCrmResults([]);setGrantPerms(DEFAULT_PERMS);setGrantWelcome("");}}
                  className="flex-1 rounded-xl border border-white/8 py-2.5 text-sm font-semibold text-white/40 transition hover:bg-white/5 hover:text-white/60">
                  Annuler
                </button>
                <button onClick={()=>void grantAccess()} disabled={(!selContact&&!crmSearch.trim())||granting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition disabled:opacity-30 hover:brightness-110"
                  style={{background:"linear-gradient(135deg,#c9a55a,#b08d45)",color:"#0a0a0a"}}>
                  {granting ? <Loader2 size={14} className="animate-spin"/> : <ShieldCheck size={14}/>}
                  Créer l'accès
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
