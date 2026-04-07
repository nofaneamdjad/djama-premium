"use client";

/**
 * /admin/acces — Gestion des accès utilisateurs
 *
 * Source de données : table "user_access" dans Supabase.
 * Identifiant principal : email.
 *
 * Fonctionnalités :
 *   · Afficher tous les utilisateurs avec leurs accès
 *   · Toggle immédiat (optimiste) → persisté dans Supabase
 *   · Ajouter un accès manuellement par email
 *   · Modifier nom / accès d'un utilisateur existant
 *   · Supprimer un utilisateur
 *   · Recherche par email ou nom
 *   · Badge source : manual | stripe | paypal
 */

import { useEffect, useRef, useState } from "react";
import {
  Shield, Plus, X, Check, Loader2, Trash2,
  RefreshCw, Search, Pencil, CreditCard, User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { UserAccessRow } from "@/types/db";

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────

type AccessCol = "espace_premium" | "coaching_ia" | "soutien_scolaire" | "outils_saas";

const ACCESS_COLS: { key: AccessCol; label: string; color: string }[] = [
  { key: "espace_premium",   label: "Espace Premium",   color: "#c9a55a" },
  { key: "coaching_ia",      label: "Coaching IA",      color: "#a78bfa" },
  { key: "soutien_scolaire", label: "Soutien scolaire", color: "#60a5fa" },
  { key: "outils_saas",      label: "Outils SaaS",      color: "#4ade80" },
];

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  manual:   { label: "Manuel",   cls: "text-[#c9a55a] bg-[rgba(201,165,90,0.1)]"   },
  stripe:   { label: "Stripe",   cls: "text-[#a78bfa] bg-[rgba(167,139,250,0.1)]"  },
  paypal:   { label: "PayPal",   cls: "text-[#60a5fa] bg-[rgba(96,165,250,0.1)]"   },
  migrated: { label: "Migré",    cls: "text-white/30 bg-white/[0.05]"               },
};

// ─────────────────────────────────────────────────────────────
// Types formulaire
// ─────────────────────────────────────────────────────────────

interface AccessForm {
  email:            string;
  name:             string;
  espace_premium:   boolean;
  coaching_ia:      boolean;
  soutien_scolaire: boolean;
  outils_saas:      boolean;
  notes:            string;
}

const EMPTY_FORM: AccessForm = {
  email: "", name: "", espace_premium: false,
  coaching_ia: false, soutien_scolaire: false, outils_saas: false,
  notes: "",
};

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────

export default function AdminAcces() {
  const [users,      setUsers]      = useState<UserAccessRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [modal,      setModal]      = useState<"add" | "edit" | null>(null);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState<AccessForm>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const loadedRef = useRef(false);

  // ── Chargement ─────────────────────────────────────────────
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_access")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminAcces] fetch error:", error);
    } else {
      setUsers((data ?? []) as UserAccessRow[]);
    }
    setLoading(false);
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), ok ? 3000 : 6000);
  }

  // ── Toggle accès — optimiste ───────────────────────────────
  async function toggle(id: string, col: AccessCol) {
    const current = users.find(u => u.id === id);
    if (!current) return;

    const newVal = !current[col];

    // Mise à jour optimiste locale
    setUsers(prev =>
      prev.map(u => u.id === id ? { ...u, [col]: newVal } : u)
    );

    const { error } = await supabase
      .from("user_access")
      .update({ [col]: newVal, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[AdminAcces] toggle error:", error);
      // Annuler le changement optimiste
      setUsers(prev =>
        prev.map(u => u.id === id ? { ...u, [col]: current[col] } : u)
      );
      showToast("Erreur lors de la mise à jour.");
    }
  }

  // ── Ouvrir modal Ajouter ───────────────────────────────────
  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal("add");
    setSaveErr(null);
  }

  // ── Ouvrir modal Modifier ──────────────────────────────────
  function openEdit(u: UserAccessRow) {
    setForm({
      email:            u.email,
      name:             u.name,
      espace_premium:   u.espace_premium,
      coaching_ia:      u.coaching_ia,
      soutien_scolaire: u.soutien_scolaire,
      outils_saas:      u.outils_saas,
      notes:            u.notes ?? "",
    });
    setEditId(u.id);
    setModal("edit");
    setSaveErr(null);
  }

  // ── Sauvegarde (add ou edit) ───────────────────────────────
  async function save() {
    if (!form.email.trim()) {
      setSaveErr("L'email est obligatoire.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setSaveErr("Email invalide.");
      return;
    }
    setSaving(true);
    setSaveErr(null);

    try {
      if (modal === "add") {
        // ── Ajout manuel : passe par l'API serveur
        //    → crée/met à jour user_access + envoie l'email de bienvenue
        const res = await fetch("/api/admin/grant-access", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            email:            form.email.trim().toLowerCase(),
            name:             form.name.trim(),
            espace_premium:   form.espace_premium,
            coaching_ia:      form.coaching_ia,
            soutien_scolaire: form.soutien_scolaire,
            outils_saas:      form.outils_saas,
            notes:            form.notes.trim() || null,
          }),
        });

        const json = await res.json() as {
          success?:     boolean;
          error?:       string;
          isNew?:       boolean;
          email_sent?:  boolean;
          email_error?: string;
        };

        if (!res.ok || !json.success) {
          throw new Error(json.error ?? "Erreur serveur.");
        }

        const emailOk = json.email_sent === true;
        const action  = json.isNew ? "Accès créé" : "Accès mis à jour";
        const label   = emailOk
          ? `${action} — email de bienvenue envoyé ✓`
          : `${action} ✓ — email non envoyé : ${json.email_error ?? "vérifiez RESEND_API_KEY et la console"}`;

        setModal(null);
        showToast(label, emailOk);

      } else {
        // ── Modification : mise à jour directe Supabase (pas de renvoi d'email)
        const payload = {
          email:            form.email.trim().toLowerCase(),
          name:             form.name.trim(),
          espace_premium:   form.espace_premium,
          coaching_ia:      form.coaching_ia,
          soutien_scolaire: form.soutien_scolaire,
          outils_saas:      form.outils_saas,
          notes:            form.notes.trim() || null,
          source:           "manual" as const,
          updated_at:       new Date().toISOString(),
        };

        const { error } = await supabase
          .from("user_access")
          .update(payload)
          .eq("id", editId!);

        if (error) throw error;

        setModal(null);
        showToast("Accès mis à jour ✓");
      }

      load();
    } catch (err) {
      console.error("[AdminAcces] save error:", err);
      setSaveErr(
        err instanceof Error
          ? err.message
          : "Erreur lors de la sauvegarde."
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Suppression ────────────────────────────────────────────
  async function deleteUser(id: string) {
    const { error } = await supabase.from("user_access").delete().eq("id", id);
    if (error) {
      console.error("[AdminAcces] delete error:", error);
      return;
    }
    setConfirmDel(null);
    showToast("Accès supprimé");
    load();
  }

  // ── Filtrage ───────────────────────────────────────────────
  const displayed = search.trim()
    ? users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  // ── Stats rapides ──────────────────────────────────────────
  const total   = users.length;
  const active  = users.filter(u =>
    u.espace_premium || u.coaching_ia || u.soutien_scolaire || u.outils_saas
  ).length;
  const fromStripe = users.filter(u => u.source === "stripe").length;

  // ─────────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={[
          "fixed right-6 top-6 z-50 flex max-w-sm items-start gap-2 rounded-2xl border px-4 py-3 text-[0.82rem] font-semibold shadow-xl",
          toast.ok
            ? "border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)] text-[#4ade80]"
            : "border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] text-[#f87171]",
        ].join(" ")}>
          <Check size={13} className="mt-0.5 shrink-0" /> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.12)]">
            <Shield size={17} className="text-[#c9a55a]" />
          </div>
          <div>
            <h1 className="text-[1.3rem] font-black text-white">Gestion des accès</h1>
            <p className="text-[0.78rem] text-white/30">
              {total} utilisateur{total !== 1 ? "s" : ""} ·{" "}
              <span className="text-[#4ade80]">{active} actif{active !== 1 ? "s" : ""}</span>
              {fromStripe > 0 && (
                <> · <span className="text-[#a78bfa]">{fromStripe} via Stripe</span></>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#c9a55a] px-4 py-2.5 text-[0.83rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90"
        >
          <Plus size={14} /> Ajouter un accès
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par email ou nom…"
          className="w-full rounded-2xl border border-white/[0.06] bg-[#18181c] py-2.5 pl-10 pr-4 text-[0.84rem] text-white/70 placeholder:text-white/20 outline-none focus:border-[rgba(201,165,90,0.3)]"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#18181c]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/20">
            <Shield size={28} />
            <p className="text-[0.83rem]">
              {search ? "Aucun résultat" : "Aucun accès configuré"}
            </p>
            {!search && (
              <button onClick={openAdd} className="text-[0.78rem] text-[#c9a55a] hover:opacity-80">
                + Ajouter le premier accès
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-5 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-white/25">
                    Utilisateur
                  </th>
                  {ACCESS_COLS.map(c => (
                    <th
                      key={c.key}
                      className="px-4 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                      style={{ color: `${c.color}80` }}
                    >
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-white/25">
                    Source
                  </th>
                  <th className="px-4 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-white/25">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {displayed.map(u => (
                  <tr key={u.id} className="group transition-colors hover:bg-white/[0.02]">
                    {/* Utilisateur */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[0.65rem] font-bold text-white/40">
                          {(u.name || u.email).slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[0.84rem] font-semibold text-white/85">
                            {u.name || <span className="italic text-white/30">Sans nom</span>}
                          </p>
                          <p className="text-[0.72rem] text-white/30">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Toggles */}
                    {ACCESS_COLS.map(({ key, color }) => (
                      <td key={key} className="px-4 py-4">
                        <button
                          onClick={() => toggle(u.id, key)}
                          title={u[key] ? "Désactiver" : "Activer"}
                          className={[
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200",
                            u[key] ? "" : "bg-white/[0.07]",
                          ].join(" ")}
                          style={u[key] ? { backgroundColor: `${color}28` } : {}}
                        >
                          <span
                            className={[
                              "absolute h-3.5 w-3.5 rounded-full shadow-sm transition-all duration-200",
                              u[key] ? "translate-x-[18px]" : "translate-x-[3px] bg-white/20",
                            ].join(" ")}
                            style={u[key] ? { backgroundColor: color } : {}}
                          />
                        </button>
                      </td>
                    ))}

                    {/* Source */}
                    <td className="px-4 py-4">
                      <SourceBadge source={u.source} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(u)}
                          title="Modifier"
                          className="text-white/25 transition-colors hover:text-[#60a5fa]"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDel(u.id)}
                          title="Supprimer"
                          className="text-white/25 transition-colors hover:text-[#f87171]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer table */}
        {!loading && displayed.length > 0 && (
          <div className="flex items-center justify-between border-t border-white/[0.04] px-5 py-3">
            <p className="text-[0.72rem] text-white/20">
              {displayed.length} / {total} utilisateur{total !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => { loadedRef.current = false; load(); }}
              className="flex items-center gap-1.5 text-[0.72rem] text-white/20 transition-colors hover:text-white/45"
            >
              <RefreshCw size={11} /> Actualiser
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Add / Edit ─────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.1)]">
                  {modal === "add" ? <Plus size={14} className="text-[#c9a55a]" /> : <Pencil size={13} className="text-[#c9a55a]" />}
                </div>
                <h2 className="text-[0.95rem] font-black text-white">
                  {modal === "add" ? "Ajouter un accès" : "Modifier l'accès"}
                </h2>
              </div>
              <button onClick={() => setModal(null)} className="text-white/30 hover:text-white/70">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[0.71rem] font-bold uppercase tracking-[0.07em] text-white/30">
                  <User size={10} /> Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  disabled={modal === "edit"}
                  placeholder="utilisateur@email.com"
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-[rgba(201,165,90,0.4)] disabled:opacity-50"
                />
                {modal === "add" && (
                  <p className="mt-1 text-[0.67rem] text-white/20">
                    Si l&apos;email existe déjà, ses accès seront mis à jour.
                  </p>
                )}
              </div>

              {/* Nom */}
              <div>
                <label className="mb-1.5 block text-[0.71rem] font-bold uppercase tracking-[0.07em] text-white/30">
                  Nom (optionnel)
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jean Dupont"
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-[rgba(201,165,90,0.4)]"
                />
              </div>

              {/* Accès */}
              <div>
                <label className="mb-2.5 block text-[0.71rem] font-bold uppercase tracking-[0.07em] text-white/30">
                  Accès à activer
                </label>
                <div className="space-y-2">
                  {ACCESS_COLS.map(({ key, label, color }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[0.84rem] font-medium text-white/70">{label}</span>
                      </div>
                      <div
                        className={[
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200",
                          form[key] ? "" : "bg-white/[0.07]",
                        ].join(" ")}
                        style={form[key] ? { backgroundColor: `${color}28` } : {}}
                        onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                      >
                        <span
                          className={[
                            "absolute h-3.5 w-3.5 rounded-full shadow-sm transition-all duration-200",
                            form[key] ? "translate-x-[18px]" : "translate-x-[3px] bg-white/20",
                          ].join(" ")}
                          style={form[key] ? { backgroundColor: color } : {}}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-[0.71rem] font-bold uppercase tracking-[0.07em] text-white/30">
                  Notes internes (optionnel)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Raison de l'activation, devis n°…"
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-[rgba(201,165,90,0.4)]"
                />
              </div>

              {/* Erreur */}
              {saveErr && (
                <p className="rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[0.78rem] text-[#f87171]">
                  {saveErr}
                </p>
              )}

              {/* Boutons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 rounded-2xl border border-white/[0.08] py-2.5 text-[0.83rem] font-bold text-white/40 transition-colors hover:text-white/70"
                >
                  Annuler
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#c9a55a] py-2.5 text-[0.83rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  {modal === "add" ? "Créer l'accès" : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ─────────────────────────────── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 text-center">
            <Trash2 size={24} className="mx-auto mb-3 text-[#f87171]" />
            <p className="mb-1 font-bold text-white">Supprimer cet accès ?</p>
            <p className="mb-5 text-[0.8rem] text-white/35">
              L&apos;utilisateur perdra tous ses accès immédiatement.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 rounded-2xl border border-white/[0.08] py-2.5 text-[0.83rem] font-bold text-white/40 transition-colors hover:text-white/70"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteUser(confirmDel)}
                className="flex-1 rounded-2xl bg-[rgba(248,113,113,0.15)] py-2.5 text-[0.83rem] font-bold text-[#f87171] transition-colors hover:bg-[rgba(248,113,113,0.25)]"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composant badge source
// ─────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  const cfg = SOURCE_BADGE[source] ?? { label: source, cls: "text-white/25 bg-white/[0.04]" };
  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${cfg.cls}`}>
      {source === "stripe" && <CreditCard size={9} />}
      {source === "manual" && <Shield size={9} />}
      {cfg.label}
    </div>
  );
}
