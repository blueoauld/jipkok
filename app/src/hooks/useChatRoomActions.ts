import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

import { chatRoomKey, removeRoomQueries } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY, invalidateChatLists } from "@/hooks/useChatRooms";
import type { RetroAlertApi } from "@/hooks/useRetroAlert";
import { api, type ChatRoomPage, type ChatRoomResponse } from "@/lib/api";
import {
  LEAVE_DESCRIPTION,
  LEAVE_SELECTED_DESCRIPTION,
  toBulkChunks,
} from "@/lib/chat";
import i18n from "@/lib/i18n";
import { mapPages } from "@/lib/paging";
import { showToast } from "@/lib/toast/store";

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
        mapPages(current, (items) =>
          items.map((item) =>
            item.roomId === roomId
              ? { ...item, notificationEnabled: enabled }
              : item,
          ),
        ),
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

  const { mutate: pin } = useMutation({
    mutationFn: ({ roomId, enabled }: { roomId: number; enabled: boolean }) =>
      api.chats.updatePin(roomId, enabled),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: chatRoomKey(roomId) });
      invalidateChatLists(queryClient);
    },
    onError: showApiError,
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
          mapPages(current, (items) =>
            items.filter((item) => item.roomId !== roomId),
          ),
      );

      return { previous };
    },
    onSuccess: (_data, roomId) => {
      removeRoomQueries(queryClient, roomId);
      invalidateChatLists(queryClient);
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
      roomIds.forEach((roomId) => removeRoomQueries(queryClient, roomId));
      invalidateChatLists(queryClient);
    },
    onError: showApiError,
  });

  const { mutate: read } = useMutation({
    mutationFn: (roomId: number) => api.chats.markAllRead([roomId]),
    onMutate: async (roomId: number) => {
      await queryClient.cancelQueries({ queryKey: CHAT_ROOMS_KEY });

      const previous = queryClient.getQueriesData<InfiniteData<ChatRoomPage>>({
        queryKey: CHAT_ROOMS_KEY,
      });

      queryClient.setQueriesData<InfiniteData<ChatRoomPage>>(
        { queryKey: CHAT_ROOMS_KEY },
        (current) =>
          mapPages(current, (items) =>
            items.map((item) =>
              item.roomId === roomId ? { ...item, unreadCount: 0 } : item,
            ),
          ),
      );

      return { previous };
    },
    onSuccess: (_data, roomId) => {
      queryClient.invalidateQueries({ queryKey: chatRoomKey(roomId) });
      invalidateChatLists(queryClient);
      showToast("info", i18n.t("chat.list.markedRead"));
    },
    onError: (error, _roomId, context) => {
      context?.previous.forEach(([queryKey, data]) =>
        queryClient.setQueryData(queryKey, data),
      );
      showApiError(error);
    },
  });

  const { mutate: markAllRead, isPending: markingRoomsRead } = useMutation({
    mutationFn: (roomIds: number[]) =>
      runInChunks(roomIds, api.chats.markAllRead),
    onSuccess: (_data, roomIds) => {
      roomIds.forEach((roomId) =>
        queryClient.invalidateQueries({ queryKey: chatRoomKey(roomId) }),
      );
      invalidateChatLists(queryClient);
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

  const togglePin = useCallback(
    (room: ChatRoomResponse) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      pin({ roomId: room.roomId, enabled: !room.pinned });
    },
    [pin],
  );

  const confirmLeave = useCallback(
    (room: ChatRoomResponse, onLeft?: () => void) =>
      confirm({
        message: LEAVE_DESCRIPTION,
        confirmLabel: i18n.t("action.leave"),
        destructive: true,
        onConfirm: () => leave(room.roomId, { onSuccess: onLeft }),
      }),
    [confirm, leave],
  );

  const markRoomRead = useCallback(
    (room: ChatRoomResponse) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      read(room.roomId);
    },
    [read],
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
        confirmLabel: i18n.t("action.leave"),
        destructive: true,
        onConfirm: () => leaveAll(roomIds, { onSuccess: onDone }),
      }),
    [confirm, leaveAll],
  );

  return {
    toggleNotification,
    togglePin,
    markRoomRead,
    confirmLeave,
    markRoomsRead,
    confirmLeaveRooms,
    bulkPending: leavingRooms || markingRoomsRead,
  };
}
