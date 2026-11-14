"use client";
/**
 * InvoiceTemplate — Composant switch dynamique.
 *
 * Rend le bon template de preview selon `type`.
 * Utilisé pour la preview live dans l'admin et pour les thumbnails
 * dans TemplateSelector.
 *
 * Usage :
 *   <InvoiceTemplate type="premium" data={invoiceData} />
 */

import type { TemplateType } from "@/lib/pdf/types";
import type { PreviewData }  from "./shared";
import { ModernTemplate }    from "./templates/ModernTemplate";
import { MinimalTemplate }   from "./templates/MinimalTemplate";
import { ClassicTemplate }   from "./templates/ClassicTemplate";
import { PremiumTemplate }   from "./templates/PremiumTemplate";
import { ColorfulTemplate }  from "./templates/ColorfulTemplate";

export interface InvoiceTemplateProps {
  type: TemplateType | string;
  data: PreviewData;
}

export function InvoiceTemplate({ type, data }: InvoiceTemplateProps) {
  // Famille → composant preview HTML (5 visuels hérités)
  if (type.startsWith("min-")) return <MinimalTemplate  data={data} />;
  if (type.startsWith("corp-") || type.startsWith("serv-") || type.startsWith("comm-")) return <ClassicTemplate data={data} />;
  if (type.startsWith("prem-")) return <PremiumTemplate data={data} />;
  if (type.startsWith("creat-") || type.startsWith("tech-")) return <ColorfulTemplate data={data} />;
  // Legacy + défaut
  switch (type) {
    case "minimal":  return <MinimalTemplate  data={data} />;
    case "classic":  return <ClassicTemplate  data={data} />;
    case "premium":  return <PremiumTemplate  data={data} />;
    case "colorful": return <ColorfulTemplate data={data} />;
    default:         return <ModernTemplate   data={data} />;
  }
}
