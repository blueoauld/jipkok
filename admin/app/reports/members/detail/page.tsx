import { Suspense } from "react";
import { MemberReportDetail } from "@/components/reports/member-report-detail";

export default function MemberReportDetailPage() {
  return (
    <Suspense>
      <MemberReportDetail />
    </Suspense>
  );
}
