import { useState, useMemo, useCallback } from "react";

/**
 * usePagination — pagination côté client sur un tableau déjà chargé.
 *
 * @param items    Tableau source (déjà filtré/trié)
 * @param pageSize Nombre d'éléments par page (défaut : 25)
 *
 * Usage :
 *   const { page, setPage, totalPages, paginated, reset } = usePagination(filtered, 20);
 *   // reset() remet page=1 quand le filtre change
 */
export function usePagination<T>(items: T[], pageSize = 25) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const paginated = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  // Reset à page 1 (appeler dans un useEffect sur les dépendances de filtre)
  const reset = useCallback(() => setPage(1), []);

  // Sécurité : si la page courante dépasse le total après filtrage
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPage(safePage);

  return {
    page: safePage,
    setPage,
    totalPages,
    paginated,
    reset,
    totalItems: items.length,
  };
}
