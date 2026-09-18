import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const DIARIES_KEY = ["diaries"];

function diaryMonthKey(month: string) {
  return [...DIARIES_KEY, month];
}

export function useDiaryMonth(month: string) {
  return useQuery({
    queryKey: diaryMonthKey(month),
    queryFn: () => api.diaries.list(month),
  });
}
