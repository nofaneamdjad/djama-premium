import { useState, useMemo, useCallback } from "react";

export function usePagination<T>(items: T[], pageSize = 25) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const paginated = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const reset = useCallback(() => setPage(1), []);

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
