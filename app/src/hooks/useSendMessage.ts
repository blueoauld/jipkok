import {
  type InfiniteData,
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { useState } from "react";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import {
  api,
  type ChatMessagePage,
  type ChatMessageResponse,
  type ReplyMessageResponse,
} from "@/lib/api";
import { useUploadStore } from "@/lib/chat/upload-store";
import { mapPages } from "@/lib/paging";
import { uploadChatPhoto } from "@/lib/photo";
import {
  compressVideo,
  createVideoThumbnail,
  describeVideoError,
  isVideoCancelled,
  uploadChatVideo,
  videoDurationSeconds,
} from "@/lib/video";

type Feed = InfiniteData<ChatMessagePage>;

type PendingVideo = {
  asset: ImagePickerAsset;
  temp: ChatMessageResponse;
  id: string;
  thumbnailUri: string;
};

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

  const [videoBatches, setVideoBatches] = useState(0);
  const uploads = useUploadStore.getState;

  // 압축본은 기억해 두어 재전송 때 다시 압축하지 않는다.
  const sendVideo = async (
    video: PendingVideo,
    compressed: string | null,
  ): Promise<void> => {
    const { asset, temp, id, thumbnailUri } = video;
    const controller = new AbortController();
    const cancel = () => {
      controller.abort();
      uploads().remove(id);
      discard([temp.messageId]);
    };
    const retry = (uri: string | null) => () => {
      void sendVideo(video, uri);
    };
    const durationSeconds = videoDurationSeconds(asset);

    uploads().set(id, {
      phase: compressed ? "uploading" : "compressing",
      progress: 0,
      cancel,
      retry: retry(compressed),
    });

    let videoUri = compressed;

    try {
      videoUri ??= await compressVideo(
        asset.uri,
        (progress) => uploads().progress(id, "compressing", progress),
        controller.signal,
      );

      const keys = await uploadChatVideo(
        videoUri,
        thumbnailUri,
        (progress) => uploads().progress(id, "uploading", progress),
        controller.signal,
      );
      const sent = await api.chats.send(roomId, {
        type: "VIDEO",
        objectKey: keys.objectKey,
        thumbnailKey: keys.thumbnailKey,
        durationSeconds,
        clientMessageId: id,
      });

      uploads().remove(id);
      replace(temp, {
        ...sent,
        videoUrl: videoUri,
        thumbnailUrl: thumbnailUri,
      });
      refreshRooms();
    } catch (error) {
      if (isVideoCancelled(error)) {
        return;
      }

      uploads().set(id, {
        phase: "failed",
        progress: 0,
        cancel,
        retry: retry(videoUri),
      });
      onError(describeVideoError(error));
    }
  };

  const sendVideos = async (assets: ImagePickerAsset[]) => {
    setVideoBatches((count) => count + 1);

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
        await sendVideo(
          { asset, temp, id: temp.clientMessageId ?? "", thumbnailUri },
          null,
        );
      }
    } catch (error) {
      onError(describeVideoError(error));
    } finally {
      setVideoBatches((count) => count - 1);
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

    sendVideos: (assets: ImagePickerAsset[]) => {
      void sendVideos(assets);
    },

    sending: sendText.isPending,
    uploading: sendPhotos.isPending || videoBatches > 0,
  };
}
