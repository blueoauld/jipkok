import {
  type InfiniteData,
  replaceEqualDeep,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { api, type ChatMessagePage } from "@/lib/api";
import { CHATS_KEY } from "@/lib/chat";
import { useUploadStore } from "@/lib/chat/upload-store";
import { useFlatItems } from "@/lib/paging";

type Feed = InfiniteData<ChatMessagePage>;

export function chatMessagesKey(roomId: number) {
  return [...CHATS_KEY, "messages", roomId];
}

// 새 데이터로 갈아끼울 때 업로드가 진행 중인 낙관적 메시지를 지우지 않는다.
export function keepUploadingMessages(oldData: unknown, newData: unknown) {
  const previous = oldData as Feed | undefined;
  const next = newData as Feed;

  return replaceEqualDeep(previous, withPendingUploads(previous, next));
}

function withPendingUploads(previous: Feed | undefined, next: Feed): Feed {
  const nextFirst = next.pages[0]?.items;

  if (!previous || !nextFirst) {
    return next;
  }

  const uploads = useUploadStore.getState().uploads;
  const pending = (previous.pages[0]?.items ?? []).filter(
    (message) =>
      message.messageId < 0 &&
      message.clientMessageId != null &&
      uploads[message.clientMessageId] !== undefined &&
      !nextFirst.some(
        (item) => item.clientMessageId === message.clientMessageId,
      ),
  );

  if (pending.length === 0) {
    return next;
  }

  return {
    ...next,
    pages: next.pages.map((page, index) =>
      index === 0 ? { ...page, items: [...pending, ...page.items] } : page,
    ),
  };
}

export function useChatMessages(roomId: number, enabled = true) {
  const query = useInfiniteQuery({
    enabled,
    queryKey: chatMessagesKey(roomId),
    queryFn: ({ pageParam }) =>
      api.chats.messages(roomId, { cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: ChatMessagePage) => page.nextCursor,
    structuralSharing: keepUploadingMessages,
  });

  const messages = useFlatItems(query.data);

  return { ...query, messages };
}
