"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  defaultMemberReportFilter,
  MemberReportFilters,
} from "@/components/reports/member-report-filters";
import { MemberReportTable } from "@/components/reports/member-report-table";
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
import { fetchMemberReports } from "@/lib/api/reports";

export function MemberReportList() {
  const { filter, changeFilter, page, setPage } = useListState(
    defaultMemberReportFilter,
  );
  const reporterId = useDebouncedValue(filter.reporterId.trim());
  const reportedMemberId = useDebouncedValue(filter.reportedMemberId.trim());
  const queryFilter = { ...filter, reporterId, reportedMemberId };

  const { data, isPending, error } = useQuery({
    queryKey: ["reports", queryFilter, page],
    queryFn: () => fetchMemberReports({ ...queryFilter, page }),
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
            <MemberReportFilters value={filter} onChange={changeFilter} />
          </CardHeader>
          <CardContent>
            <MemberReportTable reports={data.items} />
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
