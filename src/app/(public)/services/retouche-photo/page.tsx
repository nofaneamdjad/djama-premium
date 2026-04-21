"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, ChevronDown,
  ChevronLeft, ChevronRight, Zap, Sun, Palette, Crop, Layers,
  ShoppingBag, User, Star, TrendingUp, BadgeCheck, Monitor,
  Image, Scissors, Eye, Printer, Hash,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import { getSupabase } from "@/lib/supabase";
import type { PhotoRetouchRow } from "@/types/db";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Palette warm rose / magenta / photography ── */
const A  = "#ec4899";
const AR = "236,72,153";
const R  = "#f43f5e";
const RR = "244,63,94";

/* ═══════════════════════════════ DATA ═══════════════════════════════════════ */

const TYPES = [
  { icon: User,       c: A,         r: AR,            title: "Retouche portrait",         desc: "Correction naturelle de la peau, yeux, lumière — rendu humain et professionnel sans effet plastique." },
  { icon: Sparkles,   c: R,         r: RR,            title: "Retouche beauté",            desc: "Lissage de peau, correction du teint, mise en valeur des traits — pour shootings beauté ou mode." },
  { icon: Sun,        c: "#f9a826", r: "249,168,38",  title: "Correction lumière / couleurs",desc: "Balance des blancs, exposition, ombres, tons — récupération de photos sur ou sous-exposées." },
  { icon: Zap,        c: "#60a5fa", r: "96,165,250",  title: "Amélioration qualité",       desc: "Netteté, débruitage, upscaling IA, suppression du flou de bougé — on optimise chaque pixel." },
  { icon: Eye,        c: "#4ade80", r: "74,222,128",  title: "Suppression d'objets",       desc: "Suppression de distractions, personnes, logos, ombres indésirables ou éléments parasites." },
  { icon: Scissors,   c: A,         r: AR,            title: "Détourage",                  desc: "Extraction précise d'un sujet pour fond transparent (PNG) ou remplacement de fond." },
  { icon: Image,      c: R,         r: RR,            title: "Fond transparent / blanc",   desc: "Détourage + fond blanc/transparent pour fiches produits, marketplaces, catalogues." },
  { icon: ShoppingBag,c: "#f9a826", r: "249,168,38",  title: "Retouche produit e-commerce",desc: "Photos produits prêtes pour Amazon, Shopify, Etsy — normes de dimension et fond respectées." },
  { icon: Layers,     c: "#60a5fa", r: "96,165,250",  title: "Harmonisation catalogue",    desc: "Traitement cohérent d'une série complète — même ambiance, tons, lumière sur toutes les photos." },
  { icon: Printer,    c: "#4ade80", r: "74,222,128",  title: "Préparation impression / web",desc: "Export optimisé selon l'usage : 300 dpi CMJN pour le print, 72 dpi RGB optimisé pour le web." },
];

const PROCESSUS = [
  { num: "01", icon: Camera,       c: "#c9a55a", r: "201,165,90",  title: "Réception des fichiers",  desc: "Envoyez vos photos (RAW, JPEG, PNG) via WeTransfer, Drive ou email avec vos indications." },
  { num: "02", icon: Eye,          c: "#60a5fa", r: "96,165,250",  title: "Analyse du besoin",        desc: "On identifie le niveau de retouche requis, les éléments à corriger et le rendu souhaité." },
  { num: "03", icon: Palette,      c: A,         r: AR,            title: "Retouche & traitement",    desc: "Chaque photo est traitée individuellement avec les outils professionnels adaptés." },
  { num: "04", icon: CheckCircle2, c: "#4ade80", r: "74,222,128",  title: "Validation client",        desc: "Vous recevez les photos pour validation. 2 rounds de retours sont inclus." },
  { num: "05", icon: Zap,          c: R,         r: RR,            title: "Export & livraison",       desc: "Fichiers livrés dans le(s) format(s) demandé(s) — JPEG, PNG, PDF HD selon l'usage." },
];

const VALEUR = [
  { icon: TrendingUp, c: A,         r: AR,            stat: "↑ 40%",  label: "de conversions",    desc: "Les fiches produits avec photos retouchées convertissent significativement mieux." },
  { icon: BadgeCheck, c: R,         r: RR,            stat: "×2",     label: "de crédibilité",    desc: "Un visuel soigné génère instantanément confiance et perception premium de la marque." },
  { icon: Star,       c: "#f9a826", r: "249,168,38",  stat: "3 s",    label: "pour convaincre",   desc: "En 3 secondes votre photo doit accrocher — la qualité visuelle est décisive." },
  { icon: Layers,     c: "#60a5fa", r: "96,165,250",  stat: "100%",   label: "cohérence garantie",desc: "Séries traitées avec le même soin — feed, catalogue, site parfaitement harmonisés." },
  { icon: Monitor,    c: "#4ade80", r: "74,222,128",  stat: "↑ 65%",  label: "d'engagement",      desc: "Les visuels premium génèrent plus de partages, de clics et d'interactions sur tous réseaux." },
];

const FAQ_ITEMS = [
  { q: "Quels formats de fichiers acceptez-vous ?",          a: "Nous acceptons tous les formats courants : JPEG, PNG, RAW (CR2, NEF, ARW…), TIFF, PSD, WebP. Plus la résolution source est élevée, meilleur sera le résultat final. Idéalement envoyez les fichiers originaux non compressés." },
  { q: "Combien de modifications sont incluses ?",           a: "2 rounds de retours sont inclus dans chaque commande. Vous réceptionnez les photos retouchées, donnez vos feedbacks, et on affine. Des modifications supplémentaires peuvent être ajoutées sur devis si nécessaire." },
  { q: "Dans quels formats livrez-vous les retouches ?",     a: "JPEG haute qualité, PNG (avec ou sans fond transparent), TIFF pour l'impression. Les fichiers sont exportés aux dimensions et résolutions exactes de votre usage — web, réseaux sociaux, impression, marketplace." },
  { q: "Quel est le délai de livraison ?",                   a: "2 à 5 jours ouvrés selon le nombre de visuels et le niveau de retouche. Pour les lots importants (20+ photos), un planning spécifique est établi lors du devis. Un délai express est possible sur demande." },
  { q: "Proposez-vous des tarifs dégressifs pour les séries ?",a: "Oui, les commandes de 10+ photos bénéficient de tarifs dégressifs. Plus le lot est important, plus le tarif unitaire diminue. Demandez un devis en précisant le volume pour obtenir le meilleur tarif." },
  { q: "Pouvez-vous harmoniser toute une série de photos ?", a: "Absolument, c'est l'un de nos points forts. On traite chaque photo individuellement mais avec une direction artistique cohérente — même ambiance, mêmes tons, même luminosité sur toute la série, pour un rendu catalogue ou feed parfait." },
];

const PLACEHOLDER_COMPARISONS = [
  {
    label: "Portrait",
    beforeGrad: `linear-gradient(135deg,rgba(60,60,80,.9) 0%,rgba(40,40,60,.95) 100%)`,
    afterGrad:  `linear-gradient(135deg,rgba(${AR},.35) 0%,rgba(${RR},.2) 100%)`,
    beforeDesc: "Peau terne, lumière froide, ombres dures",
    afterDesc:  "Peau lissée, lumière dorée, rendu naturel",
  },
  {
    label: "Produit e-commerce",
    beforeGrad: `linear-gradient(135deg,rgba(80,70,60,.85) 0%,rgba(50,50,50,.9) 100%)`,
    afterGrad:  `linear-gradient(135deg,rgba(96,165,250,.25) 0%,rgba(${AR},.15) 100%)`,
    beforeDesc: "Fond encombré, couleurs ternes, reflets",
    afterDesc:  "Fond blanc propre, couleurs fidèles, net",
  },
  {
    label: "Correction couleurs",
    beforeGrad: `linear-gradient(135deg,rgba(30,80,120,.75) 0%,rgba(40,60,100,.85) 100%)`,
    afterGrad:  `linear-gradient(135deg,rgba(249,168,38,.25) 0%,rgba(${RR},.2) 100%)`,
    beforeDesc: "Balance des blancs froide, sous-exposé",
    afterDesc:  "Tons chauds naturels, exposition équilibrée",
  },
];

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "all",          label: "Tous" },
  { key: "portrait",    label: "Portrait" },
  { key: "beaute",      label: "Beauté" },
  { key: "produit",     label: "Produit" },
  { key: "ecommerce",   label: "E-commerce" },
  { key: "detourage",   label: "Détourage" },
  { key: "couleur",     label: "Couleurs" },
];

const CATEGORY_LABELS: Record<string, string> = {
  portrait: "Portrait", beaute: "Beauté", produit: "Produit",
  ecommerce: "E-commerce", pub: "Publicité", detourage: "Détourage",
  amelioration: "Amélioration", couleur: "Couleurs", impression: "Impression", autre: "Autre",
};

/* ═══════════════════════════════ COMPOSANT SLIDER ═══════════════════════════ */

function BeforeAfterSlider({ before, after, title, category }: {
  before: string; after: string; title: string; category: string;
}) {
  const [pos, setPos]         = useState(50);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Petite animation d'intro pour montrer l'interactivité
  useEffect(() => {
    const t1 = setTimeout(() => setPos(28), 600);
    const t2 = setTimeout(() => setPos(50), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const getPos = useCallback((clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos(Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[.1] shadow-xl">
      <div
        ref={ref}
        className="relative select-none overflow-hidden"
        style={{ aspectRatio: "4/3", cursor: dragging ? "grabbing" : "col-resize" }}
        onMouseDown={(e) => { setDragging(true); getPos(e.clientX); }}
        onMouseMove={(e) => { if (dragging) getPos(e.clientX); }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={(e) => { setDragging(true); getPos(e.touches[0].clientX); }}
        onTouchMove={(e) => { getPos(e.touches[0].clientX); }}
        onTouchEnd={() => setDragging(false)}
      >
        {/* Après — fond permanent, pleine largeur */}
        <img src={after} alt="Après retouche"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false} />
        {/* Avant — clipPath depuis la gauche */}
        <img src={before} alt="Avant retouche"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          draggable={false} />
        {/* Ligne de séparation */}
        <div className="pointer-events-none absolute inset-y-0 w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,.6)]"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
          {/* Poignée */}
          <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-2xl">
            <ChevronLeft size={11} className="text-gray-600" />
            <ChevronRight size={11} className="text-gray-600" />
          </div>
        </div>
        {/* Label AVANT */}
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white"
          style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)" }}>AVANT</div>
        {/* Label APRÈS */}
        <div className="pointer-events-none absolute right-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white"
          style={{ background: `rgba(${AR},.8)`, backdropFilter: "blur(6px)" }}>APRÈS</div>
        {/* Hint glisser */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[9px] text-white/70"
          style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)" }}>
          ← Glisser pour comparer →
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/[.07] bg-white/[.03] px-4 py-3">
        <div>
          <p className="text-xs font-bold text-white">{title}</p>
          <p className="text-[0.62rem] capitalize text-white/40">{CATEGORY_LABELS[category] ?? category}</p>
        </div>
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: A }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════ FAQ ════════════════════════════════════════ */

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="cursor-pointer rounded-2xl border border-[rgba(255,255,255,.12)] bg-white transition-all duration-200 hover:border-[rgba(236,72,153,.35)] hover:shadow-md" onClick={onToggle}>
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

export default function RetouchePhotoPage() {
  const [openFaq, setOpenFaq]       = useState<number | null>(null);
  const [projects, setProjects]     = useState<PhotoRetouchRow[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [filter, setFilter]         = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getSupabase()
          .from("photo_retouches")
          .select("*")
          .eq("status", "published")
          .order("sort_order", { ascending: true });
        setProjects((data ?? []) as PhotoRetouchRow[]);
      } catch { setProjects([]); }
      finally { setGalleryLoading(false); }
    }
    load();
  }, []);

  const withComparison = projects.filter(p => p.before_url && p.after_url);
  const filtered = filter === "all" ? projects : projects.filter(p => p.category === filter);

  return (
    <main>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#09090b] pb-16 pt-24 sm:pb-28 sm:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/2 h-[600px] w-[700px] -translate-x-1/2 rounded-full opacity-20"
            style={{ background: `radial-gradient(ellipse,rgba(${AR},.6) 0%,transparent 65%)` }} />
          <div className="absolute -right-10 top-1/4 h-[350px] w-[400px] rounded-full opacity-10"
            style={{ background: `radial-gradient(ellipse,rgba(${RR},.5) 0%,transparent 70%)` }} />
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
                <Camera size={13} /> Retouche & traitement d'images
              </motion.div>
              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                <MultiLineReveal lines={["Retouche photo", "professionnelle"]}
                  highlight={1} stagger={0.12} wordStagger={0.05} delay={0.08} lineClassName="justify-start" />
              </h1>
              <FadeReveal delay={0.22}>
                <p className="mb-8 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
                  Portraits, produits, catalogues, visuels pub — nous transformons chaque image brute en visuel impeccable, prêt à publier ou imprimer.
                </p>
              </FadeReveal>
              <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="mb-8 flex flex-wrap gap-3">
                {[
                  { label: "À partir de 30€", sub: "par visuel / lot" },
                  { label: "2–5 jours",        sub: "délai de livraison" },
                  { label: "2 retours",        sub: "inclus" },
                ].map(({ label, sub }) => (
                  <div key={label} className="rounded-2xl border border-white/[.08] bg-white/[.04] px-5 py-3 text-center">
                    <p className="text-base font-extrabold" style={{ color: A }}>{label}</p>
                    <p className="text-[0.62rem] text-white/35">{sub}</p>
                  </div>
                ))}
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.38 }}>
                <Link href="/contact?besoin=Retouche+photo" className="btn-primary px-8 py-4 text-base">
                  Demander un devis <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>

            {/* Right: photo editor mockup */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.15 }}
              className="relative mx-auto w-full max-w-lg rounded-2xl border border-white/[.1] overflow-hidden shadow-2xl"
              style={{ background: "#0d0d11" }}>
              {/* Title bar */}
              <div className="flex items-center gap-2.5 border-b border-white/[.07] px-4 py-2.5">
                <div className="flex gap-1.5">
                  {["#ef4444","#f9a826","#4ade80"].map(c => (
                    <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span className="flex-1 text-center text-[10px] text-white/30 font-mono">djama_portrait_0042.raw</span>
                <Camera size={11} className="text-white/20" />
              </div>

              {/* Main editor layout */}
              <div className="grid grid-cols-[36px_1fr_110px]">
                {/* Left toolbar */}
                <div className="flex flex-col items-center gap-2 border-r border-white/[.06] py-3 px-1.5">
                  {[
                    { icon: Crop,    c: AR, active: false },
                    { icon: Sun,     c: AR, active: true  },
                    { icon: Palette, c: AR, active: false },
                    { icon: Eye,     c: AR, active: false },
                    { icon: Scissors,c: AR, active: false },
                  ].map(({ icon: Icon, c, active }, i) => (
                    <div key={i} className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                      style={{ background: active ? `rgba(${c},.2)` : "transparent" }}>
                      <Icon size={13} style={{ color: active ? `rgb(${c})` : "rgba(255,255,255,.25)" }} />
                    </div>
                  ))}
                </div>

                {/* Center: image preview */}
                <div className="relative flex items-center justify-center p-3"
                  style={{ minHeight: 180, background: "rgba(0,0,0,.15)" }}>
                  <div className="relative w-full overflow-hidden rounded-lg"
                    style={{ aspectRatio: "4/3", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
                    {/* Simulated photo — before half dull, after half warm */}
                    <div className="absolute inset-0 grid grid-cols-2">
                      <div style={{ background: "linear-gradient(135deg,rgba(70,65,85,.8) 0%,rgba(50,48,65,.9) 100%)" }} />
                      <div style={{ background: `linear-gradient(135deg,rgba(${AR},.25) 0%,rgba(${RR},.15) 100%)` }} />
                    </div>
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-[.05]"
                      style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "25% 25%" }} />
                    {/* Center divider */}
                    <div className="absolute inset-y-0 left-1/2 w-[1.5px] bg-white/70" style={{ transform: "translateX(-50%)" }}>
                      <div className="absolute top-1/2 left-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                        <ChevronLeft size={8} className="text-gray-600" />
                        <ChevronRight size={8} className="text-gray-600" />
                      </div>
                    </div>
                    <span className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[7.5px] font-bold text-white/70"
                      style={{ background: "rgba(0,0,0,.55)" }}>AVANT</span>
                    <span className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[7.5px] font-bold text-white"
                      style={{ background: `rgba(${AR},.7)` }}>APRÈS</span>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full px-3 py-1"
                    style={{ background: "rgba(0,0,0,.5)" }}>
                    <span className="text-[8px] font-mono text-white/40">3840 × 2560 px</span>
                    <span className="text-[8px] text-white/20">·</span>
                    <span className="text-[8px] font-bold" style={{ color: "#4ade80" }}>100%</span>
                  </div>
                </div>

                {/* Right: adjustments panel */}
                <div className="border-l border-white/[.06] px-2.5 py-3 space-y-3">
                  <p className="text-[8px] uppercase tracking-widest text-white/25">Ajustements</p>
                  {[
                    { label: "Exposition",  val: 35, c: AR },
                    { label: "Contraste",   val: 28, c: RR },
                    { label: "Saturation",  val: 22, c: "249,168,38" },
                    { label: "Clarté",      val: 18, c: AR },
                    { label: "Netteté",     val: 40, c: "96,165,250" },
                    { label: "Débruitage",  val: 15, c: "74,222,128" },
                  ].map(({ label, val, c }) => (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[8px] text-white/45">{label}</span>
                        <span className="text-[8px] font-bold" style={{ color: `rgb(${c})` }}>+{val}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.08)" }}>
                        <motion.div className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg,rgba(${c},.7),rgba(${c},1))` }}
                          initial={{ width: "0%" }}
                          animate={{ width: `${val + 35}%` }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 + Math.random() * 0.4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom status bar */}
              <div className="flex items-center justify-between border-t border-white/[.07] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: A }} />
                  <span className="text-[9px] text-white/35">Traitement en cours… 87%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded px-2 py-0.5 text-[9px] font-bold"
                    style={{ background: `rgba(${AR},.15)`, color: A }}>JPEG · 300dpi</span>
                  <span className="text-[9px] text-white/20">Lot 3/8</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── PRÉSENTATION ──────────────────────────────────────────────── */}
      <section className="bg-[#110815] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}>
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>L'image comme levier</motion.p>
              <motion.h2 variants={fadeIn} className="mb-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Une image brute perd jusqu'à 40% de son impact
              </motion.h2>
              <motion.p variants={fadeIn} className="text-sm leading-relaxed text-white/60">
                90% des décisions d'achat en ligne sont influencées par la qualité visuelle du produit. Pourtant, la majorité des photos brutes sont sous-exposées, mal cadrées ou manquent de cohérence chromatique. Le résultat : un manque de crédibilité qui coûte des ventes.
              </motion.p>
              <motion.p variants={fadeIn} className="mt-4 text-sm leading-relaxed text-white/60">
                La retouche professionnelle n'est pas de la tromperie — c'est du soin. On révèle ce que la photo contient déjà : lumière, détail, profondeur, cohérence. Chaque pixel compte quand il s'agit de l'image de votre marque.
              </motion.p>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="grid grid-cols-2 gap-4">
              {[
                { stat: "90%",  label: "des décisions d'achat influencées par la qualité visuelle",   c: A,         r: AR },
                { stat: "+40%", label: "de conversions avec des photos produits retouchées",           c: R,         r: RR },
                { stat: "3s",   label: "pour que votre image convainque — ou fasse fuir",              c: "#f9a826", r: "249,168,38" },
                { stat: "×3",   label: "plus d'engagement sur les réseaux avec visuels soignés",       c: "#4ade80", r: "74,222,128" },
              ].map(({ stat, label, c, r }) => (
                <motion.div key={stat} variants={cardReveal}
                  className="rounded-2xl border border-white/[.08] bg-white/[.04] p-5 text-center">
                  <p className="mb-1 text-3xl font-black" style={{ color: c }}>{stat}</p>
                  <p className="text-[0.67rem] leading-relaxed text-white/45">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TYPES DE RETOUCHES ────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Nos prestations</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Tous types de retouches</motion.h2>
            <motion.p variants={fadeIn} className="mt-4 mx-auto max-w-xl text-sm text-white/55">
              Du portrait beauté à la photo produit e-commerce — on maîtrise chaque technique de traitement d'image.
            </motion.p>
          </motion.div>
          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {TYPES.map(({ icon: Icon, c, r, title, desc }) => (
              <motion.div key={title} variants={cardReveal}
                className="group rounded-2xl border border-white/[.1] bg-white/[.05] p-5 transition-all duration-300 hover:border-white/[.2] hover:bg-white/[.09]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `rgba(${r},.1)` }}>
                  <Icon size={17} style={{ color: c }} />
                </div>
                <h3 className="mb-1.5 text-xs font-bold leading-tight text-white">{title}</h3>
                <p className="text-[0.66rem] leading-relaxed text-white/50">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── AVANT / APRÈS ─────────────────────────────────────────────── */}
      <section className="bg-[#110815] py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>La transformation</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Avant / Après — la différence se voit</motion.h2>
            <motion.p variants={fadeIn} className="mt-4 mx-auto max-w-lg text-sm text-white/50">
              Glissez le curseur sur chaque image pour voir la transformation.
            </motion.p>
          </motion.div>

          {withComparison.length > 0 ? (
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {withComparison.slice(0, 6).map(p => (
                <motion.div key={p.id} variants={cardReveal}>
                  <BeforeAfterSlider
                    before={p.before_url!}
                    after={p.after_url}
                    title={p.title}
                    category={p.category}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Placeholder comparisons — CSS artistique */
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="grid gap-6 sm:grid-cols-3">
              {PLACEHOLDER_COMPARISONS.map(({ label, beforeGrad, afterGrad, beforeDesc, afterDesc }) => (
                <motion.div key={label} variants={cardReveal}
                  className="overflow-hidden rounded-2xl border border-white/[.1] shadow-xl">
                  {/* Faux slider statique illustratif */}
                  <div className="relative" style={{ aspectRatio: "4/3" }}>
                    <div className="grid h-full grid-cols-2">
                      <div className="flex flex-col items-center justify-center gap-2 p-4 text-center" style={{ background: beforeGrad }}>
                        <span className="rounded-lg px-2 py-1 text-[10px] font-bold text-white/80"
                          style={{ background: "rgba(0,0,0,.5)" }}>AVANT</span>
                        <p className="text-[0.62rem] leading-relaxed text-white/40">{beforeDesc}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2 p-4 text-center" style={{ background: afterGrad }}>
                        <span className="rounded-lg px-2 py-1 text-[10px] font-bold text-white"
                          style={{ background: `rgba(${AR},.75)` }}>APRÈS</span>
                        <p className="text-[0.62rem] leading-relaxed text-white/60">{afterDesc}</p>
                      </div>
                    </div>
                    {/* Divider central */}
                    <div className="absolute inset-y-0 left-1/2 w-[1.5px] bg-white/50" style={{ transform: "translateX(-50%)" }}>
                      <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg">
                        <ChevronLeft size={10} className="text-gray-500" />
                        <ChevronRight size={10} className="text-gray-500" />
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-2 text-center">
                      <span className="text-[8px] text-white/25">Exemple illustratif · Vos projets ici depuis l'admin</span>
                    </div>
                  </div>
                  <div className="border-t border-white/[.07] bg-white/[.03] px-4 py-3">
                    <p className="text-xs font-bold text-white">{label}</p>
                    <p className="text-[0.62rem] text-white/35">Exemple de retouche</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ delay: 0.3, duration: 0.5, ease }} className="mt-10 text-center">
            <Link href="/contact?besoin=Retouche+photo" className="btn-primary px-8 py-3.5 text-sm">
              Faire retoucher mes photos <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── GALERIE PORTFOLIO ─────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Portfolio</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Nos réalisations</motion.h2>
          </motion.div>

          {/* Filtres */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {FILTER_TABS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <button key={key} onClick={() => setFilter(key)}
                  className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200"
                  style={active
                    ? { background: `linear-gradient(135deg,${A},${R})`, borderColor: "transparent", color: "#fff" }
                    : { borderColor: "rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.45)" }}>
                  {label}
                </button>
              );
            })}
          </div>

          {galleryLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white/[.06]" style={{ aspectRatio: "1" }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map((proj, i) => (
                  <motion.div key={proj.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.04]"
                    style={{ aspectRatio: "1" }}>
                    <img src={proj.after_url} alt={proj.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <p className="text-sm font-bold text-white">{proj.title}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                          style={{ background: `rgba(${AR},.3)`, color: A }}>
                          {CATEGORY_LABELS[proj.category] ?? proj.category}
                        </span>
                        {proj.before_url && (
                          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[9px] text-white/60">Avant/Après dispo</span>
                        )}
                      </div>
                      {proj.description && (
                        <p className="mt-1.5 text-[0.62rem] leading-relaxed text-white/55 line-clamp-2">{proj.description}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Portrait", c: AR },
                  { label: "Beauté",   c: RR },
                  { label: "Produit",  c: "249,168,38" },
                  { label: "E-commerce",c: "96,165,250" },
                  { label: "Détourage",c: "74,222,128" },
                  { label: "Couleurs", c: AR },
                  { label: "Corporate",c: RR },
                  { label: "Catalogue",c: "249,168,38" },
                ].map(({ label, c }) => (
                  <div key={label} className="relative overflow-hidden rounded-2xl border"
                    style={{ aspectRatio: "1", background: `linear-gradient(135deg,rgba(${c},.15),rgba(${c},.05))`, borderColor: `rgba(${c},.2)` }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <Image size={20} style={{ color: `rgb(${c})`, opacity: 0.5 }} />
                      <p className="text-[0.65rem] font-bold text-white/50">{label}</p>
                      <p className="text-[0.58rem] text-white/25">Bientôt disponible</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="mb-4 text-sm text-white/40">Nos premières réalisations seront publiées ici prochainement.</p>
                <Link href="/contact?besoin=Retouche+photo" className="btn-primary px-7 py-3 text-sm">
                  Démarrer mon projet <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── PROCESSUS ─────────────────────────────────────────────────── */}
      <section className="bg-[#110815] py-14 sm:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Notre méthode</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">5 étapes vers l'image parfaite</motion.h2>
          </motion.div>

          {/* Horizontal steps on desktop, vertical on mobile */}
          <div className="relative">
            {/* Connector line (desktop) */}
            <div className="absolute top-[27px] left-[10%] right-[10%] h-[2px] hidden lg:block"
              style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.08) 20%,rgba(255,255,255,.08) 80%,transparent)" }} />

            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="grid gap-4 lg:grid-cols-5">
              {PROCESSUS.map(({ num, icon: Icon, c, r, title, desc }) => (
                <motion.div key={num} variants={cardReveal} className="relative text-center lg:text-left">
                  {/* Step number + icon */}
                  <div className="relative mb-4 mx-auto lg:mx-0 flex h-14 w-14 flex-col items-center justify-center rounded-2xl border"
                    style={{ background: `rgba(${r},.1)`, borderColor: `rgba(${r},.25)` }}>
                    <span className="text-[0.55rem] font-bold leading-none" style={{ color: `rgba(${r},.7)` }}>{num}</span>
                    <Icon size={18} style={{ color: c }} />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold text-white">{title}</h3>
                  <p className="text-[0.67rem] leading-relaxed text-white/50">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VALEUR BUSINESS ───────────────────────────────────────────── */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
            <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: A }}>Impact concret</motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce qu'une belle image change vraiment</motion.h2>
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
                <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-wide text-white/80">{label}</p>
                <p className="text-[0.64rem] leading-relaxed text-white/45">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-[#110815] py-14 sm:py-24">
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
      <section className="relative overflow-hidden bg-[#09090b] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
            style={{ background: `radial-gradient(ellipse,rgba(${AR},.5) 0%,transparent 65%)` }} />
          <div className="absolute -left-20 bottom-10 h-[250px] w-[350px] rounded-full opacity-10"
            style={{ background: `radial-gradient(ellipse,rgba(${RR},.4) 0%,transparent 70%)` }} />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ duration: 0.6, ease }}>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `rgba(${AR},.12)`, border: `1px solid rgba(${AR},.25)` }}>
              <Sparkles size={26} style={{ color: A }} />
            </div>
            <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Prêt à sublimer vos images ?</h2>
            <p className="mb-8 mx-auto max-w-md text-sm leading-relaxed text-white/50">
              Envoyez-nous vos photos brutes — on s'occupe de la retouche, du format et de la livraison. Vous n'avez plus qu'à publier ou imprimer.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact?besoin=Retouche+photo" className="btn-primary px-9 py-4 text-base">
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
