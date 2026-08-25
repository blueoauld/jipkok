import { api } from "@/lib/api/client";
import type { MemberReportDetail, MemberReportPage } from "@/lib/types";
import type { MemberReportFilter } from "@/components/reports/member-report-filters";

export type MemberReportListParams = MemberReportFilter & {
  page: number;
  reportedPhoneNumber?: string;
};

export const fetchMemberReports = (params: MemberReportListParams) =>
  api<MemberReportPage>("/api/admin/reports", {
    query: {
      status: params.status === "ALL" ? undefined : params.status,
      type: params.type === "ALL" ? undefined : params.type,
      reason: params.reason === "ALL" ? undefined : params.reason,
      reportedMemberId: params.reportedMemberId || undefined,
      reportedPhoneNumber: params.reportedPhoneNumber,
      page: params.page,
    },
  });

export const fetchMemberReportDetail = (id: number) =>
  api<MemberReportDetail>(`/api/admin/reports/${id}`);

export const handleMemberReport = (id: number) =>
  api<void>(`/api/admin/reports/${id}/handle`, { method: "POST" });
