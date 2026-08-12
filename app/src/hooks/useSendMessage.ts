import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { api, type ChatMessagePage, type ChatMessageResponse } from "@/lib/api";
import { uploadChatPhoto } from "@/lib/photo";

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

  const refreshRooms = () =>
    queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });

  const sendText = useMutation({
    mutationFn: (content: string) =>
      api.chats.send(roomId, { type: "TEXT", content }),
    onSuccess: prepend,
    onError,
    onSettled: refreshRooms,
  });

  const sendPhotos = useMutation({
    mutationFn: async (assets: ImagePickerAsset[]) => {
      for (const asset of assets) {
        const objectKey = await uploadChatPhoto(asset);

        prepend(await api.chats.send(roomId, { type: "PHOTO", objectKey }));
      }
    },
    onError,
    onSettled: refreshRooms,
  });

  return {
    sendText: sendText.mutate,
    sendPhotos: sendPhotos.mutate,
    sending: sendText.isPending,
    uploading: sendPhotos.isPending,
  };
}
