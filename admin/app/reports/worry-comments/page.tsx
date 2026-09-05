import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { WorryCommentReportList } from "@/components/worries/worry-report-list";

export default function WorryCommentReportsPage() {
  return (
    <>
      <PageHeader
        title="고민 댓글 신고"
        description="고민 댓글에 대한 신고를 확인합니다. 신고 5건이 쌓이면 자동 삭제됩니다."
      />
      <Suspense>
        <WorryCommentReportList />
      </Suspense>
    </>
  );
}
