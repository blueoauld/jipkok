"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAppleAdsReportStatus } from "@/lib/api/apple-ads";
import { formatDate, formatDateTime } from "@/lib/format";

export function ReportSyncStatus() {
  const status = useQuery({
    queryKey: ["apple-ads", "report-status"],
    queryFn: fetchAppleAdsReportStatus,
  });

  if (!status.data) {
    return null;
  }

  const { lastSyncedAt, latestReportDate } = status.data;

  return (
    <p className="text-sm text-muted-foreground">
      {lastSyncedAt != null && latestReportDate != null
        ? `마지막 적재 ${formatDateTime(lastSyncedAt)}, 리포트는 ${formatDate(latestReportDate)}까지 있습니다.`
        : "아직 적재한 리포트가 없습니다."}
    </p>
  );
}
