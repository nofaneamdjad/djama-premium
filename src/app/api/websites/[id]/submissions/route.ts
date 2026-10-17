// Soumissions de formulaires Website Builder
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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

type Params = { params: Promise<{ id: string }> };

// GET /api/websites/[id]/submissions — liste des soumissions (JSON ou CSV)
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Vérifier que le site appartient à l'utilisateur
  const { data: site } = await admin.from("websites").select("id, name").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const url    = new URL(req.url);
  const format = url.searchParams.get("format");
  const formId = url.searchParams.get("form_id");
  const page   = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const perPage = Math.min(100, Math.max(10, Number(url.searchParams.get("per_page") ?? "50")));
  const offset = (page - 1) * perPage;

  let query = admin
    .from("website_contact_submissions")
    .select("*", { count: "exact" })
    .eq("website_id", id)
    .order("created_at", { ascending: false });

  if (formId) {
    query = query.contains("data", { __formId: formId });
  }

  if (format === "csv") {
    // Exporter tout sans pagination
    const { data: rows } = await query.limit(10000);
    if (!rows?.length) {
      return new NextResponse("Aucune soumission\n", {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="submissions_${id}.csv"`,
        },
      });
    }

    // Collecter toutes les clés uniques (hors internes)
    const skip = new Set(["__formId", "website"]);
    const keys = Array.from(
      rows.reduce<Set<string>>((acc, r) => {
        Object.keys(r.data ?? {}).forEach(k => { if (!skip.has(k)) acc.add(k); });
        return acc;
      }, new Set())
    );

    const csvEsc = (v: unknown): string => {
      const s = String(v ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const header  = ["Date", "Page", ...keys].map(csvEsc).join(",");
    const dataRows = rows.map(r => {
      const date = new Date(r.created_at as string).toLocaleString("fr-FR");
      const pageSlug = String(r.page_slug ?? "");
      const vals = keys.map(k => csvEsc((r.data as Record<string, unknown>)?.[k]));
      return [csvEsc(date), csvEsc(pageSlug), ...vals].join(",");
    });

    const csv = [header, ...dataRows].join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="submissions_${id}.csv"`,
      },
    });
  }

  // Réponse JSON paginée
  const { data: submissions, count } = await query.range(offset, offset + perPage - 1);

  return NextResponse.json({
    submissions: submissions ?? [],
    total:    count ?? 0,
    page,
    per_page: perPage,
    pages:    Math.ceil((count ?? 0) / perPage),
    site_name: site.name,
  });
}

// DELETE /api/websites/[id]/submissions?submission_id=xxx — supprimer une soumission
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: site } = await admin.from("websites").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const url = new URL(req.url);
  const submissionId = url.searchParams.get("submission_id");
  if (!submissionId) return NextResponse.json({ error: "submission_id requis" }, { status: 400 });

  await admin.from("website_contact_submissions").delete().eq("id", submissionId).eq("website_id", id);

  return NextResponse.json({ ok: true });
}
