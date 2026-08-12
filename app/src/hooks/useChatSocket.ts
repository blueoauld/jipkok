import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatRoomKey } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { CHAT_UNREAD_COUNT_KEY } from "@/hooks/useChatUnreadCount";
import type { ChatMessagePage, ChatMessageResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";
import { type ChatEvent, createChatSocket } from "@/lib/chat-socket";
import { useDeletedRoomStore } from "@/lib/chat-store";

const CHAT_KEY = ["chats"];

export function useChatSocket() {
  const status = useAuthStore((state) => state.status);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const prepend = (roomId: number, message: ChatMessageResponse) =>
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(
        chatMessagesKey(roomId),
        (current) =>
          current && {
            ...current,
            pages: current.pages.map((page, index) =>
              index === 0 ? { ...page, items: [message, ...page.items] } : page,
            ),
          },
      );

    const handle = (event: ChatEvent) => {
      if (event.type === "MESSAGE") {
        prepend(event.roomId, event.message);
      } else {
        useDeletedRoomStore.getState().markDeleted(event.roomId);
        queryClient.removeQueries({ queryKey: chatRoomKey(event.roomId) });
        queryClient.removeQueries({ queryKey: chatMessagesKey(event.roomId) });
      }

      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_COUNT_KEY });
    };

    const client = createChatSocket(handle);

    client.activate();

    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        client.activate();
        queryClient.invalidateQueries({ queryKey: CHAT_KEY });
      } else {
        client.deactivate();
      }
    });

    return () => {
      subscription.remove();
      client.deactivate();
    };
  }, [queryClient, status]);
}
