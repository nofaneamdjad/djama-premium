"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Plus, X, Trash2, Check, MessageSquare, Settings, Zap, Send } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

interface ChatBot { id: string; name: string; persona: string; greeting: string; active: boolean; convs: number }
interface ChatMsg { role: "user" | "bot"; text: string }

const DEMO_BOTS: ChatBot[] = [
  { id: "1", name: "Assistant Commercial",  persona: "Tu es un assistant commercial chaleureux pour DJAMA. Tu présentes les offres, réponds aux objections et proposes des rendez-vous.", greeting: "Bonjour ! Je suis l'assistant DJAMA, prêt à vous aider. Quel est votre besoin ?", active: true, convs: 312 },
  { id: "2", name: "Support Client",         persona: "Tu es un agent de support patient et efficace. Tu résous les problèmes techniques et rassures les clients.", greeting: "Bonjour, comment puis-je vous aider aujourd'hui ?", active: true, convs: 87 },
  { id: "3", name: "Chatbot FAQ",             persona: "Tu réponds aux questions fréquentes sur les services DJAMA avec des réponses concises.", greeting: "Bonjour ! Posez-moi votre question, j'ai les réponses.", active: false, convs: 45 },
];

const DEMO_RESPONSES: Record<string, string> = {
  "bonjour": "Bonjour ! Ravi de vous rencontrer. Comment puis-je vous aider ?",
  "prix": "Nos tarifs commencent à 49 €/mois pour le pack Essentiel. Voulez-vous un devis personnalisé ?",
  "contact": "Vous pouvez nous joindre au 06 XX XX XX XX ou par email à contact@djama.fr. Souhaitez-vous prendre rendez-vous directement ?",
  "rdv": "Je vous propose un rendez-vous découverte gratuit de 30 min. Quand êtes-vous disponible cette semaine ?",
};

export default function ChatbotPage() {
  const { isDark } = useTheme();
  const [bots, setBots]         = useState<ChatBot[]>(DEMO_BOTS);
  const [tab, setTab]           = useState<"bots" | "preview">("bots");
  const [creating, setCreating] = useState(false);
  const [activeBot, setActiveBot] = useState<ChatBot | null>(null);
  const [msgs, setMsgs]         = useState<ChatMsg[]>([]);
  const [input, setInput]       = useState("");
  const [form, setForm]         = useState({ name: "", persona: "", greeting: "" });

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
    inp:   `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"}`,
  };

  function openPreview(bot: ChatBot) {
    setActiveBot(bot);
    setMsgs([{ role: "bot", text: bot.greeting }]);
    setTab("preview");
  }

  function sendMsg() {
    if (!input.trim() || !activeBot) return;
    const userMsg = input.trim();
    setMsgs(p => [...p, { role: "user", text: userMsg }]);
    setInput("");
    const lower = userMsg.toLowerCase();
    const key = Object.keys(DEMO_RESPONSES).find(k => lower.includes(k));
    const reply = key ? DEMO_RESPONSES[key] : `Merci pour votre message ! Un conseiller DJAMA vous répondra sous peu. Y a-t-il autre chose que je puisse faire pour vous ?`;
    setTimeout(() => setMsgs(p => [...p, { role: "bot", text: reply }]), 700);
  }

  function save() {
    if (!form.name.trim() || !form.greeting.trim()) return;
    setBots(p => [{ id: uid(), name: form.name, persona: form.persona, greeting: form.greeting, active: true, convs: 0 }, ...p]);
    setForm({ name: "", persona: "", greeting: "" });
    setCreating(false);
  }

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={Bot} color="#8b5cf6" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Chatbot IA</h1>
              <p className={`text-[10px] ${s.muted}`}>{bots.filter(b => b.active).length} chatbots actifs</p>
            </div>
          </div>
          {tab === "bots" && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
              <Plus size={14} /> Chatbot
            </button>
          )}
          {tab === "preview" && (
            <button onClick={() => setTab("bots")}
              className="rounded-xl px-3 py-2 text-[12px] font-bold"
              style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)" }}>
              ← Retour
            </button>
          )}
        </motion.div>

        <div className="flex gap-1.5 mt-4">
          {(["bots", "preview"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="rounded-xl px-4 py-1.5 text-[11.5px] font-semibold transition"
              style={tab === t
                ? { background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.30)" }
                : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
              {t === "bots" ? "Mes chatbots" : "Prévisualisation"}
            </button>
          ))}
        </div>
      </div>

      {tab === "bots" && (
        <div className="px-4 space-y-2.5">
          {bots.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }}
              className={`rounded-2xl border p-4 ${s.card}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
                    <Bot size={18} style={{ color: "#8b5cf6" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[13px] font-bold ${s.text}`}>{b.name}</p>
                      <span className="text-[9.5px] font-bold rounded-full px-2 py-0.5"
                        style={b.active ? { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" } : { background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
                        {b.active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1"><MessageSquare size={9} className={s.muted} /><span className={`text-[10px] ${s.muted}`}>{b.convs} conversations</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openPreview(b)}
                    className="h-7 rounded-xl px-2.5 flex items-center gap-1 text-[10.5px] font-bold transition"
                    style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}>
                    <Zap size={10} /> Tester
                  </button>
                  <button onClick={() => setBots(p => p.filter(x => x.id !== b.id))}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center hover:text-red-400 transition ${s.muted}`}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "preview" && (
        <div className="px-4">
          {!activeBot ? (
            <div className={`rounded-2xl border p-8 text-center ${s.card}`}>
              <Bot size={32} className={`mx-auto mb-2 ${s.muted}`} />
              <p className={`text-[12px] ${s.muted}`}>Sélectionnez un chatbot et cliquez "Tester"</p>
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-hidden ${s.card}`}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
                <Bot size={15} style={{ color: "white" }} />
                <p className="text-[12px] font-bold text-white">{activeBot.name}</p>
                <span className="ml-auto text-[9.5px] font-bold rounded-full px-2 py-0.5 bg-white/20 text-white">En ligne</span>
              </div>
              <div className="h-72 overflow-y-auto p-4 space-y-2.5">
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%] rounded-2xl px-3 py-2 text-[12px]"
                      style={m.role === "user"
                        ? { background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "white" }
                        : { background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)" }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 pb-3 pt-2 flex gap-2" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}>
                <input className={s.inp} placeholder="Tapez votre message…" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMsg()} />
                <button onClick={sendMsg}
                  className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
                  <Send size={13} style={{ color: "white" }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreating(false)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className={`relative z-10 w-full max-w-sm rounded-3xl p-6 space-y-4 ${isDark ? "bg-[#0e1420] border border-white/[0.09]" : "bg-white border border-black/[0.07]"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-[15px] font-black ${s.text}`}>Nouveau chatbot</h2>
                <button onClick={() => setCreating(false)} className={`rounded-xl p-2 ${s.muted}`}><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Nom du chatbot *</label>
                  <input className={s.inp} placeholder="Ex: Assistant Commercial" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Personnalité (système IA)</label>
                  <textarea rows={3} className={`${s.inp} resize-none`} placeholder="Décrivez le rôle et le ton du chatbot…" value={form.persona} onChange={e => setForm(p => ({ ...p, persona: e.target.value }))} />
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Message d'accueil *</label>
                  <input className={s.inp} placeholder="Bonjour ! Comment puis-je vous aider ?" value={form.greeting} onChange={e => setForm(p => ({ ...p, greeting: e.target.value }))} />
                </div>
              </div>
              <button onClick={save} disabled={!form.name.trim() || !form.greeting.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-black text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
                <Check size={15} /> Créer le chatbot
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
