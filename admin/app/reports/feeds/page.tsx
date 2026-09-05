import { Suspense } from "react";
import { FeedReportList } from "@/components/feeds/feed-report-list";
import { PageHeader } from "@/components/page-header";

export default function FeedReportsPage() {
  return (
    <>
      <PageHeader
        title="피드 신고"
        description="피드에 대한 신고를 확인합니다. 신고 5건이 쌓이면 자동 삭제됩니다."
      />
      <Suspense>
        <FeedReportList />
      </Suspense>
    </>
  );
}
