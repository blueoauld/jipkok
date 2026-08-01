import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const POINT_BALANCE_KEY = ["points", "balance"];
export const POINT_HISTORIES_KEY = ["points", "histories"];

export function usePointBalance() {
  return useQuery({
    queryKey: POINT_BALANCE_KEY,
    queryFn: api.points.balance,
  });
}
