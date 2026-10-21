import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  key:         z.string().min(2).regex(/^[a-z0-9_]+$/),
  label:       z.string().min(1).max(80),
  description: z.string().max(200).optional(),
  enabled:     z.boolean().default(false),
  scope:       z.enum(["global","beta","premium","dev","internal"]).default("global"),
});

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("hq_feature_flags")
    .select("*")
    .order("scope")
    .order("key");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flags: data ?? [] });
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("hq_feature_flags")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Cette clé existe déjà." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ flag: data }, { status: 201 });
}
