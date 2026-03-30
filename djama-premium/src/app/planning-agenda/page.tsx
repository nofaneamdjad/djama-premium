"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  CalendarDays,
  ListTodo,
  Clock,
  Bell,
  Target,
  StickyNote,
  BarChart2,
  Briefcase,
  GraduationCap,
  Users,
  User,
  Heart,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Calendar,
  AlarmClock,
  Layers,
  TrendingUp,
  Zap,
  Shield,
  Sun,
  Sunset,
  Moon,
  Circle,
  Star,
  Flag,
  Timer,
  PenLine,
  Inbox,
  ChevronRight,
  AlertCircle,
  PlayCircle,
  MinusCircle,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Data ───────────────────────────────────────── */
const FEATURES = [
  { icon: CalendarDays, title: "Agenda journalier",        desc: "Visualisez toute votre journée en un coup d'œil. Chaque heure, chaque tâche, chaque rendez-vous." },
  { icon: Calendar,     title: "Vue hebdomadaire",         desc: "Planifiez votre semaine entière pour anticiper, éviter les conflits et rester focus." },
  { icon: BarChart2,    title: "Vue mensuelle",            desc: "Un aperçu complet du mois pour une vision stratégique de votre activité." },
  { icon: ListTodo,     title: "Gestion des tâches",       desc: "Créez, organisez et cochez vos tâches. Priorisez l'essentiel, déléguez le reste." },
  { icon: Bell,         title: "Rappels automatiques",     desc: "Ne ratez plus rien. Configurez des rappels précis pour chaque événement important." },
  { icon: Clock,        title: "Organisation par heure",   desc: "Des créneaux horaires clairs : matin, après-midi, soir — tout est structuré." },
  { icon: Target,       title: "Suivi des priorités",      desc: "Identifiez ce qui compte vraiment. Urgences, importantes, à planifier : tout est classé." },
  { icon: StickyNote,   title: "Notes rapides",            desc: "Capturez une idée, une info, un mémo — directement dans votre planning." },
  { icon: Star,         title: "Objectifs du jour",        desc: "Définissez 3 objectifs clés chaque matin pour démarrer avec intention et clarté." },
  { icon: GraduationCap,title: "Organisation des études",  desc: "Révisez efficacement. Planifiez les devoirs, exams et projets sans stress." },
  { icon: Briefcase,    title: "Planning business",        desc: "Gérez clients, projets, délais et réunions depuis un seul tableau de bord." },
  { icon: Heart,        title: "Équilibre vie perso / pro", desc: "Protégez votre temps personnel. Créez des zones de déconnexion dans votre planning." },
];

const TIME_BLOCKS = [
  {
    period: "Matin",
    icon: Sun,
    color: "#f9a826",
    bg: "rgba(249,168,38,0.08)",
    border: "rgba(249,168,38,0.25)",
    slots: [
      { time: "07h00", label: "Objectifs du jour", tag: "Focus", tagColor: "#f9a826" },
      { time: "08h00", label: "Bloc de travail profond", tag: "Priorité", tagColor: "#c9a55a" },
      { time: "09h30", label: "Réunion équipe", tag: "RDV", tagColor: "#7c6fcd" },
      { time: "11h00", label: "Traitement emails", tag: "Tâche", tagColor: "#34d399" },
    ],
  },
  {
    period: "Après-midi",
    icon: Sunset,
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.08)",
    border: "rgba(201,165,90,0.25)",
    slots: [
      { time: "14h00", label: "Appel client — Projet X", tag: "RDV", tagColor: "#7c6fcd" },
      { time: "15h30", label: "Révisions / Formation", tag: "Études", tagColor: "#34d399" },
      { time: "17h00", label: "Bilan de la journée", tag: "Focus", tagColor: "#f9a826" },
    ],
  },
  {
    period: "Soirée",
    icon: Moon,
    color: "#7c6fcd",
    bg: "rgba(124,111,205,0.08)",
    border: "rgba(124,111,205,0.25)",
    slots: [
      { time: "19h00", label: "Temps personnel / Sport", tag: "Perso", tagColor: "#dc5078" },
      { time: "20h30", label: "Préparation J+1", tag: "Focus", tagColor: "#f9a826" },
    ],
  },
];

const PERSONAS = [
  {
    icon: Briefcase,
    label: "Entrepreneur",
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.08)",
    border: "rgba(201,165,90,0.2)",
    features: ["Planifier clients & projets", "Suivre les deadlines", "Gérer les priorités business", "Bloquer du temps de création"],
  },
  {
    icon: GraduationCap,
    label: "Étudiant",
    color: "#34d399",
    bg: "rgba(52,211,153,0.07)",
    border: "rgba(52,211,153,0.2)",
    features: ["Planning de révisions", "Suivi des examens", "Organisation des cours", "Objectifs académiques"],
  },
  {
    icon: Heart,
    label: "Parent",
    color: "#dc5078",
    bg: "rgba(220,80,120,0.07)",
    border: "rgba(220,80,120,0.2)",
    features: ["Agenda familial", "Activités des enfants", "Rendez-vous médicaux", "Équilibre famille / travail"],
  },
  {
    icon: Users,
    label: "Professionnel",
    color: "#7c6fcd",
    bg: "rgba(124,111,205,0.08)",
    border: "rgba(124,111,205,0.2)",
    features: ["Réunions et comptes rendus", "Suivi des projets d'équipe", "Gestion du temps de travail", "Automatiser les rappels"],
  },
  {
    icon: User,
    label: "Organisation perso",
    color: "#f9a826",
    bg: "rgba(249,168,38,0.07)",
    border: "rgba(249,168,38,0.2)",
    features: ["Routine quotidienne", "Objectifs personnels", "Suivi des habitudes", "Réduire le stress"],
  },
];

const VIEWS = [
  { icon: Sun,         label: "Vue du jour",      desc: "Toutes vos heures, vos tâches et vos objectifs sur une seule ligne de temps claire." },
  { icon: Calendar,    label: "Vue de la semaine", desc: "Planifiez 7 jours en un regard. Anticipez les pics de charge, libérez du temps." },
  { icon: ListTodo,    label: "Liste de tâches",   desc: "Cochez, priorisez, déléguez. Votre to-do intelligente, toujours à portée." },
  { icon: Target,      label: "Priorités",         desc: "Matrice urgence / importance pour ne jamais passer du temps sur le mauvais sujet." },
  { icon: AlarmClock,  label: "Agenda & rappels",  desc: "Synchronisez vos rendez-vous et recevez des rappels avant chaque événement." },
  { icon: TrendingUp,  label: "Objectifs",         desc: "Définissez vos objectifs hebdomadaires, suivez votre progression jour après jour." },
];

const BENEFITS = [
  { icon: Zap,       text: "Gagner du temps chaque jour" },
  { icon: Shield,    text: "Réduire le stress et les oublis" },
  { icon: Target,    text: "Mieux structurer son quotidien" },
  { icon: BarChart2, text: "Améliorer sa productivité globale" },
  { icon: Heart,     text: "Préserver l'équilibre de vie" },
  { icon: Layers,    text: "Tout gérer depuis un seul outil" },
];

const STATS = [
  { value: "12",    label: "Vues disponibles" },
  { value: "100%",  label: "Personnalisable" },
  { value: "3×",    label: "Plus productif" },
  { value: "0€",    label: "D'abonnement" },
];

/* ══════════════════════════════════════════════════
   DASHBOARD BENTO — données mock
══════════════════════════════════════════════════ */
const INITIAL_TASKS = [
  { id: 1, label: "Préparer la présentation client",   status: "done",       priority: "high" },
  { id: 2, label: "Envoyer la facture mensuelle",       status: "done",       priority: "high" },
  { id: 3, label: "Réviser le chapitre 3 — Physique",  status: "in-progress",priority: "medium" },
  { id: 4, label: "Appel commercial — Projet Alpha",    status: "in-progress",priority: "high" },
  { id: 5, label: "Rédiger le compte-rendu réunion",   status: "todo",       priority: "medium" },
  { id: 6, label: "Commander les fournitures",          status: "todo",       priority: "low" },
];

const APPOINTMENTS = [
  { time: "09h30", label: "Stand-up équipe",         color: "#7c6fcd", done: true },
  { time: "11h00", label: "Appel client — M. Dupont", color: "#c9a55a", done: false },
  { time: "14h00", label: "Formation IA en ligne",    color: "#34d399", done: false },
  { time: "16h30", label: "Bilan de sprint",          color: "#f9a826", done: false },
];

const OBJECTIVES = [
  { label: "Terminer la formation IA",   progress: 72, color: "#c9a55a" },
  { label: "Préparer le bilan mensuel",  progress: 45, color: "#7c6fcd" },
  { label: "Lancer la campagne marketing",progress: 20, color: "#34d399" },
];

const REMINDERS = [
  { time: "Dans 30 min",  label: "Appel client — Projet Alpha", urgent: true },
  { time: "Demain 09h00", label: "Soumettre le rapport mensuel", urgent: false },
  { time: "Vendredi",     label: "Paiement fournisseur à effectuer", urgent: false },
];

const DEADLINES = [
  { label: "Rapport trimestriel", days: 2,  color: "#dc5078" },
  { label: "Présentation board",  days: 5,  color: "#f9a826" },
  { label: "Livraison Projet X",  days: 12, color: "#34d399" },
  { label: "Renouvellement contrat", days: 18, color: "#7c6fcd" },
];

const WEEK_DAYS = ["Lu","Ma","Me","Je","Ve","Sa","Di"];
const WEEK_EVENTS: Record<number, { color: string; count: number }> = {
  1: { color: "#c9a55a", count: 2 },
  3: { color: "#7c6fcd", count: 3 },
  4: { color: "#34d399", count: 1 },
  6: { color: "#f9a826", count: 2 },
};

/* ── Composant Dashboard ─────────────────────────── */
function PlanningDashboard() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("Idée : créer un template de planning mensuel pour les clients…");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const today = new Date();
  const todayFR = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const dayProgress = Math.round((doneTasks / tasks.length) * 100);

  function toggleTask(id: number) {
    setTasks((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t
    ));
  }

  const statusIcon = (s: string) => {
    if (s === "done")        return <CheckCircle2 size={14} className="shrink-0" style={{ color: "#34d399" }} />;
    if (s === "in-progress") return <PlayCircle   size={14} className="shrink-0" style={{ color: "#f9a826" }} />;
    return                          <MinusCircle  size={14} className="shrink-0 text-[var(--muted)]" />;
  };

  const priorityBadge = (p: string) => {
    const cfg: Record<string, { label: string; color: string }> = {
      high:   { label: "Haute",   color: "#dc5078" },
      medium: { label: "Moyenne", color: "#f9a826" },
      low:    { label: "Basse",   color: "#34d399" },
    };
    const c = cfg[p];
    return (
      <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.55rem] font-extrabold"
        style={{ background: `${c.color}18`, color: c.color }}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-3">

      {/* ── Barre du haut : Date · Heure · Progression ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.4, ease }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {/* Date */}
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)]">
            <CalendarDays size={18} style={{ color: "#c9a55a" }} />
          </div>
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted)]">Date du jour</p>
            <p className="text-sm font-extrabold capitalize text-[var(--ink)]">{todayFR}</p>
          </div>
        </div>

        {/* Heure live */}
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(124,111,205,0.2)] bg-[rgba(124,111,205,0.07)]">
            <Clock size={18} style={{ color: "#7c6fcd" }} />
          </div>
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted)]">Heure</p>
            <p className="font-extrabold tabular-nums text-[var(--ink)]" style={{ fontSize: "1.1rem", letterSpacing: "0.04em" }}>
              {time || "——:——:——"}
            </p>
          </div>
        </div>

        {/* Progression du jour */}
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.07)]">
            <TrendingUp size={18} style={{ color: "#34d399" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted)]">Progression</p>
              <span className="text-xs font-extrabold" style={{ color: "#34d399" }}>{dayProgress}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${dayProgress}%` }}
                viewport={viewport}
                transition={{ duration: 1, ease, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#34d399,#10b981)" }}
              />
            </div>
            <p className="mt-1 text-[0.6rem] text-[var(--muted)]">{doneTasks}/{tasks.length} tâches terminées</p>
          </div>
        </div>
      </motion.div>

      {/* ── Ligne 2 : Tâches · RDV · Priorités ── */}
      <div className="grid gap-3 lg:grid-cols-[1fr_260px_200px]">

        {/* Tâches du jour */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.45, ease, delay: 0.05 }}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ListTodo size={15} style={{ color: "#c9a55a" }} />
              <span className="text-xs font-extrabold text-[var(--ink)]">Tâches du jour</span>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold" style={{ background: "rgba(201,165,90,0.1)", color: "#c9a55a" }}>
              {doneTasks}/{tasks.length}
            </span>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {tasks.map((t) => (
              <motion.li
                key={t.id}
                whileHover={{ backgroundColor: "rgba(249,250,251,1)" }}
                className="flex items-center gap-3 px-5 py-3 cursor-pointer"
                onClick={() => toggleTask(t.id)}
              >
                {statusIcon(t.status)}
                <span className={`flex-1 text-xs font-medium ${t.status === "done" ? "line-through text-[var(--muted)]" : "text-[var(--ink)]"}`}>
                  {t.label}
                </span>
                {priorityBadge(t.priority)}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Rendez-vous */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.45, ease, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3.5">
            <AlarmClock size={15} style={{ color: "#7c6fcd" }} />
            <span className="text-xs font-extrabold text-[var(--ink)]">Rendez-vous</span>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {APPOINTMENTS.map((a) => (
              <li key={a.label} className={`flex items-start gap-3 px-5 py-3 ${a.done ? "opacity-50" : ""}`}>
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: a.color }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold text-[var(--ink)] ${a.done ? "line-through" : ""}`}>{a.label}</p>
                  <p className="text-[0.6rem] text-[var(--muted)]">{a.time}</p>
                </div>
                {a.done && <CheckCircle2 size={12} className="shrink-0 mt-0.5" style={{ color: "#34d399" }} />}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Priorités */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.45, ease, delay: 0.15 }}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3.5">
            <Flag size={15} style={{ color: "#dc5078" }} />
            <span className="text-xs font-extrabold text-[var(--ink)]">Priorités</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {[
              { level: "P1 — Urgent",    color: "#dc5078", count: tasks.filter(t=>t.priority==="high"  ).length },
              { level: "P2 — Important", color: "#f9a826", count: tasks.filter(t=>t.priority==="medium").length },
              { level: "P3 — Normal",    color: "#34d399", count: tasks.filter(t=>t.priority==="low"   ).length },
            ].map(({ level, color, count }) => (
              <div key={level} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-medium text-[var(--ink)]">{level}</span>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-extrabold"
                  style={{ background: `${color}18`, color }}>{count}</span>
              </div>
            ))}
            <div className="px-5 py-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Statut</p>
              {[
                { label: "Terminé",    icon: <CheckCircle2 size={11} />, color: "#34d399", val: tasks.filter(t=>t.status==="done").length },
                { label: "En cours",   icon: <PlayCircle   size={11} />, color: "#f9a826", val: tasks.filter(t=>t.status==="in-progress").length },
                { label: "À faire",    icon: <MinusCircle  size={11} />, color: "#71717a", val: tasks.filter(t=>t.status==="todo").length },
              ].map(({ label, icon, color, val }) => (
                <div key={label} className="flex items-center justify-between py-0.5">
                  <span className="flex items-center gap-1.5 text-[0.65rem] text-[var(--muted)]" style={{ color }}>
                    {icon} {label}
                  </span>
                  <span className="text-[0.65rem] font-bold" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Ligne 3 : Semaine · Objectifs · Rappels ── */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_220px]">

        {/* Calendrier semaine */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.45, ease, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Calendar size={15} style={{ color: "#c9a55a" }} />
              <span className="text-xs font-extrabold text-[var(--ink)]">Calendrier — Semaine</span>
            </div>
            <span className="text-[0.6rem] text-[var(--muted)]">Semaine 14</span>
          </div>
          <div className="p-4">
            {/* En-têtes jours */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEK_DAYS.map((d, i) => (
                <div key={d} className={`text-center text-[0.6rem] font-bold uppercase py-1 rounded-lg ${i === 2 ? "text-white" : "text-[var(--muted)]"}`}
                  style={i === 2 ? { background: "linear-gradient(135deg,#c9a55a,#b08d45)" } : {}}>
                  {d}
                </div>
              ))}
            </div>
            {/* Créneaux horaires */}
            {["08h", "10h", "12h", "14h", "16h", "18h"].map((hour) => (
              <div key={hour} className="grid grid-cols-7 gap-1 mb-1">
                {WEEK_DAYS.map((_, di) => {
                  const ev = WEEK_EVENTS[di];
                  const isToday = di === 2;
                  const filled = ev && Math.random() > 0.6; // decorative
                  return (
                    <div key={di}
                      className={`h-6 rounded-md transition-colors ${isToday ? "border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.05)]" : "bg-[var(--surface)]"}`}
                      style={ev && di === di && parseInt(hour) % (4 - ev.count) === 0 ? { background: `${ev.color}20`, borderLeft: `2px solid ${ev.color}` } : {}}
                    />
                  );
                })}
              </div>
            ))}
            {/* Légende événements */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { color: "#c9a55a", label: "RDV client" },
                { color: "#7c6fcd", label: "Réunion" },
                { color: "#34d399", label: "Formation" },
                { color: "#f9a826", label: "Perso" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1 text-[0.6rem] text-[var(--muted)]">
                  <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Objectifs + Barres de progression */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.45, ease, delay: 0.15 }}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3.5">
            <Target size={15} style={{ color: "#34d399" }} />
            <span className="text-xs font-extrabold text-[var(--ink)]">Objectifs</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {OBJECTIVES.map(({ label, progress, color }) => (
              <div key={label} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--ink)]">{label}</span>
                  <span className="text-xs font-extrabold tabular-nums" style={{ color }}>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progress}%` }}
                    viewport={viewport}
                    transition={{ duration: 1.1, ease, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Deadlines */}
          <div className="border-t border-[var(--border)] px-5 pt-4 pb-3">
            <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted)]">Deadlines</p>
            <div className="space-y-2">
              {DEADLINES.map(({ label, days, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Timer size={11} style={{ color }} className="shrink-0" />
                    <span className="text-xs text-[var(--ink)] truncate">{label}</span>
                  </div>
                  <span className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold"
                    style={{ background: `${color}18`, color }}>
                    J-{days}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Rappels + Notes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.45, ease, delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          {/* Rappels */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3.5">
              <Bell size={14} style={{ color: "#f9a826" }} />
              <span className="text-xs font-extrabold text-[var(--ink)]">Rappels</span>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {REMINDERS.map((r) => (
                <li key={r.label} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={12} className="mt-0.5 shrink-0"
                      style={{ color: r.urgent ? "#dc5078" : "#f9a826" }} />
                    <div>
                      <p className="text-[0.65rem] font-semibold text-[var(--ink)] leading-tight">{r.label}</p>
                      <p className="mt-0.5 text-[0.6rem]" style={{ color: r.urgent ? "#dc5078" : "var(--muted)" }}>
                        {r.time}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Note rapide */}
          <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.04)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 border-b border-[rgba(249,168,38,0.2)] px-5 py-3">
              <PenLine size={13} style={{ color: "#f9a826" }} />
              <span className="text-xs font-extrabold text-[var(--ink)]">Note rapide</span>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full resize-none bg-transparent text-xs leading-relaxed text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                placeholder="Ajouter une note…"
              />
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

/* ── Mock Mini Calendar ─────────────────────────── */
const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MINI_CAL = [
  [null, null, null, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, 31, null],
];
const EVENTS: Record<number, string> = { 8: "#c9a55a", 14: "#7c6fcd", 15: "#c9a55a", 22: "#34d399", 28: "#dc5078" };

function MiniCalendar() {
  const [selected, setSelected] = useState(15);
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
        <span className="text-sm font-extrabold text-[var(--ink)]">Avril 2026</span>
        <div className="flex items-center gap-1">
          <div className="h-6 w-6 rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
          <div className="h-6 w-6 rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      </div>
      {/* Days header */}
      <div className="grid grid-cols-7 bg-[var(--surface)] px-2 py-1.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted)]">{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div className="px-2 pb-3">
        {MINI_CAL.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5 py-0.5">
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const isSel = day === selected;
              const dot = EVENTS[day];
              return (
                <motion.button
                  key={day}
                  type="button"
                  onClick={() => setSelected(day)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.93 }}
                  className={`relative flex h-8 w-full items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isSel ? "text-white" : "text-[var(--ink)] hover:bg-[rgba(201,165,90,0.08)]"
                  }`}
                >
                  {isSel && (
                    <motion.div
                      layoutId="mini-cal-sel"
                      className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#c9a55a] to-[#b08d45]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{day}</span>
                  {dot && !isSel && (
                    <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" style={{ background: dot }} />
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
      {/* Events preview */}
      <div className="border-t border-[var(--border)] px-5 py-3 space-y-2">
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted)]">
          Événements — {selected} Avril
        </p>
        {[
          { time: "09h30", label: "Réunion équipe", color: "#7c6fcd" },
          { time: "14h00", label: "Appel client", color: "#c9a55a" },
        ].map((ev) => (
          <div key={ev.label} className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: ev.color }} />
            <span className="text-xs font-semibold text-[var(--ink)]">{ev.label}</span>
            <span className="ml-auto text-[0.65rem] text-[var(--muted)]">{ev.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────── */
export default function PlanningAgendaPage() {
  const [activePersona, setActivePersona] = useState(0);

  return (
    <main className="overflow-x-hidden bg-white">

      {/* ═══ HERO ══════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden px-4 pb-28 pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[rgba(201,165,90,0.07)] blur-[120px]" />
          <div className="absolute left-[-100px] bottom-0 h-[300px] w-[300px] rounded-full bg-[rgba(124,111,205,0.06)] blur-[80px]" />
          <div className="absolute right-[-60px] top-1/3 h-[250px] w-[250px] rounded-full bg-[rgba(52,211,153,0.04)] blur-[70px]" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_400px]">
            {/* Texte gauche */}
            <div>
              <FadeReveal delay={0.05}>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#c9a55a" }}>
                  <CalendarDays size={13} />
                  Planning & Agenda premium
                </div>
              </FadeReveal>

              <div className="mt-6">
                <MultiLineReveal
                  lines={["Organisez votre quotidien", "avec un planning", "intelligent."]}
                  highlight={2}
                  delay={0.1}
                  lineClassName="text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl"
                />
              </div>

              <FadeReveal delay={0.5} className="mt-6">
                <p className="max-w-xl text-base text-white/55 md:text-lg">
                  Planifiez vos journées, vos études, votre activité et vos rendez-vous
                  avec un outil simple, moderne et efficace.
                </p>
              </FadeReveal>

              {/* Stats */}
              <FadeReveal delay={0.65}>
                <div className="mt-8 flex flex-wrap gap-6">
                  {STATS.map(({ value, label }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-2xl font-extrabold" style={{ color: "#c9a55a" }}>{value}</span>
                      <span className="text-xs uppercase tracking-wider text-white/35">{label}</span>
                    </div>
                  ))}
                </div>
              </FadeReveal>

              <FadeReveal delay={0.8}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_24px_rgba(201,165,90,0.4)] transition-shadow hover:shadow-[0_8px_40px_rgba(201,165,90,0.55)]"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative flex items-center gap-2">
                      Commencer mon planning <ArrowRight size={15} />
                    </span>
                  </Link>
                  <Link
                    href="/contact?sujet=devis"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white/80 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Demander un devis
                  </Link>
                </div>
              </FadeReveal>
            </div>

            {/* Mini calendrier droite */}
            <FadeReveal delay={0.4} className="hidden lg:block">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <MiniCalendar />
              </motion.div>
            </FadeReveal>
          </div>
        </div>

        {/* Scroll cue */}
        <FadeReveal delay={1} className="mt-16 flex justify-center">
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5"
          >
            <ChevronDown size={16} className="text-white/40" />
          </motion.div>
        </FadeReveal>
      </section>

      {/* ═══ TABLEAU DE BORD ════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <FadeReveal className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.05)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#c9a55a" }}>
            <Inbox size={11} />
            Tableau de bord interactif
          </div>
        </FadeReveal>
        <FadeReveal delay={0.1} className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Tout votre quotidien,{" "}
            <span style={{ color: "#c9a55a" }}>en un seul endroit</span>
          </h2>
          <p className="mt-3 mx-auto max-w-xl text-sm text-[var(--muted)]">
            Date, heure, tâches, rendez-vous, priorités, objectifs, rappels, deadlines et notes
            — visualisez tout ce qui compte en temps réel.
          </p>
        </FadeReveal>
        <FadeReveal delay={0.2}>
          <PlanningDashboard />
        </FadeReveal>
      </section>

      {/* ═══ FONCTIONNALITÉS ════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <FadeReveal className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.05)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#c9a55a" }}>
            <Sparkles size={11} />
            Tout ce dont vous avez besoin
          </div>
        </FadeReveal>
        <FadeReveal delay={0.1} className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            12 fonctionnalités pour{" "}
            <span style={{ color: "#c9a55a" }}>tout organiser</span>
          </h2>
          <p className="mt-3 mx-auto max-w-xl text-sm text-[var(--muted)]">
            Un outil complet pensé pour les actifs, les étudiants et toute personne
            qui veut reprendre le contrôle de son temps.
          </p>
        </FadeReveal>

        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={cardReveal}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:border-[rgba(201,165,90,0.35)] hover:shadow-[0_10px_30px_rgba(201,165,90,0.1)]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)] transition-colors duration-300 group-hover:bg-[rgba(201,165,90,0.14)]">
                <Icon size={18} style={{ color: "#c9a55a" }} />
              </div>
              <h3 className="text-sm font-extrabold text-[var(--ink)]">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ GESTION DES HORAIRES ═══════════════════════════ */}
      <section className="bg-[#f9f7f4] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#c9a55a" }}>
              <Clock size={11} />
              Organisation par créneaux
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Votre journée,{" "}
              <span style={{ color: "#c9a55a" }}>heure par heure</span>
            </h2>
            <p className="mt-3 mx-auto max-w-xl text-sm text-[var(--muted)]">
              Divisez votre journée en blocs de temps intelligents. Matin, après-midi, soirée —
              chaque moment a une intention.
            </p>
          </FadeReveal>

          <div className="grid gap-6 md:grid-cols-3">
            {TIME_BLOCKS.map(({ period, icon: Icon, color, bg, border, slots }, i) => (
              <motion.div
                key={period}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.55, ease, delay: i * 0.1 }}
                className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
              >
                {/* Header période */}
                <div className="flex items-center gap-3 px-5 py-4" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${bg}`, border: `1px solid ${border}` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span className="text-sm font-extrabold" style={{ color }}>{period}</span>
                </div>

                {/* Créneaux */}
                <div className="divide-y divide-[var(--border)]">
                  {slots.map(({ time, label, tag, tagColor }) => (
                    <motion.div
                      key={time}
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--surface)]"
                    >
                      <span className="mt-0.5 w-10 shrink-0 text-[0.68rem] font-bold tabular-nums text-[var(--muted)]">{time}</span>
                      <div className="flex flex-1 items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--ink)]">{label}</span>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold" style={{ background: `${tagColor}18`, color: tagColor }}>
                          {tag}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Ajouter un créneau */}
                <div className="border-t border-dashed border-[var(--border)] px-5 py-3">
                  <button type="button" className="flex items-center gap-1.5 text-xs text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
                    <Circle size={10} />
                    Ajouter un créneau
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VUES DE L'OUTIL ════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <FadeReveal className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Toutes les vues dont{" "}
            <span style={{ color: "#c9a55a" }}>vous avez besoin</span>
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Passez d'une vue à l'autre selon votre contexte : focus du moment, planification de la semaine, bilan mensuel.
          </p>
        </FadeReveal>

        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {VIEWS.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              variants={cardReveal}
              whileHover={{ y: -4 }}
              className="group flex gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[rgba(201,165,90,0.35)] hover:shadow-[0_10px_30px_rgba(201,165,90,0.08)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)] transition-colors duration-300 group-hover:bg-[rgba(201,165,90,0.14)]">
                <Icon size={18} style={{ color: "#c9a55a" }} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[var(--ink)]">{label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ CAS D'USAGE ════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0f1117] py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-[rgba(201,165,90,0.05)] blur-[90px]" />
          <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-[rgba(124,111,205,0.05)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#c9a55a" }}>
              <Users size={12} />
              Pour tout le monde
            </div>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              Un outil adapté à{" "}
              <span style={{ color: "#c9a55a" }}>votre profil</span>
            </h2>
            <p className="mt-3 text-sm text-white/50 max-w-lg mx-auto">
              Que vous soyez entrepreneur, étudiant, parent ou professionnel — le planning s'adapte à votre réalité.
            </p>
          </FadeReveal>

          {/* Sélecteur persona */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {PERSONAS.map(({ label, icon: Icon, color }, i) => (
              <motion.button
                key={label}
                type="button"
                onClick={() => setActivePersona(i)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                  activePersona === i
                    ? "border-[rgba(201,165,90,0.5)] bg-[rgba(201,165,90,0.1)] text-white"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
              >
                <Icon size={13} style={{ color: activePersona === i ? color : undefined }} />
                {label}
              </motion.button>
            ))}
          </div>

          {/* Carte persona active */}
          <AnimatePresence mode="wait">
            {PERSONAS.map(({ label, icon: Icon, color, bg, border, features }, i) =>
              i === activePersona ? (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.3, ease }}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-sm"
                >
                  <div className="grid md:grid-cols-[auto_1fr]">
                    {/* Icône côté gauche */}
                    <div className="flex flex-col items-center justify-center gap-3 border-b border-white/10 p-10 md:border-b-0 md:border-r">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border" style={{ background: bg, borderColor: border }}>
                        <Icon size={36} style={{ color }} />
                      </div>
                      <span className="text-base font-extrabold text-white">{label}</span>
                      <span className="text-xs text-white/40">Profil sélectionné</span>
                    </div>

                    {/* Features droite */}
                    <div className="p-8">
                      <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">
                        Ce que le planning apporte à cet profil
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {features.map((f) => (
                          <div key={f} className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color }} />
                            <span className="text-sm text-[#e5e7eb]">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══ BÉNÉFICES ══════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <FadeReveal className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Ce que vous allez gagner
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Un planning bien construit, c'est moins de stress, plus de clarté, et un quotidien qui ressemble à ce que vous voulez vraiment.
          </p>
        </FadeReveal>

        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {BENEFITS.map(({ icon: Icon, text }) => (
            <motion.div
              key={text}
              variants={cardReveal}
              whileHover={{ scale: 1.02, y: -3 }}
              className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[rgba(201,165,90,0.4)] hover:shadow-[0_8px_28px_rgba(201,165,90,0.1)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)] transition-colors group-hover:bg-[rgba(201,165,90,0.14)]">
                <Icon size={18} style={{ color: "#c9a55a" }} />
              </div>
              <span className="text-sm font-semibold text-[var(--ink)]">{text}</span>
              <CheckCircle2 size={14} className="ml-auto shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ color: "#c9a55a" }} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ CTA FINAL ══════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <FadeReveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#0f1117] p-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(201,165,90,0.07)] blur-[90px]" />
            </div>
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#c9a55a" }}>
                <CalendarDays size={11} />
                Prêt à vous organiser&nbsp;?
              </div>
              <h2 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">
                Commencez à planifier maintenant.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm text-white/50">
                Reprenez le contrôle de votre temps. Un planning sur mesure, conçu avec vous, livré rapidement.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-8 py-4 text-sm font-extrabold text-black shadow-[0_4px_24px_rgba(201,165,90,0.4)] transition-shadow hover:shadow-[0_8px_40px_rgba(201,165,90,0.55)]"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center gap-2">
                    <CalendarDays size={15} />
                    Commencer mon planning
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
                <Link
                  href="/contact?sujet=devis"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold text-white/80 transition-all hover:bg-white/10 hover:text-white"
                >
                  Demander un devis
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
                {["Sur mesure","Livraison rapide","Support inclus"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-white/35">
                    <CheckCircle2 size={11} style={{ color: "#c9a55a" }} /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeReveal>
      </section>

    </main>
  );
}
