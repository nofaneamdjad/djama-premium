"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, Target, BarChart3, BookOpen, ArrowRight,
  Play, CheckCircle2, Trophy, Zap, RotateCcw,
  Star, Flame, Bot, PenLine, Loader2,
  ImageIcon, Briefcase, GraduationCap, Megaphone, Calendar,
  ShoppingBag, Code2, Rocket, Award, Lightbulb, Dumbbell,
  FlaskConical, Film, FileText, Gamepad2, BarChart2, ClipboardList,
  Medal, Download, Crown, Lock,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

const COURS = [
  { num: "01", title: "Introduction à l'IA",               icon: Brain         },
  { num: "02", title: "Comprendre les modèles",            icon: BarChart2     },
  { num: "03", title: "Utiliser ChatGPT",                  icon: Bot           },
  { num: "04", title: "Prompt engineering avancé",         icon: PenLine       },
  { num: "05", title: "Automatiser son travail",           icon: Zap           },
  { num: "06", title: "Génération de texte",               icon: FileText      },
  { num: "07", title: "Création d'images avec IA",         icon: ImageIcon     },
  { num: "08", title: "Analyse de données",                icon: BarChart3     },
  { num: "09", title: "IA pour entrepreneurs",             icon: Briefcase     },
  { num: "10", title: "IA pour optimiser son temps",       icon: GraduationCap },
  { num: "11", title: "IA pour le marketing",              icon: Megaphone     },
  { num: "12", title: "Automatisation des tâches",         icon: Zap           },
  { num: "13", title: "Création de contenu",               icon: PenLine       },
  { num: "14", title: "Outils IA indispensables",          icon: Lightbulb     },
  { num: "15", title: "Organisation & productivité",       icon: Calendar      },
  { num: "16", title: "Création d'agents IA",              icon: Bot           },
  { num: "17", title: "IA et business en ligne",           icon: ShoppingBag   },
  { num: "18", title: "IA et programmation",               icon: Code2         },
  { num: "19", title: "Cas pratiques",                     icon: Rocket        },
  { num: "20", title: "Projet final",                      icon: Star          },
];

const ACTIVITES = [
  { Icon: Flame,         color: "#f59e0b", title: "Défi quotidien",        desc: "Un défi court sur un vrai outil IA. 5 à 15 min par jour.", badge: "5–15 min"    },
  { Icon: Dumbbell,      color: "#a78bfa", title: "Atelier guidé",         desc: "Exercices étape par étape avec le Prof IA.",              badge: "Avec Prof IA" },
  { Icon: Film,          color: "#38bdf8", title: "Scénario entrepreneur", desc: "Des situations réelles du quotidien — résolvez-les.",     badge: "Cas réels"   },
  { Icon: Rocket,        color: "#4ade80", title: "Mini-projet",           desc: "Créez un livrable concret à chaque étape clé.",          badge: "Livrable réel"},
  { Icon: FlaskConical,  color: "#f472b6", title: "Lab IA libre",          desc: "Un espace d'exploration sans contrainte.",               badge: "Exploration"  },
  { Icon: ClipboardList, color: "#c9a55a", title: "Étude de cas",          desc: "Décryptage d'un projet IA réel.",                        badge: "Analyse"      },
];

const XP_PER_COURSE = 100;
const LEVEL_DATA = [
  { name: "Novice",     min: 0,    color: "#94a3b8", Icon: BookOpen  },
  { name: "Apprenti",   min: 200,  color: "#60a5fa", Icon: Brain     },
  { name: "Praticien",  min: 500,  color: "#a78bfa", Icon: Zap       },
  { name: "Expert IA",  min: 1000, color: "#f59e0b", Icon: Flame     },
  { name: "Maître IA",  min: 1800, color: "#d946ef", Icon: Crown     },
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

export default function CoachingIAPage() {
  const router = useRouter();
  const [tab,       setTab]       = useState<"cours" | "activites" | "jeux">("cours");
  const [progress,  setProgress]  = useState<Record<string, boolean>>({});
  const [loading,   setLoading]   = useState(true);
  const [streak,    setStreak]    = useState(0);
  const [userName,  setUserName]  = useState("");
  const [showCert,  setShowCert]  = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserName(user.email?.split("@")[0] ?? "Apprenant");
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

  // Streak
  useEffect(() => {
    const today     = new Date().toDateString();
    const lastVisit = localStorage.getItem("coaching_last_visit");
    const stored    = parseInt(localStorage.getItem("coaching_streak") ?? "0", 10);
    if (!lastVisit) {
      localStorage.setItem("coaching_streak", "1");
      localStorage.setItem("coaching_last_visit", today);
      setStreak(1);
    } else if (lastVisit === today) {
      setStreak(stored);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const next = lastVisit === yesterday.toDateString() ? stored + 1 : 1;
      localStorage.setItem("coaching_streak", String(next));
      localStorage.setItem("coaching_last_visit", today);
      setStreak(next);
    }
  }, []);

  const doneCours   = COURS.filter(c => progress[c.num]).length;
  const progressPct = Math.round((doneCours / COURS.length) * 100);
  const activeModule= COURS.find(c => !progress[c.num]) ?? COURS[COURS.length - 1];
  const XP          = doneCours * XP_PER_COURSE;
  const level       = getLevel(XP);
  const LevelIcon   = level.Icon;

  const BADGES = [
    { id: "first",    icon: "🚀", title: "Premier pas",   desc: "1er cours terminé",           color: "#4ade80", unlock: doneCours >= 1  },
    { id: "prompt",   icon: "✍️", title: "Prompt Master",  desc: "Module 04 complété",          color: "#d946ef", unlock: !!progress["04"] },
    { id: "halfway",  icon: "⚡", title: "Mi-chemin",      desc: "10 modules complétés",        color: "#f59e0b", unlock: doneCours >= 10 },
    { id: "streak7",  icon: "🔥", title: "Semaine de feu", desc: "7 jours consécutifs",         color: "#f97316", unlock: streak >= 7     },
    { id: "expert",   icon: "🌟", title: "Expert IA",      desc: "15 modules complétés",        color: "#a78bfa", unlock: doneCours >= 15 },
    { id: "grad",     icon: "🎓", title: "Diplômé IA",     desc: "Formation complète",          color: "#c9a55a", unlock: doneCours >= 20 },
  ];

  const certUnlocked = doneCours >= 20;
  const certTeaser   = doneCours >= 10 && doneCours < 20;

  if (loading) return (
    <div className="flex h-64 items-center justify-center bg-[#07080e]">
      <Loader2 size={28} className="animate-spin text-fuchsia-400" />
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#07080e] text-white">
      <div className="relative z-10 mx-auto max-w-4xl space-y-5 px-5 py-6 sm:px-8">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/8">
            <Brain size={18} style={{ color: "#d946ef" }} />
          </div>
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/30">Formation</p>
            <h1 className="text-xl font-black text-white">Coaching IA</h1>
            <p className="text-[0.65rem] text-white/30">Cours · Activités · Jeux · Prof IA</p>
          </div>
        </div>

        {/* Progress + XP card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="relative overflow-hidden rounded-2xl border bg-white/4 p-5 backdrop-blur-sm"
          style={{ borderColor: "#d946ef25" }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #d946ef60, transparent)" }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(217,70,239,0.07) 0%, transparent 60%)" }} />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-white/70">Progression globale</p>
                {streak > 0 && (
                  <span className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[0.6rem] font-bold text-orange-400">
                    🔥 {streak} jour{streak > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/35">Module en cours : {activeModule.title} ({activeModule.num}/20)</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Level badge */}
              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: level.color + "40", background: level.color + "12" }}>
                <LevelIcon size={13} style={{ color: level.color }} />
                <div>
                  <p className="text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: level.color }}>Niveau</p>
                  <p className="text-xs font-black text-white">{level.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {[
                  { val: `${doneCours}/20`, label: "Cours",    color: "#d946ef" },
                  { val: `${XP} XP`,        label: "Points",   color: "#f59e0b" },
                  { val: "6",               label: "Activités", color: "#4ade80" },
                ].map(({ val, label, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-base font-black" style={{ color }}>{val}</p>
                    <p className="text-[0.58rem] text-white/35">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Course progress bar */}
          <div className="relative mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.2, ease, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #d946ef, #a78bfa)" }}
              />
            </div>
            <p className="mt-1 text-right text-[0.6rem] text-white/30">{progressPct}% complété</p>
          </div>

          {/* XP to next level */}
          {level.nextName && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-[0.58rem] text-white/25">
                <span>{level.name}</span>
                <span>{level.xpNext} XP pour {level.nextName}</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/6">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${level.pct}%`, background: level.color }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.05 }}
        >
          <p className="mb-3 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-white/30">
            <Medal size={11} /> Badges & Récompenses
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {BADGES.map(({ id, icon, title, desc, color, unlock }) => (
              <motion.div
                key={id}
                whileHover={unlock ? { scale: 1.05, y: -2 } : {}}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all ${
                  unlock
                    ? "border-white/10 bg-white/5 cursor-default"
                    : "border-white/4 bg-white/2 cursor-default"
                }`}
                style={unlock ? { borderColor: color + "35", background: color + "0d" } : {}}
              >
                {!unlock && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
                    <Lock size={12} className="text-white/20" />
                  </div>
                )}
                <span className={`text-2xl ${unlock ? "" : "opacity-25 grayscale"}`}>{icon}</span>
                <p className={`text-[0.58rem] font-black leading-tight ${unlock ? "text-white" : "text-white/25"}`}>{title}</p>
                <p className={`text-[0.5rem] leading-tight ${unlock ? "text-white/40" : "text-white/15"}`}>{desc}</p>
                {unlock && (
                  <div className="h-1 w-1 rounded-full animate-pulse" style={{ background: color }} />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.1 }}
          className="flex gap-2 rounded-2xl border border-white/8 bg-white/4 p-1.5 backdrop-blur-sm"
        >
          {([
            { id: "cours",     label: "Cours",     count: "20" },
            { id: "activites", label: "Activités", count: "6"  },
            { id: "jeux",      label: "Jeux",      count: "5"  },
          ] as const).map(({ id, label, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                tab === id ? "text-white" : "text-white/35 hover:text-white/60"
              }`}>
              {tab === id && (
                <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-xl"
                  style={{ background: "rgba(217,70,239,0.15)", border: "1px solid rgba(217,70,239,0.3)" }}
                  transition={{ duration: 0.25, ease }} />
              )}
              <span className="relative">{label}</span>
              <span className={`relative rounded-full px-1.5 py-0.5 text-[0.55rem] font-semibold ${tab === id ? "bg-[rgba(217,70,239,0.3)] text-fuchsia-300" : "bg-white/8 text-white/30"}`}>
                {count}
              </span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── Cours ── */}
          {tab === "cours" && (
            <motion.div key="cours"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }}
              className="space-y-2">
              {COURS.map((c, i) => {
                const Icon        = c.icon;
                const isCompleted = progress[c.num] === true;
                const isActive    = !isCompleted && c.num === activeModule.num;
                return (
                  <Link key={c.num} href={`/client/coaching-ia/cours/${c.num}`} className="block">
                    <motion.div
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, ease, delay: i * 0.025 }}
                      whileHover={{ x: 4 }}
                      className={`group flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all ${
                        isCompleted ? "border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.05)] hover:border-[rgba(74,222,128,0.35)]"
                        : isActive   ? "border-[rgba(217,70,239,0.35)] bg-[rgba(217,70,239,0.08)] hover:border-[rgba(217,70,239,0.5)]"
                        :              "border-white/6 bg-white/[0.025] hover:border-white/15 hover:bg-white/4"
                      }`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        isCompleted ? "bg-[rgba(74,222,128,0.15)]" : isActive ? "bg-[rgba(217,70,239,0.15)]" : "bg-white/5"
                      }`}>
                        {isCompleted ? <CheckCircle2 size={15} className="text-[#4ade80]" />
                          : isActive ? <Play size={14} style={{ color: "#d946ef" }} />
                          : <Icon size={14} className="text-white/25" />}
                      </div>
                      <span className={`w-6 shrink-0 text-xs font-semibold tabular-nums ${isCompleted ? "text-[#4ade80]" : isActive ? "text-fuchsia-400" : "text-white/20"}`}>
                        {c.num}
                      </span>
                      <div className={`h-6 w-px shrink-0 ${isCompleted ? "bg-[rgba(74,222,128,0.3)]" : isActive ? "bg-[rgba(217,70,239,0.3)]" : "bg-white/8"}`} />
                      <Icon size={14} className={isCompleted ? "text-[#4ade80]" : isActive ? "text-fuchsia-400" : "text-white/25"} />
                      <span className={`flex-1 text-sm font-semibold ${isCompleted ? "text-white/80" : isActive ? "text-white" : "text-white/40"}`}>
                        {c.title}
                      </span>
                      {isCompleted ? (
                        <span className="shrink-0 flex items-center gap-1 rounded-full bg-[rgba(74,222,128,0.15)] px-2 py-0.5 text-[0.55rem] font-bold text-[#4ade80]">
                          <CheckCircle2 size={8} /> +100 XP
                        </span>
                      ) : isActive ? (
                        <span className="shrink-0 rounded-full bg-[rgba(217,70,239,0.2)] px-2 py-0.5 text-[0.55rem] font-bold text-fuchsia-300">
                          En cours
                        </span>
                      ) : (
                        <span className="shrink-0 flex items-center gap-1 rounded-full border border-white/8 bg-[rgba(217,70,239,0.08)] px-2 py-0.5 text-[0.55rem] font-bold text-fuchsia-400/60">
                          <Brain size={8} /> 100 XP
                        </span>
                      )}
                      <ArrowRight size={12} className={`shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${isCompleted ? "text-[#4ade80]" : "text-fuchsia-400"}`} />
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          )}

          {/* ── Activités ── */}
          {tab === "activites" && (
            <motion.div key="activites"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }}
              className="grid gap-4 sm:grid-cols-2">
              {ACTIVITES.map(({ Icon, color, title, desc, badge }, i) => (
                <motion.div key={title}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease, delay: i * 0.06 }}
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/8 bg-white/4 p-5 transition-all hover:border-white/15 hover:shadow-lg hover:shadow-black/30">
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${color}18 0%, transparent 60%)` }} />
                  <div className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ backgroundColor: color + "18", borderColor: color + "30" }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold" style={{ color, backgroundColor: color + "15", border: `1px solid ${color}25` }}>
                      {badge}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/40">{desc}</p>
                  <Link href="/client/coaching-ia/jeux" className="mt-4 flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color }}>
                    Commencer <ArrowRight size={11} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── Jeux ── */}
          {tab === "jeux" && (
            <motion.div key="jeux"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }}
              className="space-y-5">
              <Link href="/client/coaching-ia/jeux">
                <motion.div whileHover={{ scale: 1.01 }}
                  className="relative cursor-pointer overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.3)] bg-white/4 p-6 transition-all hover:shadow-lg hover:shadow-black/30">
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)" }} />
                  <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(167,139,250,0.09) 0%, transparent 60%)" }} />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-base font-extrabold text-white">Espace Jeux IA</p>
                      <p className="mt-0.5 text-xs text-white/40">5 jeux interactifs pour apprendre l'IA en vous amusant</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-extrabold text-black shadow-[0_4px_20px_rgba(167,139,250,0.35)]" style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
                      Jouer <ArrowRight size={12} />
                    </div>
                  </div>
                </motion.div>
              </Link>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { color: "#a78bfa", title: "Quiz IA",      badge: "10 Q",        Icon: Trophy   },
                  { color: "#38bdf8", title: "Flash Cards",  badge: "12 cartes",   Icon: BookOpen },
                  { color: "#f59e0b", title: "Speed Quiz",   badge: "8 Q rapides", Icon: Zap      },
                  { color: "#4ade80", title: "Vrai ou Faux", badge: "8 Q",         Icon: Target   },
                  { color: "#f472b6", title: "Défi du jour", badge: "Prompt",      Icon: Sparkles },
                ].map(({ color, title, badge, Icon: GameIcon }, i) => (
                  <Link key={title} href="/client/coaching-ia/jeux">
                    <motion.div
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease, delay: i * 0.06 }}
                      whileHover={{ scale: 1.04, y: -4 }} whileTap={{ scale: 0.97 }}
                      className="relative overflow-hidden rounded-xl border border-white/8 bg-white/4 p-4 text-left transition-all hover:border-white/15 hover:shadow-lg hover:shadow-black/30">
                      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${color}10 0%, transparent 60%)` }} />
                      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
                      <div className="relative mb-3 flex items-start justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: color + "18", border: `1px solid ${color}25` }}>
                          <GameIcon size={14} style={{ color }} />
                        </div>
                        <span className="rounded-full px-2 py-0.5 text-[0.55rem] font-bold" style={{ color, backgroundColor: color + "15", border: `1px solid ${color}20` }}>{badge}</span>
                      </div>
                      <p className="relative text-sm font-extrabold text-white">{title}</p>
                      <div className="relative mt-2 flex items-center gap-1 text-[0.6rem] font-bold" style={{ color }}>
                        <Play size={8} fill={color} /> Jouer
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Certificat ── */}
        {(certUnlocked || certTeaser) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl border p-6"
            style={{ borderColor: "#c9a55a40", background: "linear-gradient(135deg, rgba(201,165,90,0.06), rgba(217,70,239,0.04))" }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #c9a55a60, transparent)" }} />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2" style={{ borderColor: "#c9a55a40", background: "rgba(201,165,90,0.1)" }}>
                  <GraduationCap size={24} style={{ color: "#c9a55a" }} />
                </div>
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest" style={{ color: "#c9a55a" }}>
                    {certUnlocked ? "Débloqué" : `${doneCours}/20 modules`}
                  </p>
                  <p className="text-base font-black text-white">Certificat de Formation IA</p>
                  <p className="text-xs text-white/40">
                    {certUnlocked
                      ? "Félicitations ! Votre certificat DJAMA est prêt."
                      : `Plus que ${20 - doneCours} module${20 - doneCours > 1 ? "s" : ""} pour débloquer votre certificat.`}
                  </p>
                </div>
              </div>
              {certUnlocked ? (
                <button onClick={() => setShowCert(true)}
                  className="flex shrink-0 items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black text-black transition hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #c9a55a, #b8883a)" }}>
                  <Download size={14} /> Voir mon certificat
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-[rgba(201,165,90,0.2)] px-4 py-2 text-xs font-bold" style={{ color: "#c9a55a80" }}>
                  <Lock size={11} /> {20 - doneCours} restants
                </div>
              )}
            </div>
            {!certUnlocked && (
              <div className="relative mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #c9a55a, #d946ef)" }} />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Certificate modal */}
        <AnimatePresence>
          {showCert && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-md" onClick={() => setShowCert(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.25 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 bg-[#0d1117] p-8 text-center shadow-2xl"
                style={{ borderColor: "#c9a55a50" }}
              >
                {/* Gold top bar */}
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, #c9a55a, #d946ef, #c9a55a)" }} />

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2" style={{ borderColor: "#c9a55a40", background: "rgba(201,165,90,0.12)" }}>
                  <GraduationCap size={30} style={{ color: "#c9a55a" }} />
                </div>

                <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/30">Certificat de formation</p>
                <h2 className="mt-2 text-2xl font-black text-white">Formation IA Complète</h2>
                <p className="mt-1 text-sm text-white/40">Coaching IA — 20 modules · DJAMA PRO</p>

                <div className="my-5 border-t border-b border-white/6 py-5">
                  <p className="text-[0.65rem] text-white/30 uppercase tracking-widest mb-1">Décerné à</p>
                  <p className="text-xl font-black text-white" style={{ textTransform: "capitalize" }}>{userName}</p>
                  <p className="mt-1 text-xs text-white/30">
                    Le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>

                <div className="flex justify-center gap-6 mb-5">
                  {[
                    { val: "20", label: "Modules", color: "#d946ef" },
                    { val: "2000", label: "XP Total",  color: "#f59e0b" },
                    { val: "Maître IA", label: "Niveau",  color: "#c9a55a" },
                  ].map(({ val, label, color }) => (
                    <div key={label} className="text-center">
                      <p className="text-lg font-black" style={{ color }}>{val}</p>
                      <p className="text-[0.58rem] text-white/30">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 text-[0.6rem] text-white/20 mb-5">
                  <div className="h-px flex-1 bg-white/6" />
                  <span>DJAMA PRO · Certifié IA</span>
                  <div className="h-px flex-1 bg-white/6" />
                </div>

                <div className="flex gap-2 justify-center">
                  <button onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-black"
                    style={{ background: "linear-gradient(135deg, #c9a55a, #b8883a)" }}>
                    <Download size={13} /> Télécharger
                  </button>
                  <button onClick={() => setShowCert(false)}
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-5 py-2.5 text-sm font-bold text-white/60 transition hover:text-white">
                    Fermer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
