import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://djama.space";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/client/",
          "/membre/",
          "/portail/",
          "/api/",
          "/coaching-ia/espace/",
          "/definir-mot-de-passe",
          "/paiement-confirme",
          "/rendezvous",
          "/planning-presentation",
          "/planning-agenda",
          "/forgot-password",
          "/reset-password",
          "/update-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
