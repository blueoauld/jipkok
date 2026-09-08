"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ChatRoomFilters,
  defaultChatRoomFilter,
} from "@/components/chat-rooms/chat-room-filters";
import { ChatRoomTable } from "@/components/chat-rooms/chat-room-table";
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
import { fetchChatRooms } from "@/lib/api/chat-rooms";

export function ChatRoomList() {
  const { filter, changeFilter, page, setPage } = useListState(
    defaultChatRoomFilter,
  );
  const memberId = useDebouncedValue(filter.memberId.trim());
  const queryFilter = { ...filter, memberId };

  const { data, isPending, error } = useQuery({
    queryKey: ["chat-rooms", queryFilter, page],
    queryFn: () => fetchChatRooms({ ...queryFilter, page }),
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
            <ChatRoomFilters value={filter} onChange={changeFilter} />
          </CardHeader>
          <CardContent>
            <ChatRoomTable rooms={data.items} />
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
