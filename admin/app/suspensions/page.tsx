import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function SuspensionsPage() {
  return (
    <>
      <PageHeader title="정지" description="정지 중인 회원과 정지 이력을 관리합니다." />
      <EmptyState message="준비 중입니다." />
    </>
  );
}
