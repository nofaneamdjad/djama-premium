import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import type { BusinessCard } from "@/lib/cards/types";
import PublicCardView from "./PublicCardView";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("business_cards")
    .select("name, job_title, company, bio, avatar_url")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!data) return { title: "Carte de visite — DJAMA" };

  const title = `${data.name ?? ""}${data.job_title ? ` · ${data.job_title}` : ""}`;
  return {
    title,
    description: data.bio ?? `Carte de visite numérique de ${data.name ?? ""}`,
    openGraph: {
      title,
      description: data.bio ?? undefined,
      images: data.avatar_url ? [data.avatar_url] : [],
    },
  };
}

export default async function CardPublicPage({ params }: Props) {
  const { slug } = await params;
  const admin = createSupabaseAdmin();

  const { data: card } = await admin
    .from("business_cards")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!card) notFound();
  if (card.status === "archived" || card.status === "disabled") notFound();

  return <PublicCardView card={card as BusinessCard} />;
}
