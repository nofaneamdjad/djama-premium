"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  FileText, Shield, Search, Package, TrendingUp, Zap,
  User, Mail, Phone, MessageSquare, Loader2, Send,
  ArrowLeft, Building2, ShoppingBag, Truck, Star,
  DollarSign, ClipboardList, AlertCircle, Users,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#60a5fa";
const ACCENT_RGB = "96,165,250";

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const POURQUOI = [
  {
    icon: DollarSign, color: "#4ade80", rgb: "74,222,128",
    title: "Réduire les coûts",
    desc:  "Sourcer directement auprès de fabricants élimine les intermédiaires et peut réduire significativement vos coûts de production ou d'achat.",
  },
  {
    icon: Package, color: "#a78bfa", rgb: "167,139,250",
    title: "Accéder à de nouveaux produits",
    desc:  "Les marchés internationaux offrent une gamme de produits souvent indisponibles localement — des opportunités pour vous différencier.",
  },
  {
    icon: Star, color: "#f9a826", rgb: "249,168,38",
    title: "Trouver des spécialistes",
    desc:  "Certains pays excellent dans des secteurs précis. Aller chercher les meilleurs fabricants là où ils se trouvent, c'est un avantage compétitif réel.",
  },
  {
    icon: TrendingUp, color: ACCENT, rgb: ACCENT_RGB,
    title: "Développer son activité",
    desc:  "Un bon réseau de fournisseurs fiables vous permet de scaler plus vite, de sécuriser vos approvisionnements et d'envisager de nouveaux marchés.",
  },
];

const ZONES = [
  {
    flag: "🇨🇳", country: "Chine",
    color: "#f87171", rgb: "248,113,113",
    specialites: ["Fabrication industrielle", "Électronique & tech", "Textile & mode", "Accessoires & packaging"],
    desc: "Premier atelier du monde. Idéal pour les grandes séries, les produits manufacturés et les composants électroniques à des coûts compétitifs.",
  },
  {
    flag: "🇦🇪", country: "Dubaï / EAU",
    color: "#f9a826", rgb: "249,168,38",
    specialites: ["Commerce international", "Produits premium", "Import-export", "Distribution mondiale"],
    desc: "Hub commercial stratégique. Plateforme incontournable pour l'import-export entre l'Asie, l'Europe et l'Afrique.",
  },
  {
    flag: "🇹🇷", country: "Turquie",
    color: "#a78bfa", rgb: "167,139,250",
    specialites: ["Textile & vêtements", "Meubles & décoration", "Matériaux de construction", "Agroalimentaire"],
    desc: "Qualité européenne à des tarifs compétitifs. La Turquie est un partenaire de choix pour le textile et l'ameublement.",
  },
  {
    flag: "🇹🇿", country: "Tanzanie",
    color: "#4ade80", rgb: "74,222,128",
    specialites: ["Produits agricoles", "Matières premières", "Épices & café", "Ressources naturelles"],
    desc: "Accès aux matières premières d'Afrique de l'Est. Des filières agricoles et naturelles à fort potentiel pour les importateurs.",
  },
  {
    flag: "🇹🇬", country: "Togo",
    color: ACCENT, rgb: ACCENT_RGB,
    specialites: ["Commerce régional", "Distribution Afrique de l'Ouest", "Transit & logistique", "Produits locaux"],
    desc: "Porte d'entrée de l'Afrique de l'Ouest. Lomé est un port stratégique pour la distribution régionale et le commerce continental.",
  },
];

const CE_QUE_NOUS_FAISONS = [
  { icon: Search,      color: "#60a5fa", rgb: "96,165,250",  title: "Recherche ciblée",           desc: "Identification des fournisseurs correspondant à votre besoin : produit, volume, budget, délais et zone géographique." },
  { icon: Shield,      color: "#4ade80", rgb: "74,222,128",  title: "Vérification des entreprises", desc: "Contrôle basique de la fiabilité des fournisseurs : existence légale, avis, capacité de production, références." },
  { icon: Users,       color: "#a78bfa", rgb: "167,139,250", title: "Mise en relation",            desc: "Présentation directe avec les fournisseurs sélectionnés : coordonnées, interlocuteur, canal de communication." },
  { icon: ClipboardList,color: "#f9a826",rgb: "249,168,38",  title: "Analyse des offres",          desc: "Comparaison des devis reçus, analyse des conditions (prix, MOQ, délais, incoterms) pour vous aider à décider." },
  { icon: MessageSquare,color: ACCENT,   rgb: ACCENT_RGB,    title: "Aide à la négociation",       desc: "Conseils pour aborder la négociation, leviers à utiliser et points de vigilance selon la culture du pays." },
  { icon: Truck,       color: "#f87171", rgb: "248,113,113", title: "Accompagnement commandes",    desc: "Suivi des premières étapes : validation du devis, bon de commande, coordination avec le prestataire logistique." },
];

const POUR_QUI = [
  { icon: Building2,   label: "Entreprises",    desc: "Optimisez votre chaîne d'approvisionnement et réduisez vos coûts." },
  { icon: ShoppingBag, label: "E-commerce",     desc: "Trouvez les produits et fabricants pour alimenter votre boutique en ligne." },
  { icon: Truck,       label: "Importateurs",   desc: "Sécurisez vos filières d'import avec des partenaires vérifiés." },
  { icon: Users,       label: "Commerçants",    desc: "Accédez à des prix fabricant et élargissez votre catalogue." },
  { icon: Star,        label: "Entrepreneurs",  desc: "Lancez votre activité en trouvant le bon fournisseur dès le départ." },
];

const FAQ_ITEMS = [
  {
    q: "DJAMA garantit-il la fiabilité des fournisseurs ?",
    a: "Non. DJAMA effectue des vérifications de base sur la fiabilité des fournisseurs, mais ne peut pas garantir le résultat de vos transactions commerciales. Nous vous fournissons les informations disponibles pour vous aider à décider.",
  },
  {
    q: "Dans quels secteurs pouvez-vous chercher ?",
    a: "Textile, électronique, alimentaire, emballage, mobilier, matériaux, cosmétiques, accessoires… Si un fabricant existe dans nos zones de sourcing, nous pouvons tenter de l'identifier.",
  },
  {
    q: "Combien de temps prend une recherche ?",
    a: "En général entre 5 et 15 jours ouvrés selon la complexité du produit et la zone. Nous vous communiquons une estimation lors du devis.",
  },
  {
    q: "Gérez-vous la logistique et l'import ?",
    a: "Non, DJAMA se concentre sur la recherche et la mise en relation. Pour la logistique, le dédouanement ou le transport, nous vous orientons vers des partenaires spécialisés.",
  },
  {
    q: "Quel est le coût de la prestation ?",
    a: "La prestation est sur devis selon la complexité et le volume de la recherche. Contactez-nous pour une estimation gratuite adaptée à votre projet.",
  },
];

const PAYS_OPTIONS = ["Chine 🇨🇳", "Dubaï / EAU 🇦🇪", "Turquie 🇹🇷", "Tanzanie 🇹🇿", "Togo 🇹🇬", "Autre / À définir"];

/* ─────────────────────────────────────────────────────────
   SOUS-COMPOSANTS
───────────────────────────────────────────────────────── */
function isEmailValid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function FieldInput({
  icon: Icon, type = "text", placeholder, value, onChange, validate, required,
}: {
  icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  validate?: (v: string) => boolean; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isValid = validate ? validate(value) : value.length > 0;
  const showOk  = touched && value && isValid;
  const showErr = touched && value && validate && !isValid;
  const border  = showErr ? "rgba(248,113,113,0.5)"
                : showOk  ? "rgba(52,211,153,0.45)"
                : focused ? `rgba(${ACCENT_RGB},0.5)`
                : "rgba(255,255,255,0.09)";
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? `0 0 0 3px rgba(${ACCENT_RGB},0.08)` : "none" }}>
      <Icon size={15} className="shrink-0" style={{ color: focused || value ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <input type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setTouched(true); }}
        required={required}
        className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
      />
      <AnimatePresence>
        {showOk && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <CheckCircle2 size={14} className="text-[#34d399]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldSelect({
  icon: Icon, placeholder, value, onChange, options,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; options: string[];
}) {
  const [focused, setFocused] = useState(false);
  const border = value ? "rgba(52,211,153,0.35)" : focused ? `rgba(${ACCENT_RGB},0.45)` : "rgba(255,255,255,0.09)";
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200" style={{ borderColor: border }}>
      <Icon size={15} className="shrink-0" style={{ color: value || focused ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <select value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ color: value ? "white" : "rgba(255,255,255,0.25)" }}
        className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-[#111113] [&>option]:text-white"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="pointer-events-none shrink-0 text-white/25" />
      {value && <CheckCircle2 size={13} className="shrink-0 text-[#34d399]" />}
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(96,165,250,0.25)] hover:shadow-sm" onClick={onToggle}>
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-[#09090b] leading-relaxed">{q}</p>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
          style={{ borderColor: open ? `rgba(${ACCENT_RGB},0.4)` : "rgba(0,0,0,0.1)", background: open ? `rgba(${ACCENT_RGB},0.08)` : "transparent" }}>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
            <ChevronDown size={14} style={{ color: open ? ACCENT : "#6b7280" }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
            <p className="border-t border-black/[0.05] px-6 pb-5 pt-4 text-sm leading-relaxed text-[#4b5563]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FORMULAIRE
───────────────────────────────────────────────────────── */
function SourcingForm() {
  const [nom,       setNom]       = useState("");
  const [entreprise,setEntreprise]= useState("");
  const [email,     setEmail]     = useState("");
  const [telephone, setTelephone] = useState("");
  const [produit,   setProduit]   = useState("");
  const [pays,      setPays]      = useState("");
  const [quantite,  setQuantite]  = useState("");
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const canSubmit = nom && isEmailValid(email) && produit.length > 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    `${nom}${entreprise ? ` — ${entreprise}` : ""}`,
          email,
          phone:   telephone,
          source:  "devis",
          subject: `Recherche fournisseur — ${produit}${pays ? ` (${pays})` : ""}`,
          message: `Produit : ${produit}\nPays souhaité : ${pays || "À définir"}\nQuantité estimée : ${quantite || "Non précisée"}`,
        }),
      });
      if (!res.ok) throw new Error("Envoi échoué");
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Réessayez ou contactez-nous directement.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-[rgba(96,165,250,0.25)] bg-[rgba(96,165,250,0.05)] p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(96,165,250,0.12)]">
          <CheckCircle2 size={26} className="text-[#60a5fa]" />
        </div>
        <h3 className="mb-2 text-lg font-extrabold text-white">Demande envoyée !</h3>
        <p className="text-sm text-white/50">Nous reviendrons vers vous sous 24–48h avec une proposition de sourcing.</p>
      </motion.div>
    );
  }

  return (
    <motion.form onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
      transition={{ duration: 0.55, ease }} className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={User}      placeholder="Votre nom"           value={nom}        onChange={setNom}        required />
        <FieldInput icon={Building2} placeholder="Entreprise (optionnel)" value={entreprise} onChange={setEntreprise} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={Mail}  type="email" placeholder="Adresse email"         value={email}     onChange={setEmail}     validate={isEmailValid} required />
        <FieldInput icon={Phone} type="tel"   placeholder="Téléphone (optionnel)" value={telephone} onChange={setTelephone} />
      </div>
      <FieldInput icon={Package} placeholder="Produit recherché (ex : t-shirts coton, coque téléphone…)" value={produit} onChange={setProduit} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldSelect icon={Globe}    placeholder="Pays souhaité"        value={pays}     onChange={setPays}     options={PAYS_OPTIONS} />
        <FieldInput  icon={ClipboardList} placeholder="Quantité estimée (ex : 500 unités)" value={quantite} onChange={setQuantite} />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">{error}</p>
      )}

      <button type="submit" disabled={!canSubmit || sending}
        className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending
          ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</>
          : <><Search size={17} /> Demander une recherche de fournisseur</>}
      </button>
      <p className="text-center text-[0.68rem] text-white/20">
        🔒 Confidentialité garantie · Réponse sous 24–48h · Sans engagement
      </p>
    </motion.form>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function RechercheFournisseursPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main>

        {/* ════════════════════════════════════════════════════
            1. HERO
        ════════════════════════════════════════════════════ */}
        <section className="hero-dark hero-grid relative overflow-hidden pb-28 pt-36">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <div className="h-[350px] w-[550px] rounded-full bg-[rgba(96,165,250,0.08)] blur-[90px]" />
          </div>
          <div className="pointer-events-none absolute right-[-60px] top-[30%] h-[300px] w-[300px] rounded-full bg-[rgba(167,139,250,0.05)] blur-[80px]" />

          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <FadeReveal delay={0.05}>
              <span className="badge badge-gold-dark mb-6 inline-flex">
                <Globe size={10} /> Sourcing international
              </span>
            </FadeReveal>

            <h1 className="display-hero text-white">
              <MultiLineReveal
                lines={["Trouvez le bon fournisseur,", "partout dans le monde"]}
                highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08}
                lineClassName="justify-center"
              />
            </h1>

            <FadeReveal delay={0.6} as="p" className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-[1.85] text-white/50">
              DJAMA aide les entreprises et entrepreneurs à identifier et contacter
              des fournisseurs fiables et compétitifs à l&apos;international —
              Chine, Dubaï, Turquie, Tanzanie, Togo et plus encore.
            </FadeReveal>

            <FadeReveal delay={0.9} className="mt-9 flex flex-wrap justify-center gap-3">
              <a href="#sourcing" className="btn-primary px-8 py-4 text-base"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #3b82f6)` } as React.CSSProperties}>
                Demander un devis <ArrowRight size={16} />
              </a>
              <a href="#zones" className="btn-ghost px-8 py-4 text-base">
                Nos zones de sourcing <ChevronDown size={16} />
              </a>
            </FadeReveal>

            {/* Drapeaux */}
            <FadeReveal delay={1.05} className="mt-14 flex flex-wrap justify-center gap-4 border-t border-white/[0.06] pt-10">
              {ZONES.map(({ flag, country }) => (
                <div key={country} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2">
                  <span className="text-lg">{flag}</span>
                  <span className="text-xs font-semibold text-white/60">{country}</span>
                </div>
              ))}
            </FadeReveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            2. POURQUOI L'INTERNATIONAL
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <TrendingUp size={10} /> Les avantages
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Pourquoi sourcer{" "}
                <span className="text-[#c9a55a]">à l&apos;international&nbsp;?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#6b7280]">
                Accéder aux marchés mondiaux n&apos;est plus réservé aux grandes entreprises.
                Avec le bon accompagnement, chaque entrepreneur peut en bénéficier.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {POURQUOI.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal}
                  className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}>
                    <Icon size={19} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-[#09090b]">{title}</h3>
                  <p className="text-xs leading-relaxed text-[#6b7280]">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            3. ZONES DE SOURCING
        ════════════════════════════════════════════════════ */}
        <section id="zones" className="bg-[var(--surface)] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <Globe size={10} /> Couverture géographique
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Nos zones de{" "}
                <span className="text-[#c9a55a]">sourcing</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#6b7280]">
                DJAMA travaille avec des contacts établis dans plusieurs pays clés
                du commerce international.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ZONES.map(({ flag, country, color, rgb, specialites, desc }) => (
                <motion.div key={country} variants={cardReveal}
                  className="overflow-hidden rounded-[1.5rem] border border-[#e5e7eb] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]">
                  {/* Header coloré */}
                  <div className="flex items-center gap-3 p-5 pb-4"
                    style={{ background: `rgba(${rgb},0.06)`, borderBottom: `1px solid rgba(${rgb},0.12)` }}>
                    <span className="text-3xl">{flag}</span>
                    <div>
                      <p className="text-base font-extrabold text-[#09090b]">{country}</p>
                      <div className="mt-1 h-[3px] w-8 rounded-full" style={{ background: color }} />
                    </div>
                  </div>
                  {/* Corps */}
                  <div className="p-5">
                    <p className="mb-4 text-xs leading-relaxed text-[#6b7280]">{desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {specialites.map((s) => (
                        <span key={s} className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold"
                          style={{ background: `rgba(${rgb},0.08)`, color, border: `1px solid rgba(${rgb},0.18)` }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            4. CE QUE NOUS FAISONS
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <Zap size={10} /> Notre prestation
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Ce que nous faisons{" "}
                <span className="text-[#c9a55a]">pour vous</span>
              </h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CE_QUE_NOUS_FAISONS.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal}
                  className="flex gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm transition-all duration-300 hover:border-[rgba(96,165,250,0.3)] hover:shadow-md">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-sm font-bold text-[#09090b]">{title}</h3>
                    <p className="text-xs leading-relaxed text-[#6b7280]">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            5. POUR QUI
        ════════════════════════════════════════════════════ */}
        <section className="hero-dark relative overflow-hidden py-24">
          <div className="pointer-events-none absolute left-[10%] top-[20%] h-[300px] w-[400px] rounded-full bg-[rgba(96,165,250,0.06)] blur-[80px]" />
          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
                <Users size={10} /> Profils
              </motion.span>
              <h2 className="display-section text-white">
                Pour{" "}
                <span className="text-gold">qui&nbsp;?</span>
              </h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {POUR_QUI.map(({ icon: Icon, label, desc }) => (
                <motion.div key={label} variants={cardReveal}
                  className="flex flex-col items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 text-center backdrop-blur-sm transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.06]">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `rgba(${ACCENT_RGB},0.12)`, border: `1px solid rgba(${ACCENT_RGB},0.2)` }}>
                    <Icon size={19} style={{ color: ACCENT }} />
                  </div>
                  <p className="mb-1.5 text-sm font-bold text-white">{label}</p>
                  <p className="text-[0.7rem] leading-relaxed text-white/40">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            6. TRANSPARENCE
        ════════════════════════════════════════════════════ */}
        <section className="bg-[var(--surface)] py-16">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
              transition={{ duration: 0.55, ease }}
              className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(96,165,250,0.2)] bg-[#09090b] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[200px] w-[350px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[60px]" />
              </div>
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `rgba(${ACCENT_RGB},0.12)`, border: `1px solid rgba(${ACCENT_RGB},0.25)` }}>
                  <AlertCircle size={20} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="mb-2 text-base font-extrabold text-white">Transparence & responsabilités</p>
                  <p className="text-sm leading-relaxed text-white/55">
                    DJAMA accompagne ses clients dans la recherche et la mise en relation avec des fournisseurs.
                    Nous facilitons les échanges mais nous ne sommes <strong className="text-white/80 font-semibold">pas responsables
                    des transactions commerciales</strong> entre les parties.
                    Toute commande, paiement ou contrat est conclu directement entre vous et le fournisseur.
                  </p>
                  <p className="mt-3 text-xs text-white/30">
                    Nous recommandons de vérifier les fournisseurs de manière indépendante avant toute commande significative.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            7. FORMULAIRE SOURCING
        ════════════════════════════════════════════════════ */}
        <section id="sourcing" className="hero-dark py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-10 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
                <Search size={10} /> Demande de sourcing
              </motion.span>
              <h2 className="display-section text-white">
                Dites-nous ce que{" "}
                <span className="text-gold">vous cherchez</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/40">
                Décrivez le produit, la zone souhaitée et les quantités.
                On s&apos;occupe de trouver les bons contacts.
              </p>
            </motion.div>
            <SourcingForm />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            8. FAQ
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-12 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <MessageSquare size={10} /> Questions fréquentes
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Vous avez{" "}
                <span className="text-[#c9a55a]">des questions&nbsp;?</span>
              </h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast} className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <motion.div key={i} variants={cardReveal}>
                  <FaqItem q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            9. CTA FINAL
        ════════════════════════════════════════════════════ */}
        <section className="hero-dark relative overflow-hidden py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <div className="h-[400px] w-[600px] rounded-full bg-[rgba(96,165,250,0.06)] blur-[90px]" />
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ duration: 0.65, ease }}
            className="relative z-10 mx-auto max-w-2xl px-6 text-center">
            <span className="badge badge-gold-dark mb-6 inline-flex">
              <Sparkles size={10} /> Prêt à sourcer&nbsp;?
            </span>
            <h2 className="display-section text-white">
              Votre prochain fournisseur{" "}
              <span className="text-gold">n&apos;attend que vous.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/45">
              Décrivez votre besoin. On identifie les meilleurs contacts à l&apos;international.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a href="#sourcing" className="btn-primary px-8 py-4 text-base">
                <Search size={17} /> Demander un devis
              </a>
              <Link href="/services" className="btn-ghost px-8 py-4 text-base">
                <ArrowLeft size={16} /> Voir tous les services
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-white/25">
              <span>✓ Réponse sous 24–48h</span>
              <span>✓ Sur devis</span>
              <span>✓ 5 pays couverts</span>
              <span>✓ Sans engagement</span>
            </div>
          </motion.div>
        </section>

      </main>
      <Footer />
    </>
  );
}
