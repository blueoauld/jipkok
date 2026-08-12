import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatRoomKey } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { CHAT_UNREAD_COUNT_KEY } from "@/hooks/useChatUnreadCount";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type ChatRoomPage, type ChatRoomResponse } from "@/lib/api";
import { LEAVE_DESCRIPTION } from "@/lib/chat";

export function useChatRoomActions() {
  const queryClient = useQueryClient();
  const { alertElement, confirm, showApiError } = useRetroAlert();

  const apply = (roomId: number, enabled: boolean) =>
    queryClient.setQueriesData<InfiniteData<ChatRoomPage>>(
      { queryKey: CHAT_ROOMS_KEY },
      (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.roomId === roomId
                ? { ...item, notificationEnabled: enabled }
                : item,
            ),
          })),
        },
    );

  const { mutate: toggle } = useMutation({
    mutationFn: ({ roomId, enabled }: { roomId: number; enabled: boolean }) =>
      api.chats.updateNotification(roomId, enabled),
    onMutate: ({ roomId, enabled }) => apply(roomId, enabled),
    onSuccess: (_data, { roomId }) =>
      queryClient.invalidateQueries({ queryKey: chatRoomKey(roomId) }),
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      showApiError(error);
    },
  });

  const { mutate: leave } = useMutation({
    mutationFn: (roomId: number) => api.chats.leave(roomId),
    onSuccess: (_data, roomId) => {
      queryClient.removeQueries({ queryKey: chatRoomKey(roomId) });
      queryClient.removeQueries({ queryKey: chatMessagesKey(roomId) });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_COUNT_KEY });
    },
    onError: showApiError,
  });

  const toggleNotification = useCallback(
    (room: ChatRoomResponse) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggle({ roomId: room.roomId, enabled: !room.notificationEnabled });
    },
    [toggle],
  );

  const confirmLeave = useCallback(
    (room: ChatRoomResponse) =>
      confirm({
        message: LEAVE_DESCRIPTION,
        confirmLabel: "나가기",
        destructive: true,
        onConfirm: () => leave(room.roomId),
      }),
    [confirm, leave],
  );

  return { alertElement, toggleNotification, confirmLeave };
}
