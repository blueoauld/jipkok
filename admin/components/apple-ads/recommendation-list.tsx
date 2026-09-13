"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  defaultRecommendationFilter,
  RecommendationFilters,
} from "@/components/apple-ads/recommendation-filters";
import { RecommendationTable } from "@/components/apple-ads/recommendation-table";
import { ReportSyncStatus } from "@/components/apple-ads/report-sync-status";
import { QuerySection } from "@/components/query-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useListState } from "@/hooks/use-list-state";
import {
  fetchAppleAdsCampaigns,
  fetchAppleAdsRecommendations,
} from "@/lib/api/apple-ads";
import { formatCount, formatMoney } from "@/lib/format";
import type { AppleAdsRecommendationList } from "@/lib/types";

const rules = [
  "일시정지: 활성 키워드가 탭 20회 이상인데 설치가 없다.",
  "제외 키워드: Search Match 검색어가 탭 10회 이상인데 설치가 없다. 같은 광고그룹에서 키워드 매칭으로 설치가 났으면 뺀다.",
  "입찰가 낮추기: 탭 10회 이상이고, 설치가 없거나 설치당 비용이 다른 키워드의 1.5배 이상이다. 15% 낮춘다.",
  "입찰가 올리기: 설치 3회 이상이고 설치당 비용이 다른 키워드의 70% 이하다. 15% 올리되, 애플 제안 입찰가가 현재보다 높으면 그 값을 넘지 않는다.",
  "키워드 추가: Search Match 검색어에서 설치가 2회 이상 나왔고 아직 키워드가 아니다. 광고그룹 입찰가를 알 수 있을 때만 추천한다.",
  "다른 키워드: 기간의 전체 키워드에서 평가하는 키워드를 뺀 나머지의 지출을 설치 수로 나눈 값이다. 지워진 키워드는 추천하지 않는다.",
];

function baselineText(data: AppleAdsRecommendationList) {
  if (data.baselineCostPerInstall == null) {
    return "기간에 설치가 없어 기준 설치당 비용을 잡지 못했습니다. 입찰가 추천은 나오지 않습니다.";
  }

  return `기준 설치당 비용 ${formatMoney(data.baselineCostPerInstall, data.currency)} (설치 ${formatCount(data.baselineInstalls)}회, 지출 ${formatMoney(data.baselineSpend, data.currency)})`;
}

export function RecommendationList() {
  const defaultFilter = useMemo(() => defaultRecommendationFilter(), []);
  const { filter, changeFilter } = useListState(defaultFilter);

  const campaigns = useQuery({
    queryKey: ["apple-ads", "campaigns"],
    queryFn: fetchAppleAdsCampaigns,
  });

  const recommendations = useQuery({
    queryKey: ["apple-ads", "recommendations", filter],
    queryFn: () => fetchAppleAdsRecommendations(filter),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <RecommendationFilters
            value={filter}
            defaultValue={defaultFilter}
            campaigns={campaigns.data ?? []}
            onChange={changeFilter}
          />
          <CardDescription>
            기본 기간은 3일 전까지의 30일입니다. 설치는 탭 뒤 며칠 늦게 붙어서
            최근 며칠은 뺍니다.
          </CardDescription>
          <ReportSyncStatus />
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>추천</CardTitle>
          <CardDescription>
            {recommendations.data
              ? baselineText(recommendations.data)
              : "기준 설치당 비용은 기간의 키워드 지출을 설치 수로 나눈 값입니다."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuerySection
            isPending={recommendations.isPending}
            error={recommendations.error}
            skeletonClassName="h-64 w-full"
          >
            {recommendations.data && (
              <RecommendationTable items={recommendations.data.items} />
            )}
          </QuerySection>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>규칙</CardTitle>
          <CardDescription>
            적용한 대상은 14일 동안 다시 추천하지 않습니다. 적용과 되돌리기는
            조치 이력에 남습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
