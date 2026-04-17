"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Lock, BookOpen, Bot, Calendar, LayoutDashboard, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCoachingIAAccess } from "@/lib/use-require-coaching-ia";
import { motion } from "framer-motion";

const NAV = [
  { href: "/coaching-ia/espace",           label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/coaching-ia/espace#cours",     label: "Mes cours",       icon: BookOpen },
  { href: "/coaching-ia/espace#assistant", label: "Assistant IA",    icon: Bot },
  { href: "/coaching-ia/espace#reserver",  label: "Réserver",        icon: Calendar },
];

export default function CoachingIALayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { access, user } = useCoachingIAAccess();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── Écran de chargement ─────────────────────────────── */
  if (access === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#07080e]">
        <div className="relative">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#a78bfa]" />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-white/40">Vérification de l&apos;accès…</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[0.65rem] text-white/20">
            <Lock size={9} /> Espace Coaching IA DJAMA
          </p>
        </div>
      </div>
    );
  }

  /* ── Paiement reçu, activation en attente ─────────────── */
  if (access === "pending") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-0 bg-[#07080e] px-6">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[400px] rounded-full bg-[rgba(167,139,250,0.05)] blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md text-center"
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(249,168,38,0.25)] bg-[rgba(249,168,38,0.08)]">
            <Clock size={36} className="text-[#f9a826]" />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.07)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#a78bfa]">
            <CheckCircle2 size={11} /> Paiement confirmé — Coaching IA
          </div>
          <h1 className="mb-4 text-2xl font-black text-white sm:text-3xl">
            Votre accès sera activé prochainement
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-white/40">
            Votre paiement Coaching IA a bien été reçu. Notre équipe va activer votre espace dans les <strong className="text-white/65">plus brefs délais</strong>. Vous recevrez un email dès que tout est prêt.
          </p>
          <div className="mb-8 space-y-3 rounded-2xl border border-white/[0.07] bg-[#0f0f12] p-5 text-left">
            {[
              { icon: CheckCircle2, color: "#4ade80", label: "Paiement reçu et validé", done: true },
              { icon: Clock, color: "#f9a826", label: "Activation de votre accès Coaching IA", done: false },
              { icon: MessageCircle, color: "#a78bfa", label: "Email de confirmation envoyé dès activation", done: false },
            ].map(({ icon: Icon, color, label, done }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                  style={{ background: `${color}18`, borderColor: `${color}40` }}
                >
                  <Icon size={13} style={{ color }} />
                </div>
                <p className="text-sm text-white/55">{label}</p>
                {done && <span className="ml-auto rounded-full bg-[rgba(74,222,128,0.1)] px-2 py-0.5 text-[0.6rem] font-bold text-[#4ade80]">Fait</span>}
                {!done && i === 1 && <span className="ml-auto rounded-full bg-[rgba(249,168,38,0.1)] px-2 py-0.5 text-[0.6rem] font-bold text-[#f9a826]">En cours</span>}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/262693523665"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,211,102,0.25)] bg-[rgba(37,211,102,0.07)] px-5 py-3 text-sm font-bold text-[#25d366] transition-all hover:bg-[rgba(37,211,102,0.12)]"
            >
              <MessageCircle size={15} /> Contacter DJAMA
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-5 py-3 text-sm font-semibold text-white/40 transition-all hover:text-white/70"
            >
              Retour au site
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#07080e]">
      {/* ── Top bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-white/[0.06] bg-[#07080e]/95 px-4 backdrop-blur-xl">

        {/* Logo + badge */}
        <Link href="/coaching-ia/espace" className="group mr-4 flex items-center gap-2">
          <span className="text-base font-bold tracking-widest text-[#a78bfa] transition-opacity group-hover:opacity-80">
            DJAMA
          </span>
          <span className="rounded border border-[rgba(167,139,250,0.3)] px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-widest text-[#a78bfa]/70">
            Coaching IA
          </span>
        </Link>

        {/* Navigation — visible uniquement en accès complet */}
        {access === "full" && (
          <nav className="flex flex-1 items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href.includes("#") && pathname === href.split("#")[0]);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.1)] text-[#a78bfa]"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Badge aperçu si mode preview */}
        {access === "preview" && (
          <div className="flex flex-1 items-center gap-2">
            <span className="rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.08)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#c9a55a]">
              Aperçu gratuit
            </span>
          </div>
        )}

        {/* User + déconnexion */}
        <div className="ml-auto flex items-center gap-3">
          {user?.name && (
            <span className="hidden text-xs text-white/25 sm:block">
              {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/40 transition-all hover:bg-white/[0.04] hover:text-white/70"
            title="Se déconnecter"
          >
            <LogOut size={14} />
            <span className="hidden text-xs sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* ── Contenu ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
