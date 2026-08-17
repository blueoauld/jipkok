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
import type { RetroAlertApi } from "@/hooks/useRetroAlert";
import { api, type ChatRoomPage, type ChatRoomResponse } from "@/lib/api";
import {
  LEAVE_DESCRIPTION,
  LEAVE_SELECTED_DESCRIPTION,
  toBulkChunks,
} from "@/lib/chat";

async function runInChunks(
  roomIds: number[],
  send: (chunk: number[]) => Promise<void>,
) {
  for (const chunk of toBulkChunks(roomIds)) {
    await send(chunk);
  }
}

export function useChatRoomActions({ confirm, showApiError }: RetroAlertApi) {
  const queryClient = useQueryClient();

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
    onMutate: async (roomId: number) => {
      await queryClient.cancelQueries({ queryKey: CHAT_ROOMS_KEY });

      const previous = queryClient.getQueriesData<InfiniteData<ChatRoomPage>>({
        queryKey: CHAT_ROOMS_KEY,
      });

      queryClient.setQueriesData<InfiniteData<ChatRoomPage>>(
        { queryKey: CHAT_ROOMS_KEY },
        (current) =>
          current && {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.roomId !== roomId),
            })),
          },
      );

      return { previous };
    },
    onSuccess: (_data, roomId) => {
      queryClient.removeQueries({ queryKey: chatRoomKey(roomId) });
      queryClient.removeQueries({ queryKey: chatMessagesKey(roomId) });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_COUNT_KEY });
    },
    onError: (error, _roomId, context) => {
      context?.previous.forEach(([queryKey, data]) =>
        queryClient.setQueryData(queryKey, data),
      );
      showApiError(error);
    },
  });

  const { mutate: leaveAll, isPending: leavingRooms } = useMutation({
    mutationFn: (roomIds: number[]) => runInChunks(roomIds, api.chats.leaveAll),
    onSuccess: (_data, roomIds) => {
      roomIds.forEach((roomId) => {
        queryClient.removeQueries({ queryKey: chatRoomKey(roomId) });
        queryClient.removeQueries({ queryKey: chatMessagesKey(roomId) });
      });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_COUNT_KEY });
    },
    onError: showApiError,
  });

  const { mutate: markAllRead, isPending: markingRoomsRead } = useMutation({
    mutationFn: (roomIds: number[]) =>
      runInChunks(roomIds, api.chats.markAllRead),
    onSuccess: (_data, roomIds) => {
      roomIds.forEach((roomId) =>
        queryClient.invalidateQueries({ queryKey: chatRoomKey(roomId) }),
      );
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
    (room: ChatRoomResponse, onLeft?: () => void) =>
      confirm({
        message: LEAVE_DESCRIPTION,
        confirmLabel: "나가기",
        destructive: true,
        onConfirm: () => leave(room.roomId, { onSuccess: onLeft }),
      }),
    [confirm, leave],
  );

  const markRoomsRead = useCallback(
    (roomIds: number[], onDone: () => void) =>
      markAllRead(roomIds, { onSuccess: onDone }),
    [markAllRead],
  );

  const confirmLeaveRooms = useCallback(
    (roomIds: number[], onDone: () => void) =>
      confirm({
        message: LEAVE_SELECTED_DESCRIPTION,
        confirmLabel: "나가기",
        destructive: true,
        onConfirm: () => leaveAll(roomIds, { onSuccess: onDone }),
      }),
    [confirm, leaveAll],
  );

  return {
    toggleNotification,
    confirmLeave,
    markRoomsRead,
    confirmLeaveRooms,
    bulkPending: leavingRooms || markingRoomsRead,
  };
}
