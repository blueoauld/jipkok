import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import { invalidateChatLists } from "@/hooks/useChatRooms";
import { api, type ChatMessageResponse } from "@/lib/api";
import { dismissRoomNotifications } from "@/lib/push/notifications";
import { maybeRequestReview } from "@/lib/review/store";

export function useChatRoomEffects(
  roomId: number,
  messages: ChatMessageResponse[] | undefined,
  partnerId: number,
) {
  const queryClient = useQueryClient();

  const { mutate: markRead } = useMutation({
    mutationFn: (lastReadMessageId: number) =>
      api.chats.markRead(roomId, lastReadMessageId),
    networkMode: "online",
    onSuccess: () => invalidateChatLists(queryClient),
  });

  const newestMessageId = messages?.[0]?.messageId ?? 0;
  const markedMessageId = useRef(0);

  useEffect(() => {
    if (newestMessageId > markedMessageId.current) {
      markedMessageId.current = newestMessageId;
      markRead(newestMessageId);
    }
  }, [markRead, newestMessageId]);

  // 알림은 상대 메시지로만 생기므로 내가 보낼 때는 정리할 것이 없다.
  const newestPartnerMessageId = useMemo(
    () =>
      messages?.find((message) => message.senderId === partnerId)?.messageId ??
      0,
    [messages, partnerId],
  );

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
