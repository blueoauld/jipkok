"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  defaultMemberFilter,
  MemberFilters,
} from "@/components/members/member-filters";
import { MemberTable } from "@/components/members/member-table";
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
import { fetchMembers } from "@/lib/api/members";

export function MemberList() {
  const { filter, changeFilter, page, setPage } =
    useListState(defaultMemberFilter);
  const keyword = useDebouncedValue(filter.keyword.trim());
  const queryFilter = { ...filter, keyword };

  const { data, isPending, error } = useQuery({
    queryKey: ["members", queryFilter, page],
    queryFn: () => fetchMembers({ ...queryFilter, page }),
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
            <MemberFilters value={filter} onChange={changeFilter} />
          </CardHeader>
          <CardContent>
            <MemberTable members={data.items} />
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
