import { ApiError } from "@/lib/api";
import {
  describeUploadError,
  isUploadCancelled,
  uploadCancelled,
  uploadFile,
} from "@/lib/upload";

type UploadOptions = {
  httpMethod: string;
  headers: Record<string, string>;
  onProgress: (event: { bytesSent: number; totalBytes: number }) => void;
};

const mockTask = {
  uploadAsync: jest.fn(),
  cancel: jest.fn(),
};
let mockTarget: { url: string; options: UploadOptions } | null = null;
let mockFileUri: string | null = null;

jest.mock("expo-file-system", () => ({
  File: class {
    constructor(uri: string) {
      mockFileUri = uri;
    }

    createUploadTask(url: string, options: UploadOptions) {
      mockTarget = { url, options };

      return mockTask;
    }
  },
}));

const issue = jest.fn();
const onProgress = jest.fn();

function upload(signal = new AbortController().signal) {
  return uploadFile("file:///a.jpg", "image/jpeg", issue, onProgress, signal);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockTarget = null;
  mockFileUri = null;
  issue.mockResolvedValue({ uploadUrl: "https://r2/put", objectKey: "key" });
  mockTask.uploadAsync.mockResolvedValue({ status: 200 });
});

describe("uploadFile", () => {
  it("발급받은 URL로 PUT 하고 objectKey를 돌려준다", async () => {
    await expect(upload()).resolves.toBe("key");

    expect(issue).toHaveBeenCalledWith("image/jpeg");
    expect(mockFileUri).toBe("file:///a.jpg");
    expect(mockTarget?.url).toBe("https://r2/put");
    expect(mockTarget?.options.httpMethod).toBe("PUT");
    expect(mockTarget?.options.headers).toEqual({
      "Content-Type": "image/jpeg",
    });
  });

  it("진행률을 0~1 비율로 알리고 크기를 모르면 0으로 둔다", async () => {
    await upload();

    mockTarget?.options.onProgress({ bytesSent: 25, totalBytes: 100 });
    mockTarget?.options.onProgress({ bytesSent: 10, totalBytes: 0 });

    expect(onProgress).toHaveBeenNthCalledWith(1, 0.25);
    expect(onProgress).toHaveBeenNthCalledWith(2, 0);
  });

  it("2xx가 아니면 UPLOAD_FAILED로 실패한다", async () => {
    mockTask.uploadAsync.mockResolvedValue({ status: 403 });

    await expect(upload()).rejects.toMatchObject({
      status: 403,
      code: "UPLOAD_FAILED",
    });
  });

  it("업로드 URL 발급 실패는 그대로 올린다", async () => {
    const error = new ApiError(429, "RATE", "잠시 후");
    issue.mockRejectedValue(error);

    await expect(upload()).rejects.toBe(error);
    expect(mockTarget).toBeNull();
  });

  it("중단하면 태스크를 취소하고 취소 오류로 끝난다", async () => {
    const controller = new AbortController();
    let uploading: () => void = () => undefined;
    mockTask.uploadAsync.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          mockTask.cancel.mockImplementation(() =>
            reject(new Error("cancelled")),
          );
          uploading();
        }),
    );
    const started = new Promise<void>((resolve) => {
      uploading = resolve;
    });

    const settled = upload(controller.signal).catch((error) => error);
    await started;
    controller.abort();

    expect(isUploadCancelled(await settled)).toBe(true);
    expect(mockTask.cancel).toHaveBeenCalledTimes(1);
  });

  it("중단된 뒤에 온 실패도 취소로 본다", async () => {
    const controller = new AbortController();
    mockTask.uploadAsync.mockImplementation(async () => {
      controller.abort();

      return { status: 500 };
    });

    const error = await upload(controller.signal).catch((cause) => cause);

    expect(isUploadCancelled(error)).toBe(true);
  });
});

describe("describeUploadError", () => {
  it("ApiError는 그대로 두고 나머지는 보내지 못했다는 오류로 감싼다", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const known = uploadCancelled();

    expect(describeUploadError(known)).toBe(known);
    expect(describeUploadError(new Error("boom"))).toMatchObject({
      code: "UPLOAD_FAILED",
      message: "보내지 못했습니다.",
    });
  });
});
