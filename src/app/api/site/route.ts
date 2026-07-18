import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "site.json");

export async function GET() {
  const data = fs.readFileSync(filePath, "utf8");
  return NextResponse.json(JSON.parse(data));
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
  return NextResponse.json({ success: true });
}