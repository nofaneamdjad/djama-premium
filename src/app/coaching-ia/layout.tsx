"use client";

import Link from "next/link";
import { LogOut, Lock, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCoachingIAAccess } from "@/lib/use-require-coaching-ia";
import { motion } from "framer-motion";

export default function CoachingIALayout({ children }: { children: React.ReactNode }) {
  const { access, user } = useCoachingIAAccess();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── Écran de chargement ─────────────────────────────── */
  if (access === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white">
        <div className="relative">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-100 border-t-[#a78bfa]" />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-400">Vérification de l&apos;accès…</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[0.65rem] text-gray-300">
            <Lock size={9} /> Espace Coaching IA DJAMA
          </p>
        </div>
      </div>
    );
  }

  /* ── Paiement reçu, activation en attente ─────────────── */
  if (access === "pending") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-0 bg-white px-6">
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
          <h1 className="mb-4 text-2xl font-black text-gray-900 sm:text-3xl">
            Votre accès sera activé prochainement
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-gray-500">
            Votre paiement Coaching IA a bien été reçu. Notre équipe va activer votre espace dans les <strong className="text-gray-700">plus brefs délais</strong>. Vous recevrez un email dès que tout est prêt.
          </p>
          <div className="mb-8 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left">
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
                <p className="text-sm text-gray-600">{label}</p>
                {done && <span className="ml-auto rounded-full bg-[rgba(74,222,128,0.1)] px-2 py-0.5 text-[0.6rem] font-bold text-emerald-600">Fait</span>}
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-500 transition-all hover:text-gray-700"
            >
              Retour au site
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Top bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-gray-200 bg-white/96 px-4 backdrop-blur-xl shadow-[0_1px_4px_rgba(0,0,0,.05)]">

        {/* Logo + badge */}
        <Link href="/coaching-ia/espace" className="group mr-4 flex items-center gap-2">
          <span className="text-base font-bold tracking-widest text-[#a78bfa] transition-opacity group-hover:opacity-80">
            DJAMA
          </span>
          <span className="rounded border border-[rgba(167,139,250,0.3)] px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-widest text-[#a78bfa]/80">
            Coaching IA
          </span>
        </Link>

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
            <span className="hidden text-xs text-gray-400 sm:block">
              {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
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
