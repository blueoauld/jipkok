import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ImagePickerAsset } from "expo-image-picker";

import { useChatMedia } from "@/hooks/useChatMedia";
import { forgetRoom } from "@/hooks/useChatSocket";
import { chatMessage } from "@/lib/__tests__/chat-fixtures";
import { logAppEvent } from "@/lib/analytics";
import { api, ApiError, type ChatMessageResponse } from "@/lib/api";
import i18n from "@/lib/i18n";
import { pickMedia } from "@/lib/photo/picker";
import { showToast } from "@/lib/toast/store";
import { VIDEO_MAX_SECONDS, VIDEO_TOO_LONG_MESSAGE } from "@/lib/video";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  api: { chats: { videoUrl: jest.fn() } },
}));
jest.mock("@/lib/photo/picker", () => ({
  MAX_PHOTOS: 6,
  pickMedia: jest.fn(),
}));
jest.mock("@/hooks/useChatSocket", () => ({ forgetRoom: jest.fn() }));
jest.mock("@/lib/analytics", () => ({
  APP_EVENT: { chatVideoTooLong: "chat_video_too_long" },
  logAppEvent: jest.fn(),
}));
jest.mock("@/lib/toast/store", () => ({ showToast: jest.fn() }));
jest.mock("react-native-compressor", () => ({ Video: {} }));
jest.mock("expo-video-thumbnails", () => ({}));

const videoUrl = api.chats.videoUrl as unknown as jest.Mock;
const pick = jest.mocked(pickMedia);

const ROOM_ID = 1;

const photo = { uri: "file:///a.jpg", type: "image" } as ImagePickerAsset;

function video(durationMillis: number | null) {
  return {
    uri: "file:///v.mp4",
    type: "video",
    duration: durationMillis,
  } as ImagePickerAsset;
}

function message(messageId: number, extra: Partial<ChatMessageResponse> = {}) {
  return chatMessage(messageId, {
    roomId: ROOM_ID,
    type: "VIDEO",
    content: null,
    ...extra,
  });
}

type Setup = Awaited<
  ReturnType<typeof renderHook<ReturnType<typeof useChatMedia>, void>>
> & {
  client: ReturnType<typeof createTestQueryClient>;
  sendPhotos: jest.Mock;
  sendVideos: jest.Mock;
  onPicked: jest.Mock;
  onError: jest.Mock;
};

let mounted: Setup | null = null;

async function setup(): Promise<Setup> {
  const client = createTestQueryClient();
  const sendPhotos = jest.fn();
  const sendVideos = jest.fn();
  const onPicked = jest.fn();
  const onError = jest.fn();
  const hook = await renderHook(
    () =>
      useChatMedia({
        roomId: ROOM_ID,
        sendPhotos,
        sendVideos,
        onPicked,
        onError,
      }),
    { wrapper: withQueryClient(client) },
  );

  mounted = { client, sendPhotos, sendVideos, onPicked, onError, ...hook };

  return mounted;
}

beforeEach(() => jest.clearAllMocks());

afterEach(async () => {
  await mounted?.unmount();
  mounted?.client.clear();
  mounted = null;
});

describe("pick", () => {
  it("사진과 보낼 수 있는 영상을 나눠 보내고 고른 뒤 정리를 한 번 부른다", async () => {
    const hook = await setup();
    const sendable = video(7000);
    pick.mockResolvedValue([photo, sendable]);

    await act(async () => hook.result.current.pick());

    expect(hook.sendPhotos).toHaveBeenCalledWith([photo]);
    expect(hook.sendVideos).toHaveBeenCalledWith([sendable]);
    expect(hook.onPicked).toHaveBeenCalledTimes(1);
    expect(showToast).not.toHaveBeenCalled();
  });

  it("너무 긴 영상은 거르고 경고와 함께 이벤트를 남긴다", async () => {
    const hook = await setup();
    pick.mockResolvedValue([video((VIDEO_MAX_SECONDS + 1) * 1000)]);

    await act(async () => hook.result.current.pick());

    expect(hook.sendVideos).not.toHaveBeenCalled();
    expect(hook.onPicked).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("warning", VIDEO_TOO_LONG_MESSAGE);
    expect(logAppEvent).toHaveBeenCalledWith("chat_video_too_long", {
      durationSeconds: String(VIDEO_MAX_SECONDS + 1),
    });
  });

  it("길이를 모르는 영상이 있으면 그 경고가 우선한다", async () => {
    const hook = await setup();
    pick.mockResolvedValue([
      video(null),
      video((VIDEO_MAX_SECONDS + 1) * 1000),
    ]);

    await act(async () => hook.result.current.pick());

    expect(hook.sendVideos).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith(
      "warning",
      i18n.t("hook.videoDurationUnknown"),
    );
  });

  it("고르다 실패하면 onError로 넘긴다", async () => {
    const hook = await setup();
    const error = new Error("denied");
    pick.mockRejectedValue(error);

    await act(async () => hook.result.current.pick());

    expect(hook.onError).toHaveBeenCalledWith(error);
    expect(hook.onPicked).not.toHaveBeenCalled();
  });
});

describe("playVideo", () => {
  it("아직 안 보낸 메시지는 로컬 파일을 그대로 재생한다", async () => {
    const hook = await setup();

    await act(async () =>
      hook.result.current.playVideo(
        message(-1, { videoUrl: "file:///local.mp4" }),
      ),
    );

    expect(hook.result.current.playingUrl).toBe("file:///local.mp4");
    expect(videoUrl).not.toHaveBeenCalled();
  });

  it("보낸 메시지는 재생 URL을 새로 받아 재생한다", async () => {
    const hook = await setup();
    videoUrl.mockResolvedValue({ url: "https://cdn/video.mp4?sig=1" });

    await act(async () => hook.result.current.playVideo(message(10)));

    await waitFor(() =>
      expect(hook.result.current.playingUrl).toBe(
        "https://cdn/video.mp4?sig=1",
      ),
    );
    expect(videoUrl).toHaveBeenCalledWith(ROOM_ID, 10);
  });

  it("방이 없어진 오류면 토스트 없이 방을 잊는다", async () => {
    const hook = await setup();
    videoUrl.mockRejectedValue(new ApiError(404, "CHAT_004", "gone"));

    await act(async () => hook.result.current.playVideo(message(10)));

    expect(forgetRoom).toHaveBeenCalledWith(expect.anything(), ROOM_ID);
    expect(showToast).not.toHaveBeenCalled();
    expect(hook.result.current.playingUrl).toBeNull();
  });

  it("다른 오류면 실패 토스트를 띄운다", async () => {
    const hook = await setup();
    videoUrl.mockRejectedValue(new ApiError(500, "X", "boom"));

    await act(async () => hook.result.current.playVideo(message(10)));

    expect(showToast).toHaveBeenCalledWith(
      "error",
      i18n.t("hook.videoUrlFailed"),
    );
    expect(forgetRoom).not.toHaveBeenCalled();
  });
});
