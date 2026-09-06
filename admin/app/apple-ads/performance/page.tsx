import { Suspense } from "react";
import { AppleAdsReport } from "@/components/apple-ads/apple-ads-report";
import { PageHeader } from "@/components/page-header";

export default function AppleAdsPage() {
  return (
    <>
      <PageHeader
        title="애플 광고"
        description="적재해 둔 Apple Ads 키워드와 검색어 성과를 기간별로 확인합니다."
      />
      <Suspense>
        <AppleAdsReport />
      </Suspense>
    </>
  );
}
