import { File } from "expo-file-system";
import type { ImagePickerAsset } from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Video as VideoCompressor } from "react-native-compressor";

import { api, ApiError } from "@/lib/api";

// 서버 ChatMessage.VIDEO_MAX_SECONDS / VIDEO_MAX_BYTES와 같다.
export const VIDEO_MAX_SECONDS = 300;
export const VIDEO_MAX_BYTES = 150 * 1024 * 1024;

const VIDEO_CONTENT_TYPE = "video/mp4";
const THUMBNAIL_CONTENT_TYPE = "image/jpeg";
const COMPRESS_MAX_SIZE = 1280;
const THUMBNAIL_QUALITY = 0.8;

const CANCELLED_CODE = "VIDEO_CANCELLED";
const TOO_LARGE_CODE = "VIDEO_TOO_LARGE";
const UPLOAD_FAILED_CODE = "VIDEO_UPLOAD_FAILED";
const VIDEO_FAILED_CODE = "VIDEO_FAILED";

export const VIDEO_TOO_LONG_MESSAGE = `영상은 ${VIDEO_MAX_SECONDS / 60}분까지 보낼 수 있습니다.`;
const TOO_LARGE_MESSAGE = "영상이 너무 큽니다. 150MB까지 보낼 수 있습니다.";
const UPLOAD_FAILED_MESSAGE = "영상을 업로드하지 못했습니다.";
const VIDEO_FAILED_MESSAGE = "영상을 보내지 못했습니다.";

export type VideoKeys = { objectKey: string; thumbnailKey: string };

// 서버 오류가 아닌 예외(압축·썸네일·업로드 라이브러리)는 로그에 남기고 한 문구로 알린다.
export function describeVideoError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  console.error("[video]", error);

  return new ApiError(0, VIDEO_FAILED_CODE, VIDEO_FAILED_MESSAGE);
}

export function isVideoCancelled(error: unknown) {
  return error instanceof ApiError && error.code === CANCELLED_CODE;
}

function cancelled() {
  return new ApiError(0, CANCELLED_CODE, "전송을 취소했습니다.");
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

// 720p로 줄인다. 취소하면 압축을 끊고 CANCELLED로 거절한다.
// 압축기가 못 다루는 영상(일부 HDR, 시뮬레이터)은 원본이 상한 안이면 그대로 보낸다.
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
        },
      },
      onProgress,
    );

    if (signal.aborted) {
      throw cancelled();
    }

    return ensureWithinLimit(compressed);
  } catch (error) {
    if (signal.aborted) {
      throw cancelled();
    }

    if (error instanceof ApiError) {
      throw error;
    }

    console.warn("[video] 압축에 실패해 원본을 보낸다.", error);

    return ensureWithinLimit(uri);
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

async function uploadFile(
  uri: string,
  contentType: string,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
) {
  const { uploadUrl, objectKey } =
    await api.chats.createPhotoUploadUrl(contentType);
  const task = new File(uri).createUploadTask(uploadUrl, {
    httpMethod: "PUT",
    headers: { "Content-Type": contentType },
    onProgress: ({ bytesSent, totalBytes }) =>
      onProgress(totalBytes > 0 ? bytesSent / totalBytes : 0),
  });
  const abort = () => task.cancel();

  signal.addEventListener("abort", abort);

  try {
    const result = await task.uploadAsync();

    if (result.status < 200 || result.status >= 300) {
      throw new ApiError(
        result.status,
        UPLOAD_FAILED_CODE,
        UPLOAD_FAILED_MESSAGE,
      );
    }

    return objectKey;
  } catch (error) {
    throw signal.aborted ? cancelled() : error;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

// 썸네일은 작아서 진행률에 안 넣고, 영상 진행률만 올린다.
export async function uploadChatVideo(
  videoUri: string,
  thumbnailUri: string,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
): Promise<VideoKeys> {
  const thumbnailKey = await uploadFile(
    thumbnailUri,
    THUMBNAIL_CONTENT_TYPE,
    () => undefined,
    signal,
  );
  const objectKey = await uploadFile(
    videoUri,
    VIDEO_CONTENT_TYPE,
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
