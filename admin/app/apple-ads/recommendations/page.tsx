import { Suspense } from "react";
import { RecommendationList } from "@/components/apple-ads/recommendation-list";
import { PageHeader } from "@/components/page-header";

export default function AppleAdsRecommendationsPage() {
  return (
    <>
      <PageHeader
        title="조치 추천"
        description="적재한 성과를 규칙에 대어 입찰가 조정, 일시정지, 제외 키워드, 키워드 추가를 추천합니다."
      />
      <Suspense>
        <RecommendationList />
      </Suspense>
    </>
  );
}
