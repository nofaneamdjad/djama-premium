"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Wallet, Loader2, Users, Building2, TrendingUp,
  Zap, Shield, Award, Target, Clock, BookOpen,
  Bot, Calendar, Star, Lock, Globe, BarChart3, MessageSquare,
  CreditCard, Landmark, Banknote, ChevronRight,
  Copy, Check, Mail,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import { supabase } from "@/lib/supabase";
import { COACHING_MODULES } from "@/lib/coaching-content";

const ease = [0.16, 1, 0.3, 1] as const;
const ACCENT = "#f9a826";
const ACCENT_RGB = "249,168,38";

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Bouton Checkout Coaching IA
───────────────────────────────────────────────────────── */
function CoachingCheckoutButton({ label = "Rejoindre le coaching — 190€" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch("/api/checkout/coaching-ia", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:    user?.id    ?? null,
          userEmail: user?.email ?? null,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur de paiement");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(167,139,250,0.3)] transition-all hover:shadow-[0_8px_48px_rgba(167,139,250,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Redirection…</>
        ) : (
          <><Wallet size={18} /> {label}</>
        )}
      </button>
      {error && (
        <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const OUTCOMES = [
  { icon: Zap,        color: "#f9a826", label: "Générer emails, devis et contrats en 30 secondes" },
  { icon: Clock,      color: "#a78bfa", label: "Gagner 5 à 15h de travail par semaine" },
  { icon: Target,     color: "#c9a55a", label: "Prospecter et trouver des clients avec l'IA" },
  { icon: TrendingUp, color: "#4ade80", label: "Créer du contenu marketing 10× plus vite" },
  { icon: BarChart3,  color: "#60a5fa", label: "Analyser vos données business en secondes" },
  { icon: Bot,        color: "#f472b6", label: "Déléguer vos tâches répétitives à des agents IA" },
];

const WHY = [
  {
    icon: Target,
    color: "#a78bfa",
    title: "Conçue pour les entrepreneurs",
    desc: "Pas pour les ingénieurs. Chaque exemple vient du terrain : freelances, PME, consultants.",
  },
  {
    icon: Zap,
    color: "#f9a826",
    title: "Applicable dès le module 1",
    desc: "Vous repartez avec des outils utilisables immédiatement. Pas de théorie creuse.",
  },
  {
    icon: Users,
    color: "#4ade80",
    title: "Accompagnement humain inclus",
    desc: "Un coach réel, pas juste un chatbot. Session individuelle pour débloquer votre situation.",
  },
  {
    icon: TrendingUp,
    color: "#60a5fa",
    title: "ROI en moins d'une semaine",
    desc: "La formation se rembourse en quelques heures de travail économisées. Garanti.",
  },
];

const INCLUDED = [
  "Accès complet aux 5 modules (17 chapitres)",
  "Assistant IA pédagogique disponible 24h/7j",
  "1 session de coaching individuel avec expert",
  "Exercices pratiques applicables immédiatement",
  "Bibliothèque de prompts prêts à l'emploi",
  "Accès pendant 3 mois complets",
  "Mises à jour du contenu incluses",
  "Certificat de complétion DJAMA",
];

/* Cas concrets Avant / Après */
const BEFORE_AFTER = [
  {
    color:  "#a78bfa",
    emoji:  "📄",
    task:   "Rédiger une proposition commerciale",
    before: "2 heures de rédaction, structure imparfaite, relances oubliées",
    after:  "8 minutes avec un prompt structuré → document professionnel prêt à envoyer",
  },
  {
    color:  "#4ade80",
    emoji:  "📱",
    task:   "Créer du contenu pour les réseaux",
    before: "Panne d'inspiration le lundi, 1 post par semaine max, temps perdu",
    after:  "10 idées + 3 textes rédigés en 20 minutes avec l'IA comme co-auteur",
  },
  {
    color:  "#60a5fa",
    emoji:  "🎯",
    task:   "Prospecter de nouveaux clients",
    before: "Emails froids génériques, taux de réponse < 5%, démarchage épuisant",
    after:  "Séquences personnalisées générées par IA, recherche déléguée, gain de temps massif",
  },
] as const;

const ENTERPRISE_FEATURES = [
  { icon: Users,     label: "Formation pour 5 à 50 personnes" },
  { icon: Target,    label: "Programme adapté à votre secteur" },
  { icon: BarChart3, label: "Tableau de bord de suivi équipe" },
  { icon: Calendar,  label: "Sessions live dédiées" },
  { icon: Award,     label: "Certification collective" },
  { icon: Shield,    label: "Accompagnement post-formation" },
];

/* ─────────────────────────────────────────────────────────
   FAQ
───────────────────────────────────────────────────────── */
const FAQ = [
  {
    q: "Faut-il des connaissances techniques pour suivre ce coaching ?",
    a: "Aucune. Le coaching est conçu pour les professionnels, entrepreneurs et particuliers sans background tech. Tout est expliqué avec des exemples concrets du monde réel.",
  },
  {
    q: "Comment accéder à l'espace membre après paiement ?",
    a: "Immédiatement. Après votre paiement, vous recevez un email avec votre lien d'accès personnalisé. Si vous n'avez pas encore de compte, il est créé automatiquement — vous définissez votre mot de passe via le lien.",
  },
  {
    q: "Que comprend la session de coaching individuel ?",
    a: "Une visioconférence de 60 minutes avec un expert DJAMA. Vous pouvez revoir votre progression, débloquer des points durs, affiner votre stratégie IA, ou recevoir un retour sur vos automatisations.",
  },
  {
    q: "L'accès est valable combien de temps ?",
    a: "3 mois à partir du jour de votre paiement. C'est largement suffisant pour compléter le programme au rythme de 2 à 3 heures par semaine. Le contenu reste accessible tant que votre période est active.",
  },
  {
    q: "Est-ce que le contenu est mis à jour ?",
    a: "Oui. Le paysage IA évolue vite — nous mettons à jour les modules régulièrement pour refléter les nouveaux outils et techniques. Vos mises à jour sont incluses pendant votre période d'accès.",
  },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-all hover:border-[rgba(167,139,250,0.2)]"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-white/80 leading-relaxed">{q}</p>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all"
          style={{
            borderColor: open ? `rgba(${ACCENT_RGB},0.35)` : "rgba(255,255,255,0.1)",
            background:  open ? `rgba(${ACCENT_RGB},0.08)` : "transparent",
          }}
        >
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={14} style={{ color: open ? ACCENT : "rgba(255,255,255,0.3)" }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease }}
            className="overflow-hidden"
          >
            <p className="border-t border-white/[0.05] px-6 pb-5 pt-4 text-sm leading-relaxed text-white/45">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Sélecteur de paiement (Stripe / Virement)
───────────────────────────────────────────────────────── */
function PaymentSelector({ user }: { user?: { id?: string; email?: string } | null }) {
  const [tab,         setTab]         = useState<"stripe" | "virement">("stripe");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [vEmail,      setVEmail]      = useState(user?.email ?? "");
  const [vName,       setVName]       = useState("");
  const [vSent,       setVSent]       = useState(false);
  const [vSending,    setVSending]    = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleStripe() {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/checkout/coaching-ia", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, userEmail: user?.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      if (data.url) window.location.href = data.url;
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); setLoading(false); }
  }

  async function handleVirement(e: React.FormEvent) {
    e.preventDefault();
    if (!vEmail.trim()) return;
    setVSending(true);
    try {
      await fetch("/api/checkout/coaching-ia/virement", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: vEmail.trim(), fullName: vName.trim() || null }),
      });
      setVSent(true);
    } finally { setVSending(false); }
  }

  const TABS = [
    { id: "stripe",   label: "💳 Carte bancaire" },
    { id: "virement", label: "🏦 Virement"        },
  ] as const;

  /* Coordonnées bancaires */
  const BANK_ROWS = [
    { label: "Bénéficiaire", value: "EI AMDJAD Nofane",              copy: "EI AMDJAD Nofane",              field: "beneficiaire", mono: false, highlight: false },
    { label: "IBAN",         value: "FR76 4061 8804 5900 0406 3964 945", copy: "FR7640618804590004063964945", field: "iban",         mono: true,  highlight: false },
    { label: "BIC",          value: "BOUSFRPPXXX",                    copy: "BOUSFRPPXXX",                   field: "bic",          mono: true,  highlight: false },
    { label: "Banque",       value: "BoursoBank",                     copy: "BoursoBank",                    field: "banque",       mono: false, highlight: false },
    { label: "Référence",    value: "COACHING-IA",                    copy: "COACHING-IA",                   field: "reference",    mono: true,  highlight: true  },
  ] as const;

  return (
    <div className="w-full">

      {/* ── Onglets ── */}
      <div className="mb-4 flex gap-2">
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => { setTab(id); setError(null); }}
              className="flex-1 rounded-xl border px-2 py-2.5 text-[0.72rem] font-semibold transition-all"
              style={{
                borderColor: active ? `rgba(${ACCENT_RGB},0.5)` : "rgba(255,255,255,0.08)",
                background:  active ? `rgba(${ACCENT_RGB},0.12)` : "rgba(255,255,255,0.03)",
                color:       active ? ACCENT : "rgba(255,255,255,0.4)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Stripe ── */}
      {tab === "stripe" && (
        <button
          onClick={handleStripe}
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(167,139,250,0.3)] transition-all hover:shadow-[0_8px_48px_rgba(167,139,250,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Redirection…</>
          ) : (
            <><Zap size={18} /> Commencer maintenant →</>
          )}
        </button>
      )}

      {/* ── Virement ── */}
      {tab === "virement" && (
        <div className="space-y-3">

          {/* Titre + sous-titre */}
          <div className="mb-1 text-center">
            <p className="text-xs font-bold text-white/60">💳 Paiement par virement bancaire</p>
            <p className="mt-0.5 text-[0.68rem] text-white/30">
              Effectuez votre virement puis confirmez pour activer votre accès
            </p>
          </div>

          {/* ── Carte coordonnées bancaires ── */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.04] transition-all hover:border-white/[0.14]">

            {/* Header de la carte */}
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `rgba(${ACCENT_RGB},0.12)`, border: `1px solid rgba(${ACCENT_RGB},0.22)` }}
              >
                <Landmark size={15} style={{ color: ACCENT }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white/80">Coordonnées bancaires</p>
                <p className="text-[0.62rem] text-white/30">BoursoBank · Virement SEPA</p>
              </div>
              {/* Montant en évidence */}
              <div
                className="rounded-xl px-3 py-1.5"
                style={{ background: `rgba(${ACCENT_RGB},0.1)`, border: `1px solid rgba(${ACCENT_RGB},0.25)` }}
              >
                <span className="text-sm font-black" style={{ color: ACCENT }}>190,00 €</span>
              </div>
            </div>

            {/* Lignes d'infos */}
            <div className="divide-y divide-white/[0.05]">
              {BANK_ROWS.map(({ label, value, copy, field, mono, highlight }) => (
                <div
                  key={field}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/25">{label}</p>
                    <p
                      className={`mt-0.5 text-xs font-semibold ${mono ? "font-mono tracking-wide break-all sm:break-normal" : ""}`}
                      style={{ color: highlight ? ACCENT : "rgba(255,255,255,0.75)" }}
                    >
                      {value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(copy, field)}
                    title={`Copier ${label}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95"
                    style={{
                      borderColor: copiedField === field ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.09)",
                      background:  copiedField === field ? "rgba(74,222,128,0.1)"  : "rgba(255,255,255,0.04)",
                    }}
                  >
                    {copiedField === field
                      ? <Check size={11} style={{ color: "#4ade80" }} />
                      : <Copy  size={11} className="text-white/25" />
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bandeau rassurant ── */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            {([
              { icon: Shield, label: "Paiement sécurisé",      color: "#4ade80" },
              { icon: Clock,  label: "Activation sous 24–48h", color: "#60a5fa" },
              { icon: Zap,    label: "Aucun frais caché",       color: ACCENT    },
            ] as const).map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-[0.63rem] text-white/40">
                <Icon size={9} style={{ color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* ── Après le virement ── */}
          {vSent ? (
            <div className="rounded-2xl border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.06)] p-5 text-center">
              <div className="mb-2 text-2xl">✅</div>
              <p className="text-sm font-bold text-green-400">Confirmation reçue !</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/40">
                Votre accès sera activé sous 24 à 48h dès réception du virement.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-xs"
                  style={{ background: `rgba(${ACCENT_RGB},0.12)` }}
                >
                  📧
                </div>
                <p className="text-xs font-bold text-white/60">Après votre virement</p>
              </div>
              <p className="mb-3.5 text-[0.68rem] leading-relaxed text-white/30">
                Entrez votre email pour que nous puissions activer votre accès dès réception du paiement.
              </p>
              <form onSubmit={handleVirement} className="space-y-2.5">
                <input
                  type="email"
                  required
                  placeholder="Votre adresse e-mail"
                  value={vEmail}
                  onChange={(e) => setVEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[rgba(167,139,250,0.4)]"
                />
                <input
                  type="text"
                  placeholder="Votre nom complet (optionnel)"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[rgba(167,139,250,0.4)]"
                />
                <button
                  type="submit"
                  disabled={vSending || !vEmail.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.2), rgba(${ACCENT_RGB},0.1))`,
                    border:     `1px solid rgba(${ACCENT_RGB},0.35)`,
                    color:      ACCENT,
                  }}
                >
                  {vSending
                    ? <><Loader2 size={15} className="animate-spin" /> Envoi…</>
                    : <><Banknote size={15} /> Confirmer mon virement</>
                  }
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── Erreur ── */}
      {error && (
        <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
          {error}
        </p>
      )}

      {/* ── Lien espace privé ── */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <Link
          href="/login?redirect=/coaching-ia/espace"
          className="group flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.72rem] font-medium text-white/30 transition-all hover:bg-white/[0.04] hover:text-white/60"
        >
          <Lock size={10} className="transition-colors group-hover:text-[#a78bfa]" />
          Déjà inscrit&nbsp;? Accéder à mon espace
          <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function CoachingIAPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openMod, setOpenMod] = useState<string | null>("1");
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);

  // Fetch current user on mount (best-effort, not required)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
  }, []);

  return (
    <>
    {/* ── Sticky CTA mobile (toujours visible en bas) ── */}
    <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
      <div className="border-t border-white/[0.08] bg-[#07080e]/96 px-4 pb-4 pt-3 backdrop-blur-md">
        <a
          href="#offre"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(167,139,250,0.4)]"
        >
          <Zap size={15} /> Commencer maintenant — 190€
        </a>
        <p className="mt-1.5 text-center text-[0.6rem] text-white/25">
          🔒 Paiement sécurisé · Accès immédiat
        </p>
      </div>
    </div>

    <div className="overflow-x-hidden bg-[#07080e]">

      {/* ════════════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-28 pt-24 sm:pb-28 sm:pt-36">
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[600px] w-[700px] rounded-full bg-[rgba(167,139,250,0.09)] blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          {/* Fil d'Ariane */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mb-8 flex items-center justify-center gap-2 text-xs text-white/25"
          >
            <Link href="/services" className="transition-colors hover:text-white/50">← Services</Link>
            <span>/</span>
            <span className="text-white/40">Coaching IA</span>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.28)] bg-[rgba(167,139,250,0.09)] px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#a78bfa]"
          >
            <Brain size={12} /> Formation IA · 190€ / 3 mois
          </motion.div>

          {/* H1 */}
          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Maîtrisez l'IA", "en 3 mois."]}
              highlight={1}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          <FadeReveal delay={0.5} as="p" className="mx-auto mt-6 max-w-2xl text-lg leading-[1.8] text-white/50">
            Apprenez à utiliser l&apos;IA pour gagner du temps, des clients et automatiser votre business.
          </FadeReveal>

          {/* Urgence */}
          <FadeReveal delay={0.62}>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.1)] px-4 py-1.5 text-xs font-bold text-[#f87171]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f87171] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f87171]" />
              </span>
              Places limitées — inscriptions ouvertes ce mois
            </div>
          </FadeReveal>

          <FadeReveal delay={0.68} className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <a href="#offre"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-8 py-4 text-base font-extrabold text-white sm:w-auto"
              style={{
                background: "linear-gradient(135deg,#a78bfa,#7c6fcd)",
                boxShadow:  "0 8px 32px rgba(167,139,250,0.35)",
              }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center gap-2">
                <Zap size={17} /> Commencer maintenant →
              </span>
            </a>
            <a href="#programme" className="btn-ghost w-full justify-center px-8 py-4 text-base sm:w-auto">
              Voir le programme <ArrowRight size={16} />
            </a>
          </FadeReveal>

          {/* Trust strip */}
          <FadeReveal delay={0.85} className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-white/[0.07] pt-8">
            {[
              { icon: "🧠", label: "5 modules complets" },
              { icon: "💬", label: "Assistant IA inclus" },
              { icon: "🎯", label: "1 session coaching" },
              { icon: "⚡", label: "Accès immédiat" },
              { icon: "📅", label: "3 mois d'accès" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-medium text-white/35">
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </FadeReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          1.5  STATS — PREUVE SOCIALE
      ════════════════════════════════════════════════════ */}
      <section className="bg-[#07080e] pb-10 pt-2">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.55, ease }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              { value: "+2h",     sub: "économisées par jour",  color: "#a78bfa" },
              { value: "< 1 sem", sub: "pour rentabiliser",     color: "#4ade80" },
              { value: "190€",    sub: "paiement unique",       color: ACCENT    },
              { value: "3 mois",  sub: "d'accès complet",       color: "#60a5fa" },
            ].map(({ value, sub, color }) => (
              <div
                key={sub}
                className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-5 text-center"
              >
                <span className="text-2xl font-black sm:text-3xl" style={{ color }}>{value}</span>
                <span className="mt-1 text-[0.62rem] leading-snug text-white/35">{sub}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          2. CE QUE VOUS ALLEZ APPRENDRE
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-12 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-14 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
              <Sparkles size={10} /> Bénéfices concrets
            </motion.span>
            <h2 className="display-section text-[#09090b]">
              Ce que vous allez{" "}
              <span className="text-[#a78bfa]">pouvoir faire.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#6b7280]">
              Dès la fin de la formation, ces capacités font partie de votre quotidien.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {OUTCOMES.map(({ icon: Icon, color, label }) => (
              <motion.div
                key={label}
                variants={cardReveal}
                className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-sm font-semibold text-[#09090b]">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          3. PROGRAMME
      ════════════════════════════════════════════════════ */}
      <section id="programme" className="bg-[#07080e] py-12 sm:py-24">
        <div className="pointer-events-none absolute left-[5%] h-[400px] w-[600px] rounded-full bg-[rgba(167,139,250,0.04)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-12 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
              <BookOpen size={10} /> 5 modules · 17 chapitres
            </motion.span>
            <h2 className="display-section text-white">
              Le programme{" "}
              <span className="text-[#a78bfa]">complet.</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {COACHING_MODULES.map((module, idx) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.45, ease, delay: idx * 0.06 }}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
              >
                <button
                  onClick={() => setOpenMod(openMod === module.id ? null : module.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{ background: `rgba(${module.rgb},0.12)`, border: `1px solid rgba(${module.rgb},0.2)` }}
                  >
                    {module.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.65rem] font-bold text-white/25">Module {module.id}</span>
                      <span className="text-[0.65rem] text-white/20">·</span>
                      <span className="text-[0.65rem] text-white/25">{module.duration}</span>
                    </div>
                    <p className="font-semibold text-white">{module.title}</p>
                    <p className="text-xs text-white/40">{module.tagline}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
                      style={{ background: `rgba(${module.rgb},0.1)`, color: `rgb(${module.rgb})` }}
                    >
                      {module.chapters.length} chapitres
                    </span>
                    <motion.div animate={{ rotate: openMod === module.id ? 180 : 0 }} transition={{ duration: 0.22 }}>
                      <ChevronDown size={15} className="text-white/30" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {openMod === module.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
                        <p className="mb-4 text-sm text-white/40">{module.description}</p>
                        <div className="space-y-2">
                          {module.chapters.map((ch) => (
                            <div key={ch.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-2.5">
                              <span style={{ color: `rgb(${module.rgb})` }}>
                                {ch.type === "exercise" ? "✍️" : ch.type === "quiz" ? "❓" : "📖"}
                              </span>
                              <span className="flex-1 text-sm text-white/65">{ch.title}</span>
                              <span className="flex items-center gap-1 text-[0.65rem] text-white/25">
                                <Clock size={10} /> {ch.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          3.5 POURQUOI CETTE FORMATION ?
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-12 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
              <Award size={10} /> Pourquoi choisir cette formation ?
            </motion.span>
            <h2 className="display-section text-[#09090b]">
              Pas une formation comme{" "}
              <span className="text-[#a78bfa]">les autres.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#6b7280]">
              La majorité des formations IA sont trop techniques, trop théoriques ou déjà obsolètes. Voici ce qui différencie DJAMA.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-2"
          >
            {WHY.map(({ icon: Icon, color, title, desc }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                className="group flex gap-5 rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${color}18`, border: `1px solid ${color}28` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <h3 className="mb-1.5 text-base font-extrabold text-[#09090b]">{title}</h3>
                  <p className="text-sm leading-relaxed text-[#6b7280]">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bannière résumé */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="mt-10 overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.2)] bg-gradient-to-r from-[#0d0a1a] to-[#12102a] px-8 py-6"
          >
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
              <div>
                <p className="text-sm font-bold text-white/80">Formation certifiée DJAMA</p>
                <p className="mt-0.5 text-xs text-white/35">Contenu mis à jour chaque trimestre · Applicable dès le 1er jour</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {[
                  { val: "5",    label: "modules" },
                  { val: "17",   label: "chapitres" },
                  { val: "8h",   label: "coaching" },
                  { val: "190€", label: "seulement" },
                ].map(({ val, label }) => (
                  <div key={label} className="flex flex-col items-center">
                    <span className="text-xl font-black" style={{ color: ACCENT }}>{val}</span>
                    <span className="text-[0.62rem] uppercase tracking-wider text-white/30">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          4A. CAS CONCRETS — AVANT / APRÈS
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-12 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
              <Zap size={10} /> Résultats concrets
            </motion.span>
            <h2 className="display-section text-[#09090b]">
              Ce que ça change{" "}
              <span className="text-[#a78bfa]">en pratique.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#6b7280]">
              Des exemples réels de ce que vous pourrez faire dès la fin de la formation.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-3"
          >
            {BEFORE_AFTER.map(({ color, emoji, task, before, after }) => (
              <motion.div
                key={task}
                variants={cardReveal}
                className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm"
              >
                {/* En-tête tâche */}
                <div className="border-b border-black/[0.06] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{emoji}</span>
                    <p className="text-sm font-bold text-[#09090b]">{task}</p>
                  </div>
                </div>
                {/* Avant */}
                <div className="border-b border-black/[0.04] bg-[#fef2f2] px-5 py-4">
                  <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-red-400">
                    Avant la formation
                  </p>
                  <p className="text-xs leading-relaxed text-[#6b7280]">{before}</p>
                </div>
                {/* Après */}
                <div className="px-5 py-4" style={{ background: `${color}09` }}>
                  <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest" style={{ color }}>
                    Après la formation
                  </p>
                  <p className="text-xs font-semibold leading-relaxed text-[#1f2937]">{after}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          4B. À PROPOS DU FORMATEUR
      ════════════════════════════════════════════════════ */}
      <section className="bg-[#07080e] py-12 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="overflow-hidden rounded-[2rem] border border-white/[0.09] bg-white/[0.03]"
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent" />
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-10">
              {/* Avatar / initiales */}
              <div className="shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.25rem] border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.1)] text-2xl font-black text-[#a78bfa]">
                  AN
                </div>
              </div>
              {/* Bio */}
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Amdjad Nofane</h3>
                  <span className="rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-[#a78bfa]">
                    Fondateur DJAMA
                  </span>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-white/50">
                  Entrepreneur et formateur spécialisé en IA appliquée aux PME et freelances.
                  Fondateur de DJAMA, j&apos;accompagne des professionnels à utiliser l&apos;IA
                  concrètement — sans jargon, avec des cas réels issus du terrain.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/contact"
                    className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-white/[0.2] hover:text-white/90"
                  >
                    <Mail size={12} /> Contacter directement
                  </a>
                  <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-xs text-white/30">
                    <Globe size={11} /> djama.space
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          4C. TÉMOIGNAGES CLIENTS VÉRIFIÉS
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-10 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
              <Shield size={10} /> Avis vérifiés
            </motion.span>
            <h2 className="display-section text-[#09090b]">
              Ce qu&apos;en disent{" "}
              <span className="text-[#a78bfa]">les clients réels.</span>
            </h2>
          </motion.div>

          {/* État vide — aucun avis pour l'instant */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
            className="overflow-hidden rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb]"
          >
            <div className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
                <Star size={24} className="text-[#d1d5db]" />
              </div>
              <div>
                <p className="text-base font-bold text-[#09090b]">Aucun avis pour l&apos;instant</p>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[#6b7280]">
                  Nous n&apos;affichons que des avis de clients réels et vérifiés.
                  Soyez le premier à partager votre expérience après la formation.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#09090b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f2937]"
                >
                  <Mail size={13} /> Partager mon avis après la formation
                </a>
              </div>
              <p className="text-[0.65rem] text-[#9ca3af]">
                🔒 Seuls les avis de clients ayant accédé à la plateforme sont publiés
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          5. OFFRE & TARIF
      ════════════════════════════════════════════════════ */}
      <section id="offre" className="bg-[#07080e] py-12 sm:py-24">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-[rgba(167,139,250,0.25)] bg-white/[0.03] shadow-[0_40px_80px_rgba(0,0,0,0.3)]"
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[300px] w-[400px] rounded-full bg-[rgba(167,139,250,0.07)] blur-[80px]" />
            </div>
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent" />

            <div className="relative px-5 py-8 sm:px-8 sm:py-10">
              {/* Urgence */}
              <div className="mb-5 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#a78bfa]">
                  <Brain size={9} /> Formation complète
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.1)] px-3 py-1 text-[0.65rem] font-bold text-[#f87171]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f87171] opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#f87171]" />
                  </span>
                  Places limitées
                </div>
              </div>

              <div className="mb-1 flex items-end gap-2">
                <span className="text-[3.5rem] font-black leading-none text-white sm:text-[4rem]">190€</span>
                <span className="mb-2 rounded-full border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)] px-2 py-0.5 text-[0.62rem] font-bold text-[#4ade80]">
                  ✓ Garanti 7j
                </span>
              </div>
              <p className="mb-1 text-base font-bold text-white/70">
                pour 3 mois d&apos;accès complet
              </p>
              <p className="mb-1 text-xs text-white/30">
                Paiement unique · Sans abonnement · Accès immédiat
              </p>
              <p className="mb-7 text-[0.68rem] text-white/20">
                = moins que 2h de consulting à 100€/h
              </p>

              <div className="divider-gold mb-7" style={{ background: "rgba(167,139,250,0.15)" }} />

              <ul className="mb-8 space-y-3">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#e5e7eb]">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    {item}
                  </li>
                ))}
              </ul>

              <PaymentSelector user={user} />

              {/* Garantie satisfait ou remboursé */}
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.05)] px-4 py-3">
                <Shield size={13} style={{ color: "#4ade80" }} />
                <p className="text-xs font-semibold text-[#4ade80]">
                  Satisfait ou remboursé sous 7 jours — sans justification
                </p>
              </div>

              {/* Badges de confiance */}
              <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
                {[
                  { icon: Lock,        label: "Paiement sécurisé"  },
                  { icon: Zap,         label: "Accès immédiat"      },
                  { icon: Shield,      label: "Remboursé si besoin" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[0.63rem] text-white/25">
                    <Icon size={10} className="text-[#a78bfa]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          6. ENTREPRISES
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-12 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0d0a1a] via-[#12102a] to-[#0f0d1f] p-6 sm:rounded-[2.5rem] sm:p-14">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left */}
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#a78bfa]">
                  <Building2 size={10} /> Formation entreprise
                </div>
                <h2 className="mb-5 text-3xl font-black leading-tight text-white">
                  Formez votre équipe<br />
                  <span style={{ color: ACCENT }}>à l&apos;IA ensemble.</span>
                </h2>
                <p className="mb-6 text-base leading-relaxed text-white/50">
                  Programme sur mesure pour PME, startups et grandes équipes. Contenu adapté à votre secteur, sessions live dédiées, suivi collectif.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)] px-6 py-3 text-sm font-bold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.18)]"
                >
                  <Users size={15} /> Demander un devis entreprise
                </Link>
              </div>

              {/* Right */}
              <div className="grid grid-cols-2 gap-3">
                {ENTERPRISE_FEATURES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3"
                  >
                    <Icon size={15} style={{ color: ACCENT }} />
                    <p className="text-xs font-medium text-white/70">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          7. FAQ
      ════════════════════════════════════════════════════ */}
      <section className="bg-[#07080e] py-12 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-12 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
              <MessageSquare size={10} /> Questions fréquentes
            </motion.span>
            <h2 className="display-section text-white">
              Tout ce que vous voulez{" "}
              <span style={{ color: ACCENT }}>savoir.</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {FAQ.map(({ q, a }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.4, ease, delay: i * 0.05 }}
              >
                <FaqItem
                  q={q} a={a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          8. CTA FINAL
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#07080e] pb-32 pt-12 sm:pb-24 sm:pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-[rgba(167,139,250,0.07)] blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.65, ease }}
          className="relative z-10 mx-auto max-w-xl px-4 sm:px-6 text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.1)] px-4 py-1.5 text-xs font-bold text-[#f87171]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f87171] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f87171]" />
            </span>
            Places limitées — Inscriptions ouvertes ce mois
          </div>
          <h2 className="display-section text-white">
            Votre avantage compétitif,{" "}
            <span style={{ color: ACCENT }}>c&apos;est maintenant.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/40">
            190€ pour 3 mois d&apos;accès complet. Moins que 2 heures de travail
            économisées en une semaine.
          </p>
          <div className="mt-10">
            <PaymentSelector user={user} />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-5 text-xs text-white/20">
            <span>✓ Accès immédiat</span>
            <span>✓ 5 modules + 17 chapitres</span>
            <span>✓ Assistant IA inclus</span>
            <span>✓ 1 session coaching</span>
            <span>✓ Garanti 7 jours</span>
            <span>✓ Places limitées</span>
          </div>
        </motion.div>
      </section>

    </div>
    </>
  );
}
