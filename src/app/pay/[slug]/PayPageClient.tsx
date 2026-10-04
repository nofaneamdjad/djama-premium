"use client";

import { ShieldCheck, Lock, CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";

const GOLD = "#c9a55a";

interface Props {
  state:       "active"|"expired"|"disabled"|"paid"|"no_stripe";
  title:       string;
  description: string;
  amount:      number|null;
  currency:    string;
  stripeUrl:   string|null;
  companyName: string;
  logoUrl?:    string|null;
  afterMessage?:string;
  isFreeAmount?:boolean;
}

function fmtAmount(amount: number, currency: string) {
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  });
}

export default function PayPageClient({
  state, title, description, amount, currency, stripeUrl,
  companyName, logoUrl, afterMessage, isFreeAmount,
}: Props) {

  function handlePay() {
    if (stripeUrl) window.location.href = stripeUrl;
  }

  /* ── Lien inactif ── */
  if (state !== "active") {
    const cfg = {
      expired:   { icon: Clock,         color: "#f59e0b", label: "Lien expiré",    sub: "Ce lien de paiement n'est plus actif." },
      disabled:  { icon: XCircle,       color: "#ef4444", label: "Lien désactivé", sub: "Ce lien a été désactivé par l'émetteur." },
      paid:      { icon: CheckCircle2,  color: "#10b981", label: "Déjà réglé",     sub: afterMessage || "Ce paiement a déjà été effectué." },
      no_stripe: { icon: Lock,          color: "#6b7280", label: "Paiement indisponible", sub: "La configuration de paiement n'est pas finalisée." },
    }[state];

    const Icon = cfg.icon;
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16 bg-[#f4f5f9]">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{background:`${cfg.color}15`,border:`1px solid ${cfg.color}25`}}>
              <Icon size={28} style={{color:cfg.color}}/>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{cfg.label}</h1>
            <p className="mt-2 text-gray-500">{cfg.sub}</p>
          </div>
          {title && <p className="text-sm text-gray-400">Pour : {title}</p>}
        </div>
      </div>
    );
  }

  /* ── Page de paiement active ── */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-16 bg-[#f4f5f9]">
      <div className="w-full max-w-sm">

        {/* Carte principale */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/8 ring-1 ring-black/6">

          {/* Header doré */}
          <div className="relative overflow-hidden px-8 py-8" style={{background:"linear-gradient(160deg,#07080e,#0e1420)"}}>
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl" style={{background:GOLD}}/>
            <div className="relative">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-8 w-auto mb-4 object-contain" style={{maxWidth:120}}/>
              ) : (
                <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{color:GOLD}}>{companyName}</p>
              )}
              <h1 className="text-xl font-black text-white leading-tight">{title}</h1>
              {description && <p className="mt-1.5 text-sm text-white/50 leading-relaxed">{description}</p>}
            </div>
          </div>

          {/* Montant */}
          <div className="px-8 py-7">
            {!isFreeAmount && amount !== null ? (
              <div className="mb-6 text-center">
                <p className="text-4xl font-black text-gray-900 tabular-nums">
                  {fmtAmount(amount, currency)}
                </p>
                <p className="mt-1 text-xs text-gray-400">Montant total TTC</p>
              </div>
            ) : (
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500 font-medium">Montant libre — vous saisirez le montant lors du paiement</p>
              </div>
            )}

            {/* Bouton Payer */}
            <button
              onClick={handlePay}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-black text-[#0a0a0a] transition-all hover:brightness-105 active:scale-[0.98]"
              style={{background:`linear-gradient(135deg,${GOLD},#b08d45)`}}>
              {amount ? `Payer ${fmtAmount(amount, currency)}` : "Payer maintenant"}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5"/>
            </button>

            {/* Sécurité */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock size={11}/>
              <span>Paiement sécurisé par Stripe</span>
              <ShieldCheck size={11} className="text-emerald-500"/>
            </div>

            {/* Logos cartes */}
            <div className="mt-4 flex items-center justify-center gap-3 opacity-40">
              {["Visa","Mastercard","CB"].map(c=>(
                <span key={c} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500">{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-gray-400">
          Propulsé par <span className="font-bold" style={{color:GOLD}}>DJAMA</span> · Paiement hébergé par Stripe
        </p>
      </div>
    </div>
  );
}
