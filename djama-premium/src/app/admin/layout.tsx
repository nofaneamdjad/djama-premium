"use client";

import { useState, useEffect } from "react";
import { Lock, ShieldCheck } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Layout admin DJAMA — protégé par mot de passe local.

   Variables requises :
     NEXT_PUBLIC_ADMIN_PASS  → mot de passe admin (affiché dans le bundle)
     ADMIN_SECRET            → jeton API (jamais exposé côté client)
─────────────────────────────────────────────────────────────── */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [auth,  setAuth]  = useState(false);
  const [pass,  setPass]  = useState("");
  const [error, setError] = useState(false);

  /* Lire la session stockée */
  useEffect(() => {
    if (sessionStorage.getItem("djama_admin_v1") === "ok") setAuth(true);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASS ?? "";
    if (pass === expected && expected.length > 0) {
      sessionStorage.setItem("djama_admin_v1", "ok");
      setAuth(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  }

  if (!auth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#07080e] px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(167,139,250,0.12)]">
              <Lock size={22} className="text-[#a78bfa]" />
            </div>
            <h1 className="text-xl font-bold text-white">Administration DJAMA</h1>
            <p className="text-center text-xs text-white/30">Accès réservé aux administrateurs</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
              <input
                type="password"
                placeholder="Mot de passe admin"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-sm text-white placeholder-white/25 outline-none"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-center text-xs text-red-400">
                Mot de passe incorrect
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ShieldCheck size={16} /> Accéder
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
