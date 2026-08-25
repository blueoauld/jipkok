"use client";

import { useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QuerySection } from "@/components/query-section";
import { TablePagination } from "@/components/table-pagination";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { WorryCommentReportTable } from "@/components/worries/worry-comment-report-table";
import {
  defaultWorryReportFilter,
  WorryReportFilters,
  type WorryReportFilter,
} from "@/components/worries/worry-report-filters";
import { WorryReportTable } from "@/components/worries/worry-report-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePageGuard } from "@/hooks/use-page-guard";
import {
  fetchWorryCommentReports,
  fetchWorryReports,
  type WorryReportListParams,
} from "@/lib/api/worry-reports";

type ReportPage<T> = {
  items: T[];
  page: number;
  size: number;
  totalCount: number;
};

type Props<T> = {
  queryKey: string;
  fetchPage: (params: WorryReportListParams) => Promise<ReportPage<T>>;
  renderTable: (items: T[]) => ReactNode;
};

function ReportList<T>({ queryKey, fetchPage, renderTable }: Props<T>) {
  const [filter, setFilter] = useState(defaultWorryReportFilter);
  const [page, setPage] = useState(1);
  const authorId = useDebouncedValue(filter.authorId.trim());
  const queryFilter = { ...filter, authorId };

  const { data, isPending, error } = useQuery({
    queryKey: [queryKey, queryFilter, page],
    queryFn: () => fetchPage({ ...queryFilter, page }),
    placeholderData: keepPreviousData,
  });

  usePageGuard(page, setPage, data);

  const changeFilter = (next: WorryReportFilter) => {
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
            <WorryReportFilters value={filter} onChange={changeFilter} />
          </CardHeader>
          <CardContent>{renderTable(data.items)}</CardContent>
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

export function WorryReportList() {
  return (
    <ReportList
      queryKey="worry-reports"
      fetchPage={fetchWorryReports}
      renderTable={(items) => <WorryReportTable reports={items} />}
    />
  );
}

export function WorryCommentReportList() {
  return (
    <ReportList
      queryKey="worry-comment-reports"
      fetchPage={fetchWorryCommentReports}
      renderTable={(items) => <WorryCommentReportTable reports={items} />}
    />
  );
}
