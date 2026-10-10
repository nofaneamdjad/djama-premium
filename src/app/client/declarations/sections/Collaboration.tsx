"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Users, Shield, Mail, Trash2, RefreshCw,
  CheckCircle2, Clock, XCircle, ChevronDown, MessageSquare,
  Send, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, GOLD, fmtDate } from "../decl-utils";
import type { Collaborateur, CollaborateurRole, CollaborateurStatut } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  add: (msg: string, type?: "success" | "error") => void;
}

const ROLE_CFG: Record<CollaborateurRole, { label: string; desc: string }> = {
  consultation:  { label: "Consultation",  desc: "Lecture seule — visualise les déclarations" },
  preparation:   { label: "Préparation",   desc: "Peut préparer et modifier les déclarations" },
  verification:  { label: "Vérification",  desc: "Peut vérifier et annoter les déclarations" },
  validation:    { label: "Validation",    desc: "Peut valider les déclarations préparées" },
  export:        { label: "Export",        desc: "Peut exporter les documents PDF" },
  transmission:  { label: "Transmission",  desc: "Peut marquer comme déposée auprès de l'administration" },
};

const STATUT_CFG: Record<CollaborateurStatut, { label: string; icon: React.ElementType; color: string }> = {
  invite: { label: "Invitation envoyée", icon: Clock,         color: GOLD      },
  actif:  { label: "Actif",              icon: CheckCircle2,  color: "#22c55e" },
  revoque:{ label: "Révoqué",            icon: XCircle,       color: "#ef4444" },
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function CollaborationSection({ userId, isDark, add }: Props) {
  const t = tok(isDark);
  const [collabs, setCollabs] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaborateurRole>("consultation");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("decl_collaborateurs")
      .select("*")
      .eq("owner_user_id", userId!)
      .order("created_at", { ascending: false });
    setCollabs((data ?? []) as Collaborateur[]);
    setLoading(false);
  }

  async function invite() {
    if (!userId || !email.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("decl_collaborateurs").insert({
      owner_user_id: userId,
      collaborateur_email: email.trim().toLowerCase(),
      role,
      message: message.trim() || null,
      statut: "invite",
    });
    setSaving(false);
    if (error) { add(error.message, "error"); return; }
    add(`Invitation envoyée à ${email.trim()}`);
    setEmail(""); setMessage(""); setShowForm(false);
    load();
  }

  async function revoke(id: string) {
    const { error } = await supabase
      .from("decl_collaborateurs")
      .update({ statut: "revoque" })
      .eq("id", id)
      .eq("owner_user_id", userId!);
    if (error) { add(error.message, "error"); return; }
    add("Accès révoqué");
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase
      .from("decl_collaborateurs")
      .delete()
      .eq("id", id)
      .eq("owner_user_id", userId!);
    if (error) { add(error.message, "error"); return; }
    add("Invitation supprimée");
    load();
  }

  const actifs   = collabs.filter(c => c.statut === "actif");
  const invites  = collabs.filter(c => c.statut === "invite");
  const revoques = collabs.filter(c => c.statut === "revoque");

  return (
    <div className="flex flex-col gap-5">
      {/* Info */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-2.5"
        style={{ background: `${GOLD}0d`, border: `1px solid ${GOLD}25` }}>
        <Shield size={13} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
        <p className="text-[11px] leading-relaxed" style={{ color: t.text2 }}>
          Invitez votre expert-comptable ou collaborateur à consulter vos déclarations.
          Les données restent hébergées sur votre compte — chaque invité n'a accès qu'aux droits que vous lui accordez.
        </p>
      </div>

      {/* Header + bouton */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: t.text }}>Collaborateurs</h2>
          <p className="text-xs mt-0.5" style={{ color: t.text3 }}>
            {collabs.filter(c => c.statut !== "revoque").length} actif(s) ou en attente
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}35` }}
        >
          <UserPlus size={13} />
          Inviter
        </button>
      </div>

      {/* Formulaire invitation */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: t.glass, border: `1px solid ${t.border}` }}>
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                Inviter un collaborateur
              </h3>

              {/* Email */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: t.text3 }}>
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="expert@cabinet.fr"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: t.glassMd, border: `1px solid ${t.border}`, color: t.text }}
                />
              </div>

              {/* Rôle */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: t.text3 }}>Rôle</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(ROLE_CFG) as [CollaborateurRole, typeof ROLE_CFG[CollaborateurRole]][]).map(([r, cfg]) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className="text-left rounded-xl px-3 py-2.5 text-xs transition-all"
                      style={r === role
                        ? { background: `${GOLD}15`, border: `1px solid ${GOLD}40`, color: GOLD }
                        : { background: t.glassMd, border: `1px solid ${t.border}`, color: t.text2 }
                      }
                    >
                      <div className="font-semibold">{cfg.label}</div>
                      <div className="mt-0.5 opacity-70">{cfg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message optionnel */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: t.text3 }}>
                  Message (optionnel)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={2}
                  placeholder="Bonjour, je vous donne accès à mes déclarations DJAMA…"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ background: t.glassMd, border: `1px solid ${t.border}`, color: t.text }}
                />
              </div>

              {/* Avertissement Resend */}
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: "#f87171" }} />
                <p className="text-[10px]" style={{ color: "#f87171" }}>
                  L'invitation enregistre l'accès dans DJAMA. Notifiez le collaborateur par e-mail séparément — l'envoi automatique nécessite une configuration Resend.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setEmail(""); setMessage(""); }}
                  className="flex-1 rounded-xl py-2.5 text-sm transition-all"
                  style={{ background: t.glassMd, border: `1px solid ${t.border}`, color: t.text2 }}
                >
                  Annuler
                </button>
                <button
                  onClick={invite}
                  disabled={!email.trim() || saving}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: GOLD, color: "#111" }}
                >
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  Enregistrer l'invitation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste collaborateurs */}
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw size={18} className="animate-spin" style={{ color: t.text4 }} />
        </div>
      ) : collabs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${GOLD}10` }}>
            <Users size={20} style={{ color: GOLD }} />
          </div>
          <p className="text-sm font-medium" style={{ color: t.text2 }}>Aucun collaborateur</p>
          <p className="text-xs max-w-xs" style={{ color: t.text3 }}>
            Invitez votre expert-comptable pour qu'il puisse préparer ou vérifier vos déclarations.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {[...actifs, ...invites, ...revoques].map(c => {
            const statutCfg = STATUT_CFG[c.statut];
            const StatutIcon = statutCfg.icon;
            const isExpanded = expandedId === c.id;

            return (
              <motion.div
                key={c.id}
                layout
                className="rounded-2xl overflow-hidden"
                style={{ background: t.glass, border: `1px solid ${t.border}` }}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: `${GOLD}15`, color: GOLD }}>
                    {c.collaborateur_email.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate" style={{ color: t.text }}>
                        {c.collaborateur_email}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: `${statutCfg.color}15`, color: statutCfg.color, border: `1px solid ${statutCfg.color}30` }}>
                        {statutCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Shield size={10} style={{ color: t.text4 }} />
                      <span className="text-[11px]" style={{ color: t.text3 }}>
                        {ROLE_CFG[c.role].label}
                      </span>
                      <span style={{ color: t.text4 }}>·</span>
                      <span className="text-[11px]" style={{ color: t.text4 }}>
                        {fmtDate(c.created_at)}
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    size={14}
                    className="transition-transform shrink-0"
                    style={{ color: t.text4, transform: isExpanded ? "rotate(180deg)" : "none" }}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${t.borderSoft}` }}>
                        <div className="pt-3 flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs">
                            <span style={{ color: t.text3 }}>Rôle</span>
                            <span style={{ color: t.text2 }}>{ROLE_CFG[c.role].desc}</span>
                          </div>
                          {c.message && (
                            <div className="flex gap-2 mt-1 rounded-lg px-3 py-2"
                              style={{ background: t.glassMd }}>
                              <MessageSquare size={11} className="mt-0.5 shrink-0" style={{ color: t.text4 }} />
                              <p className="text-xs italic" style={{ color: t.text3 }}>{c.message}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={`mailto:${c.collaborateur_email}`}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
                            style={{ background: t.glassMd, border: `1px solid ${t.border}`, color: t.text2 }}
                          >
                            <Mail size={11} />
                            Contacter
                          </a>
                          {c.statut !== "revoque" && (
                            <button
                              onClick={() => revoke(c.id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
                              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
                            >
                              <XCircle size={11} />
                              Révoquer
                            </button>
                          )}
                          {c.statut === "revoque" && (
                            <button
                              onClick={() => remove(c.id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
                              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
                            >
                              <Trash2 size={11} />
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
