"use client";

import { useState } from "react";
import {
  defaultFeedReportFilter,
  FeedReportFilters,
  type FeedReportFilter,
} from "@/components/feeds/feed-report-filters";
import { FeedReportTable } from "@/components/feeds/feed-report-table";
import { TablePagination } from "@/components/table-pagination";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { FeedReport } from "@/lib/types";

const PAGE_SIZE = 20;

type Props = {
  reports: FeedReport[];
};

export function FeedReportList({ reports }: Props) {
  const [filter, setFilter] = useState(defaultFeedReportFilter);
  const [page, setPage] = useState(1);

  const filtered = reports.filter((report) => matches(report, filter));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeFilter = (next: FeedReportFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <FeedReportFilters value={filter} onChange={changeFilter} />
      </CardHeader>
      <CardContent>
        <FeedReportTable reports={pageItems} />
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

function matches(report: FeedReport, filter: FeedReportFilter) {
  if (filter.status === "ACTIVE" && report.postDeletedAt) return false;
  if (filter.status === "DELETED" && !report.postDeletedAt) return false;
  if (filter.authorId && report.authorId !== Number(filter.authorId)) {
    return false;
  }
  return true;
}
