import { PageHeader } from "@/components/page-header";
import { MemberReportList } from "@/components/reports/member-report-list";
import { memberReports } from "@/lib/mock/member-reports";

export default function MemberReportsPage() {
  return (
    <>
      <PageHeader
        title="회원 신고"
        description="회원에 대한 신고를 처리합니다."
      />
      <MemberReportList reports={memberReports} />
    </>
  );
}
