import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function MemberReportsPage() {
  return (
    <>
      <PageHeader title="회원 신고" description="회원에 대한 신고를 처리합니다." />
      <EmptyState message="준비 중입니다." />
    </>
  );
}
