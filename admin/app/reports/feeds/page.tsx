import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function FeedReportsPage() {
  return (
    <>
      <PageHeader title="피드 신고" description="피드 게시물에 대한 신고를 처리합니다." />
      <EmptyState message="준비 중입니다." />
    </>
  );
}
