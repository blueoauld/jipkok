import { Suspense } from "react";
import { ActionList } from "@/components/apple-ads/action-list";
import { PageHeader } from "@/components/page-header";

export default function AppleAdsActionsPage() {
  return (
    <>
      <PageHeader
        title="조치 이력"
        description="애플 광고에 적용한 조치와 되돌린 기록입니다."
      />
      <Suspense>
        <ActionList />
      </Suspense>
    </>
  );
}
