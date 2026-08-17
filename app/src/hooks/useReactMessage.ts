import {
  type InfiniteData,
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import {
  api,
  type ChatMessagePage,
  type ChatReactionResponse,
  type ChatReactionsResponse,
  type ChatReactionType,
} from "@/lib/api";
import { flattenPages, mapPages } from "@/lib/paging";

type Feed = InfiniteData<ChatMessagePage>;

export function setMessageReactions(
  queryClient: QueryClient,
  roomId: number,
  { messageId, reactions }: ChatReactionsResponse,
) {
  queryClient.setQueryData<Feed>(chatMessagesKey(roomId), (current) =>
    mapPages(current, (items) =>
      items.some((item) => item.messageId === messageId)
        ? items.map((item) =>
            item.messageId === messageId ? { ...item, reactions } : item,
          )
        : items,
    ),
  );
}

function findReactions(
  queryClient: QueryClient,
  roomId: number,
  messageId: number,
) {
  return flattenPages(
    queryClient.getQueryData<Feed>(chatMessagesKey(roomId)),
  )?.find((item) => item.messageId === messageId)?.reactions;
}

function replaceMine(
  reactions: ChatReactionResponse[],
  memberId: number,
  type: ChatReactionType | null,
) {
  const others = reactions.filter((reaction) => reaction.memberId !== memberId);

  return type ? [...others, { memberId, type }] : others;
}

export function useReactMessage(
  roomId: number,
  memberId: number,
  onError: (error: unknown) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      type,
    }: {
      messageId: number;
      type: ChatReactionType | null;
    }) =>
      type
        ? api.chats.react(roomId, messageId, type)
        : api.chats.unreact(roomId, messageId),
    onMutate: async ({ messageId, type }) => {
      await queryClient.cancelQueries({ queryKey: chatMessagesKey(roomId) });

      const previous = findReactions(queryClient, roomId, messageId);

      if (previous) {
        setMessageReactions(queryClient, roomId, {
          messageId,
          reactions: replaceMine(previous, memberId, type),
        });
      }

      return { previous };
    },
    onSuccess: (reactions) =>
      setMessageReactions(queryClient, roomId, reactions),
    onError: (error, { messageId }, context) => {
      if (context?.previous) {
        setMessageReactions(queryClient, roomId, {
          messageId,
          reactions: context.previous,
        });
      }

      onError(error);
    },
  });
}
