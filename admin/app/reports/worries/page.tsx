import { PageHeader } from "@/components/page-header";
import { WorryReportList } from "@/components/worries/worry-report-list";

export default function WorryReportsPage() {
  return (
    <>
      <PageHeader
        title="고민 신고"
        description="고민에 대한 신고를 확인합니다. 자동 삭제가 없어 직접 처리해야 합니다."
      />
      <WorryReportList />
    </>
  );
}
