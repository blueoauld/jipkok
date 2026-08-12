import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { api, type ChatMessagePage, type ChatMessageResponse } from "@/lib/api";

export function useSendMessage(
  roomId: number,
  onError: (error: unknown) => void,
) {
  const queryClient = useQueryClient();

  const prepend = (message: ChatMessageResponse) =>
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

  return useMutation({
    mutationFn: (content: string) =>
      api.chats.send(roomId, { type: "TEXT", content }),
    onSuccess: (message) => {
      prepend(message);
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
    },
    onError,
  });
}
