import { File } from "expo-file-system";

import { ApiError } from "@/lib/api";
import { reportError } from "@/lib/crash";
import i18n from "@/lib/i18n";

const CANCELLED_CODE = "UPLOAD_CANCELLED";
const OFFLINE_CODE = "UPLOAD_OFFLINE";
const FAILED_CODE = "UPLOAD_FAILED";
const FAILED_MESSAGE = i18n.t("media.uploadFailed");
const MEDIA_FAILED_MESSAGE = i18n.t("media.sendFailed");

export type IssueUploadUrl = (
  contentType: string,
) => Promise<{ uploadUrl: string; objectKey: string }>;

export type UploadProgress = (progress: number) => void;

export function uploadCancelled() {
  return new ApiError(0, CANCELLED_CODE, i18n.t("media.cancelled"));
}

export function isUploadCancelled(error: unknown) {
  return error instanceof ApiError && error.code === CANCELLED_CODE;
}

export function uploadOffline() {
  return new ApiError(0, OFFLINE_CODE, i18n.t("media.offline"));
}

export function describeUploadError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  reportError("upload", error);

  return new ApiError(0, FAILED_CODE, MEDIA_FAILED_MESSAGE);
}

export async function uploadFile(
  uri: string,
  contentType: string,
  issue: IssueUploadUrl,
  onProgress: UploadProgress,
  signal: AbortSignal,
) {
  if (signal.aborted) {
    throw uploadCancelled();
  }

  const { uploadUrl, objectKey } = await issue(contentType);

  if (signal.aborted) {
    throw uploadCancelled();
  }

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

    if (signal.aborted) {
      throw uploadCancelled();
    }

    if (result.status < 200 || result.status >= 300) {
      throw new ApiError(result.status, FAILED_CODE, FAILED_MESSAGE);
    }

    return objectKey;
  } catch (error) {
    throw signal.aborted ? uploadCancelled() : error;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
