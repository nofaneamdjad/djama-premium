/**
 * /client/planning — Re-exporte la page planning-agenda.
 * Protégé par le middleware (cookie auth + paid).
 * La page réelle vit dans /app/planning-agenda/page.tsx,
 * on la réutilise ici pour éviter la duplication de code.
 */
export { default } from "@/app/planning-agenda/page";
