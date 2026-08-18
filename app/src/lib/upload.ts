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

// 서버 오류가 아닌 예외(압축·썸네일·업로드 라이브러리)는 로그에 남기고 한 문구로 알린다.
export function describeUploadError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  console.error("[upload]", error);

  return new ApiError(0, FAILED_CODE, MEDIA_FAILED_MESSAGE);
}

// 서명 PUT URL을 받아 파일을 올린다. 진행률과 취소를 지원하고, iOS는 백그라운드 세션이라
// 앱을 잠깐 내려도 이어진다.
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
