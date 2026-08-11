import {
  type InfiniteData,
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { api, type ChatMessagePage, type ChatMessageResponse } from "@/lib/api";
import { uploadChatPhoto } from "@/lib/photo";

type Feed = InfiniteData<ChatMessagePage>;

// 보낸 메시지를 즉시 그리기 위한 자리표시자다. 서버 id는 양수라 음수면 절대 겹치지 않는다.
let lastTempId = 0;

function createTemp(
  senderId: number,
  message: Pick<ChatMessageResponse, "type" | "content" | "imageUrl">,
): ChatMessageResponse {
  return {
    messageId: --lastTempId,
    roomId: 0,
    senderId,
    createdAt: new Date().toISOString(),
    replyMessage: null,
    ...message,
  };
}

function updateFeed(
  queryClient: QueryClient,
  roomId: number,
  update: (items: ChatMessageResponse[]) => ChatMessageResponse[],
) {
  queryClient.setQueryData<Feed>(
    chatMessagesKey(roomId),
    (current) =>
      current && {
        ...current,
        pages: current.pages.map((page, index) =>
          index === 0 ? { ...page, items: update(page.items) } : page,
        ),
      },
  );
}

export function useSendMessage(
  roomId: number,
  senderId: number,
  onError: (error: unknown) => void,
) {
  const queryClient = useQueryClient();

  const prepend = (messages: ChatMessageResponse[]) =>
    updateFeed(queryClient, roomId, (items) => [...messages, ...items]);

  const replace = (tempId: number, message: ChatMessageResponse) =>
    updateFeed(queryClient, roomId, (items) =>
      items.map((item) => (item.messageId === tempId ? message : item)),
    );

  const discard = (tempIds: number[]) =>
    updateFeed(queryClient, roomId, (items) =>
      items.filter((item) => !tempIds.includes(item.messageId)),
    );

  const refreshRooms = () =>
    queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });

  const sendText = useMutation({
    mutationFn: ({
      content,
    }: {
      content: string;
      temp: ChatMessageResponse;
    }) => api.chats.send(roomId, { type: "TEXT", content }),
    onMutate: ({ temp }) => prepend([temp]),
    onSuccess: (message, { temp }) => replace(temp.messageId, message),
    onError: (error, { temp }) => {
      discard([temp.messageId]);
      onError(error);
    },
    onSettled: refreshRooms,
  });

  const sendPhotos = useMutation({
    // 사진은 한 장에 메시지 하나이므로 순서가 뒤집히지 않게 차례로 보낸다.
    mutationFn: async ({
      assets,
      temps,
    }: {
      assets: ImagePickerAsset[];
      temps: ChatMessageResponse[];
    }) => {
      for (const [index, asset] of assets.entries()) {
        const objectKey = await uploadChatPhoto(asset);
        const sent = await api.chats.send(roomId, { type: "PHOTO", objectKey });

        // 서명 URL로 바꾸면 이미 그려둔 사진이 다시 받아지며 깜빡이므로 로컬 경로를 유지한다.
        replace(temps[index].messageId, { ...sent, imageUrl: asset.uri });
      }
    },
    onMutate: ({ temps }) => prepend([...temps].reverse()),
    // 이미 보내진 사진은 자리표시자가 남아 있지 않으므로 실패한 것만 걷힌다.
    onError: (error, { temps }) => {
      discard(temps.map((temp) => temp.messageId));
      onError(error);
    },
    onSettled: refreshRooms,
  });

  return {
    sendText: (content: string) =>
      sendText.mutate({
        content,
        temp: createTemp(senderId, {
          type: "TEXT",
          content,
          imageUrl: null,
        }),
      }),

    sendPhotos: (assets: ImagePickerAsset[]) =>
      sendPhotos.mutate({
        assets,
        temps: assets.map((asset) =>
          createTemp(senderId, {
            type: "PHOTO",
            content: null,
            imageUrl: asset.uri,
          }),
        ),
      }),

    uploading: sendPhotos.isPending,
  };
}
