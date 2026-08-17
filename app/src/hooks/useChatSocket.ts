import {
  type InfiniteData,
  type QueryClient,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatRoomKey } from "@/hooks/useChatRoom";
import { invalidateChatLists } from "@/hooks/useChatRooms";
import { setMessageReactions } from "@/hooks/useReactMessage";
import type { ChatMessagePage, ChatMessageResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";
import { type ChatEvent, createChatSocket } from "@/lib/chat/socket";
import { useDeletedRoomStore } from "@/lib/chat/store";
import { mapPages } from "@/lib/paging";

const CHAT_KEY = ["chats"];

export function forgetRoom(queryClient: QueryClient, roomId: number) {
  useDeletedRoomStore.getState().markDeleted(roomId);
  queryClient.removeQueries({ queryKey: chatRoomKey(roomId) });
  queryClient.removeQueries({ queryKey: chatMessagesKey(roomId) });
  invalidateChatLists(queryClient);
}

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
          mapPages(current, (items, index) =>
            index === 0 ? [message, ...items] : items,
          ),
      );

    const handle = (event: ChatEvent) => {
      if (event.type === "REACTION") {
        setMessageReactions(queryClient, event.roomId, event.reaction);
        return;
      }

      if (event.type === "ROOM_DELETED") {
        forgetRoom(queryClient, event.roomId);
        return;
      }

      prepend(event.roomId, event.message);
      invalidateChatLists(queryClient);
    };

    const client = createChatSocket(handle, () =>
      queryClient.invalidateQueries({ queryKey: CHAT_KEY }),
    );

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
