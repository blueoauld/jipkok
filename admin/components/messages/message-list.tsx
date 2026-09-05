"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CursorPagination } from "@/components/cursor-pagination";
import {
  defaultMessageFilter,
  MessageFilters,
  type MessageFilter,
} from "@/components/messages/message-filters";
import { MessageTable } from "@/components/messages/message-table";
import { QuerySection } from "@/components/query-section";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useCursorPages } from "@/hooks/use-cursor-pages";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListState } from "@/hooks/use-list-state";
import { fetchMessages } from "@/lib/api/messages";

export function MessageList() {
  const { filter, changeFilter } = useListState(defaultMessageFilter);
  const pages = useCursorPages();
  const to = useDebouncedValue(filter.to.trim());
  const queryFilter = { ...filter, to };

  const { data, isPending, error } = useQuery({
    queryKey: ["messages", queryFilter, pages.startKey],
    queryFn: () => fetchMessages({ ...queryFilter, startKey: pages.startKey }),
    placeholderData: keepPreviousData,
  });

  const change = (next: MessageFilter) => {
    changeFilter(next);
    pages.reset();
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
            <MessageFilters value={filter} onChange={change} />
          </CardHeader>
          <CardContent>
            <MessageTable messages={data.items} />
          </CardContent>
          <CardFooter className="bg-transparent">
            <CursorPagination
              hasPrevious={pages.hasPrevious}
              hasNext={data.nextKey != null}
              onPrevious={pages.previous}
              onNext={() => data.nextKey && pages.next(data.nextKey)}
            />
          </CardFooter>
        </Card>
      )}
    </QuerySection>
  );
}
