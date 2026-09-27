"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronDown, FileText, Users, Brain, Activity,
  Eye, Download, Send, Receipt, Files, History, BookMarked, RotateCcw,
  RefreshCw, Copy, Check, AlertTriangle, CheckCircle, XCircle, Clock,
  Loader2, FileSignature, Pen, Trash2, Plus, Sparkles, MessageSquare,
} from "lucide-react";
import type { Contract, Signer, CActivity, CComment, ContractStatus, ContractVersion } from "./types";
import { gold, ease, STATUS_CFG, STATUS_FLOW, CONTRACT_TYPES } from "./constants";
import { inp } from "./ui";
import { fmtDate, fmtEur } from "@/lib/format";

export function DetailPanel({
  contract, signers, activities, comments,
  editContent, saving, onContentChange, onStatusChange,
  onDownloadPDF, onViewPDF, onSendToClient, onToFacture,
  onCopy, copied, userId, userName,
  onAddSigner, onDeleteSigner, onSignContract, onCounterSign, counterSigning,
  onAddComment, onShowAI, onDuplicate,
  onClose,
  versions, prevContent, onRestoreVersion, onUndoRestore, onSaveTemplate,
}: {
  contract: Contract; signers: Signer[]; activities: CActivity[]; comments: CComment[];
  editContent: string; saving: boolean; onContentChange: (v: string) => void;
  onStatusChange: (s: ContractStatus) => void;
  onDownloadPDF: () => void; onViewPDF: () => void; onSendToClient: () => void; onToFacture: () => void;
  onCopy: () => void; copied: boolean; userId: string | null; userName: string;
  onAddSigner: (name: string, email: string, role: string) => void;
  onDeleteSigner: (id: string) => void; onSignContract: (signer: Signer) => void;
  onCounterSign: () => void; counterSigning: boolean;
  onAddComment: (text: string) => void; onShowAI: () => void; onDuplicate: () => void; onClose: () => void;
  versions: ContractVersion[]; prevContent: string | null;
  onRestoreVersion: (v: ContractVersion) => void; onUndoRestore: () => void; onSaveTemplate: () => void;
}) {
  const [tab, setTab] = useState<"content" | "signers" | "ai" | "activity">("content");
  const [signerForm, setSignerForm] = useState({ name: "", email: "", role: "signataire" });
  const [commentText, setCommentText] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [versionsMenu, setVersionsMenu] = useState(false);
  const t = CONTRACT_TYPES.find((x) => x.value === contract.contract_type);

  const allTimeline = [
    ...activities.map((a) => ({ type: "activity" as const, date: a.created_at, text: a.action, detail: a.details })),
    ...comments.map((c) => ({ type: "comment" as const, date: c.created_at, text: c.author_name || "Vous", detail: c.content })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tabs = [
    { key: "content",  label: "Contenu",      icon: FileText },
    { key: "signers",  label: "Signataires",  icon: Users },
    { key: "ai",       label: "IA Juridique", icon: Brain },
    { key: "activity", label: "Activité",     icon: Activity },
  ] as const;

  return (
    <motion.div key="detail" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.4, ease }}
      className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/[0.06] gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <button onClick={onClose} className="md:hidden rounded-lg p-1 text-white/40 hover:text-white/70 transition-colors"><X size={15}/></button>
            <span className="text-[10.5px] px-2.5 py-0.5 rounded-full border font-bold"
              style={{ color: gold, borderColor: gold + "35", background: gold + "12" }}>
              {t?.label}
            </span>
            <div className="relative">
              <button onClick={() => setShowStatusMenu((v) => !v)}
                className={`flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full border font-semibold transition-all ${STATUS_CFG[contract.status].text} ${STATUS_CFG[contract.status].bg} ${STATUS_CFG[contract.status].border}`}>
                {STATUS_CFG[contract.status].label} <ChevronDown size={10}/>
              </button>
              <AnimatePresence>
                {showStatusMenu && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full left-0 mt-1 z-20 bg-white/[0.025] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl min-w-[140px]">
                    {STATUS_FLOW.concat(["refusé", "expiré"] as ContractStatus[]).map((s) => (
                      <button key={s} onClick={() => { onStatusChange(s); setShowStatusMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-white/[0.05] transition-colors ${STATUS_CFG[s].text}`}>
                        {STATUS_CFG[s].label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <h2 className="text-[15px] font-semibold text-white/90 truncate">{contract.title}</h2>
          <p className="mt-0.5 text-xs text-white/45">
            {contract.client_name}
            {contract.client_company && <> · {contract.client_company}</>}
            {contract.amount != null && <span className="text-white/60 font-semibold"> · {fmtEur(contract.amount)}</span>}
            {contract.start_date && <> · {fmtDate(contract.start_date)}</>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {saving && <RefreshCw size={13} className="animate-spin text-white/25"/>}
          <button onClick={onCopy} className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all">
            {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14} className="text-white/45"/>}
          </button>
        </div>
      </div>

      {/* Expiry warning */}
      {(() => {
        const date = contract.end_date;
        if (!date || ["signé", "expiré", "actif"].includes(contract.status)) return null;
        const days = Math.floor((new Date(date).getTime() - Date.now()) / 86_400_000);
        if (days > 30) return null;
        const late = days < 0;
        return (
          <div className="mx-5 my-2 flex items-center gap-2 rounded-xl border px-3 py-2.5"
            style={{ background: late ? "rgba(248,113,113,0.07)" : "rgba(251,191,36,0.07)", borderColor: late ? "rgba(248,113,113,0.2)" : "rgba(251,191,36,0.2)" }}>
            <AlertTriangle size={12} style={{ color: late ? "#f87171" : "#fbbf24" }}/>
            <span className="text-xs" style={{ color: late ? "#f87171" : "#fbbf24" }}>
              {late
                ? `Contrat expiré depuis ${Math.abs(days)} jour${Math.abs(days) > 1 ? "s" : ""}`
                : days === 0 ? "Contrat expire aujourd'hui !"
                : `Expire dans ${days} jour${days > 1 ? "s" : ""} — le ${new Date(date).toLocaleDateString("fr-FR")}`}
            </span>
          </div>
        );
      })()}

      <div className="flex border-b border-white/[0.06] px-5 gap-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${tab === key ? "border-b-2 text-white/90" : "border-transparent text-white/35 hover:text-white/60"}`}
            style={tab === key ? { borderBottomColor: gold, color: gold } : {}}>
            <Icon size={12}/> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "content" && (
          <>
            <div className="flex items-center gap-2 px-5 py-2 border-b border-white/[0.06] bg-white/[0.015] flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/20 mr-1">PDF</span>
              {[
                { label: "Aperçu",       icon: Eye,      onClick: onViewPDF },
                { label: "Télécharger",  icon: Download, onClick: onDownloadPDF, gold: true },
                { label: "Envoyer",      icon: Send,     onClick: onSendToClient },
              ].map(({ label, icon: Icon, onClick, gold: isGold }) => (
                <motion.button key={label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isGold ? "" : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.07]"}`}
                  style={isGold ? { background: gold + "18", color: gold, border: `1px solid ${gold}35` } : {}}>
                  <Icon size={11}/> {label}
                </motion.button>
              ))}
              {versions.length > 0 && (
                <div className="relative">
                  <motion.button onClick={() => setVersionsMenu((v) => !v)}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.07] transition-all">
                    <History size={11}/> {versions.length}v
                  </motion.button>
                  <AnimatePresence>
                    {versionsMenu && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-white/[0.08] overflow-hidden shadow-2xl"
                        style={{ background: "#0d1117" }}>
                        {versions.map((v) => (
                          <button key={v.ts} onClick={() => { onRestoreVersion(v); setVersionsMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all text-left">
                            <History size={10} className="shrink-0 text-white/30"/>
                            {new Date(v.ts).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <motion.button onClick={onSaveTemplate}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.07] transition-all">
                <BookMarked size={11}/> Modèle
              </motion.button>
              {prevContent !== null && (
                <motion.button onClick={onUndoRestore}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{ background: "rgba(251,191,36,0.07)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <RotateCcw size={11}/> Annuler
                </motion.button>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onDuplicate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.07] transition-all">
                  <Files size={11}/> Dupliquer
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onToFacture}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.07] transition-all">
                  <Receipt size={11}/> Facture
                </motion.button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {(contract.validation_manager != null || contract.validation_legal != null) && (
                <div className="flex gap-3 mb-4 flex-wrap">
                  {[
                    { label: "Manager",    val: contract.validation_manager },
                    { label: "Juridique",  val: contract.validation_legal },
                    { label: "Finance",    val: contract.validation_finance },
                  ].map(({ label, val }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${val ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.03] border-white/10 text-white/35"}`}>
                      {val ? <CheckCircle size={11}/> : <Clock size={11}/>} {label}
                    </div>
                  ))}
                </div>
              )}
              <textarea value={editContent} onChange={(e) => onContentChange(e.target.value)}
                className="w-full h-full min-h-[360px] bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 font-mono text-sm text-white/80 leading-relaxed resize-none focus:outline-none focus:border-white/15 focus:bg-white/[0.04] transition-colors placeholder:text-white/20"
                placeholder="Le contenu du contrat apparaît ici. Utilisez « Générer avec l'IA » pour rédiger automatiquement."/>
            </div>
          </>
        )}

        {tab === "signers" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <button onClick={onCounterSign} disabled={counterSigning}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: gold + "18", color: gold, border: `1px solid ${gold}35` }}>
              {counterSigning ? <Loader2 size={13} className="animate-spin"/> : <FileSignature size={13}/>}
              Contre-signer en tant que gérant
            </button>
            {signers.length > 0 ? (
              <div className="space-y-2">
                {signers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                    <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.05] text-sm font-bold text-white/60">
                      {s.signer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/80">{s.signer_name}</p>
                      <p className="text-xs text-white/40">{s.signer_email} · {s.signer_role}</p>
                      {s.certificate && <p className="text-[10px] text-emerald-400 mt-1">{s.certificate}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.status === "signed" ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={11}/> Signé</span>
                      ) : (
                        <>
                          <button onClick={() => onSignContract(s)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                            style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
                            <Pen size={11}/> Signer
                          </button>
                          <button onClick={() => onDeleteSigner(s.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                            <Trash2 size={12}/>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-white/30 text-sm">Aucun signataire ajouté</div>
            )}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-white/60">+ Ajouter un signataire</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={signerForm.name} onChange={(e) => setSignerForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nom complet" className={inp()}/>
                <input value={signerForm.email} onChange={(e) => setSignerForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email" type="email" className={inp()}/>
              </div>
              <select value={signerForm.role} onChange={(e) => setSignerForm((p) => ({ ...p, role: e.target.value }))}
                className={inp("appearance-none")}>
                <option value="signataire">Signataire</option>
                <option value="validateur">Validateur</option>
                <option value="témoin">Témoin</option>
              </select>
              <button onClick={() => { if (signerForm.name) { onAddSigner(signerForm.name, signerForm.email, signerForm.role); setSignerForm({ name: "", email: "", role: "signataire" }); }}}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
                <Plus size={13} className="inline mr-1.5"/> Ajouter
              </button>
            </div>
          </div>
        )}

        {tab === "ai" && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center gap-4">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
              <Brain size={24} style={{ color: gold }}/>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white/80">Analyse IA Juridique</p>
              <p className="text-xs text-white/40 mt-1.5 max-w-[260px] leading-relaxed">
                Détection des risques, score de conformité, suggestions d&apos;amélioration et vérification RGPD.
              </p>
            </div>
            <button onClick={onShowAI}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: gold, color: "#0a0f1e", boxShadow: `0 4px 16px ${gold}40` }}>
              <Sparkles size={15}/> Analyser le contrat
            </button>
            {contract.ai_summary && (
              <div className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <p className="text-xs font-bold text-white/50 mb-2">Dernière analyse</p>
                <p className="text-xs text-white/70 leading-relaxed">{contract.ai_summary}</p>
                {contract.ai_risks && <p className="text-xs text-red-400 mt-2 leading-relaxed">{contract.ai_risks}</p>}
              </div>
            )}
          </div>
        )}

        {tab === "activity" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {allTimeline.length === 0 && <p className="text-center text-white/30 text-sm py-8">Aucune activité</p>}
              {allTimeline.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`mt-0.5 h-6 w-6 flex items-center justify-center rounded-full shrink-0 ${item.type === "comment" ? "bg-blue-500/20" : "bg-white/[0.06]"}`}>
                    {item.type === "comment" ? <MessageSquare size={10} className="text-blue-400"/> : <Activity size={10} className="text-white/40"/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-white/70">{item.text}</span>
                      <span className="text-[10px] text-white/25">{fmtDate(item.date)}</span>
                    </div>
                    {item.detail && <p className="text-xs text-white/45 mt-0.5">{item.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.06] p-4 flex gap-2">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) { onAddComment(commentText.trim()); setCommentText(""); }}}
                placeholder="Ajouter un commentaire… (Entrée pour envoyer)"
                className={inp("flex-1")}/>
              <button onClick={() => { if (commentText.trim()) { onAddComment(commentText.trim()); setCommentText(""); }}}
                className="h-[42px] w-[42px] flex items-center justify-center rounded-xl shrink-0 transition-all"
                style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
                <Send size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

