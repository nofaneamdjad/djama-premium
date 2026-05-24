"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Crown, CheckCircle2,
  LogOut, ArrowRight, Sparkles, Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/use-require-subscription";
import { PLAN_PRICE_LABEL } from "@/lib/plans";
import Link from "next/link";

const GOLD  = "#c9a55a";
const ease  = [0.16, 1, 0.3, 1] as const;

export default function ProfilPage() {
  const sub = useSubscription();
  const { level, isPremium, name, email, userId } = sub;

  const [displayName, setDisplayName] = useState(name);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setError("Le nom ne peut pas être vide."); return; }
    setSaving(true); setError(""); setSaved(false);
    const { error: err } = await supabase.auth.updateUser({ data: { name: displayName.trim() } });
    setSaving(false);
    if (err) { setError(err.message); }
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (level === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-100 border-t-[#c9a55a]" />
      </div>
    );
  }

  const planLabel = isPremium ? "DJAMA PRO" : "Plan Gratuit";
  const planColor = isPremium ? GOLD : "#9ca3af";
  const PlanIcon  = isPremium ? Crown : Sparkles;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="space-y-4"
      >

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
          <p className="mt-0.5 text-sm text-gray-400">Gérez vos informations et votre abonnement</p>
        </div>

        {/* Avatar + plan */}
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold"
            style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}28`, color: GOLD }}>
            {(name?.[0] ?? email?.[0] ?? "U").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-gray-900">{name || email || "Mon compte"}</p>
            <p className="truncate text-sm text-gray-400">{email}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <PlanIcon size={11} style={{ color: planColor }} />
              <span className="text-[0.7rem] font-semibold" style={{ color: planColor }}>{planLabel}</span>
            </div>
          </div>
        </div>

        {/* Edit name */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-700">Informations personnelles</h2>
          <form onSubmit={handleSave} className="space-y-3">

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Nom affiché
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                  <User size={14} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => { setDisplayName(e.target.value); setSaved(false); }}
                  placeholder="Votre nom"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#c9a55a] focus:ring-2 focus:ring-[#c9a55a]/15"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                  <Mail size={14} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-gray-100 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-400 outline-none"
                />
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
                  <Lock size={12} className="text-gray-300" />
                </div>
              </div>
              <p className="mt-1 text-[0.65rem] text-gray-300">L&apos;adresse e-mail ne peut pas être modifiée</p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving || saved}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
            >
              {saved ? (
                <><CheckCircle2 size={14} /> Enregistré</>
              ) : saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/60" /> Enregistrement…</>
              ) : (
                "Sauvegarder les modifications"
              )}
            </button>
          </form>
        </div>

        {/* Subscription card */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm"
          style={{ borderColor: isPremium ? `${planColor}30` : "#e5e7eb" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">Abonnement</h2>
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold"
              style={{ background: `${planColor}14`, color: planColor }}>
              <PlanIcon size={10} />
              {planLabel}
            </div>
          </div>

          {!isPremium && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Vous êtes sur le <strong>plan gratuit</strong>. Passez à DJAMA PRO pour accéder à tous les outils sans restriction.
              </p>
              <Link href="/client/abonnements"
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold text-[#0a0a0a] transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                <Crown size={14} /> Passer à DJAMA PRO — {PLAN_PRICE_LABEL} <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {isPremium && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <CheckCircle2 size={15} className="shrink-0 text-green-500" />
                <p className="text-sm font-medium text-green-700">Accès complet à tous les outils DJAMA PRO</p>
              </div>
              <Link href="/client/abonnements"
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 transition hover:text-gray-600">
                Gérer mon abonnement <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 py-3.5 text-sm font-semibold text-red-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={14} /> Se déconnecter
        </button>

        {/* User ID (debug) */}
        {userId && (
          <p className="text-center text-[0.6rem] text-gray-200">ID · {userId}</p>
        )}

      </motion.div>
    </div>
  );
}
