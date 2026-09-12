import type { ImagePickerAsset } from "expo-image-picker";

import { useChatMediaPlayback } from "@/hooks/useChatMediaPlayback";
import { APP_EVENT, logAppEvent } from "@/lib/analytics";
import i18n from "@/lib/i18n";
import {
  MAX_PHOTOS,
  pickMedia,
  takePhoto,
  takeVideo,
} from "@/lib/photo/picker";
import { showToast } from "@/lib/toast/store";
import {
  isVideoTooLong,
  VIDEO_TOO_LONG_MESSAGE,
  videoDurationSeconds,
} from "@/lib/video";

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
  const playback = useChatMediaPlayback(roomId, "messages");

  const pick = async () => {
    try {
      const assets = await pickMedia(MAX_PHOTOS);
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

  const capture = async () => {
    try {
      const photo = await takePhoto();

      if (photo) {
        sendPhotos([photo]);
        onPicked();
      }
    } catch (error) {
      onError(error);
    }
  };

  const captureVideo = async () => {
    try {
      const video = await takeVideo();

      if (!video) {
        return;
      }

      if (video.duration == null) {
        showToast("warning", UNKNOWN_DURATION_MESSAGE);
        return;
      }

      if (isVideoTooLong(video)) {
        showToast("warning", VIDEO_TOO_LONG_MESSAGE);
        return;
      }

      sendVideos([video]);
      onPicked();
    } catch (error) {
      onError(error);
    }
  };

  return { ...playback, pick, capture, captureVideo };
}
