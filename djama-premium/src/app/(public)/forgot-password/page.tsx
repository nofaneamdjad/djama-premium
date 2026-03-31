"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    /* Base URL : variable d'env en priorité, sinon origin courant */
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      window.location.origin;

    const { error: sbError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        /* Supabase redirigera vers cette URL après clic sur le lien.
           ⚠️  Cette URL doit être whitelistée dans :
           Supabase Dashboard → Auth → URL Configuration → Redirect URLs
           Ajouter : http://localhost:3000/reset-password             */
        redirectTo: `${siteUrl}/reset-password`,
      }
    );

    if (sbError) {
      console.error("[ForgotPassword] Erreur :", sbError);
      setError(sbError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080a0f] px-4">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(176,141,87,0.07)] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-[rgba(201,165,90,0.12)] to-transparent opacity-70 blur-sm" />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0f1117]/90 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">

          <Link href="/login" className="mb-6 flex items-center gap-2 text-xs text-white/30 transition hover:text-white/60">
            <ArrowLeft size={13} /> Retour à la connexion
          </Link>

          {!sent ? (
            <>
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.09)]">
                  <Mail size={22} style={{ color: "#c9a55a" }} />
                </div>
                <h1 className="text-2xl font-extrabold text-white">Mot de passe oublié</h1>
                <p className="mt-2 text-sm text-white/35">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/40">
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.5)]"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3"
                    >
                      <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                      <p className="text-xs text-red-300">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] py-4 text-sm font-extrabold text-[#0a0a0a] shadow-[0_4px_20px_rgba(201,165,90,0.3)] transition hover:shadow-[0_8px_32px_rgba(201,165,90,0.45)] disabled:opacity-60"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                    {loading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
                  </span>
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10">
                <CheckCircle2 size={30} className="text-green-400" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Email envoyé !</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/40">
                Un lien de réinitialisation a été envoyé à{" "}
                <span className="font-semibold text-white/70">{email}</span>.
                <br />Vérifiez aussi vos spams.
              </p>
              <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#c9a55a] hover:text-[#e8cc94] transition-colors">
                <ArrowLeft size={13} /> Retour à la connexion
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
