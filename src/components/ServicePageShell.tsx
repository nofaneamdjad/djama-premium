"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { staggerContainer, cardReveal, fadeIn, viewport } from "@/lib/animations";
import type { ElementType, ReactNode } from "react";

/* ─── Types ─────────────────────────────────────────────────────────── */
export interface SvcFeature {
  icon: ElementType;
  color: string;
  title: string;
  desc: string;
}
export interface SvcStep {
  num: string;
  icon: ElementType;
  color: string;
  title: string;
  desc: string;
  tag?: string;
}
export interface SvcPlan {
  name: string;
  price: string;
  unit?: string;
  desc: string;
  features: string[];
  hot?: boolean;
}
export interface SvcStat {
  value: string;
  label: string;
}
export interface ServicePageShellProps {
  /* Hero */
  icon: ElementType;
  color: string;
  colorRGB: string;
  badge: string;
  title: ReactNode;
  subtitle: string;
  stats?: SvcStat[];
  ctaHref?: string;
  ctaLabel?: string;
  ctaSecHref?: string;
  ctaSecLabel?: string;
  /* Features */
  featuresTitle?: string;
  features: SvcFeature[];
  /* Process */
  processTitle?: string;
  process?: SvcStep[];
  /* Pricing */
  pricingTitle?: string;
  plans?: SvcPlan[];
  /* Extra slot */
  children?: ReactNode;
}

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Shell ─────────────────────────────────────────────────────────── */
export default function ServicePageShell({
  icon: Icon,
  color,
  colorRGB,
  badge,
  title,
  subtitle,
  stats,
  ctaHref = "/contact",
  ctaLabel = "Démarrer un projet",
  ctaSecHref = "/contact",
  ctaSecLabel = "Poser une question",
  featuresTitle = "Ce qui est inclus",
  features,
  processTitle = "Comment ça se passe",
  process,
  pricingTitle = "Nos tarifs",
  plans,
  children,
}: ServicePageShellProps) {
  return (
    <div className="overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-[108px] pb-16 sm:pt-[132px] sm:pb-20"
        style={{ background: `linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f1629 100%)` }}
      >
        {/* Glow orb */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full blur-[120px] opacity-30"
          style={{ background: `radial-gradient(circle,rgba(${colorRGB},0.7) 0%,transparent 70%)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full blur-[100px] opacity-20"
          style={{ background: `radial-gradient(circle,rgba(${colorRGB},0.5) 0%,transparent 70%)` }}
        />

        <motion.div
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-10 mx-auto max-w-2xl px-6 text-center"
        >
          {/* Icon circle */}
          <motion.div variants={fadeIn} className="mb-6 flex justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl"
              style={{ background: `rgba(${colorRGB},0.15)`, border: `1.5px solid rgba(${colorRGB},0.35)` }}
            >
              <Icon size={36} style={{ color }} strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div variants={fadeIn}
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[.22em]"
            style={{ background: `rgba(${colorRGB},0.12)`, border: `1px solid rgba(${colorRGB},0.3)`, color }}
          >
            {badge}
          </motion.div>

          {/* Title */}
          <motion.h1 variants={fadeIn}
            className="text-[2.2rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[3rem]"
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={fadeIn}
            className="mt-5 text-[1rem] leading-relaxed font-medium"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {subtitle}
          </motion.p>

          {/* Stats */}
          {stats && stats.length > 0 && (
            <motion.div variants={fadeIn}
              className="mt-8 flex flex-wrap items-center justify-center gap-6"
            >
              {stats.map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-[1.5rem] font-extrabold leading-none" style={{ color }}>{value}</span>
                  <span className="text-[0.68rem] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div variants={fadeIn} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={ctaHref}
              className="flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-[0.92rem] font-bold text-[#0f172a] shadow-lg transition-all hover:scale-[1.03] active:scale-[.97]"
              style={{ background: `linear-gradient(135deg,${color},rgba(${colorRGB},0.8))` }}
            >
              {ctaLabel} <ArrowRight size={14} />
            </Link>
            <Link href={ctaSecHref}
              className="flex items-center justify-center gap-2 rounded-2xl border px-7 py-3.5 text-[0.92rem] font-bold text-white transition-all hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.2)" }}
            >
              {ctaSecLabel}
            </Link>
          </motion.div>
        </motion.div>

        {/* Wave bottom */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-white" style={{ clipPath: "ellipse(60% 100% at 50% 100%)" }} />
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-5xl px-6"
        >
          <motion.div variants={fadeIn} className="mb-10 text-center">
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[.22em]"
              style={{ background: `rgba(${colorRGB},0.08)`, border: `1px solid rgba(${colorRGB},0.22)`, color }}
            >
              {featuresTitle}
            </div>
          </motion.div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: FIcon, color: fc, title: ft, desc: fd }) => (
              <motion.div
                key={ft} variants={cardReveal}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,.10)" }}
                transition={{ duration: 0.2, ease }}
                className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,.06)]"
              >
                <div
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${fc}15` }}
                >
                  <FIcon size={19} style={{ color: fc }} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[0.88rem] font-bold text-gray-800">{ft}</p>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-gray-500">{fd}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── EXTRA SLOT ───────────────────────────────────── */}
      {children}

      {/* ── PROCESS ──────────────────────────────────────── */}
      {process && process.length > 0 && (
        <section className="bg-[#f5f6fa] py-14 sm:py-18">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={staggerContainer}
            className="mx-auto max-w-4xl px-6"
          >
            <motion.div variants={fadeIn} className="mb-8 text-center">
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[.22em]"
                style={{ background: `rgba(${colorRGB},0.08)`, border: `1px solid rgba(${colorRGB},0.22)`, color }}
              >
                {processTitle}
              </div>
            </motion.div>

            <div className="relative">
              {/* Connecting line */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-[28px] left-[calc(calc(100%/6)+12px)] right-[calc(calc(100%/6)+12px)] hidden h-px sm:block"
                style={{ background: `linear-gradient(90deg,${color},rgba(${colorRGB},0.3))` }}
              />
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:flex lg:gap-0">
                {process.map(({ num, icon: SIcon, color: sc, title: st, desc: sd, tag }, idx) => (
                  <motion.div
                    key={num} variants={cardReveal}
                    className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,.06)] border border-gray-100 text-center lg:flex-1 lg:rounded-none lg:border-x-0 lg:first:rounded-l-2xl lg:last:rounded-r-2xl lg:border lg:mx-0"
                    style={{ zIndex: process.length - idx }}
                  >
                    <div
                      className="relative flex h-12 w-12 items-center justify-center rounded-full shadow-sm"
                      style={{ background: `${sc}14`, border: `2px solid ${sc}30` }}
                    >
                      <SIcon size={20} style={{ color: sc }} />
                      <span
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[0.52rem] font-black text-white shadow"
                        style={{ background: sc }}
                      >{num}</span>
                    </div>
                    <div>
                      <p className="text-[0.83rem] font-bold text-gray-800">{st}</p>
                      {tag && <p className="mt-0.5 text-[0.65rem] font-semibold" style={{ color: sc }}>{tag}</p>}
                      <p className="mt-1 text-[0.73rem] leading-snug text-gray-500">{sd}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* ── PRICING ──────────────────────────────────────── */}
      {plans && plans.length > 0 && (
        <section className="bg-white py-14 sm:py-18">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={staggerContainer}
            className="mx-auto max-w-4xl px-6"
          >
            <motion.div variants={fadeIn} className="mb-8 text-center">
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[.22em]"
                style={{ background: `rgba(${colorRGB},0.08)`, border: `1px solid rgba(${colorRGB},0.22)`, color }}
              >
                {pricingTitle}
              </div>
            </motion.div>

            <div className={`grid gap-5 ${plans.length === 1 ? "max-w-sm mx-auto" : plans.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {plans.map(({ name, price, unit, desc, features: pf, hot }) => (
                <motion.div
                  key={name} variants={cardReveal}
                  className="relative overflow-hidden rounded-2xl border p-6 shadow-[0_4px_20px_rgba(0,0,0,.08)]"
                  style={{
                    borderColor: hot ? color : "rgba(0,0,0,0.08)",
                    background: hot ? `linear-gradient(135deg,rgba(${colorRGB},0.05) 0%,white 100%)` : "white",
                  }}
                >
                  {hot && (
                    <div
                      className="absolute top-3.5 right-3.5 rounded-full px-2.5 py-0.5 text-[0.58rem] font-black uppercase tracking-wide text-white"
                      style={{ background: color }}
                    >
                      Recommandé
                    </div>
                  )}
                  <p className="text-[0.7rem] font-black uppercase tracking-[.18em] text-gray-400">{name}</p>
                  <div className="mt-2 flex items-end gap-1.5">
                    <span className="text-[2rem] font-extrabold leading-none text-gray-900">{price}</span>
                    {unit && <span className="mb-1 text-[0.72rem] text-gray-400">{unit}</span>}
                  </div>
                  <p className="mt-1.5 text-[0.75rem] text-gray-500">{desc}</p>
                  <ul className="mt-4 space-y-2">
                    {pf.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[0.75rem] text-gray-600">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={ctaHref}
                    className="mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[0.83rem] font-bold transition-all duration-200 hover:opacity-90"
                    style={hot
                      ? { background: color, color: "#0f172a" }
                      : { background: `rgba(${colorRGB},0.08)`, color, border: `1px solid rgba(${colorRGB},0.22)` }
                    }
                  >
                    Choisir cette offre <ArrowRight size={13} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── BOTTOM CTA ───────────────────────────────────── */}
      <section className="px-5 py-12 sm:py-16" style={{ background: "#0f172a" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-xl text-center"
        >
          <p className="text-[1.4rem] font-extrabold leading-tight text-white sm:text-[1.8rem]">
            Prêt à démarrer ?
          </p>
          <p className="mt-3 text-[0.85rem]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Réponse sous 24h · Sans engagement · Devis gratuit
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={ctaHref}
              className="flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[0.92rem] font-bold shadow-lg transition-all hover:scale-[1.03]"
              style={{ background: `linear-gradient(135deg,${color},rgba(${colorRGB},0.75))`, color: "#0f172a" }}
            >
              {ctaLabel} <ArrowRight size={14} />
            </Link>
            <Link
              href="/services"
              className="text-[0.82rem] font-semibold transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              ← Voir tous nos services
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
