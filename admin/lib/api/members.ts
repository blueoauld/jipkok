import { api } from "@/lib/api/client";
import type { MemberFilter } from "@/components/members/member-filters";
import type { MemberDetail, MemberPage } from "@/lib/types";

export type MemberListParams = MemberFilter & { page: number };

export const fetchMembers = (params: MemberListParams) =>
  api<MemberPage>("/api/admin/members", {
    query: {
      status: params.status,
      gender: params.gender === "ALL" ? undefined : params.gender,
      keyword: params.keyword.trim() || undefined,
      page: params.page,
    },
  });

export const fetchMemberDetail = (id: number) =>
  api<MemberDetail>(`/api/admin/members/${id}`);
