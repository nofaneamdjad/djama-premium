"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────────
   Bouton d'abonnement PayPal
   - Récupère l'ID et l'email de l'utilisateur connecté (si dispo)
   - Appelle /api/paypal/create-subscription
   - Redirige vers la page d'approbation PayPal
   - PayPal redirige ensuite vers /api/paypal/capture → /paiement-confirme
─────────────────────────────────────────────────────────────── */

const PAYPAL_ICON = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"
      fill="#003087"
    />
  </svg>
);

interface PayPalButtonProps {
  label?:     string;
  className?: string;
}

export default function PayPalButton({
  label     = "Payer avec PayPal — 11,90€ / mois",
  className = "",
}: PayPalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      /* Récupérer l'utilisateur connecté (optionnel) */
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch("/api/paypal/create-subscription", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:    user?.id    ?? null,
          userEmail: user?.email ?? null,
        }),
      });

      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok) throw new Error(data.error ?? "Erreur PayPal");
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
        className={`flex w-full items-center justify-center gap-2.5 rounded-[1rem] border border-[rgba(255,196,57,0.32)] bg-[#FFD140] py-3.5 text-sm font-bold text-[#09090b] transition-all duration-300 hover:brightness-105 hover:shadow-[0_0_24px_rgba(255,209,64,0.28)] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin text-[#09090b]" />
            Redirection vers PayPal…
          </>
        ) : (
          <>
            {PAYPAL_ICON}
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
