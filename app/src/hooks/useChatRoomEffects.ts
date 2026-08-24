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

  // 전역 기본값은 즉시 실패지만 이건 멈춰 뒀다 연결되면 보낸다. 아래에서 markedMessageId를
  // 먼저 올리기 때문에, 실패하면 그 메시지의 읽음 표시가 다시 시도되지 않고 사라진다.
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
