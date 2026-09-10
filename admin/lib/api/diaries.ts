import { api } from "@/lib/api/client";
import type { DiaryFilter } from "@/components/diaries/diary-filters";
import type { DiaryDetail, DiaryPage } from "@/lib/types";

export type DiaryListParams = DiaryFilter & { page: number };

export const fetchDiaries = (params: DiaryListParams) =>
  api<DiaryPage>("/api/admin/diaries", {
    query: {
      memberId: params.memberId || undefined,
      page: params.page,
    },
  });

export const fetchDiary = (diaryId: number) =>
  api<DiaryDetail>(`/api/admin/diaries/${diaryId}`);
