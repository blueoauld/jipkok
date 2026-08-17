import {
  type InfiniteData,
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import {
  api,
  type ChatMessagePage,
  type ChatMessageResponse,
  type ReplyMessageResponse,
} from "@/lib/api";
import { uploadChatPhoto } from "@/lib/photo";

type Feed = InfiniteData<ChatMessagePage>;

let lastTempId = 0;

function createClientMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function createTemp(
  senderId: number,
  message: Pick<
    ChatMessageResponse,
    "type" | "content" | "imageUrl" | "replyMessage"
  >,
): ChatMessageResponse {
  return {
    messageId: --lastTempId,
    roomId: 0,
    senderId,
    createdAt: new Date().toISOString(),
    clientMessageId: createClientMessageId(),
    reactions: [],
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

  const prepend = async (messages: ChatMessageResponse[]) => {
    await queryClient.cancelQueries({ queryKey: chatMessagesKey(roomId) });
    updateFeed(queryClient, roomId, (items) => [...messages, ...items]);
  };

  const replace = (temp: ChatMessageResponse, message: ChatMessageResponse) =>
    updateFeed(queryClient, roomId, (items) =>
      items.some((item) => item.clientMessageId === temp.clientMessageId)
        ? items.map((item) =>
            item.clientMessageId === temp.clientMessageId ? message : item,
          )
        : [message, ...items],
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
      replyToMessageId,
      temp,
    }: {
      content: string;
      replyToMessageId: number | null;
      temp: ChatMessageResponse;
    }) =>
      api.chats.send(roomId, {
        type: "TEXT",
        content,
        replyToMessageId,
        clientMessageId: temp.clientMessageId,
      }),
    onMutate: ({ temp }) => prepend([temp]),
    onSuccess: (message, { temp }) => replace(temp, message),
    onError: (error, { temp }) => {
      discard([temp.messageId]);
      onError(error);
    },
    onSettled: refreshRooms,
  });

  const sendPhotos = useMutation({
    mutationFn: async ({
      assets,
      temps,
    }: {
      assets: ImagePickerAsset[];
      temps: ChatMessageResponse[];
    }) => {
      for (const [index, asset] of assets.entries()) {
        const objectKey = await uploadChatPhoto(asset);
        const sent = await api.chats.send(roomId, {
          type: "PHOTO",
          objectKey,
          clientMessageId: temps[index].clientMessageId,
        });

        replace(temps[index], { ...sent, imageUrl: asset.uri });
      }
    },
    onMutate: ({ temps }) => prepend([...temps].reverse()),
    onError: (error, { temps }) => {
      discard(temps.map((temp) => temp.messageId));
      onError(error);
    },
    onSettled: refreshRooms,
  });

  return {
    sendText: (content: string, replyTo: ReplyMessageResponse | null = null) =>
      sendText.mutate({
        content,
        replyToMessageId: replyTo?.messageId ?? null,
        temp: createTemp(senderId, {
          type: "TEXT",
          content,
          imageUrl: null,
          replyMessage: replyTo,
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
            replyMessage: null,
          }),
        ),
      }),

    sending: sendText.isPending,
    uploading: sendPhotos.isPending,
  };
}
