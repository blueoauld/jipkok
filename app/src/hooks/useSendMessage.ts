import {
  type InfiniteData,
  onlineManager,
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { useRef, useState } from "react";
import { Platform } from "react-native";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import {
  api,
  type ChatMessagePage,
  type ChatMessageResponse,
  type ChatRoomPage,
  type ChatRoomResponse,
  type ReplyMessageResponse,
} from "@/lib/api";
import { type UploadPhase, useUploadStore } from "@/lib/chat/upload-store";
import i18n from "@/lib/i18n";
import { mapPages } from "@/lib/paging";
import { toChatPhoto, uploadChatPhotoFile } from "@/lib/photo";
import { showToast } from "@/lib/toast/store";
import {
  describeUploadError,
  isUploadCancelled,
  uploadOffline,
} from "@/lib/upload";
import {
  compressVideo,
  createVideoThumbnail,
  uploadChatVideo,
  videoDurationSeconds,
} from "@/lib/video";

type Feed = InfiniteData<ChatMessagePage>;

const KEEP_FOREGROUND_MESSAGE = i18n.t("hook.keepForeground");

let lastTempId = 0;

function createClientMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function createTemp(
  senderId: number,
  message: Pick<
    ChatMessageResponse,
    "type" | "content" | "imageUrl" | "replyMessage"
  > &
    Partial<
      Pick<ChatMessageResponse, "videoUrl" | "thumbnailUrl" | "durationSeconds">
    >,
  clientMessageId: string = createClientMessageId(),
): ChatMessageResponse {
  return {
    messageId: --lastTempId,
    roomId: 0,
    senderId,
    createdAt: new Date().toISOString(),
    clientMessageId,
    reactions: [],
    ...message,
  };
}

function updateFeed(
  queryClient: QueryClient,
  roomId: number,
  update: (items: ChatMessageResponse[]) => ChatMessageResponse[],
) {
  queryClient.setQueryData<Feed>(chatMessagesKey(roomId), (current) =>
    mapPages(current, (items, index) => (index === 0 ? update(items) : items)),
  );
}

function raiseToSectionTop(items: ChatRoomResponse[], roomId: number) {
  const room = items.find((item) => item.roomId === roomId);

  if (!room) {
    return items;
  }

  const rest = items.filter((item) => item.roomId !== roomId);
  const at = room.pinned ? 0 : rest.filter((item) => item.pinned).length;

  return [...rest.slice(0, at), room, ...rest.slice(at)];
}

export function useSendMessage(
  roomId: number,
  senderId: number,
  onError: (error: unknown) => void,
  onTextFailed: (content: string, replyTo: ReplyMessageResponse | null) => void,
) {
  const queryClient = useQueryClient();

  // 목록 미리보기를 낙관적으로 바꾸고, 1페이지 안에서만 자기 섹션(고정/일반) 맨 위로
  // 올린다. 다른 페이지의 방은 커서가 어긋나지 않게 문구만 바꾸고 재조회가 옮긴다.
  const previewRooms = (message: ChatMessageResponse) =>
    queryClient.setQueriesData<InfiniteData<ChatRoomPage>>(
      { queryKey: CHAT_ROOMS_KEY },
      (current) =>
        mapPages(current, (items, index) => {
          const updated = items.map((item) =>
            item.roomId === roomId
              ? {
                  ...item,
                  lastMessageType: message.type,
                  lastMessageContent: message.content,
                  lastMessageAt: message.createdAt,
                }
              : item,
          );

          return index === 0 ? raiseToSectionTop(updated, roomId) : updated;
        }),
    );

  const prepend = async (message: ChatMessageResponse) => {
    await queryClient.cancelQueries({ queryKey: chatMessagesKey(roomId) });
    updateFeed(queryClient, roomId, (items) => [message, ...items]);
    previewRooms(message);
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

  const [mediaBatches, setMediaBatches] = useState(0);
  const failedText = useRef<{
    clientMessageId: string;
    content: string;
  } | null>(null);
  const uploads = useUploadStore.getState;

  // work가 중간 결과(변환본, 압축본)를 기억해 두면 재전송 때 그만큼 건너뛴다.
  const sendMedia = async (
    temp: ChatMessageResponse,
    initialPhase: UploadPhase,
    work: (
      signal: AbortSignal,
      report: (phase: UploadPhase, progress: number) => void,
    ) => Promise<ChatMessageResponse>,
  ): Promise<void> => {
    const id = temp.clientMessageId ?? "";
    const controller = new AbortController();
    const cancel = () => {
      controller.abort();
      uploads().remove(id);
      discard([temp.messageId]);
      refreshRooms();
    };
    const retry = () => {
      setMediaBatches((count) => count + 1);
      void sendMedia(temp, initialPhase, work).finally(() =>
        setMediaBatches((count) => count - 1),
      );
    };

    uploads().set(id, { phase: initialPhase, progress: 0, cancel, retry });

    if (!onlineManager.isOnline()) {
      uploads().set(id, { phase: "failed", progress: 0, cancel, retry });
      onError(uploadOffline());

      return;
    }

    try {
      const sent = await work(controller.signal, (phase, progress) =>
        uploads().progress(id, phase, progress),
      );

      uploads().remove(id);
      replace(temp, sent);
      refreshRooms();
    } catch (error) {
      if (isUploadCancelled(error)) {
        return;
      }

      uploads().set(id, { phase: "failed", progress: 0, cancel, retry });
      onError(describeUploadError(error));
    }
  };

  const sendPhoto = (asset: ImagePickerAsset, temp: ChatMessageResponse) => {
    let jpegUri: string | null = null;

    return sendMedia(temp, "uploading", async (signal, report) => {
      jpegUri ??= await toChatPhoto(asset);

      const objectKey = await uploadChatPhotoFile(
        jpegUri,
        (progress) => report("uploading", progress),
        signal,
      );
      const sent = await api.chats.send(roomId, {
        type: "PHOTO",
        objectKey,
        clientMessageId: temp.clientMessageId,
      });

      return { ...sent, imageUrl: asset.uri };
    });
  };

  const sendVideo = (
    asset: ImagePickerAsset,
    temp: ChatMessageResponse,
    thumbnailUri: string,
  ) => {
    let compressedUri: string | null = null;

    return sendMedia(temp, "compressing", async (signal, report) => {
      compressedUri ??= await compressVideo(
        asset.uri,
        (progress) => report("compressing", progress),
        signal,
      );

      report("uploading", 0);

      const keys = await uploadChatVideo(
        compressedUri,
        thumbnailUri,
        (progress) => report("uploading", progress),
        signal,
      );
      const sent = await api.chats.send(roomId, {
        type: "VIDEO",
        objectKey: keys.objectKey,
        thumbnailKey: keys.thumbnailKey,
        durationSeconds: videoDurationSeconds(asset),
        clientMessageId: temp.clientMessageId,
      });

      return { ...sent, videoUrl: compressedUri, thumbnailUrl: thumbnailUri };
    });
  };

  // 안드로이드는 앱을 내리면 업로드가 끊긴다. iOS는 백그라운드 세션이라 이어진다.
  const warnBackground = () => {
    if (Platform.OS === "android") {
      showToast("info", KEEP_FOREGROUND_MESSAGE);
    }
  };

  const sendPhotos = async (assets: ImagePickerAsset[]) => {
    setMediaBatches((count) => count + 1);
    warnBackground();

    try {
      for (const asset of assets) {
        const temp = createTemp(senderId, {
          type: "PHOTO",
          content: null,
          imageUrl: asset.uri,
          replyMessage: null,
        });

        await prepend(temp);
        await sendPhoto(asset, temp);
      }
    } finally {
      setMediaBatches((count) => count - 1);
    }
  };

  const sendVideos = async (assets: ImagePickerAsset[]) => {
    setMediaBatches((count) => count + 1);
    warnBackground();

    try {
      for (const asset of assets) {
        let thumbnailUri: string;

        try {
          thumbnailUri = await createVideoThumbnail(asset.uri);
        } catch (error) {
          onError(describeUploadError(error));
          continue;
        }

        const temp = createTemp(senderId, {
          type: "VIDEO",
          content: null,
          imageUrl: null,
          videoUrl: asset.uri,
          thumbnailUrl: thumbnailUri,
          durationSeconds: videoDurationSeconds(asset),
          replyMessage: null,
        });

        await prepend(temp);
        await sendVideo(asset, temp, thumbnailUri);
      }
    } finally {
      setMediaBatches((count) => count - 1);
    }
  };

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
    onMutate: ({ temp }) => prepend(temp),
    onSuccess: (message, { temp }) => replace(temp, message),
    onError: (error, { content, temp }) => {
      if (temp.clientMessageId) {
        failedText.current = { clientMessageId: temp.clientMessageId, content };
      }
      discard([temp.messageId]);
      onTextFailed(content, temp.replyMessage);
      onError(error);
    },
    onSettled: refreshRooms,
  });

  return {
    sendText: (
      content: string,
      replyTo: ReplyMessageResponse | null = null,
    ) => {
      const failed = failedText.current;
      failedText.current = null;

      sendText.mutate({
        content,
        replyToMessageId: replyTo?.messageId ?? null,
        temp: createTemp(
          senderId,
          {
            type: "TEXT",
            content,
            imageUrl: null,
            replyMessage: replyTo,
          },
          failed?.content === content ? failed.clientMessageId : undefined,
        ),
      });
    },

    sendPhotos: (assets: ImagePickerAsset[]) => {
      void sendPhotos(assets);
    },

    sendVideos: (assets: ImagePickerAsset[]) => {
      void sendVideos(assets);
    },

    sending: sendText.isPending,
    uploading: mediaBatches > 0,
  };
}
