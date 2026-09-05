import { Suspense } from "react";
import { ActionList } from "@/components/actions/action-list";
import { PageHeader } from "@/components/page-header";

export default function ActionsPage() {
  return (
    <>
      <PageHeader
        title="조치 이력"
        description="관리자가 처리한 정지, 초기화, 탈퇴, 삭제, 신고 처리 기록입니다."
      />
      <Suspense>
        <ActionList />
      </Suspense>
    </>
  );
}
