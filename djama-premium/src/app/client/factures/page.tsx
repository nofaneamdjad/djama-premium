"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export default function ClientFacturesPage() {
  const [documentType, setDocumentType] = useState<"Facture" | "Devis">("Facture");
  const [primaryColor, setPrimaryColor] = useState("#b08d57");

  const [companyName, setCompanyName] = useState("DJAMA");
  const [companyLogo, setCompanyLogo] = useState("/images/djama-logo.png");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companySiret, setCompanySiret] = useState("");
  const [companyVatNumber, setCompanyVatNumber] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [docNumber, setDocNumber] = useState("FAC-001");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, vatRate: 20 },
  ]);

  function updateItem(index: number, key: keyof LineItem, value: string | number) {
    const copy = [...items];
    copy[index] = { ...copy[index], [key]: value };
    setItems(copy);
  }

  function addItem() {
    setItems([
      ...items,
      { description: "", quantity: 1, unitPrice: 0, vatRate: 20 },
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  const totals = useMemo(() => {
    let totalHT = 0;
    let totalVAT = 0;

    for (const item of items) {
      const lineHT = item.quantity * item.unitPrice;
      const lineVAT = lineHT * (item.vatRate / 100);
      totalHT += lineHT;
      totalVAT += lineVAT;
    }

    return {
      totalHT,
      totalVAT,
      totalTTC: totalHT + totalVAT,
    };
  }, [items]);

  function hexToRgb(hex: string) {
    const cleaned = hex.replace("#", "");
    const bigint = parseInt(cleaned, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }

  async function downloadPDF() {
    const pdf = new jsPDF("p", "mm", "a4");
    const { r, g, b } = hexToRgb(primaryColor);

    let y = 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(r, g, b);
    pdf.text(documentType, 15, y);

    pdf.setFontSize(12);
    pdf.setTextColor(80, 80, 80);
    pdf.text(docNumber || "—", 15, y + 8);

    pdf.setFont("helvetica", "normal");
    pdf.text(`Date : ${issueDate || "—"}`, 150, y);
    pdf.text(`Échéance : ${dueDate || "—"}`, 150, y + 7);

    y += 22;

    try {
      if (companyLogo) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = companyLogo;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", 150, 25, 30, 30);
        }
      }
    } catch {
      // ignore logo loading errors
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Entreprise", 15, y);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    y += 7;
    [
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      companySiret,
      companyVatNumber,
    ]
      .filter(Boolean)
      .forEach((line) => {
        pdf.text(String(line), 15, y);
        y += 6;
      });

    let rightY = 42;
    pdf.setFont("helvetica", "bold");
    pdf.text("Client", 110, rightY);
    pdf.setFont("helvetica", "normal");
    rightY += 7;
    [clientName, clientAddress, clientEmail]
      .filter(Boolean)
      .forEach((line) => {
        pdf.text(String(line), 110, rightY);
        rightY += 6;
      });

    y = Math.max(y, rightY) + 10;

    pdf.setDrawColor(220, 220, 220);
    pdf.setFillColor(r, g, b);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(15, y, 180, 10, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Description", 18, y + 6.5);
    pdf.text("Qté", 100, y + 6.5);
    pdf.text("PU HT", 120, y + 6.5);
    pdf.text("TVA", 145, y + 6.5);
    pdf.text("Total", 168, y + 6.5);

    y += 14;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");

    items.forEach((item) => {
      const lineHT = item.quantity * item.unitPrice;
      const lineVAT = lineHT * (item.vatRate / 100);
      const lineTTC = lineHT + lineVAT;

      if (y > 260) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(item.description || "—", 18, y);
      pdf.text(String(item.quantity), 100, y);
      pdf.text(`${item.unitPrice.toFixed(2)} €`, 120, y);
      pdf.text(`${item.vatRate}%`, 145, y);
      pdf.text(`${lineTTC.toFixed(2)} €`, 168, y);

      pdf.setDrawColor(235, 235, 235);
      pdf.line(15, y + 3, 195, y + 3);
      y += 9;
    });

    y += 8;
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total HT : ${totals.totalHT.toFixed(2)} €`, 135, y);
    y += 7;
    pdf.text(`Total TVA : ${totals.totalVAT.toFixed(2)} €`, 135, y);
    y += 7;
    pdf.setFontSize(13);
    pdf.text(`Total TTC : ${totals.totalTTC.toFixed(2)} €`, 135, y);

    y += 15;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Notes", 15, y);
    pdf.setFont("helvetica", "normal");
    y += 6;
    pdf.text(notes || "—", 15, y, { maxWidth: 180 });

    y += 16;
    pdf.setFont("helvetica", "bold");
    pdf.text("Conditions de paiement", 15, y);
    pdf.setFont("helvetica", "normal");
    y += 6;
    pdf.text(paymentTerms || "—", 15, y, { maxWidth: 180 });

    pdf.save(`${documentType}-${docNumber || "document"}.pdf`);
  }

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Factures & Devis Pro
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Générateur de facture et devis
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-zinc-600">
          Créez des documents élégants, avec votre logo, vos couleurs et tous les calculs automatiques.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-zinc-700">
                    Type de document
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as "Facture" | "Devis")}
                    className="w-full rounded-xl border border-luxe px-4 py-3"
                  >
                    <option>Facture</option>
                    <option>Devis</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-zinc-700">
                    Couleur principale
                  </label>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-full rounded-xl border border-luxe"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-luxe p-5">
                <h2 className="text-2xl font-extrabold">Entreprise</h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nom entreprise"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    value={companyLogo}
                    onChange={(e) => setCompanyLogo(e.target.value)}
                    placeholder="Chemin logo /images/logo.png"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Adresse"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="Email"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="Téléphone"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    value={companySiret}
                    onChange={(e) => setCompanySiret(e.target.value)}
                    placeholder="SIRET / SIREN"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    value={companyVatNumber}
                    onChange={(e) => setCompanyVatNumber(e.target.value)}
                    placeholder="N° TVA"
                    className="rounded-xl border border-luxe px-4 py-3 md:col-span-2"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-luxe p-5">
                <h2 className="text-2xl font-extrabold">Client</h2>

                <div className="mt-4 grid gap-4">
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nom du client"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Adresse du client"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Email du client"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-luxe p-5">
                <h2 className="text-2xl font-extrabold">Document</h2>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <input
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Numéro"
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="rounded-xl border border-luxe px-4 py-3"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-luxe p-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-extrabold">Lignes</h2>
                  <button
                    type="button"
                    onClick={addItem}
                    className="rounded-xl border border-gold-soft bg-[rgb(var(--gold))] px-4 py-2 font-extrabold text-black"
                  >
                    Ajouter une ligne
                  </button>
                </div>

                <div className="mt-4 grid gap-4">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-2xl border border-luxe p-4 md:grid-cols-5"
                    >
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Description"
                        className="rounded-xl border border-luxe px-4 py-3"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        placeholder="Qté"
                        className="rounded-xl border border-luxe px-4 py-3"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                        placeholder="Prix HT"
                        className="rounded-xl border border-luxe px-4 py-3"
                      />
                      <input
                        type="number"
                        value={item.vatRate}
                        onChange={(e) => updateItem(index, "vatRate", Number(e.target.value))}
                        placeholder="TVA %"
                        className="rounded-xl border border-luxe px-4 py-3"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="rounded-xl border border-luxe px-4 py-3 font-bold text-zinc-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-luxe p-5">
                <h2 className="text-2xl font-extrabold">Notes & conditions</h2>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Notes, remarques..."
                  className="mt-4 w-full rounded-xl border border-luxe px-4 py-3"
                />

                <textarea
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  rows={3}
                  placeholder="Conditions de paiement..."
                  className="mt-4 w-full rounded-xl border border-luxe px-4 py-3"
                />
              </div>

              <button
                type="button"
                onClick={downloadPDF}
                className="rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black shadow-luxe"
              >
                Télécharger en PDF
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
            <div className="rounded-3xl border p-6" style={{ borderColor: primaryColor }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt="Logo entreprise"
                      className="h-16 w-16 rounded-xl object-contain"
                    />
                  ) : null}

                  <div>
                    <div
                      className="text-3xl font-extrabold"
                      style={{ color: primaryColor }}
                    >
                      {documentType}
                    </div>
                    <p className="mt-2 text-zinc-600">{docNumber}</p>
                  </div>
                </div>

                <div className="text-right text-sm text-zinc-600">
                  <p>Date : {issueDate || "—"}</p>
                  <p>Échéance : {dueDate || "—"}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-extrabold">Entreprise</h3>
                  <div className="mt-2 text-sm text-zinc-600">
                    <p>{companyName}</p>
                    <p>{companyAddress}</p>
                    <p>{companyPhone}</p>
                    <p>{companyEmail}</p>
                    <p>{companySiret}</p>
                    <p>{companyVatNumber}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold">Client</h3>
                  <div className="mt-2 text-sm text-zinc-600">
                    <p>{clientName}</p>
                    <p>{clientAddress}</p>
                    <p>{clientEmail}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-luxe">
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: primaryColor, color: "#ffffff" }}>
                    <tr>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Qté</th>
                      <th className="px-4 py-3 text-left">PU HT</th>
                      <th className="px-4 py-3 text-left">TVA</th>
                      <th className="px-4 py-3 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const lineHT = item.quantity * item.unitPrice;
                      const lineVAT = lineHT * (item.vatRate / 100);
                      const lineTTC = lineHT + lineVAT;

                      return (
                        <tr key={index} className="border-t border-luxe">
                          <td className="px-4 py-3">{item.description || "—"}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3">{item.unitPrice.toFixed(2)} €</td>
                          <td className="px-4 py-3">{item.vatRate}%</td>
                          <td className="px-4 py-3">{lineTTC.toFixed(2)} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 space-y-2 text-right text-sm">
                <p>
                  <strong>Total HT :</strong> {totals.totalHT.toFixed(2)} €
                </p>
                <p>
                  <strong>Total TVA :</strong> {totals.totalVAT.toFixed(2)} €
                </p>
                <p className="text-lg">
                  <strong>Total TTC :</strong> {totals.totalTTC.toFixed(2)} €
                </p>
              </div>

              <div className="mt-8">
                <h3 className="font-extrabold">Notes</h3>
                <p className="mt-2 text-sm text-zinc-600">{notes || "—"}</p>
              </div>

              <div className="mt-6">
                <h3 className="font-extrabold">Conditions de paiement</h3>
                <p className="mt-2 text-sm text-zinc-600">{paymentTerms || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}