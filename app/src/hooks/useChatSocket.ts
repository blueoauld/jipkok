import {
  type InfiniteData,
  onlineManager,
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

    const prepend = async (roomId: number, message: ChatMessageResponse) => {
      const queryKey = chatMessagesKey(roomId);

      if (!queryClient.getQueryData(queryKey)) {
        await queryClient.invalidateQueries({ queryKey });

        return;
      }

      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(
        queryKey,
        (current) =>
          mapPages(current, (items, index) =>
            index === 0 &&
            !items.some((item) => item.messageId === message.messageId)
              ? [message, ...items]
              : items,
          ),
      );
    };

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

    let foreground = true;
    let online = onlineManager.isOnline();
    let connected = online;

    if (connected) {
      client.activate();
    }

    const sync = () => {
      const next = foreground && online;

      if (next === connected) {
        return;
      }

      connected = next;

      if (next) {
        client.activate();
        queryClient.invalidateQueries({ queryKey: CHAT_KEY });
      } else {
        client.deactivate();
      }
    };

    const subscription = AppState.addEventListener("change", (next) => {
      foreground = next === "active";
      sync();
    });

    const unsubscribe = onlineManager.subscribe((next) => {
      online = next;
      sync();
    });

    return () => {
      subscription.remove();
      unsubscribe();
      client.deactivate();
    };
  }, [queryClient, status]);
}
