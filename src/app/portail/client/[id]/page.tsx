"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Folder, MessageSquare, Download, Send,
  CheckCircle2, Clock, AlertCircle, Loader2, X,
  ChevronRight, Building2, Mail, ExternalLink, Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

/* ── Types ──────────────────────────────────────────────────────────────── */
type NavTab = "accueil" | "factures" | "projets" | "documents" | "messages";

interface PortalAccess {
  id:                  string;
  nom:                 string;
  email:               string;
  entreprise?:         string;
  portal_status:       "invited"|"active"|"suspended"|"expired";
  portal_user_id?:     string;
  portal_activated_at?:string;
  permissions:         { factures:boolean; projets:boolean; documents:boolean; messages:boolean; contrats:boolean };
  welcome_message?:    string;
  user_id:             string;
}

interface LinkedDoc  { id:string; type:string; numero:string; sujet:string; total_ttc:number; statut:string; date_document:string; }
interface PortailMsg { id:string; from:"admin"|"client"; text:string; date:string; }
interface PortailDoc { id:string; name:string; type:string; size:number; url:string; uploadedAt:string; }

interface LinkedProj { id:string; nom:string; status:string; progress:number; color:string; end_date?:string; }

function fmtDate(s?:string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});
}
function fmtCur(v:number) { return v.toLocaleString("fr-FR",{style:"currency",currency:"EUR"}); }
function fmtSize(b:number) {
  if (b<1024) return `${b} o`;
  if (b<1048576) return `${(b/1024).toFixed(0)} Ko`;
  return `${(b/1048576).toFixed(1)} Mo`;
}

const STATUT_DOC: Record<string,{label:string;color:string;icon:typeof CheckCircle2}> = {
  payé:      {label:"Payé",     color:"#10b981",icon:CheckCircle2},
  en_attente:{label:"À payer",  color:"#f59e0b",icon:Clock},
  refusé:    {label:"Refusé",   color:"#ef4444",icon:AlertCircle},
  brouillon: {label:"Brouillon",color:"#6b7280",icon:FileText},
};

/* ══════════════════════════════════════════════════════════════════════════ */
export default function PortailClientDashboard() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const id           = params.id as string;
  const token        = searchParams.get("token") ?? "";

  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string|null>(null);
  const [access,    setAccess]    = useState<PortalAccess|null>(null);
  const [tab,       setTab]       = useState<NavTab>("accueil");

  const [factures,  setFactures]  = useState<LinkedDoc[]>([]);
  const [projets,   setProjets]   = useState<LinkedProj[]>([]);
  const [docs,      setDocs]      = useState<PortailDoc[]>([]);
  const [msgs,      setMsgs]      = useState<PortailMsg[]>([]);
  const [dataLoaded,setDataLoaded]= useState(false);
  const [msgInput,  setMsgInput]  = useState("");
  const [sending,   setSending]   = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  /* ── Vérification token + chargement accès ── */
  useEffect(()=>{
    if (!id) return;
    (async()=>{
      // Récupère l'accès portail via token (lecture publique limitée par la politique RLS)
      const { data, error: e } = await supabase
        .from("portail_clients")
        .select("id,nom,email,entreprise,portal_status,portal_user_id,portal_activated_at,permissions,welcome_message,user_id")
        .eq("id", id)
        .eq("invitation_token", token)
        .maybeSingle();

      if (e || !data) { setError("Lien invalide ou expiré."); setLoading(false); return; }
      if (data.portal_status === "suspended") { setError("Votre accès a été suspendu. Contactez votre prestataire."); setLoading(false); return; }
      if (data.portal_status === "expired")   { setError("Ce lien d'accès a expiré."); setLoading(false); return; }

      setAccess(data as PortalAccess);

      // Marque le portail comme actif si c'est la première visite
      if (data.portal_status === "invited") {
        await supabase.from("portail_clients")
          .update({ portal_status:"active", portal_activated_at: new Date().toISOString() })
          .eq("id", id).eq("invitation_token", token);
        setAccess(prev => prev ? {...prev, portal_status:"active"} : prev);

        await supabase.from("portal_audit_log").insert({
          portal_client_id: id,
          action: "activation_compte",
          metadata: { first_visit: true },
        });
      }

      // Audit log — connexion
      await supabase.from("portal_audit_log").insert({
        portal_client_id: id,
        action: "connexion",
        metadata: { via: "token_link" },
      });

      setLoading(false);
    })();
  },[id,token]);

  /* ── Chargement des données (lazy, une seule fois) ── */
  useEffect(()=>{
    if (!access || dataLoaded) return;
    setDataLoaded(true);
    void loadData(access);
  },[access, dataLoaded]);

  async function loadData(pc: PortalAccess) {
    await Promise.all([
      // Factures (si permission)
      pc.permissions?.factures
        ? supabase.from("documents").select("id,type,numero,sujet,total_ttc,statut,date_document")
            .eq("user_id", pc.user_id).in("type",["facture","devis","avoir"])
            .order("date_document",{ascending:false}).limit(20)
            .then(({data})=>setFactures((data??[]) as LinkedDoc[]))
        : Promise.resolve(),
      // Projets (si permission)
      pc.permissions?.projets
        ? supabase.from("portal_project_access").select("project_id,projects(id,nom,status,progress,color,end_date)")
            .eq("portal_client_id", pc.id)
            .then(({data})=>{
              const p = (data??[])
                .map((r:{ project_id:string; projects: LinkedProj | LinkedProj[] | null }) => {
                  const pr = Array.isArray(r.projects) ? r.projects[0] : r.projects;
                  return pr ?? null;
                })
                .filter((x): x is LinkedProj => x !== null);
              setProjets(p);
            })
        : Promise.resolve(),
      // Documents partagés (si permission)
      pc.permissions?.documents
        ? supabase.from("portail_docs").select("id,name,file_type,size,url,created_at")
            .eq("portail_client_id", pc.id).order("created_at",{ascending:false})
            .then(({data})=>setDocs((data??[]).map((r:{id:string;name:string;file_type:string;size:number;url:string;created_at:string})=>({id:r.id,name:r.name,type:r.file_type,size:r.size,url:r.url,uploadedAt:r.created_at}))))
        : Promise.resolve(),
      // Messages (si permission)
      pc.permissions?.messages
        ? supabase.from("portail_messages").select("id,from_role,text,created_at")
            .eq("portail_client_id", pc.id).order("created_at",{ascending:true})
            .then(({data})=>setMsgs((data??[]).map((r:{id:string;from_role:string;text:string;created_at:string})=>({id:r.id,from:r.from_role as "admin"|"client",text:r.text,date:r.created_at}))))
        : Promise.resolve(),
    ]);
  }

  useEffect(()=>{
    if (tab==="messages") setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
  },[msgs,tab]);

  async function sendMsg() {
    if (!msgInput.trim() || !access) return;
    setSending(true);
    const text = msgInput.trim();
    setMsgInput("");
    const { data, error } = await supabase.from("portail_messages")
      .insert({ portail_client_id: access.id, user_id: access.user_id, from_role:"client", text })
      .select("id,from_role,text,created_at").single();
    if (!error && data) {
      setMsgs(prev=>[...prev,{id:data.id,from:"client",text:data.text,date:data.created_at}]);
    }
    setSending(false);
  }

  /* ── Gestion des états d'erreur/chargement ── */
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080e]">
      <Loader2 size={32} className="animate-spin" style={{color:GOLD}}/>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#07080e] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl" style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)"}}>
        <Lock size={28} className="text-red-400"/>
      </div>
      <div>
        <h1 className="text-xl font-black text-white">Accès impossible</h1>
        <p className="mt-2 text-white/40">{error}</p>
      </div>
      <p className="text-xs text-white/20">Si vous pensez qu'il s'agit d'une erreur, contactez votre prestataire.</p>
    </div>
  );

  if (!access) return null;

  const firstName = access.nom.split(" ")[0] ?? access.nom;
  const perm = access.permissions ?? {};

  const navItems: {id:NavTab;label:string;icon:typeof FileText;count?:number;show:boolean}[] = ([
    {id:"accueil"   as NavTab, label:"Accueil",    icon:Building2,      show:true},
    {id:"factures"  as NavTab, label:"Factures",   icon:FileText,       count:factures.length,  show:!!perm.factures},
    {id:"projets"   as NavTab, label:"Projets",    icon:Folder,         count:projets.length,   show:!!perm.projets},
    {id:"documents" as NavTab, label:"Documents",  icon:FileText,       count:docs.length,      show:!!perm.documents},
    {id:"messages"  as NavTab, label:"Messages",   icon:MessageSquare,  count:msgs.filter(m=>m.from==="admin").length, show:!!perm.messages},
  ] as {id:NavTab;label:string;icon:typeof FileText;count?:number;show:boolean}[]).filter(n=>n.show);

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex min-h-screen flex-col bg-[#07080e]">

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-30 border-b border-white/6 bg-[#07080e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <div>
            <p className="text-sm font-black text-white">Espace Client</p>
            {access.entreprise && (
              <p className="flex items-center gap-1 text-[0.62rem] text-white/30"><Building2 size={9}/>{access.entreprise}</p>
            )}
          </div>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center text-sm font-black text-[#0a0a0a] shadow-lg"
            style={{background:"linear-gradient(135deg,#c9a55a,#b08d45)"}}>
            {firstName[0].toUpperCase()}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pb-24">

        {/* ── ACCUEIL ── */}
        {tab==="accueil" && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="pt-6 space-y-6">
            {/* Salutation */}
            <div className="relative overflow-hidden rounded-3xl border border-white/6 bg-white/4 px-6 py-7">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl" style={{background:GOLD}}/>
              <p className="text-[0.65rem] font-bold uppercase tracking-widest mb-2" style={{color:GOLD}}>Bienvenue</p>
              <h1 className="text-2xl font-black text-white">Bonjour, {firstName}</h1>
              {access.welcome_message && (
                <p className="mt-3 text-sm leading-relaxed text-white/50">{access.welcome_message}</p>
              )}
              <p className="mt-3 text-xs text-white/25">
                {access.portal_activated_at ? `Compte activé le ${fmtDate(access.portal_activated_at)}` : "Compte actif"}
              </p>
            </div>

            {/* Résumé rapide */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                perm.factures  && {label:"Factures",  value:factures.length,  color:"#10b981", sub:`${factures.filter(f=>f.statut==="en_attente").length} à payer`},
                perm.projets   && {label:"Projets",   value:projets.length,   color:GOLD,      sub:"en cours"},
                perm.documents && {label:"Documents", value:docs.length,      color:"#3b82f6", sub:"partagés"},
                perm.messages  && {label:"Messages",  value:msgs.length,      color:"#8b5cf6", sub:`${msgs.filter(m=>m.from==="admin").length} nouveaux`},
              ].filter(Boolean).map((item,i)=>{
                if (!item) return null;
                return (
                  <div key={i} className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/4 p-4">
                    <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-15 blur-xl" style={{background:item.color}}/>
                    <p className="text-xl font-black" style={{color:item.color}}>{item.value}</p>
                    <p className="text-[0.62rem] font-semibold text-white/40">{item.label}</p>
                    <p className="text-[0.58rem] text-white/20">{item.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* Factures récentes */}
            {perm.factures && factures.filter(f=>f.statut==="en_attente").length>0 && (
              <div>
                <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-widest text-white/30">À régler</p>
                <div className="space-y-2">
                  {factures.filter(f=>f.statut==="en_attente").slice(0,3).map(f=>(
                    <div key={f.id} className="flex items-center justify-between rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white/80">{f.sujet||f.numero}</p>
                        <p className="text-[0.6rem] text-white/30">{f.numero} · {fmtDate(f.date_document)}</p>
                      </div>
                      <p className="text-sm font-black" style={{color:GOLD}}>{fmtCur(f.total_ttc)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projets actifs */}
            {perm.projets && projets.filter(p=>p.status==="en_cours"||p.status==="actif").length>0 && (
              <div>
                <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-widest text-white/30">Projets en cours</p>
                <div className="space-y-2">
                  {projets.filter(p=>p.status==="en_cours"||p.status==="actif").slice(0,2).map(p=>(
                    <div key={p.id} className="rounded-2xl border border-white/6 bg-white/4 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-white/80">{p.nom}</p>
                        <p className="text-[0.6rem] text-white/30">{p.end_date?fmtDate(p.end_date):"—"}</p>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/8">
                        <div className="h-full rounded-full transition-all" style={{width:`${p.progress??0}%`,background:p.color??GOLD}}/>
                      </div>
                      <p className="mt-1.5 text-[0.6rem] text-white/30">{p.progress??0}% complété</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {access.email && (
              <div className="rounded-2xl border border-white/6 bg-white/4 px-5 py-4">
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25 mb-3">Votre accès</p>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Mail size={13}/> {access.email}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── FACTURES ── */}
        {tab==="factures" && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="pt-6 space-y-3">
            <h2 className="text-lg font-black text-white">Factures & Devis</h2>
            {factures.length===0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <FileText size={32} className="text-white/10"/>
                <p className="text-white/30">Aucun document disponible</p>
              </div>
            ) : (
              factures.map(f=>{
                const s = STATUT_DOC[f.statut] ?? STATUT_DOC.brouillon;
                const Icon = s.icon;
                return (
                  <div key={f.id} className="rounded-2xl border border-white/6 bg-white/4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white/85 truncate">{f.sujet||f.numero}</p>
                        <p className="text-xs text-white/35 mt-0.5">{f.numero} · {fmtDate(f.date_document)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5"
                        style={{background:`${s.color}12`,borderColor:`${s.color}25`,color:s.color}}>
                        <Icon size={10}/>
                        <span className="text-[0.62rem] font-bold">{s.label}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[0.62rem] px-2 py-0.5 rounded-full font-semibold capitalize"
                        style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)"}}>
                        {f.type}
                      </span>
                      <span className="text-base font-black" style={{color:GOLD}}>{fmtCur(f.total_ttc)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ── PROJETS ── */}
        {tab==="projets" && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="pt-6 space-y-3">
            <h2 className="text-lg font-black text-white">Mes Projets</h2>
            {projets.length===0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <Folder size={32} className="text-white/10"/>
                <p className="text-white/30">Aucun projet partagé</p>
              </div>
            ) : (
              projets.map(p=>(
                <div key={p.id} className="rounded-2xl border border-white/6 bg-white/4 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-white/85">{p.nom}</p>
                    <span className="text-[0.62rem] text-white/30">{p.end_date?`Échéance ${fmtDate(p.end_date)}`:"—"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8 mb-2">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{width:`${p.progress??0}%`,background:p.color??GOLD}}/>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/30">{p.progress??0}% complété</p>
                    <span className="text-[0.62rem] px-2 py-0.5 rounded-full capitalize"
                      style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)"}}>
                      {p.status?.replace(/_/g," ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab==="documents" && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="pt-6 space-y-3">
            <h2 className="text-lg font-black text-white">Documents partagés</h2>
            {docs.length===0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <FileText size={32} className="text-white/10"/>
                <p className="text-white/30">Aucun document partagé</p>
              </div>
            ) : (
              docs.map(doc=>(
                <div key={doc.id} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/8">
                    <FileText size={16} className="text-white/40"/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white/80 truncate">{doc.name}</p>
                    <p className="text-[0.6rem] text-white/30">{fmtSize(doc.size)} · {fmtDate(doc.uploadedAt)}</p>
                  </div>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      onClick={async()=>{
                        await supabase.from("portal_audit_log").insert({
                          portal_client_id: access.id,
                          action:"telechargement",
                          resource_type:"portail_doc",
                          metadata:{name:doc.name},
                        });
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 text-white/30 transition hover:bg-white/8 hover:text-white/70">
                      <Download size={14}/>
                    </a>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ── MESSAGES ── */}
        {tab==="messages" && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="flex flex-col pt-6" style={{height:"calc(100vh - 180px)"}}>
            <h2 className="mb-4 text-lg font-black text-white shrink-0">Messagerie</h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {msgs.length===0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <MessageSquare size={32} className="text-white/10"/>
                  <p className="text-white/30">Aucun message</p>
                  <p className="text-xs text-white/20">Envoyez un message à votre prestataire</p>
                </div>
              ) : (
                msgs.map(m=>(
                  <div key={m.id} className={`flex ${m.from==="client"?"justify-end":"justify-start"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                      m.from==="client"
                        ? "rounded-br-sm bg-white/12 border border-white/15"
                        : "rounded-bl-sm bg-white/5 border border-white/8"
                    }`}>
                      <p className="text-sm leading-relaxed text-white/85">{m.text}</p>
                      <p className="mt-1.5 text-[0.58rem] text-white/25">
                        {m.from==="admin"?"Votre prestataire":"Vous"} · {new Date(m.date).toLocaleString("fr-FR",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"})}
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
                placeholder="Votre message…"
                className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/20"/>
              <button onClick={()=>void sendMsg()} disabled={!msgInput.trim()||sending}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-white/50 transition hover:bg-white/15 hover:text-white disabled:opacity-30">
                {sending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/6 bg-[#07080e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
          {navItems.map(item=>{
            const Icon = item.icon;
            const active = tab===item.id;
            return (
              <button key={item.id} onClick={()=>setTab(item.id)}
                className="relative flex flex-col items-center gap-1 px-4 py-2 transition-all">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${active?"scale-110":""}`}
                  style={active?{background:`${GOLD}18`,color:GOLD}:{color:"rgba(255,255,255,0.3)"}}>
                  <Icon size={16}/>
                </div>
                <span className="text-[0.58rem] font-semibold transition-all"
                  style={{color:active?GOLD:"rgba(255,255,255,0.25)"}}>
                  {item.label}
                </span>
                {item.count && item.count>0 && !active && (
                  <span className="absolute -right-0.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[0.5rem] font-bold text-white">
                    {item.count>9?"9+":item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
