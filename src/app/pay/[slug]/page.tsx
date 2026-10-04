import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import PayPageClient from "./PayPageClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabaseAdmin
    .from("payment_links")
    .select("title,amount,currency")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return { title: "Paiement" };
  const amt = data.amount ? `${(data.amount as number).toLocaleString("fr-FR",{minimumFractionDigits:2})} ${(data.currency as string).toUpperCase()}` : "";
  return {
    title: `Payer — ${data.title as string}${amt?` · ${amt}`:""}`,
    description: `Paiement sécurisé ${amt}`,
  };
}

export default async function PayPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: link } = await supabaseAdmin
    .from("payment_links")
    .select("id,title,description,amount,currency,status,expires_at,stripe_payment_link_url,after_payment_message,user_id,is_free_amount")
    .eq("slug", slug)
    .maybeSingle();

  if (!link) notFound();

  // Lien expiré
  if (link.expires_at && new Date(link.expires_at as string) < new Date()) {
    return (
      <PayPageClient
        state="expired"
        title={link.title as string}
        description={link.description as string}
        amount={null}
        currency={link.currency as string}
        stripeUrl={null}
        companyName=""
        afterMessage=""
      />
    );
  }

  // Lien désactivé / archivé
  if ((link.status as string) === "disabled" || (link.status as string) === "archived") {
    return (
      <PayPageClient
        state="disabled"
        title={link.title as string}
        description={link.description as string}
        amount={null}
        currency={link.currency as string}
        stripeUrl={null}
        companyName=""
        afterMessage=""
      />
    );
  }

  // Lien déjà payé (paiement unique)
  if ((link.status as string) === "paid") {
    return (
      <PayPageClient
        state="paid"
        title={link.title as string}
        description={link.description as string}
        amount={link.amount as number | null}
        currency={link.currency as string}
        stripeUrl={null}
        companyName=""
        afterMessage={link.after_payment_message as string ?? ""}
      />
    );
  }

  // Récupérer le nom de l'entreprise
  let companyName = "DJAMA";
  let logoUrl: string | null = null;
  try {
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("company_name,logo_url")
      .eq("user_id", link.user_id as string)
      .maybeSingle();
    if (settings?.company_name) companyName = settings.company_name as string;
    if (settings?.logo_url)    logoUrl      = settings.logo_url as string;
  } catch { /* non bloquant */ }

  // Si pas encore de lien Stripe, on redirige vers une session checkout fraîche
  if (!link.stripe_payment_link_url && !link.is_free_amount) {
    // Pas de Stripe configuré — afficher le lien non-opérationnel
    return (
      <PayPageClient
        state="no_stripe"
        title={link.title as string}
        description={link.description as string}
        amount={link.amount as number | null}
        currency={link.currency as string}
        stripeUrl={null}
        companyName={companyName}
        logoUrl={logoUrl}
        afterMessage=""
      />
    );
  }

  return (
    <PayPageClient
      state="active"
      title={link.title as string}
      description={link.description as string}
      amount={link.amount as number | null}
      currency={link.currency as string}
      stripeUrl={link.stripe_payment_link_url as string | null}
      companyName={companyName}
      logoUrl={logoUrl}
      afterMessage={link.after_payment_message as string ?? ""}
      isFreeAmount={link.is_free_amount as boolean}
    />
  );
}
