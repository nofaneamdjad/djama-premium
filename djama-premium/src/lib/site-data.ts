export type SiteData = {
  home: {
    title: string;
    subtitle: string;
  };
  contact: {
    email: string;
    whatsapp: string;
  };
  offers: {
    abonnement: string;
    coaching: string;
    soutien: string;
  };
  media: {
    logo: string;
    heroImage: string;
    heroVideo?: string;
  };
};

export const siteData: SiteData = {
  home: {
    title: "Services digitaux & outils professionnels",
    subtitle:
      "Sites web, applications, montage vidéo, factures & devis, accompagnement administratif et coaching IA.",
  },

  contact: {
    email: "contact@djama.fr",
    whatsapp: "+262000000000",
  },

  offers: {
    abonnement: "11,99€ / mois",
    coaching: "190€ / 3 mois",
    soutien: "14€ / heure",
  },

  media: {
    logo: "/logo.png",
    heroImage: "/logo.png",
  },
};

export function getSiteData() {
  return siteData;
}