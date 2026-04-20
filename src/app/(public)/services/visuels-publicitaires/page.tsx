"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  ArrowLeft, Star, Palette, TrendingUp, Download, ZoomIn,
  Zap, Image, Monitor, FileImage, Layers, Layout,
  Clock, Shield, BadgeCheck, HelpCircle, Printer,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import { getSupabase } from "@/lib/supabase";
import type { VisualRow } from "@/types/db";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Palette rose / fuchsia — design créatif ── */
const R  = "#f43f5e";
const RR = "244,63,94";
const R2 = "#e11d48";
const V  = "#c026d3";
const VR = "192,38,211";
const G  = "#c9a55a";
const GR = "201,165,90";

/* ═══════════════════════════════ DATA ═══════════════════════════════ */

const TYPES_DIGITAL = [
  { icon: Image,    c: R,        r: RR,           t: "Réseaux sociaux",             d: "Posts, carrousels, stories — tous formats pour Instagram, Facebook, LinkedIn, TikTok." },
  { icon: Megaphone,c: V,        r: VR,           t: "Publicités Facebook / Insta", d: "Creatives ads optimisées pour la conversion : single image, carousel, collection." },
  { icon: Monitor,  c: "#f9a826",r: "249,168,38", t: "Bannières web & display",     d: "Formats display Google Ads, bannières site web, habillage digital." },
  { icon: Layout,   c: "#4ade80",r: "74,222,128", t: "Visuels marketing & email",   d: "Newsletters, headers d'email, visuels promotionnels, covers LinkedIn." },
];

const TYPES_PRINT = [
  { icon: Printer,   c: R,        r: RR,           t: "Affiches publicitaires",   d: "Formats A0 à A3 — événements, promotions, vitrine. Fichiers prêts pour impression." },
  { icon: Layers,    c: V,        r: VR,           t: "Bâches publicitaires",     d: "Grands formats extérieurs, bâches de chantier, vitrophanie — haute résolution." },
  { icon: FileImage, c: "#f9a826",r: "249,168,38", t: "Banderoles",               d: "Banderoles événementielles ou commerçantes, tous formats, fichiers 300 dpi." },
  { icon: Image,     c: "#4ade80",r: "74,222,128", t: "Panneaux publicitaires",   d: "4×3, abribus, PLV — visuels conçus pour être lus à distance." },
  { icon: FileImage, c: R,        r: RR,           t: "Flyers & dépliants",       d: "A4, A5, DL — recto/verso, tryptique. Mise en page claire et attractive." },
  { icon: BadgeCheck,c: V,        r: VR,           t: "Cartes de visite",         d: "Design premium 85×55 mm, recto/verso, avec effets pelliculage ou dorure." },
];

const VALEUR = [
  { icon: Zap,       c: R,        r: RR,           t: "Impact immédiat",            d: "En 3 secondes, un visuel pro transmet votre message et capte l'attention de votre cible." },
  { icon: BadgeCheck,c: V,        r: VR,           t: "Crédibilité & confiance",    d: "Un design professionnel génère instantanément confiance et perception de qualité." },
  { icon: TrendingUp,c: "#f9a826",r: "249,168,38", t: "Meilleure conversion",       d: "Des visuels pensés pour déclencher l'action : CTA bien placé, hiérarchie visuelle maîtrisée." },
  { icon: Palette,   c: "#4ade80",r: "74,222,128", t: "Cohérence de marque",        d: "Vos couleurs, votre typographie, votre ton — une identité visuelle forte et reconnaissable." },
  { icon: Clock,     c: R,        r: RR,           t: "Prêts à utiliser",           d: "Formats natifs livrés (PNG/JPG/PDF HD) + sources éditables. Publiez ou imprimez directement." },
  { icon: Layers,    c: V,        r: VR,           t: "Multi-formats couverts",     d: "Une commande, toutes les déclinaisons : social, print, display — adaptation automatique." },
];

const PROCESSUS = [
  { icon: Megaphone,   c: G,        r: GR,           t: "Brief client",        d: "Objectifs, audience, message clé, références visuelles.",        dur: "J1"    },
  { icon: Palette,     c: R,        r: RR,           t: "Direction artistique", d: "Recherche créative, moodboard, direction typographique.",         dur: "J1–J2" },
  { icon: Sparkles,    c: V,        r: VR,           t: "Création",            d: "Design des visuels dans tous les formats demandés.",              dur: "J2–J3" },
  { icon: CheckCircle2,c: "#4ade80",r: "74,222,128", t: "Validation",          d: "2 rounds de retours inclus pour affiner chaque détail.",          dur: "J3–J4" },
  { icon: Download,    c: G,        r: GR,           t: "Livraison",           d: "PNG/JPG HD + sources éditables Figma, AI ou PSD.",               dur: "J4–J5" },
];

const FAQ = [
  { q: "Quels formats de fichiers livrez-vous ?",                a: "Tous les visuels sont livrés en PNG et JPEG haute résolution (300 dpi pour le print, 72–96 dpi pour le digital). Vous recevez également les sources éditables Figma, Adobe Illustrator (.AI) ou Photoshop (.PSD) selon votre demande." },
  { q: "Puis-je demander des modifications après livraison ?",   a: "2 rounds de modifications sont inclus dans chaque commande. Au-delà, des ajustements supplémentaires sont possibles sur devis, selon l'ampleur des changements demandés." },
  { q: "Gérez-vous aussi l'impression physique ?",               a: "Nous livrons des fichiers prêts à imprimer (300 dpi, profil CMJN, fond perdu inclus). L'impression en elle-même n'est pas gérée directement, mais nous pouvons vous orienter vers des imprimeurs partenaires." },
  { q: "Quel délai pour des visuels print (bâches, affiches) ?", a: "Le délai de livraison des fichiers est de 48 à 72h. Pour les grands formats complexes, comptez 3 à 5 jours ouvrés. L'impression est ensuite à prévoir avec votre imprimeur." },
  { q: "Comment vous transmettre mes éléments de marque ?",      a: "Via WeTransfer, Google Drive ou par email — logo haute résolution, charte graphique si disponible, polices. Si vous n'avez pas de charte, on définit ensemble une direction artistique cohérente." },
];

const PLACEHOLDER_CARDS = [
  { label: "Post Instagram", ratio: "1/1",  gr: `linear-gradient(135deg,rgba(${RR},.22),rgba(${VR},.12))`,     br: RR },
  { label: "Story",          ratio: "9/16", gr: `linear-gradient(180deg,rgba(${VR},.22),rgba(${RR},.12))`,     br: VR },
  { label: "Bannière",       ratio: "16/9", gr: `linear-gradient(90deg,rgba(249,168,38,.18),rgba(${RR},.12))`, br: "249,168,38" },
  { label: "Affiche",        ratio: "3/4",  gr: `linear-gradient(135deg,rgba(${VR},.18),rgba(74,222,128,.1))`, br: VR },
  { label: "Flyer",          ratio: "1/1",  gr: `linear-gradient(45deg,rgba(${RR},.18),rgba(249,168,38,.12))`, br: RR },
  { label: "Bâche",          ratio: "16/9", gr: `linear-gradient(90deg,rgba(${VR},.18),rgba(${RR},.12))`,      br: VR },
];

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
export default function VisuelsPublicitairesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [filter, setFilter]   = useState<"all" | "digital" | "print">("all");
  const [visuals, setVisuals] = useState<VisualRow[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getSupabase()
          .from("visuals")
          .select("*")
          .eq("status", "published")
          .order("sort_order", { ascending: true });
        setVisuals((data ?? []) as VisualRow[]);
      } catch {
        setVisuals([]);
      } finally {
        setGalleryLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === "all" ? visuals : visuals.filter(v => v.category === filter);

  return (
    <main className="bg-[#07070a] text-white overflow-x-hidden">

      {/* ══════════════ 1. HERO ══════════════ */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.016]"
            style={{ backgroundImage: `linear-gradient(rgba(${RR},.5) 1px,transparent 1px),linear-gradient(90deg,rgba(${RR},.5) 1px,transparent 1px)`, backgroundSize: "52px 52px" }} />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [.05, .13, .05] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-48 top-1/3 w-[700px] h-[700px] rounded-full blur-[150px]"
            style={{ background: `radial-gradient(circle,rgba(${RR},1) 0%,transparent 70%)` }} />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [.04, .09, .04] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: `radial-gradient(circle,rgba(${VR},1) 0%,transparent 70%)` }} />
          <div className="absolute right-1/3 bottom-0 w-[280px] h-[280px] rounded-full blur-[80px] opacity-[0.04]"
            style={{ background: `radial-gradient(circle,rgba(${GR},1) 0%,transparent 70%)` }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left */}
            <div>
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: .45, ease }} className="mb-5">
                <Link href="/services"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
                  <ArrowLeft size={11} /> Tous les services
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, ease, delay: .05 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[.72rem] font-bold"
                style={{ borderColor: `rgba(${RR},.3)`, background: `rgba(${RR},.08)`, color: R }}>
                <Palette size={11} /> Visuels publicitaires · Digital &amp; Print
                <span className="ml-1 rounded-full px-2 py-0.5 text-[.6rem] font-extrabold text-white"
                  style={{ background: R2 }}>À PARTIR DE 90€</span>
              </motion.div>

              <h1 className="mb-5 text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.07] tracking-tight">
                <MultiLineReveal
                  lines={["Visuels qui", "captivent,", "campagnes qui convertissent."]}
                  highlight={2}
                  stagger={.13}
                  wordStagger={.055}
                  delay={.08}
                  lineClassName="justify-start"
                />
              </h1>

              <FadeReveal delay={.28}>
                <p className="mb-7 max-w-lg text-base sm:text-lg leading-relaxed text-white/50">
                  Posts sponsorisés, stories, bâches, affiches, flyers — on crée tous vos visuels digitaux et print. Une seule équipe, tous vos supports de communication.
                </p>
              </FadeReveal>

              <FadeReveal delay={.36}>
                <div className="mb-7 inline-flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5"
                  style={{ borderColor: `rgba(${RR},.22)`, background: `rgba(${RR},.06)` }}>
                  <div>
                    <p className="text-[.65rem] font-bold uppercase tracking-widest text-white/35 mb-0.5">À partir de</p>
                    <p className="text-[1.6rem] font-extrabold leading-none" style={{ color: R }}>90€</p>
                    <p className="text-[.62rem] text-white/35 mt-0.5">par visuel ou pack</p>
                  </div>
                  <div className="h-12 w-px bg-white/[0.08]" />
                  <div className="space-y-1">
                    {["Livraison 24–72h", "2 retours inclus", "Sources éditables fournies"].map(t => (
                      <div key={t} className="flex items-center gap-1.5 text-xs text-white/55">
                        <CheckCircle2 size={11} className="shrink-0" style={{ color: R }} /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeReveal>

              <FadeReveal delay={.44}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact?besoin=Visuels+publicitaires"
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(244,63,94,0.32)]"
                    style={{ background: `linear-gradient(135deg,${R2},${R})`, color: "#fff" }}>
                    Demander un devis <ArrowRight size={15} />
                  </Link>
                  <a href="#galerie"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                    Voir la galerie
                  </a>
                </div>
              </FadeReveal>
            </div>

            {/* Right: creative mockup grid */}
            <motion.div
              initial={{ opacity: 0, y: 36, scale: .93 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: .85, ease, delay: .3 }}
              className="relative flex justify-center items-center"
            >
              <div className="pointer-events-none absolute inset-0 flex justify-center items-center">
                <div className="w-[380px] h-[340px] rounded-full blur-3xl opacity-[0.18]"
                  style={{ background: `radial-gradient(ellipse,rgba(${RR},.7) 0%,rgba(${VR},.4) 55%,transparent 75%)` }} />
              </div>

              <div className="relative grid grid-cols-2 gap-3 w-full max-w-[420px]">

                {/* Post Instagram — 1:1 */}
                <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: .22 }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{ aspectRatio: "1/1", background: `linear-gradient(135deg,rgba(${RR},.3),rgba(${VR},.18))`, border: `1px solid rgba(${RR},.22)` }}>
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full" style={{ background: `rgba(${RR},.5)` }} />
                      <div className="h-1.5 rounded-full w-12 bg-white/15" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-14 rounded-xl" style={{ background: `rgba(${RR},.2)` }} />
                      <div className="h-1.5 rounded-full w-3/4 bg-white/20" />
                      <div className="h-1.5 rounded-full w-1/2 bg-white/12" />
                      <div className="h-6 rounded-lg w-1/2" style={{ background: `linear-gradient(90deg,${R2},${R})` }} />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 text-[.48rem] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `rgba(${RR},.25)`, color: R }}>Post Insta</span>
                </motion.div>

                {/* Story — 9:16 */}
                <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: .22 }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{ aspectRatio: "9/16", background: `linear-gradient(180deg,rgba(${VR},.3),rgba(${RR},.12))`, border: `1px solid rgba(${VR},.22)` }}>
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <div className="h-1.5 rounded-full w-full bg-white/12" />
                    <div className="space-y-2">
                      <div className="h-16 rounded-xl" style={{ background: `rgba(${VR},.22)` }} />
                      <div className="h-1.5 rounded-full bg-white/18" />
                      <div className="h-1.5 rounded-full w-2/3 bg-white/10" />
                      <div className="h-7 rounded-full flex items-center justify-center" style={{ background: V }}>
                        <div className="h-1.5 rounded-full w-16 bg-white/60" />
                      </div>
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 text-[.48rem] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `rgba(${VR},.25)`, color: V }}>Story 9:16</span>
                </motion.div>

                {/* Bâche — 16:5 wide */}
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: .22 }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer col-span-2"
                  style={{ aspectRatio: "16/5", background: "linear-gradient(90deg,rgba(249,115,22,.22),rgba(244,63,94,.14))", border: "1px solid rgba(249,115,22,.22)" }}>
                  <div className="absolute inset-0 flex items-center gap-4 px-4">
                    <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: "rgba(249,115,22,.3)" }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 rounded-full w-2/3 bg-white/22" />
                      <div className="h-1.5 rounded-full w-1/2 bg-white/12" />
                    </div>
                    <div className="h-7 w-16 rounded-lg shrink-0"
                      style={{ background: "linear-gradient(90deg,rgba(249,115,22,.55),rgba(244,63,94,.45))" }} />
                  </div>
                  <span className="absolute bottom-1.5 right-2 text-[.48rem] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(249,115,22,.2)", color: "#fb923c" }}>Bâche / Bannière</span>
                </motion.div>

                {/* Flyer — 2:1 */}
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: .22 }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer col-span-2"
                  style={{ aspectRatio: "2/1", background: `linear-gradient(135deg,rgba(${VR},.22),rgba(74,222,128,.1))`, border: `1px solid rgba(${VR},.18)` }}>
                  <div className="absolute inset-0 flex items-center gap-5 px-5">
                    <div className="space-y-2 flex-1">
                      <div className="h-3 rounded-full w-3/4 bg-white/22" />
                      <div className="h-1.5 rounded-full w-full bg-white/14" />
                      <div className="h-1.5 rounded-full w-2/3 bg-white/10" />
                      <div className="h-7 rounded-xl w-1/3 mt-1" style={{ background: `linear-gradient(90deg,${V},rgba(${VR},.7))` }} />
                    </div>
                    <div className="w-14 h-18 rounded-xl shrink-0" style={{ background: `rgba(${VR},.22)`, height: "4.5rem" }} />
                  </div>
                  <span className="absolute bottom-1.5 right-2 text-[.48rem] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `rgba(${VR},.22)`, color: V }}>Flyer A5</span>
                </motion.div>
              </div>

              {/* Chips */}
              <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
                className="absolute -top-3 -right-1 sm:right-0 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                style={{ background: "#14141c" }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: `rgba(${RR},.15)` }}>
                    <Megaphone size={9} style={{ color: R }} />
                  </div>
                  <div>
                    <p className="text-[.58rem] font-bold text-white">Instagram + Facebook</p>
                    <p className="text-[.5rem] text-white/35">Formats natifs optimisés</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 }}
                className="absolute top-1/3 -left-1 sm:-left-4 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                style={{ background: "#14141c" }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: `rgba(${VR},.15)` }}>
                    <Printer size={9} style={{ color: V }} />
                  </div>
                  <div>
                    <p className="text-[.58rem] font-bold text-white">Print &amp; Digital</p>
                    <p className="text-[.5rem] text-white/35">Tous supports couverts</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 right-4 sm:right-8 rounded-xl border px-3.5 py-2 hidden sm:flex items-center gap-2"
                style={{ borderColor: `rgba(${RR},.28)`, background: `rgba(${RR},.08)` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: R }} />
                <p className="text-[.58rem] font-semibold" style={{ color: R }}>Livraison en 72h</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ STATS BAR ══════════════ */}
      <div className="border-y border-white/[0.05] py-5 px-5"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            ["24–72h", "Délai de livraison",             RR],
            ["2",      "Retours inclus",                  VR],
            ["+300",   "Visuels créés",                   "249,168,38"],
            ["100%",   "Sources éditables fournies",      GR],
          ].map(([v, l, c]) => (
            <motion.div key={l} {...fadeIn} viewport={viewport} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold mb-0.5" style={{ color: `rgba(${c},.9)` }}>{v}</p>
              <p className="text-[.68rem] text-white/40 font-medium">{l}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══════════════ 2. PRÉSENTATION ══════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div {...staggerContainer} viewport={viewport}>
              <motion.div variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-5">
                <Palette size={12} style={{ color: R }} /> L&apos;importance du visuel
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-5 leading-tight">
                En 3 secondes, votre visuel<br />
                <span style={{ color: R }}>dit tout sur votre marque.</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 leading-relaxed mb-5">
                Avant de lire un mot, votre cible voit votre visuel. Un design professionnel <strong className="text-white/75">inspire confiance, capte l&apos;attention et incite à l&apos;action</strong>. Un visuel amateur fait l&apos;effet inverse — même si le produit est excellent.
              </motion.p>
              <motion.p variants={fadeIn} className="text-white/50 leading-relaxed mb-7">
                Nos créations couvrent 100% de vos besoins : réseaux sociaux, publicités, impression grand format — une identité visuelle cohérente sur tous vos supports.
              </motion.p>
              <motion.div variants={fadeIn}>
                <Link href="/contact?besoin=Visuels+publicitaires"
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: `linear-gradient(135deg,${R2},${R})`, color: "#fff" }}>
                  Demander un devis <ArrowRight size={14} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .6, ease }}
              className="relative rounded-3xl border overflow-hidden"
              style={{ borderColor: `rgba(${RR},.15)`, background: `rgba(${RR},.04)` }}
            >
              <div className="h-px w-full"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${RR},.5),rgba(${VR},.4),transparent)` }} />
              <div className="p-7">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-2xl border border-red-500/12 p-4" style={{ background: "rgba(239,68,68,.03)" }}>
                    <p className="text-[.6rem] font-bold uppercase tracking-widest text-red-400/55 mb-3">Sans designer</p>
                    <div className="space-y-2">
                      {["Rendu amateur", "Incohérence visuelle", "Peu mémorable", "CTR faible"].map(t => (
                        <div key={t} className="flex items-center gap-1.5 text-[.68rem] text-white/38">
                          <div className="w-1 h-1 rounded-full bg-red-400/35 shrink-0" />{t}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-4"
                    style={{ borderColor: `rgba(${RR},.18)`, background: `rgba(${RR},.05)` }}>
                    <p className="text-[.6rem] font-bold uppercase tracking-widest mb-3" style={{ color: R }}>Avec DJAMA</p>
                    <div className="space-y-2">
                      {["Rendu agence premium", "Identité cohérente", "Mémorable & distinctif", "Conversion optimisée"].map(t => (
                        <div key={t} className="flex items-center gap-1.5 text-[.68rem] text-white/65">
                          <CheckCircle2 size={10} className="shrink-0" style={{ color: R }} />{t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] p-4 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,.02)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `rgba(${GR},.15)` }}>
                    <Star size={16} style={{ color: G }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">+40% de CTR en moyenne</p>
                    <p className="text-[.62rem] text-white/38">Constaté sur les campagnes Meta de nos clients vs. visuels précédents</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ 3. TYPES DE VISUELS ══════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Layers size={12} style={{ color: R }} /> Formats proposés
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Digital <span style={{ color: R }}>et print</span> — tout couvert
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Du post Instagram à la bâche 3 mètres — une seule équipe pour tous vos supports.
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Digital */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .55, ease }}
              className="rounded-3xl border overflow-hidden"
              style={{ borderColor: `rgba(${RR},.18)`, background: `rgba(${RR},.04)` }}
            >
              <div className="h-px w-full"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${RR},.5),transparent)` }} />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `rgba(${RR},.12)` }}>
                    <Monitor size={16} style={{ color: R }} />
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-sm">Digital</p>
                    <p className="text-[.62rem] text-white/40">Réseaux sociaux &amp; publicités</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {TYPES_DIGITAL.map(item => (
                    <div key={item.t}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.06] p-3.5"
                      style={{ background: "rgba(255,255,255,.02)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `rgba(${item.r},.12)` }}>
                        <item.icon size={14} style={{ color: item.c }} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs mb-0.5">{item.t}</p>
                        <p className="text-[.62rem] text-white/40 leading-relaxed">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Print */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .55, ease, delay: .1 }}
              className="rounded-3xl border overflow-hidden"
              style={{ borderColor: `rgba(${VR},.18)`, background: `rgba(${VR},.04)` }}
            >
              <div className="h-px w-full"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${VR},.5),transparent)` }} />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `rgba(${VR},.12)` }}>
                    <Printer size={16} style={{ color: V }} />
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-sm">Print</p>
                    <p className="text-[.62rem] text-white/40">Grand format &amp; supports physiques</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {TYPES_PRINT.map(item => (
                    <div key={item.t}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.06] p-3.5"
                      style={{ background: "rgba(255,255,255,.02)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `rgba(${item.r},.12)` }}>
                        <item.icon size={14} style={{ color: item.c }} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs mb-0.5">{item.t}</p>
                        <p className="text-[.62rem] text-white/40 leading-relaxed">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ 4. GALERIE ══════════════ */}
      <section id="galerie" className="py-16 sm:py-24 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[300px] rounded-full blur-[100px] opacity-[0.05]"
            style={{ background: `radial-gradient(ellipse,rgba(${RR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-10">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Image size={12} style={{ color: R }} /> Portfolio créatif
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Nos <span style={{ color: R }}>créations</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base mb-8">
              Découvrez nos dernières réalisations — visuels digitaux et print pour nos clients.
            </motion.p>

            {/* Filter tabs */}
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-1 rounded-2xl border border-white/[0.08] p-1"
              style={{ background: "rgba(255,255,255,.03)" }}>
              {(["all", "digital", "print"] as const).map(f => (
                <button key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                  style={filter === f
                    ? { background: `linear-gradient(135deg,${R2},${R})`, color: "#fff" }
                    : { color: "rgba(255,255,255,.45)" }}>
                  {f === "all" ? "Tous" : f === "digital" ? "Digital" : "Print"}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Gallery */}
          {galleryLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                  style={{ aspectRatio: "1/1", background: "rgba(255,255,255,.06)" }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <motion.div {...staggerContainerFast} viewport={viewport}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <motion.div key={item.id} variants={cardReveal}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{ aspectRatio: "1/1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{ background: "rgba(7,7,10,.78)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: `rgba(${RR},.2)`, border: `1px solid rgba(${RR},.4)` }}>
                      <ZoomIn size={18} style={{ color: R }} />
                    </div>
                    <p className="font-bold text-white text-sm text-center px-4">{item.title}</p>
                    <span className="text-[.62rem] font-bold px-3 py-1 rounded-full capitalize"
                      style={{
                        background: `rgba(${item.category === "digital" ? RR : VR},.15)`,
                        color: item.category === "digital" ? R : V,
                      }}>
                      {item.category}{item.sub_category ? ` · ${item.sub_category}` : ""}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {PLACEHOLDER_CARDS.map((card, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * .07, duration: .4, ease }}
                    className="relative rounded-2xl overflow-hidden"
                    style={{ aspectRatio: card.ratio as string, background: card.gr, border: `1px solid rgba(${card.br},.18)` }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                          style={{ background: `rgba(${card.br},.14)` }}>
                          <Image size={20} style={{ color: `rgba(${card.br},.65)` }} />
                        </div>
                        <p className="text-[.65rem] font-bold text-white/28">{card.label}</p>
                        <p className="text-[.55rem] text-white/18 mt-0.5">Bientôt disponible</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-white/40 mb-4">La galerie sera mise à jour prochainement avec nos créations.</p>
                <Link href="/contact?besoin=Visuels+publicitaires"
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: `linear-gradient(135deg,${R2},${R})`, color: "#fff" }}>
                  Demander un aperçu de nos créations <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ 5. PROCESSUS ══════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-14">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Zap size={12} style={{ color: R }} /> Notre méthode
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              De votre brief <span style={{ color: R }}>à la livraison</span>
            </motion.h2>
          </motion.div>

          {/* Desktop */}
          <div className="hidden lg:block relative">
            <motion.div
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
              viewport={{ once: true }} transition={{ duration: 1.5, ease, delay: .3 }}
              className="absolute top-9 left-[8%] right-[8%] h-px origin-left"
              style={{ background: `linear-gradient(90deg,${R},${V},${R})` }}
            />
            <div className="grid grid-cols-5 gap-4">
              {PROCESSUS.map((e, i) => (
                <motion.div key={e.t}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: .15 + i * .1, duration: .5, ease }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="relative w-[70px] h-[70px] rounded-2xl border-2 flex items-center justify-center mb-4 z-10"
                    style={{ borderColor: `rgba(${e.r},.4)`, background: `rgba(${e.r},.08)` }}>
                    <e.icon size={21} style={{ color: e.c }} />
                    <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full text-[.58rem] font-extrabold flex items-center justify-center text-white"
                      style={{ background: e.c }}>{i + 1}</span>
                  </div>
                  <p className="font-bold text-white text-sm mb-1">{e.t}</p>
                  <p className="text-xs text-white/45 leading-relaxed mb-2 max-w-[120px]">{e.d}</p>
                  <span className="text-[.6rem] font-bold px-2.5 py-1 rounded-full border border-white/[0.08]"
                    style={{ color: e.c }}>{e.dur}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-3 relative">
            <div className="absolute left-[22px] top-6 bottom-6 w-px"
              style={{ background: `linear-gradient(180deg,transparent,rgba(${RR},.35),rgba(${VR},.35),transparent)` }} />
            {PROCESSUS.map((e, i) => (
              <motion.div key={e.t}
                initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * .07, duration: .4, ease }}
                className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 ml-10"
              >
                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `rgba(${e.r},.12)` }}>
                  <e.icon size={16} style={{ color: e.c }} />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[.5rem] font-extrabold flex items-center justify-center text-white"
                    style={{ background: e.c }}>{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-white text-sm">{e.t}</p>
                    <span className="text-[.6rem] font-bold" style={{ color: e.c }}>{e.dur}</span>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed">{e.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 6. VALEUR ══════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <TrendingUp size={12} style={{ color: G }} /> Ce que ça change
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Pourquoi des visuels <span style={{ color: R }}>professionnels</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALEUR.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .22 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 120%,rgba(${item.r},.12) 0%,transparent 65%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={19} style={{ color: item.c }} />
                </div>
                <p className="font-bold text-sm mb-1.5" style={{ color: item.c }}>{item.t}</p>
                <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════ 7. FAQ ══════════════ */}
      <section className="py-16 sm:py-24 px-5"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-2xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <HelpCircle size={12} style={{ color: R }} /> Questions fréquentes
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Vos questions, <span style={{ color: R }}>nos réponses</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-2.5">
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={cardReveal}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: openFaq === i ? `rgba(${RR},.3)` : "rgba(255,255,255,.07)",
                  background:  openFaq === i ? `rgba(${RR},.05)` : "rgba(255,255,255,.03)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-white/88 leading-snug">{item.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: .22 }} className="shrink-0">
                    <ChevronDown size={14} style={{ color: openFaq === i ? R : "rgba(255,255,255,.38)" }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }}
                    >
                      <p className="px-5 pb-4 text-sm text-white/55 leading-relaxed border-t border-white/[0.05] pt-3">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════ 8. CTA FINAL ══════════════ */}
      <section className="py-16 sm:py-28 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [.04, .1, .04] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full blur-[150px]"
            style={{ background: `radial-gradient(ellipse,rgba(${RR},1) 0%,rgba(${VR},.7) 45%,transparent 70%)` }}
          />
          <div className="absolute inset-0 opacity-[0.012]"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,.9) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        </div>

        <div className="max-w-3xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport}
            className="relative rounded-3xl border p-8 sm:p-14 text-center overflow-hidden"
            style={{ borderColor: `rgba(${RR},.2)`, background: `rgba(${RR},.04)` }}
          >
            <div className="absolute top-0 left-0 w-28 h-28 rounded-br-3xl border-b border-r"
              style={{ borderColor: `rgba(${RR},.12)` }} />
            <div className="absolute bottom-0 right-0 w-28 h-28 rounded-tl-3xl border-t border-l"
              style={{ borderColor: `rgba(${RR},.12)` }} />
            <div className="pointer-events-none absolute -top-12 right-8 w-44 h-44 rounded-full blur-3xl opacity-[0.14]"
              style={{ background: `rgba(${RR},1)` }} />
            <div className="pointer-events-none absolute -bottom-12 left-8 w-36 h-36 rounded-full blur-3xl opacity-[0.1]"
              style={{ background: `rgba(${VR},1)` }} />

            <motion.div variants={fadeIn}
              className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-7">
              <Sparkles size={12} style={{ color: R }} /> Vos prochains visuels vous attendent
            </motion.div>

            <motion.h2 variants={fadeIn}
              className="relative text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold mb-5 leading-tight">
              Vos prochains visuels,<br />
              <span style={{
                background: `linear-gradient(135deg,${R},${V})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                livrés sous 72h.
              </span>
            </motion.h2>

            <motion.p variants={fadeIn}
              className="relative text-white/45 text-base max-w-md mx-auto mb-9">
              Partagez votre brief — on crée les visuels qui attirent l&apos;attention, renforcent votre image et déclenchent l&apos;action. Devis gratuit et sans engagement.
            </motion.p>

            <motion.div variants={fadeIn} className="relative flex flex-col sm:flex-row justify-center gap-3 mb-9">
              <Link href="/contact?besoin=Visuels+publicitaires"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold transition-all duration-200 hover:scale-[1.02] shadow-[0_0_40px_rgba(244,63,94,0.2)] hover:shadow-[0_0_60px_rgba(244,63,94,0.38)]"
                style={{ background: `linear-gradient(135deg,${R2},${R})`, color: "#fff" }}>
                Demander un devis <ArrowRight size={15} />
              </Link>
              <Link href="/realisations"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                Voir nos réalisations
              </Link>
            </motion.div>

            <motion.div variants={fadeIn}
              className="relative flex flex-wrap justify-center gap-5 sm:gap-7">
              {[
                [Clock,      "Livraison 24–72h"],
                [Shield,     "Sans engagement"],
                [BadgeCheck, "2 retours inclus"],
                [Star,       "Sources éditables fournies"],
              ].map(([Icon, l]) => (
                <div key={l as string} className="flex items-center gap-1.5 text-xs text-white/35">
                  <Icon size={11} style={{ color: R }} />
                  {l as string}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
