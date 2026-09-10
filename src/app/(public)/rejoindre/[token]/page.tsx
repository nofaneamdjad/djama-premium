"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Building2, CheckCircle2, AlertTriangle, Clock, Users, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ROLE_LABELS: Record<string, string> = {
  admin:     "Administrateur",
  member:    "Membre",
  accountant:"Comptable",
  readonly:  "Lecture seule",
};

type InvitationInfo = {
  id: string;
  orgName: string;
  invitedEmail: string;
  role: string;
  expiresAt: string;
  permissions: { selected_apps?: string[] };
};

export default function RejoindreTokenPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token  = params.token;

  const [info,    setInfo]    = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [user,    setUser]    = useState<{ id: string; email: string } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done,    setDone]    = useState(false);

  useEffect(() => {
    async function init() {
      const [invRes, { data: { user: u } }] = await Promise.all([
        fetch(`/api/organizations/invite/${token}`),
        supabase.auth.getUser(),
      ]);

      if (u) setUser({ id: u.id, email: u.email ?? "" });

      if (!invRes.ok) {
        const d = await invRes.json();
        setError(d.error ?? "Invitation introuvable ou expirée.");
      } else {
        setInfo(await invRes.json());
      }
      setLoading(false);
    }
    init();
  }, [token]);

  async function acceptInvitation() {
    if (!user) return;
    setAccepting(true);
    const res  = await fetch(`/api/organizations/invite/${token}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setAccepting(false); return; }
    setDone(true);
    setTimeout(() => router.push("/client"), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#0d0821" }}>
        <RefreshCw className="animate-spin text-amber-400" size={30} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: "linear-gradient(175deg, #1a0c35 0%, #0d0821 50%, #060c18 100%)" }}>
      {/* Logo */}
      <div className="mb-10">
        <Link href="/">
          <Image src="/logo-navbar.png" alt="DJAMA" width={160} height={36} className="h-9 w-auto object-contain" />
        </Link>
      </div>

      <div className="w-full max-w-md rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
        {/* Error state */}
        {error && !info && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertTriangle size={26} className="text-red-400" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">Invitation invalide</h1>
            <p className="mb-6 text-sm text-white/50">{error}</p>
            <Link href="/login" className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400">
              Se connecter
            </Link>
          </div>
        )}

        {/* Invitation info */}
        {info && !done && (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                <Building2 size={26} className="text-amber-500" />
              </div>
              <h1 className="mb-1 text-xl font-bold text-white">Invitation à rejoindre</h1>
              <p className="text-2xl font-bold" style={{ color: "#c9a55a" }}>{info.orgName}</p>
            </div>

            <div className="mb-6 space-y-2 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Rôle attribué</span>
                <span className="font-semibold text-amber-400">{ROLE_LABELS[info.role] ?? info.role}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Email invité</span>
                <span className="text-white/80">{info.invitedEmail}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Expire le</span>
                <span className="flex items-center gap-1 text-white/60">
                  <Clock size={12} />
                  {new Date(info.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              {info.permissions?.selected_apps && info.permissions.selected_apps.length > 0 && (
                <div className="flex items-start justify-between text-sm">
                  <span className="text-white/40">Applications</span>
                  <span className="text-right text-white/70">{info.permissions.selected_apps.length} app{info.permissions.selected_apps.length > 1 ? "s" : ""} accessibles</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
            )}

            {/* Logged in → accept directly */}
            {user ? (
              <div className="space-y-3">
                <p className="text-center text-sm text-white/50">
                  Connecté en tant que <span className="text-white/80">{user.email}</span>
                </p>
                <button
                  onClick={acceptInvitation}
                  disabled={accepting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-60"
                  style={{ background: "#c9a55a" }}
                >
                  {accepting ? <><RefreshCw size={16} className="animate-spin" /> Rejoindre…</> : <><Users size={16} /> Accepter l'invitation</>}
                </button>
                <p className="text-center text-xs text-white/30">
                  Pas le bon compte ?{" "}
                  <Link href={`/login?redirect=/rejoindre/${token}`} className="text-amber-400 underline">
                    Se connecter avec un autre compte
                  </Link>
                </p>
              </div>
            ) : (
              /* Not logged in → offer login or register */
              <div className="space-y-3">
                <p className="mb-4 text-center text-sm text-white/50">
                  Connectez-vous ou créez un compte pour rejoindre l'organisation.
                </p>
                <Link
                  href={`/login?redirect=/rejoindre/${token}`}
                  className="flex w-full items-center justify-center rounded-2xl py-4 text-sm font-bold text-black transition hover:bg-amber-400"
                  style={{ background: "#c9a55a" }}
                >
                  Se connecter
                </Link>
                <Link
                  href={`/register?redirect=/rejoindre/${token}`}
                  className="flex w-full items-center justify-center rounded-2xl py-4 text-sm font-semibold text-white/80 transition hover:bg-white/8"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </>
        )}

        {/* Success state */}
        {done && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
              <CheckCircle2 size={26} className="text-green-400" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">Vous avez rejoint l'équipe !</h1>
            <p className="text-sm text-white/50">Redirection vers votre espace…</p>
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-white/20">
        © {new Date().getFullYear()} DJAMA — Tous droits réservés
      </p>
    </div>
  );
}
