"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AiMemberFilters,
  defaultAiMemberFilter,
} from "@/components/ai-members/ai-member-filters";
import { AiMemberTable } from "@/components/ai-members/ai-member-table";
import { QuerySection } from "@/components/query-section";
import { TablePagination } from "@/components/table-pagination";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListState } from "@/hooks/use-list-state";
import { usePageGuard } from "@/hooks/use-page-guard";
import { fetchAiMembers } from "@/lib/api/ai-members";
import { formatCount } from "@/lib/format";

export function AiMemberList() {
  const { filter, changeFilter, page, setPage } = useListState(
    defaultAiMemberFilter,
  );
  const keyword = useDebouncedValue(filter.keyword.trim());
  const queryFilter = { ...filter, keyword };

  const { data, isPending, error } = useQuery({
    queryKey: ["ai-members", queryFilter, page],
    queryFn: () => fetchAiMembers({ ...queryFilter, page }),
    placeholderData: keepPreviousData,
  });

  usePageGuard(page, setPage, data);

  return (
    <QuerySection
      isPending={isPending}
      error={error}
      skeletonClassName="h-96 w-full"
    >
      {data && (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <AiMemberFilters value={filter} onChange={changeFilter} />
            <p className="text-sm text-muted-foreground">
              오늘 전체 응답 {formatCount(data.todayTotal.replyCount)} /{" "}
              {formatCount(data.globalDailyLimit)}, 토큰{" "}
              {formatCount(data.todayTotal.tokenCount)} (캐시{" "}
              {formatCount(data.todayTotal.cachedTokenCount)}), 인사{" "}
              {formatCount(data.todayTotal.greetingCount)} /{" "}
              {formatCount(data.globalDailyGreetingLimit)} (답장{" "}
              {formatCount(data.todayTotal.greetingReplyCount)})
            </p>
          </CardHeader>
          <CardContent>
            <AiMemberTable members={data.items} />
          </CardContent>
          <CardFooter className="bg-transparent">
            <TablePagination
              page={data.page}
              size={data.size}
              totalCount={data.totalCount}
              onPageChange={setPage}
            />
          </CardFooter>
        </Card>
      )}
    </QuerySection>
  );
}
