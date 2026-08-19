"use client";

import { useState } from "react";
import {
  defaultSuspensionFilter,
  SuspensionFilters,
  type SuspensionFilter,
} from "@/components/suspensions/suspension-filters";
import { SuspensionTable } from "@/components/suspensions/suspension-table";
import { TablePagination } from "@/components/table-pagination";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { Suspension } from "@/lib/types";

const PAGE_SIZE = 20;

type Props = {
  suspensions: Suspension[];
};

export function SuspensionList({ suspensions }: Props) {
  const [filter, setFilter] = useState(defaultSuspensionFilter);
  const [page, setPage] = useState(1);

  const filtered = suspensions.filter((s) => matches(s, filter));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeFilter = (next: SuspensionFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <SuspensionFilters value={filter} onChange={changeFilter} />
      </CardHeader>
      <CardContent>
        <SuspensionTable suspensions={pageItems} />
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

function matches(suspension: Suspension, filter: SuspensionFilter) {
  if (filter.status !== "ALL" && suspension.status !== filter.status)
    return false;
  if (filter.type !== "ALL" && suspension.type !== filter.type) return false;
  if (filter.memberId && suspension.memberId !== Number(filter.memberId)) {
    return false;
  }
  return true;
}
