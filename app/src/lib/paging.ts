import type { InfiniteData } from "@tanstack/react-query";
import { useMemo } from "react";

type Page<T> = { items: T[] };

export function flattenPages<T>(data: InfiniteData<Page<T>> | undefined) {
  return data?.pages.flatMap((page) => page.items);
}

export function useFlatItems<T>(data: InfiniteData<Page<T>> | undefined) {
  return useMemo(() => flattenPages(data), [data]);
}

// 페이지 구조(nextCursor 등)는 그대로 두고 각 페이지의 items만 바꾼다.
export function mapPages<P extends Page<unknown>>(
  data: InfiniteData<P> | undefined,
  update: (items: P["items"], index: number) => P["items"],
) {
  return (
    data && {
      ...data,
      pages: data.pages.map((page, index) => ({
        ...page,
        items: update(page.items, index),
      })),
    }
  );
}
