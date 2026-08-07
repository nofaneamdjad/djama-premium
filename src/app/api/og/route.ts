import { NextRequest } from "next/server";

export const runtime = "nodejs";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const t = esc((searchParams.get("t") || "Mon Entreprise").slice(0, 38));
  const s = esc((searchParams.get("s") || "Entreprise locale").slice(0, 40));
  const rawColor = (searchParams.get("c") || "7c3aed").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  const c = `#${rawColor || "7c3aed"}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#080c14"/>
  <circle cx="1050" cy="120" r="460" fill="${c}" opacity=".1"/>
  <circle cx="200" cy="550" r="300" fill="${c}" opacity=".06"/>
  <rect x="80" y="270" width="7" height="90" fill="${c}" rx="3"/>
  <text x="108" y="334" font-family="system-ui,Arial,sans-serif" font-size="52" font-weight="800" fill="white">${t}</text>
  <text x="108" y="390" font-family="system-ui,Arial,sans-serif" font-size="24" fill="rgba(255,255,255,0.45)">${s}</text>
  <text x="80" y="580" font-family="system-ui,Arial,sans-serif" font-size="18" fill="rgba(255,255,255,0.22)">djama.pro</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
