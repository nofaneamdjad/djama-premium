// Vérification DNS TXT d'un domaine custom
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import dns from "dns/promises";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type Params = { params: Promise<{ id: string; domainId: string }> };

// POST /api/websites/[id]/domains/[domainId]/verify
export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, domainId } = await params;
  const admin = createSupabaseAdmin();

  // Vérifier ownership
  const { data: site } = await admin.from("websites").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const { data: domainRow } = await admin
    .from("website_domains")
    .select("*")
    .eq("id", domainId)
    .eq("website_id", id)
    .eq("user_id", user.id)
    .single();

  if (!domainRow) return NextResponse.json({ error: "Domaine introuvable" }, { status: 404 });
  if (domainRow.verified) return NextResponse.json({ verified: true, message: "Domaine déjà vérifié" });

  const expectedToken = domainRow.verify_token as string;
  const domain        = domainRow.domain as string;

  // Résoudre les enregistrements TXT
  let verified = false;
  let dnsError: string | null = null;

  try {
    const records = await dns.resolveTxt(domain);
    // records est un tableau de tableaux (chaque TXT peut être en plusieurs morceaux)
    for (const record of records) {
      const full = record.join("");
      if (full === expectedToken) { verified = true; break; }
    }
  } catch (err) {
    dnsError = (err as NodeJS.ErrnoException).code ?? "ENOTFOUND";
  }

  // Mettre à jour en base
  await admin
    .from("website_domains")
    .update({
      verified,
      last_check: new Date().toISOString(),
      ...(verified ? { ssl_status: "active" } : {}),
    })
    .eq("id", domainId);

  if (verified) {
    return NextResponse.json({ verified: true, message: "Domaine vérifié avec succès !" });
  }

  return NextResponse.json({
    verified: false,
    dnsError,
    message: dnsError
      ? `Impossible de résoudre ${domain} (${dnsError}). Vérifiez que le domaine pointe bien vers DJAMA.`
      : `Enregistrement TXT non trouvé. Ajoutez un enregistrement TXT avec la valeur ci-dessous.`,
    expected: expectedToken,
  }, { status: 422 });
}
