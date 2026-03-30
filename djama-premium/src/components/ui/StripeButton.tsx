"use client";

import { useState } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────────
   Bouton d'abonnement Stripe
   - Récupère l'ID et l'email de l'utilisateur connecté (si dispo)
   - Les envoie à /api/checkout pour lier le paiement au compte
   - Redirige vers Stripe Checkout
───────────────────────────────────────────────────────────── */

interface StripeButtonProps {
  label?: string;
  className?: string;
}

export default function StripeButton({
  label = "S'abonner pour 11,90€",
  className = "",
}: StripeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      /* Récupérer l'utilisateur connecté (optionnel) */
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:    user?.id    ?? null,
          userEmail: user?.email ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur de paiement");
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            Redirection en cours…
          </>
        ) : (
          <>
            <Wallet size={17} />
            {label}
          </>
        )}
      </button>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
