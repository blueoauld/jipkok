import { Suspense } from "react";
import { DiaryList } from "@/components/diaries/diary-list";
import { PageHeader } from "@/components/page-header";

export default function DiariesPage() {
  return (
    <>
      <PageHeader
        title="일기"
        description="회원이 쓴 일기를 조회합니다. 상세를 열면 열람이 조치 이력에 남습니다."
      />
      <Suspense>
        <DiaryList />
      </Suspense>
    </>
  );
}
