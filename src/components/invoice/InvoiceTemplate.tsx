"use client";
/**
 * InvoiceTemplate — Composant switch dynamique.
 *
 * Dispatche vers TemplatePreview en résolvant le variant
 * depuis PDF_THEMES (un variant par mise en page PDF réelle).
 *
 * Usage :
 *   <InvoiceTemplate type="prem-nuit" data={invoiceData} />
 */

import type { TemplateType } from "@/lib/pdf/types";
import type { PreviewData }  from "./shared";
import { TemplatePreview }   from "./TemplatePreview";

export interface InvoiceTemplateProps {
  type: TemplateType | string;
  data: PreviewData;
}

export function InvoiceTemplate({ type, data }: InvoiceTemplateProps) {
  return <TemplatePreview type={type} data={data} />;
}
