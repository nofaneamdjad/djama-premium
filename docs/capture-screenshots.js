const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const OUT = path.join(__dirname, "screenshots");

// Cookie Supabase récupéré depuis le navigateur de preview
const AUTH_COOKIE_VALUE = "base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWpSak5EWTVaR1EwTFdRNVlUTXRORE5sWlMwNE9HUTFMVEV3TURSa05HUmxaalExTVNJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMMk5xYkd0cllXdDVibTEwZG14NVozRmpkV2RyTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJMk0yWmtOemt6WXkxaFl6RTBMVFEzTVdVdE9XVTFaaTB4WldWbU5UazVaR1ZsTkRJaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemd6TURBeU1UYzRMQ0pwWVhRaU9qRTNPREk1T1RnMU56Z3NJbVZ0WVdsc0lqb2libTltWVc1bExuTnZkV1pwWlVCbmJXRnBiQzVqYjIwaUxDSndhRzl1WlNJNklpSXNJbUZ3Y0Y5dFpYUmhaR0YwWVNJNmV5SndjbTkyYVdSbGNpSTZJbVZ0WVdsc0lpd2ljSEp2ZG1sa1pYSnpJanBiSW1WdFlXbHNJbDE5TENKMWMyVnlYMjFsZEdGa1lYUmhJanA3SW1WdFlXbHNYM1psY21sbWFXVmtJanAwY25WbExDSnVZVzFsSWpvaVRtOW1ZVzVsSUVGTlJFcEJSQ0lzSW01bFpXUnpYM0JoYzNOM2IzSmtYM0psYzJWMElqcG1ZV3h6Wlgwc0luSnZiR1VpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWVdGc0lqb2lZV0ZzTVNJc0ltRnRjaUk2VzNzaWJXVjBhRzlrSWpvaWNHRnpjM2R2Y21RaUxDSjBhVzFsYzNSaGJYQWlPakUzT0RJNU5qYzBNakI5WFN3aWMyVnpjMmx2Ymw5cFpDSTZJalJrWW1SbFpqWmxMVGxrT0RVdE5HRXlPQzFoTnpRMExXSTBNamd5TkRNell6aGlNeUlzSW1selgyRnViMjU1Ylc5MWN5STZabUZzYzJWOS56Vk8taktJX19meWFyQ2RvWUQ1Z1ZJUjNkcTBBbkc3Zm9yNEd1cE05TG1pTHFPTEJlY183NFlQUzhxWXpXUHdRRXFTQVdoSHVEM0h5RmduY1pubkJldyIsInRva2VuX3R5cGUiOiJiZWFyZXIiLCJleHBpcmVzX2luIjozNjAwLCJleHBpcmVzX2F0IjoxNzgzMDAyMTc4LCJyZWZyZXNoX3Rva2VuIjoibWZnaWpycTNyamtuIiwidXNlciI6eyJpZCI6IjYzZmQ3OTNjLWFjMTQtNDcxZS05ZTVmLTFlZWY1OTlkZWU0MiIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoibm9mYW5lLnNvdWZpZUBnbWFpbC5jb20iLCJlbWFpbF9jb25maXJtZWRfYXQiOiIyMDI2LTA0LTE5VDE2OjA3OjA1Ljg2NTQzN1oiLCJwaG9uZSI6IiIsImNvbmZpcm1lZF9hdCI6IjIwMjYtMDQtMTlUMTY6MDc6MDUuODY1NDM3WiIsImxhc3Rfc2lnbl9pbl9hdCI6IjIwMjYtMDctMDJUMDQ6NDM6NDAuNTg1MDE3WiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiTm9mYW5lIEFNREpBRCIsIm5lZWRzX3Bhc3N3b3JkX3Jlc2V0IjpmYWxzZX0sImlkZW50aXRpZXMiOlt7ImlkZW50aXR5X2lkIjoiZGI3MWM2ZjYtN2M1OC00MjVjLWJlYTQtYzFjYmNjMGZhNDEzIiwiaWQiOiI2M2ZkNzkzYy1hYzE0LTQ3MWUtOWU1Zi0xZWVmNTk5ZGVlNDIiLCJ1c2VyX2lkIjoiNjNmZDc5M2MtYWMxNC00NzFlLTllNWYtMWVlZjU5OWRlZTQyIiwiaWRlbnRpdHlfZGF0YSI6eyJlbWFpbCI6Im5vZmFuZS5zb3VmaWVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjYzZmQ3OTNjLWFjMTQtNDcxZS05ZTVmLTFlZWY1OTlkZWU0MiJ9LCJwcm92aWRlciI6ImVtYWlsIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wNC0xOVQxNjowNzowNS44NTYxMjFaIiwiY3JlYXRlZF9hdCI6IjIwMjYtMDQtMTlUMTY6MDc6MDUuODU2MTc5WiIsInVwZGF0ZWRfYXQiOiIyMDI2LTA0LTE5VDE2OjA3OjA1Ljg1NjE3OVoiLCJlbWFpbCI6Im5vZmFuZS5zb3VmaWVAZ21haWwuY29tIn1dLCJjcmVhdGVkX2F0IjoiMjAyNi0wNC0xOVQxNjowNzowNS44NDI5MjRaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDctMDJUMTM6MjI6NTguODkxMzA3WiIsImlzX2Fub255bW91cyI6ZmFsc2V9fQ";

const MODULES = [
  { name: "dashboard",   path: "/client/dashboard",   label: "Tableau de bord" },
  { name: "factures",    path: "/client/factures",     label: "Factures & Devis" },
  { name: "crm",         path: "/client/crm",          label: "CRM" },
  { name: "tresorerie",  path: "/client/tresorerie",   label: "Trésorerie" },
  { name: "depenses",    path: "/client/depenses",     label: "Dépenses" },
  { name: "contrats",    path: "/client/contrats",     label: "Contrats" },
  { name: "stocks",      path: "/client/stocks",       label: "Stocks" },
  { name: "productivite",path: "/client/productivite", label: "Productivité" },
  { name: "projets",     path: "/client/projets",      label: "Projets" },
  { name: "equipe",      path: "/client/equipe",       label: "Équipe & RH" },
  { name: "chrono",      path: "/client/chrono",       label: "Chrono" },
  { name: "fournisseurs",path: "/client/fournisseurs", label: "Fournisseurs" },
  { name: "reseaux",     path: "/client/reseaux-sociaux", label: "Réseaux Sociaux" },
  { name: "portail",     path: "/client/portail",      label: "Portail Client" },
  { name: "paie",        path: "/client/paie",         label: "Paie & Bulletins" },
  { name: "reputation",  path: "/client/reputation",   label: "Réputation" },
  { name: "sourcing",    path: "/client/sourcing-ia",  label: "Sourcing IA" },
  { name: "assistant",   path: "/client/assistant-ia", label: "Assistant IA" },
  { name: "bloc-notes",  path: "/client/bloc-notes",   label: "Bloc-notes IA" },
  { name: "planning",    path: "/client/planning",     label: "Planning" },
  { name: "abonnements", path: "/client/abonnements",  label: "Abonnements" },
];

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Inject auth cookie so we bypass login
  await page.setCookie({
    name: "sb-cjlkkakynmtvlygqcugk-auth-token",
    value: AUTH_COOKIE_VALUE,
    domain: "localhost",
    path: "/",
  });

  for (const mod of MODULES) {
    try {
      console.log(`📸 ${mod.label}...`);
      await page.goto(BASE + mod.path, { waitUntil: "networkidle2", timeout: 20000 });

      // Wait for main content to appear (not a redirect to /login)
      await new Promise(r => setTimeout(r, 1500));

      const url = page.url();
      if (url.includes("/login") || url.includes("/register")) {
        console.log(`  ⚠️  Redirigé vers ${url} — skip`);
        continue;
      }

      const file = path.join(OUT, `${mod.name}.png`);
      await page.screenshot({ path: file, fullPage: false, type: "png" });
      console.log(`  ✅ Sauvegardé : screenshots/${mod.name}.png`);
    } catch (err) {
      console.log(`  ❌ Erreur sur ${mod.label}: ${err.message}`);
    }
  }

  await browser.close();
  console.log("\n✅ Toutes les captures terminées !");
})();
