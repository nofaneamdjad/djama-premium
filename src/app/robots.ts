import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://djama.fr";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/client/",
          "/api/",
          "/definir-mot-de-passe",
          "/paiement-confirme",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
