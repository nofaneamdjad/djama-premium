"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Loader2, Trash2, Calendar, Hash, Send,
  Sparkles, Camera, Globe, Briefcase, Music, Clock,
  ImagePlus, X, Play, Copy, Check, ChevronLeft, ChevronRight,
  Eye, TrendingUp, Bell, ThumbsUp, MessageCircle, Repeat2,
  Plus, Heart, BarChart2, Smartphone,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

/* ── Types ── */
type Platform   = "instagram" | "facebook" | "linkedin" | "tiktok";
type PostStatus = "brouillon" | "planifié" | "publié";
type ViewTab    = "flux" | "calendrier" | "analytics" | "monitoring";

interface SocialPost {
  id:string; user_id:string; platform:Platform; content:string;
  hashtags:string[]; status:PostStatus; scheduled_at:string|null;
  published_at:string|null; media_urls:string[]; created_at:string;
}
type Draft = {
  platforms:Platform[]; content:string; hashtags:string;
  scheduled_date:string; scheduled_time:string;
};
interface PostStats { likes:number; comments:number; shares:number; views:number; }
interface Mention   { id:string; keyword:string; source:string; text:string; date:string; read:boolean; }

/* ── Constants ── */
const VIOLET = "#8b5cf6";
const SKY    = "#0ea5e9";
const MAX_FILES   = 4;
const MAX_SIZE_MB = 50;

const PLATFORMS: {id:Platform; label:string; color:string; limit:number; Icon:React.FC<{size?:number}>}[] = [
  {id:"instagram", label:"Instagram", color:"#e1306c", limit:2200,  Icon:Camera   },
  {id:"facebook",  label:"Facebook",  color:"#1877f2", limit:63206, Icon:Globe    },
  {id:"linkedin",  label:"LinkedIn",  color:"#0a66c2", limit:3000,  Icon:Briefcase},
  {id:"tiktok",    label:"TikTok",    color:"#6ee7f7", limit:2200,  Icon:Music    },
];

const STATUS_CFG: Record<PostStatus,{label:string;color:string;bg:string}> = {
  brouillon: {label:"Brouillon", color:"#f59e0b", bg:"rgba(245,158,11,.12)"},
  planifié:  {label:"Planifié",  color:"#3b82f6", bg:"rgba(59,130,246,.12)"},
  publié:    {label:"Publié",    color:"#10b981", bg:"rgba(16,185,129,.12)"},
};

const IDEAS = [
  "Conseil pro de la semaine pour votre secteur",
  "Coulisses de votre activité — montrez votre quotidien",
  "Mise en avant d'un avis client",
  "Annonce d'une offre ou promotion",
  "Astuce métier concrète à appliquer tout de suite",
  "Présentation d'un nouveau service ou produit",
  "Résultat ou chiffre clé de votre activité",
  "Question ouverte à votre communauté",
];

const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

/* ── Supabase helpers ── */
async function saveStatDB(uid:string, postId:string, s:PostStats) {
  void supabase.from("social_post_stats").upsert(
    { user_id:uid, post_id:postId, ...s, updated_at:new Date().toISOString() },
    { onConflict:"user_id,post_id" }
  );
}
async function saveMonDB(uid:string, keywords:string[], mentions:Mention[]) {
  void supabase.from("social_monitoring").upsert(
    { user_id:uid, keywords, mentions, updated_at:new Date().toISOString() },
    { onConflict:"user_id" }
  );
}

function seedStats(postId:string): PostStats {
  const n = postId.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  return {
    views:    ((n%23)+4)*150,
    likes:    ((n%17)+2)*18,
    comments: ((n%9)+1)*5,
    shares:   ((n%7)+1)*4,
  };
}

/* ── Helpers ── */
function fmtDatePost(iso:string|null) {
  if (!iso) return "—";
  const d = new Date(iso); const diff = d.getTime()-Date.now();
  if (diff>0) { const h=Math.round(diff/3600000); if (h<1) return "Bientôt"; if (h<24) return `Dans ${h}h`; const days=Math.floor(h/24); return days===1?"Demain":`Dans ${days}j`; }
  return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
}
function isVideo(url:string) { return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url); }
function fmtNum(n:number) { return n>=1000?(n/1000).toFixed(1)+"k":String(n); }

/* ── MediaThumb ── */
function MediaThumb({src,onRemove,isDark}:{src:string;onRemove?:()=>void;isDark?:boolean}) {
  const video = isVideo(src);
  return (
    <div className="relative shrink-0">
      {video ? (
        <div className={`relative h-20 w-20 overflow-hidden rounded-xl ${isDark?"bg-white/6":"bg-black/5"}`}>
          <video src={src} className="h-full w-full object-cover" preload="metadata" muted/>
          <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Play size={16} className="text-white" fill="white"/></div>
        </div>
      ) : (
        <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover"/>
      )}
      {onRemove && (
        <button onClick={onRemove}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-red-500">
          <X size={10}/>
        </button>
      )}
    </div>
  );
}

/* ── Post Preview ── */
function PostPreview({platform,content,hashtags,mediaUrls}:{platform:Platform;content:string;hashtags:string;mediaUrls:string[]}) {
  const pf = PLATFORMS.find(p=>p.id===platform)!;
  const cap = content.slice(0,200)+(content.length>200?"…":"");
  const tags = hashtags.trim();

  if (platform==="instagram") return (
    <div className="mx-auto overflow-hidden rounded-2xl shadow-2xl" style={{maxWidth:280,background:"#fff"}}>
      <div className="flex items-center gap-2 px-3 py-2" style={{background:"#fff"}}>
        <div className="w-7 h-7 rounded-full shrink-0" style={{background:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"}}/>
        <p className="text-[11px] font-bold text-black flex-1">votre_compte</p>
        <span className="text-black text-sm font-bold leading-none">···</span>
      </div>
      {mediaUrls[0] ? (
        <img src={mediaUrls[0]} alt="" className="w-full aspect-square object-cover"/>
      ) : (
        <div className="w-full flex items-center justify-center" style={{aspectRatio:"1",background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)"}}>
          <Camera size={40} className="opacity-20 text-white"/>
        </div>
      )}
      <div className="px-3 pt-2.5 pb-3" style={{background:"#fff"}}>
        <div className="flex items-center gap-3.5 mb-2">
          <Heart size={20} className="text-black"/><MessageCircle size={20} className="text-black"/><Repeat2 size={20} className="text-black"/>
        </div>
        <p className="text-[11px] text-black leading-relaxed">
          <span className="font-bold">votre_compte</span> {cap}
        </p>
        {tags && <p className="text-[10px] mt-0.5" style={{color:"#385185"}}>{tags.split(/\s+/).slice(0,6).join(" ")}</p>}
        <p className="text-[9px] text-gray-400 mt-1">il y a quelques secondes</p>
      </div>
    </div>
  );

  if (platform==="linkedin") return (
    <div className="mx-auto overflow-hidden rounded-xl shadow-2xl" style={{maxWidth:480,background:"#fff",fontFamily:"system-ui"}}>
      <div className="flex items-start gap-2.5 p-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{background:"#0a66c2"}}>
          <Briefcase size={18} className="text-white"/>
        </div>
        <div>
          <p className="text-[12px] font-bold text-gray-900">Votre Nom</p>
          <p className="text-[10px] text-gray-500">Entrepreneur · 1er · Maintenant · 🌐</p>
        </div>
      </div>
      <p className="px-3 pb-3 text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed">{cap}</p>
      {tags && <p className="px-3 pb-3 text-[11px]" style={{color:"#0a66c2"}}>{tags}</p>}
      {mediaUrls[0] && <img src={mediaUrls[0]} alt="" className="w-full object-cover"/>}
      <div className="flex border-t border-gray-100">
        {["👍 J'aime","💬 Commenter","🔁 Partager","📤 Envoyer"].map(a=>(
          <div key={a} className="flex-1 text-center py-2 text-[10px] text-gray-500">{a}</div>
        ))}
      </div>
    </div>
  );

  if (platform==="tiktok") return (
    <div className="mx-auto relative overflow-hidden rounded-2xl shadow-2xl" style={{maxWidth:200,aspectRatio:"9/16",background:"#000"}}>
      {mediaUrls[0] ? (
        <video src={mediaUrls[0]} className="w-full h-full object-cover" muted/>
      ) : (
        <div className="w-full h-full" style={{background:"linear-gradient(180deg,#1a1a2e,#16213e,#0f3460)"}}/>
      )}
      <div className="absolute inset-0 p-3 flex flex-col justify-end">
        <div className="mb-2">
          <p className="text-white font-bold text-[11px]">@votre_compte</p>
          <p className="text-white/80 text-[10px] mt-1 leading-snug">{cap.slice(0,80)}</p>
          {tags && <p className="text-white/50 text-[9px] mt-0.5">{tags.split(/\s+/).slice(0,3).join(" ")}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <Music size={10} className="text-white"/><p className="text-white/50 text-[9px]">Son original · votre_compte</p>
        </div>
      </div>
      <div className="absolute right-2 bottom-14 flex flex-col items-center gap-4">
        {[{icon:<Heart size={20}/>,n:"0"},{icon:<MessageCircle size={20}/>,n:"0"},{icon:<Repeat2 size={20}/>,n:"0"}].map(({icon,n},i)=>(
          <div key={i} className="flex flex-col items-center"><div className="text-white">{icon}</div><span className="text-white text-[9px]">{n}</span></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto overflow-hidden rounded-xl shadow-2xl" style={{maxWidth:480,background:"#fff"}}>
      <div className="flex items-center gap-2 p-3">
        <div className="w-9 h-9 rounded-full shrink-0" style={{background:"#1877f2"}}/>
        <div>
          <p className="text-[12px] font-bold text-gray-900">Votre Page</p>
          <p className="text-[10px] text-gray-400">Maintenant · 🌐</p>
        </div>
      </div>
      <p className="px-3 pb-3 text-[13px] text-gray-900 whitespace-pre-wrap leading-relaxed">{cap}</p>
      {tags && <p className="px-3 pb-2 text-[11px]" style={{color:"#1877f2"}}>{tags}</p>}
      {mediaUrls[0] && <img src={mediaUrls[0]} alt="" className="w-full object-cover"/>}
      <div className="flex border-t border-gray-100">
        {["👍 J'aime","💬 Commenter","↗ Partager"].map(a=>(
          <div key={a} className="flex-1 text-center py-2 text-[11px] text-gray-500">{a}</div>
        ))}
      </div>
    </div>
  );
}

/* ── Calendar view ── */
function CalendarView({posts,selectedDay,onDayClick,calMonth,onPrevMonth,onNextMonth,isDark}:{
  posts:SocialPost[]; selectedDay:string|null; onDayClick:(d:string)=>void;
  calMonth:Date; onPrevMonth:()=>void; onNextMonth:()=>void; isDark:boolean;
}) {
  const today = new Date().toISOString().slice(0,10);
  const year=calMonth.getFullYear(), m=calMonth.getMonth();
  const firstDayRaw = new Date(year,m,1).getDay();
  const startOffset = (firstDayRaw+6)%7;
  const daysInMonth = new Date(year,m+1,0).getDate();
  const cells:(string|null)[] = [...Array(startOffset).fill(null),...Array.from({length:daysInMonth},(_,i)=>`${year}-${String(m+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`)];
  while (cells.length%7!==0) cells.push(null);
  const postsByDay = useMemo(()=>{
    const map:Record<string,SocialPost[]>={};
    posts.forEach(p=>{ if(p.scheduled_at){const day=p.scheduled_at.slice(0,10); if(!map[day])map[day]=[]; map[day].push(p);}});
    return map;
  },[posts]);

  const cardCls = isDark ? "rounded-2xl border border-white/6 bg-white/[0.04] p-5" : "rounded-2xl border border-black/8 bg-white shadow-sm p-5";
  const navBtnCls = isDark ? "text-white/40 hover:bg-white/8 hover:text-white" : "text-[#0e1420]/40 hover:bg-black/5 hover:text-[#0e1420]";
  const monthLabel = isDark ? "text-white" : "text-[#0e1420]";
  const dayHeader = isDark ? "text-white/25" : "text-[#0e1420]/30";

  return (
    <div className={cardCls}>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onPrevMonth} className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${navBtnCls}`}><ChevronLeft size={15}/></button>
        <span className={`text-sm font-bold capitalize ${monthLabel}`}>{calMonth.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}</span>
        <button onClick={onNextMonth} className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${navBtnCls}`}><ChevronRight size={15}/></button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {DAYS_FR.map(d=><div key={d} className={`py-1 text-center text-[10px] font-semibold uppercase ${dayHeader}`}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dateStr,i)=>{
          if (!dateStr) return <div key={i} className="min-h-[48px]"/>;
          const dayPosts=postsByDay[dateStr]??[]; const isToday=dateStr===today; const isSel=dateStr===selectedDay; const dayNum=parseInt(dateStr.slice(-2));
          return (
            <button key={dateStr} onClick={()=>onDayClick(dateStr)}
              className="flex min-h-[48px] flex-col items-center rounded-xl px-1 py-1.5 transition-all"
              style={{
                background: isSel ? "rgba(139,92,246,0.15)" : isToday ? (isDark?"rgba(255,255,255,0.06)":"rgba(139,92,246,0.06)") : "transparent",
                border: `0.5px solid ${isSel?"rgba(139,92,246,0.45)":isToday?(isDark?"rgba(255,255,255,0.14)":"rgba(139,92,246,0.25)"):"transparent"}`,
              }}>
              <span className={`mb-1 text-[11px] font-semibold leading-none ${isToday?"text-violet-500":isSel?(isDark?"text-white":"text-[#0e1420]"):(isDark?"text-white/45":"text-[#0e1420]/40")}`}>{dayNum}</span>
              <div className="flex flex-wrap justify-center gap-[2px]">
                {dayPosts.slice(0,3).map((p,j)=>{const pf=PLATFORMS.find(x=>x.id===p.platform)!; return <div key={j} className="h-1.5 w-1.5 rounded-full" style={{background:pf.color}}/>;  })}
                {dayPosts.length>3 && <span className={`text-[8px] ${isDark?"text-white/30":"text-[#0e1420]/30"}`}>+{dayPosts.length-3}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function ReseauxSociauxPage() {
  const router = useRouter();
  const { toasts, add: toast, remove } = useToastStack();
  const { isDark } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [posts,       setPosts]       = useState<SocialPost[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [filter,      setFilter]      = useState<Platform|"tous">("tous");
  const [showIdeas,   setShowIdeas]   = useState(false);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [mediaFiles,  setMediaFiles]  = useState<File[]>([]);
  const [previews,    setPreviews]    = useState<string[]>([]);
  const [copiedId,    setCopiedId]    = useState<string|null>(null);
  const [activeTab,   setActiveTab]   = useState<ViewTab>("flux");
  const [calMonth,    setCalMonth]    = useState(()=>new Date());
  const [calSelected, setCalSelected] = useState<string|null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [postStats,    setPostStats]    = useState<Record<string,PostStats>>({});
  const [monKeywords,  setMonKeywords]  = useState<string[]>([]);
  const [monMentions,  setMonMentions]  = useState<Mention[]>([]);
  const [keyInput,     setKeyInput]     = useState("");
  const [mForm, setMForm] = useState({keyword:"", source:"", text:""});

  const [draft, setDraft] = useState<Draft>({platforms:["instagram"],content:"",hashtags:"",scheduled_date:"",scheduled_time:"10:00"});
  const setField = <K extends keyof Draft>(k:K, v:Draft[K]) => setDraft(d=>({...d,[k]:v}));
  const togglePlatform = (id:Platform) => setDraft(d=>({...d,platforms:d.platforms.includes(id) ? (d.platforms.length>1?d.platforms.filter(p=>p!==id):d.platforms) : [...d.platforms,id]}));

  useEffect(()=>{
    const urls=mediaFiles.map(f=>URL.createObjectURL(f));
    setPreviews(urls);
    return ()=>{ urls.forEach(URL.revokeObjectURL); };
  },[mediaFiles]);

  const postsRef = useRef(posts);
  postsRef.current = posts;
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = userId;

  useEffect(()=>{
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [statsRes, monRes] = await Promise.all([
        supabase.from("social_post_stats").select("post_id,likes,comments,shares,views").eq("user_id", user.id),
        supabase.from("social_monitoring").select("keywords,mentions").eq("user_id", user.id).maybeSingle(),
      ]);
      if (statsRes.data?.length) {
        const map: Record<string,PostStats> = {};
        statsRes.data.forEach((r: Record<string,unknown>) => { map[String(r.post_id)] = { likes: Number(r.likes), comments: Number(r.comments), shares: Number(r.shares), views: Number(r.views) }; });
        setPostStats(map);
      }
      if (monRes.data) {
        setMonKeywords((monRes.data.keywords as string[]) ?? []);
        setMonMentions((monRes.data.mentions as Mention[]) ?? []);
      }
    })();
  },[]);

  useEffect(()=>{
    const check = async () => {
      const now = new Date().toISOString();
      const toPublish = postsRef.current.filter(p=>p.status==="planifié"&&p.scheduled_at&&p.scheduled_at<=now);
      if (toPublish.length===0) return;
      await Promise.all(toPublish.map(p=>supabase.from("social_posts").update({status:"publié",published_at:now}).eq("id",p.id)));
      const uid = userIdRef.current;
      const statsUp: Partial<Record<string,PostStats>> = {};
      toPublish.forEach(p=>{ if (!postStats[p.id]) statsUp[p.id]=seedStats(p.id); });
      if (Object.keys(statsUp).length>0 && uid) {
        const merged={...postStats,...statsUp} as Record<string,PostStats>;
        setPostStats(merged);
        Object.entries(statsUp).forEach(([pid, s]) => { if (s) void saveStatDB(uid, pid, s); });
      }
      setPosts(prev=>prev.map(p=>toPublish.some(x=>x.id===p.id)?{...p,status:"publié" as PostStatus,published_at:now}:p));
      toast(`${toPublish.length} post${toPublish.length>1?"s":""} auto-publié${toPublish.length>1?"s":""}  🚀`,"success");
    };
    void check();
    const id = setInterval(check, 60000);
    return ()=>clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const load = useCallback(async ()=>{
    try {
      const {data:{user}} = await supabase.auth.getUser();
      if (!user) { if (process.env.NODE_ENV !== "development") { router.replace("/login"); return; } return; }
      const {data,error} = await supabase.from("social_posts").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(200);
      if (error) { toast("Erreur réseau","error"); return; }
      setPosts((data??[]) as SocialPost[]);
    } catch { toast("Erreur réseau","error"); }
    finally { setLoading(false); }
  },[router,toast]);

  useEffect(()=>{ void load(); },[load]);

  function pickFiles(files:FileList|null) {
    if (!files) return;
    const valid = Array.from(files).filter(f=>{
      if (!f.type.startsWith("image/")&&!f.type.startsWith("video/")) return false;
      if (f.size>MAX_SIZE_MB*1024*1024) { toast(`${f.name} dépasse ${MAX_SIZE_MB} Mo`,"error"); return false; }
      return true;
    });
    setMediaFiles(prev=>[...prev,...valid].slice(0,MAX_FILES));
  }
  function removeFile(i:number) { setMediaFiles(prev=>prev.filter((_,idx)=>idx!==i)); }
  async function uploadMedia(userId:string): Promise<string[]> {
    const urls:string[] = [];
    for (const file of mediaFiles) {
      const ext=file.name.split(".").pop()??"bin";
      const path=`${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const {error} = await supabase.storage.from("social-media").upload(path,file,{upsert:false});
      if (error) throw new Error(error.message);
      const {data:{publicUrl}} = supabase.storage.from("social-media").getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  }

  async function generateContent() {
    if (!draft.content.trim()&&!draft.hashtags.trim()) { toast("Entrez un sujet ou des mots-clés.","error"); return; }
    setAiLoading(true);
    try {
      const pf=PLATFORMS.find(p=>p.id===draft.platforms[0])!;
      const res = await fetch("/api/social/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({platform:pf.label,topic:draft.content.trim()||draft.hashtags.trim(),hashtags:draft.hashtags.trim()})});
      const data = await res.json() as {content?:string;error?:string};
      if (!res.ok) { toast(data.error??`Erreur ${res.status}`,"error"); return; }
      if (data.content) setField("content",data.content);
    } catch { toast("Erreur réseau","error"); }
    finally { setAiLoading(false); }
  }

  async function savePost() {
    if (!draft.content.trim()) { toast("Le contenu est requis.","error"); return; }
    setSaving(true);
    try {
      const {data:{user}} = await supabase.auth.getUser();
      if (!user) { toast("Session expirée.","error"); return; }
      let media_urls:string[] = [];
      if (mediaFiles.length>0) { try { media_urls=await uploadMedia(user.id); } catch { toast("Erreur médias.","error"); return; } }
      const scheduled_at = draft.scheduled_date ? new Date(`${draft.scheduled_date}T${draft.scheduled_time}`).toISOString() : null;
      const status:PostStatus = scheduled_at?"planifié":"brouillon";
      const hashArr = draft.hashtags.split(/\s+/).filter(h=>h.startsWith("#")&&h.length>1);
      const inserts = draft.platforms.map(platform=>({user_id:user.id,platform,content:draft.content.trim(),hashtags:hashArr,status,scheduled_at,media_urls}));
      const {data,error} = await supabase.from("social_posts").insert(inserts).select();
      if (error) { toast("Erreur sauvegarde.","error"); return; }
      if (data) setPosts(p=>[...(data as SocialPost[]),...p]);
      setDraft(d=>({...d,content:"",hashtags:"",scheduled_date:""}));
      setMediaFiles([]);
      const label=draft.platforms.length>1?`${draft.platforms.length} plateformes`:PLATFORMS.find(p=>p.id===draft.platforms[0])!.label;
      toast(status==="planifié"?`Post planifié sur ${label}`:`Brouillon sauvegardé sur ${label}`,"success");
    } finally { setSaving(false); }
  }

  async function deletePost(id:string) {
    const {error} = await supabase.from("social_posts").delete().eq("id",id);
    if (error) { toast("Erreur suppression.","error"); return; }
    setPosts(p=>p.filter(x=>x.id!==id));
    toast("Post supprimé","success");
  }

  async function sharePost(post:SocialPost) {
    const text=[post.content,post.hashtags.join(" ")].filter(Boolean).join("\n\n");
    try {
      if (typeof navigator!=="undefined"&&navigator.share) { await navigator.share({text}); }
      else { await navigator.clipboard.writeText(text); setCopiedId(post.id); toast("Post copié","success"); setTimeout(()=>setCopiedId(null),2000); }
    } catch { /* Annulé */ }
  }

  async function markPublished(post:SocialPost) {
    const now = new Date().toISOString();
    const {error} = await supabase.from("social_posts").update({status:"publié",published_at:now}).eq("id",post.id);
    if (error) { toast("Erreur mise à jour statut","error"); return; }
    setPosts(p=>p.map(x=>x.id===post.id?{...x,status:"publié" as PostStatus,published_at:now}:x));
    if (!postStats[post.id] && userId) {
      const stats=seedStats(post.id); const updated={...postStats,[post.id]:stats};
      setPostStats(updated); void saveStatDB(userId, post.id, stats);
    }
    toast("Marqué comme publié","success");
  }

  function addKeyword() {
    if (!keyInput.trim()||monKeywords.includes(keyInput.trim().toLowerCase())) { setKeyInput(""); return; }
    const updated=[...monKeywords,keyInput.trim().toLowerCase()];
    setMonKeywords(updated); if(userId) void saveMonDB(userId, updated, monMentions); setKeyInput("");
  }
  function removeKeyword(k:string) {
    const updated=monKeywords.filter(x=>x!==k);
    setMonKeywords(updated); if(userId) void saveMonDB(userId, updated, monMentions);
  }
  function addMention() {
    if (!mForm.text.trim()||!mForm.keyword) return;
    const m:Mention={id:Math.random().toString(36).slice(2,10),keyword:mForm.keyword,source:mForm.source||"Web",text:mForm.text.trim(),date:new Date().toISOString().slice(0,10),read:false};
    const updated=[m,...monMentions];
    setMonMentions(updated); if(userId) void saveMonDB(userId, monKeywords, updated); setMForm({keyword:"",source:"",text:""});
  }
  function markMentionRead(id:string) {
    const updated=monMentions.map(m=>m.id===id?{...m,read:true}:m);
    setMonMentions(updated); if(userId) void saveMonDB(userId, monKeywords, updated);
  }
  function deleteMention(id:string) {
    const updated=monMentions.filter(m=>m.id!==id);
    setMonMentions(updated); if(userId) void saveMonDB(userId, monKeywords, updated);
  }

  /* ── Computed ── */
  const filtered = useMemo(()=>filter==="tous"?posts:posts.filter(p=>p.platform===filter),[posts,filter]);
  const postsForCalDay = useMemo(()=>calSelected?posts.filter(p=>p.scheduled_at?.slice(0,10)===calSelected):[],[posts,calSelected]);
  const kpis = useMemo(()=>({
    planifiés:  posts.filter(p=>p.status==="planifié").length,
    brouillons: posts.filter(p=>p.status==="brouillon").length,
    publiés:    posts.filter(p=>p.status==="publié").length,
  }),[posts]);

  const charLimit = PLATFORMS.find(p=>p.id===draft.platforms[0])?.limit??2200;
  const charPct   = Math.min((draft.content.length/charLimit)*100,100);
  const charOver  = draft.content.length>charLimit;

  const analyticsData = useMemo(()=>{
    return PLATFORMS.map(pf=>{
      const pfPosts = posts.filter(p=>p.platform===pf.id&&p.status==="publié");
      const stats   = pfPosts.map(p=>postStats[p.id]).filter(Boolean);
      const totalViews    = stats.reduce((s,x)=>s+x.views,0);
      const totalLikes    = stats.reduce((s,x)=>s+x.likes,0);
      const totalComments = stats.reduce((s,x)=>s+x.comments,0);
      const totalShares   = stats.reduce((s,x)=>s+x.shares,0);
      const engRate = totalViews>0 ? ((totalLikes+totalComments+totalShares)/totalViews*100).toFixed(1) : "0.0";
      return {pf, count:pfPosts.length, totalViews, totalLikes, totalComments, totalShares, engRate};
    });
  },[posts,postStats]);

  const unreadMentions = monMentions.filter(m=>!m.read).length;

  /* ── Theme vars ── */
  const pageBg    = isDark ? "bg-[#07080e] text-white"       : "bg-[#f0f2fb] text-[#0e1420]";
  const card      = isDark ? "border-white/6 bg-white/[0.04]"  : "border-black/8 bg-white shadow-sm";
  const cardInner = isDark ? "border-white/6 bg-white/[0.03]"  : "border-black/6 bg-[#f7f7fb]";
  const textPri   = isDark ? "text-white"      : "text-[#0e1420]";
  const textSec   = isDark ? "text-white/60"   : "text-[#0e1420]/60";
  const textMut   = isDark ? "text-white/35"   : "text-[#0e1420]/40";
  const textFaint = isDark ? "text-white/20"   : "text-[#0e1420]/25";
  const labelCls  = isDark ? "text-white/30"   : "text-[#0e1420]/40";
  const inputCls  = isDark
    ? "bg-white/[0.04] border-white/8 text-white placeholder:text-white/20 [color-scheme:dark]"
    : "bg-white border-black/10 text-[#0e1420] placeholder:text-[#0e1420]/30";
  const hoverBtn  = isDark ? "hover:bg-white/8" : "hover:bg-black/5";
  const divider   = isDark ? "border-white/5"  : "border-black/5";

  if (loading) return (
    <div className={`flex h-64 items-center justify-center ${isDark?"bg-[#07080e]":"bg-[#f0f2fb]"}`}>
      <Loader2 size={28} className="animate-spin text-violet-400"/>
    </div>
  );

  return (
    <div className={`min-h-screen space-y-6 px-4 py-6 lg:px-8 ${pageBg}`}>
      <ToastStack toasts={toasts} remove={remove}/>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ModuleHeaderIcon icon={Share2} color="#e1306c" />
          <div>
            <h1 className={`text-[17px] font-black ${textPri}`}>Réseaux Sociaux</h1>
            <p className={`text-[11px] ${textSec}`}>Créez, planifiez et analysez vos publications</p>
          </div>
        </div>
        {(() => {
          const next = posts.filter(p=>p.status==="planifié"&&p.scheduled_at).sort((a,b)=>a.scheduled_at!.localeCompare(b.scheduled_at!))[0];
          if (!next) return null;
          return (
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark?"border-blue-500/25 bg-blue-500/8":"border-blue-200 bg-blue-50"}`}>
              <Clock size={12} className="text-blue-400 animate-pulse"/>
              <span className={`text-xs ${isDark?"text-blue-300":"text-blue-600"}`}>Prochain post : <strong>{fmtDatePost(next.scheduled_at)}</strong></span>
            </div>
          );
        })()}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:"Planifiés",  value:kpis.planifiés,  color:"#3b82f6"},
          {label:"Brouillons", value:kpis.brouillons, color:"#f59e0b"},
          {label:"Publiés",    value:kpis.publiés,    color:"#10b981"},
        ].map(k=>(
          <div key={k.label} className={`rounded-2xl border p-4 text-center ${card}`}>
            <p className="text-2xl font-extrabold" style={{color:k.color}}>{k.value}</p>
            <p className={`mt-0.5 text-xs ${textMut}`}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

        {/* ── Composer ── */}
        <div className={`space-y-4 rounded-2xl border p-5 self-start ${card}`}>
          <div className="flex items-center justify-between">
            <h2 className={`font-bold ${textPri}`}>Créer un post</h2>
            <div className="flex items-center gap-2">
              <button onClick={()=>setShowPreview(v=>!v)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition border`}
                style={showPreview
                  ?{background:`${SKY}20`,borderColor:`${SKY}30`,color:SKY}
                  :{background:isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",borderColor:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",color:isDark?"rgba(255,255,255,0.4)":"rgba(14,20,32,0.4)"}}>
                <Smartphone size={11}/>{showPreview?"Masquer":"Aperçu"}
              </button>
              <button onClick={()=>setShowIdeas(s=>!s)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-violet-500 transition hover:opacity-80"
                style={{background:"rgba(139,92,246,.12)"}}>
                <Sparkles size={11}/> Idées
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showIdeas && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
                <div className={`rounded-xl border p-2 ${cardInner}`}>
                  {IDEAS.map((idea,i)=>(
                    <button key={i} onClick={()=>{setField("content",idea);setShowIdeas(false);}}
                      className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${textMut} ${hoverBtn} hover:${textPri}`}>{idea}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Plateformes */}
          <div>
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-wider ${labelCls}`}>
              Plateformes{draft.platforms.length>1 && <span className="ml-2 font-normal normal-case text-violet-400">× {draft.platforms.length} simultanément</span>}
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map(pf=>{
                const active=draft.platforms.includes(pf.id);
                return (
                  <button key={pf.id} onClick={()=>togglePlatform(pf.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition"
                    style={active
                      ?{background:pf.color+"22",borderColor:pf.color+"55",color:pf.color}
                      :{borderColor:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)",color:isDark?"rgba(255,255,255,0.30)":"rgba(14,20,32,0.35)"}}>
                    <pf.Icon size={12}/><span className="hidden sm:inline">{pf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenu */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={`text-xs font-semibold uppercase tracking-wider ${labelCls}`}>Contenu</label>
              <span className={`text-xs font-semibold ${charOver?"text-red-400":charPct>80?"text-amber-400":textFaint}`}>{draft.content.length}/{charLimit.toLocaleString("fr-FR")}</span>
            </div>
            <textarea value={draft.content} onChange={e=>setField("content",e.target.value)}
              placeholder="Rédigez votre post ou entrez un sujet pour la génération IA..." rows={5}
              className={`w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none ${inputCls}`}
              style={{borderColor:charOver?"rgba(239,68,68,0.4)":isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)"}}/>
            <div className={`mt-1.5 h-0.5 w-full overflow-hidden rounded-full ${isDark?"bg-white/8":"bg-black/6"}`}>
              <div className="h-full rounded-full transition-all" style={{width:`${charPct}%`,background:charOver?"#ef4444":charPct>80?"#f59e0b":VIOLET}}/>
            </div>
          </div>

          {/* Médias */}
          <div>
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-wider ${labelCls}`}>
              Photos / Vidéos <span className={`ml-1.5 font-normal normal-case ${textFaint}`}>({mediaFiles.length}/{MAX_FILES} — max {MAX_SIZE_MB} Mo)</span>
            </label>
            {previews.length>0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {mediaFiles.map((_,i)=><MediaThumb key={i} src={previews[i]} onRemove={()=>removeFile(i)} isDark={isDark}/>)}
              </div>
            )}
            {mediaFiles.length<MAX_FILES && (
              <>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e=>{pickFiles(e.target.files);e.target.value="";}}/>
                <button onClick={()=>fileRef.current?.click()}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-xs font-semibold transition ${isDark?"border-white/12 text-white/35 hover:border-white/25 hover:text-white/55":"border-black/12 text-[#0e1420]/35 hover:border-black/25 hover:text-[#0e1420]/55"}`}>
                  <ImagePlus size={14}/> Ajouter des photos ou vidéos
                </button>
              </>
            )}
          </div>

          {/* Hashtags */}
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${isDark?"border-white/8 bg-white/[0.04]":"border-black/10 bg-white"}`}>
            <Hash size={13} className={`shrink-0 ${isDark?"text-white/25":"text-[#0e1420]/25"}`}/>
            <input value={draft.hashtags} onChange={e=>setField("hashtags",e.target.value)}
              placeholder="#hashtag #motclé..."
              className={`flex-1 bg-transparent text-sm outline-none ${isDark?"text-white placeholder:text-white/20":"text-[#0e1420] placeholder:text-[#0e1420]/30"}`}/>
          </div>

          {/* Preview panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
                <div className={`rounded-xl border p-4 ${isDark?"border-white/8 bg-black/30":"border-black/8 bg-[#f0f2fb]"}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-4 text-center ${textFaint}`}>Aperçu — {PLATFORMS.find(p=>p.id===draft.platforms[0])?.label}</p>
                  <PostPreview
                    platform={draft.platforms[0]}
                    content={draft.content||"Votre texte apparaîtra ici…"}
                    hashtags={draft.hashtags}
                    mediaUrls={previews}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Planification */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${labelCls}`}>Date</label>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark?"border-white/8 bg-white/[0.04]":"border-black/10 bg-white"}`}>
                <Calendar size={13} className={`shrink-0 ${isDark?"text-white/25":"text-[#0e1420]/25"}`}/>
                <input type="date" value={draft.scheduled_date} onChange={e=>setField("scheduled_date",e.target.value)} className={`flex-1 bg-transparent text-sm outline-none ${isDark?"text-white [color-scheme:dark]":"text-[#0e1420]"}`}/>
              </div>
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${labelCls}`}>Heure</label>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark?"border-white/8 bg-white/[0.04]":"border-black/10 bg-white"}`}>
                <Clock size={13} className={`shrink-0 ${isDark?"text-white/25":"text-[#0e1420]/25"}`}/>
                <input type="time" value={draft.scheduled_time} onChange={e=>setField("scheduled_time",e.target.value)} className={`flex-1 bg-transparent text-sm outline-none ${isDark?"text-white [color-scheme:dark]":"text-[#0e1420]"}`}/>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={()=>void generateContent()} disabled={aiLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-500/30 py-2.5 text-sm font-bold text-violet-500 transition hover:bg-violet-500/10 disabled:opacity-40">
              {aiLoading?<Loader2 size={14} className="animate-spin"/>:<Sparkles size={14}/>}Générer IA
            </button>
            <button onClick={()=>void savePost()} disabled={saving||!draft.content.trim()||charOver}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-40"
              style={{background:VIOLET}}>
              {saving?<Loader2 size={14} className="animate-spin"/>:<Send size={14}/>}
              {draft.scheduled_date?"Planifier":"Brouillon"}
            </button>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-4">
          {/* Tab bar */}
          <div className={`flex gap-1 rounded-2xl border p-1 w-fit ${isDark?"border-white/8 bg-white/[0.03]":"border-black/8 bg-white shadow-sm"}`}>
            {([
              {k:"flux",          l:"Flux",        icon:<Share2 size={11}/>      },
              {k:"calendrier",    l:"Calendrier",  icon:<Calendar size={11}/>    },
              {k:"analytics",     l:"Analytics",   icon:<BarChart2 size={11}/>   },
              {k:"monitoring",    l:"Mentions",    icon:<Bell size={11}/>, badge:unreadMentions},
            ] as {k:ViewTab;l:string;icon:React.ReactNode;badge?:number}[]).map(({k,l,icon,badge})=>(
              <button key={k} onClick={()=>setActiveTab(k)}
                className="relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                style={activeTab===k
                  ?{background:VIOLET,color:"#fff",boxShadow:`0 2px 12px ${VIOLET}40`}
                  :{color:isDark?"rgba(255,255,255,0.4)":"rgba(14,20,32,0.45)"}}>
                {icon}{l}
                {badge && badge>0 ? <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center" style={{background:"#ef4444"}}>{badge}</span> : null}
              </button>
            ))}
          </div>

          {/* ── Flux ── */}
          {activeTab==="flux" && (
            <>
              {posts.some(p=>p.status==="publié"&&postStats[p.id]) && (
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isDark?"border-amber-400/20 bg-amber-400/6 text-amber-400/70":"border-amber-200 bg-amber-50 text-amber-700/80"}`}>
                  <span className="shrink-0 rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-500">Simulé</span>
                  Les statistiques affichées sont estimées — elles ne proviennent pas de vos vrais comptes.
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button onClick={()=>setFilter("tous")} className="rounded-xl border px-4 py-1.5 text-xs font-semibold transition"
                  style={filter==="tous"?{background:VIOLET,borderColor:VIOLET,color:"#fff"}:{borderColor:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)",color:isDark?"rgba(255,255,255,0.35)":"rgba(14,20,32,0.4)"}}>
                  Tous <span className="ml-1.5 opacity-50">{posts.length}</span>
                </button>
                {PLATFORMS.map(pf=>(
                  <button key={pf.id} onClick={()=>setFilter(pf.id)}
                    className="flex items-center gap-1.5 rounded-xl border px-4 py-1.5 text-xs font-semibold transition"
                    style={filter===pf.id?{background:pf.color+"22",borderColor:pf.color+"55",color:pf.color}:{borderColor:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)",color:isDark?"rgba(255,255,255,0.35)":"rgba(14,20,32,0.4)"}}>
                    <pf.Icon size={10}/>{pf.label}<span className="ml-1 opacity-50">{posts.filter(x=>x.platform===pf.id).length}</span>
                  </button>
                ))}
              </div>

              {filtered.length===0 ? (
                <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border py-16 text-center ${card}`}>
                  <Share2 size={32} className={textFaint}/>
                  <p className={`text-sm font-bold ${textMut}`}>Aucun post pour le moment</p>
                  <p className={`text-xs ${textFaint}`}>Créez votre premier post avec le formulaire</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map(post=>{
                    const pf=PLATFORMS.find(p=>p.id===post.platform)!;
                    const st=STATUS_CFG[post.status];
                    const copied=copiedId===post.id;
                    const media=post.media_urls??[];
                    const stats=postStats[post.id];
                    return (
                      <motion.div key={post.id} layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-10}}
                        className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold" style={{color:pf.color,background:pf.color+"20"}}><pf.Icon size={10}/>{pf.label}</span>
                          <span className="rounded-lg px-2.5 py-1 text-xs font-bold" style={{color:st.color,background:st.bg}}>{st.label}</span>
                          <div className="ml-auto flex items-center gap-1">
                            {post.status!=="publié" && <button onClick={()=>void markPublished(post)} className={`rounded-lg p-1.5 transition ${textFaint} hover:text-green-500`} title="Marquer publié"><Check size={13}/></button>}
                            <button onClick={()=>void sharePost(post)} className={`rounded-lg p-1.5 transition ${textFaint} hover:text-violet-500`} title="Copier">
                              {copied?<Check size={13} className="text-green-500"/>:<Copy size={13}/>}
                            </button>
                            <button onClick={()=>void deletePost(post.id)} className={`rounded-lg p-1.5 transition ${textFaint} hover:text-red-500`}><Trash2 size={13}/></button>
                          </div>
                        </div>
                        <p className={`line-clamp-3 text-sm leading-relaxed ${textSec}`}>{post.content}</p>
                        {media.length>0 && <div className="flex gap-2 overflow-x-auto pb-1">{media.map((url,i)=><MediaThumb key={i} src={url} isDark={isDark}/>)}</div>}
                        {post.hashtags.length>0 && <p className="text-xs text-violet-500/70">{post.hashtags.join(" ")}</p>}
                        {post.scheduled_at && <div className={`flex items-center gap-1.5 text-xs ${textFaint}`}><Clock size={10}/>{fmtDatePost(post.scheduled_at)}</div>}
                        {stats && (
                          <div className={`flex items-center gap-4 pt-1 border-t ${divider}`}>
                            {[
                              {icon:<Eye size={11}/>,          val:stats.views,    label:"vues"    },
                              {icon:<ThumbsUp size={11}/>,     val:stats.likes,    label:"j'aime"  },
                              {icon:<MessageCircle size={11}/>,val:stats.comments, label:"comments"},
                              {icon:<Repeat2 size={11}/>,      val:stats.shares,   label:"partages"},
                            ].map(({icon,val,label})=>(
                              <div key={label} className={`flex items-center gap-1 text-[10px] ${textMut}`}>
                                {icon}<span className={`font-semibold ${textSec}`}>{fmtNum(val)}</span>
                              </div>
                            ))}
                            <span className="ml-auto rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-400/12 text-amber-500 border border-amber-400/20">Simulé</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </>
          )}

          {/* ── Calendrier ── */}
          {activeTab==="calendrier" && (
            <>
              <CalendarView posts={posts} selectedDay={calSelected}
                onDayClick={d=>setCalSelected(prev=>prev===d?null:d)}
                calMonth={calMonth}
                onPrevMonth={()=>setCalMonth(d=>new Date(d.getFullYear(),d.getMonth()-1))}
                onNextMonth={()=>setCalMonth(d=>new Date(d.getFullYear(),d.getMonth()+1))}
                isDark={isDark}/>
              <AnimatePresence>
                {calSelected && (
                  <motion.div key={calSelected} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                    className={`rounded-2xl border p-4 ${card}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className={`text-sm font-bold capitalize ${textPri}`}>
                        {new Date(calSelected+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
                      </h3>
                      <button onClick={()=>setCalSelected(null)} className={`${textMut} hover:${textSec}`}><X size={13}/></button>
                    </div>
                    {postsForCalDay.length===0 ? (
                      <div className="py-8 text-center">
                        <p className={`text-xs ${textMut}`}>Aucun post planifié ce jour</p>
                        <button onClick={()=>{setField("scheduled_date",calSelected);setActiveTab("flux");}} className="mt-3 text-xs font-semibold text-violet-500 hover:text-violet-400">+ Planifier un post ce jour</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {postsForCalDay.map(post=>{
                          const pf=PLATFORMS.find(p=>p.id===post.platform)!; const st=STATUS_CFG[post.status];
                          return (
                            <div key={post.id} className={`rounded-xl border p-3 ${cardInner}`}>
                              <div className="mb-2 flex items-center gap-2">
                                <span className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold" style={{color:pf.color,background:pf.color+"20"}}><pf.Icon size={9}/>{pf.label}</span>
                                <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{color:st.color,background:st.bg}}>{st.label}</span>
                                <div className="ml-auto flex gap-1">
                                  {post.status!=="publié" && <button onClick={()=>void markPublished(post)} className={`rounded-md p-1 transition ${textFaint} hover:text-green-500`}><Check size={12}/></button>}
                                  <button onClick={()=>void deletePost(post.id)} className={`rounded-md p-1 transition ${textFaint} hover:text-red-500`}><Trash2 size={12}/></button>
                                </div>
                              </div>
                              <p className={`line-clamp-2 text-xs ${textSec}`}>{post.content}</p>
                              {post.scheduled_at && <p className={`mt-1.5 flex items-center gap-1 text-[10px] ${textFaint}`}><Clock size={9}/>{new Date(post.scheduled_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* ── Analytics ── */}
          {activeTab==="analytics" && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 ${isDark?"border-amber-400/20 bg-amber-400/6":"border-amber-200 bg-amber-50"}`}>
                <span className="shrink-0 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-500">Simulation</span>
                <p className={`text-xs ${isDark?"text-amber-400/70":"text-amber-700/80"}`}>Ces statistiques sont des estimations générées automatiquement — connectez vos comptes pour voir vos vraies données.</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  {label:"Vues totales",     icon:<Eye size={13}/>,          val:Object.values(postStats).reduce((s,x)=>s+x.views,0),    color:SKY     },
                  {label:"J'aime",           icon:<ThumbsUp size={13}/>,     val:Object.values(postStats).reduce((s,x)=>s+x.likes,0),    color:"#e1306c"},
                  {label:"Commentaires",     icon:<MessageCircle size={13}/>,val:Object.values(postStats).reduce((s,x)=>s+x.comments,0), color:"#10b981"},
                  {label:"Partages",         icon:<Repeat2 size={13}/>,      val:Object.values(postStats).reduce((s,x)=>s+x.shares,0),   color:"#f59e0b"},
                ].map(({label,icon,val,color})=>(
                  <div key={label} className={`rounded-2xl border p-4 text-center ${card}`}>
                    <div className="flex justify-center mb-1" style={{color}}>{icon}</div>
                    <p className="text-xl font-extrabold" style={{color}}>{fmtNum(val)}</p>
                    <p className={`text-[10px] mt-0.5 ${textMut}`}>{label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {analyticsData.filter(d=>d.count>0).length===0 ? (
                  <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border py-16 text-center ${card}`}>
                    <TrendingUp size={28} className={textFaint}/>
                    <p className={`text-sm font-bold ${textMut}`}>Pas encore de données</p>
                    <p className={`text-xs ${textFaint}`}>Publiez des posts pour voir les stats apparaître ici</p>
                  </div>
                ) : analyticsData.filter(d=>d.count>0).map(({pf,count,totalViews,totalLikes,totalComments,totalShares,engRate})=>{
                  const maxViews = Math.max(...analyticsData.map(d=>d.totalViews), 1);
                  return (
                    <div key={pf.id} className={`rounded-2xl border p-4 ${card}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{background:pf.color+"20",color:pf.color}}>
                          <pf.Icon size={16}/>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${textPri}`}>{pf.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{background:pf.color+"20",color:pf.color}}>{count} post{count>1?"s":""}</span>
                          </div>
                          <p className={`text-[10px] ${textMut}`}>Taux d&apos;engagement : <span style={{color:pf.color}}>{engRate}%</span></p>
                        </div>
                        <span className={`text-xs font-bold ${textMut}`}>{fmtNum(totalViews)} vues</span>
                      </div>
                      <div className={`h-1.5 rounded-full mb-3 ${isDark?"bg-white/8":"bg-black/6"}`}>
                        <div className="h-full rounded-full transition-all" style={{width:`${(totalViews/maxViews)*100}%`,background:pf.color}}/>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {label:"J'aime",   val:totalLikes,    icon:<ThumbsUp size={10}/>    },
                          {label:"Comments", val:totalComments, icon:<MessageCircle size={10}/>},
                          {label:"Partages", val:totalShares,   icon:<Repeat2 size={10}/>      },
                        ].map(({label,val,icon})=>(
                          <div key={label} className={`flex items-center gap-1.5 rounded-xl px-2 py-2 ${cardInner}`}>
                            <span className={textMut}>{icon}</span>
                            <div><p className={`text-xs font-bold ${textSec}`}>{fmtNum(val)}</p><p className={`text-[9px] ${textFaint}`}>{label}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Monitoring ── */}
          {activeTab==="monitoring" && (
            <div className="space-y-4">
              <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${textSec}`}><Bell size={14}/>Mots-clés à surveiller</h3>
                <div className="flex gap-2">
                  <input value={keyInput} onChange={e=>setKeyInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")addKeyword();}}
                    placeholder="marque, nom, produit…"
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:border-sky-500/30 transition-all ${inputCls}`}/>
                  <button onClick={addKeyword}
                    className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{background:`${SKY}20`,border:`1px solid ${SKY}30`,color:SKY}}>
                    <Plus size={14}/>
                  </button>
                </div>
                {monKeywords.length>0 && (
                  <div className="flex flex-wrap gap-2">
                    {monKeywords.map(k=>(
                      <div key={k} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${isDark?"border-white/10 bg-white/5":"border-black/8 bg-[#f0f2fb]"}`}>
                        <Hash size={10} className={textMut}/>
                        <span className={`text-xs ${textSec}`}>{k}</span>
                        <button onClick={()=>removeKeyword(k)} className={`${textFaint} hover:text-red-500 transition-colors`}><X size={10}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {monKeywords.length>0 && (
                <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                  <h3 className={`text-sm font-bold ${textSec}`}>Ajouter une mention trouvée</h3>
                  <div className="space-y-2">
                    <select value={mForm.keyword} onChange={e=>setMForm(f=>({...f,keyword:e.target.value}))}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none appearance-none ${inputCls}`}>
                      <option value="">— Mot-clé concerné</option>
                      {monKeywords.map(k=><option key={k} value={k} className={isDark?"bg-[#0e1420]":"bg-white"}>#{k}</option>)}
                    </select>
                    <input value={mForm.source} onChange={e=>setMForm(f=>({...f,source:e.target.value}))}
                      placeholder="Source (Instagram, Twitter, forum…)"
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-sky-500/30 transition-all ${inputCls}`}/>
                    <textarea value={mForm.text} onChange={e=>setMForm(f=>({...f,text:e.target.value}))}
                      placeholder="Texte de la mention…" rows={2}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none focus:border-sky-500/30 transition-all ${inputCls}`}/>
                    <button onClick={addMention} disabled={!mForm.text.trim()||!mForm.keyword}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                      style={{background:`${VIOLET}20`,border:`1px solid ${VIOLET}30`,color:VIOLET}}>
                      <Plus size={12}/>Enregistrer la mention
                    </button>
                  </div>
                </div>
              )}

              {monMentions.length===0 ? (
                <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border py-16 text-center ${card}`}>
                  <Bell size={28} className={textFaint}/>
                  <p className={`text-sm font-bold ${textMut}`}>{monKeywords.length===0?"Ajoutez des mots-clés à surveiller":"Aucune mention enregistrée"}</p>
                  {monKeywords.length===0 && <p className={`text-xs ${textFaint}`}>Marque, nom, produit — tout ce qu&apos;on dit de vous</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${textMut}`}>{monMentions.length} mention{monMentions.length>1?"s":""} · {unreadMentions} non lue{unreadMentions>1?"s":""}</p>
                    {unreadMentions>0 && (
                      <button onClick={()=>{
                        const updated=monMentions.map(m=>({...m,read:true}));
                        setMonMentions(updated); if(userId) void saveMonDB(userId, monKeywords, updated);
                      }} className={`text-[10px] ${textFaint} hover:${textSec} transition-colors`}>Tout marquer lu</button>
                    )}
                  </div>
                  {monMentions.map(m=>(
                    <div key={m.id} className={`group flex items-start gap-3 rounded-xl border p-3 transition-all ${m.read?(isDark?"border-white/5 bg-white/[0.015]":"border-black/5 bg-[#f7f7fb]"):(isDark?"border-white/10 bg-white/[0.04]":"border-black/8 bg-white shadow-sm")}`}>
                      <div className="shrink-0 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${m.read?(isDark?"bg-white/15":"bg-black/15"):"bg-sky-400"}`}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{background:`${SKY}15`,color:SKY}}>#{m.keyword}</span>
                          {m.source && <span className={`text-[10px] ${textMut}`}>{m.source}</span>}
                          <span className={`text-[10px] ml-auto ${textFaint}`}>{m.date}</span>
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${m.read?textMut:textSec}`}>{m.text}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!m.read && <button onClick={()=>markMentionRead(m.id)} className={`p-1 rounded-lg ${textFaint} hover:text-green-500 hover:bg-green-500/10 transition-all`}><Check size={11}/></button>}
                        <button onClick={()=>deleteMention(m.id)} className={`p-1 rounded-lg ${textFaint} hover:text-red-500 hover:bg-red-500/10 transition-all`}><Trash2 size={11}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
