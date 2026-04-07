export interface Translations {
  nav: {
    home: string;
    services: string;
    projects: string;
    contact: string;
    clientArea: string;
    freeQuote: string;
    language: string;
  };

  home: {
    hero: {
      badge: string;
      titleLines: string[];
      subtitle: string;
      cta1: string;
      cta2: string;
      socialProof: string;
    };
    stats: Array<{
      value: string;
      label: string;
      sub: string;
    }>;
    presentation: {
      badge: string;
      titleLines: string[];
      text1: string;
      text2: string;
      cta1: string;
      cta2: string;
      values: Array<{
        title: string;
        desc: string;
      }>;
    };
    assistant: {
      badge: string;
      titleLines: string[];
      subtitle: string;
      questions: string[];
      cta: string;
    };
    tools: {
      badge: string;
      titleLines: string[];
      subtitle: string;
      cta: string;
      items: Array<{
        label: string;
        sub: string;
      }>;
    };
    approach: {
      badge: string;
      titleLines: string[];
      steps: Array<{
        title: string;
        desc: string;
      }>;
    };
    servicesSection: {
      badge: string;
      titleLines: string[];
      subtitle: string;
      cta: string;
      items: Array<{ title: string; desc: string }>;
    };
    realisationsSection: {
      badge: string;
      titleLines: string[];
      subtitle: string;
      cta: string;
      projects: Array<{ name: string; category: string; desc: string; tag: string }>;
    };
    cta: {
      label: string;
      titleLines: string[];
      subtitle: string;
      cta1: string;
      cta2: string;
    };
  };

  overview: {
    title: string;
    cols: Array<{
      title: string;
      badge: string;
      items: Array<{
        label: string;
        badge: string | null;
      }>;
    }>;
  };

  services: {
    hero: {
      badge: string;
      titleLines: string[];
      subtitle: string;
    };
    filters: {
      all: string;
      Digital: string;
      "Création de contenu": string;
      "Documents & Outils": string;
      Accompagnement: string;
      Coaching: string;
    };
    whyUs: {
      badge: string;
      title: string;
      items: Array<{
        title: string;
        desc: string;
      }>;
    };
    comparison: {
      badge: string;
      title: string;
      text: string;
      features: string[];
    };
    cta: {
      title: string;
      subtitle: string;
      btn1: string;
      btn2: string;
    };
  };

  contact: {
    hero: {
      badge: string;
      titleLines: string[];
      subtitle: string;
      badges: Array<{
        text: string;
        color: string;
        rgb: string;
      }>;
    };
    form: {
      title: string;
      subtitle: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      subjectPlaceholder: string;
      budgetPlaceholder: string;
      messagePlaceholder: string;
      submit: string;
      sending: string;
      successTitle: string;
      successText: string;
      successBadge: string;
      newMessage: string;
      disclaimer: string;
      subjects: string[];
      budgets: Array<{
        value: string;
        label: string;
      }>;
    };
    contactBlock: {
      title: string;
      subtitle: string;
      emailLabel: string;
      whatsappLabel: string;
      phoneLabel: string;
      delayLabel: string;
      delayValue: string;
      bookBtn: string;
    };
    process: {
      badge: string;
      title: string;
      subtitle: string;
      steps: Array<{
        step: string;
        title: string;
        desc: string;
      }>;
    };
    trust: {
      badge: string;
      title: string;
      items: Array<{
        title: string;
        desc: string;
      }>;
    };
    finalCta: {
      label: string;
      title: string;
      btn1: string;
      btn2: string;
    };
  };

  footer: {
    tagline: string;
    services: {
      title: string;
      links: Array<{
        label: string;
      }>;
    };
    account: {
      title: string;
      links: Array<{
        label: string;
      }>;
    };
    social: {
      title: string;
    };
    language: {
      title: string;
    };
    copyright: string;
  };
}
