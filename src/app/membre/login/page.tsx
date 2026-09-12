"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

function Field({
  label, type, value, onChange, placeholder, icon: Icon, right,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ElementType; right?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-secondary)" }}>
        {label}
      </label>
      <div
        className="field-wrap flex items-center gap-2.5 rounded-xl border px-3.5 transition-colors"
        style={{
          borderColor: focused ? GOLD : "var(--border-strong)",
          background: "var(--bg-base)",
          boxShadow: focused ? `0 0 0 3px rgba(201,165,90,0.12)` : "none",
        }}
      >
        <Icon size={15} style={{ color: focused ? GOLD : "var(--ink-muted)", flexShrink: 0 }} />
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="h-[46px] flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        {right}
      </div>
    </div>
  );
}

type OrgMembership = {
  organization_id: string;
  role: string;
  suspended_at: string | null;
  organizations: { name: string; logo_url: string | null } | null;
};

function MembreLoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") ?? "/membre/dashboard";
  const suspended    = searchParams.get("suspended") === "1";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Multi-org selector state
  const [orgs, setOrgs]           = useState<OrgMembership[]>([]);
  const [selectingOrg, setSelectingOrg] = useState(false);

  // Redirect already-authenticated active members
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("organization_members")
        .select("organization_id, role, suspended_at")
        .eq("user_id", user.id)
        .is("suspended_at", null)
        .limit(1);
      if (data && data.length > 0) {
        router.replace("/membre/dashboard");
      }
    });
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: sbErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (sbErr || !authData.session) {
        setError("Email ou mot de passe incorrect.");
        return;
      }

      const user = authData.session.user;

      // Vérifier que l'utilisateur est membre d'au moins une organisation
      const { data: memberships, error: memErr } = await supabase
        .from("organization_members")
        .select("organization_id, role, suspended_at, organizations!inner(name, logo_url)")
        .eq("user_id", user.id);

      if (memErr) {
        await supabase.auth.signOut();
        setError("Erreur lors de la vérification de votre accès.");
        return;
      }

      if (!memberships || memberships.length === 0) {
        await supabase.auth.signOut();
        setError("Votre compte n'est associé à aucune organisation. Contactez votre responsable.");
        return;
      }

      // Vérifier si tous les memberships sont suspendus
      const activeMembers = memberships.filter(m => !m.suspended_at);
      if (activeMembers.length === 0) {
        await supabase.auth.signOut();
        setError("Votre accès a été suspendu. Contactez votre responsable d'organisation.");
        return;
      }

      const typedMemberships = memberships.map(m => ({
        organization_id: m.organization_id,
        role: m.role,
        suspended_at: m.suspended_at as string | null,
        organizations: Array.isArray(m.organizations)
          ? (m.organizations[0] as { name: string; logo_url: string | null })
          : (m.organizations as { name: string; logo_url: string | null } | null),
      }));

      // Si plusieurs orgs actives : afficher le sélecteur
      if (activeMembers.length > 1) {
        setOrgs(typedMemberships.filter(m => !m.suspended_at));
        setSelectingOrg(true);
        return;
      }

      // Sinon : redirection directe
      const orgId = activeMembers[0].organization_id;
      await supabase.auth.updateUser({ data: { active_org_id: orgId } });
      router.replace(redirectTo);

    } catch {
      setError("Erreur inattendue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function selectOrg(orgId: string) {
    await supabase.auth.updateUser({ data: { active_org_id: orgId } });
    router.replace(redirectTo);
  }

  // ─── Sélecteur multi-org ─────────────────────────────────────────────────
  if (selectingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
        <style>{`
          :root { color-scheme: light; }
          body { background: #ffffff; }
        `}</style>
        <div className="w-full max-w-[400px]">
          <div className="mb-6 flex flex-col items-center gap-3">
            <Image src="/logo-transparent.png" alt="DJAMA" width={120} height={40} className="h-[36px] w-auto object-contain" />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Choisissez votre organisation
            </h1>
            <p className="text-sm text-center" style={{ color: "var(--ink-secondary)" }}>
              Vous appartenez à plusieurs organisations.
            </p>
          </div>
          <div className="space-y-2">
            {orgs.map(m => (
              <button
                key={m.organization_id}
                onClick={() => selectOrg(m.organization_id)}
                className="w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all hover:border-[#c9a55a] hover:shadow-sm"
                style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(201,165,90,0.1)" }}>
                  {m.organizations?.logo_url
                    ? <img src={m.organizations.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                    : <Users size={18} style={{ color: GOLD }} />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{m.organizations?.name ?? "Organisation"}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--ink-secondary)" }}>{m.role}</p>
                </div>
                <ArrowRight size={14} className="ml-auto shrink-0" style={{ color: "var(--ink-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulaire de connexion ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
      <style>{`
        :root { color-scheme: light; }
        body { background: #ffffff; }
      `}</style>

      <div className="w-full max-w-[400px]">

        {/* Logo + titres */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/logo-transparent.png"
            alt="DJAMA"
            width={140}
            height={48}
            className="h-[42px] w-auto object-contain"
            priority
          />
          <div className="text-center">
            <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              Espace membre
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
              Connectez-vous à votre espace de travail.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Field
            label="Adresse e-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="vous@exemple.com"
            icon={Mail}
          />
          <Field
            label="Mot de passe"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            icon={Lock}
            right={
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="transition"
                style={{ color: "var(--ink-muted)" }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          {suspended && !error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-800">
                Votre accès a été suspendu. Contactez votre responsable d&apos;organisation.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs leading-relaxed text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="mt-2 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ background: GOLD }}
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>Se connecter <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px]" style={{ color: "var(--ink-muted)" }}>
          Vous n&apos;êtes pas membre ?{" "}
          <Link href="/login" className="font-medium hover:underline" style={{ color: GOLD }}>
            Espace principal
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function MembreLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <MembreLoginInner />
    </Suspense>
  );
}
