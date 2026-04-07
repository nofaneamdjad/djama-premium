"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState(false);
  const [loading,  setLoading]  = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === "djama2024") {
        localStorage.setItem("djama_admin", "ok");
        router.replace("/admin");
      } else {
        setError(true);
        setLoading(false);
        setTimeout(() => setError(false), 2500);
      }
    }, 600);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.04)] blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[1.6rem] font-black tracking-tight text-white">DJAMA</p>
          <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#c9a55a]">Espace Admin</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f0f12] p-7 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(201,165,90,0.12)] border border-[rgba(201,165,90,0.15)]">
              <Lock size={19} className="text-[#c9a55a]" />
            </div>
          </div>
          <h1 className="mb-1 text-center text-[1rem] font-bold text-white">Connexion administrateur</h1>
          <p className="mb-7 text-center text-[0.77rem] text-white/30">Accès réservé aux administrateurs DJAMA</p>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                placeholder="Mot de passe"
                autoFocus
                className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3 pr-11 text-[0.85rem] text-white placeholder-white/18 outline-none transition-colors focus:border-[rgba(201,165,90,0.40)] ${
                  error ? "border-[rgba(248,113,113,0.50)]" : "border-white/[0.07]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/22 hover:text-white/50 transition-colors"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <p className="text-center text-[0.77rem] text-[#f87171]">Mot de passe incorrect.</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-xl bg-[#c9a55a] py-3 text-[0.88rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Connexion…" : "Accéder à l'administration"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
