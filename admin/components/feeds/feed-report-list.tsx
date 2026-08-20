"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  defaultFeedReportFilter,
  FeedReportFilters,
  type FeedReportFilter,
} from "@/components/feeds/feed-report-filters";
import { FeedReportTable } from "@/components/feeds/feed-report-table";
import { QuerySection } from "@/components/query-section";
import { TablePagination } from "@/components/table-pagination";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { fetchFeedReports } from "@/lib/api/feed-reports";

export function FeedReportList() {
  const [filter, setFilter] = useState(defaultFeedReportFilter);
  const [page, setPage] = useState(1);

  const { data, isPending, error } = useQuery({
    queryKey: ["feed-reports", filter, page],
    queryFn: () => fetchFeedReports({ ...filter, page }),
    placeholderData: keepPreviousData,
  });

  const changeFilter = (next: FeedReportFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <QuerySection
      isPending={isPending}
      error={error}
      skeletonClassName="h-96 w-full"
    >
      {data && (
        <Card>
          <CardHeader>
            <FeedReportFilters value={filter} onChange={changeFilter} />
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
