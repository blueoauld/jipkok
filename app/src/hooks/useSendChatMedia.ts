import { onlineManager } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { useState } from "react";
import { Platform } from "react-native";

import type { ChatFeedCache } from "@/hooks/useChatFeedCache";
import { api, type ChatMessageResponse } from "@/lib/api";
import { createTemp } from "@/lib/chat/outgoing";
import { type UploadPhase, useUploadStore } from "@/lib/chat/upload-store";
import i18n from "@/lib/i18n";
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

const KEEP_FOREGROUND_MESSAGE = i18n.t("hook.keepForeground");

export function useSendChatMedia(
  roomId: number,
  senderId: number,
  { prepend, replace, discard, refreshRooms }: ChatFeedCache,
  onError: (error: unknown) => void,
) {
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

        prepend(temp);
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

        prepend(temp);
        await sendVideo(asset, temp, thumbnailUri);
      }
    } finally {
      setMediaBatches((count) => count - 1);
    }
  };

  return {
    sendPhotos: (assets: ImagePickerAsset[]) => {
      void sendPhotos(assets);
    },
    sendVideos: (assets: ImagePickerAsset[]) => {
      void sendVideos(assets);
    },
    uploading: mediaBatches > 0,
  };
}
