import { api } from "@/lib/api/client";
import type { FeedReportFilter } from "@/components/feeds/feed-report-filters";
import type { FeedReportPage } from "@/lib/types";

export type FeedReportListParams = FeedReportFilter & { page: number };

export const fetchFeedReports = (params: FeedReportListParams) =>
  api<FeedReportPage>("/api/admin/feed-reports", {
    query: {
      status: params.status === "ALL" ? undefined : params.status,
      authorId: params.authorId || undefined,
      page: params.page,
    },
  });

export const deleteFeedPost = (postId: number) =>
  api<void>(`/api/admin/feed-posts/${postId}`, { method: "DELETE" });
