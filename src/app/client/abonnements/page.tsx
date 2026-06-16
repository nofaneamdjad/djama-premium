"use client";

import { motion } from "framer-motion";
import {
  Crown, CheckCircle2, Sparkles,
  ShieldCheck, RefreshCw, ExternalLink, ArrowRight,
  Check, Minus,
} from "lucide-react";
import { useSubscription } from "@/lib/use-require-subscription";
import StripeButton from "@/components/ui/StripeButton";
import Link from "next/link";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

type FeatureValue = boolean | string;
interface Feature { label: string; free: FeatureValue; pro: FeatureValue }
interface Section  { category: string; features: Feature[] }

const COMPARISON: Section[] = [
  {
    category: "Essentiels",
    features: [
      { label: "Factures & devis",   free: "5 max",   pro: "Illimité" },
      { label: "Planning",           free: true,      pro: true       },
      { label: "Bloc-note",          free: true,      pro: true       },
    ],
  },
  {
    category: "Finance",
    features: [
      { label: "Tableau de bord",    free: false,     pro: true },
      { label: "Trésorerie",         free: false,     pro: true },
      { label: "Dépenses",           free: false,     pro: true },
    ],
  },
  {
    category: "Commercial",
    features: [
      { label: "CRM & pipeline",     free: false,     pro: true },
      { label: "Contrats IA",        free: false,     pro: true },
      { label: "Fournisseurs",       free: false,     pro: true },
      { label: "Stocks",             free: false,     pro: true },
    ],
  },
  {
    category: "Opérations",
    features: [
      { label: "Tâches",             free: false,     pro: true },
      { label: "Équipe & planning",  free: false,     pro: true },
      { label: "Chrono",             free: false,     pro: true },
    ],
  },
  {
    category: "Intelligence artificielle",
    features: [
      { label: "Assistant IA",       free: false,     pro: true },
      { label: "Notes IA",           free: false,     pro: true },
      { label: "Sourcing IA",        free: false,     pro: true },
      { label: "Coaching IA",        free: false,     pro: true },
    ],
  },
  {
    category: "Extras",
    features: [
      { label: "Réputation",         free: false,     pro: true },
      { label: "Réseaux sociaux",    free: false,     pro: true },
      { label: "Support prioritaire",free: false,     pro: true },
    ],
  },
];

function Cell({ val, isProCol }: { val: FeatureValue; isProCol: boolean }) {
  if (val === true)
    return <Check size={15} style={{ color: isProCol ? GOLD : "#6b7280" }} strokeWidth={2.5} />;
  if (val === false)
    return <Minus size={13} className="text-white/20" strokeWidth={2} />;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
      style={
        isProCol
          ? { background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}28` }
          : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }
      }
    >
      {val}
    </span>
  );
}

export default function AbonnementsPage() {
  const { level, isPremium, email: userEmail } = useSubscription();

  const loading = level === "loading";
  const isPaid  = level === "premium";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080e] px-4 py-10 text-white">

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
          style={{ background: "rgba(201,165,90,0.08)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Back link */}
      <div className="relative z-10 mb-8 w-full max-w-4xl mx-auto">
        <Link
          href="/client"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/60"
        >
          ← Retour à l&apos;espace client
        </Link>
      </div>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="relative z-10 mb-10 text-center"
      >
        <div
          className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest"
          style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}22`, color: GOLD }}
        >
          <Sparkles size={9} /> Nos formules
        </div>
        <h1 className="text-3xl font-extrabold text-white">Commencez gratuitement,<br/>passez PRO quand vous êtes prêt</h1>
        <p className="mt-2 text-sm text-white/35">Sans engagement · Résiliable à tout moment</p>
      </motion.div>

      {/* Plan cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease }}
        className="relative z-10 mx-auto mb-10 grid max-w-2xl grid-cols-2 gap-4"
      >
        {/* Gratuit card */}
        <div
          className="flex flex-col rounded-2xl border border-white/6 bg-white/4 p-6"
        >
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/30">Gratuit</p>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-4xl font-black text-white leading-none">0</span>
            <span className="mb-1 text-xl font-bold text-white/40">€</span>
            <span className="mb-0.5 ml-0.5 text-sm text-white/25">/mois</span>
          </div>
          <p className="mb-5 text-[0.68rem] text-white/25">Pour commencer</p>
          <div className="mt-auto space-y-2.5">
            {["Factures & devis (5 max)", "Planning", "Bloc-note"].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <Check size={13} className="shrink-0 text-white/30" strokeWidth={2.5} />
                <span className="text-sm text-white/40">{f}</span>
              </div>
            ))}
          </div>
          {isPaid ? null : (
            <div
              className="mt-6 rounded-xl border border-white/8 py-2.5 text-center text-sm font-bold text-white/35"
            >
              Plan actuel
            </div>
          )}
        </div>

        {/* PRO card */}
        <div className="relative flex flex-col rounded-2xl p-6"
          style={{
            background: "rgba(201,165,90,0.06)",
            border: `1.5px solid ${GOLD}35`,
            boxShadow: `0 0 40px ${GOLD}12`,
          }}
        >
          {/* Popular badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div
              className="flex items-center gap-1 rounded-full px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#0a0a0a" }}
            >
              <Crown size={8} /> Recommandé
            </div>
          </div>

          <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>PRO</p>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-4xl font-black text-white leading-none">11</span>
            <span className="mb-1 text-xl font-bold text-white/60">,90€</span>
            <span className="mb-0.5 ml-0.5 text-sm text-white/30">/mois</span>
          </div>
          <p className="mb-5 text-[0.68rem] text-white/30">Accès complet · sans engagement</p>

          <div className="mt-auto space-y-2.5">
            {["Tout le plan Gratuit", "16 outils PRO débloqués", "IA & Coaching personnalisé", "Support prioritaire"].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ background: `${GOLD}18` }}>
                  <Check size={9} style={{ color: GOLD }} strokeWidth={3} />
                </div>
                <span className="text-sm text-white/70">{f}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-3">
                <div className="relative h-5 w-5">
                  <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(201,165,90,0.18)" }} />
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: "2px solid transparent", borderTopColor: GOLD }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>
            ) : isPaid ? (
              <div
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)" }}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <p className="text-xs font-bold text-emerald-400">Actif</p>
                </div>
                <a
                  href={process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL ?? "https://billing.stripe.com/p/login/test_00g00g00g"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[0.6rem] text-white/30 transition hover:text-white/60"
                >
                  Gérer <ExternalLink size={9} /> <RefreshCw size={9} />
                </a>
              </div>
            ) : (
              <StripeButton label="Débloquer PRO — 11,90€/mois" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease }}
        className="relative z-10 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/6 bg-white/4"
      >
        {/* Table header */}
        <div
          className="grid grid-cols-[1fr_80px_80px] gap-0 border-b border-white/6 px-5 py-3 bg-white/3"
        >
          <div />
          <div className="text-center text-[0.68rem] font-bold uppercase tracking-widest text-white/30">Gratuit</div>
          <div className="text-center text-[0.68rem] font-bold uppercase tracking-widest" style={{ color: GOLD }}>PRO</div>
        </div>

        {/* Sections */}
        {COMPARISON.map((section, si) => (
          <div key={section.category}>
            {/* Category label */}
            <div
              className="px-5 pb-1 pt-3"
              style={{ borderTop: si > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
            >
              <p className="text-[0.58rem] font-bold uppercase tracking-wider text-white/25">{section.category}</p>
            </div>
            {/* Feature rows */}
            {section.features.map((feat, fi) => (
              <div
                key={feat.label}
                className="grid grid-cols-[1fr_80px_80px] items-center gap-0 px-5 py-2.5"
                style={{
                  background: fi % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent",
                }}
              >
                <span className="text-sm text-white/55">{feat.label}</span>
                <div className="flex items-center justify-center">
                  <Cell val={feat.free} isProCol={false} />
                </div>
                <div className="flex items-center justify-center">
                  <Cell val={feat.pro} isProCol={true} />
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* CTA row */}
        {!isPaid && !loading && (
          <div
            className="px-5 py-4 border-t border-white/6"
            style={{ background: "rgba(201,165,90,0.03)" }}
          >
            <div className="grid grid-cols-[1fr_80px_80px] items-center gap-0">
              <p className="text-sm font-semibold text-white/50">Commencer maintenant</p>
              <div className="flex justify-center">
                <div className="text-[0.7rem] font-semibold text-white/25">Plan actuel</div>
              </div>
              <div className="flex justify-center">
                <motion.a
                  href="/client/abonnements"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[0.72rem] font-bold text-[#0a0a0a]"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
                  onClick={(e) => e.preventDefault()}
                >
                  Choisir <ArrowRight size={10} />
                </motion.a>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="relative z-10 mt-8 flex items-center justify-center gap-6"
      >
        {["Stripe SSL", "Paiement sécurisé", "Résiliable à tout moment", "Données hébergées en Europe"].map((badge) => (
          <div key={badge} className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full" style={{ background: `${GOLD}50` }} />
            <span className="text-[0.6rem] text-white/20">{badge}</span>
          </div>
        ))}
      </motion.div>

      <p className="relative z-10 mt-4 text-center text-[0.6rem] text-white/15 pb-20 lg:pb-4">
        DJAMA · Plateforme SaaS professionnelle
      </p>
    </div>
  );
}
