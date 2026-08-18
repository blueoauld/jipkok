import type { ImagePickerAsset } from "expo-image-picker";

import {
  formatDuration,
  isVideoTooLong,
  VIDEO_MAX_SECONDS,
  videoDurationSeconds,
} from "@/lib/video";

jest.mock("react-native-compressor", () => ({ Video: {} }));
jest.mock("expo-video-thumbnails", () => ({}));
jest.mock("@/lib/analytics", () => ({ APP_EVENT: {}, logAppEvent: jest.fn() }));

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
