"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

function AuthField({
  label, type, value, onChange, placeholder, icon: Icon, right, autoComplete,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ElementType; right?: React.ReactNode; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-widest text-white/40">{label}</label>
      <div className="relative">
        <motion.div
          animate={{ opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: "0 0 0 2px rgba(201,165,90,0.5)" }}
        />
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <Icon size={15} style={{ color: focused ? "#c9a55a" : "rgba(255,255,255,0.25)" }} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-white/25 outline-none transition-colors duration-200 hover:border-white/20"
        />
        {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [nom,        setNom]        = useState("");
  const [email,      setEmail]      = useState("");
  const [telephone,  setTelephone]  = useState("");
  const [abonnement, setAbonnement] = useState("Outils DJAMA");
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    /* 1. Créer le compte auth */
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "Un compte existe déjà avec cet email."
          : signUpError.message
      );
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("Compte créé. Vérifiez votre email pour confirmer votre inscription.");
      setLoading(false);
      return;
    }

    /* 2. Insérer le profil dans la table clients */
    const { error: clientError } = await supabase.from("clients").insert({
      id: userId,
      nom,
      email,
      telephone: telephone || null,
      abonnement,
      statut: "actif",
    });

    if (clientError && !clientError.message.includes("duplicate")) {
      setError(`Profil non créé : ${clientError.message}`);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/client/factures"), 1500);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080a0f] px-4 py-16">

      {/* Glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(176,141,87,0.07)] blur-[120px]" />
        <div className="absolute left-[-100px] top-[10%] h-[300px] w-[300px] rounded-full bg-[rgba(59,157,255,0.04)] blur-[80px]" />
        <div className="absolute bottom-[10%] right-[-80px] h-[250px] w-[250px] rounded-full bg-[rgba(139,92,246,0.04)] blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease }}
        className="relative z-10 w-full max-w-[460px]"
      >
        {/* Bordure glow externe */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-[rgba(201,165,90,0.12)] to-transparent opacity-70 blur-sm" />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0f1117]/90 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">

          {/* Logo + titre */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease }}
            className="mb-8 flex flex-col items-center gap-4"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.09)]">
              <Sparkles size={24} style={{ color: "#c9a55a" }} />
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#c9a55a]">
                <Lock size={9} /> Espace client
              </span>
              <h1 className="mt-3 text-2xl font-extrabold text-white">Créer un compte</h1>
              <p className="mt-1 text-sm text-white/35">Rejoignez DJAMA et accédez à vos outils</p>
            </div>
          </motion.div>

          {/* Formulaire */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <AuthField label="Nom complet" type="text" value={nom} onChange={setNom}
              placeholder="Jean Dupont" icon={User} autoComplete="name" />

            <AuthField label="Adresse e-mail" type="email" value={email} onChange={setEmail}
              placeholder="vous@exemple.com" icon={Mail} autoComplete="email" />

            <AuthField label="Téléphone (optionnel)" type="tel" value={telephone} onChange={setTelephone}
              placeholder="+33 6 00 00 00 00" icon={Phone} autoComplete="tel" />

            {/* Abonnement */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Abonnement</label>
              <select
                value={abonnement}
                onChange={(e) => setAbonnement(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition-colors hover:border-white/20 [&>option]:bg-[#0f1117] [&>option]:text-white"
              >
                <option value="Outils DJAMA">Outils DJAMA — 11,90€ / mois</option>
                <option value="Coaching IA">Coaching IA — 190€ / 3 mois</option>
                <option value="Aucun">Sans abonnement</option>
              </select>
            </div>

            <AuthField label="Mot de passe" type={showPwd ? "text" : "password"}
              value={password} onChange={setPassword} placeholder="Min. 8 caractères"
              icon={Lock} autoComplete="new-password"
              right={
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="text-white/30 transition hover:text-white/60">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            {/* Erreur */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3"
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                  <p className="text-xs leading-relaxed text-red-300">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3"
                >
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-400" />
                  <p className="text-xs text-green-300">Compte créé ! Redirection vers votre espace…</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              disabled={loading || success}
              className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-6 py-4 text-sm font-extrabold text-[#0a0a0a] shadow-[0_4px_20px_rgba(201,165,90,0.3)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(201,165,90,0.45)] disabled:opacity-60"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black/70" />
                    Création du compte…
                  </>
                ) : (
                  <>Créer mon espace client <ArrowRight size={15} /></>
                )}
              </span>
            </motion.button>
          </motion.form>

          <p className="mt-6 text-center text-xs text-white/20">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-bold text-[#c9a55a] underline underline-offset-2 hover:text-[#e8cc94] transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
