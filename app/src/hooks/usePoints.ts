import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { api, type PointHistoryPage } from "@/lib/api";

export const POINT_BALANCE_KEY = ["points", "balance"];
export const POINT_HISTORIES_KEY = ["points", "histories"];

export function usePointBalance() {
  return useQuery({
    queryKey: POINT_BALANCE_KEY,
    queryFn: api.points.balance,
  });
}

export function usePointHistories() {
  const query = useInfiniteQuery({
    queryKey: POINT_HISTORIES_KEY,
    queryFn: ({ pageParam }) => api.points.histories({ cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: PointHistoryPage) => page.nextCursor,
  });

  return {
    ...query,
    histories: query.data?.pages.flatMap((page) => page.items),
  };
}
