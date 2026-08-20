import { useEffect } from "react";

type PageData = {
  totalCount: number;
  size: number;
};

export function usePageGuard(
  page: number,
  setPage: (page: number) => void,
  data: PageData | undefined,
) {
  const totalPages = data
    ? Math.max(1, Math.ceil(data.totalCount / data.size))
    : null;
  const target = totalPages !== null && page > totalPages ? totalPages : null;

  useEffect(() => {
    if (target !== null) setPage(target);
  }, [target, setPage]);
}
