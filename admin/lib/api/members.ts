import { api } from "@/lib/api/client";
import type { MemberFilter } from "@/components/members/member-filters";
import type { MemberDetail, MemberPage, ProfileTarget } from "@/lib/types";

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

export const resetMemberProfile = (id: number, target: ProfileTarget) =>
  api<void>(`/api/admin/members/${id}/profile-reset`, {
    method: "POST",
    body: { target },
  });

export const withdrawMember = (id: number) =>
  api<void>(`/api/admin/members/${id}`, { method: "DELETE" });
