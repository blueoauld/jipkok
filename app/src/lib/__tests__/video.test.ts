import type { ImagePickerAsset } from "expo-image-picker";
import { Video as VideoCompressor } from "react-native-compressor";

import { logAppEvent } from "@/lib/analytics";
import { ApiError } from "@/lib/api";
import { isUploadCancelled } from "@/lib/upload";
import {
  compressVideo,
  formatDuration,
  isVideoTooLong,
  VIDEO_MAX_SECONDS,
  videoDurationSeconds,
} from "@/lib/video";

const mockSizes = new Map<string, number>();

jest.mock("expo-file-system", () => ({
  File: class {
    constructor(private readonly mockUri: string) {}

    get size() {
      return mockSizes.get(this.mockUri) ?? 0;
    }
  },
}));
jest.mock("react-native-compressor", () => ({
  Video: { compress: jest.fn(), cancelCompression: jest.fn() },
}));
jest.mock("expo-video-thumbnails", () => ({}));
jest.mock("@/lib/analytics", () => ({
  APP_EVENT: { chatVideoCompressionFailed: "chat_video_compression_failed" },
  logAppEvent: jest.fn(),
}));

const compressor = jest.mocked(VideoCompressor);
const TOO_BIG = 150 * 1024 * 1024 + 1;

function asset(durationMillis: number | null) {
  return { duration: durationMillis } as ImagePickerAsset;
}

describe("formatDuration", () => {
  it("m:ss로 만든다", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });
});

describe("video length", () => {
  it("밀리초를 올림해서 초로 만든다", () => {
    expect(videoDurationSeconds(asset(1001))).toBe(2);
    expect(videoDurationSeconds(asset(null))).toBe(0);
  });

  it("상한을 넘는 것만 거른다", () => {
    expect(isVideoTooLong(asset(VIDEO_MAX_SECONDS * 1000))).toBe(false);
    expect(isVideoTooLong(asset(VIDEO_MAX_SECONDS * 1000 + 1))).toBe(true);
  });
});

describe("compressVideo", () => {
  const onProgress = () => undefined;

  beforeEach(() => {
    mockSizes.clear();
    mockSizes.set("file:///raw.mov", 1000);
    mockSizes.set("file:///small.mp4", 500);
    compressor.compress.mockResolvedValue("file:///small.mp4");
  });

  it("압축본이 상한 안이면 압축본을 돌려준다", async () => {
    const signal = new AbortController().signal;

    await expect(
      compressVideo("file:///raw.mov", onProgress, signal),
    ).resolves.toBe("file:///small.mp4");
  });

  it("압축본이 상한을 넘으면 너무 크다는 오류를 낸다", async () => {
    mockSizes.set("file:///small.mp4", TOO_BIG);
    const signal = new AbortController().signal;

    const error = await compressVideo(
      "file:///raw.mov",
      onProgress,
      signal,
    ).catch((cause) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("VIDEO_TOO_LARGE");
  });

  it("압축에 실패하면 원본이 상한 안일 때 원본을 보낸다", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    compressor.compress.mockRejectedValue(new Error("unsupported"));
    const signal = new AbortController().signal;

    await expect(
      compressVideo("file:///raw.mov", onProgress, signal),
    ).resolves.toBe("file:///raw.mov");
    expect(logAppEvent).toHaveBeenCalledWith("chat_video_compression_failed", {
      domain: "unknown",
    });
  });

  it("압축에 실패하고 원본도 상한을 넘으면 너무 크다는 오류를 낸다", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    compressor.compress.mockRejectedValue(new Error("unsupported"));
    mockSizes.set("file:///raw.mov", TOO_BIG);
    const signal = new AbortController().signal;

    const error = await compressVideo(
      "file:///raw.mov",
      onProgress,
      signal,
    ).catch((cause) => cause);

    expect((error as ApiError).code).toBe("VIDEO_TOO_LARGE");
  });

  it("압축 중에 중단하면 압축을 취소하고 취소 오류로 끝난다", async () => {
    const controller = new AbortController();
    compressor.compress.mockImplementation(async (_uri, options) => {
      options?.getCancellationId?.("job-1");
      controller.abort();

      return "file:///small.mp4";
    });

    const error = await compressVideo(
      "file:///raw.mov",
      onProgress,
      controller.signal,
    ).catch((cause) => cause);

    expect(isUploadCancelled(error)).toBe(true);
    expect(compressor.cancelCompression).toHaveBeenCalledWith("job-1");
  });

  it("취소 id가 오기 전에 중단됐으면 id를 받자마자 취소한다", async () => {
    const controller = new AbortController();
    compressor.compress.mockImplementation(async (_uri, options) => {
      controller.abort();
      options?.getCancellationId?.("job-2");

      throw new Error("cancelled");
    });

    const error = await compressVideo(
      "file:///raw.mov",
      onProgress,
      controller.signal,
    ).catch((cause) => cause);

    expect(isUploadCancelled(error)).toBe(true);
    expect(compressor.cancelCompression).toHaveBeenCalledWith("job-2");
  });
});
