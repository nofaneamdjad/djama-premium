"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, CheckCircle2, Zap, Loader2, ExternalLink,
  ReceiptText, Users, Timer, Receipt, FileText, Search,
  TrendingUp, StickyNote, Star, Sparkles, CalendarRange,
  ShieldCheck, RefreshCw, Brain, Gift,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import StripeButton from "@/components/ui/StripeButton";

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

const FEATURES = [
  { Icon: ReceiptText, label: "Factures & Devis Pro",      desc: "Templates premium, PDF, TVA automatique"      },
  { Icon: Users,       label: "CRM Contacts",              desc: "Gestion prospects, export CSV"                },
  { Icon: Timer,       label: "Chrono Pro",                desc: "Timer pause/reprise, suivi par projet"        },
  { Icon: Receipt,     label: "Dépenses",                  desc: "Catégorisation, export mensuel"               },
  { Icon: FileText,    label: "Contrats IA",               desc: "Génération IA en secondes, PDF"               },
  { Icon: Search,      label: "Sourcing IA",               desc: "Expert fournisseurs mondial avec raisonnement"},
  { Icon: TrendingUp,  label: "Trésorerie",                desc: "Cash-flow, flux consolidés"                   },
  { Icon: StickyNote,  label: "Bloc-notes IA",             desc: "Notes intelligentes, catégories, favoris"     },
  { Icon: Star,        label: "Réputation",                desc: "Avis clients, tendance, export"               },
  { Icon: Sparkles,    label: "Coaching IA",               desc: "Objectifs, sessions, progression"             },
  { Icon: Zap,         label: "Assistant IA",              desc: "Relances automatiques, actions urgentes"      },
  { Icon: CalendarRange,label: "Planification",            desc: "Planning équipe, emails auto"                 },
] as const;

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
interface ClientRow {
  paid: boolean;
  statut: string;
  abonnement: string | null;
  subscribed_at: string | null;
  stripe_subscription_id: string | null;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function AbonnementsPage() {
  const [client,  setClient]  = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserEmail(user.email ?? "");

      const { data } = await supabase
        .from("clients")
        .select("paid, statut, abonnement, subscribed_at, stripe_subscription_id")
        .eq("user_id", user.id)
        .maybeSingle();

      setClient(data as ClientRow | null);
      setLoading(false);
    })();
  }, []);

  const isPaid = client?.paid === true || client?.statut === "actif";

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080a0f]">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[10%] top-[5%] h-[600px] w-[600px] rounded-full bg-[rgba(201,165,90,0.05)] blur-[160px]" />
        <div className="absolute bottom-[10%] right-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(139,92,246,0.04)] blur-[140px]" />
      </div>

      {/* ── Sub-header ── */}
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.88)] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-sm" style={{ background: GOLD + "30" }} />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border" style={{ backgroundColor: GOLD + "14", borderColor: GOLD + "30" }}>
              <Crown size={16} style={{ color: GOLD }} />
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">Abonnements</h1>
            <p className="text-[0.65rem] text-white/30">Gérez votre accès DJAMA PRO</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 mx-auto max-w-4xl space-y-8 px-5 py-8 sm:px-8">

        {/* ── Statut actuel ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.6)] px-6 py-5"
            >
              <Loader2 size={18} className="animate-spin text-white/30" />
              <span className="text-sm text-white/30">Chargement de votre abonnement…</span>
            </motion.div>
          ) : isPaid ? (
            <motion.div key="active"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
              className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(74,222,128,0.25)] bg-[rgba(15,17,23,0.7)] p-6"
            >
              {/* Glow */}
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 0% 50%, rgba(74,222,128,0.07) 0%, transparent 70%)" }} />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10">
                    <ShieldCheck size={22} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-extrabold text-white">Abonnement actif</p>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-emerald-400">
                        Pro
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/40">
                      {client?.subscribed_at
                        ? `Actif depuis le ${new Date(client.subscribed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                        : "Accès complet à tous les outils DJAMA PRO"}
                    </p>
                    {userEmail && <p className="mt-0.5 text-xs text-white/25">{userEmail}</p>}
                  </div>
                </div>
                <a
                  href="https://billing.stripe.com/p/login/test_00g00g00g"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80"
                >
                  <RefreshCw size={11} /> Gérer <ExternalLink size={10} />
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.div key="inactive"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
              className="relative overflow-hidden rounded-[1.75rem] border border-amber-500/20 bg-[rgba(15,17,23,0.7)] p-6"
            >
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 0% 50%, rgba(245,158,11,0.05) 0%, transparent 70%)" }} />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/8">
                  <Crown size={20} style={{ color: "#f59e0b" }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/80">Aucun abonnement actif</p>
                  <p className="mt-0.5 text-xs text-white/35">
                    Débloquez tous les outils DJAMA PRO pour 11,90€/mois
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Plan card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
          className="relative overflow-hidden rounded-[2rem] border bg-[rgba(15,17,23,0.75)] shadow-[0_16px_60px_rgba(0,0,0,0.5)]"
          style={{ borderColor: GOLD + "28" }}
        >
          {/* Top gradient bar */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}, ${GOLD}00)` }} />

          {/* Inner glow */}
          <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${GOLD}08 0%, transparent 60%)` }} />

          <div className="relative p-8 sm:p-10">

            {/* Plan header */}
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ backgroundColor: GOLD + "14", borderColor: GOLD + "30" }}>
                    <Crown size={18} style={{ color: GOLD }} />
                  </div>
                  <span className="rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: GOLD, borderColor: GOLD + "40", backgroundColor: GOLD + "12" }}>
                    Recommandé
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">DJAMA PRO</h2>
                <p className="mt-1 text-sm text-white/40">Accès complet à la suite d'outils professionnels</p>

                {/* ── Coaching IA offert ── */}
                <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-[rgba(217,70,239,0.3)] bg-[rgba(217,70,239,0.08)] px-4 py-2.5">
                  <Gift size={15} className="shrink-0 text-fuchsia-400" />
                  <div>
                    <p className="text-xs font-extrabold text-fuchsia-300">Coaching IA offert</p>
                    <p className="text-[0.65rem] text-white/45 leading-tight">
                      Le programme Coaching IA (valeur 29€/mois) est inclus gratuitement avec votre abonnement DJAMA PRO.
                    </p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <div className="flex items-end justify-end gap-1">
                  <span className="text-4xl font-black text-white">11,90</span>
                  <span className="mb-1 text-lg font-bold text-white/60">€</span>
                </div>
                <p className="text-xs text-white/35">/ mois · sans engagement</p>
              </div>
            </div>

            {/* Features grid */}
            <div className="mb-8 grid gap-3 sm:grid-cols-2">
              {FEATURES.map(({ Icon, label, desc }) => {
                const isCoaching = label === "Coaching IA";
                return (
                  <div
                    key={label}
                    className={`flex items-start gap-3 rounded-[1rem] border px-4 py-3 ${
                      isCoaching
                        ? "border-[rgba(217,70,239,0.25)] bg-[rgba(217,70,239,0.06)]"
                        : "border-white/6 bg-white/3"
                    }`}
                  >
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                      style={
                        isCoaching
                          ? { backgroundColor: "rgba(217,70,239,0.12)", borderColor: "rgba(217,70,239,0.3)" }
                          : { backgroundColor: GOLD + "10", borderColor: GOLD + "25" }
                      }
                    >
                      <Icon size={13} style={{ color: isCoaching ? "#e879f9" : GOLD }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-bold ${isCoaching ? "text-fuchsia-300" : "text-white/85"}`}>{label}</p>
                        {isCoaching && (
                          <span className="rounded-full border border-[rgba(217,70,239,0.4)] bg-[rgba(217,70,239,0.15)] px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-fuchsia-300">
                            Offert
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[0.65rem] text-white/35 leading-tight">{desc}</p>
                    </div>
                    <CheckCircle2 size={13} className={`mt-0.5 shrink-0 ${isCoaching ? "text-fuchsia-400/60" : "text-emerald-400/60"}`} />
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            {!loading && (
              isPaid ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 py-4 text-sm font-bold text-emerald-400">
                  <CheckCircle2 size={16} />
                  Vous bénéficiez déjà de tous ces avantages
                </div>
              ) : (
                <div className="space-y-3">
                  <StripeButton label="S'abonner pour 11,90€ / mois" />
                  <p className="text-center text-[0.65rem] text-white/25">
                    Paiement sécurisé par Stripe · Résiliation à tout moment · Aucun frais caché
                  </p>
                </div>
              )
            )}
          </div>
        </motion.div>

        {/* ── Garanties ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.25 }}
          className="grid gap-3 sm:grid-cols-3"
        >
          {[
            { title: "Paiement sécurisé",  desc: "Stripe · Chiffrement SSL · 3D Secure"    },
            { title: "Sans engagement",     desc: "Résiliez à tout moment depuis votre espace" },
            { title: "Accès immédiat",      desc: "Outils disponibles dès la confirmation"  },
          ].map((g) => (
            <div key={g.title} className="flex items-start gap-3 rounded-[1.25rem] border border-white/6 bg-[rgba(15,17,23,0.5)] px-4 py-4">
              <div>
                <p className="text-xs font-bold text-white/80">{g.title}</p>
                <p className="mt-0.5 text-[0.65rem] leading-tight text-white/35">{g.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── FAQ ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-[1.5rem] border border-white/6 bg-[rgba(15,17,23,0.5)] p-6 space-y-4"
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/30 mb-2">Questions fréquentes</p>
          {[
            { q: "Puis-je résilier à tout moment ?",          r: "Oui. Vous pouvez annuler votre abonnement depuis votre portail Stripe à tout moment, sans frais." },
            { q: "Que se passe-t-il après résiliation ?",     r: "Votre accès reste actif jusqu'à la fin de la période payée. Vos données sont conservées 30 jours." },
            { q: "Y a-t-il une période d'essai ?",            r: "DJAMA PRO n'offre pas d'essai gratuit, mais la résiliation sans engagement vous permet de tester sans risque." },
            { q: "Facturation TVA incluse ?",                  r: "Oui. Le prix de 11,90€ est TTC. Une facture est émise automatiquement par Stripe chaque mois." },
          ].map(({ q, r }) => (
            <div key={q} className="border-t border-white/5 pt-4 first:border-0 first:pt-0">
              <p className="text-xs font-bold text-white/70">{q}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/35">{r}</p>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
