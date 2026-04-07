export const mockClients = [
  { id: 1,  name: "Sophie Martin",   email: "sophie.martin@email.com",  phone: "+33 6 12 34 56 78", offer: "Pack Essentiel",   status: "actif",       createdAt: "2024-01-15", notes: "Site e-commerce lingerie" },
  { id: 2,  name: "Karim Benali",    email: "karim.benali@email.com",   phone: "+33 7 98 76 54 32", offer: "Coaching IA",      status: "actif",       createdAt: "2024-02-03", notes: "5 modules en cours" },
  { id: 3,  name: "Lucie Fontaine",  email: "lucie.f@gmail.com",        phone: "+33 6 55 44 33 22", offer: "Pack Pro",        status: "inactif",     createdAt: "2023-11-20", notes: "" },
  { id: 4,  name: "Thomas Girard",   email: "thomas.girard@pro.fr",     phone: "+33 6 01 23 45 67", offer: "Soutien scolaire",status: "actif",       createdAt: "2024-03-01", notes: "Lycéen, Maths + Physique" },
  { id: 5,  name: "Amira Khalil",    email: "amira.k@outlook.com",      phone: "+33 6 77 88 99 00", offer: "Pack Essentiel",  status: "en attente",  createdAt: "2024-03-08", notes: "En attente paiement" },
  { id: 6,  name: "Pierre Dubois",   email: "pierre.dubois@btp.fr",     phone: "+33 6 22 33 44 55", offer: "Site vitrine",    status: "actif",       createdAt: "2024-02-15", notes: "BTP / CLAMAC" },
  { id: 7,  name: "Nadia Osei",      email: "nadia.osei@gmail.com",     phone: "+33 7 11 22 33 44", offer: "Automatisation",  status: "actif",       createdAt: "2024-03-10", notes: "Boutique Shopify" },
  { id: 8,  name: "Julien Renard",   email: "julien.renard@startup.io", phone: "+33 6 66 55 44 33", offer: "Pack Pro",        status: "actif",       createdAt: "2024-01-28", notes: "SaaS B2B" },
];

export const mockPayments = [
  { id: "PAY-001", client: "Sophie Martin",  amount: 490,  method: "stripe",  status: "payé",      date: "2024-03-10", description: "Pack Essentiel" },
  { id: "PAY-002", client: "Karim Benali",   amount: 350,  method: "paypal",  status: "payé",      date: "2024-03-08", description: "Coaching IA — Module 1-3" },
  { id: "PAY-003", client: "Amira Khalil",   amount: 490,  method: "virement",status: "en attente",date: "2024-03-09", description: "Pack Essentiel" },
  { id: "PAY-004", client: "Nadia Osei",     amount: 290,  method: "stripe",  status: "payé",      date: "2024-03-07", description: "Automatisation — Setup" },
  { id: "PAY-005", client: "Pierre Dubois",  amount: 750,  method: "virement",status: "payé",      date: "2024-02-20", description: "Site vitrine BTP" },
  { id: "PAY-006", client: "Julien Renard",  amount: 1200, method: "stripe",  status: "payé",      date: "2024-02-01", description: "Pack Pro — Dashboard SaaS" },
  { id: "PAY-007", client: "Thomas Girard",  amount: 120,  method: "paypal",  status: "payé",      date: "2024-03-02", description: "Soutien scolaire x4h" },
  { id: "PAY-008", client: "Lucie Fontaine", amount: 490,  method: "stripe",  status: "remboursé", date: "2023-12-01", description: "Pack Pro — annulé" },
];

export const mockAccess = [
  { id: 1, name: "Sophie Martin", email: "sophie.martin@email.com", espacePremium: true,  coachingIA: false, soutienScolaire: false, outilsSaaS: true },
  { id: 2, name: "Karim Benali",  email: "karim.benali@email.com",  espacePremium: true,  coachingIA: true,  soutienScolaire: false, outilsSaaS: false },
  { id: 3, name: "Lucie Fontaine",email: "lucie.f@gmail.com",       espacePremium: false, coachingIA: false, soutienScolaire: false, outilsSaaS: false },
  { id: 4, name: "Thomas Girard", email: "thomas.girard@pro.fr",    espacePremium: true,  coachingIA: false, soutienScolaire: true,  outilsSaaS: false },
  { id: 5, name: "Amira Khalil",  email: "amira.k@outlook.com",     espacePremium: false, coachingIA: false, soutienScolaire: false, outilsSaaS: false },
  { id: 6, name: "Pierre Dubois", email: "pierre.dubois@btp.fr",    espacePremium: true,  coachingIA: false, soutienScolaire: false, outilsSaaS: true },
  { id: 7, name: "Nadia Osei",    email: "nadia.osei@gmail.com",    espacePremium: true,  coachingIA: false, soutienScolaire: false, outilsSaaS: true },
  { id: 8, name: "Julien Renard", email: "julien.renard@startup.io",espacePremium: true,  coachingIA: true,  soutienScolaire: false, outilsSaaS: true },
];

export const mockDevis = [
  { id: "DEV-001", name: "Marc Lefevre",     email: "marc.l@email.com",   subject: "Création de site web",     budget: "500_2000",   status: "nouveau",     date: "2024-03-12", message: "Je cherche un site vitrine pour mon cabinet de conseil." },
  { id: "DEV-002", name: "Inès Dupont",      email: "ines.d@gmail.com",   subject: "Coaching IA",               budget: "under500",   status: "en cours",    date: "2024-03-11", message: "Je veux apprendre à utiliser ChatGPT pour mon business." },
  { id: "DEV-003", name: "Romain Marchal",   email: "romain.m@pro.fr",    subject: "Application mobile",        budget: "2000_10000", status: "converti",    date: "2024-03-05", message: "Application de gestion de stocks pour PME." },
  { id: "DEV-004", name: "Yasmine Toure",    email: "yasmine.t@email.com",subject: "Design & identité visuelle",budget: "under500",   status: "nouveau",     date: "2024-03-13", message: "Logo + charte graphique pour ma marque." },
  { id: "DEV-005", name: "Hugo Bernard",     email: "hugo.b@startup.co",  subject: "Automatisation",            budget: "500_2000",   status: "en cours",    date: "2024-03-10", message: "Automatiser ma prospection LinkedIn + emails." },
  { id: "DEV-006", name: "Céleste Morin",    email: "celeste.m@email.com",subject: "Soutien scolaire",          budget: "under500",   status: "converti",    date: "2024-03-01", message: "Cours particuliers pour ma fille en terminale." },
];

export const mockReservations = [
  { id: "RES-001", name: "Marc Lefevre",   email: "marc.l@email.com",    type: "Appel découverte", date: "2024-03-15", time: "14:00", status: "confirmé" },
  { id: "RES-002", name: "Inès Dupont",    email: "ines.d@gmail.com",    type: "Coaching IA",      date: "2024-03-16", time: "10:00", status: "confirmé" },
  { id: "RES-003", name: "Karim Benali",   email: "karim.b@email.com",   type: "Coaching IA",      date: "2024-03-14", time: "16:00", status: "terminé" },
  { id: "RES-004", name: "Thomas Girard",  email: "thomas.g@pro.fr",     type: "Soutien scolaire", date: "2024-03-18", time: "18:00", status: "confirmé" },
  { id: "RES-005", name: "Hugo Bernard",   email: "hugo.b@startup.co",   type: "Appel découverte", date: "2024-03-13", time: "11:00", status: "annulé" },
  { id: "RES-006", name: "Yasmine Toure",  email: "yasmine.t@email.com", type: "Appel découverte", date: "2024-03-20", time: "15:30", status: "en attente" },
];

export const mockServices = [
  { id: 1, title: "Création de site vitrine", category: "Digital", price: "À partir de 490€", active: true },
  { id: 2, title: "Site e-commerce",           category: "Digital", price: "À partir de 890€", active: true },
  { id: 3, title: "Application mobile",        category: "Digital", price: "Sur devis",         active: true },
  { id: 4, title: "Coaching IA",               category: "Coaching",price: "À partir de 290€", active: true },
  { id: 5, title: "Soutien scolaire",          category: "Coaching",price: "À partir de 14€/h",active: true },
  { id: 6, title: "Factures & Devis PDF",      category: "Outils",  price: "Inclus Pro",        active: true },
  { id: 7, title: "Automatisation business",   category: "Digital", price: "Sur devis",         active: false },
  { id: 8, title: "Design & identité visuelle",category: "Digital", price: "À partir de 190€", active: true },
];

export const mockRealisations = [
  { id: 1, name: "MONDOUKA",  category: "E-commerce & Sourcing",  tag: "E-commerce",  status: "publié",  year: 2023 },
  { id: 2, name: "CLAMAC",    category: "Site vitrine & SEO",      tag: "Web",         status: "publié",  year: 2023 },
  { id: 3, name: "WEWE",      category: "Web App SaaS",            tag: "Application", status: "publié",  year: 2024 },
  { id: 4, name: "BELLAVIA",  category: "E-commerce mode",         tag: "E-commerce",  status: "brouillon",year: 2024 },
  { id: 5, name: "FLEXO",     category: "Plateforme B2B",          tag: "Application", status: "publié",  year: 2024 },
];
