"use client";

import { motion } from "framer-motion";
import {
  Crown, CheckCircle2, Sparkles,
  ShieldCheck, RefreshCw, ExternalLink,
} from "lucide-react";
import { useSubscription } from "@/lib/use-require-subscription";
import StripeButton from "@/components/ui/StripeButton";
import Link from "next/link";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  "CRM & pipeline clients",
  "Trésorerie & suivi des dépenses",
  "Contrats IA & factures illimitées",
  "Assistant IA & Coaching personnalisé",
  "Stocks & gestion fournisseurs",
  "Équipe, planning avancé & time tracking",
] as const;

export default function AbonnementsPage() {
  const { level, isPremium, email: userEmail } = useSubscription();

  const loading = level === "loading";
  const isPaid  = level === "premium";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0c10] px-4 py-16">

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
          style={{ background: "rgba(201,165,90,0.07)" }}
        />
        <div
          className="absolute left-[-80px] top-[15%] h-[300px] w-[300px] rounded-full blur-[100px]"
          style={{ background: "rgba(59,130,246,0.04)" }}
        />
        <div
          className="absolute bottom-[10%] right-[-60px] h-[250px] w-[250px] rounded-full blur-[100px]"
          style={{ background: "rgba(139,92,246,0.04)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Back link */}
      <div className="relative z-10 mb-8 w-full max-w-[440px]">
        <Link
          href="/client"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/60"
        >
          ← Retour à l&apos;espace client
        </Link>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Outer glow border */}
        <div
          className="absolute inset-0 rounded-[2rem] opacity-60 blur-sm"
          style={{ background: `linear-gradient(160deg, ${GOLD}18, transparent 60%)` }}
        />

        <div
          className="relative overflow-hidden rounded-[2rem] p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(40px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* Inner glow top */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: `${GOLD}14` }}
          />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease }}
            className="relative mb-8 flex flex-col items-center gap-3 text-center"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}28` }}
            >
              <Crown size={24} style={{ color: GOLD }} />
            </div>
            <div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest"
                style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}22`, color: GOLD }}
              >
                <Sparkles size={9} /> DJAMA PRO
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold text-white">Tout débloquer</h1>
              <p className="mt-1 text-sm text-white/40">Accès complet · sans engagement</p>
            </div>
          </motion.div>

          {/* Price */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.18, ease }}
            className="relative mb-8 text-center"
          >
            <div className="flex items-end justify-center gap-1">
              <span className="text-[3.5rem] font-black leading-none text-white tracking-tight">11</span>
              <span className="mb-2 text-[1.8rem] font-black text-white/80">,90</span>
              <span className="mb-2 text-2xl font-black text-white/60">€</span>
              <span className="mb-1 ml-1 text-sm font-medium text-white/30">/mois</span>
            </div>
            <p className="mt-1.5 text-[0.68rem] text-white/25">Sans engagement · Résiliable à tout moment</p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease }}
            className="relative mb-7 space-y-2.5"
          >
            {FEATURES.map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${GOLD}12` }}
                >
                  <CheckCircle2 size={12} style={{ color: GOLD }} />
                </div>
                <span className="text-sm text-white/65">{feat}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-0.5">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${GOLD}08` }}
              >
                <span className="text-[0.6rem] font-bold" style={{ color: `${GOLD}70` }}>+</span>
              </div>
              <span className="text-sm text-white/30">9 autres outils inclus</span>
            </div>
          </motion.div>

          {/* CTA ou statut */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.32, ease }}
            className="relative space-y-3"
          >
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
              </div>

            ) : isPaid ? (
              /* Abonnement actif */
              <div
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3.5"
                style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)" }}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Abonnement actif</p>
                    {userEmail && (
                      <p className="text-[0.65rem] text-white/30">{userEmail}</p>
                    )}
                  </div>
                </div>
                <a
                  href="https://billing.stripe.com/p/login/test_00g00g00g"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1 text-[0.65rem] font-medium text-white/35 transition hover:text-white/60"
                >
                  Gérer <ExternalLink size={10} /> <RefreshCw size={10} />
                </a>
              </div>

            ) : (
              /* Plan gratuit — CTA */
              <>
                <StripeButton label="Débloquer DJAMA PRO — 11,90€/mois" />
                <p className="text-center text-[0.62rem] text-white/20">
                  Paiement sécurisé · Sans engagement · Résiliable à tout moment
                </p>
              </>
            )}
          </motion.div>

          {/* Trust badges */}
          {!isPaid && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="relative mt-6 flex items-center justify-center gap-5"
            >
              {["Stripe SSL", "Paiement sécurisé", "Résiliable"].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full" style={{ background: `${GOLD}50` }} />
                  <span className="text-[0.6rem] text-white/25">{badge}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Bottom note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="relative z-10 mt-6 text-center text-[0.65rem] text-white/20"
      >
        DJAMA · Plateforme SaaS professionnelle · Données hébergées en Europe
      </motion.p>
    </div>
  );
}
