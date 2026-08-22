import { useQueryClient } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { useCallback, useState } from "react";

import { forgetRoom } from "@/hooks/useChatSocket";
import { MAX_PHOTOS, pickChatMedia } from "@/hooks/usePhotos";
import { APP_EVENT, logAppEvent } from "@/lib/analytics";
import { api, type ChatMessageResponse } from "@/lib/api";
import { isPending, isRoomNotFound } from "@/lib/chat";
import i18n from "@/lib/i18n";
import { showToast } from "@/lib/toast/store";
import {
  isVideoTooLong,
  VIDEO_TOO_LONG_MESSAGE,
  videoDurationSeconds,
} from "@/lib/video";

const VIDEO_URL_FAILED_MESSAGE = i18n.t("hook.videoUrlFailed");
const UNKNOWN_DURATION_MESSAGE = i18n.t("hook.videoDurationUnknown");

export function useChatMedia({
  roomId,
  sendPhotos,
  sendVideos,
  onPicked,
  onError,
}: {
  roomId: number;
  sendPhotos: (assets: ImagePickerAsset[]) => void;
  sendVideos: (assets: ImagePickerAsset[]) => void;
  onPicked: () => void;
  onError: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  // 서명 URL은 10분이면 만료되므로 재생 직전에 새로 받는다. 아직 안 보낸 건 로컬 파일이다.
  const playVideo = useCallback(
    async (message: ChatMessageResponse) => {
      if (isPending(message)) {
        setPlayingUrl(message.videoUrl ?? null);
        return;
      }

      try {
        const { url } = await api.chats.videoUrl(roomId, message.messageId);
        setPlayingUrl(url);
      } catch (error) {
        if (isRoomNotFound(error)) {
          forgetRoom(queryClient, roomId);
        } else {
          showToast("error", VIDEO_URL_FAILED_MESSAGE);
        }
      }
    },
    [queryClient, roomId],
  );

  const pick = async () => {
    try {
      const assets = await pickChatMedia(MAX_PHOTOS);
      const photos = assets.filter((asset) => asset.type !== "video");
      const videos = assets.filter((asset) => asset.type === "video");
      const sendable = videos.filter(
        (asset) => asset.duration != null && !isVideoTooLong(asset),
      );
      const unknownDuration = videos.filter((asset) => asset.duration == null);

      // 상한에 걸리는 시도가 얼마나 되는지 봐서 멀티파트 업로드로 늘릴지 판단한다.
      videos.filter(isVideoTooLong).forEach((asset) =>
        logAppEvent(APP_EVENT.chatVideoTooLong, {
          durationSeconds: String(videoDurationSeconds(asset)),
        }),
      );

      if (unknownDuration.length > 0) {
        showToast("warning", UNKNOWN_DURATION_MESSAGE);
      } else if (sendable.length < videos.length) {
        showToast("warning", VIDEO_TOO_LONG_MESSAGE);
      }

      if (photos.length > 0) {
        sendPhotos(photos);
      }

      if (sendable.length > 0) {
        sendVideos(sendable);
      }

      if (photos.length > 0 || sendable.length > 0) {
        onPicked();
      }
    } catch (error) {
      onError(error);
    }
  };

  return {
    viewerUrl,
    openViewer: setViewerUrl,
    closeViewer: () => setViewerUrl(null),
    playingUrl,
    playVideo,
    closePlayer: () => setPlayingUrl(null),
    pick,
  };
}
