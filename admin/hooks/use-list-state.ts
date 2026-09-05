import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const PAGE_KEY = "page";

type Filter = Record<string, string>;

function readFilter<T extends Filter>(params: URLSearchParams, defaults: T) {
  const filter = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = params.get(String(key));
    if (value !== null) filter[key] = value as T[keyof T];
  }
  return filter;
}

function readPage(params: URLSearchParams) {
  const page = Number(params.get(PAGE_KEY));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function useListState<T extends Filter>(defaultFilter: T) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [filter, setFilter] = useState(() =>
    readFilter(searchParams, defaultFilter),
  );
  const [page, setPage] = useState(() => readPage(searchParams));

  useEffect(() => {
    const params = new URLSearchParams();
    for (const key of Object.keys(defaultFilter)) {
      if (filter[key] !== defaultFilter[key]) params.set(key, filter[key]);
    }
    if (page > 1) params.set(PAGE_KEY, String(page));

    const query = params.toString();
    const next = query ? `${pathname}?${query}` : pathname;

    if (next !== `${pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [filter, page, defaultFilter, pathname]);

  const changeFilter = (next: T) => {
    setFilter(next);
    setPage(1);
  };

  return { filter, changeFilter, page, setPage };
}
