import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatRoomKey } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import type { ChatMessagePage, ChatMessageResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";
import { createChatSocket } from "@/lib/chat/socket";
import { useDeletedRoomStore } from "@/lib/chat/store";

type ChatEvent = {
  type: "MESSAGE" | "ROOM_DELETED";
  roomId: number;
  message?: ChatMessageResponse | null;
};

export function useChatSocket() {
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const client = createChatSocket({
      // 끊긴 동안 놓친 이벤트는 다시 오지 않으므로 붙을 때마다 목록을 맞춘다.
      onConnect: () =>
        queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY }),
      onEvent: (received) => {
        const event = received as ChatEvent;

        if (event.type === "ROOM_DELETED") {
          queryClient.removeQueries({
            queryKey: chatMessagesKey(event.roomId),
          });
          useDeletedRoomStore.getState().markDeleted(event.roomId);
        } else if (event.message) {
          appendMessage(queryClient, event.roomId, event.message);
          queryClient.invalidateQueries({
            queryKey: chatRoomKey(event.roomId),
          });
        }

        queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      },
    });

    if (AppState.currentState === "active") {
      client.activate();
    }

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        client.activate();
      } else if (state === "background") {
        client.deactivate();
      }
    });

    return () => {
      subscription.remove();
      client.deactivate();
    };
  }, [queryClient, status]);
}

function appendMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  roomId: number,
  message: ChatMessageResponse,
) {
  queryClient.setQueryData<InfiniteData<ChatMessagePage>>(
    chatMessagesKey(roomId),
    (current) =>
      current && {
        ...current,
        pages: current.pages.map((page, index) =>
          index === 0 &&
          !page.items.some((it) => it.messageId === message.messageId)
            ? { ...page, items: [message, ...page.items] }
            : page,
        ),
      },
  );
}
