"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Crown, CheckCircle2, Phone, Building2,
  LogOut, ArrowRight, Sparkles, Lock, Eye, EyeOff,
  AlertCircle, FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/use-require-subscription";
import { PLAN_PRICE_LABEL } from "@/lib/plans";
import Link from "next/link";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

function Field({
  label, value, onChange, type = "text", placeholder, icon: Icon,
  readOnly = false, hint,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; icon: React.ElementType;
  readOnly?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          <Icon size={14} className={readOnly ? "text-gray-300" : "text-gray-400"} />
        </div>
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition ${
            readOnly
              ? "cursor-not-allowed border-gray-100 bg-gray-50/50 text-gray-400"
              : "border-gray-200 bg-gray-50 text-gray-800 focus:border-[#c9a55a] focus:ring-2 focus:ring-[#c9a55a]/15"
          }`}
        />
        {readOnly && (
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
            <Lock size={12} className="text-gray-300" />
          </div>
        )}
      </div>
      {hint && <p className="mt-1 text-[0.65rem] text-gray-300">{hint}</p>}
    </div>
  );
}

export default function ProfilPage() {
  const sub = useSubscription();
  const { level, isPremium, name, email, userId } = sub;

  /* ── Infos perso ── */
  const [displayName, setDisplayName] = useState(name ?? "");
  const [phone,       setPhone]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");

  /* ── Infos entreprise ── */
  const [nomSociete,  setNomSociete]  = useState("");
  const [siret,       setSiret]       = useState("");
  const [adresse,     setAdresse]     = useState("");
  const [savingBiz,   setSavingBiz]   = useState(false);
  const [savedBiz,    setSavedBiz]    = useState(false);

  /* ── Mot de passe ── */
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew,     setPwdNew]     = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [savedPwd,   setSavedPwd]   = useState(false);
  const [errorPwd,   setErrorPwd]   = useState("");

  /* Load existing data from clients table */
  useEffect(() => {
    if (!userId) return;
    supabase.from("clients").select("telephone,nom").eq("id", userId).single()
      .then(({ data }) => {
        if (data) {
          setPhone((data as { telephone?: string; nom?: string }).telephone ?? "");
        }
      });
  }, [userId]);

  /* ── Save perso ── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setError("Le nom ne peut pas être vide."); return; }
    setSaving(true); setError(""); setSaved(false);
    await Promise.all([
      supabase.auth.updateUser({ data: { name: displayName.trim() } }),
      userId && supabase.from("clients").update({ nom: displayName.trim(), telephone: phone.trim() || null }).eq("id", userId),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  /* ── Save entreprise ── */
  async function handleSaveBiz(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSavingBiz(true); setSavedBiz(false);
    await supabase.from("clients").update({
      siret: siret.trim() || null,
      adresse: adresse.trim() || null,
    }).eq("id", userId);
    setSavingBiz(false);
    setSavedBiz(true);
    setTimeout(() => setSavedBiz(false), 3000);
  }

  /* ── Change password ── */
  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault();
    if (pwdNew.length < 8) { setErrorPwd("Le nouveau mot de passe doit contenir au moins 8 caractères."); return; }
    setSavingPwd(true); setErrorPwd(""); setSavedPwd(false);
    const { error: err } = await supabase.auth.updateUser({ password: pwdNew });
    setSavingPwd(false);
    if (err) { setErrorPwd(err.message); }
    else { setSavedPwd(true); setPwdCurrent(""); setPwdNew(""); setTimeout(() => setSavedPwd(false), 3000); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (level === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(201,165,90,0.2)" }} />
          <motion.div className="absolute inset-0 rounded-full"
            style={{ border: "2px solid transparent", borderTopColor: GOLD }}
            animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} />
        </div>
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

        {/* ── Informations personnelles ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-700">Informations personnelles</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <Field label="Nom affiché" value={displayName} onChange={v => { setDisplayName(v); setSaved(false); }}
              placeholder="Votre nom" icon={User} />
            <Field label="Adresse e-mail" value={email ?? ""} icon={Mail} readOnly
              hint="L'adresse e-mail ne peut pas être modifiée" />
            <Field label="Téléphone" value={phone} onChange={setPhone}
              placeholder="+33 6 00 00 00 00" icon={Phone} type="tel" />

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  className="overflow-hidden rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                  <div className="flex gap-2"><AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500"/><p className="text-xs text-red-600">{error}</p></div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={saving || saved}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
              {saved ? (<><CheckCircle2 size={14}/> Enregistré</>)
                : saving ? (<><motion.div className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black/60"
                    animate={{ rotate:360 }} transition={{ duration:0.75, repeat:Infinity, ease:"linear" }}/> Enregistrement…</>)
                : "Sauvegarder"}
            </motion.button>
          </form>
        </div>

        {/* ── Informations entreprise ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-700">Informations entreprise</h2>
          <form onSubmit={handleSaveBiz} className="space-y-3">
            <Field label="Nom de la société" value={nomSociete} onChange={setNomSociete}
              placeholder="Ma Société SAS" icon={Building2} />
            <Field label="SIRET" value={siret} onChange={setSiret}
              placeholder="123 456 789 00010" icon={FileText} />
            <Field label="Adresse" value={adresse} onChange={setAdresse}
              placeholder="12 rue des Lilas, 75001 Paris" icon={Building2} />

            <motion.button type="submit" disabled={savingBiz || savedBiz}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60">
              {savedBiz ? (<><CheckCircle2 size={14} className="text-green-500"/> Enregistré</>)
                : savingBiz ? (<><motion.div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-gray-600"
                    animate={{ rotate:360 }} transition={{ duration:0.75, repeat:Infinity, ease:"linear" }}/> Enregistrement…</>)
                : "Sauvegarder l'entreprise"}
            </motion.button>
          </form>
        </div>

        {/* ── Changer le mot de passe ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-700">Changer le mot de passe</h2>
          <form onSubmit={handleChangePwd} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                  <Lock size={14} className="text-gray-400" />
                </div>
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwdNew}
                  onChange={e => { setPwdNew(e.target.value); setSavedPwd(false); }}
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-12 text-sm text-gray-800 outline-none transition focus:border-[#c9a55a] focus:ring-2 focus:ring-[#c9a55a]/15"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600">
                  {showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {errorPwd && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  className="overflow-hidden rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                  <div className="flex gap-2"><AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500"/><p className="text-xs text-red-600">{errorPwd}</p></div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={savingPwd || savedPwd || pwdNew.length < 8}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
              {savedPwd ? (<><CheckCircle2 size={14} className="text-green-500"/> Mot de passe mis à jour</>)
                : savingPwd ? (<><motion.div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-gray-600"
                    animate={{ rotate:360 }} transition={{ duration:0.75, repeat:Infinity, ease:"linear" }}/> Mise à jour…</>)
                : "Mettre à jour le mot de passe"}
            </motion.button>
          </form>
        </div>

        {/* ── Abonnement ── */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm"
          style={{ borderColor: isPremium ? `${planColor}30` : "#e5e7eb" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">Abonnement</h2>
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold"
              style={{ background: `${planColor}14`, color: planColor }}>
              <PlanIcon size={10}/> {planLabel}
            </div>
          </div>
          {!isPremium ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Vous êtes sur le <strong>plan gratuit</strong>. Passez à DJAMA PRO pour accéder à tous les outils sans restriction.
              </p>
              <Link href="/client/abonnements"
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold text-[#0a0a0a] transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                <Crown size={14}/> Passer à DJAMA PRO — {PLAN_PRICE_LABEL} <ArrowRight size={13}/>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <CheckCircle2 size={15} className="shrink-0 text-green-500"/>
                <p className="text-sm font-medium text-green-700">Accès complet à tous les outils DJAMA PRO</p>
              </div>
              <Link href="/client/abonnements"
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 transition hover:text-gray-600">
                Gérer mon abonnement <ArrowRight size={11}/>
              </Link>
            </div>
          )}
        </div>

        {/* ── Déconnexion ── */}
        <button onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 py-3.5 text-sm font-semibold text-red-400 transition hover:bg-red-50 hover:text-red-500">
          <LogOut size={14}/> Se déconnecter
        </button>

        {userId && <p className="text-center text-[0.6rem] text-gray-200">ID · {userId}</p>}
      </motion.div>
    </div>
  );
}
