"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, AlertCircle, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

/* ── Splash screen style Odoo ── */
function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07090e]"
        >
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.07, 0.15, 0.07] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-[420px] w-[420px] rounded-full blur-[130px]"
            style={{ background: GOLD }}
          />
          <motion.span
            initial={{ opacity: 0, scale: 0.82, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease }}
            className="relative mb-10 text-[3rem] font-black text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            DJAMA
          </motion.span>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-[200px] overflow-hidden rounded-full"
            style={{ height: "2px", background: "rgba(255,255,255,0.08)" }}
          >
            <motion.div
              className="absolute top-0 h-full w-[45%] rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
              animate={{ x: ["-110%", "280%"] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.1 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Google SVG ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Mail SVG ── */
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

export default function RegisterPage() {
  const [nom,           setNom]           = useState("");
  const [email,         setEmail]         = useState("");
  const [telephone,     setTelephone]     = useState("");
  const [password,      setPassword]      = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSplash,    setShowSplash]    = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);

  async function handleGoogleAuth() {
    setError(""); setGoogleLoading(true); setShowSplash(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/client`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (err) { setError(err.message); setGoogleLoading(false); setShowSplash(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim())         { setError("Le nom est requis."); return; }
    if (!email.trim())       { setError("L'adresse e-mail est requise."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setError(""); setLoading(true); setShowSplash(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: nom.trim() } },
    });

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")
          ? "Un compte existe déjà avec cet e-mail."
          : signUpError.message
      );
      setLoading(false); setShowSplash(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("Erreur lors de la création. Réessayez.");
      setLoading(false); setShowSplash(false);
      return;
    }

    await supabase.from("clients").insert({
      id: userId, nom: nom.trim(),
      email: email.trim().toLowerCase(),
      telephone: telephone.trim() || null,
      statut: "actif",
    });

    setLoading(false);

    if (data.session) {
      setSuccess(true);
      setTimeout(() => { window.location.href = "/client"; }, 1000);
    } else {
      setShowSplash(false);
      setSuccess(true);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 pt-[12vh] pb-24">

      <SplashScreen visible={showSplash} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-[380px]"
      >
        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease }}
          className="mb-8 flex flex-col items-center"
        >
          <div
            className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <span
              className="text-2xl font-black"
              style={{ color: GOLD, letterSpacing: "-0.02em" }}
            >
              D
            </span>
          </div>
          <h1 className="mb-2 text-center text-[1.85rem] font-extrabold leading-tight text-gray-900">
            Créez votre espace DJAMA.
          </h1>
          <p className="text-center text-[0.95rem] text-gray-500">
            Gratuit · Aucune carte bancaire requise
          </p>
        </motion.div>

        {/* ── Auth buttons ── */}
        <div className="space-y-3">
          {/* Google */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease }}
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading || success}
            whileHover={{ backgroundColor: "#f5f5f5" }}
            whileTap={{ scale: 0.985 }}
            className="flex w-full items-center rounded-2xl border border-gray-200 bg-white py-4 text-[0.95rem] font-medium text-gray-700 shadow-sm transition-colors disabled:opacity-50"
          >
            <span className="flex w-14 shrink-0 items-center justify-center">
              {googleLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="inline-block h-4 w-4 rounded-full border-2 border-gray-200 border-t-gray-500"
                />
              ) : (
                <GoogleIcon />
              )}
            </span>
            <span className="flex-1 text-center pr-14">
              {googleLoading ? "Connexion…" : "Google"}
            </span>
          </motion.button>

          {/* Email toggle button */}
          {!showForm && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18, ease }}
              type="button"
              onClick={() => setShowForm(true)}
              whileHover={{ backgroundColor: "#f5f5f5" }}
              whileTap={{ scale: 0.985 }}
              className="flex w-full items-center rounded-2xl border border-gray-200 bg-white py-4 text-[0.95rem] font-medium text-gray-700 shadow-sm transition-colors"
            >
              <span className="flex w-14 shrink-0 items-center justify-center text-gray-500">
                <MailIcon />
              </span>
              <span className="flex-1 text-center pr-14">E-mail</span>
            </motion.button>
          )}
        </div>

        {/* ── Registration form (expanded) ── */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease }}
              onSubmit={handleRegister}
              className="overflow-hidden"
            >
              <div className="mt-2.5 space-y-3">
                {/* Nom */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Jean Dupont"
                    autoComplete="name"
                    required
                    autoFocus
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5"
                  />
                </div>

                {/* Téléphone (optionnel) */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    Téléphone
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[0.6rem] font-normal text-gray-400">
                      optionnel
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+33 6 00 00 00 00"
                    autoComplete="tel"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden rounded-lg border border-red-100 bg-red-50 px-3 py-2.5"
                    >
                      <div className="flex gap-2">
                        <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                        <p className="text-xs text-red-600">{error}</p>
                      </div>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-lg border border-green-100 bg-green-50 px-3 py-2.5"
                    >
                      <div className="flex gap-2">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-500" />
                        <p className="text-xs text-green-700">
                          Compte créé ! Vérifiez votre email pour activer votre compte.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  whileHover={{ backgroundColor: "#111827" }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading || success || googleLoading}
                  className="w-full rounded-2xl bg-gray-900 py-3.5 text-[0.95rem] font-semibold text-white transition-colors disabled:opacity-60"
                >
                  {loading
                    ? "Création du compte…"
                    : success
                    ? "Compte créé !"
                    : "Créer mon espace client"}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-500">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-semibold text-gray-900 underline underline-offset-2 transition hover:text-gray-700"
            >
              Se connecter
            </Link>
          </p>
        </motion.div>

        {/* ── Terms ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-5 text-center text-[0.68rem] leading-relaxed text-gray-400"
        >
          En continuant, vous reconnaissez avoir compris et accepté les{" "}
          <a href="#" className="underline hover:text-gray-600">
            Conditions générales
          </a>{" "}
          et la{" "}
          <a href="#" className="underline hover:text-gray-600">
            Politique de confidentialité
          </a>
        </motion.p>
      </motion.div>

      {/* ── Bottom nav ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="absolute bottom-6 flex gap-4 text-xs text-gray-400"
      >
        <a href="#" className="hover:text-gray-600">Confidentialité</a>
        <span>·</span>
        <a href="#" className="hover:text-gray-600">Conditions</a>
        <span>·</span>
        <a href="#" className="hover:text-gray-600">Besoin d&apos;aide ?</a>
      </motion.div>
    </div>
  );
}
