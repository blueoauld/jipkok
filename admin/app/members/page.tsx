import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function MembersPage() {
  return (
    <>
      <PageHeader title="회원" description="회원을 조회하고 프로필을 초기화합니다." />
      <EmptyState message="준비 중입니다." />
    </>
  );
}
