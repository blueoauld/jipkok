"use client";

import { useState } from "react";
import {
  defaultMemberReportFilter,
  MemberReportFilters,
  type MemberReportFilter,
} from "@/components/reports/member-report-filters";
import { MemberReportTable } from "@/components/reports/member-report-table";
import { TablePagination } from "@/components/table-pagination";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { MemberReport } from "@/lib/types";

const PAGE_SIZE = 20;

type Props = {
  reports: MemberReport[];
};

export function MemberReportList({ reports }: Props) {
  const [filter, setFilter] = useState(defaultMemberReportFilter);
  const [page, setPage] = useState(1);

  const filtered = reports.filter((report) => matches(report, filter));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeFilter = (next: MemberReportFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <MemberReportFilters value={filter} onChange={changeFilter} />
      </CardHeader>
      <CardContent>
        <MemberReportTable reports={pageItems} />
      </CardContent>
      <CardFooter className="bg-transparent">
        <TablePagination
          page={page}
          size={PAGE_SIZE}
          totalCount={filtered.length}
          onPageChange={setPage}
        />
      </CardFooter>
    </Card>
  );
}

function matches(report: MemberReport, filter: MemberReportFilter) {
  if (filter.status === "PENDING" && report.handledAt) return false;
  if (filter.status === "HANDLED" && !report.handledAt) return false;
  if (filter.type !== "ALL" && report.type !== filter.type) return false;
  if (filter.reason !== "ALL" && report.reason !== filter.reason) return false;
  if (
    filter.reportedMemberId &&
    report.reportedMemberId !== Number(filter.reportedMemberId)
  ) {
    return false;
  }
  return true;
}
