import { File } from "expo-file-system";

import { ApiError } from "@/lib/api";

const CANCELLED_CODE = "UPLOAD_CANCELLED";
const FAILED_CODE = "UPLOAD_FAILED";
const FAILED_MESSAGE = "업로드하지 못했습니다.";
const MEDIA_FAILED_MESSAGE = "보내지 못했습니다.";

export type IssueUploadUrl = (
  contentType: string,
) => Promise<{ uploadUrl: string; objectKey: string }>;

export type UploadProgress = (progress: number) => void;

export function uploadCancelled() {
  return new ApiError(0, CANCELLED_CODE, "전송을 취소했습니다.");
}

export function isUploadCancelled(error: unknown) {
  return error instanceof ApiError && error.code === CANCELLED_CODE;
}

export function describeUploadError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  console.error("[upload]", error);

  return new ApiError(0, FAILED_CODE, MEDIA_FAILED_MESSAGE);
}

export async function uploadFile(
  uri: string,
  contentType: string,
  issue: IssueUploadUrl,
  onProgress: UploadProgress,
  signal: AbortSignal,
) {
  const { uploadUrl, objectKey } = await issue(contentType);
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
      throw new ApiError(result.status, FAILED_CODE, FAILED_MESSAGE);
    }

    return objectKey;
  } catch (error) {
    throw signal.aborted ? uploadCancelled() : error;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
