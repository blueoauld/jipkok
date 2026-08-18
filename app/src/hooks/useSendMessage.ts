import {
  type InfiniteData,
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { useState } from "react";
import { Platform } from "react-native";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import {
  api,
  type ChatMessagePage,
  type ChatMessageResponse,
  type ReplyMessageResponse,
} from "@/lib/api";
import { type UploadPhase, useUploadStore } from "@/lib/chat/upload-store";
import { mapPages } from "@/lib/paging";
import { toChatPhoto, uploadChatPhotoFile } from "@/lib/photo";
import { showToast } from "@/lib/toast/store";
import { describeUploadError, isUploadCancelled } from "@/lib/upload";
import {
  compressVideo,
  createVideoThumbnail,
  uploadChatVideo,
  videoDurationSeconds,
} from "@/lib/video";

type Feed = InfiniteData<ChatMessagePage>;

const KEEP_FOREGROUND_MESSAGE = "전송이 끝날 때까지 앱을 켜 두세요.";

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
  queryClient.setQueryData<Feed>(chatMessagesKey(roomId), (current) =>
    mapPages(current, (items, index) => (index === 0 ? update(items) : items)),
  );
}

export function useSendMessage(
  roomId: number,
  senderId: number,
  onError: (error: unknown) => void,
  onTextFailed: (content: string, replyTo: ReplyMessageResponse | null) => void,
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

  const [mediaBatches, setMediaBatches] = useState(0);
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
    };
    const retry = () => {
      void sendMedia(temp, initialPhase, work);
    };

    uploads().set(id, { phase: initialPhase, progress: 0, cancel, retry });

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

        await prepend([temp]);
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
        const thumbnailUri = await createVideoThumbnail(asset.uri);
        const temp = createTemp(senderId, {
          type: "VIDEO",
          content: null,
          imageUrl: null,
          videoUrl: asset.uri,
          thumbnailUrl: thumbnailUri,
          durationSeconds: videoDurationSeconds(asset),
          replyMessage: null,
        });

        await prepend([temp]);
        await sendVideo(asset, temp, thumbnailUri);
      }
    } catch (error) {
      onError(describeUploadError(error));
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
    onMutate: ({ temp }) => prepend([temp]),
    onSuccess: (message, { temp }) => replace(temp, message),
    onError: (error, { content, temp }) => {
      discard([temp.messageId]);
      onTextFailed(content, temp.replyMessage);
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
