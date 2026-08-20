"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  defaultMemberReportFilter,
  MemberReportFilters,
  type MemberReportFilter,
} from "@/components/reports/member-report-filters";
import { MemberReportTable } from "@/components/reports/member-report-table";
import { QuerySection } from "@/components/query-section";
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
  const [filter, setFilter] = useState(defaultMemberReportFilter);
  const [page, setPage] = useState(1);

  const { data, isPending, error } = useQuery({
    queryKey: ["reports", filter, page],
    queryFn: () => fetchMemberReports({ ...filter, page }),
    placeholderData: keepPreviousData,
  });

  usePageGuard(page, setPage, data);

  const changeFilter = (next: MemberReportFilter) => {
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
