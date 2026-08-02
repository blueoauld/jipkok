import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function memberDetailKey(memberId: number) {
  return ["members", "detail", memberId];
}

export function useMemberDetail(memberId: number) {
  return useQuery({
    queryKey: memberDetailKey(memberId),
    queryFn: () => api.members.detail(memberId),
    enabled: Number.isInteger(memberId),
  });
}
