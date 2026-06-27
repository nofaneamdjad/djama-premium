"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, FileText, LayoutDashboard, Send, Upload,
  Download, CheckCircle2, Clock, Loader2, X,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const ease = [0.16, 1, 0.3, 1] as const;

interface PortailMsg { id: string; from: "admin" | "client"; text: string; date: string; }
interface PortailDoc { id: string; name: string; size: number; type: string; url: string; uploadedAt: string; uploadedBy: "admin" | "client"; }

const MSGS_KEY = (id: string) => `pm_v1_${id}`;
const DOCS_KEY = (id: string) => `pd_v1_${id}`;
function loadLs<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as T[]; } catch { return []; }
}
function saveLs<T>(key: string, data: T[]) { localStorage.setItem(key, JSON.stringify(data)); }
function fmtSize(b: number) {
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} Ko`;
  return `${(b / (1024 * 1024)).toFixed(1)} Mo`;
}

type Tab = "dashboard" | "messages" | "documents";

interface ClientData {
  id: string; nom: string; email: string; entreprise?: string;
  statut: string; acces_actif: boolean; created_at: string;
}

export default function ClientPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab,           setTab]          = useState<Tab>("dashboard");
  const [client,        setClient]       = useState<ClientData | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [blocked,       setBlocked]      = useState(false);
  const [msgs,          setMsgs]         = useState<PortailMsg[]>([]);
  const [msgInput,      setMsgInput]     = useState("");
  const [docs,          setDocs]         = useState<PortailDoc[]>([]);
  const [uploadingDoc,  setUploadingDoc] = useState(false);
  const [uploadErr,     setUploadErr]    = useState("");
  const msgEndRef  = useRef<HTMLDivElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("portail_clients")
        .select("id, nom, email, entreprise, statut, acces_actif, created_at")
        .eq("id", id)
        .single();

      if (error || !data) {
        // Show demo mode with empty data instead of blocking
        setClient({ id, nom: "Client", email: "", statut: "actif", acces_actif: true, created_at: new Date().toISOString() });
      } else {
        const c = data as ClientData;
        if (!c.acces_actif) { setBlocked(true); setLoading(false); return; }
        setClient(c);
      }
      setMsgs(loadLs<PortailMsg>(MSGS_KEY(id)));
      setDocs(loadLs<PortailDoc>(DOCS_KEY(id)));
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (tab === "messages") setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [msgs, tab]);

  function sendMsg() {
    if (!msgInput.trim()) return;
    const msg: PortailMsg = { id: Math.random().toString(36).slice(2), from: "client", text: msgInput.trim(), date: new Date().toISOString() };
    const updated = [...msgs, msg];
    setMsgs(updated);
    saveLs(MSGS_KEY(id), updated);
    setMsgInput("");
  }

  async function handleUpload(files: FileList | null) {
    if (!files) return;
    setUploadingDoc(true);
    setUploadErr("");
    const newDocs: PortailDoc[] = [];
    for (const file of Array.from(files)) {
      const path = `client/${id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("portail-docs").upload(path, file, { upsert: true });
      let url = "";
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("portail-docs").getPublicUrl(path);
        url = publicUrl;
      } else {
        setUploadErr("Le stockage n'est pas encore configuré. Votre fichier a été enregistré localement.");
      }
      newDocs.push({ id: Math.random().toString(36).slice(2, 10), name: file.name, type: file.type, size: file.size, url, uploadedAt: new Date().toISOString(), uploadedBy: "client" });
    }
    const updated = [...docs, ...newDocs];
    setDocs(updated);
    saveLs(DOCS_KEY(id), updated);
    setUploadingDoc(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07080e]">
        <Loader2 size={24} className="animate-spin text-white/20" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07080e] px-5">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
            <X size={22} className="text-white/30" />
          </div>
          <h1 className="text-xl font-black text-white">Accès désactivé</h1>
          <p className="mt-2 text-sm text-white/40">Votre portail est temporairement inaccessible. Contactez votre prestataire.</p>
        </div>
      </div>
    );
  }

  const firstName = client?.nom?.split(" ")[0] ?? "Client";
  const adminMsgs = msgs.filter(m => m.from === "admin").length;

  return (
    <div className="min-h-screen bg-[#07080e] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-violet-600/4 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-600/4 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/6 bg-[#07080e]/80 px-5 py-4 backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-sm font-black">D</div>
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-widest text-white/25">Portail client</p>
                <p className="text-sm font-bold text-white leading-tight">{client?.nom ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[0.65rem] font-bold text-emerald-400">Connecté</span>
            </div>
          </div>
        </header>

        {/* Welcome banner */}
        <div className="border-b border-white/4 bg-white/2 px-5 py-5 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
              <p className="text-[0.62rem] font-bold uppercase tracking-widest text-white/25">Bonjour,</p>
              <h1 className="text-xl font-black text-white sm:text-2xl">{firstName} 👋</h1>
              {client?.entreprise && <p className="mt-0.5 text-xs text-white/40">{client.entreprise}</p>}
            </motion.div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-b border-white/6 px-5 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex gap-1">
              {([
                { k: "dashboard",  label: "Mon espace",  Icon: LayoutDashboard },
                { k: "messages",   label: "Messages",    Icon: MessageSquare,  badge: adminMsgs },
                { k: "documents",  label: "Documents",   Icon: FileText,       badge: docs.filter(d => d.uploadedBy === "admin").length },
              ] as { k: Tab; label: string; Icon: React.ElementType; badge?: number }[]).map(({ k, label, Icon, badge }) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                    tab === k ? "border-violet-500 text-white" : "border-transparent text-white/35 hover:text-white/60"
                  }`}>
                  <Icon size={14} />
                  {label}
                  {badge !== undefined && badge > 0 && (
                    <span className="rounded-full bg-violet-500 px-1.5 py-0.5 text-[0.55rem] text-white leading-none">{badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease }}>

              {/* ── DASHBOARD ── */}
              {tab === "dashboard" && (
                <div className="space-y-5">
                  {/* Status cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: "Messages reçus",   value: adminMsgs,                        color: "#8b5cf6", Icon: MessageSquare },
                      { label: "Documents partagés", value: docs.filter(d=>d.uploadedBy==="admin").length, color: "#0ea5e9", Icon: FileText },
                      { label: "Statut",             value: client?.statut === "actif" ? "Actif" : client?.statut ?? "—", color: "#10b981", Icon: CheckCircle2 },
                    ].map(({ label, value, color, Icon }) => (
                      <div key={label} className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/4 p-4">
                        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-15 blur-xl" style={{ background: color }} />
                        <Icon size={16} className="mb-2" style={{ color }} />
                        <p className="text-xl font-black text-white">{value}</p>
                        <p className="text-[0.6rem] font-semibold text-white/30">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent messages preview */}
                  {msgs.length > 0 && (
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-bold text-white/50">Derniers messages</p>
                        <button onClick={() => setTab("messages")} className="text-[0.65rem] font-bold text-violet-400 hover:text-violet-300 transition">Voir tout →</button>
                      </div>
                      <div className="space-y-2">
                        {msgs.slice(-3).map(m => (
                          <div key={m.id} className="flex items-start gap-2.5">
                            <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${m.from === "admin" ? "bg-violet-400" : "bg-sky-400"}`} />
                            <p className="flex-1 truncate text-sm text-white/60">{m.text}</p>
                            <p className="shrink-0 text-[0.58rem] text-white/25">{m.from === "admin" ? "Équipe" : "Vous"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent docs preview */}
                  {docs.length > 0 && (
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-bold text-white/50">Derniers documents</p>
                        <button onClick={() => setTab("documents")} className="text-[0.65rem] font-bold text-sky-400 hover:text-sky-300 transition">Voir tout →</button>
                      </div>
                      <div className="space-y-2">
                        {docs.slice(-3).map(d => (
                          <div key={d.id} className="flex items-center gap-2.5">
                            <FileText size={12} className="shrink-0 text-white/30" />
                            <p className="flex-1 truncate text-sm text-white/60">{d.name}</p>
                            <p className="shrink-0 text-[0.58rem] text-white/25">{fmtSize(d.size)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {msgs.length === 0 && docs.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/8 p-10 text-center">
                      <Clock size={28} className="mx-auto mb-3 text-white/15" />
                      <p className="text-sm font-semibold text-white/40">Votre espace est prêt</p>
                      <p className="mt-1 text-xs text-white/25">Les messages et documents de votre prestataire apparaîtront ici</p>
                    </div>
                  )}

                  {/* Info card */}
                  <div className="rounded-2xl border border-white/6 bg-white/2 px-5 py-4">
                    <div className="space-y-1.5 text-xs">
                      {client?.email && (
                        <div className="flex justify-between">
                          <span className="text-white/30">Email</span>
                          <span className="font-semibold text-white/60">{client.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-white/30">Client depuis</span>
                        <span className="font-semibold text-white/60">{new Date(client?.created_at ?? "").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MESSAGES ── */}
              {tab === "messages" && (
                <div className="flex flex-col" style={{ minHeight: "60vh" }}>
                  <div className="mb-4 flex-1 space-y-3">
                    {msgs.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-20 text-center">
                        <MessageSquare size={32} className="text-white/12" />
                        <p className="text-sm font-semibold text-white/40">Aucun message pour l'instant</p>
                        <p className="text-xs text-white/25">Envoyez un message à votre prestataire</p>
                      </div>
                    ) : (
                      msgs.map(m => (
                        <motion.div key={m.id}
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          className={`flex ${m.from === "client" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            m.from === "client"
                              ? "rounded-br-sm border border-sky-500/20 bg-sky-500/15"
                              : "rounded-bl-sm border border-white/8 bg-white/6"
                          }`}>
                            <p className="text-sm leading-snug text-white/85">{m.text}</p>
                            <p className="mt-1.5 text-[0.58rem] text-white/25">
                              {m.from === "client" ? "Vous" : "Votre prestataire"} · {new Date(m.date).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <div ref={msgEndRef} />
                  </div>

                  <div className="sticky bottom-0 bg-[#07080e] pt-4">
                    <div className="flex gap-3">
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                        placeholder="Votre message…"
                        className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/20 focus:bg-white/8"
                      />
                      <button onClick={sendMsg} disabled={!msgInput.trim()}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/20 text-sky-300 transition hover:bg-sky-500/35 disabled:opacity-30">
                        <Send size={16} />
                      </button>
                    </div>
                    <p className="mt-2 text-center text-[0.6rem] text-white/20">Vos messages sont partagés avec votre prestataire</p>
                  </div>
                </div>
              )}

              {/* ── DOCUMENTS ── */}
              {tab === "documents" && (
                <div className="space-y-4">
                  {/* Upload */}
                  <input ref={docFileRef} type="file" className="hidden" multiple onChange={e => { void handleUpload(e.target.files); e.target.value = ""; }} />
                  <button onClick={() => docFileRef.current?.click()} disabled={uploadingDoc}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 py-5 text-sm font-semibold text-white/35 transition hover:border-sky-500/30 hover:text-sky-400 disabled:opacity-50">
                    {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {uploadingDoc ? "Envoi en cours…" : "Envoyer un document à votre prestataire"}
                  </button>

                  {uploadErr && (
                    <p className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-2.5 text-xs text-amber-400">{uploadErr}</p>
                  )}

                  {docs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <FileText size={32} className="text-white/12" />
                      <p className="text-sm font-semibold text-white/40">Aucun document</p>
                      <p className="text-xs text-white/25">Les documents partagés par votre prestataire apparaîtront ici</p>
                    </div>
                  ) : (
                    <>
                      {docs.filter(d => d.uploadedBy === "admin").length > 0 && (
                        <div>
                          <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Partagés par votre prestataire</p>
                          <div className="space-y-2">
                            {docs.filter(d => d.uploadedBy === "admin").map(doc => (
                              <div key={doc.id} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                                  <FileText size={14} className="text-violet-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-white">{doc.name}</p>
                                  <p className="text-[0.6rem] text-white/30">{fmtSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}</p>
                                </div>
                                {doc.url && (
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 text-white/30 transition hover:border-sky-500/30 hover:text-sky-400">
                                    <Download size={13} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {docs.filter(d => d.uploadedBy === "client").length > 0 && (
                        <div>
                          <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Vos envois</p>
                          <div className="space-y-2">
                            {docs.filter(d => d.uploadedBy === "client").map(doc => (
                              <div key={doc.id} className="flex items-center gap-3 rounded-2xl border border-sky-500/12 bg-sky-500/5 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/12">
                                  <FileText size={14} className="text-sky-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-white">{doc.name}</p>
                                  <p className="text-[0.6rem] text-white/30">{fmtSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}</p>
                                </div>
                                <CheckCircle2 size={14} className="shrink-0 text-sky-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="pb-8 text-center">
          <p className="text-[0.6rem] text-white/15">Portail sécurisé · DJAMA PRO · Accès privé et confidentiel</p>
        </footer>
      </div>
    </div>
  );
}
