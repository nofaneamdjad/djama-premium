"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const BG    = "#0d0821";

/* ── Splash ── */
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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: BG }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07, ease }}
          >
            <Image src="/logo-navbar.png" alt="DJAMA" width={220} height={50} className="h-[46px] w-auto object-contain" />
          </motion.div>

          {/* Progress bar Odoo-style */}
          <div className="absolute bottom-12 left-8 right-8 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: GOLD }}
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── White input ── */
function WhiteInput({
  label, optional, suffix, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; optional?: boolean; suffix?: React.ReactNode }) {
  return (
    <div
      className="relative rounded-2xl px-4 py-3.5"
      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      {label && (
        <p className="mb-0.5 text-[0.68rem] font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>
          {label}{optional && <span className="ml-1.5 opacity-60">(optionnel)</span>}
        </p>
      )}
      <input
        {...props}
        className="w-full bg-transparent text-[0.95rem] text-white placeholder:text-white/25 outline-none"
        style={{ paddingRight: suffix ? "2rem" : undefined }}
      />
      {suffix && <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  );
}

/* ── Google icon ── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const [nom,           setNom]           = useState("");
  const [email,         setEmail]         = useState("");
  const [telephone,     setTelephone]     = useState("");
  const [password,      setPassword]      = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
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
    <div
      className="relative min-h-screen px-5 pb-10 pt-14"
      style={{ background: `linear-gradient(175deg, #1a0c35 0%, ${BG} 50%, #060c18 100%)` }}
    >
      <SplashScreen visible={showSplash} />

      {/* Orb */}
      <div aria-hidden className="pointer-events-none fixed left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-[100px] opacity-30"
        style={{ background: `rgba(${GOLDR},0.25)` }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="mx-auto w-full max-w-[420px]"
      >
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <Image src="/logo-navbar.png" alt="DJAMA" width={200} height={45} className="h-[40px] w-auto object-contain" priority />
          </Link>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="mb-2 text-[2rem] font-extrabold leading-tight text-white">
            Démarrez maintenant
          </h1>
          <p className="text-[0.9rem]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Accès gratuit et instantané. Aucune carte bancaire requise.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3">

          <WhiteInput
            label="Nom et prénom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Jean Dupont"
            autoComplete="name"
            required
            autoFocus
          />

          <WhiteInput
            label="Adresse e-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            autoComplete="email"
            required
          />

          <WhiteInput
            label="Numéro de téléphone"
            optional
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="+33 6 00 00 00 00"
            autoComplete="tel"
          />

          {/* Mot de passe */}
          <div
            className="relative rounded-2xl px-4 py-3.5"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <p className="mb-0.5 text-[0.68rem] font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>
              Mot de passe
            </p>
            <div className="flex items-center">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                autoComplete="new-password"
                required
                className="flex-1 bg-transparent text-[0.95rem] text-white placeholder:text-white/25 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="ml-2 shrink-0 transition"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Pays (statique) */}
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-3.5"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <div>
              <p className="mb-0.5 text-[0.68rem] font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>Pays</p>
              <p className="text-[0.95rem] text-white/75">France</p>
            </div>
            <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.30)" }} />
          </div>

          {/* Erreur / succès */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl px-3.5 py-3"
                style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)" }}
              >
                <div className="flex gap-2.5">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                  <p className="text-xs" style={{ color: "rgba(255,160,160,0.90)" }}>{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden rounded-xl px-3.5 py-3"
                style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.22)" }}
              >
                <div className="flex gap-2.5">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: "#10b981" }} />
                  <p className="text-xs" style={{ color: "rgba(110,230,180,0.90)" }}>
                    Compte créé ! Vérifiez votre email pour activer votre compte.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms */}
          <p className="px-1 text-[0.72rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
            En cliquant sur <strong className="text-white/50">Créer mon espace</strong>, vous acceptez nos{" "}
            <Link href="/legal/cgu" className="underline underline-offset-2 transition hover:opacity-70">Conditions d&apos;utilisation</Link>{" "}
            et notre{" "}
            <Link href="/legal/confidentialite" className="underline underline-offset-2 transition hover:opacity-70">Politique de confidentialité</Link>.
          </p>

          {/* CTA principal */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={loading || success || googleLoading}
            className="w-full rounded-2xl py-4 text-[1rem] font-bold text-white transition-all disabled:opacity-60"
            style={{
              background: `linear-gradient(135deg, rgba(${GOLDR},0.95) 0%, rgba(${GOLDR},0.72) 100%)`,
              boxShadow: `0 6px 24px rgba(${GOLDR},0.28)`,
            }}
          >
            {loading ? "Création…" : success ? "Compte créé !" : "Créer mon espace DJAMA"}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-[0.72rem]" style={{ color: "rgba(255,255,255,0.22)" }}>ou</span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Google */}
        <motion.button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading || loading || success}
          whileTap={{ scale: 0.985 }}
          className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-[0.95rem] font-semibold transition-all disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}
        >
          {googleLoading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="inline-block h-5 w-5 rounded-full"
              style={{ border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.7)" }}
            />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? "Connexion…" : "Continuer avec Google"}
        </motion.button>

        {/* Se connecter */}
        <p className="mt-8 text-center text-[0.9rem]" style={{ color: "rgba(255,255,255,0.38)" }}>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-bold transition" style={{ color: GOLD }}>
            Se connecter
          </Link>
        </p>

        {/* Bottom legal */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-[0.70rem]" style={{ color: "rgba(255,255,255,0.20)" }}>
          <Link href="/legal/confidentialite" className="transition hover:opacity-60">Confidentialité</Link>
          <span>·</span>
          <Link href="/legal/cgu" className="transition hover:opacity-60">Conditions</Link>
          <span>·</span>
          <Link href="/contact" className="transition hover:opacity-60">Besoin d&apos;aide ?</Link>
        </div>
      </motion.div>
    </div>
  );
}
