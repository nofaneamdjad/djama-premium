"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Loader2, TrendingUp, Zap, Shield, Target, Clock, BookOpen,
  Bot, BarChart3, MessageSquare, Landmark, Banknote,
  ChevronRight, Copy, Check, Lock, Download, Star,
  BookMarked, Rocket, Calendar, Video, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { COACHING_MODULES } from "@/lib/coaching-content";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#a78bfa";
const ACCENT_RGB = "167,139,250";
const vp         = { once: true, margin: "-40px" } as const;

/* ─────────────────────────────────────────────────────────
   DONNÉES STATIQUES
───────────────────────────────────────────────────────── */

const OUTCOMES = [
  { icon: Zap,        color: "#a78bfa", label: "Générer emails, devis et contrats en 30 secondes" },
  { icon: Clock,      color: "#60a5fa", label: "Gagner 5 à 15h de travail par semaine" },
  { icon: Target,     color: "#f9a826", label: "Prospecter et trouver des clients avec l'IA" },
  { icon: TrendingUp, color: "#4ade80", label: "Créer du contenu marketing 10× plus vite" },
  { icon: BarChart3,  color: "#f472b6", label: "Analyser vos données business en secondes" },
  { icon: Bot,        color: "#34d399", label: "Déléguer vos tâches répétitives à des agents IA" },
];

const BEFORE_AFTER = [
  {
    color:  "#a78bfa",
    task:   "Rédiger une proposition commerciale",
    before: "2h de rédaction, structure imparfaite, relances oubliées",
    after:  "8 minutes avec un prompt structuré → document professionnel prêt à envoyer",
  },
  {
    color:  "#4ade80",
    task:   "Créer du contenu pour les réseaux",
    before: "Panne d'inspiration, 1 post par semaine max, temps perdu chaque lundi",
    after:  "10 idées + 3 textes rédigés en 20 minutes avec l'IA comme co-auteur",
  },
  {
    color:  "#60a5fa",
    task:   "Prospecter de nouveaux clients",
    before: "Emails froids génériques, taux de réponse < 5%, démarchage épuisant",
    after:  "Séquences personnalisées générées par IA, recherche déléguée, gain de temps massif",
  },
] as const;

const TOOLS_INCLUDED = [
  {
    icon:  Bot,
    color: "#a78bfa",
    title: "Assistant IA pédagogique",
    desc:  "Posez vos questions sur n'importe quel cours. Réponses contextualisées à votre chapitre, disponibles 24h/7j.",
  },
  {
    icon:  Brain,
    color: "#60a5fa",
    title: "Résumé automatique des cours",
    desc:  "Générez en un clic un résumé en 5 points clés de chaque chapitre, adapté à votre niveau.",
  },
  {
    icon:  Download,
    color: "#34d399",
    title: "Fiches PDF téléchargeables",
    desc:  "Chaque cours est exportable en fiche PDF propre, prête à imprimer ou à conserver.",
  },
  {
    icon:  BookMarked,
    color: "#4ade80",
    title: "Quiz intelligent",
    desc:  "5 questions générées par IA sur le contenu du cours pour valider votre compréhension.",
  },
  {
    icon:  Star,
    color: "#f9a826",
    title: "Favoris & prompts sauvegardés",
    desc:  "Marquez vos chapitres préférés et retrouvez vos prompts en un clic depuis votre tableau de bord.",
  },
  {
    icon:  BarChart3,
    color: "#f472b6",
    title: "Comparateur d'IA",
    desc:  "Tableau interactif : ChatGPT, Claude, Gemini, Perplexity. Choisissez le bon outil pour chaque tâche.",
  },
  {
    icon:  Rocket,
    color: "#f87171",
    title: "Plan d'action personnalisé",
    desc:  "L'IA génère pour vous un plan d'action concret en 5 étapes à partir de chaque module.",
  },
  {
    icon:  Calendar,
    color: "#38bdf8",
    title: "Réservation accompagnement 4h",
    desc:  "Planifiez vos séances d'accompagnement expert directement depuis l'espace membre.",
  },
];

const INCLUDED = [
  "6 modules complets · 20 chapitres",
  "Assistant IA pédagogique disponible 24h/7j",
  "4h d'accompagnement expert incluses",
  "Quiz, résumés IA et fiches PDF pour chaque cours",
  "Bibliothèque de prompts prêts à l'emploi",
  "Accès pendant 3 mois complets",
  "Mises à jour du contenu incluses",
];

const FAQ = [
  {
    q: "Faut-il des connaissances techniques pour suivre ce coaching ?",
    a: "Aucune. La formation est conçue pour les entrepreneurs et freelances sans background tech. Tout est expliqué avec des exemples concrets du monde réel, applicables dès le premier cours.",
  },
  {
    q: "Comment accéder à l'espace membre après paiement ?",
    a: "Immédiatement après paiement par carte (Stripe). Par virement, l'accès est activé sous 24 à 48h dès réception du virement. Vous recevrez un email avec votre lien d'accès personnalisé.",
  },
  {
    q: "En quoi consistent les 4h d'accompagnement expert ?",
    a: "Ce sont 4 heures de visioconférence avec un expert DJAMA, à utiliser comme vous le souhaitez sur 3 mois. Revue de progression, déblocage de points durs, stratégie IA, retour sur vos automatisations. Réservation directement depuis l'espace membre.",
  },
  {
    q: "L'accès est valable combien de temps ?",
    a: "3 mois à partir du jour de votre paiement. C'est largement suffisant pour compléter le programme au rythme de 2 à 3 heures par semaine.",
  },
  {
    q: "Est-ce que le contenu est mis à jour ?",
    a: "Oui. Le paysage IA évolue rapidement — nous mettons à jour les modules régulièrement. Toutes les mises à jour sont incluses pendant votre période d'accès.",
  },
  {
    q: "Y a-t-il une garantie satisfait ou remboursé ?",
    a: "Oui. Si dans les 7 premiers jours vous n'êtes pas satisfait, nous vous remboursons intégralement, sans justification demandée.",
  },
  {
    q: "Quelle est la différence entre carte et virement ?",
    a: "Par carte (Stripe), l'accès est immédiat et sécurisé. Par virement bancaire, l'accès est activé manuellement sous 24 à 48h après réception du virement. Les deux options donnent accès aux mêmes contenus.",
  },
];

/* ─────────────────────────────────────────────────────────
   COMPOSANT — FAQ item
───────────────────────────────────────────────────────── */
function FaqItem({
  q, a, open, onToggle,
}: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-all hover:border-[rgba(167,139,250,0.2)]"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
        <p className="text-sm font-semibold leading-relaxed text-white/80">{q}</p>
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
            <p className="border-t border-white/[0.05] px-5 pb-5 pt-4 text-sm leading-relaxed text-white/50 sm:px-6">
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
    { id: "stripe",   label: "Carte bancaire" },
    { id: "virement", label: "🏦 Virement"        },
  ] as const;

  const BANK_ROWS = [
    { label: "Bénéficiaire", value: "EI AMDJAD Nofane",                 copy: "EI AMDJAD Nofane",              field: "beneficiaire", mono: false, highlight: false },
    { label: "IBAN",         value: "FR76 4061 8804 5900 0406 3964 945", copy: "FR7640618804590004063964945",    field: "iban",         mono: true,  highlight: false },
    { label: "BIC",          value: "BOUSFRPPXXX",                       copy: "BOUSFRPPXXX",                   field: "bic",          mono: true,  highlight: false },
    { label: "Banque",       value: "BoursoBank",                        copy: "BoursoBank",                    field: "banque",       mono: false, highlight: false },
    { label: "Référence",    value: "COACHING-IA",                       copy: "COACHING-IA",                   field: "reference",    mono: true,  highlight: true  },
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
          className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(167,139,250,0.3)] transition-all hover:shadow-[0_8px_48px_rgba(167,139,250,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#a78bfa,#7c6fcd)" }}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Redirection…</>
            : <><Zap size={18} /> Commencer maintenant — 190€</>
          }
        </button>
      )}

      {/* ── Virement ── */}
      {tab === "virement" && (
        <div className="space-y-3">
          <div className="mb-1 text-center">
            <p className="text-xs font-bold text-white/60">🏦 Paiement par virement bancaire</p>
            <p className="mt-0.5 text-[0.68rem] text-white/30">
              Effectuez votre virement puis confirmez pour activer votre accès
            </p>
          </div>

          {/* Coordonnées bancaires */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.04] transition-all hover:border-white/[0.14]">
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
              <div
                className="rounded-xl px-3 py-1.5"
                style={{ background: `rgba(${ACCENT_RGB},0.1)`, border: `1px solid rgba(${ACCENT_RGB},0.25)` }}
              >
                <span className="text-sm font-black" style={{ color: ACCENT }}>190,00 €</span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {BANK_ROWS.map(({ label, value, copy, field, mono, highlight }) => (
                <div
                  key={field}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/25">{label}</p>
                    <p
                      className={`mt-0.5 break-all text-xs font-semibold sm:break-normal ${mono ? "font-mono tracking-wide" : ""}`}
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

          {/* Bandeau rassurant */}
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

          {/* Confirmation / formulaire */}
          {vSent ? (
            <div className="rounded-2xl border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.06)] p-5 text-center">
              <div className="mb-2 text-2xl text-green-400">✓</div>
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
                  @
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

      {error && (
        <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Lien espace privé */}
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
  const [user,    setUser]    = useState<{ id?: string; email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
  }, []);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          STICKY CTA — Mobile seulement
          Positionné juste au-dessus du bouton WhatsApp
      ══════════════════════════════════════════════════════════ */}
      <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
        <div className="border-t border-white/[0.06] bg-[#09090b]/95 px-4 pb-5 pt-3 backdrop-blur-xl">
          <a
            href="#offre"
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(167,139,250,0.35)]"
            style={{ background: "linear-gradient(135deg,#a78bfa,#7c6fcd)" }}
          >
            <Zap size={15} /> Commencer maintenant — 190€
          </a>
          <p className="mt-1.5 text-center text-[0.6rem] text-white/25">
            Paiement sécurisé · Garantie 7 jours
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN WRAPPER — overflow-x-hidden évite le scroll horizontal
      ══════════════════════════════════════════════════════════ */}
      <div className="w-full overflow-x-hidden bg-[#09090b]">

        {/* ════════════════════════════════════════════════════
            §1 · HERO PREMIUM
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden pb-28 pt-20 sm:pb-32 sm:pt-36">

          {/* Grille de fond */}
          <div className="hero-grid absolute inset-0 opacity-25" />

          {/* Glow violet centré */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[rgba(167,139,250,0.10)] blur-[120px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">

            {/* Fil d'Ariane */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="mb-8 flex items-center justify-center gap-2 text-xs text-white/25"
            >
              <Link href="/services" className="transition-colors hover:text-white/50">← Services</Link>
              <span>/</span>
              <span className="text-white/40">Coaching IA</span>
            </motion.div>

            {/* Badge produit */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.08)] px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#a78bfa]"
            >
              <Brain size={11} /> Formation IA · Paiement unique · 190€
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.1 }}
              className="display-hero text-white"
            >
              Maîtrisez l&apos;IA pour{" "}
              <span style={{ color: ACCENT }}>gagner du temps,</span>
              <br />
              automatiser et{" "}
              <span className="text-[#f9a826]">vendre mieux.</span>
            </motion.h1>

            {/* Sous-titre */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease, delay: 0.32 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-[1.85] text-white/55 sm:text-lg"
            >
              Une formation pratique pour entrepreneurs, freelances et PME.
              Des cours clairs, des outils IA, un assistant pédagogique
              et <strong className="font-semibold text-white/75">4h d&apos;accompagnement expert</strong> sur 3 mois.
            </motion.p>

            {/* Boutons CTA */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52, ease }}
              className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center"
            >
              <a
                href="#offre"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-8 py-4 text-base font-extrabold text-white sm:w-auto"
                style={{
                  background: "linear-gradient(135deg,#a78bfa,#7c6fcd)",
                  boxShadow:  "0 8px 32px rgba(167,139,250,0.35)",
                }}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center gap-2">
                  <Zap size={16} /> Commencer maintenant — 190€
                </span>
              </a>
              <a
                href="#programme"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-8 py-4 text-base font-semibold text-white/70 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] hover:text-white sm:w-auto"
              >
                Voir le programme <ArrowRight size={15} />
              </a>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.78 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-white/[0.07] pt-8"
            >
              {[
                "6 modules", "20 chapitres", "Assistant IA inclus",
                "4h accompagnement expert", "Accès 3 mois", "Garantie 7 jours",
              ].map((label) => (
                <div key={label} className="flex items-center gap-2 text-[0.72rem] font-medium text-white/35">
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §2 · CE QUE VOUS ALLEZ SAVOIR FAIRE — fond blanc
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-white py-16 sm:py-24">
          <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.07)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#7c3aed]">
                <Sparkles size={9} /> Ce que vous maîtriserez
              </span>
              <h2 className="display-section text-[#09090b]">
                Ce que vous allez{" "}
                <span style={{ color: ACCENT }}>savoir faire.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#6b7280]">
                Dès la fin de la formation, ces capacités font partie de votre quotidien professionnel.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {OUTCOMES.map(({ icon: Icon, color, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="group flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ background: `${color}15`, boxShadow: `0 0 0 1px ${color}22` }}
                  >
                    <Icon size={19} style={{ color }} />
                  </div>
                  <p className="text-[0.88rem] font-semibold leading-snug text-[#09090b]">{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §3 · AVANT / APRÈS — fond sombre
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-[rgba(167,139,250,0.05)] blur-[100px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#f9a826]">
                <Zap size={9} /> Résultats concrets
              </span>
              <h2 className="display-section text-white">
                Avant / Après{" "}
                <span style={{ color: ACCENT }}>la formation.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/45">
                Des cas concrets que vous vivrez dans votre activité.
              </p>
            </motion.div>

            <div className="space-y-4">
              {BEFORE_AFTER.map(({ color, task, before, after }, i) => (
                <motion.div
                  key={task}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.45, delay: i * 0.09 }}
                  className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]"
                >
                  <div className="flex items-center gap-3 border-b border-white/[0.05] bg-white/[0.04] px-5 py-3.5">
                    <p className="text-sm font-bold text-white/85">{task}</p>
                  </div>
                  <div className="grid grid-cols-1 divide-y divide-white/[0.05] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <div className="bg-[rgba(248,113,113,0.04)] px-5 py-5">
                      <p className="mb-2.5 text-[0.6rem] font-bold uppercase tracking-widest text-red-400">
                        Sans la formation
                      </p>
                      <p className="text-sm leading-relaxed text-white/45">{before}</p>
                    </div>
                    <div className="px-5 py-5" style={{ background: `rgba(${color.slice(1).match(/../g)!.map(x=>parseInt(x,16)).join(',')},0.06)` }}>
                      <p
                        className="mb-2.5 text-[0.6rem] font-bold uppercase tracking-widest"
                        style={{ color }}
                      >
                        Avec la formation
                      </p>
                      <p className="text-sm font-semibold leading-relaxed text-white/80">{after}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §4 · PROGRAMME COMPLET — fond blanc
        ════════════════════════════════════════════════════ */}
        <section id="programme" className="relative overflow-hidden bg-white py-16 sm:py-24">
          <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.07)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#7c3aed]">
                <BookOpen size={9} /> 6 modules · 20 chapitres
              </span>
              <h2 className="display-section text-[#09090b]">
                Le programme{" "}
                <span style={{ color: ACCENT }}>complet.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#6b7280]">
                Une progression logique du débutant jusqu&apos;à l&apos;application business avancée.
              </p>
            </motion.div>

            <div className="space-y-3">
              {COACHING_MODULES.map((module, idx) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.45, ease, delay: idx * 0.06 }}
                  className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm"
                >
                  <button
                    onClick={() => setOpenMod(openMod === module.id ? null : module.id)}
                    className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-black/[0.02]"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                      style={{ background: `rgba(${module.rgb},0.10)`, border: `1px solid rgba(${module.rgb},0.2)`, color: module.color }}
                    >
                      {module.id}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.62rem] font-bold text-[#9ca3af]">Module {module.id}</span>
                        <span className="text-[0.62rem] text-[#d1d5db]">·</span>
                        <span className="text-[0.62rem] text-[#9ca3af]">{module.duration}</span>
                      </div>
                      <p className="truncate font-semibold text-[#09090b]">{module.title}</p>
                      <p className="truncate text-xs text-[#6b7280]">{module.tagline}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className="hidden rounded-full px-2 py-0.5 text-[0.6rem] font-bold sm:inline"
                        style={{ background: `rgba(${module.rgb},0.08)`, color: `rgb(${module.rgb})` }}
                      >
                        {module.chapters.length} ch.
                      </span>
                      <motion.div animate={{ rotate: openMod === module.id ? 180 : 0 }} transition={{ duration: 0.22 }}>
                        <ChevronDown size={14} className="text-[#9ca3af]" />
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
                        <div className="border-t border-black/[0.05] px-5 pb-5 pt-4">
                          <p className="mb-4 text-sm text-[#6b7280]">{module.description}</p>
                          <div className="space-y-2">
                            {module.chapters.map((ch) => (
                              <div key={ch.id} className="flex items-center gap-3 rounded-xl bg-[#f9fafb] px-4 py-2.5">
                                <span style={{ color: `rgb(${module.rgb})` }}>
                                  {ch.type === "exercise" ? "✍️" : ch.type === "quiz" ? "❓" : "📖"}
                                </span>
                                <span className="min-w-0 flex-1 text-sm text-[#374151]">{ch.title}</span>
                                <span className="flex shrink-0 items-center gap-1 text-[0.65rem] text-[#9ca3af]">
                                  <Clock size={9} /> {ch.duration}
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
            §5 · OUTILS INCLUS — fond sombre
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-0 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(167,139,250,0.05)] blur-[100px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.08)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#a78bfa]">
                <Zap size={9} /> Inclus dans l&apos;espace membre
              </span>
              <h2 className="display-section text-white">
                Des outils pensés{" "}
                <span style={{ color: ACCENT }}>pour apprendre.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/45">
                L&apos;espace membre va bien au-delà des cours. Chaque outil est conçu pour ancrer les apprentissages et accélérer votre progression.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TOOLS_INCLUDED.map(({ icon: Icon, color, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:border-white/[0.13] hover:bg-white/[0.05]"
                  style={{
                    boxShadow: "0 0 0 0 transparent",
                  }}
                >
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                    style={{ background: `${color}14`, boxShadow: `0 0 0 1px ${color}20` }}
                  >
                    <Icon size={19} style={{ color }} />
                  </div>
                  <p className="mb-1.5 text-[0.87rem] font-bold text-white/85">{title}</p>
                  <p className="text-[0.75rem] leading-relaxed text-white/40">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §6 · ACCOMPAGNEMENT EXPERT 4H — fond blanc
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-white py-16 sm:py-24">
          <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">

              {/* Texte */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={vp}
                transition={{ duration: 0.6, ease }}
              >
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.07)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#7c3aed]">
                  <Video size={9} /> 4h d&apos;accompagnement expert
                </span>
                <h2 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-[#09090b] sm:text-4xl">
                  Un expert à vos côtés{" "}
                  <span style={{ color: ACCENT }}>pendant 3 mois.</span>
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-[#4b5563]">
                  Les cours vous donnent la théorie et la pratique. L&apos;accompagnement expert vous permet d&apos;aller plus loin : appliquer l&apos;IA à votre activité spécifique, débloquer des points durs, construire vos propres automatisations.
                </p>
                <ul className="space-y-3">
                  {[
                    { icon: CheckCircle2, color: "#a78bfa", text: "4 heures de visioconférence avec un expert IA" },
                    { icon: CheckCircle2, color: "#a78bfa", text: "À utiliser librement sur 3 mois" },
                    { icon: CheckCircle2, color: "#a78bfa", text: "Revue de votre progression et déblocage" },
                    { icon: CheckCircle2, color: "#a78bfa", text: "Stratégie IA adaptée à votre métier" },
                    { icon: CheckCircle2, color: "#a78bfa", text: "Réservation en ligne depuis l'espace membre" },
                  ].map(({ icon: Icon, color, text }) => (
                    <li key={text} className="flex items-start gap-3 text-sm text-[#374151]">
                      <Icon size={14} className="mt-0.5 shrink-0" style={{ color }} />
                      {text}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Card visuelle */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={vp}
                transition={{ duration: 0.6, ease, delay: 0.1 }}
              >
                <div className="overflow-hidden rounded-3xl border border-[rgba(167,139,250,0.25)] bg-[#09090b] p-6 shadow-[0_32px_64px_rgba(0,0,0,0.2)]">
                  {/* Header card */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(167,139,250,0.15)]">
                      <Users size={22} style={{ color: ACCENT }} />
                    </div>
                    <div>
                      <p className="font-bold text-white">Accompagnement expert</p>
                      <p className="text-xs text-white/40">Inclus dans votre accès 190€</p>
                    </div>
                  </div>
                  {/* 4 blocs */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: "4h", sub: "d'accompagnement",    color: "#a78bfa" },
                      { val: "3",  sub: "mois d'accès",         color: "#4ade80" },
                      { val: "1:1",sub: "session individuelle", color: "#f9a826" },
                      { val: "100%", sub: "adapté à votre métier",color: "#60a5fa" },
                    ].map(({ val, sub, color }) => (
                      <div
                        key={sub}
                        className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-4 text-center"
                      >
                        <span className="text-2xl font-black" style={{ color }}>{val}</span>
                        <span className="mt-0.5 text-[0.6rem] leading-tight text-white/35">{sub}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.06)] px-4 py-3 text-center">
                    <p className="text-[0.72rem] font-semibold text-[#4ade80]">
                      ✓ Réservation disponible dès votre accès activé
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §7 · PRIX & PAIEMENT — fond sombre
        ════════════════════════════════════════════════════ */}
        <section id="offre" className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(167,139,250,0.07)] blur-[120px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-lg px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5 }}
              className="mb-10 text-center"
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#f9a826]">
                <Sparkles size={9} /> Accès complet
              </span>
              <h2 className="display-section text-white">
                Un prix{" "}
                <span style={{ color: ACCENT }}>transparent.</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xs text-sm text-white/40">
                Paiement unique, sans abonnement. Accès immédiat par carte.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={vp}
              transition={{ duration: 0.65, ease }}
              className="relative overflow-hidden rounded-[2rem] border border-[rgba(167,139,250,0.25)] bg-white/[0.03] shadow-[0_40px_80px_rgba(0,0,0,0.35)]"
            >
              {/* Barre gradient en haut */}
              <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent" />

              <div className="px-5 py-8 sm:px-8 sm:py-10">

                {/* Badges */}
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#a78bfa]">
                    <Brain size={9} /> Formation complète
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] px-3 py-1 text-[0.65rem] font-bold text-[#4ade80]">
                    ✓ Garanti 7 jours
                  </div>
                </div>

                {/* Prix */}
                <div className="mb-1 flex items-end gap-3">
                  <span className="text-[3.5rem] font-black leading-none text-white sm:text-[4rem]">190€</span>
                  <div className="mb-2 flex flex-col gap-1">
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-0.5 text-[0.6rem] font-bold text-white/40 line-through">
                      350€
                    </span>
                  </div>
                </div>
                <p className="mb-1 text-base font-bold text-white/70">Accès 3 mois complet</p>
                <p className="mb-1 text-xs text-white/30">Paiement unique · Sans abonnement</p>
                <p className="mb-6 text-[0.68rem] font-medium text-[#f9a826]">
                  = moins de 2h de consulting à 100€/h
                </p>

                <div className="mb-6 h-px bg-white/[0.07]" />

                {/* Ce qui est inclus */}
                <ul className="mb-8 space-y-3">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#e5e7eb]">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                      {item}
                    </li>
                  ))}
                </ul>

                <PaymentSelector user={user} />

                {/* Garantie */}
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.05)] px-4 py-3">
                  <Shield size={13} style={{ color: "#4ade80" }} />
                  <p className="text-xs font-semibold text-[#4ade80]">
                    Satisfait ou remboursé sous 7 jours — sans justification
                  </p>
                </div>

                {/* Badges confiance */}
                <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
                  {[
                    { icon: Lock,   label: "Paiement sécurisé" },
                    { icon: Zap,    label: "Accès immédiat CB"  },
                    { icon: Shield, label: "Remboursé si besoin"},
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-[0.63rem] text-white/25">
                      <Icon size={9} style={{ color: ACCENT }} /> {label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §8 · AVIS CLIENTS — fond blanc
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-white py-16 sm:py-20">
          <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5 }}
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.03] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#374151]">
                <Star size={9} /> Avis clients
              </span>
              <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-[#09090b] sm:text-3xl">
                Ce qu&apos;en disent les participants
              </h2>
              <div className="mx-auto max-w-md rounded-2xl border border-black/[0.07] bg-[#f9fafb] px-8 py-8">
                <div className="mb-3 h-8 w-8 rounded-full border border-[#e5e7eb] bg-[#f3f4f6]" />
                <p className="text-sm font-semibold text-[#374151]">
                  Aucun avis publié pour le moment.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#9ca3af]">
                  Seuls les avis de clients ayant réellement accédé à la formation seront affichés ici.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §9 · FAQ — fond sombre
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-[400px] w-[400px] -translate-y-1/4 translate-x-1/4 rounded-full bg-[rgba(167,139,250,0.04)] blur-[80px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                <MessageSquare size={9} /> Questions fréquentes
              </span>
              <h2 className="display-section text-white">
                Tout ce que vous voulez{" "}
                <span style={{ color: ACCENT }}>savoir.</span>
              </h2>
            </motion.div>

            <div className="space-y-3">
              {FAQ.map(({ q, a }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.38, ease, delay: i * 0.04 }}
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
            §10 · CTA FINAL — fond sombre avec glow
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#09090b] pb-36 pt-12 sm:pb-24 sm:pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(167,139,250,0.08)] blur-[130px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.65, ease }}
            className="relative z-10 mx-auto max-w-xl px-4 text-center sm:px-6"
          >
            {/* Titre final */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-4 py-1.5 text-xs font-bold text-[#f9a826]">
              <Sparkles size={11} /> Votre avantage compétitif commence ici
            </div>

            <h2 className="display-section mb-5 text-white">
              190€ pour transformer{" "}
              <span style={{ color: ACCENT }}>votre façon de travailler.</span>
            </h2>

            <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-white/45">
              6 modules, 20 chapitres, un assistant IA, 4h d&apos;accompagnement expert.
              Accès complet pendant 3 mois. Garanti 7 jours.
            </p>

            <PaymentSelector user={user} />

            <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[0.72rem] text-white/25">
              <span>✓ Accès immédiat par carte</span>
              <span>✓ 6 modules · 20 chapitres</span>
              <span>✓ 4h accompagnement expert</span>
              <span>✓ Assistant IA inclus</span>
              <span>✓ Garanti 7 jours</span>
            </div>
          </motion.div>
        </section>

      </div>
    </>
  );
}
