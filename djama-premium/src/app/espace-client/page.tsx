"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  FileText,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  LayoutDashboard,
  CreditCard,
  Clock,
  Download,
  Eye,
  Image as ImageIcon,
  Bell,
  ListChecks,
  Target,
  ChevronRight,
  Star,
  Lock,
  Wallet,
  UserCheck,
  Settings,
  Play,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Données ────────────────────────────────────── */

const FEATURES = [
  {
    icon: FileText,
    title: "Factures & Devis",
    desc: "Créez des documents professionnels en quelques clics. PDF propre, logo inclus.",
    color: "#c9a55a",
    glow: "rgba(201,165,90,0.18)",
    bg: "from-[#1a1200] via-[#2a1c00] to-[#1e1500]",
  },
  {
    icon: CalendarDays,
    title: "Planning / Agenda",
    desc: "Organisez vos journées, vos rendez-vous et vos priorités depuis un espace unifié.",
    color: "#7c6fcd",
    glow: "rgba(124,111,205,0.2)",
    bg: "from-[#0d0d1a] via-[#111132] to-[#1a1040]",
  },
  {
    icon: LayoutDashboard,
    title: "Tableau de bord",
    desc: "Une vue d'ensemble claire de votre activité, vos tâches et vos outils.",
    color: "#34d399",
    glow: "rgba(52,211,153,0.18)",
    bg: "from-[#001a14] via-[#002a20] to-[#001e18]",
  },
  {
    icon: Zap,
    title: "Accès rapide",
    desc: "Tous vos outils accessibles en un clic, sans perdre de temps.",
    color: "#f9a826",
    glow: "rgba(249,168,38,0.18)",
    bg: "from-[#1a1000] via-[#2a1800] to-[#1e1400]",
  },
  {
    icon: Shield,
    title: "Interface sécurisée",
    desc: "Vos données sont protégées. Accès personnel, espace privé et sécurisé.",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.18)",
    bg: "from-[#0a0f1a] via-[#0d1530] to-[#0a1020]",
  },
];

const FACTURE_POINTS = [
  { icon: Zap,       label: "Création rapide en moins de 2 minutes" },
  { icon: Download,  label: "Export PDF propre et professionnel" },
  { icon: Eye,       label: "Aperçu direct avant téléchargement" },
  { icon: ImageIcon, label: "Logo personnalisé et infos société" },
  { icon: Settings,  label: "Templates réutilisables" },
  { icon: FileText,  label: "Numérotation automatique" },
];

const PLANNING_POINTS = [
  { icon: CalendarDays, label: "Vue jour, semaine et mois" },
  { icon: Bell,         label: "Rappels et notifications" },
  { icon: ListChecks,   label: "Gestion des tâches et priorités" },
  { icon: Target,       label: "Suivi des objectifs" },
  { icon: Clock,        label: "Plages horaires personnalisables" },
  { icon: CheckCircle2, label: "Agenda simple et clair" },
];

const STEPS = [
  {
    num: "01",
    title: "Je m'abonne",
    desc: "Je clique sur le bouton et choisis mon abonnement.",
    icon: UserCheck,
    color: "#c9a55a",
  },
  {
    num: "02",
    title: "Je paie 11,90€",
    desc: "Paiement sécurisé via PayPal ou carte bancaire.",
    icon: CreditCard,
    color: "#7c6fcd",
  },
  {
    num: "03",
    title: "J'accède à mon espace",
    desc: "Accès immédiat à l'espace client après confirmation.",
    icon: Lock,
    color: "#34d399",
  },
  {
    num: "04",
    title: "J'utilise mes outils",
    desc: "Factures, planning, tableau de bord — tout est là.",
    icon: Play,
    color: "#f9a826",
  },
];

const INCLUS = [
  "Accès immédiat après paiement",
  "Générateur de factures et devis",
  "Planning / agenda complet",
  "Tableau de bord personnalisé",
  "Interface moderne et intuitive",
  "Outils disponibles en permanence",
  "Utilisation simple et rapide",
  "Espace client personnel et sécurisé",
];

/* ─── Composants ─────────────────────────────────── */

function FeatureCard({ feat, index }: { feat: typeof FEATURES[0]; index: number }) {
  const Icon = feat.icon;
  return (
    <motion.div
      variants={cardReveal}
      custom={index}
      className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(9,9,11,0.05)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_56px_rgba(9,9,11,0.12)] hover:border-[rgba(201,165,90,0.2)]"
    >
      {/* Visuel haut */}
      <div className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${feat.bg}`}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full blur-2xl" style={{ background: feat.glow }} />
        </div>
        <div
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{
            background: feat.glow,
            borderColor: `${feat.color}30`,
            boxShadow: `0 0 24px ${feat.glow}`,
          }}
        >
          <Icon size={28} style={{ color: feat.color }} />
        </div>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-base font-extrabold text-[var(--ink)]">{feat.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{feat.desc}</p>
      </div>

      {/* Barre bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-[2px] scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, transparent, ${feat.color}, transparent)` }}
      />
    </motion.div>
  );
}

function ToolPoint({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <motion.li
      variants={cardReveal}
      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 shadow-[0_1px_4px_rgba(9,9,11,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(201,165,90,0.2)] hover:shadow-[0_6px_20px_rgba(9,9,11,0.08)]"
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: `rgba(${color === "#c9a55a" ? "201,165,90" : "124,111,205"},0.1)` }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
    </motion.li>
  );
}

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const Icon = step.icon;
  return (
    <motion.div
      variants={cardReveal}
      custom={index}
      className="relative flex flex-col items-center text-center"
    >
      {/* Connecteur */}
      {index < STEPS.length - 1 && (
        <div className="absolute left-[calc(50%+3rem)] top-10 hidden h-px w-[calc(100%-6rem)] xl:block"
          style={{ background: `linear-gradient(90deg, ${step.color}60, ${STEPS[index + 1].color}60)` }}
        />
      )}

      {/* Numéro + icône */}
      <div className="relative mb-5">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl border"
          style={{
            background: `rgba(${step.color === "#c9a55a" ? "201,165,90" : step.color === "#7c6fcd" ? "124,111,205" : step.color === "#34d399" ? "52,211,153" : "249,168,38"},0.1)`,
            borderColor: `${step.color}30`,
            boxShadow: `0 0 24px ${step.color}20`,
          }}
        >
          <Icon size={32} style={{ color: step.color }} />
        </div>
        <span
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[0.6rem] font-black"
          style={{ background: step.color, color: "#09090b" }}
        >
          {step.num}
        </span>
      </div>

      <h3 className="text-base font-extrabold text-[var(--ink)]">{step.title}</h3>
      <p className="mt-1.5 max-w-[160px] text-xs leading-relaxed text-[var(--muted)]">{step.desc}</p>
    </motion.div>
  );
}

/* ─── Compteur animé ─────────────────────────────── */
function AnimatedPrice() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <span ref={ref} className="tabular-nums">
      {inView ? "11,90" : "0,00"}
    </span>
  );
}

/* ─── PAGE ───────────────────────────────────────── */
export default function EspaceClientPage() {
  const [hoveredTool, setHoveredTool] = useState<"facture" | "planning" | null>(null);

  return (
    <div className="bg-white">

      {/* ══ HERO ══════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-32 pt-36">
        {/* Glows */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[600px] w-[700px] rounded-full bg-[rgba(176,141,87,0.12)] blur-[120px]" />
        </div>
        <div className="pointer-events-none absolute left-[-80px] top-[30%] h-[300px] w-[300px] rounded-full bg-[rgba(124,111,205,0.07)] blur-[80px]" />
        <div className="pointer-events-none absolute right-[-80px] top-[20%] h-[300px] w-[300px] rounded-full bg-[rgba(52,211,153,0.05)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(176,141,87,0.3)] bg-[rgba(176,141,87,0.1)] px-5 py-2 text-xs font-bold uppercase tracking-widest text-[#c9a55a]"
          >
            <Sparkles size={11} />
            Espace Client DJAMA — 11,90€ / mois
            <span className="ml-1 flex h-2 w-2 rounded-full bg-[#c9a55a]">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#c9a55a] opacity-75" />
            </span>
          </motion.div>

          {/* Titre */}
          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Accédez à vos", "outils pro pour", "11,90€ / mois."]}
              highlight={2}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          {/* Sous-titre */}
          <FadeReveal delay={0.65} as="p" className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/60">
            Gérez votre activité simplement avec un espace client moderne comprenant
            votre planning, vos factures, vos devis et bien plus.
          </FadeReveal>

          {/* CTA */}
          <FadeReveal delay={0.8} className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="#paiement" className="btn-primary text-base">
              <Wallet size={17} />
              S&apos;abonner maintenant
            </Link>
            <Link href="#outils" className="btn-ghost text-base">
              Voir les outils <ArrowRight size={16} />
            </Link>
          </FadeReveal>

          {/* Prix mis en avant */}
          <FadeReveal delay={1.0} className="mt-14 flex flex-wrap justify-center gap-6">
            {[
              { value: "11,90€", label: "par mois, sans engagement" },
              { value: "Accès", label: "immédiat après paiement" },
              { value: "5 outils", label: "inclus dans l'abonnement" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center border-r border-white/10 pr-6 last:border-0 last:pr-0">
                <span className="text-2xl font-black text-white">{value}</span>
                <span className="mt-0.5 text-xs text-white/40">{label}</span>
              </div>
            ))}
          </FadeReveal>
        </div>

        {/* Preview card flottante */}
        <FadeReveal delay={1.1} className="relative z-10 mx-auto mt-14 max-w-sm px-6">
          <div className="glass-card overflow-hidden rounded-[1.5rem] p-5 shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
            {/* Top bar */}
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-2 text-[0.6rem] text-white/30">Espace Client DJAMA</span>
            </div>
            {/* Faux dashboard */}
            <div className="mb-3 flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <LayoutDashboard size={13} className="text-[#c9a55a]" />
                <span className="text-xs font-semibold text-white/80">Tableau de bord</span>
              </div>
              <span className="rounded-full bg-[rgba(201,165,90,0.2)] px-2 py-0.5 text-[0.6rem] font-bold text-[#c9a55a]">Actif</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: FileText, label: "Factures", val: "12", color: "#c9a55a" },
                { icon: CalendarDays, label: "RDV ce mois", val: "8", color: "#7c6fcd" },
                { icon: CheckCircle2, label: "Tâches", val: "5/7", color: "#34d399" },
                { icon: Zap, label: "Devis", val: "3", color: "#f9a826" },
              ].map(({ icon: Icon, label, val, color }) => (
                <div key={label} className="rounded-xl bg-white/[0.05] p-2.5">
                  <Icon size={11} style={{ color }} />
                  <p className="mt-1 text-[0.6rem] text-white/40">{label}</p>
                  <p className="text-sm font-extrabold text-white">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeReveal>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══ CE QUI EST INCLUS ══════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, ease }}
          className="mb-14 text-center"
        >
          <span className="badge badge-gold-light mb-4">
            <Sparkles size={10} /> Ce qui est inclus
          </span>
          <h2 className="display-section text-[var(--ink)]">
            Tout ce dont vous avez besoin,{" "}
            <span className="text-gold">en un seul endroit.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[var(--muted)]">
            Un abonnement simple, une interface moderne, cinq outils essentiels
            pour gérer votre activité au quotidien.
          </p>
        </motion.div>

        {/* Grille de cartes */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainerFast}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {FEATURES.map((feat, i) => (
            <FeatureCard key={feat.title} feat={feat} index={i} />
          ))}
        </motion.div>
      </section>

      {/* ══ ABONNEMENT ══════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[var(--surface)] py-24">
        {/* Background deco */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
          <div className="h-[600px] w-[600px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Gauche — texte */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.8, ease }}
            >
              <span className="badge badge-gold-light mb-5">
                <Star size={10} /> Abonnement
              </span>
              <h2 className="display-section text-[var(--ink)]">
                Un prix fixe.{" "}
                <span className="text-gold">Zéro surprise.</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[var(--muted)]">
                Un abonnement simple pour accéder à vos outils essentiels et gérer
                votre activité plus facilement. Pas de devis, pas d&apos;attente —
                vous payez et vous accédez.
              </p>

              <ul className="mt-8 space-y-3">
                {INCLUS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[var(--ink)]">
                    <CheckCircle2 size={16} className="flex-shrink-0 text-[#c9a55a]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Droite — carte prix */}
            <motion.div
              initial={{ opacity: 0, x: 32, scale: 0.97 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={viewport}
              transition={{ duration: 0.8, ease, delay: 0.15 }}
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.3)] bg-[var(--ink)] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.2)]">
                {/* Glow */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-[300px] w-[300px] rounded-full bg-[rgba(176,141,87,0.12)] blur-[80px]" />
                </div>

                <div className="relative">
                  {/* Badge offre */}
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
                    <Sparkles size={9} /> Espace Client DJAMA
                  </div>

                  {/* Prix */}
                  <div className="mb-1 flex items-end gap-2">
                    <span className="text-6xl font-black text-white">
                      <AnimatedPrice />
                    </span>
                    <div className="mb-2 flex flex-col">
                      <span className="text-2xl font-black text-white">€</span>
                      <span className="text-xs text-white/40">/ mois</span>
                    </div>
                  </div>
                  <p className="mb-6 text-sm text-white/40">Sans engagement · Résiliable à tout moment</p>

                  <div className="divider-gold mb-6" />

                  {/* Points clés */}
                  <ul className="mb-8 space-y-2.5">
                    {[
                      "Générateur de factures & devis",
                      "Planning / agenda complet",
                      "Tableau de bord unifié",
                      "Accès immédiat après paiement",
                      "Interface moderne et intuitive",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-[#e5e7eb]">
                        <CheckCircle2 size={14} style={{ color: "#c9a55a", flexShrink: 0 }} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href="#paiement" className="btn-primary w-full justify-center text-base">
                    <Wallet size={17} />
                    S&apos;abonner pour 11,90€
                  </Link>
                  <p className="mt-3 text-center text-xs text-white/30">
                    Paiement sécurisé · Accès instantané
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ OUTILS INCLUS ═══════════════════════════════ */}
      <section id="outils" className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, ease }}
          className="mb-16 text-center"
        >
          <span className="badge badge-gold-light mb-4">
            <Zap size={10} /> Outils inclus
          </span>
          <h2 className="display-section text-[var(--ink)]">
            Deux outils puissants,{" "}
            <span className="text-gold">toujours disponibles.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[var(--muted)]">
            Conçus pour les indépendants et entrepreneurs qui veulent gagner du temps
            sans sacrifier la qualité.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Factures & Devis */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease }}
            onMouseEnter={() => setHoveredTool("facture")}
            onMouseLeave={() => setHoveredTool(null)}
            className="group overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-[0_2px_12px_rgba(9,9,11,0.06)] transition-all duration-500 hover:-translate-y-2 hover:border-[rgba(201,165,90,0.25)] hover:shadow-[0_28px_60px_rgba(9,9,11,0.1)]"
          >
            {/* Header visuel */}
            <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a1200] via-[#2a1c00] to-[#1e1500]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-36 w-36 rounded-full bg-[rgba(201,165,90,0.2)] blur-3xl" />
              </div>
              {/* Faux aperçu facture */}
              <motion.div
                animate={{ y: hoveredTool === "facture" ? -4 : 0, rotate: hoveredTool === "facture" ? -1 : 0 }}
                transition={{ duration: 0.4, ease }}
                className="relative z-10 w-40 overflow-hidden rounded-xl border border-[rgba(201,165,90,0.2)] bg-white/[0.08] p-3 shadow-xl backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-2 w-12 rounded bg-[rgba(201,165,90,0.5)]" />
                  <span className="text-[0.5rem] font-bold text-[#c9a55a]">FACTURE</span>
                </div>
                <div className="mb-1 h-1.5 w-full rounded bg-white/10" />
                <div className="mb-1 h-1.5 w-3/4 rounded bg-white/10" />
                <div className="mb-3 h-1.5 w-5/6 rounded bg-white/10" />
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span className="text-[0.45rem] text-white/40">Total</span>
                  <span className="text-[0.55rem] font-bold text-[#c9a55a]">1 250,00 €</span>
                </div>
              </motion.div>
            </div>

            <div className="p-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.1)]">
                  <FileText size={20} style={{ color: "#c9a55a" }} />
                </div>
                <h3 className="text-xl font-extrabold text-[var(--ink)]">Factures & Devis</h3>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
                Créez des factures et devis professionnels en moins de 2 minutes.
                Export PDF immédiat, logo intégré, numérotation automatique.
              </p>
              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={staggerContainerFast}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {FACTURE_POINTS.map((p) => (
                  <ToolPoint key={p.label} icon={p.icon} label={p.label} color="#c9a55a" />
                ))}
              </motion.ul>
            </div>
          </motion.div>

          {/* Planning / Agenda */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            onMouseEnter={() => setHoveredTool("planning")}
            onMouseLeave={() => setHoveredTool(null)}
            className="group overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-[0_2px_12px_rgba(9,9,11,0.06)] transition-all duration-500 hover:-translate-y-2 hover:border-[rgba(124,111,205,0.25)] hover:shadow-[0_28px_60px_rgba(9,9,11,0.1)]"
          >
            {/* Header visuel */}
            <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-[#0d0d1a] via-[#111132] to-[#1a1040]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-36 w-36 rounded-full bg-[rgba(124,111,205,0.2)] blur-3xl" />
              </div>
              {/* Faux mini agenda */}
              <motion.div
                animate={{ y: hoveredTool === "planning" ? -4 : 0, rotate: hoveredTool === "planning" ? 1 : 0 }}
                transition={{ duration: 0.4, ease }}
                className="relative z-10 w-44 overflow-hidden rounded-xl border border-[rgba(124,111,205,0.25)] bg-white/[0.08] p-3 backdrop-blur-sm shadow-xl"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.55rem] font-bold text-white/70">Mars 2026</span>
                  <CalendarDays size={9} style={{ color: "#7c6fcd" }} />
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {["L","M","M","J","V","S","D"].map((d) => (
                    <span key={d} className="text-[0.4rem] text-white/30">{d}</span>
                  ))}
                  {[null,null,null,null,null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map((d, i) => (
                    <div
                      key={i}
                      className={`flex h-4 w-full items-center justify-center rounded text-[0.4rem] font-semibold
                        ${d === 30 ? "bg-[rgba(124,111,205,0.8)] text-white" : d ? "text-white/60" : ""}`}
                    >
                      {d ?? ""}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="p-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(124,111,205,0.1)]">
                  <CalendarDays size={20} style={{ color: "#7c6fcd" }} />
                </div>
                <h3 className="text-xl font-extrabold text-[var(--ink)]">Planning / Agenda</h3>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
                Organisez votre quotidien, suivez vos priorités et ne manquez aucun
                rendez-vous. Simple, clair, efficace.
              </p>
              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={staggerContainerFast}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {PLANNING_POINTS.map((p) => (
                  <ToolPoint key={p.label} icon={p.icon} label={p.label} color="#7c6fcd" />
                ))}
              </motion.ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ COMMENT ÇA MARCHE ═══════════════════════════ */}
      <section className="relative overflow-hidden bg-[var(--surface)] py-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
          <div className="h-[500px] w-[800px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease }}
            className="mb-16 text-center"
          >
            <span className="badge badge-gold-light mb-4">
              <ChevronRight size={10} /> Comment ça marche
            </span>
            <h2 className="display-section text-[var(--ink)]">
              4 étapes,{" "}
              <span className="text-gold">et c&apos;est parti.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[var(--muted)]">
              Pas de formulaire complexe, pas de délai. Vous vous abonnez,
              vous payez, vous accédez.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid grid-cols-2 gap-10 xl:grid-cols-4"
          >
            {STEPS.map((step, i) => (
              <StepCard key={step.num} step={step} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ PAIEMENT ════════════════════════════════════ */}
      <section id="paiement" className="mx-auto max-w-3xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.8, ease }}
          className="overflow-hidden rounded-[2.5rem] border border-[rgba(201,165,90,0.25)] bg-[var(--ink)] shadow-[0_40px_100px_rgba(0,0,0,0.25)]"
        >
          {/* Glow interne */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[400px] w-[500px] rounded-full bg-[rgba(176,141,87,0.1)] blur-[100px]" />
          </div>

          {/* Barre top dorée */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />

          <div className="relative px-8 py-10 text-center md:px-14">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
              <Lock size={9} /> Paiement sécurisé
            </div>

            {/* Prix principal */}
            <div className="mb-2 flex items-end justify-center gap-2">
              <span className="text-7xl font-black text-white">11</span>
              <div className="mb-3 text-left">
                <span className="text-3xl font-black text-white">,90€</span>
                <p className="text-xs text-white/40">/ mois</p>
              </div>
            </div>
            <p className="mb-8 text-sm text-white/40">Sans engagement · Résiliable à tout moment</p>

            {/* Points inclus */}
            <div className="mb-10 grid grid-cols-2 gap-3 text-left md:grid-cols-3">
              {[
                "Factures & devis",
                "Planning / agenda",
                "Tableau de bord",
                "Accès immédiat",
                "Interface moderne",
                "Outils clients",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-[#e5e7eb]">
                  <CheckCircle2 size={13} style={{ color: "#c9a55a", flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>

            <div className="divider-gold mb-8" />

            {/* Boutons paiement */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {/* Bouton PayPal */}
              <a
                href="https://www.paypal.com/paypalme/djamapremium/11.90"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-[1rem] border border-[rgba(255,196,57,0.4)] bg-[#FFD140] px-7 py-4 font-bold text-[#09090b] shadow-[0_0_24px_rgba(255,209,64,0.25)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,209,64,0.4)] hover:brightness-105"
              >
                {/* Logo PayPal text */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" fill="#003087"/>
                </svg>
                Payer via PayPal
              </a>

              {/* Bouton principal — S'abonner */}
              <Link
                href="/contact?sujet=abonnement-espace-client"
                className="btn-primary px-8 py-4 text-base"
              >
                <CreditCard size={17} />
                S&apos;abonner pour 11,90€
                <ArrowRight size={15} />
              </Link>
            </div>

            <p className="mt-5 text-xs text-white/25">
              Après paiement, vos identifiants de connexion vous sont envoyés par email.
            </p>

            {/* Badges de confiance */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-white/8 pt-7">
              {[
                { icon: Shield, label: "Paiement sécurisé" },
                { icon: Zap,    label: "Accès immédiat" },
                { icon: Lock,   label: "Données protégées" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-white/35">
                  <Icon size={12} style={{ color: "#c9a55a" }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══ ACCÈS CLIENT ════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[var(--surface)] py-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
          <div className="h-[400px] w-[600px] rounded-full bg-[rgba(201,165,90,0.08)] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease }}
            className="mb-12 text-center"
          >
            <span className="badge badge-gold-light mb-4">
              <UserCheck size={10} /> Espace client
            </span>
            <h2 className="display-section text-[var(--ink)]">
              Votre espace vous{" "}
              <span className="text-gold">attend.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[var(--muted)]">
              Une fois abonné, accédez à votre tableau de bord personnel depuis
              n&apos;importe quel appareil, à tout moment.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-6 sm:grid-cols-3"
          >
            {[
              {
                icon: LayoutDashboard,
                title: "Tableau de bord",
                desc: "Vue d'ensemble de toute votre activité au même endroit.",
                href: "/client",
                color: "#c9a55a",
              },
              {
                icon: FileText,
                title: "Factures & Devis",
                desc: "Créez, gérez et exportez vos documents en quelques clics.",
                href: "/client/factures",
                color: "#7c6fcd",
              },
              {
                icon: CalendarDays,
                title: "Planning",
                desc: "Organisez vos journées et suivez vos priorités simplement.",
                href: "/planning-agenda",
                color: "#34d399",
              },
            ].map(({ icon: Icon, title, desc, href, color }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_2px_8px_rgba(9,9,11,0.05)] transition-all duration-500 hover:-translate-y-2 hover:border-[rgba(201,165,90,0.2)] hover:shadow-[0_20px_48px_rgba(9,9,11,0.1)]"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="mb-2 text-base font-extrabold text-[var(--ink)]">{title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                <Link
                  href={href}
                  className="inline-flex items-center gap-1.5 text-sm font-bold transition-all duration-300 group-hover:gap-3"
                  style={{ color }}
                >
                  Accéder <ArrowRight size={13} />
                </Link>

                <div
                  className="absolute inset-x-0 bottom-0 h-[2px] scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* CTA connexion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease, delay: 0.3 }}
            className="mt-10 text-center"
          >
            <p className="mb-4 text-sm text-[var(--muted)]">Déjà abonné ?</p>
            <Link
              href="/login"
              className="btn-light inline-flex items-center gap-2"
            >
              <Lock size={15} /> Se connecter à mon espace
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA FINAL ═══════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 pb-28 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.8, ease }}
          className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(201,165,90,0.2)] bg-[var(--ink)] px-10 py-16 text-center shadow-[0_32px_80px_rgba(0,0,0,0.18)]"
        >
          {/* Glows */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[350px] w-[500px] rounded-full bg-[rgba(176,141,87,0.1)] blur-[100px]" />
          </div>
          <div className="pointer-events-none absolute left-1/4 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-[rgba(201,165,90,0.4)] to-transparent" />

          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
              <Sparkles size={9} /> Prêt à démarrer ?
            </div>

            <h2 className="display-section text-white">
              Rejoignez l&apos;Espace{" "}
              <span className="text-gold">Client DJAMA.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-lg text-base text-white/50">
              11,90€ par mois. Accès immédiat. Tous vos outils en un seul endroit.
              Pas de devis, pas d&apos;attente — vous payez et vous accédez.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="#paiement" className="btn-primary px-8 py-4 text-base">
                <Wallet size={17} />
                S&apos;abonner maintenant — 11,90€
              </Link>
              <Link href="/contact" className="btn-ghost px-8 py-4 text-base">
                Une question ? <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-white/30">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-[#c9a55a]" /> Sans engagement</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-[#c9a55a]" /> Accès instantané</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-[#c9a55a]" /> Résiliable à tout moment</span>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
