"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FeedReportTable } from "@/components/feeds/feed-report-table";
import {
  defaultPostReportFilter,
  PostReportFilters,
} from "@/components/post-report-filters";
import { QuerySection } from "@/components/query-section";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListState } from "@/hooks/use-list-state";
import { usePageGuard } from "@/hooks/use-page-guard";
import { TablePagination } from "@/components/table-pagination";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { fetchFeedReports } from "@/lib/api/feed-reports";

export function FeedReportList() {
  const { filter, changeFilter, page, setPage } = useListState(
    defaultPostReportFilter,
  );
  const authorId = useDebouncedValue(filter.authorId.trim());
  const queryFilter = { ...filter, authorId };

  const { data, isPending, error } = useQuery({
    queryKey: ["feed-reports", queryFilter, page],
    queryFn: () => fetchFeedReports({ ...queryFilter, page }),
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
          <CardHeader>
            <PostReportFilters value={filter} onChange={changeFilter} />
          </CardHeader>
          <CardContent>
            <FeedReportTable reports={data.items} />
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
