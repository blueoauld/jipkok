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

// 서버가 그대로 돌려주는 클라이언트 생성 id로, 자리표시자와 서버 메시지를 잇는다.
function createClientMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

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
    clientMessageId: createClientMessageId(),
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

  // 재조회 도중이면 그 응답이 자리표시자를 덮어쓰므로 먼저 취소하고 그린다.
  const prepend = async (messages: ChatMessageResponse[]) => {
    await queryClient.cancelQueries({ queryKey: chatMessagesKey(roomId) });
    updateFeed(queryClient, roomId, (items) => [...messages, ...items]);
  };

  // 자리표시자가 재조회에 걷혀 없어졌을 수 있어 그때는 서버 메시지를 새로 넣는다.
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

  // 메시지 피드까지 재조회하면 방금 그린 자리표시자가 지워진다.
  const refreshRooms = () =>
    queryClient.invalidateQueries({
      queryKey: CHAT_ROOMS_KEY,
      predicate: (query) => query.queryKey[1] !== "messages",
    });

  const sendText = useMutation({
    mutationFn: ({
      content,
      temp,
    }: {
      content: string;
      temp: ChatMessageResponse;
    }) =>
      api.chats.send(roomId, {
        type: "TEXT",
        content,
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
        const sent = await api.chats.send(roomId, {
          type: "PHOTO",
          objectKey,
          clientMessageId: temps[index].clientMessageId,
        });

        // 서명 URL로 바꾸면 이미 그려둔 사진이 다시 받아지며 깜빡이므로 로컬 경로를 유지한다.
        replace(temps[index], { ...sent, imageUrl: asset.uri });
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
