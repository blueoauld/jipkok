import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { alertApiError } from "@/lib/alert";
import {
  api,
  type ChatMessagePage,
  type ChatMessageResponse,
  type SendMessageRequest,
} from "@/lib/api";
import { uploadChatPhoto } from "@/lib/photo";

export function useSendMessage(roomId: number) {
  const queryClient = useQueryClient();

  const send = useMutation({
    mutationFn: (body: SendMessageRequest) => api.chats.send(roomId, body),
    onSuccess: (message) => {
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
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
    },
    onError: alertApiError,
  });

  const sendPhotos = useMutation({
    // 사진은 한 장에 메시지 하나이므로 순서가 뒤집히지 않게 차례로 보낸다.
    mutationFn: async (assets: ImagePickerAsset[]) => {
      const sent: ChatMessageResponse[] = [];

      for (const asset of assets) {
        const objectKey = await uploadChatPhoto(asset);

        sent.push(await api.chats.send(roomId, { type: "PHOTO", objectKey }));
      }

      return sent;
    },
    onSuccess: (messages) => {
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(
        chatMessagesKey(roomId),
        (current) =>
          current && {
            ...current,
            pages: current.pages.map((page, index) =>
              index === 0
                ? { ...page, items: [...messages].reverse().concat(page.items) }
                : page,
            ),
          },
      );
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
    },
    onError: alertApiError,
  });

  return {
    sendText: (content: string) => send.mutate({ type: "TEXT", content }),
    sendPhotos: sendPhotos.mutate,
    uploading: sendPhotos.isPending,
  };
}
