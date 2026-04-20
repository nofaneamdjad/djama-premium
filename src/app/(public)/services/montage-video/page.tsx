"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Film, Scissors, Music, Play, ArrowRight, ArrowLeft,
  CheckCircle2, Sparkles, ChevronDown, ZoomIn, ExternalLink,
  Instagram, Youtube, Monitor, Tv, Briefcase,
  TrendingUp, Clock, Star, Layers,
  MessageSquare, Zap, BadgeCheck, LayoutGrid,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import { getSupabase } from "@/lib/supabase";
import type { VideoProjectRow } from "@/types/db";

const ease = [0.16, 1, 0.3, 1] as const;
const A  = "#e11d48";
const AR = "225,29,72";
const P  = "#db2777";
const PR = "219,39,119";

/* ═══════════════════════════════════ DATA ═══════════════════════════════════ */

const FORMATS = [
  { icon: Instagram, c: "#f472b6", r: "244,114,182", tag: "9:16", title: "Reels Instagram",       desc: "Montages courts, dynamiques, calibrés pour l'algorithme et la rétention Instagram." },
  { icon: Play,      c: A,         r: AR,            tag: "9:16", title: "TikTok",                  desc: "Rythme natif TikTok, cuts sur le beat, textes animés et tendances intégrées." },
  { icon: Youtube,   c: "#f87171", r: "248,113,113", tag: "9:16", title: "YouTube Shorts",         desc: "Format vertical optimisé YouTube < 60 s, structure accrocheuse dès la 1ʳᵉ seconde." },
  { icon: Youtube,   c: "#f9a826", r: "249,168,38",  tag: "16:9", title: "YouTube (long format)",  desc: "Montages structurés de 5 à 60 min avec intro, chapitres et rythme maîtrisé." },
  { icon: Tv,        c: A,         r: AR,            tag: "16:9", title: "Vidéos publicitaires",   desc: "Spots percutants pour Meta Ads, Google ou YouTube — pensés pour convertir." },
  { icon: Film,      c: P,         r: PR,            tag: "16:9", title: "Teasers",                desc: "30 à 90 s de teasing efficace : révèle juste assez pour susciter l'envie." },
  { icon: Briefcase, c: "#60a5fa", r: "96,165,250",  tag: "16:9", title: "Vidéos corporate",      desc: "Présentation d'entreprise, valeurs, équipe — soignée et professionnelle." },
  { icon: Star,      c: "#4ade80", r: "74,222,128",  tag: "16:9", title: "Aftermovies & événements",desc: "Captation + montage d'un aftermovie qui restitue l'émotion de votre événement." },
  { icon: Monitor,   c: "#c084fc", r: "192,132,252", tag: "16:9", title: "Présentation produit",  desc: "Vidéo produit / service soignée avec motion design léger pour booster les ventes." },
  { icon: Zap,       c: "#f9a826", r: "249,168,38",  tag: "Tous", title: "Clips marketing",       desc: "Contenus promotionnels polyvalents pour tous réseaux — organique ou sponsorisé." },
];

const OPTIONS = [
  { icon: MessageSquare, c: A,         r: AR,            title: "Sous-titrage",               desc: "Sous-titres calés précisément pour maximiser la rétention sur mobile sans le son." },
  { icon: Scissors,      c: P,         r: PR,            title: "Découpage court format",     desc: "Transformation d'une longue vidéo en plusieurs Reels / TikTok / Shorts." },
  { icon: Zap,           c: "#f9a826", r: "249,168,38",  title: "Transitions dynamiques",     desc: "Jump cuts, zooms rythmiques, whip pans, match cuts — selon votre style." },
  { icon: Layers,        c: "#60a5fa", r: "96,165,250",  title: "Habillage visuel",           desc: "Intros, outros, lower thirds animés, typographies sur-mesure." },
  { icon: BadgeCheck,    c: "#4ade80", r: "74,222,128",  title: "Logo & branding intégré",   desc: "Votre logo, vos couleurs et votre charte visuelle présents dans chaque frame." },
  { icon: TrendingUp,    c: A,         r: AR,            title: "Call-to-action",             desc: "CTA visuels intégrés : abonnez-vous, découvrez, achetez — au bon moment." },
  { icon: LayoutGrid,    c: P,         r: PR,            title: "Multi-format",               desc: "Une vidéo source déclinée en 16:9 / 9:16 / 1:1 en une seule commande." },
  { icon: Film,          c: "#f9a826", r: "249,168,38",  title: "Version pub / organique",    desc: "Deux montages distincts — un pour la pub payante, un pour le contenu naturel." },
];

const PROCESSUS = [
  { num: "01", icon: Film,         c: "#c9a55a", r: "201,165,90",  title: "Réception des rushs",      desc: "Vous nous envoyez vos fichiers vidéo, images, musiques et références de style." },
  { num: "02", icon: MessageSquare,c: "#60a5fa", r: "96,165,250",  title: "Brief & direction",        desc: "On définit ensemble le ton, le rythme, les effets et les contraintes de format." },
  { num: "03", icon: Scissors,     c: A,         r: AR,            title: "Montage brut",             desc: "Assemblage des séquences, découpage, suppression des longueurs et fautes." },
  { num: "04", icon: Music,        c: P,         r: PR,            title: "Musique & sound design",   desc: "Intégration d'une musique libre de droits calée sur le montage, niveaux audio mixés." },
  { num: "05", icon: Tv,           c: "#4ade80", r: "74,222,128",  title: "Habillage & sous-titres",  desc: "Titres animés, sous-titres, logos, transitions — identité visuelle intégrée." },
  { num: "06", icon: CheckCircle2, c: "#f9a826", r: "249,168,38",  title: "Retouches",                desc: "2 rounds de retours inclus. On ajuste jusqu'à ce que le rendu soit parfait." },
  { num: "07", icon: Zap,          c: A,         r: AR,            title: "Livraison finale",         desc: "Export en MP4 haute qualité dans le(s) format(s) demandé(s), prêt à publier." },
];

const VALEUR = [
  { icon: Zap,        c: A,         r: AR,            stat: "65%",   label: "plus d'engagement",   desc: "Une vidéo bien montée génère en moyenne 65% plus d'interactions qu'un post photo." },
  { icon: TrendingUp, c: P,         r: PR,            stat: "3×",    label: "plus de rétention",   desc: "Le montage rythmé avec sous-titres triple le taux de visionnage jusqu'à la fin." },
  { icon: BadgeCheck, c: "#f9a826", r: "249,168,38",  stat: "+80%",  label: "de crédibilité",      desc: "Un rendu professionnel renforce instantanément la perception de qualité de votre marque." },
  { icon: Monitor,    c: "#60a5fa", r: "96,165,250",  stat: "2×",    label: "plus de conversions", desc: "Les landing pages avec vidéo produit convertissent 2× mieux que sans vidéo." },
  { icon: Star,       c: "#4ade80", r: "74,222,128",  stat: "100%",  label: "livré prêt à poster", desc: "Format, résolution, ratio — chaque fichier est exporté exactement pour sa plateforme." },
];

const FAQ_ITEMS = [
  { q: "Dois-je fournir les rushs moi-même ?",          a: "Oui, nous travaillons à partir de vos éléments (vidéos, images, musiques). Si vous n'avez pas de rushs, nous pouvons vous conseiller sur ce qu'il faut filmer ou utiliser des banques de vidéos libres de droits selon le projet." },
  { q: "Combien de temps pour livrer une vidéo ?",      a: "Entre 3 et 7 jours ouvrés selon la durée et la complexité du montage. Ce délai est confirmé lors du devis. Pour les projets urgents, un délai express peut être proposé sur demande." },
  { q: "Combien de modifications sont incluses ?",      a: "2 rounds de retours sont inclus dans chaque projet. Des modifications supplémentaires peuvent être ajoutées sur devis si les changements sortent du cadre initial." },
  { q: "Quels formats de fichiers livrez-vous ?",       a: "Nous livrons en MP4 (H.264 ou H.265) dans les dimensions exactes de votre plateforme cible. Selon le projet, d'autres formats (MOV, WebM) peuvent être fournis sur demande." },
  { q: "Proposez-vous les sous-titres automatiquement ?",a: "Oui, nous pouvons ajouter des sous-titres calés précisément — en français ou en anglais. C'est particulièrement recommandé pour les Reels et TikTok où 80% des vidéos sont regardées sans le son." },
  { q: "Pouvez-vous adapter une vidéo à plusieurs formats ?", a: "Absolument. On prend une vidéo source et on la décline en 16:9 (YouTube), 9:16 (Reels/TikTok) et 1:1 (feed Instagram) en une seule commande, avec recadrage et ajustements spécifiques à chaque format." },
];

const PLACEHOLDER_CARDS = [
  { label: "Reels Instagram", ratio: "9/16",  gradient: `linear-gradient(180deg,rgba(${AR},.25),rgba(${PR},.12))`, border: AR, tag: "9:16" },
  { label: "YouTube",         ratio: "16/9",  gradient: `linear-gradient(135deg,rgba(${PR},.2),rgba(${AR},.1))`,  border: PR, tag: "16:9" },
  { label: "TikTok",          ratio: "9/16",  gradient: `linear-gradient(180deg,rgba(${AR},.18),rgba(96,165,250,.1))`,  border: AR, tag: "9:16" },
  { label: "Corporate",       ratio: "16/9",  gradient: `linear-gradient(90deg,rgba(96,165,250,.18),rgba(${PR},.1))`, border: "96,165,250", tag: "16:9" },
  { label: "Publicité",       ratio: "16/9",  gradient: `linear-gradient(135deg,rgba(249,168,38,.18),rgba(${AR},.1))`, border: "249,168,38", tag: "16:9" },
  { label: "Événement",       ratio: "16/9",  gradient: `linear-gradient(90deg,rgba(74,222,128,.15),rgba(${PR},.1))`,  border: "74,222,128", tag: "16:9" },
];

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "all",       label: "Tous" },
  { key: "reels",     label: "Reels" },
  { key: "tiktok",    label: "TikTok" },
  { key: "youtube",   label: "YouTube" },
  { key: "shorts",    label: "Shorts" },
  { key: "pub",       label: "Publicité" },
  { key: "corporate", label: "Corporate" },
  { key: "evenement", label: "Événement" },
];

/* ═══════════════════════════════ SOUS-COMPOSANTS ════════════════════════════ */

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="cursor-pointer rounded-2xl border border-[rgba(255,255,255,0.12)] bg-white transition-all duration-200 hover:border-[rgba(225,29,72,0.35)] hover:shadow-md" onClick={onToggle}>
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-[#09090b] leading-relaxed">{q}</p>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
          style={{ borderColor: open ? `rgba(${AR},.4)` : "rgba(0,0,0,.1)", background: open ? `rgba(${AR},.08)` : "transparent" }}>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
            <ChevronDown size={14} style={{ color: open ? A : "#6b7280" }} />
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

export default function MontageVideoPage() {
  const [openFaq, setOpenFaq]         = useState<number | null>(null);
  const [projects, setProjects]       = useState<VideoProjectRow[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [filter, setFilter]           = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getSupabase()
          .from("video_projects")
          .select("*")
          .eq("status", "published")
          .order("sort_order", { ascending: true });
        setProjects((data ?? []) as VideoProjectRow[]);
      } catch { setProjects([]); }
      finally { setGalleryLoading(false); }
    }
    load();
  }, []);

  const filtered = filter === "all" ? projects : projects.filter(p => p.category === filter);

  return (
    <main>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#09090b] pb-16 pt-24 sm:pb-28 sm:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[600px] w-[700px] -translate-x-1/2 rounded-full opacity-25"
            style={{ background: `radial-gradient(ellipse,rgba(${AR},.5) 0%,transparent 65%)` }} />
          <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full opacity-10"
            style={{ background: `radial-gradient(ellipse,rgba(${PR},.6) 0%,transparent 70%)` }} />
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
                style={{ borderColor: `rgba(${AR},.35)`, background: `rgba(${AR},.09)`, color: A }}>
                <Video size={13} /> Création vidéo · montage pro
              </motion.div>
              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                <MultiLineReveal lines={["Montage vidéo", "professionnel"]}
                  highlight={1} stagger={0.12} wordStagger={0.05} delay={0.08} lineClassName="justify-start" />
              </h1>
              <FadeReveal delay={0.22}>
                <p className="mb-8 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
                  Reels, TikTok, YouTube, corporate ou publicité — nous transformons vos rushs en vidéos percutantes qui captivent, engagent et convertissent.
                </p>
              </FadeReveal>
              <motion.div {...fadeIn} transition={{ delay: 0.3 }}
                className="mb-8 flex flex-wrap gap-3">
                {[
                  { label: "À partir de 150€", sub: "par projet" },
                  { label: "3–7 jours",        sub: "délai de livraison" },
                  { label: "2 retours",        sub: "inclus" },
                ].map(({ label, sub }) => (
                  <div key={label} className="rounded-2xl border border-white/[.08] bg-white/[.04] px-5 py-3 text-center">
                    <p className="text-base font-extrabold" style={{ color: A }}>{label}</p>
                    <p className="text-[0.62rem] text-white/35">{sub}</p>
                  </div>
                ))}
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.38 }}>
                <Link href="/contact?besoin=Montage+vidéo" className="btn-primary px-8 py-4 text-base">
                  Demander un devis <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>

            {/* Right: video editor mockup */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.15 }}
              className="relative mx-auto w-full max-w-lg rounded-2xl border border-white/[.1] overflow-hidden shadow-2xl"
              style={{ background: "#0d0d10" }}>
              {/* Title bar */}
              <div className="flex items-center gap-2.5 border-b border-white/[.07] px-4 py-2.5">
                <div className="flex gap-1.5">
                  {["#ef4444","#f9a826","#4ade80"].map(c => (
                    <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span className="flex-1 text-center text-[10px] text-white/30 font-mono">djama_sequence_01.prproj</span>
                <Film size={11} className="text-white/20" />
              </div>

              {/* Main: media + preview */}
              <div className="grid grid-cols-[100px_1fr]">
                {/* Media bin */}
                <div className="border-r border-white/[.06] p-3 space-y-2">
                  <p className="text-[8px] uppercase tracking-widest text-white/25 mb-2.5">Médias</p>
                  {[
                    { name: "intro_rush.mp4",  dur: "0:34", c: AR },
                    { name: "interview_v2.mp4",dur: "2:12", c: PR },
                    { name: "broll_ext.mp4",   dur: "0:58", c: "96,165,250" },
                    { name: "logo_anim.mov",   dur: "0:05", c: "74,222,128" },
                  ].map(({ name, dur, c }) => (
                    <div key={name} className="rounded-lg p-1.5" style={{ background: `rgba(${c},.07)` }}>
                      <div className="mb-1 flex h-10 w-full items-center justify-center rounded" style={{ background: `rgba(${c},.15)` }}>
                        <Play size={10} style={{ color: `rgb(${c})` }} fill="currentColor" />
                      </div>
                      <p className="truncate text-[7.5px] text-white/60 font-medium">{name}</p>
                      <p className="text-[7px] text-white/30">{dur}</p>
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div className="flex flex-col">
                  <div className="flex-1 flex items-center justify-center p-3 relative">
                    <div className="relative w-full overflow-hidden rounded-lg flex items-center justify-center"
                      style={{ aspectRatio: "16/9", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
                      <div className="absolute inset-0"
                        style={{ background: `linear-gradient(135deg,rgba(${AR},.18) 0%,rgba(${PR},.1) 100%)` }} />
                      <div className="absolute inset-0 opacity-[.06]"
                        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "20% 20%" }} />
                      <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ background: `rgba(${AR},.25)`, border: `1px solid rgba(${AR},.5)` }}>
                        <Play size={14} style={{ color: A }} fill={A} />
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 font-mono text-[7.5px] text-white/60"
                        style={{ background: "rgba(0,0,0,.6)" }}>00:45 / 01:30</span>
                      <span className="absolute top-1.5 left-1.5 rounded px-1.5 py-0.5 text-[7.5px] font-bold"
                        style={{ background: `rgba(${AR},.2)`, color: A }}>4K</span>
                    </div>
                  </div>
                  {/* Progress */}
                  <div className="border-t border-white/[.05] px-3 py-2">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.07)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${A},${P})` }}
                        initial={{ width: "0%" }} animate={{ width: "50%" }} transition={{ duration: 2, ease: "easeOut", delay: 1 }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t border-white/[.07] p-3 space-y-1.5">
                <p className="mb-2 text-[8px] uppercase tracking-widest text-white/20">Timeline</p>
                {[
                  { track: "V1", clips: [{ w: "30%", c: AR, label: "Intro rush" }, { w: "14%", c: PR, label: "" }, { w: "36%", c: AR, label: "Interview" }, { w: "16%", c: "249,168,38", label: "B-roll" }] },
                  { track: "A1", clips: [{ w: "95%", c: "96,165,250", label: "Music_ambient_v2.mp3" }] },
                  { track: "A2", clips: [{ w: "38%", c: "74,222,128", label: "Voix off.wav" }] },
                ].map(({ track, clips }) => (
                  <div key={track} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-[8px] font-bold text-white/25">{track}</span>
                    <div className="flex h-5 flex-1 gap-0.5 overflow-hidden rounded"
                      style={{ background: "rgba(255,255,255,.03)" }}>
                      {clips.map(({ w, c, label }, i) => (
                        <div key={i} className="h-full flex shrink-0 items-center overflow-hidden rounded px-1.5 text-[7px] font-medium text-white/70"
                          style={{ width: w, background: `rgba(${c},.22)`, borderLeft: `2px solid rgba(${c},.75)` }}>
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Playhead progress */}
                <div className="relative mt-1 h-[3px] rounded-full" style={{ background: "rgba(255,255,255,.05)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${A},${P})` }}
                    initial={{ width: "0%" }} animate={{ width: "45%" }}
                    transition={{ duration: 2.2, ease: "easeOut", delay: 0.8 }} />
                  <motion.div className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-sm"
                    style={{ left: "45%", background: A }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }} />
                </div>
              </div>

              {/* Export bar */}
              <div className="border-t border-white/[.07] flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: A }} />
                  <span className="text-[9px] text-white/35">Export en cours… 68%</span>
                </div>
                <span className="rounded px-2 py-0.5 text-[9px] font-bold"
                  style={{ background: `rgba(${AR},.15)`, color: A }}>MP4 · 1080p · H.264</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PRÉSENTATION ──────────────────────────────────────────────── */}
      <section className="bg-[#0e0b18] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}>
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>La vidéo en 2025</motion.p>
              <motion.h2 variants={fadeIn} className="mb-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                La vidéo est le format qui convertit le mieux
              </motion.h2>
              <motion.p variants={fadeIn} className="text-sm leading-relaxed text-white/60">
                91% des consommateurs déclarent vouloir voir plus de vidéos de marques. Une page produit avec vidéo convertit 2× mieux. Un Reel bien monté dépasse 10× la portée d'un post photo. La vidéo n'est plus optionnelle — c'est le cœur de toute stratégie digitale efficace.
              </motion.p>
              <motion.p variants={fadeIn} className="mt-4 text-sm leading-relaxed text-white/60">
                Mais une vidéo mal montée nuit plus qu'elle n'aide. Montage décousu, son brut, durée excessive, mauvais format — votre audience décroche en 3 secondes. Chez DJAMA, on construit chaque vidéo pour retenir l'attention de la première à la dernière image.
              </motion.p>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="grid grid-cols-2 gap-4">
              {[
                { stat: "91%",  label: "des consommateurs veulent plus de vidéos de marques", c: A, r: AR },
                { stat: "2×",   label: "plus de conversions sur une page avec vidéo produit", c: P, r: PR },
                { stat: "3 s",  label: "pour capter l'attention avant que l'audience décroche", c: "#f9a826", r: "249,168,38" },
                { stat: "10×",  label: "la portée organique d'un Reel vs. un post photo", c: "#4ade80", r: "74,222,128" },
              ].map(({ stat, label, c, r }) => (
                <motion.div key={stat} variants={cardReveal}
                  className="rounded-2xl border border-white/[.08] bg-white/[.04] p-5 text-center">
                  <p className="mb-1 text-3xl font-black" style={{ color: c }}>{stat}</p>
                  <p className="text-[0.68rem] leading-relaxed text-white/45">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FORMATS ───────────────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Tous formats maîtrisés</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Pour quel type de vidéo ?</motion.h2>
            <motion.p variants={fadeIn} className="mt-4 mx-auto max-w-xl text-sm text-white/55">
              Du court format vertical au film corporate — on maîtrise chaque format et chaque plateforme.
            </motion.p>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FORMATS.map(({ icon: Icon, c, r, tag, title, desc }) => (
              <motion.div key={title} variants={cardReveal}
                className="group relative rounded-2xl border border-white/[.1] bg-white/[.05] p-5 transition-all duration-300 hover:border-white/[.18] hover:bg-white/[.09]">
                <div className="mb-1 absolute top-3 right-3 rounded-md px-1.5 py-0.5 text-[8px] font-bold"
                  style={{ background: `rgba(${r},.12)`, color: c }}>{tag}</div>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `rgba(${r},.1)` }}>
                  <Icon size={17} style={{ color: c }} />
                </div>
                <h3 className="mb-1.5 text-xs font-bold leading-tight text-white">{title}</h3>
                <p className="text-[0.68rem] leading-relaxed text-white/50">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PORTFOLIO ─────────────────────────────────────────────────── */}
      <section className="bg-[#0e0b18] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Portfolio</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Nos réalisations vidéo</motion.h2>
          </motion.div>

          {/* Filter tabs */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {FILTER_TABS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <button key={key} onClick={() => setFilter(key)}
                  className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200"
                  style={active
                    ? { background: `linear-gradient(135deg,${A},${P})`, borderColor: "transparent", color: "#fff" }
                    : { borderColor: "rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.45)" }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Gallery */}
          {galleryLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white/[.06]" style={{ aspectRatio: "16/9" }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((proj, i) => (
                  <motion.div key={proj.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[.1] bg-white/[.05]"
                    style={{ aspectRatio: proj.format === "9:16" ? "9/16" : "16/9" }}>
                    {proj.thumbnail_url ? (
                      <img src={proj.thumbnail_url} alt={proj.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,rgba(${AR},.2),rgba(${PR},.1))` }} />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2"
                        style={{ borderColor: A, background: `rgba(${AR},.2)` }}>
                        <Play size={20} style={{ color: A }} fill={A} />
                      </div>
                      {proj.video_url && (
                        <a href={proj.video_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink size={11} /> Voir la vidéo
                        </a>
                      )}
                    </div>
                    {/* Info bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-sm font-bold text-white">{proj.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize"
                          style={{ background: `rgba(${AR},.25)`, color: A }}>{proj.category}</span>
                        {proj.format && (
                          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[9px] text-white/60">{proj.format}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Placeholder quand vide */
            <div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PLACEHOLDER_CARDS.map(({ label, ratio, gradient, border, tag }) => (
                  <div key={label} className="relative overflow-hidden rounded-2xl border"
                    style={{ aspectRatio: ratio, background: gradient, borderColor: `rgba(${border},.2)` }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{ background: `rgba(${border},.15)`, border: `1px solid rgba(${border},.3)` }}>
                        <Play size={18} style={{ color: `rgb(${border})` }} />
                      </div>
                      <p className="text-xs font-bold text-white/60">{label}</p>
                      <span className="rounded-md px-2 py-0.5 text-[9px] font-bold"
                        style={{ background: `rgba(${border},.15)`, color: `rgb(${border})` }}>{tag}</span>
                    </div>
                    <div className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[8px] text-white/30"
                      style={{ background: "rgba(0,0,0,.4)" }}>Bientôt disponible</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="mb-4 text-sm text-white/40">Nos premières réalisations seront publiées ici prochainement.</p>
                <Link href="/contact?besoin=Montage+vidéo" className="btn-primary px-7 py-3 text-sm">
                  Démarrer mon projet <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── PROCESSUS ─────────────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Notre méthode</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">7 étapes de la livraison</motion.h2>
          </motion.div>

          {/* Timeline verticale */}
          <div className="relative">
            <div className="absolute left-[27px] top-6 bottom-6 w-[2px] rounded-full hidden sm:block"
              style={{ background: "linear-gradient(180deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.04) 100%)" }} />
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="space-y-4">
              {PROCESSUS.map(({ num, icon: Icon, c, r, title, desc }) => (
                <motion.div key={num} variants={cardReveal}
                  className="relative flex gap-5 rounded-2xl border border-white/[.1] bg-white/[.05] p-5 transition-all duration-300 hover:border-white/[.18] hover:bg-white/[.08]">
                  <div className="relative z-10 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border"
                    style={{ background: `rgba(${r},.1)`, borderColor: `rgba(${r},.25)` }}>
                    <span className="text-[0.55rem] font-bold" style={{ color: `rgba(${r},.7)` }}>{num}</span>
                    <Icon size={17} style={{ color: c }} />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="mb-1 text-sm font-bold text-white">{title}</h3>
                    <p className="text-xs leading-relaxed text-white/55">{desc}</p>
                  </div>
                  <span className="pointer-events-none absolute right-5 top-3 select-none text-5xl font-black opacity-[.035]" style={{ color: c }}>{num}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── OPTIONS ───────────────────────────────────────────────────── */}
      <section className="bg-[#0e0b18] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Options & add-ons</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Toutes les fonctionnalités disponibles</motion.h2>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OPTIONS.map(({ icon: Icon, c, r, title, desc }) => (
              <motion.div key={title} variants={cardReveal}
                className="group rounded-2xl border border-white/[.1] bg-white/[.05] p-5 transition-all duration-300 hover:border-white/[.18] hover:bg-white/[.08]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `rgba(${r},.1)` }}>
                  <Icon size={18} style={{ color: c }} />
                </div>
                <h3 className="mb-1.5 text-xs font-bold text-white">{title}</h3>
                <p className="text-[0.67rem] leading-relaxed text-white/50">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── AVANT / APRÈS ─────────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>La différence</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Rush brut vs. vidéo montée pro</motion.h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ duration: 0.55, ease }}
            className="grid gap-6 sm:grid-cols-2">

            {/* AVANT */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[.04] p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15">
                  <span className="text-[11px] font-bold text-red-400">✕</span>
                </div>
                <span className="text-sm font-bold text-red-400">Rush brut</span>
              </div>
              {/* Fake chaotic timeline */}
              <div className="mb-5 rounded-xl border border-white/[.05] bg-black/20 p-3 space-y-1.5">
                {[
                  [{ w: "45%", c: "239,68,68" }, { w: "20%", c: "239,68,68" }, { w: "35%", c: "239,68,68" }],
                  [{ w: "15%", c: "239,68,68" }, { w: "60%", c: "239,68,68" }, { w: "20%", c: "239,68,68" }],
                  [{ w: "80%", c: "239,68,68" }, { w: "15%", c: "239,68,68" }],
                ].map((row, ri) => (
                  <div key={ri} className="flex h-4 gap-0.5 opacity-60">
                    {row.map(({ w, c }, ci) => (
                      <div key={ci} className="h-full rounded-sm" style={{ width: w, background: `rgba(${c},.3)`, transform: `skewX(${(ci - 1) * 2}deg)` }} />
                    ))}
                  </div>
                ))}
              </div>
              <ul className="space-y-2">
                {["Séquences non sélectionnées", "Durée trop longue / longueurs", "Son brut, bruits parasites", "Pas de musique ni de rythme", "Aucun sous-titre ni habillage", "Format non adapté aux réseaux"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/50">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* APRÈS */}
            <div className="rounded-2xl border p-6" style={{ borderColor: `rgba(${AR},.3)`, background: `rgba(${AR},.05)` }}>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: `rgba(${AR},.15)` }}>
                  <CheckCircle2 size={14} style={{ color: A }} />
                </div>
                <span className="text-sm font-bold" style={{ color: A }}>Vidéo montée pro</span>
              </div>
              {/* Clean timeline */}
              <div className="mb-5 rounded-xl border border-white/[.06] bg-black/20 p-3 space-y-1.5">
                {[
                  [{ w: "28%", c: AR }, { w: "35%", c: PR }, { w: "30%", c: AR }],
                  [{ w: "93%", c: "96,165,250" }],
                  [{ w: "45%", c: "74,222,128" }],
                ].map((row, ri) => (
                  <div key={ri} className="flex h-4 gap-0.5">
                    {row.map(({ w, c }, ci) => (
                      <div key={ci} className="h-full rounded-sm" style={{ width: w, background: `rgba(${c},.28)`, borderLeft: `2px solid rgba(${c},.7)` }} />
                    ))}
                  </div>
                ))}
              </div>
              <ul className="space-y-2">
                {["Meilleures séquences sélectionnées", "Rythme maîtrisé, durée optimisée", "Audio mixé, musique calée au montage", "Transitions propres et dynamiques", "Sous-titres + habillage visuel intégré", "Export format natif pour chaque réseau"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/70">
                    <CheckCircle2 size={11} style={{ color: A, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── VALEUR BUSINESS ───────────────────────────────────────────── */}
      <section className="bg-[#0e0b18] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Impact mesurable</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que le bon montage change concrètement</motion.h2>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {VALEUR.map(({ icon: Icon, c, r, stat, label, desc }) => (
              <motion.div key={label} variants={cardReveal}
                className="group rounded-2xl border border-white/[.1] bg-white/[.05] p-6 text-center transition-all duration-300 hover:border-white/[.2] hover:bg-white/[.08]">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `rgba(${r},.1)` }}>
                  <Icon size={18} style={{ color: c }} />
                </div>
                <p className="mb-0.5 text-2xl font-black" style={{ color: c }}>{stat}</p>
                <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-wide text-white/80">{label}</p>
                <p className="text-[0.65rem] leading-relaxed text-white/45">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Questions fréquentes</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Tout ce que vous voulez savoir</motion.h2>
          </motion.div>
          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <FaqItem key={i} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0e0b18] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
            style={{ background: `radial-gradient(ellipse,rgba(${AR},.5) 0%,transparent 65%)` }} />
          <div className="absolute -right-20 top-10 h-[250px] w-[350px] rounded-full opacity-10"
            style={{ background: `radial-gradient(ellipse,rgba(${PR},.5) 0%,transparent 70%)` }} />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ duration: 0.6, ease }}>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `rgba(${AR},.12)`, border: `1px solid rgba(${AR},.25)` }}>
              <Sparkles size={26} style={{ color: A }} />
            </div>
            <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Prêt à donner vie à votre vidéo ?</h2>
            <p className="mb-8 mx-auto max-w-md text-sm leading-relaxed text-white/50">
              Confiez-nous vos rushs. On s'occupe du montage, du son, des sous-titres et de la livraison — vous n'avez plus qu'à publier.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact?besoin=Montage+vidéo" className="btn-primary px-9 py-4 text-base">
                Demander un devis <ArrowRight size={16} />
              </Link>
              <Link href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-7 py-4 text-sm font-semibold text-white/60 transition-all hover:bg-white/[.08] hover:text-white">
                Tous nos services
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/25">Sans engagement · Réponse sous 24h · Devis gratuit</p>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
