"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ActionTable } from "@/components/apple-ads/action-table";
import { QuerySection } from "@/components/query-section";
import { TablePagination } from "@/components/table-pagination";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useListState } from "@/hooks/use-list-state";
import { usePageGuard } from "@/hooks/use-page-guard";
import { fetchAppleAdsActions } from "@/lib/api/apple-ads";

const noFilter = {};

export function ActionList() {
  const { page, setPage } = useListState(noFilter);

  const { data, isPending, error } = useQuery({
    queryKey: ["apple-ads", "actions", page],
    queryFn: () => fetchAppleAdsActions(page),
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
          <CardContent>
            <ActionTable actions={data.items} />
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
