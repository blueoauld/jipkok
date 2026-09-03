import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import { CHAT_ROOMS_KEY, invalidateChatLists } from "@/hooks/useChatRooms";
import { CHAT_UNREAD_COUNT_KEY } from "@/hooks/useChatUnreadCount";
import { api, type ChatMessageResponse, type ChatRoomPage } from "@/lib/api";
import { mapPages } from "@/lib/paging";
import { dismissRoomNotifications } from "@/lib/push/notifications";
import { maybeRequestReview } from "@/lib/review/store";

export function useChatRoomEffects(
  roomId: number,
  messages: ChatMessageResponse[] | undefined,
  partnerId: number,
) {
  const queryClient = useQueryClient();

  // 방에 들어오자마자 목록 배지와 전체 안읽음 수를 지운다. 실제 값은 재조회가 맞춘다.
  const clearUnread = () => {
    let cleared = 0;

    queryClient.setQueriesData<InfiniteData<ChatRoomPage>>(
      { queryKey: CHAT_ROOMS_KEY },
      (current) =>
        mapPages(current, (items) =>
          items.map((item) => {
            if (item.roomId !== roomId || item.unreadCount === 0) {
              return item;
            }

            cleared = item.unreadCount;

            return { ...item, unreadCount: 0 };
          }),
        ),
    );

    if (cleared > 0) {
      queryClient.setQueryData<number>(CHAT_UNREAD_COUNT_KEY, (total) =>
        Math.max(0, (total ?? 0) - cleared),
      );
    }
  };

  const { mutate: markRead } = useMutation({
    mutationFn: (lastReadMessageId: number) =>
      api.chats.markRead(roomId, lastReadMessageId),
    networkMode: "online",
    retry: 2,
    onMutate: clearUnread,
    onSettled: () => invalidateChatLists(queryClient),
  });

  // 안읽음은 상대 메시지만 세므로 읽음 처리도 상대의 가장 새로운 메시지 기준으로 한다.
  // 내가 보낼 때마다 요청이 나가지 않고, 끊긴 사이 온 상대 메시지가 내 것보다 오래된
  // 채로 뒤늦게 나타나도 놓치지 않는다.
  const newestPartnerMessageId = useMemo(
    () =>
      messages?.find((message) => message.senderId === partnerId)?.messageId ??
      0,
    [messages, partnerId],
  );
  const markedMessageId = useRef(0);

  useEffect(() => {
    if (newestPartnerMessageId > markedMessageId.current) {
      markedMessageId.current = newestPartnerMessageId;
      markRead(newestPartnerMessageId);
    }
  }, [markRead, newestPartnerMessageId]);

  // 알림은 상대 메시지로만 생기므로 내가 보낼 때는 정리할 것이 없다.
  useEffect(() => {
    dismissRoomNotifications(roomId).catch(() => undefined);
  }, [newestPartnerMessageId, roomId]);

  // 방에 있는 동안 상대 답장이 새로 오면 평점을 요청한다. 처음 불러온 대화는 제외.
  const seenPartnerMessageId = useRef<number | null>(null);

  useEffect(() => {
    if (!messages) {
      return;
    }

    if (
      seenPartnerMessageId.current !== null &&
      newestPartnerMessageId > seenPartnerMessageId.current
    ) {
      maybeRequestReview().catch(() => undefined);
    }

    seenPartnerMessageId.current = newestPartnerMessageId;
  }, [messages, newestPartnerMessageId]);
}
