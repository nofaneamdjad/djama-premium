import { NextResponse } from "next/server";
import { VOICES } from "@/lib/humain-ia/voices";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ voices: VOICES });
}
