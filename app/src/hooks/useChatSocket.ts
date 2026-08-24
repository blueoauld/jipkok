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

    // 앱이 앞에 있고 연결도 있을 때만 붙여 둔다. 연결이 없는 동안 켜 두면 STOMP가
    // 고정 주기로 헛되이 재연결을 시도하고, 돌아왔을 때도 그 주기만큼 기다리게 된다.
    // AppState.currentState는 콜드 스타트에서 아직 "active"가 아닐 수 있어 마운트 판단에
    // 쓸 수 없다. 훅이 도는 시점은 앱이 떠 있는 때이므로 앞에 있다고 보고 시작한다.
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
