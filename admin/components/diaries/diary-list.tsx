"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  DiaryFilters,
  defaultDiaryFilter,
} from "@/components/diaries/diary-filters";
import { DiaryTable } from "@/components/diaries/diary-table";
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
import { fetchDiaries } from "@/lib/api/diaries";

export function DiaryList() {
  const { filter, changeFilter, page, setPage } =
    useListState(defaultDiaryFilter);
  const memberId = useDebouncedValue(filter.memberId.trim());
  const queryFilter = { ...filter, memberId };

  const { data, isPending, error } = useQuery({
    queryKey: ["diaries", queryFilter, page],
    queryFn: () => fetchDiaries({ ...queryFilter, page }),
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
            <DiaryFilters value={filter} onChange={changeFilter} />
          </CardHeader>
          <CardContent>
            <DiaryTable diaries={data.items} />
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
