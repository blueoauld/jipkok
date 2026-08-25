import { api } from "@/lib/api/client";
import type { PostReportFilter } from "@/components/post-report-filters";
import type { WorryCommentReportPage, WorryReportPage } from "@/lib/types";

export type WorryReportListParams = PostReportFilter & { page: number };

const toQuery = (params: WorryReportListParams) => ({
  status: params.status === "ALL" ? undefined : params.status,
  authorId: params.authorId || undefined,
  page: params.page,
});

export const fetchWorryReports = (params: WorryReportListParams) =>
  api<WorryReportPage>("/api/admin/worry-reports", { query: toQuery(params) });

export const fetchWorryCommentReports = (params: WorryReportListParams) =>
  api<WorryCommentReportPage>("/api/admin/worry-comment-reports", {
    query: toQuery(params),
  });

export const deleteWorryPost = (postId: number) =>
  api<void>(`/api/admin/worry-posts/${postId}`, { method: "DELETE" });

export const deleteWorryComment = (commentId: number) =>
  api<void>(`/api/admin/worry-comments/${commentId}`, { method: "DELETE" });
