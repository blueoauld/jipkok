import {
  type InfiniteData,
  type QueryClient,
  useQueryClient,
} from "@tanstack/react-query";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import type {
  ChatMessagePage,
  ChatMessageResponse,
  ChatRoomPage,
} from "@/lib/api";
import { raiseToSectionTop } from "@/lib/chat/outgoing";
import { mapPages } from "@/lib/paging";

type Feed = InfiniteData<ChatMessagePage>;

function updateFeed(
  queryClient: QueryClient,
  roomId: number,
  update: (items: ChatMessageResponse[]) => ChatMessageResponse[],
) {
  queryClient.setQueryData<Feed>(chatMessagesKey(roomId), (current) =>
    mapPages(current, (items, index) => (index === 0 ? update(items) : items)),
  );
}

export type ChatFeedCache = ReturnType<typeof useChatFeedCache>;

export function useChatFeedCache(roomId: number) {
  const queryClient = useQueryClient();

  // 목록 미리보기를 낙관적으로 바꾸고, 1페이지 안에서만 자기 섹션(고정/일반) 맨 위로
  // 올린다. 다른 페이지의 방은 커서가 어긋나지 않게 문구만 바꾸고 재조회가 옮긴다.
  const previewRooms = (message: ChatMessageResponse) =>
    queryClient.setQueriesData<InfiniteData<ChatRoomPage>>(
      { queryKey: CHAT_ROOMS_KEY },
      (current) =>
        mapPages(current, (items, index) => {
          const updated = items.map((item) =>
            item.roomId === roomId
              ? {
                  ...item,
                  lastMessageType: message.type,
                  lastMessageContent: message.content,
                  lastMessageAt: message.createdAt,
                }
              : item,
          );

          return index === 0 ? raiseToSectionTop(updated, roomId) : updated;
        }),
    );

  const prepend = async (message: ChatMessageResponse) => {
    await queryClient.cancelQueries({ queryKey: chatMessagesKey(roomId) });
    updateFeed(queryClient, roomId, (items) => [message, ...items]);
    previewRooms(message);
  };

  const replace = (temp: ChatMessageResponse, message: ChatMessageResponse) =>
    updateFeed(queryClient, roomId, (items) =>
      items.some((item) => item.clientMessageId === temp.clientMessageId)
        ? items.map((item) =>
            item.clientMessageId === temp.clientMessageId ? message : item,
          )
        : [message, ...items],
    );

  const discard = (tempIds: number[]) =>
    updateFeed(queryClient, roomId, (items) =>
      items.filter((item) => !tempIds.includes(item.messageId)),
    );

  const refreshRooms = () =>
    queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });

  return { prepend, replace, discard, refreshRooms };
}
