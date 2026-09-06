"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { KeywordTable } from "@/components/apple-ads/keyword-table";
import {
  defaultAppleAdsFilter,
  ReportFilters,
} from "@/components/apple-ads/report-filters";
import { SearchTermTable } from "@/components/apple-ads/search-term-table";
import { SyncButton } from "@/components/apple-ads/sync-button";
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
  fetchAppleAdsKeywords,
  fetchAppleAdsSearchTerms,
} from "@/lib/api/apple-ads";

export function AppleAdsReport() {
  const defaultFilter = useMemo(() => defaultAppleAdsFilter(), []);
  const { filter, changeFilter } = useListState(defaultFilter);

  const campaigns = useQuery({
    queryKey: ["apple-ads", "campaigns"],
    queryFn: fetchAppleAdsCampaigns,
  });

  const keywords = useQuery({
    queryKey: ["apple-ads", "keywords", filter],
    queryFn: () => fetchAppleAdsKeywords(filter),
    placeholderData: keepPreviousData,
  });

  const searchTerms = useQuery({
    queryKey: ["apple-ads", "search-terms", filter],
    queryFn: () => fetchAppleAdsSearchTerms(filter),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ReportFilters
              value={filter}
              defaultValue={defaultFilter}
              campaigns={campaigns.data ?? []}
              onChange={changeFilter}
            />
            <SyncButton startDate={filter.startDate} endDate={filter.endDate} />
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>키워드</CardTitle>
          <CardDescription>
            기간을 합산한 값입니다. 입찰가와 상태는 기간 안 가장 최근 값이고,
            Search Match 트래픽은 들어 있지 않습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuerySection
            isPending={keywords.isPending}
            error={keywords.error}
            skeletonClassName="h-64 w-full"
          >
            {keywords.data && <KeywordTable data={keywords.data} />}
          </QuerySection>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>검색어</CardTitle>
          <CardDescription>
            실제로 광고가 노출된 검색어입니다. 애플이 노출 10회 미만은 주지
            않으므로 합계가 키워드 표와 다를 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuerySection
            isPending={searchTerms.isPending}
            error={searchTerms.error}
            skeletonClassName="h-64 w-full"
          >
            {searchTerms.data && <SearchTermTable data={searchTerms.data} />}
          </QuerySection>
        </CardContent>
      </Card>
    </div>
  );
}
