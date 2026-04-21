"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, ChevronDown,
  Zap, Clock, Shield, Star, TrendingUp, BadgeCheck,
  FileText, ClipboardList, BookOpen, Search, UserCheck,
  Briefcase, ShoppingBag, Camera, Wrench, Users, User,
  Building2, MessageSquare, Phone, Mail,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Palette or / amber / brun — accompagnement premium ── */
const G  = "#f59e0b";
const GR = "245,158,11";
const G2 = "#d97706";
const G2R= "217,119,6";
const C  = "#c9a55a";
const CR = "201,165,90";

/* ═══════════════════════════════ DATA ═══════════════════════════════════════ */

const INCLUS = [
  { icon: Search,        c: G,         r: GR,            title: "Aide au choix de l'activité",      desc: "On identifie ensemble votre activité principale, le bon code APE/NAF et le régime fiscal adapté à votre situation." },
  { icon: ClipboardList, c: G2,        r: G2R,           title: "Accompagnement à l'inscription",   desc: "On vous guide étape par étape sur la plateforme officielle pour déclarer votre activité sans erreur." },
  { icon: FileText,      c: "#60a5fa", r: "96,165,250",  title: "Préparation du dossier",           desc: "Vérification de toutes vos informations — identité, adresse, activité, régime fiscal — avant soumission." },
  { icon: CheckCircle2,  c: "#4ade80", r: "74,222,128",  title: "Vérification des informations",    desc: "On contrôle chaque champ avant envoi pour éviter les erreurs, les rejets et les délais inutiles." },
  { icon: BookOpen,      c: G,         r: GR,            title: "Conseils sur les documents",       desc: "Pièces d'identité, justificatif de domicile, attestation d'assurance — on vous dit exactement ce qu'il faut." },
  { icon: Rocket,        c: G2,        r: G2R,           title: "Accompagnement au démarrage",      desc: "Une fois créé, on vous explique les premières obligations : déclarations URSSAF, émission de factures, plafonds." },
  { icon: Building2,     c: "#f472b6", r: "244,114,182", title: "Orientation administrative",       desc: "On répond à vos questions sur la domiciliation, l'assurance professionnelle, l'ouverture d'un compte dédié." },
  { icon: MessageSquare, c: "#4ade80", r: "74,222,128",  title: "Support en cas de blocage",        desc: "Vous êtes bloqué sur une étape ? On répond dans les 24h pour débloquer la situation et vous remettre sur les rails." },
];

const POUR_QUI = [
  { icon: Briefcase,  c: G,         r: GR,            who: "Freelances",                  desc: "Développeur, graphiste, rédacteur, consultant — lancez votre activité indépendante en toute légalité.",  tags: ["Services", "Facturation", "B2B"] },
  { icon: Camera,     c: G2,        r: G2R,           who: "Créateurs de contenu",        desc: "Photographe, vidéaste, monteur, illustrateur — professionnalisez votre passion avec le bon statut.",     tags: ["Créatif", "Instagram", "YouTube"] },
  { icon: ShoppingBag,c: "#60a5fa", r: "96,165,250",  who: "Commerçants",                 desc: "Vente en ligne, brocante, artisanat — le statut auto-entrepreneur est idéal pour vendre légalement.",      tags: ["Vente", "E-commerce", "Artisanat"] },
  { icon: UserCheck,  c: "#4ade80", r: "74,222,128",  who: "Prestataires de services",    desc: "Nettoyage, jardinage, informatique, coaching — facturer vos prestations en toute légalité.",              tags: ["Prestations", "Domicile", "B2C"] },
  { icon: Users,      c: G,         r: GR,            who: "Consultants & coachs",        desc: "Consulting, coaching, formation, conseil — cadrez votre expertise sous un statut clair et reconnu.",       tags: ["Conseil", "Formation", "Expertise"] },
  { icon: Wrench,     c: G2,        r: G2R,           who: "Artisans & techniciens",      desc: "Plombier, électricien, menuisier, informaticien — exercez en indépendant avec le statut adapté.",         tags: ["Artisanat", "Dépannage", "Réparation"] },
  { icon: Star,       c: "#f472b6", r: "244,114,182", who: "Activité secondaire",         desc: "Vous avez un CDI et souhaitez monétiser une passion ou une compétence ? C'est tout à fait possible.",    tags: ["Side project", "Complément", "Passion"] },
];

const ETAPES = [
  { num: "01", icon: MessageSquare, c: C,         r: CR,           title: "Échange sur votre projet",     desc: "On discute ensemble de votre activité, vos objectifs et votre situation pour vous orienter au mieux." },
  { num: "02", icon: ClipboardList, c: G,         r: GR,           title: "Collecte des informations",    desc: "Vous nous fournissez vos informations personnelles et les détails de votre activité à déclarer." },
  { num: "03", icon: FileText,      c: G2,        r: G2R,          title: "Préparation du dossier",       desc: "On vérifie et organise toutes les informations avant de procéder à la déclaration officielle." },
  { num: "04", icon: Rocket,        c: "#60a5fa", r: "96,165,250", title: "Accompagnement à la création", desc: "On vous guide en direct sur le site officiel pour effectuer votre déclaration d'activité sans erreur." },
  { num: "05", icon: CheckCircle2,  c: "#4ade80", r: "74,222,128", title: "Validation & confirmation",    desc: "Vous recevez votre numéro SIRET et votre extrait K-bis — votre activité est officiellement créée." },
  { num: "06", icon: TrendingUp,    c: G,         r: GR,           title: "Conseils pour bien démarrer", desc: "On vous brieffe sur les premières démarches : première facture, déclaration URSSAF, outils recommandés." },
];

const RASSURANCE = [
  { icon: Clock,     c: G,         r: GR,            title: "Rapide",       desc: "La création prend quelques jours. On optimise chaque étape pour aller le plus vite possible." },
  { icon: Zap,       c: G2,        r: G2R,           title: "Simple",       desc: "On traduit chaque formulaire administratif en langage clair. Pas de jargon, pas de confusion." },
  { icon: Shield,    c: "#60a5fa", r: "96,165,250",  title: "Guidé",        desc: "Vous n'êtes jamais seul. On est là à chaque étape pour répondre à vos questions et vous orienter." },
  { icon: Star,      c: "#4ade80", r: "74,222,128",  title: "Sans stress",  desc: "On gère la complexité à votre place. Vous vous concentrez sur votre projet, on s'occupe des formalités." },
  { icon: UserCheck, c: G,         r: GR,            title: "Personnalisé", desc: "Chaque accompagnement est adapté à votre profil, votre activité et vos contraintes spécifiques." },
];

const PREPARER = [
  { icon: User,      c: G,  r: GR,   label: "Pièce d'identité valide",          detail: "CNI ou passeport en cours de validité" },
  { icon: Building2, c: G2, r: G2R,  label: "Justificatif de domicile",          detail: "Facture EDF, quittance loyer < 3 mois" },
  { icon: Phone,     c: G,  r: GR,   label: "Numéro de téléphone",              detail: "Pour recevoir les codes de confirmation" },
  { icon: Mail,      c: G2, r: G2R,  label: "Adresse email",                    detail: "Pour recevoir vos identifiants auto-entrepreneur" },
  { icon: FileText,  c: G,  r: GR,   label: "Description de l'activité",        detail: "Ce que vous comptez faire / vendre / proposer" },
  { icon: TrendingUp,c: G2, r: G2R,  label: "Estimation du chiffre d'affaires", detail: "Ordre de grandeur pour choisir le bon régime" },
];

const APRES_CREATION = [
  { num: "1", c: GR,            title: "Numéro SIRET reçu",         desc: "Votre numéro d'identification légal — à indiquer sur toutes vos factures." },
  { num: "2", c: G2R,           title: "Première facture",          desc: "On vous explique comment rédiger une facture conforme aux obligations légales." },
  { num: "3", c: "96,165,250",  title: "Déclaration URSSAF",        desc: "Chaque mois ou trimestre, déclarez votre CA sur autoentrepreneur.urssaf.fr." },
  { num: "4", c: "74,222,128",  title: "Compte bancaire dédié",     desc: "Recommandé dès 10 000€ de CA : séparez finances personnelles et professionnelles." },
  { num: "5", c: GR,            title: "Assurance professionnelle", desc: "Selon votre activité, une RC Pro peut être obligatoire — on vous conseille." },
];

const FAQ_ITEMS = [
  { q: "Combien de temps prend la création ?",                    a: "La déclaration en ligne sur le site officiel prend environ 15 à 30 minutes. L'attribution du numéro SIRET intervient dans les 24 à 48h ouvrées suivantes. Avec notre accompagnement, vous bénéficiez d'un parcours fluide sans perte de temps." },
  { q: "Quels documents faut-il préparer ?",                      a: "Vous aurez besoin d'une pièce d'identité valide, d'un justificatif de domicile de moins de 3 mois, d'un numéro de téléphone et d'une adresse email. Pour les activités réglementées (artisanat, profession libérale), des justificatifs de qualification peuvent être demandés." },
  { q: "Est-ce adapté à mon activité ?",                          a: "Le statut auto-entrepreneur convient à la grande majorité des activités : services, vente, artisanat, professions libérales. Certaines activités réglementées ou agricoles suivent des règles spécifiques. On étudie votre cas dès la première prise de contact." },
  { q: "Faites-vous la démarche à ma place ?",                    a: "Non — la déclaration doit légalement être faite par vous-même sur le site officiel. En revanche, on vous accompagne en direct, étape par étape, pour que vous remplissiez tout correctement et sans erreur. Vous êtes guidé, pas seul." },
  { q: "Que se passe-t-il après la création ?",                   a: "Vous recevez votre numéro SIRET par email. Il faut ensuite déclarer votre chiffre d'affaires chaque mois ou trimestre à l'URSSAF, émettre des factures conformes et ouvrir un compte dédié si nécessaire. On vous explique tout lors du bilan post-création inclus dans l'accompagnement." },
  { q: "Je débute totalement — est-ce que c'est pour moi ?",      a: "Absolument. Notre accompagnement est justement pensé pour les débutants complets. On part de zéro, on explique chaque terme, chaque étape. Pas besoin d'avoir des connaissances administratives — on traduit tout en langage simple." },
];

/* ═══════════════════════════════ FAQ ════════════════════════════════════════ */

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="cursor-pointer rounded-2xl border border-[rgba(255,255,255,.12)] bg-white transition-all duration-200 hover:border-[rgba(245,158,11,.35)] hover:shadow-md" onClick={onToggle}>
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-[#09090b] leading-relaxed">{q}</p>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
          style={{ borderColor: open ? `rgba(${GR},.4)` : "rgba(0,0,0,.1)", background: open ? `rgba(${GR},.08)` : "transparent" }}>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
            <ChevronDown size={14} style={{ color: open ? G : "#6b7280" }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
            <p className="border-t border-black/[.05] px-6 pb-5 pt-4 text-sm leading-relaxed text-[#4b5563]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════ PAGE ═══════════════════════════════════ */

export default function CreationAutoEntrepreneurPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#09090b] pb-16 pt-24 sm:pb-28 sm:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[600px] w-[700px] -translate-x-1/2 rounded-full opacity-20"
            style={{ background: `radial-gradient(ellipse,rgba(${GR},.6) 0%,transparent 65%)` }} />
          <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full opacity-10"
            style={{ background: `radial-gradient(ellipse,rgba(${G2R},.5) 0%,transparent 70%)` }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2">

            {/* Left: copy */}
            <div>
              <motion.div {...fadeIn} className="mb-6">
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs text-white/50 transition-colors hover:text-white">
                  <ArrowLeft size={12} /> Tous les services
                </Link>
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.05 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold"
                style={{ borderColor: `rgba(${GR},.35)`, background: `rgba(${GR},.09)`, color: G }}>
                <Rocket size={13} /> Accompagnement création · auto-entrepreneur
              </motion.div>
              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                <MultiLineReveal lines={["Création", "auto-entrepreneur"]}
                  highlight={1} stagger={0.12} wordStagger={0.05} delay={0.08} lineClassName="justify-start" />
              </h1>
              <FadeReveal delay={0.22}>
                <p className="mb-8 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
                  Lancez votre activité en toute sérénité. On vous accompagne pas à pas dans la création de votre statut auto-entrepreneur — sans stress, sans erreur, sans jargon.
                </p>
              </FadeReveal>
              <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="mb-8 flex flex-wrap gap-3">
                {[
                  { label: "À partir de 49€", sub: "accompagnement complet" },
                  { label: "24–48h",           sub: "délai d'obtention du SIRET" },
                  { label: "100% guidé",       sub: "pas à pas avec vous" },
                ].map(({ label, sub }) => (
                  <div key={label} className="rounded-2xl border border-white/[.08] bg-white/[.04] px-5 py-3 text-center">
                    <p className="text-base font-extrabold" style={{ color: G }}>{label}</p>
                    <p className="text-[0.62rem] text-white/35">{sub}</p>
                  </div>
                ))}
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.38 }}>
                <Link href="/contact?besoin=Création+auto-entrepreneur" className="btn-primary px-8 py-4 text-base">
                  Commencer mon accompagnement <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>

            {/* Right: dossier / formulaire mockup */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.15 }}
              className="relative mx-auto w-full max-w-md rounded-2xl border border-white/[.1] overflow-hidden shadow-2xl"
              style={{ background: "#0d0d11" }}>
              {/* Title bar */}
              <div className="flex items-center gap-2.5 border-b border-white/[.07] px-4 py-2.5">
                <div className="flex gap-1.5">
                  {["#ef4444","#f9a826","#4ade80"].map(c => (
                    <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span className="flex-1 text-center text-[10px] text-white/30 font-mono">Déclaration d'activité — autoentrepreneur.urssaf.fr</span>
                <Shield size={11} className="text-white/20" />
              </div>

              {/* Progress bar */}
              <div className="border-b border-white/[.06] px-4 py-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[9px] text-white/40">Progression du dossier</span>
                  <span className="text-[9px] font-bold" style={{ color: "#4ade80" }}>Étape 5 / 5</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${G2},${G})` }}
                    initial={{ width: "0%" }} animate={{ width: "100%" }}
                    transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 }} />
                </div>
              </div>

              {/* Form content */}
              <div className="p-4 space-y-3">
                {/* Validated fields */}
                {[
                  { label: "Nom & prénom",      value: "Marie Dupont",       ok: true },
                  { label: "Activité principale",value: "Conseil en communication",ok: true },
                  { label: "Code APE",           value: "7311Z — Activités des agences de publicité", ok: true },
                  { label: "Régime fiscal",      value: "Micro-entreprise — versement libératoire",  ok: true },
                  { label: "Domiciliation",      value: "Domicile personnel",  ok: true },
                ].map(({ label, value, ok }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                    style={{ borderColor: ok ? "rgba(74,222,128,.25)" : "rgba(255,255,255,.08)", background: ok ? "rgba(74,222,128,.04)" : "rgba(255,255,255,.03)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8.5px] text-white/35">{label}</p>
                      <p className="truncate text-[11px] font-medium text-white/80">{value}</p>
                    </div>
                    {ok && <CheckCircle2 size={13} style={{ color: "#4ade80", flexShrink: 0 }} />}
                  </div>
                ))}

                {/* SIRET obtenu */}
                <motion.div className="rounded-xl border p-3"
                  style={{ borderColor: `rgba(${GR},.35)`, background: `rgba(${GR},.07)` }}
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.2, duration: 0.5, ease }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8.5px] text-white/40">Numéro SIRET attribué</p>
                      <p className="font-mono text-base font-bold tracking-widest" style={{ color: G }}>532 847 291 00024</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `rgba(${GR},.15)` }}>
                      <BadgeCheck size={18} style={{ color: G }} />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom status */}
              <div className="flex items-center justify-between border-t border-white/[.07] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <motion.div className="h-2 w-2 rounded-full"
                    style={{ background: "#4ade80" }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }} />
                  <span className="text-[9px] text-white/35">Dossier validé · Activité créée</span>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[9px] font-bold"
                  style={{ background: "rgba(74,222,128,.15)", color: "#4ade80" }}>✓ Officiel</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── PRÉSENTATION ──────────────────────────────────────────────── */}
      <section className="bg-[#0d0a06] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}>
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: G }}>Le statut auto-entrepreneur</motion.p>
              <motion.h2 variants={fadeIn} className="mb-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Le régime le plus simple pour lancer une activité en France
              </motion.h2>
              <motion.p variants={fadeIn} className="mb-4 text-sm leading-relaxed text-white/60">
                Le statut auto-entrepreneur (ou micro-entrepreneur) est le régime le plus accessible pour exercer une activité professionnelle indépendante. Pas de capital minimum, pas de comptable obligatoire, des cotisations proportionnelles à votre chiffre d'affaires — vous payez uniquement si vous gagnez.
              </motion.p>
              <motion.p variants={fadeIn} className="text-sm leading-relaxed text-white/60">
                Mais même simple, la démarche comporte des étapes qui peuvent bloquer si on ne les connaît pas : choix du code APE, régime fiscal, déclarations obligatoires… DJAMA vous guide pour que chaque étape soit franchie correctement, du premier formulaire au premier SIRET.
              </motion.p>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="grid grid-cols-2 gap-4">
              {[
                { stat: "3 M+",  label: "auto-entrepreneurs actifs en France en 2024",          c: G,         r: GR },
                { stat: "48h",   label: "délai moyen pour recevoir son numéro SIRET",            c: G2,        r: G2R },
                { stat: "0€",    label: "de capital minimum requis pour créer",                  c: "#4ade80", r: "74,222,128" },
                { stat: "Gratuit",label: "la déclaration sur autoentrepreneur.urssaf.fr",        c: "#60a5fa", r: "96,165,250" },
              ].map(({ stat, label, c, r }) => (
                <motion.div key={stat} variants={cardReveal}
                  className="rounded-2xl border border-white/[.08] bg-white/[.04] p-5 text-center">
                  <p className="mb-1 text-2xl font-black leading-none" style={{ color: c }}>{stat}</p>
                  <p className="text-[0.67rem] leading-relaxed text-white/45">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CE QUI EST INCLUS ─────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: G }}>L'accompagnement DJAMA</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce qui est inclus dans votre accompagnement</motion.h2>
            <motion.p variants={fadeIn} className="mt-4 mx-auto max-w-xl text-sm text-white/55">
              Un suivi complet de A à Z — de la réflexion sur votre activité à votre premier jour en tant qu'auto-entrepreneur officiel.
            </motion.p>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUS.map(({ icon: Icon, c, r, title, desc }) => (
              <motion.div key={title} variants={cardReveal}
                className="group rounded-2xl border border-white/[.1] bg-white/[.05] p-5 transition-all duration-300 hover:border-white/[.2] hover:bg-white/[.09]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `rgba(${r},.1)` }}>
                  <Icon size={18} style={{ color: c }} />
                </div>
                <h3 className="mb-1.5 text-xs font-bold leading-tight text-white">{title}</h3>
                <p className="text-[0.67rem] leading-relaxed text-white/50">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── POUR QUI ──────────────────────────────────────────────────── */}
      <section className="bg-[#0d0a06] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: G }}>Profils</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Cet accompagnement est fait pour vous si…</motion.h2>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POUR_QUI.map(({ icon: Icon, c, r, who, desc, tags }) => (
              <motion.div key={who} variants={cardReveal}
                className="group rounded-2xl border border-white/[.1] bg-white/[.05] p-5 transition-all duration-300 hover:border-white/[.2] hover:bg-white/[.08]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `rgba(${r},.1)` }}>
                  <Icon size={18} style={{ color: c }} />
                </div>
                <h3 className="mb-1.5 text-xs font-bold text-white">{who}</h3>
                <p className="mb-3 text-[0.67rem] leading-relaxed text-white/50">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <span key={t} className="rounded-full border px-2.5 py-0.5 text-[0.58rem] font-medium"
                      style={{ borderColor: `rgba(${r},.25)`, color: c, background: `rgba(${r},.07)` }}>{t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── ÉTAPES ────────────────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: G }}>Le parcours</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">6 étapes pour lancer votre activité</motion.h2>
          </motion.div>

          <div className="relative">
            {/* Connector vertical */}
            <div className="absolute left-[27px] top-8 bottom-8 w-[2px] hidden sm:block rounded-full"
              style={{ background: "linear-gradient(180deg,rgba(255,255,255,.04) 0%,rgba(245,158,11,.15) 50%,rgba(255,255,255,.04) 100%)" }} />
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="space-y-4">
              {ETAPES.map(({ num, icon: Icon, c, r, title, desc }) => (
                <motion.div key={num} variants={cardReveal}
                  className="relative flex gap-5 rounded-2xl border border-white/[.1] bg-white/[.05] p-5 transition-all duration-300 hover:border-white/[.18] hover:bg-white/[.08]">
                  <div className="relative z-10 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border"
                    style={{ background: `rgba(${r},.1)`, borderColor: `rgba(${r},.25)` }}>
                    <span className="text-[0.55rem] font-bold leading-none" style={{ color: `rgba(${r},.7)` }}>{num}</span>
                    <Icon size={17} style={{ color: c }} />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="mb-1.5 text-sm font-bold text-white">{title}</h3>
                    <p className="text-xs leading-relaxed text-white/55">{desc}</p>
                  </div>
                  <span className="pointer-events-none absolute right-5 top-3 select-none text-5xl font-black opacity-[.035]" style={{ color: c }}>{num}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── RASSURANCE ────────────────────────────────────────────────── */}
      <section className="bg-[#0d0a06] py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: G }}>Notre engagement</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Un accompagnement pensé pour vous</motion.h2>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {RASSURANCE.map(({ icon: Icon, c, r, title, desc }) => (
              <motion.div key={title} variants={cardReveal}
                className="group relative overflow-hidden rounded-2xl border border-white/[.1] bg-white/[.05] p-5 text-center transition-all duration-300 hover:border-white/[.2] hover:bg-white/[.08]">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: `rgba(${r},.12)`, border: `1px solid rgba(${r},.2)` }}>
                  <Icon size={20} style={{ color: c }} />
                </div>
                <h3 className="mb-2 text-sm font-extrabold text-white">{title}</h3>
                <p className="text-[0.67rem] leading-relaxed text-white/50">{desc}</p>
                {/* Ambient glow */}
                <div className="pointer-events-none absolute -bottom-6 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: c }} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CE QU'IL FAUT PRÉPARER ────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: G }}>Checklist</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce qu'il faut préparer</motion.h2>
            <motion.p variants={fadeIn} className="mt-4 mx-auto max-w-lg text-sm text-white/50">
              Rien de complexe. Voici tout ce dont vous aurez besoin pour créer votre auto-entreprise.
            </motion.p>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PREPARER.map(({ icon: Icon, c, r, label, detail }) => (
              <motion.div key={label} variants={cardReveal}
                className="flex items-start gap-4 rounded-2xl border border-white/[.1] bg-white/[.04] p-4 transition-all duration-200 hover:border-white/[.18] hover:bg-white/[.07]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `rgba(${r},.1)` }}>
                  <Icon size={16} style={{ color: c }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="mt-0.5 text-[0.65rem] leading-relaxed text-white/45">{detail}</p>
                </div>
                <CheckCircle2 size={14} className="ml-auto mt-0.5 shrink-0 text-green-400/60" />
              </motion.div>
            ))}
          </motion.div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={viewport}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 text-center text-xs text-white/30">
            Pour les activités réglementées (artisanat, santé, juridique…), des justificatifs de qualification peuvent être demandés — on vous prévient en amont.
          </motion.p>
        </div>
      </section>

      {/* ── POURQUOI SE FAIRE ACCOMPAGNER ─────────────────────────────── */}
      <section className="bg-[#0d0a06] py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: G }}>Pourquoi nous choisir</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Pourquoi se faire accompagner ?</motion.h2>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: Clock,     c: G,         r: GR,           title: "Gagner du temps",            desc: "La création seule peut prendre plusieurs jours si on ne sait pas où chercher. Avec DJAMA, vous êtes opérationnel en 48h, sans perdre de temps sur des formulaires complexes." },
              { icon: Shield,    c: "#4ade80", r: "74,222,128", title: "Éviter les erreurs",          desc: "Une erreur dans votre déclaration (mauvais code APE, régime fiscal inadapté) peut nécessiter une rectification longue. On vérifie tout avant envoi." },
              { icon: BookOpen,  c: "#60a5fa", r: "96,165,250", title: "Mieux comprendre",            desc: "URSSAF, CFE, TVA, régime micro-fiscal — on vous explique chaque terme clairement pour que vous sachiez exactement ce que vous signez et ce qu'on attend de vous." },
              { icon: Sparkles,  c: G2,        r: G2R,          title: "Démarrer plus sereinement",  desc: "Se lancer dans l'entrepreneuriat est déjà un grand pas. Savoir que les formalités sont bien faites vous libère pour vous concentrer sur ce qui compte : votre activité." },
              { icon: UserCheck, c: G,         r: GR,           title: "Un accompagnement humain",   desc: "Pas de chatbot, pas de FAQ à déchiffrer. Un interlocuteur DJAMA répond à vos questions et vous suit de la première prise de contact à votre premier SIRET." },
            ].map(({ icon: Icon, c, r, title, desc }) => (
              <motion.div key={title} variants={cardReveal}
                className="group flex gap-4 rounded-2xl border border-white/[.1] bg-white/[.05] p-5 transition-all duration-300 hover:border-white/[.18] hover:bg-white/[.08]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `rgba(${r},.1)` }}>
                  <Icon size={20} style={{ color: c }} />
                </div>
                <div>
                  <h3 className="mb-1.5 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/55">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── APRÈS LA CRÉATION ─────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: G }}>Après le SIRET</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Et après la création ?</motion.h2>
            <motion.p variants={fadeIn} className="mt-4 mx-auto max-w-lg text-sm text-white/50">
              La création n'est que le point de départ. Voici les premières étapes de votre vie d'auto-entrepreneur.
            </motion.p>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="space-y-3">
            {APRES_CREATION.map(({ num, c, title, desc }) => (
              <motion.div key={num} variants={cardReveal}
                className="flex items-start gap-4 rounded-2xl border border-white/[.08] bg-white/[.04] px-5 py-4 transition-all duration-200 hover:border-white/[.15] hover:bg-white/[.07]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                  style={{ background: `rgba(${c},.15)`, color: `rgb(${c})` }}>{num}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">{desc}</p>
                </div>
                <CheckCircle2 size={15} style={{ color: `rgb(${c})`, opacity: 0.6, flexShrink: 0, marginTop: 2 }} />
              </motion.div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ delay: 0.4, duration: 0.5, ease }}
            className="mt-8 rounded-2xl border border-white/[.08] bg-white/[.03] px-5 py-4">
            <p className="text-xs text-white/50 leading-relaxed">
              <span className="font-bold" style={{ color: G }}>Bon à savoir :</span> Le bilan post-création inclus dans votre accompagnement DJAMA couvre toutes ces étapes. On vous explique ce que vous devez faire, quand le faire, et comment l'éviter de payer des pénalités.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-[#0d0a06] py-14 sm:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: G }}>Questions fréquentes</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Vous avez des questions ?</motion.h2>
          </motion.div>
          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <FaqItem key={i} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#09090b] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
            style={{ background: `radial-gradient(ellipse,rgba(${GR},.5) 0%,transparent 65%)` }} />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ duration: 0.6, ease }}>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `rgba(${GR},.12)`, border: `1px solid rgba(${GR},.25)` }}>
              <Rocket size={26} style={{ color: G }} />
            </div>
            <h2 className="mb-3 text-3xl font-extrabold text-white sm:text-4xl">Prêt à lancer votre activité ?</h2>
            <p className="mb-2 text-base font-semibold" style={{ color: G }}>Sans stress. Sans erreur. Avec un vrai accompagnement.</p>
            <p className="mb-8 mx-auto max-w-md text-sm leading-relaxed text-white/50">
              Dites-nous ce que vous souhaitez faire — on s'occupe du reste. En quelques jours, votre activité est officiellement lancée.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact?besoin=Création+auto-entrepreneur" className="btn-primary px-9 py-4 text-base">
                Commencer mon accompagnement <ArrowRight size={16} />
              </Link>
              <Link href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-7 py-4 text-sm font-semibold text-white/60 transition-all hover:bg-white/[.08] hover:text-white">
                Tous nos services
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/25">Sans engagement · Réponse sous 24h · Accompagnement personnalisé</p>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
