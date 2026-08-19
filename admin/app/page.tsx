import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="대시보드" description="운영 현황을 한눈에 봅니다." />
      <EmptyState message="준비 중입니다." />
    </>
  );
}
