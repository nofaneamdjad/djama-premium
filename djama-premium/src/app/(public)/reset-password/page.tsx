"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [done,         setDone]         = useState(false);
  const [error,        setError]        = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  /* ── Récupérer la session depuis le hash Supabase ──────────────────────
     Quand l'utilisateur clique sur le lien email, Supabase redirige vers :
       http://localhost:3000/reset-password#access_token=...&type=recovery
     detectSessionInUrl: true (dans supabase.ts) lit ce hash automatiquement
     et déclenche l'événement PASSWORD_RECOVERY.                           */
  useEffect(() => {
    /* Listener pour l'événement de récupération */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setSessionReady(true);
          setError("");
        }
      }
    );

    /* Vérifier si une session est déjà active (token déjà traité) */
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else if (!window.location.hash.includes("access_token")) {
        /* Aucun token dans l'URL et aucune session → lien invalide */
        setError(
          "Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation."
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ── Indicateur de force ─────────────────────────────── */
  const strength =
    password.length === 0 ? 0
    : password.length < 8  ? 1
    : password.length < 12 ? 2
    : /[A-Z]/.test(password) && /[0-9!@#$%^&*]/.test(password) ? 4
    : 3;

  const strengthLabel  = ["", "Trop court", "Correct", "Fort", "Très fort"][strength];
  const strengthColor  = ["", "#ef4444",    "#c9a55a", "#22c55e", "#22c55e"][strength];

  /* ── Soumission ─────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error: sbError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (sbError) {
      console.error("[ResetPassword] Erreur :", sbError);
      setError(sbError.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    }
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

          <Link
            href="/login"
            className="mb-6 flex items-center gap-2 text-xs text-white/30 transition hover:text-white/60"
          >
            <ArrowLeft size={13} /> Retour à la connexion
          </Link>

          {/* ── État : succès ─────────────────────────── */}
          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10">
                <CheckCircle2 size={30} className="text-green-400" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Mot de passe mis à jour !</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/40">
                Votre mot de passe a été modifié avec succès.
                <br />Redirection vers la connexion…
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#c9a55a] transition-colors hover:text-[#e8cc94]"
              >
                <ArrowLeft size={13} /> Se connecter maintenant
              </Link>
            </motion.div>

          ) : (
            /* ── Formulaire ─────────────────────────── */
            <>
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.09)]">
                  <Lock size={22} style={{ color: "#c9a55a" }} />
                </div>
                <h1 className="text-2xl font-extrabold text-white">Nouveau mot de passe</h1>
                <p className="mt-2 text-sm text-white/35">
                  Choisissez un mot de passe sécurisé pour votre compte
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Champ mot de passe */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/40">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      required
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-11 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.5)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Barre de force */}
                  <AnimatePresence>
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 overflow-hidden"
                      >
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor: i <= strength ? strengthColor : "rgba(255,255,255,0.08)",
                              }}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-[0.65rem]" style={{ color: strengthColor }}>
                          {strengthLabel}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Champ confirmation */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/40">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Répétez votre mot de passe"
                      required
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-11 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.5)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Indicateur de correspondance */}
                  <AnimatePresence>
                    {confirm.length > 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-1 text-[0.65rem]"
                        style={{
                          color: password === confirm ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {password === confirm ? "Les mots de passe correspondent" : "Ne correspondent pas"}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Message d'erreur */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3"
                    >
                      <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                      <div className="flex-1">
                        <p className="text-xs text-red-300">{error}</p>
                        {error.includes("expiré") && (
                          <Link
                            href="/forgot-password"
                            className="mt-1.5 inline-block text-[0.7rem] font-semibold text-[#c9a55a] underline underline-offset-2 hover:text-[#e8cc94]"
                          >
                            Demander un nouveau lien →
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading || !sessionReady}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] py-4 text-sm font-extrabold text-[#0a0a0a] shadow-[0_4px_20px_rgba(201,165,90,0.3)] transition hover:shadow-[0_8px_32px_rgba(201,165,90,0.45)] disabled:opacity-60"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading && <Loader2 size={15} className="animate-spin" />}
                    {loading ? "Enregistrement…" : "Définir le nouveau mot de passe"}
                  </span>
                </button>

                {!sessionReady && !error && (
                  <p className="text-center text-[0.65rem] text-white/20">
                    En attente du token de récupération…
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
