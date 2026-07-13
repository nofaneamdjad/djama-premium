"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, BookOpen, ArrowRight, Play, CheckCircle2, Trophy,
  Zap, RotateCcw, Star, Flame, Bot, PenLine, Loader2,
  ImageIcon, Briefcase, GraduationCap, Megaphone, Calendar,
  ShoppingBag, Code2, Rocket, Award, Lightbulb, Dumbbell,
  FlaskConical, Film, FileText, Gamepad2, BarChart2, ClipboardList,
  Medal, Crown, Lock,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const XP_PER_COURSE = 100;

const LEVEL_DATA = [
  { name: "Novice",    min: 0,    color: "#94a3b8", emoji: "🌱" },
  { name: "Apprenti",  min: 200,  color: "#60a5fa", emoji: "⚡" },
  { name: "Praticien", min: 500,  color: "#a78bfa", emoji: "🔮" },
  { name: "Expert IA", min: 1000, color: "#f59e0b", emoji: "🔥" },
  { name: "Maître IA", min: 1800, color: "#d946ef", emoji: "👑" },
];

function getLevel(xp: number) {
  let idx = 0;
  for (let i = 0; i < LEVEL_DATA.length; i++) { if (xp >= LEVEL_DATA[i].min) idx = i; }
  const next = LEVEL_DATA[idx + 1];
  const pct  = next
    ? Math.min(100, Math.round(((xp - LEVEL_DATA[idx].min) / (next.min - LEVEL_DATA[idx].min)) * 100))
    : 100;
  return { ...LEVEL_DATA[idx], pct, xpNext: next ? next.min - xp : 0, nextName: next?.name };
}

const GROUP = [
  { id: "fondamentaux", label: "Fondamentaux", color: "#38bdf8", rgb: "56,189,248", nums: ["01","02","03","04","05"] },
  { id: "creer",        label: "Créer",         color: "#a78bfa", rgb: "167,139,250", nums: ["06","07","08","09","10"] },
  { id: "marketing",    label: "Marketing",     color: "#f59e0b", rgb: "245,158,11",  nums: ["11","12","13","14","15"] },
  { id: "expert",       label: "Expert",        color: "#4ade80", rgb: "74,222,128",  nums: ["16","17","18","19","20"] },
];

const COURS = [
  { num: "01", title: "Introduction à l'IA",          icon: Brain,         group: 0 },
  { num: "02", title: "Comprendre les modèles",       icon: BarChart2,     group: 0 },
  { num: "03", title: "Utiliser ChatGPT",             icon: Bot,           group: 0 },
  { num: "04", title: "Prompt engineering avancé",    icon: PenLine,       group: 0 },
  { num: "05", title: "Automatiser son travail",      icon: Zap,           group: 0 },
  { num: "06", title: "Génération de texte",          icon: FileText,      group: 1 },
  { num: "07", title: "Création d'images avec IA",   icon: ImageIcon,     group: 1 },
  { num: "08", title: "Analyse de données",           icon: BarChart2,     group: 1 },
  { num: "09", title: "IA pour entrepreneurs",        icon: Briefcase,     group: 1 },
  { num: "10", title: "IA pour optimiser son temps",  icon: GraduationCap, group: 1 },
  { num: "11", title: "IA pour le marketing",         icon: Megaphone,     group: 2 },
  { num: "12", title: "Automatisation des tâches",    icon: Zap,           group: 2 },
  { num: "13", title: "Création de contenu",          icon: PenLine,       group: 2 },
  { num: "14", title: "Outils IA indispensables",     icon: Lightbulb,     group: 2 },
  { num: "15", title: "Organisation & productivité",  icon: Calendar,      group: 2 },
  { num: "16", title: "Création d'agents IA",         icon: Bot,           group: 3 },
  { num: "17", title: "IA et business en ligne",      icon: ShoppingBag,   group: 3 },
  { num: "18", title: "IA et programmation",          icon: Code2,         group: 3 },
  { num: "19", title: "Cas pratiques",                icon: Rocket,        group: 3 },
  { num: "20", title: "Projet final",                 icon: Star,          group: 3 },
];

const ACTIVITES = [
  { Icon: Flame,         color: "#f59e0b", title: "Défi quotidien",        desc: "Un défi court sur un vrai outil IA. 5 à 15 min par jour.", badge: "5–15 min"    },
  { Icon: Dumbbell,      color: "#a78bfa", title: "Atelier guidé",         desc: "Exercices étape par étape avec le Prof IA.",              badge: "Avec Prof IA" },
  { Icon: Film,          color: "#38bdf8", title: "Scénario entrepreneur", desc: "Des situations réelles du quotidien — résolvez-les.",     badge: "Cas réels"   },
  { Icon: Rocket,        color: "#4ade80", title: "Mini-projet",           desc: "Créez un livrable concret à chaque étape clé.",          badge: "Livrable"    },
  { Icon: FlaskConical,  color: "#f472b6", title: "Lab IA libre",          desc: "Un espace d'exploration sans contrainte.",               badge: "Exploration"  },
  { Icon: ClipboardList, color: "#c9a55a", title: "Étude de cas",          desc: "Décryptage d'un projet IA réel.",                        badge: "Analyse"      },
];

export default function CoachingIAHub() {
  const router = useRouter();
  const [tab,      setTab]      = useState<"cours" | "activites" | "jeux">("cours");
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading,  setLoading]  = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase
        .from("coaching_progress")
        .select("cours_id, completed")
        .eq("user_id", user.id)
        .limit(50);
      const map: Record<string, boolean> = {};
      (data ?? []).forEach(r => { if (r.completed) map[r.cours_id] = true; });
      setProgress(map);
    } catch {}
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void loadProgress(); }, [loadProgress]);

  const doneCours   = COURS.filter(c => progress[c.num]).length;
  const activeModule = COURS.find(c => !progress[c.num]) ?? COURS[COURS.length - 1];
  const XP          = doneCours * XP_PER_COURSE;
  const level       = getLevel(XP);

  const BADGES = [
    { icon: "🚀", title: "Premier pas",   desc: "1er cours terminé",    color: "#4ade80", unlock: doneCours >= 1     },
    { icon: "✍️", title: "Prompt Master",  desc: "Module 04 complété",  color: "#d946ef", unlock: !!progress["04"]   },
    { icon: "⚡", title: "Mi-chemin",      desc: "10 modules complétés", color: "#f59e0b", unlock: doneCours >= 10    },
    { icon: "🔥", title: "7 jours",        desc: "Semaine de feu",       color: "#f97316", unlock: false              },
    { icon: "🌟", title: "Expert IA",      desc: "15 modules complétés", color: "#a78bfa", unlock: doneCours >= 15    },
    { icon: "🎓", title: "Diplômé IA",     desc: "Formation complète",   color: "#c9a55a", unlock: doneCours >= 20    },
  ];

  if (loading) return (
    <div className="flex h-64 items-center justify-center bg-[#07080e]">
      <Loader2 size={28} className="animate-spin text-fuchsia-400" />
    </div>
  );

  return (
    <div data-coaching-dark="" className="relative min-h-screen bg-[#07080e] text-white">
      <div className="relative z-10 mx-auto max-w-2xl space-y-4 px-4 py-5 pb-24">

        {/* ── Hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(217,70,239,0.2)] p-5"
          style={{ background: "linear-gradient(145deg, rgba(217,70,239,0.08) 0%, rgba(167,139,250,0.05) 50%, rgba(6,7,15,0.9) 100%)" }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(217,70,239,0.7), rgba(167,139,250,0.4), transparent)" }} />

          {/* Title */}
          <div className="mb-4">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.22em] text-fuchsia-400/60 mb-0.5">Formation IA</p>
            <h1 className="text-2xl font-black text-white leading-none">Coaching IA</h1>
            <p className="mt-1 text-[0.68rem] text-white/35">20 modules · 6 activités · 100 jeux · Prof IA</p>
          </div>

          {/* KPIs */}
          <div className="flex items-center gap-2.5 mb-4">
            {/* XP */}
            <div className="flex flex-col items-center rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-2.5">
              <span className="text-xl">⚡</span>
              <span className="text-base font-black text-yellow-300">{XP}</span>
              <span className="text-[0.55rem] font-bold text-yellow-400/60">XP</span>
            </div>
            {/* Level */}
            <div className="flex flex-col items-center rounded-2xl border px-4 py-2.5"
              style={{ borderColor: level.color + "35", background: level.color + "12" }}>
              <span className="text-xl">{level.emoji}</span>
              <span className="text-xs font-black" style={{ color: level.color }}>{level.name}</span>
              <span className="text-[0.55rem] font-bold text-white/30">Niveau</span>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/50">Progression — {activeModule.title}</span>
              <span className="font-black" style={{ color: "#d946ef" }}>{Math.round((doneCours / 20) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #d946ef, #a78bfa)" }}
                initial={{ width: 0 }} animate={{ width: `${Math.round((doneCours / 20) * 100)}%` }} transition={{ duration: 0.8, delay: 0.3, ease }} />
            </div>
            <div className="flex items-center justify-between text-[0.6rem] text-white/25 pt-0.5">
              <span>{level.name}</span>
              {level.xpNext > 0 && <span>{level.xpNext} XP → {level.nextName}</span>}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/5">
              <motion.div className="h-full rounded-full" style={{ background: level.color }}
                initial={{ width: 0 }} animate={{ width: `${level.pct}%` }} transition={{ duration: 0.8, delay: 0.45, ease }} />
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
          className="flex gap-2 rounded-[1.2rem] border border-white/6 bg-white/[0.03] p-1.5"
        >
          {([
            { id: "cours",     label: "Cours",      badge: `${doneCours}/20`,     icon: "📚" },
            { id: "activites", label: "Activités",  badge: "6",                   icon: "🎯" },
            { id: "jeux",      label: "Jeux IA",    badge: "10 niveaux",          icon: "🎮" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[0.72rem] font-bold transition-all"
              style={tab === t.id ? { color: "#fff", background: "#d946ef18", boxShadow: "inset 0 0 0 1px rgba(217,70,239,0.35)" } : { color: "rgba(255,255,255,0.35)" }}>
              <span className="text-sm">{t.icon}</span>
              <span>{t.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[0.55rem] font-black ${tab === t.id ? "bg-[rgba(217,70,239,0.25)] text-fuchsia-300" : "bg-white/6 text-white/30"}`}>
                {t.badge}
              </span>
            </button>
          ))}
        </motion.div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">

          {/* COURS */}
          {tab === "cours" && (
            <motion.div key="cours" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              className="space-y-4">
              {GROUP.map((g, gi) => {
                const items = COURS.filter(c => c.group === gi);
                const doneInGroup = items.filter(c => progress[c.num]).length;
                return (
                  <div key={g.id}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="h-px flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${g.color}50, transparent)` }} />
                      <p className="text-[0.58rem] font-black uppercase tracking-[0.2em]" style={{ color: g.color }}>
                        {g.label} · {doneInGroup}/{items.length}
                      </p>
                      <div className="h-px flex-1 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${g.color}50)` }} />
                    </div>
                    <div className="space-y-1.5">
                      {items.map((c) => {
                        const Icon        = c.icon;
                        const isCompleted = progress[c.num] === true;
                        const isActive    = !isCompleted && c.num === activeModule.num;
                        return (
                          <Link key={c.num} href={`/coaching-ia/cours/${c.num}`} className="block">
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, ease }}
                              whileHover={{ x: 3 }}
                              className="relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3"
                              style={{
                                borderColor: isCompleted ? `rgba(${g.rgb},0.25)` : isActive ? `rgba(${g.rgb},0.4)` : "rgba(255,255,255,0.06)",
                                background:  isCompleted ? `rgba(${g.rgb},0.07)` : isActive ? `rgba(${g.rgb},0.1)` : "rgba(255,255,255,0.025)",
                              }}
                            >
                              {isActive && (
                                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, ${g.color}80, transparent)` }} />
                              )}
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                                style={{ background: `rgba(${g.rgb},0.15)` }}>
                                {isCompleted
                                  ? <CheckCircle2 size={14} style={{ color: g.color }} />
                                  : <Icon size={14} style={{ color: isActive ? g.color : "rgba(255,255,255,0.3)" }} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[0.6rem] font-bold text-white/30 mb-0.5">{c.num}</p>
                                <p className={`text-sm font-bold truncate ${isCompleted ? "text-white/50" : isActive ? "text-white" : "text-white/60"}`}>
                                  {c.title}
                                </p>
                              </div>
                              {isActive && (
                                <span className="shrink-0 rounded-xl px-2.5 py-1 text-[0.58rem] font-black text-white"
                                  style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}bb)` }}>
                                  En cours
                                </span>
                              )}
                              {!isCompleted && !isActive && (
                                <Play size={12} className="shrink-0 text-white/15" />
                              )}
                            </motion.div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ACTIVITÉS */}
          {tab === "activites" && (
            <motion.div key="activites" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              className="grid gap-3 sm:grid-cols-2">
              {ACTIVITES.map(({ Icon, color, title, desc, badge }) => (
                <motion.div key={title} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 cursor-pointer">
                  <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${color}10 0%, transparent 60%)` }} />
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
                  <div className="relative">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: color + "18", border: `1px solid ${color}25` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[0.58rem] font-bold" style={{ color, background: color + "15", border: `1px solid ${color}20` }}>{badge}</span>
                    </div>
                    <p className="text-sm font-extrabold text-white mb-1">{title}</p>
                    <p className="text-xs leading-relaxed text-white/40">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* JEUX IA */}
          {tab === "jeux" && (
            <motion.div key="jeux" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              className="space-y-4">
              <Link href="/coaching-ia/jeux">
                <motion.div whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.99 }}
                  className="relative cursor-pointer overflow-hidden rounded-[1.75rem] border p-5"
                  style={{ borderColor: "rgba(167,139,250,0.4)", background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(99,102,241,0.08))", boxShadow: "0 8px 40px rgba(167,139,250,0.15)" }}>
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.8), transparent)" }} />
                  <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-6xl opacity-10 select-none">🎮</div>
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[0.58rem] font-black uppercase tracking-widest text-violet-400/70 mb-1">Nouveau</p>
                      <p className="text-lg font-black text-white">Jeux IA — 10 Niveaux</p>
                      <p className="mt-0.5 text-xs text-white/45">100 étapes · 300 questions</p>
                    </div>
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      className="shrink-0 flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-black text-white"
                      style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)", boxShadow: "0 4px 24px rgba(167,139,250,0.5)" }}>
                      Jouer <ArrowRight size={13} />
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[{e:"🧠",t:"Les Bases",c:"#22c55e"},{e:"⚡",t:"Les Modèles",c:"#06b6d4"},{e:"✍️",t:"Prompting",c:"#8b5cf6"},{e:"🔍",t:"RAG",c:"#f59e0b"},{e:"🤖",t:"Agents",c:"#f97316"},{e:"💼",t:"Business",c:"#ec4899"},{e:"📣",t:"Marketing",c:"#f43f5e"},{e:"⚙️",t:"Automation",c:"#0ea5e9"},{e:"🎯",t:"Stratégie",c:"#6366f1"},{e:"👑",t:"Maîtrise",c:"#eab308"}]
                  .map(({e,t,c},i) => (
                  <Link key={i} href="/coaching-ia/jeux">
                    <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.3,delay:i*0.04}} whileHover={{scale:1.06,y:-3}}
                      className="relative overflow-hidden rounded-xl border p-2.5 text-center cursor-pointer"
                      style={{borderColor:c+"35",background:`radial-gradient(ellipse 80% 60% at 50% 0%, ${c}18, rgba(255,255,255,0.01))`}}>
                      <div className="absolute inset-x-0 top-0 h-px" style={{background:`linear-gradient(90deg,transparent,${c}60,transparent)`}} />
                      <p className="text-xl mb-0.5">{e}</p>
                      <p className="text-[0.5rem] font-black text-white/55 leading-tight">{t}</p>
                      <p className="text-[0.4rem] mt-0.5 font-bold" style={{color:c}}>Niv. {i+1}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Badges ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Trophy size={12} className="text-yellow-400/60" />
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/30">Badges & Trophées</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {BADGES.map(b => (
              <div key={b.title}
                className="relative overflow-hidden rounded-2xl border p-3 text-center"
                style={{ borderColor: b.unlock ? b.color + "35" : "rgba(255,255,255,0.06)", background: b.unlock ? b.color + "10" : "rgba(255,255,255,0.02)" }}>
                {!b.unlock && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[rgba(6,7,15,0.65)] backdrop-blur-[1px]">
                    <Lock size={11} className="text-white/20" />
                  </div>
                )}
                <p className="text-2xl mb-1">{b.icon}</p>
                <p className="text-[0.5rem] font-black leading-tight" style={{ color: b.unlock ? b.color : "rgba(255,255,255,0.25)" }}>{b.title}</p>
                <p className="text-[0.45rem] mt-0.5 text-white/20 leading-tight">{b.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Certificat (teaser) ── */}
        {doneCours >= 10 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
            className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.3)] p-5"
            style={{ background: "linear-gradient(135deg, rgba(201,165,90,0.08), rgba(201,165,90,0.04))" }}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,165,90,0.6), transparent)" }} />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl" style={{ background: "rgba(201,165,90,0.12)" }}>🎓</div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-white">Certificat DJAMA IA</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {doneCours >= 20 ? "Formation complète — votre certificat est disponible." : `${20 - doneCours} modules restants pour obtenir votre certificat.`}
                </p>
              </div>
              {doneCours >= 20 && (
                <button className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-black" style={{ background: "rgba(201,165,90,0.2)", color: "#c9a55a", border: "1px solid rgba(201,165,90,0.3)" }}>
                  Télécharger
                </button>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
