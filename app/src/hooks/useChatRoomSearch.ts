import { useInfiniteQuery } from "@tanstack/react-query";

import { api, type ChatRoomPage } from "@/lib/api";

export function useChatRoomSearch(keyword: string) {
  const enabled = keyword.length > 0;

  const query = useInfiniteQuery({
    enabled,
    queryKey: ["chats", "search", keyword],
    queryFn: ({ pageParam }) =>
      api.chats.search({ keyword, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: ChatRoomPage) => page.nextCursor,
  });

  return {
    ...query,
    enabled,
    rooms: enabled ? query.data?.pages.flatMap((page) => page.items) : [],
  };
}
