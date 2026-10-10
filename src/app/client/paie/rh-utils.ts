// Cotisations salariales — taux 2024 (hors Alsace-Moselle, régime général)
export const COT_SAL = [
  { label: "CSG déductible",          pct: 6.80 },
  { label: "CSG/CRDS non déductible", pct: 2.90 },
  { label: "Retraite de base",        pct: 6.90 },
  { label: "Retraite complémentaire", pct: 3.93 },
  { label: "Prévoyance",              pct: 0.50 },
  { label: "Assurance chômage",       pct: 0.00 },
];

// Cotisations patronales — taux 2024 (régime général)
export const COT_PAT = [
  { label: "Assurance maladie",         pct: 7.00 },
  { label: "Vieillesse plafonnée",      pct: 8.55 },
  { label: "Vieillesse déplafonnée",    pct: 1.90 },
  { label: "Allocations familiales",    pct: 3.45 },
  { label: "Accidents du travail",      pct: 1.50 },
  { label: "Assurance chômage",         pct: 4.05 },
  { label: "Retraite complémentaire",   pct: 5.90 },
  { label: "Formation professionnelle", pct: 0.55 },
  { label: "Taxe d'apprentissage",      pct: 0.68 },
];

export const TOTAL_COT_SAL = COT_SAL.reduce((s, c) => s + c.pct, 0); // ~21.03%
export const TOTAL_COT_PAT = COT_PAT.reduce((s, c) => s + c.pct, 0); // ~33.58%

export const calcNet     = (brut: number) => brut * (1 - TOTAL_COT_SAL / 100);
export const calcCharges = (brut: number) => brut * (TOTAL_COT_PAT / 100);
export const calcCout    = (brut: number) => brut + calcCharges(brut);

export const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const fmt2 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

export const fmtDateShort = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#c9a55a,#b08d45)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#3b82f6,#2563eb)",
  "linear-gradient(135deg,#ec4899,#db2777)",
  "linear-gradient(135deg,#14b8a6,0d9488)",
];

export function avatarGradient(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length];
}

export const CONTRAT_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  CDI:        { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" },
  CDD:        { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
  Freelance:  { color: "#c9a55a", bg: "rgba(201,165,90,0.1)",  border: "rgba(201,165,90,0.25)" },
  Stage:      { color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)"  },
  Alternance: { color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)" },
  Autre:      { color: "#a855f7", bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.25)" },
};

export const TYPE_CONGE_LABELS: Record<string, string> = {
  cp:           "Congés payés",
  rtt:          "RTT",
  maladie:      "Maladie",
  maternite:    "Maternité",
  paternite:    "Paternité",
  sans_solde:   "Congé sans solde",
  exceptionnel: "Événement familial",
};

export const TYPE_VARIABLE_LABELS: Record<string, string> = {
  prime:      "Prime",
  heures_sup: "Heures supplémentaires",
  indemnite:  "Indemnité",
  retenue:    "Retenue",
  avance:     "Acompte / Avance",
};

export function generateBulletinHtml(
  emp: { nom: string; poste?: string; type_contrat: string; date_embauche?: string; salaire_brut: number },
  monthLabel: string,
  variables: { libelle: string; montant: number; type: string }[] = [],
): string {
  const brut        = emp.salaire_brut;
  const primesTotal = variables.filter(v => ["prime","heures_sup","indemnite"].includes(v.type)).reduce((s, v) => s + v.montant, 0);
  const retTotal    = variables.filter(v => ["retenue","avance"].includes(v.type)).reduce((s, v) => s + v.montant, 0);
  const brutAjuste  = brut + primesTotal - retTotal;
  const cotSal      = COT_SAL.reduce((s, c) => s + brutAjuste * c.pct / 100, 0);
  const cotPat      = COT_PAT.reduce((s, c) => s + brutAjuste * c.pct / 100, 0);
  const net         = brutAjuste - cotSal;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Bulletin de paie — ${emp.nom} — ${monthLabel}</title>
<style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;max-width:720px;margin:32px auto;color:#222;font-size:13px;line-height:1.5}
  h1{font-size:17px;font-weight:800;border-bottom:2px solid #222;padding-bottom:8px;margin-bottom:16px}
  .notice{background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:8px 12px;font-size:11px;color:#92400e;margin-bottom:16px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:20px;font-size:12px;color:#555}
  .meta b{color:#222}
  table{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12px}
  th{background:#f3f4f6;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:.05em;padding:6px 10px;text-align:left;border:1px solid #e5e7eb}
  td{padding:5px 10px;border:1px solid #e5e7eb}
  .r{text-align:right}
  .brut{background:#f9fafb;font-weight:700}
  .var-pos{color:#059669}
  .var-neg{color:#dc2626}
  .net{background:#dcfce7;font-weight:800;font-size:14px;color:#16a34a}
  .subtot{background:#fef3c7;font-weight:700}
  .no-print{margin-top:24px;display:flex;gap:10px}
  button{cursor:pointer;border:none;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:700}
  .btn-print{background:#222;color:#fff}
  .btn-close{background:#e5e7eb;color:#374151}
  @media print{.no-print{display:none}}
</style></head><body>
<h1>Bulletin de Paie — Indicatif</h1>
<div class="notice">Document indicatif généré par DJAMA Premium — taux 2024 régime général. Non opposable à l'URSSAF. À valider avec votre expert-comptable ou logiciel de paie certifié.</div>
<div class="meta">
  <div><b>Salarié :</b> ${emp.nom}</div>
  <div><b>Période :</b> ${monthLabel}</div>
  <div><b>Poste :</b> ${emp.poste ?? "—"}</div>
  <div><b>Contrat :</b> ${emp.type_contrat}</div>
  <div><b>Embauche :</b> ${emp.date_embauche ? new Date(emp.date_embauche).toLocaleDateString("fr-FR") : "—"}</div>
  <div><b>Généré le :</b> ${new Date().toLocaleDateString("fr-FR")}</div>
</div>
<table>
  <tr><th>Libellé</th><th class="r">Base (€)</th><th class="r">Taux salarial</th><th class="r">Cotisation</th></tr>
  <tr class="brut"><td>Salaire brut de base</td><td class="r">${brut.toFixed(2)}</td><td></td><td class="r">${brut.toFixed(2)}</td></tr>
  ${variables.filter(v => ["prime","heures_sup","indemnite"].includes(v.type)).map(v =>
    `<tr><td class="var-pos">${v.libelle}</td><td></td><td></td><td class="r var-pos">+ ${v.montant.toFixed(2)}</td></tr>`
  ).join("")}
  ${variables.filter(v => ["retenue","avance"].includes(v.type)).map(v =>
    `<tr><td class="var-neg">${v.libelle}</td><td></td><td></td><td class="r var-neg">− ${v.montant.toFixed(2)}</td></tr>`
  ).join("")}
  ${(primesTotal !== 0 || retTotal !== 0) ? `<tr class="brut"><td>Salaire brut ajusté</td><td class="r">${brutAjuste.toFixed(2)}</td><td></td><td class="r">${brutAjuste.toFixed(2)}</td></tr>` : ""}
  ${COT_SAL.filter(c => c.pct > 0).map(c =>
    `<tr><td>${c.label}</td><td class="r">${brutAjuste.toFixed(2)}</td><td class="r">${c.pct}%</td><td class="r">− ${(brutAjuste * c.pct / 100).toFixed(2)}</td></tr>`
  ).join("")}
  <tr class="net"><td colspan="3">NET À PAYER AU SALARIÉ</td><td class="r">${net.toFixed(2)} €</td></tr>
</table>
<table>
  <tr><th>Charges patronales</th><th class="r">Base (€)</th><th class="r">Taux</th><th class="r">Montant</th></tr>
  ${COT_PAT.map(c =>
    `<tr><td>${c.label}</td><td class="r">${brutAjuste.toFixed(2)}</td><td class="r">${c.pct}%</td><td class="r">${(brutAjuste * c.pct / 100).toFixed(2)}</td></tr>`
  ).join("")}
  <tr class="subtot"><td colspan="3">Total charges patronales</td><td class="r">${cotPat.toFixed(2)} €</td></tr>
  <tr class="brut"><td colspan="3">Coût total employeur</td><td class="r">${(brutAjuste + cotPat).toFixed(2)} €</td></tr>
</table>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">Imprimer / Exporter PDF</button>
  <button class="btn-close" onclick="window.close()">Fermer</button>
</div>
</body></html>`;
}
