import { Metadata } from "next";
import { notFound } from "next/navigation";
import SignatureForm from "./SignatureForm";

export const metadata: Metadata = {
  title: "Devis en ligne — DJAMA",
  robots: "noindex",
};

async function getDevis(token: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/devis/${token}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<{ doc: Record<string, unknown>; items: Record<string, unknown>[] }>;
}

export default async function DevisPublicPage({ params }: { params: { token: string } }) {
  const data = await getDevis(params.token);
  if (!data) notFound();
  const { doc, items } = data;
  return <SignatureForm doc={doc} items={items} token={params.token} />;
}
