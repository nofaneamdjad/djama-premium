"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StickyNote, Calendar, ReceiptText, Sparkles, LogOut, Lock, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRequireSubscription } from "@/lib/use-require-subscription";
import { motion } from "framer-motion";

const NAV = [
  { href: "/client",          label: "Coach",      icon: Sparkles,       exact: true },
  { href: "/client/factures", label: "Factures",   icon: ReceiptText },
  { href: "/client/notes",    label: "Notes",      icon: StickyNote },
  { href: "/client/planning", label: "Planning",   icon: Calendar },
];

/* ── Écran en attente d'activation ───────────────────────── */
function PendingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-0 bg-[#080a0f] px-6">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-[rgba(249,168,38,0.06)] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* Icône */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(249,168,38,0.25)] bg-[rgba(249,168,38,0.08)]">
          <Clock size={36} className="text-[#f9a826]" />
        </div>

        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.25)] bg-[rgba(249,168,38,0.07)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#f9a826]">
          <CheckCircle2 size={11} /> Paiement confirmé
        </div>

        {/* Titre */}
        <h1 className="mb-4 text-2xl font-black text-white sm:text-3xl">
          Votre accès sera activé prochainement
        </h1>

        {/* Sous-titre */}
        <p className="mb-8 text-sm leading-relaxed text-white/40">
          Votre paiement a bien été reçu et enregistré. Notre équipe va activer votre espace client dans les <strong className="text-white/65">plus brefs délais</strong> (généralement sous 24h).
        </p>

        {/* Étapes */}
        <div className="mb-8 space-y-3 rounded-2xl border border-white/[0.07] bg-[#111113] p-5 text-left">
          {[
            { icon: CheckCircle2, color: "#4ade80", label: "Paiement reçu et validé" },
            { icon: Clock,        color: "#f9a826", label: "Activation de votre accès par DJAMA" },
            { icon: MessageCircle, color: "#c9a55a", label: "Email de confirmation envoyé dès l'activation" },
          ].map(({ icon: Icon, color, label }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                style={{ background: `rgba(${color === "#4ade80" ? "74,222,128" : color === "#f9a826" ? "249,168,38" : "201,165,90"},0.1)`, borderColor: `rgba(${color === "#4ade80" ? "74,222,128" : color === "#f9a826" ? "249,168,38" : "201,165,90"},0.25)` }}
              >
                <Icon size={13} style={{ color }} />
              </div>
              <p className="text-sm text-white/55">{label}</p>
              {i === 0 && <span className="ml-auto rounded-full bg-[rgba(74,222,128,0.1)] px-2 py-0.5 text-[0.6rem] font-bold text-[#4ade80]">Fait</span>}
              {i === 1 && <span className="ml-auto rounded-full bg-[rgba(249,168,38,0.1)] px-2 py-0.5 text-[0.6rem] font-bold text-[#f9a826]">En cours</span>}
            </div>
          ))}
        </div>

        {/* Liens */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="https://wa.me/262693523665"
            target="_blank"
            rel="noopener noreferrer"
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

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, pending } = useRequireSubscription();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── Paiement reçu mais pas encore activé ── */
  if (pending) return <PendingScreen />;

  /* ── Loading / Vérification d'accès ── */
  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#080a0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]" />
        <div className="text-center">
          <p className="text-xs font-semibold text-white/40">Vérification de l&apos;accès…</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[0.65rem] text-white/20">
            <Lock size={9} /> Espace sécurisé DJAMA
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080a0f]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-white/[0.06] bg-[#080a0f]/90 px-4 backdrop-blur-xl">
        {/* Logo DJAMA compact */}
        <Link href="/client" className="group mr-4 flex items-center gap-2">
          <span className="text-base font-bold tracking-widest text-[#c9a55a] transition-opacity group-hover:opacity-80">
            DJAMA
          </span>
          <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase leading-none tracking-widest text-white/30">
            Pro
          </span>
        </Link>

        {/* Navigation outils */}
        <nav className="flex flex-1 items-center gap-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? "border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.12)] text-[#c9a55a]"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/40 transition-all hover:bg-white/[0.04] hover:text-white/70"
          title="Se déconnecter"
        >
          <LogOut size={14} />
          <span className="hidden text-xs sm:inline">Déconnexion</span>
        </button>
      </header>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
