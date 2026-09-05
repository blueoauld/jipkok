"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  defaultSuspensionFilter,
  SuspensionFilters,
} from "@/components/suspensions/suspension-filters";
import { SuspensionTable } from "@/components/suspensions/suspension-table";
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
import { fetchSuspensions } from "@/lib/api/suspensions";

export function SuspensionList() {
  const { filter, changeFilter, page, setPage } = useListState(
    defaultSuspensionFilter,
  );
  const memberId = useDebouncedValue(filter.memberId.trim());
  const queryFilter = { ...filter, memberId };

  const { data, isPending, error } = useQuery({
    queryKey: ["suspensions", queryFilter, page],
    queryFn: () => fetchSuspensions({ ...queryFilter, page }),
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
            <SuspensionFilters value={filter} onChange={changeFilter} />
          </CardHeader>
          <CardContent>
            <SuspensionTable suspensions={data.items} />
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
