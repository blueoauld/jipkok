import { File } from "expo-file-system";
import type { ImagePickerAsset } from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Video as VideoCompressor } from "react-native-compressor";

import { APP_EVENT, logAppEvent } from "@/lib/analytics";
import { api, ApiError } from "@/lib/api";
import { uploadCancelled, uploadFile, type UploadProgress } from "@/lib/upload";

// 서버 ChatMessage.VIDEO_MAX_SECONDS / VIDEO_MAX_BYTES와 같다.
export const VIDEO_MAX_SECONDS = 300;
export const VIDEO_MAX_BYTES = 150 * 1024 * 1024;

const VIDEO_CONTENT_TYPE = "video/mp4";
const THUMBNAIL_CONTENT_TYPE = "image/jpeg";
const COMPRESS_MAX_SIZE = 1280;
const THUMBNAIL_QUALITY = 0.8;

const TOO_LARGE_CODE = "VIDEO_TOO_LARGE";

export const VIDEO_TOO_LONG_MESSAGE = `동영상은 ${VIDEO_MAX_SECONDS / 60}분까지 보낼 수 있습니다.`;
const TOO_LARGE_MESSAGE = "동영상이 너무 큽니다. 150MB까지 보낼 수 있습니다.";

export type VideoKeys = { objectKey: string; thumbnailKey: string };

// RN은 네이티브 NSError를 domain/code/userInfo로 실어 준다. 압축기가 감싼 문구 뒤의 진짜 원인.
function nativeErrorDetail(error: unknown) {
  const native = error as {
    domain?: string;
    code?: string;
    userInfo?: unknown;
  };

  return {
    domain: native.domain,
    code: native.code,
    userInfo: native.userInfo,
  };
}

export function videoDurationSeconds(asset: ImagePickerAsset) {
  return Math.ceil((asset.duration ?? 0) / 1000);
}

export function isVideoTooLong(asset: ImagePickerAsset) {
  return videoDurationSeconds(asset) > VIDEO_MAX_SECONDS;
}

export async function createVideoThumbnail(uri: string) {
  const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, {
    time: 0,
    quality: THUMBNAIL_QUALITY,
  });

  return thumbnailUri;
}

function ensureWithinLimit(uri: string) {
  if (new File(uri).size > VIDEO_MAX_BYTES) {
    throw new ApiError(0, TOO_LARGE_CODE, TOO_LARGE_MESSAGE);
  }

  return uri;
}

// 압축기가 못 다루는 동영상(일부 HDR, 시뮬레이터)은 원본이 상한 안이면 그대로 보낸다.
export async function compressVideo(
  uri: string,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
) {
  let cancellationId: string | null = null;
  const abort = () => {
    if (cancellationId) {
      VideoCompressor.cancelCompression(cancellationId);
    }
  };

  signal.addEventListener("abort", abort);

  try {
    const compressed = await VideoCompressor.compress(
      uri,
      {
        compressionMethod: "auto",
        maxSize: COMPRESS_MAX_SIZE,
        getCancellationId: (id) => {
          cancellationId = id;

          if (signal.aborted) {
            VideoCompressor.cancelCompression(id);
          }
        },
      },
      onProgress,
    );

    if (signal.aborted) {
      throw uploadCancelled();
    }

    return ensureWithinLimit(compressed);
  } catch (error) {
    if (signal.aborted) {
      throw uploadCancelled();
    }

    if (error instanceof ApiError) {
      throw error;
    }

    console.warn(
      "[video] 압축에 실패해 원본을 보낸다.",
      error,
      nativeErrorDetail(error),
    );
    logAppEvent(APP_EVENT.chatVideoCompressionFailed, {
      domain: String(nativeErrorDetail(error).domain ?? "unknown"),
    });

    return ensureWithinLimit(uri);
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

export async function uploadChatVideo(
  videoUri: string,
  thumbnailUri: string,
  onProgress: UploadProgress,
  signal: AbortSignal,
): Promise<VideoKeys> {
  const thumbnailKey = await uploadFile(
    thumbnailUri,
    THUMBNAIL_CONTENT_TYPE,
    api.chats.createPhotoUploadUrl,
    () => undefined,
    signal,
  );
  const objectKey = await uploadFile(
    videoUri,
    VIDEO_CONTENT_TYPE,
    api.chats.createPhotoUploadUrl,
    onProgress,
    signal,
  );

  return { objectKey, thumbnailKey };
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
