"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, CheckCircle2, Sparkles,
  ShieldCheck, RefreshCw, ExternalLink, ArrowRight,
  Check, Minus, FileText, Download, Calendar,
  Tag, AlertCircle, Loader2, BarChart2, Wallet,
  Receipt, TrendingUp, Users, Clock,
} from "lucide-react";
import { useSubscription } from "@/lib/use-require-subscription";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

type FeatureValue = boolean | string;
interface Feature { label: string; free: FeatureValue; pro: FeatureValue }
interface Section  { category: string; features: Feature[] }

type Invoice = {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  date: number;
  pdf: string | null;
};

type BillingData = {
  invoices: Invoice[];
  renewalDate: number | null;
};

type UsageStats = {
  facturesMois: number;
  facturesTotal: number;
  devisTotal: number;
  employes: number;
};

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

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency === "EUR" ? "EUR" : currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function invoiceStatusLabel(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "paid":   return { label: "Payée",  color: "#4ade80", bg: "rgba(74,222,128,0.10)" };
    case "open":   return { label: "Ouverte", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" };
    case "void":   return { label: "Annulée", color: "#9ca3af", bg: "rgba(156,163,175,0.10)" };
    default:       return { label: status,    color: "#9ca3af", bg: "rgba(156,163,175,0.10)" };
  }
}

export default function AbonnementsPage() {
  const { level, isPremium, email: userEmail, userId } = useSubscription();

  const loading = level === "loading";
  const isPaid  = level === "premium";

  /* ── Code promo ── */
  const [promoCode,    setPromoCode]    = useState("");
  const [promoError,   setPromoError]   = useState("");
  const [checkingOut,  setCheckingOut]  = useState(false);

  /* ── Billing Stripe ── */
  const [billing,      setBilling]      = useState<BillingData | null>(null);
  const [loadingBill,  setLoadingBill]  = useState(false);

  /* ── Usage stats ── */
  const [usage, setUsage] = useState<UsageStats | null>(null);

  /* Fetch billing info when premium */
  useEffect(() => {
    if (!isPaid) return;
    setLoadingBill(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoadingBill(false); return; }
      try {
        const res = await fetch("/api/stripe/billing", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json() as BillingData;
          setBilling(data);
        }
      } catch { /* ignore */ }
      setLoadingBill(false);
    });
  }, [isPaid]);

  /* Fetch usage stats from Supabase */
  useEffect(() => {
    if (!userId) return;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    Promise.all([
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("type", "facture")
        .gte("created_at", startOfMonth),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("type", "facture"),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("type", "devis"),
      supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]).then(([mois, total, devis, emp]) => {
      setUsage({
        facturesMois:  mois.count  ?? 0,
        facturesTotal: total.count ?? 0,
        devisTotal:    devis.count ?? 0,
        employes:      emp.count   ?? 0,
      });
    });
  }, [userId]);

  /* Checkout with optional promo code */
  async function handleCheckout() {
    setCheckingOut(true);
    setPromoError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:        user?.id        ?? null,
          userEmail:     user?.email     ?? null,
          promotionCode: promoCode.trim() || undefined,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) {
        setPromoError(data.error ?? "Erreur de paiement.");
        setCheckingOut(false);
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setPromoError("Une erreur est survenue. Réessayez.");
      setCheckingOut(false);
    }
  }

  const renewalDate = billing?.renewalDate;

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
      <div className="relative z-10 mb-8 mx-auto w-full max-w-4xl">
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
        className="relative z-10 mx-auto mb-8 grid max-w-2xl grid-cols-2 gap-4"
      >
        {/* Gratuit card */}
        <div className="flex flex-col rounded-2xl border border-white/6 bg-white/4 p-6">
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
            <div className="mt-6 rounded-xl border border-white/8 py-2.5 text-center text-sm font-bold text-white/35">
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

          <div className="mt-6 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-3">
                <div className="relative h-5 w-5">
                  <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(201,165,90,0.18)" }} />
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ borderWidth: "2px", borderStyle: "solid", borderTopColor: GOLD, borderRightColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "transparent" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>
            ) : isPaid ? (
              <>
                <div
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)" }}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <p className="text-xs font-bold text-emerald-400">Actif</p>
                  </div>
                  <a
                    href={process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[0.6rem] text-white/30 transition hover:text-white/60"
                  >
                    Gérer <ExternalLink size={9} /> <RefreshCw size={9} />
                  </a>
                </div>
                {/* Renewal date */}
                {renewalDate && (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: `${GOLD}08` }}>
                    <Calendar size={12} style={{ color: GOLD }} />
                    <p className="text-[0.7rem] text-white/50">
                      Renouvellement le <span className="font-semibold text-white/70">{formatDate(renewalDate)}</span>
                    </p>
                  </div>
                )}
                {loadingBill && !renewalDate && (
                  <div className="flex items-center gap-2 px-1 py-1">
                    <Loader2 size={11} className="animate-spin text-white/25" />
                    <span className="text-[0.65rem] text-white/25">Chargement…</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Code promo field */}
                <div className="space-y-1.5">
                  <div className="relative flex items-center gap-2">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <Tag size={12} className="text-white/30" />
                    </div>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                      placeholder="CODE PROMO (optionnel)"
                      maxLength={30}
                      className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-8 pr-3 text-xs font-mono text-white/70 placeholder-white/20 outline-none transition focus:border-white/20"
                    />
                  </div>
                  <AnimatePresence>
                    {promoError && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/8 px-2.5 py-1.5">
                          <AlertCircle size={11} className="shrink-0 text-red-400" />
                          <p className="text-[0.65rem] text-red-400">{promoError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="btn-primary w-full justify-center py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {checkingOut ? (
                    <><Loader2 size={15} className="animate-spin" /> Redirection…</>
                  ) : (
                    <><Wallet size={15} /> Débloquer PRO — 11,90€/mois</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Usage stats (premium only) ── */}
      {isPaid && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
          className="relative z-10 mx-auto mb-8 max-w-2xl"
        >
          <div className="mb-3 flex items-center gap-2">
            <BarChart2 size={14} style={{ color: GOLD }} />
            <h2 className="text-sm font-bold text-white">Utilisation du compte</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: Receipt,
                label: "Factures ce mois",
                value: usage ? String(usage.facturesMois) : "—",
                sub: "illimitées",
                color: GOLD,
              },
              {
                icon: FileText,
                label: "Factures total",
                value: usage ? String(usage.facturesTotal) : "—",
                sub: "créées",
                color: "#6366f1",
              },
              {
                icon: TrendingUp,
                label: "Devis total",
                value: usage ? String(usage.devisTotal) : "—",
                sub: "créés",
                color: "#10b981",
              },
              {
                icon: Users,
                label: "Employés",
                value: usage ? String(usage.employes) : "—",
                sub: "dans l'équipe",
                color: "#f59e0b",
              },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label}
                  className="flex flex-col gap-1.5 rounded-2xl border border-white/6 bg-white/4 p-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl"
                    style={{ background: `${stat.color}12` }}>
                    <Icon size={13} style={{ color: stat.color }} />
                  </div>
                  <p className="text-xl font-black text-white leading-none">{stat.value}</p>
                  <div>
                    <p className="text-[0.65rem] font-semibold text-white/50">{stat.label}</p>
                    <p className="text-[0.6rem] text-white/25">{stat.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Invoice history (premium only) ── */}
      {isPaid && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
          className="relative z-10 mx-auto mb-8 max-w-2xl"
        >
          <div className="mb-3 flex items-center gap-2">
            <Clock size={14} style={{ color: GOLD }} />
            <h2 className="text-sm font-bold text-white">Historique de facturation</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/4">
            {loadingBill ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 size={16} className="animate-spin text-white/30" />
                <span className="text-sm text-white/30">Chargement…</span>
              </div>
            ) : !billing || billing.invoices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <Receipt size={24} className="text-white/15" />
                <p className="text-sm text-white/30">Aucune facture pour le moment</p>
                <p className="text-xs text-white/20">Elles apparaîtront ici après chaque paiement Stripe</p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="grid grid-cols-[1fr_90px_80px_40px] gap-0 border-b border-white/6 px-5 py-2.5 bg-white/2">
                  <span className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Facture</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25 text-right">Montant</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25 text-center">Statut</span>
                  <span />
                </div>
                {billing.invoices.map((inv, i) => {
                  const s = invoiceStatusLabel(inv.status);
                  return (
                    <div
                      key={inv.id}
                      className="grid grid-cols-[1fr_90px_80px_40px] items-center gap-0 px-5 py-3 transition hover:bg-white/3"
                      style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}
                    >
                      <div>
                        <p className="text-sm font-medium text-white/80">{inv.number}</p>
                        <p className="text-xs text-white/30">{formatDate(inv.date)}</p>
                      </div>
                      <p className="text-right text-sm font-semibold text-white/80">
                        {formatAmount(inv.amount, inv.currency)}
                      </p>
                      <div className="flex justify-center">
                        <span
                          className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        {inv.pdf ? (
                          <a
                            href={inv.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white/60"
                            title="Télécharger PDF"
                          >
                            <Download size={12} />
                          </a>
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white/15">
                            <Download size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-2 text-right text-[0.62rem] text-white/20">
            Factures générées par Stripe ·{" "}
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition hover:text-white/40"
            >
              Portail Stripe <ExternalLink size={8} className="inline" />
            </a>
          </p>
        </motion.div>
      )}

      {/* Comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease }}
        className="relative z-10 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/6 bg-white/4"
      >
        {/* Table header */}
        <div className="grid grid-cols-[1fr_80px_80px] gap-0 border-b border-white/6 px-5 py-3 bg-white/3">
          <div />
          <div className="text-center text-[0.68rem] font-bold uppercase tracking-widest text-white/30">Gratuit</div>
          <div className="text-center text-[0.68rem] font-bold uppercase tracking-widest" style={{ color: GOLD }}>PRO</div>
        </div>

        {/* Sections */}
        {COMPARISON.map((section, si) => (
          <div key={section.category}>
            <div
              className="px-5 pb-1 pt-3"
              style={{ borderTop: si > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
            >
              <p className="text-[0.58rem] font-bold uppercase tracking-wider text-white/25">{section.category}</p>
            </div>
            {section.features.map((feat, fi) => (
              <div
                key={feat.label}
                className="grid grid-cols-[1fr_80px_80px] items-center gap-0 px-5 py-2.5"
                style={{ background: fi % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent" }}
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
          <div className="px-5 py-4 border-t border-white/6" style={{ background: "rgba(201,165,90,0.03)" }}>
            <div className="grid grid-cols-[1fr_80px_80px] items-center gap-0">
              <p className="text-sm font-semibold text-white/50">Commencer maintenant</p>
              <div className="flex justify-center">
                <div className="text-[0.7rem] font-semibold text-white/25">Plan actuel</div>
              </div>
              <div className="flex justify-center">
                <motion.button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[0.72rem] font-bold text-[#0a0a0a] disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
                >
                  Choisir <ArrowRight size={10} />
                </motion.button>
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
        className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-6"
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
