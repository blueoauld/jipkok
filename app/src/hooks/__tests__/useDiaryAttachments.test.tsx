import { act, renderHook } from "@testing-library/react-native";
import type { ImagePickerAsset } from "expo-image-picker";

import { useDiaryAttachments } from "@/hooks/useDiaryAttachments";
import type { DiaryAttachmentResponse } from "@/lib/api";
import { uploadDiaryPhoto } from "@/lib/photo";
import { pickMedia } from "@/lib/photo/picker";
import { showToast } from "@/lib/toast/store";
import {
  compressVideo,
  createVideoThumbnail,
  uploadDiaryVideo,
} from "@/lib/video";

jest.mock("@/lib/photo", () => ({ uploadDiaryPhoto: jest.fn() }));
jest.mock("@/lib/photo/picker", () => ({ pickMedia: jest.fn() }));
jest.mock("@/lib/toast/store", () => ({ showToast: jest.fn() }));
// 실제 모듈은 네이티브 압축기를 불러오므로 통째로 대신한다.
jest.mock("@/lib/video", () => ({
  VIDEO_TOO_LONG_MESSAGE: "too long",
  videoDurationSeconds: (asset: { duration?: number | null }) =>
    Math.ceil((asset.duration ?? 0) / 1000),
  isVideoTooLong: (asset: { duration?: number | null }) =>
    (asset.duration ?? 0) > 300_000,
  compressVideo: jest.fn(),
  createVideoThumbnail: jest.fn(),
  uploadDiaryVideo: jest.fn(),
}));

const pick = pickMedia as jest.Mock;
const uploadPhoto = uploadDiaryPhoto as jest.Mock;
const thumbnail = createVideoThumbnail as jest.Mock;
const compress = compressVideo as jest.Mock;
const uploadVideo = uploadDiaryVideo as jest.Mock;
const toast = showToast as jest.Mock;

const onError = jest.fn();

const SAVED: DiaryAttachmentResponse = {
  type: "PHOTO",
  objectKey: "diaries/1/saved.webp",
  url: "https://signed/saved.webp",
  thumbnailUrl: null,
  durationSeconds: null,
};

function photo(uri: string): ImagePickerAsset {
  return { uri, width: 100, height: 100, type: "image" };
}

function video(uri: string, duration: number | null): ImagePickerAsset {
  return { uri, width: 100, height: 100, type: "video", duration };
}

beforeEach(() => {
  jest.clearAllMocks();
  thumbnail.mockImplementation(async (uri: string) => `${uri}.thumb.jpg`);
  compress.mockImplementation(async (uri: string) => `${uri}.compressed`);
  uploadPhoto.mockImplementation(
    async (asset: ImagePickerAsset) => `diaries/1/${asset.uri}`,
  );
  uploadVideo.mockImplementation(async (videoUri: string) => ({
    objectKey: `diaries/1/${videoUri}`,
    thumbnailKey: `diaries/1/${videoUri}.thumb`,
  }));
});

describe("useDiaryAttachments", () => {
  it("고른 사진과 동영상을 순서대로 붙이고 동영상은 썸네일을 만든다", async () => {
    pick.mockResolvedValue([photo("a.jpg"), video("b.mp4", 12_000)]);
    const { result, unmount } = await renderHook(() =>
      useDiaryAttachments([SAVED], onError),
    );

    expect(result.current.dirty).toBe(false);

    await act(() => result.current.add());

    expect(result.current.items.map((item) => item.kind)).toEqual([
      "saved",
      "photo",
      "video",
    ]);
    expect(thumbnail).toHaveBeenCalledWith("b.mp4");
    expect(result.current.dirty).toBe(true);
    await unmount();
  });

  it("너무 길거나 길이를 모르는 동영상은 빼고 알린다", async () => {
    pick.mockResolvedValue([video("long.mp4", 301_000), video("x.mp4", null)]);
    const { result, unmount } = await renderHook(() =>
      useDiaryAttachments([], onError),
    );

    await act(() => result.current.add());

    expect(result.current.items).toEqual([]);
    expect(toast).toHaveBeenCalledTimes(1);
    expect(thumbnail).not.toHaveBeenCalled();
    await unmount();
  });

  it("빼면 바뀐 것으로 보고 저장 시 남긴 키만 넘긴다", async () => {
    const { result, unmount } = await renderHook(() =>
      useDiaryAttachments([SAVED], onError),
    );

    await act(() => {
      result.current.remove(0);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.dirty).toBe(true);
    await expect(result.current.upload()).resolves.toEqual([]);
    await unmount();
  });

  it("옮기면 순서가 바뀌고 범위를 벗어나면 그대로 둔다", async () => {
    pick.mockResolvedValue([photo("a.jpg"), photo("b.jpg")]);
    const { result, unmount } = await renderHook(() =>
      useDiaryAttachments([SAVED], onError),
    );

    await act(() => result.current.add());
    await act(() => {
      result.current.move(2, 0);
    });

    expect(result.current.items.map((item) => item.kind)).toEqual([
      "photo",
      "saved",
      "photo",
    ]);

    await act(() => {
      result.current.move(0, -1);
    });

    expect(result.current.items.map((item) => item.kind)).toEqual([
      "photo",
      "saved",
      "photo",
    ]);
    await unmount();
  });

  it("새 첨부만 올리고 보이는 순서대로 요청을 만든다", async () => {
    pick.mockResolvedValue([photo("a.jpg"), video("b.mp4", 12_000)]);
    const { result, unmount } = await renderHook(() =>
      useDiaryAttachments([SAVED], onError),
    );

    await act(() => result.current.add());
    const requests = await result.current.upload();

    expect(requests).toEqual([
      { objectKey: SAVED.objectKey },
      { objectKey: "diaries/1/a.jpg" },
      {
        objectKey: "diaries/1/b.mp4.compressed",
        thumbnailObjectKey: "diaries/1/b.mp4.compressed.thumb",
        durationSeconds: 12,
      },
    ]);
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
    expect(compress).toHaveBeenCalledWith(
      "b.mp4",
      expect.any(Function),
      expect.any(AbortSignal),
    );
    expect(uploadVideo).toHaveBeenCalledWith(
      "b.mp4.compressed",
      "b.mp4.thumb.jpg",
      expect.any(Function),
      expect.any(AbortSignal),
    );
    await unmount();
  });
});
