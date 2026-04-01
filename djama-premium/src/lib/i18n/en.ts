import type { Translations } from "./types";

export const en: Translations = {
  nav: {
    home: "Home",
    services: "Services",
    projects: "Projects",
    contact: "Contact",
    clientArea: "Client Area",
    freeQuote: "Free Quote",
    language: "Language",
  },

  home: {
    hero: {
      badge: "Digital creation & professional tools",
      titleLines: ["Your digital", "presence,", "simplified."],
      subtitle:
        "From website design to business management, DJAMA supports you with modern, effective and accessible digital solutions.",
      cta1: "Start a project",
      cta2: "Our services",
      socialProof: "+50 clients trust DJAMA",
    },
    stats: [
      { value: "50+",  label: "Clients supported",       sub: "since 2022" },
      { value: "2022", label: "Projects delivered since", sub: "websites, apps, tools, design" },
      { value: "100%", label: "Tailored solutions",       sub: "crafted for every need" },
      { value: "∞",    label: "Support & guidance",       sub: "human, available" },
    ],
    presentation: {
      badge: "About DJAMA",
      titleLines: ["A modern vision", "of digital."],
      text1: "DJAMA is a platform combining digital creation, professional tools and expert guidance.",
      text2:
        "Our mission is to help entrepreneurs, businesses and individuals grow their digital presence with simple, modern and effective solutions.",
      cta1: "Our services",
      cta2: "Get in touch",
      values: [
        { title: "Reliability",  desc: "Deadlines respected, polished deliverables, transparent communication." },
        { title: "Speed",        desc: "AI-powered workflows to deliver fast, without compromising quality." },
        { title: "Performance",  desc: "Every solution is built to generate real, measurable results." },
        { title: "Guidance",     desc: "Human follow-up, personalised and adapted to your reality." },
      ],
    },
    assistant: {
      badge: "Artificial intelligence",
      titleLines: ["A question?", "DJAMA's assistant", "has the answer."],
      subtitle:
        "Ask anything about our services, tools or your project. Our intelligent assistant guides you instantly, around the clock.",
      questions: [
        "What services do you offer?",
        "How do I start a business?",
        "Do you offer AI coaching?",
        "How does the client area work?",
      ],
      cta: "Chat with the assistant",
    },
    tools: {
      badge: "Client area",
      titleLines: ["Tools to simplify", "your daily", "workflow."],
      subtitle: "Document management, scheduling, automation and a secure client space.",
      cta: "Discover the tools",
      items: [
        { label: "Invoices & Quotes",     sub: "Professional documents in seconds. PDF, VAT, logo, bank details." },
        { label: "Scheduling & Calendar", sub: "Organise your agenda in Day, Week or Month view." },
        { label: "Professional notepad",  sub: "Notes by category, PDF export, automatic backup." },
      ],
    },
    approach: {
      badge: "Our method",
      titleLines: ["A simple and", "effective approach."],
      steps: [
        {
          title: "Understand your needs",
          desc: "We take the time to listen to your project, constraints and goals. No generic solution — a precise analysis of your situation.",
        },
        {
          title: "Build a tailored solution",
          desc: "Website, application, tool or digital strategy — every deliverable is crafted specifically to meet exactly what you need.",
        },
        {
          title: "Support you over time",
          desc: "The relationship doesn't end at delivery. Follow-up, training, improvements — we stay available so your project keeps growing.",
        },
      ],
    },
    servicesSection: {
      badge: "What we do",
      titleLines: ["All your digital", "needs, covered."],
      subtitle:
        "From website to coaching, via professional tools — one team to handle everything.",
      cta: "View all services",
      items: [
        { title: "Digital Creation",      desc: "Websites, applications, e-commerce and custom design." },
        { title: "Professional Tools",    desc: "Invoices, scheduling, notes and a secure client area." },
        { title: "Business Support",      desc: "Admin, URSSAF, suppliers, public and private tenders." },
        { title: "Coaching",              desc: "AI coaching, academic tutoring and digital onboarding." },
      ],
    },
    realisationsSection: {
      badge: "Our work",
      titleLines: ["Projects that", "speak for themselves."],
      subtitle:
        "A few concrete examples of what we build for our clients, all around the world.",
      cta: "View all projects",
      projects: [
        {
          name: "MONDOUKA",
          category: "E-commerce & Sourcing",
          desc: "E-commerce platform with supplier sourcing, product catalogue and international payment integration.",
          tag: "E-commerce",
        },
        {
          name: "CLAMAC",
          category: "Website & SEO",
          desc: "Professional website for a construction company, SEO-optimised with an integrated quote request form.",
          tag: "Web",
        },
        {
          name: "WEWE",
          category: "Web App SaaS",
          desc: "Custom web application with user area, dashboard and advanced data management.",
          tag: "Application",
        },
      ],
    },
    cta: {
      label: "Ready to start?",
      titleLines: ["Your project", "deserves better."],
      subtitle:
        "Get in touch today — we'll reply within 24h with a clear proposal tailored to your needs.",
      cta1: "Request a quote",
      cta2: "Contact us",
    },
  },

  overview: {
    title: "DJAMA at a glance",
    cols: [
      {
        title: "Digital Creation",
        badge: "Custom",
        items: [
          { label: "Websites & applications",  badge: null },
          { label: "Design & visual identity", badge: null },
          { label: "E-commerce",               badge: null },
        ],
      },
      {
        title: "Professional Tools",
        badge: "Pro",
        items: [
          { label: "Invoices & PDF quotes",   badge: null },
          { label: "Scheduling & calendar",   badge: null },
          { label: "Professional notepad",    badge: null },
          { label: "Secure client area",      badge: "Available" },
        ],
      },
      {
        title: "Business Support",
        badge: "Personalised",
        items: [
          { label: "Sole trader registration",    badge: null },
          { label: "URSSAF declarations",         badge: null },
          { label: "Business admin assistance",   badge: null },
          { label: "International supplier sourcing", badge: null },
          { label: "Public & private tenders",    badge: null },
        ],
      },
      {
        title: "Coaching",
        badge: "Individual",
        items: [
          { label: "AI coaching",           badge: null },
          { label: "Academic tutoring",     badge: null },
          { label: "Digital onboarding",    badge: null },
          { label: "Digital organisation",  badge: null },
        ],
      },
    ],
  },

  services: {
    hero: {
      badge: "What we do",
      titleLines: ["Our services,", "your growth."],
      subtitle:
        "From websites to administrative support, via professional tools — everything you need to move forward.",
    },
    filters: {
      all: "All",
      Digital: "Digital",
      "Création de contenu": "Content",
      "Documents & Outils": "Tools",
      Accompagnement: "Support",
      Coaching: "Coaching",
    },
    whyUs: {
      badge: "Our strengths",
      title: "Why choose DJAMA.",
      items: [
        {
          title: "Fast execution",
          desc: "AI-augmented process: we deliver faster than traditional agencies, without sacrificing quality.",
        },
        {
          title: "Premium image",
          desc: "Every service is results-driven. Not beautiful for the sake of it — beautiful and high-performing.",
        },
        {
          title: "Human support",
          desc: "A real team, not a support ticket. You have a genuine relationship with the people working for you.",
        },
        {
          title: "Concrete tools",
          desc: "Invoices, scheduling, notes — you leave with operational tools, not just a delivered project.",
        },
        {
          title: "Business & design vision",
          desc: "We understand both business challenges and visual standards to build truly effective solutions.",
        },
        {
          title: "Tailor-made solutions",
          desc: "Nothing generic. Every project is analysed, designed and built for your specific reality.",
        },
      ],
    },
    comparison: {
      badge: "Comparison",
      title: "DJAMA vs traditional agencies",
      text: "What actually sets us apart.",
      features: [
        "Short delivery timelines",
        "Transparent pricing",
        "Human support",
        "Professional tools included",
        "Business & design vision",
      ],
    },
    cta: {
      title: "Ready to start?",
      subtitle: "Send your request now — we'll respond within 24h with a tailored proposal.",
      btn1: "Start a project",
      btn2: "Explore services",
    },
  },

  contact: {
    hero: {
      badge: "Let's discuss your project",
      titleLines: ["Let's talk about", "your project."],
      subtitle:
        "An idea, a need, a question? Tell us about your project — we'll get back to you quickly with a clear and tailored solution.",
      badges: [
        { text: "Reply within 24h",      color: "#c9a55a", rgb: "201,165,90"  },
        { text: "Tailored support",       color: "#60a5fa", rgb: "96,165,250" },
        { text: "WhatsApp available",     color: "#25d366", rgb: "37,211,102" },
      ],
    },
    form: {
      title: "Send us a message",
      subtitle: "Contact form",
      namePlaceholder: "John Smith",
      emailPlaceholder: "you@example.com",
      subjectPlaceholder: "Select a topic…",
      budgetPlaceholder: "Your approximate budget…",
      messagePlaceholder: "Describe your project, needs and constraints…",
      submit: "Send message",
      sending: "Sending…",
      successTitle: "Message sent! 🎉",
      successText: "Thank you for your message. We'll get back to you within 24 hours — check your inbox.",
      successBadge: "Reply expected within 24h",
      newMessage: "Send another message →",
      disclaimer: "Payment accepted after agreement: PayPal or bank transfer · No commitment",
      subjects: [
        "Website creation",
        "Mobile application",
        "Design & visual identity",
        "Administrative assistance",
        "Supplier sourcing",
        "Public & private tenders",
        "AI coaching",
        "Academic tutoring",
        "Professional tools",
        "Other request",
      ],
      budgets: [
        { value: "under500",   label: "Under €500"     },
        { value: "500_2000",   label: "€500 – €2,000"  },
        { value: "2000_10000", label: "€2,000 – €10,000" },
        { value: "over10000",  label: "Over €10,000"   },
        { value: "unknown",    label: "Not sure yet"   },
      ],
    },
    contactBlock: {
      title: "We're here for you",
      subtitle: "Choose the channel that suits you best.",
      emailLabel: "Email",
      whatsappLabel: "WhatsApp",
      phoneLabel: "Phone",
      delayLabel: "Response time",
      delayValue: "Within 24 hours",
      bookBtn: "Book a discovery call",
    },
    process: {
      badge: "Simple process",
      title: "How it works.",
      subtitle: "From your request to launch, a clear 4-step process.",
      steps: [
        {
          step: "01",
          title: "Your request",
          desc: "Fill in the form or write to us directly. Describe your project in a few lines.",
        },
        {
          step: "02",
          title: "Analysis",
          desc: "We study your needs, define the best approach and prepare our response.",
        },
        {
          step: "03",
          title: "Proposal",
          desc: "You receive a clear proposal: solution, timeline, price. No surprises — full transparency.",
        },
        {
          step: "04",
          title: "Launch",
          desc: "Once approved, we get started. You're kept informed at every step through to delivery.",
        },
      ],
    },
    trust: {
      badge: "Our commitments",
      title: "Why work with DJAMA.",
      items: [
        {
          title: "Modern approach",
          desc: "AI-augmented, optimised processes, cutting-edge tools. We work with the best available technologies.",
        },
        {
          title: "Human support",
          desc: "No anonymous support ticket. You have a genuine, direct relationship with the team working for you.",
        },
        {
          title: "Clear solutions",
          desc: "Every proposal is simple, readable and jargon-free. You know exactly what you're paying for and what you'll receive.",
        },
        {
          title: "Fast execution",
          desc: "Thanks to our optimised workflows, we deliver faster than traditional agencies without sacrificing quality.",
        },
        {
          title: "Premium quality",
          desc: "Every deliverable is crafted with attention to detail. The image you project deserves the very best.",
        },
        {
          title: "Complete reliability",
          desc: "Deadlines respected, transparent communication, rigorous follow-up. You can count on us at every step.",
        },
      ],
    },
    finalCta: {
      label: "Free quote",
      title: "Ready to start?",
      btn1: "Send my request",
      btn2: "WhatsApp",
    },
  },

  footer: {
    tagline:
      "Digital creation, professional tools and expert guidance for entrepreneurs, individuals and businesses.",
    services: {
      title: "Services",
      links: [
        { label: "All services"  },
        { label: "Projects"      },
        { label: "Pro tools"     },
        { label: "AI Coaching"   },
        { label: "Tutoring"      },
      ],
    },
    account: {
      title: "My account",
      links: [
        { label: "Client area" },
        { label: "Sign in"     },
        { label: "Sign up"     },
        { label: "Contact"     },
      ],
    },
    social: {
      title: "Follow DJAMA",
    },
    language: {
      title: "Language",
    },
    copyright: "All rights reserved",
  },
};
