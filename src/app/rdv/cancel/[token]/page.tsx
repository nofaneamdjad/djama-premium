import { createSupabaseAdmin } from "@/lib/supabase-server";
import { notFound }            from "next/navigation";
import type { Metadata }       from "next";
import CancelUI, { type ApptData } from "./CancelUI";

export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:   "Annuler mon rendez-vous",
    robots:  { index: false, follow: false },
  };
}

export default async function CancelPage({ params }: { params: Params }) {
  const { token } = await params;
  const admin = createSupabaseAdmin();

  const { data } = await admin
    .from("rdv_appointments")
    .select(
      "client_name, start_at, end_at, status, rdv_types(name, color, duration_minutes, location_type, location_value)",
    )
    .eq("cancel_token", token)
    .single();

  if (!data) notFound();

  type RdvTypeRow = { name: string; color: string; duration_minutes: number; location_type: string; location_value: string };
  const rt = data.rdv_types as unknown as RdvTypeRow | null;

  const appt: ApptData = {
    client_name:        data.client_name,
    start_at:           data.start_at,
    end_at:             data.end_at,
    status:             data.status,
    type_name:          rt?.name           ?? "Rendez-vous",
    type_color:         rt?.color          ?? "#c9a55a",
    type_duration:      rt?.duration_minutes ?? 30,
    type_location_type: rt?.location_type  ?? "visio",
    type_location_value: rt?.location_value ?? "",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
            Gestion de votre rendez-vous
          </h1>
        </div>
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px 48px" }}>
        <CancelUI token={token} appt={appt} />
      </div>
    </div>
  );
}
