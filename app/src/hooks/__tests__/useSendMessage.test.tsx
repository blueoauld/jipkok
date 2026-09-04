import { type InfiniteData, onlineManager } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ImagePickerAsset } from "expo-image-picker";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { useSendMessage } from "@/hooks/useSendMessage";
import { chatMessage, chatRoom } from "@/lib/__tests__/chat-fixtures";
import {
  api,
  ApiError,
  type ChatMessagePage,
  type ChatMessageResponse,
  type ChatRoomPage,
  type ChatRoomResponse,
} from "@/lib/api";
import { useUploadStore } from "@/lib/chat/upload-store";
import { toChatPhoto, uploadChatPhotoFile } from "@/lib/photo";
import { showToast } from "@/lib/toast/store";
import { uploadCancelled } from "@/lib/upload";
import {
  compressVideo,
  createVideoThumbnail,
  uploadChatVideo,
} from "@/lib/video";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  api: { chats: { send: jest.fn() } },
}));
jest.mock("@/lib/photo", () => ({
  toChatPhoto: jest.fn(),
  uploadChatPhotoFile: jest.fn(),
}));
jest.mock("@/lib/video", () => ({
  compressVideo: jest.fn(),
  createVideoThumbnail: jest.fn(),
  uploadChatVideo: jest.fn(),
  videoDurationSeconds: () => 7,
}));
jest.mock("@/lib/toast/store", () => ({ showToast: jest.fn() }));

const send = api.chats.send as unknown as jest.Mock;
const toJpeg = jest.mocked(toChatPhoto);
const uploadPhoto = jest.mocked(uploadChatPhotoFile);
const compress = jest.mocked(compressVideo);
const thumbnail = jest.mocked(createVideoThumbnail);
const uploadVideo = jest.mocked(uploadChatVideo);

const ROOM_ID = 1;
const ME = 10;

const asset = { uri: "file:///a.jpg", duration: 7000 } as ImagePickerAsset;

function serverMessage(
  messageId: number,
  extra: Partial<ChatMessageResponse> = {},
) {
  return chatMessage(messageId, {
    roomId: ROOM_ID,
    senderId: ME,
    content: "old",
    ...extra,
  });
}

function seed(client: ReturnType<typeof createTestQueryClient>) {
  const data: InfiniteData<ChatMessagePage> = {
    pages: [{ items: [serverMessage(1)], nextCursor: null }],
    pageParams: [undefined],
  };
  client.setQueryData(chatMessagesKey(ROOM_ID), data);
}

function items(client: ReturnType<typeof createTestQueryClient>) {
  return (
    client.getQueryData<InfiniteData<ChatMessagePage>>(chatMessagesKey(ROOM_ID))
      ?.pages[0].items ?? []
  );
}

function uploads() {
  return Object.values(useUploadStore.getState().uploads);
}

const roomsKey = [...CHAT_ROOMS_KEY, false];

function room(roomId: number, extra: Partial<ChatRoomResponse> = {}) {
  return chatRoom(roomId, { lastMessageContent: "old", ...extra });
}

function seedRooms(
  client: ReturnType<typeof createTestQueryClient>,
  rooms: ChatRoomResponse[] = [room(ROOM_ID)],
) {
  const data: InfiniteData<ChatRoomPage> = {
    pages: [{ items: rooms, nextCursor: null }],
    pageParams: [undefined],
  };
  client.setQueryData(roomsKey, data);
}

function seededRooms(client: ReturnType<typeof createTestQueryClient>) {
  return (
    client.getQueryData<InfiniteData<ChatRoomPage>>(roomsKey)?.pages[0].items ??
    []
  );
}

type Setup = Awaited<
  ReturnType<typeof renderHook<ReturnType<typeof useSendMessage>, void>>
> & {
  client: ReturnType<typeof createTestQueryClient>;
  invalidate: jest.SpyInstance;
  onError: jest.Mock;
};

let mounted: Setup | null = null;

async function setup(): Promise<Setup> {
  const client = createTestQueryClient();
  seed(client);
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const onError = jest.fn();
  const hook = await renderHook(() => useSendMessage(ROOM_ID, ME, onError), {
    wrapper: withQueryClient(client),
  });

  mounted = { client, invalidate, onError, ...hook };

  return mounted;
}

async function settle(done: () => boolean) {
  await waitFor(() => expect(done()).toBe(true));
}

afterEach(async () => {
  await mounted?.unmount();
  mounted?.client.clear();
  mounted = null;
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  onlineManager.setOnline(true);
  useUploadStore.setState({ uploads: {} });
  toJpeg.mockResolvedValue("file:///a.jpeg");
  uploadPhoto.mockResolvedValue("photo-key");
  thumbnail.mockResolvedValue("file:///thumb.jpg");
  compress.mockResolvedValue("file:///small.mp4");
  uploadVideo.mockResolvedValue({ objectKey: "v", thumbnailKey: "t" });
});

describe("useSendMessage 텍스트", () => {
  it("서버 응답 전에 방 목록 미리보기를 바꾼다", async () => {
    const hook = await setup();
    seedRooms(hook.client);
    send.mockReturnValue(new Promise(() => undefined));

    await act(async () => hook.result.current.sendText("hi"));

    expect(seededRooms(hook.client)[0]?.lastMessageContent).toBe("hi");
  });

  it("보낸 방을 1페이지의 고정 섹션 아래 맨 위로 올린다", async () => {
    const hook = await setup();
    seedRooms(hook.client, [room(9, { pinned: true }), room(8), room(ROOM_ID)]);
    send.mockReturnValue(new Promise(() => undefined));

    await act(async () => hook.result.current.sendText("hi"));

    expect(seededRooms(hook.client).map((room) => room.roomId)).toEqual([
      9,
      ROOM_ID,
      8,
    ]);
  });

  it("고정한 방에서 보내면 맨 위로 올린다", async () => {
    const hook = await setup();
    seedRooms(hook.client, [
      room(9, { pinned: true }),
      room(ROOM_ID, { pinned: true }),
      room(8),
    ]);
    send.mockReturnValue(new Promise(() => undefined));

    await act(async () => hook.result.current.sendText("hi"));

    expect(seededRooms(hook.client).map((room) => room.roomId)).toEqual([
      ROOM_ID,
      9,
      8,
    ]);
  });

  it("임시 메시지를 앞에 넣었다가 응답으로 바꾸고 방 목록을 갱신한다", async () => {
    const hook = await setup();
    send.mockResolvedValue(serverMessage(2, { content: "hi" }));

    await act(async () => hook.result.current.sendText("hi"));

    await settle(() => items(hook.client)[0]?.messageId === 2);
    expect(items(hook.client).map((item) => item.messageId)).toEqual([2, 1]);
    expect(hook.invalidate).toHaveBeenCalledWith({ queryKey: CHAT_ROOMS_KEY });
    expect(send).toHaveBeenCalledWith(
      ROOM_ID,
      expect.objectContaining({ type: "TEXT", content: "hi" }),
    );
  });

  it("보내는 동안 임시 메시지를 업로드 저장소에 올려 재조회가 지우지 못하게 한다", async () => {
    const hook = await setup();
    let resolve: (message: ChatMessageResponse) => void = () => undefined;
    send.mockReturnValue(
      new Promise<ChatMessageResponse>((next) => {
        resolve = next;
      }),
    );

    await act(async () => hook.result.current.sendText("hi"));

    expect(uploads().map((upload) => upload.phase)).toEqual(["sending"]);

    await act(async () => resolve(serverMessage(2, { content: "hi" })));
    await settle(() => items(hook.client)[0]?.messageId === 2);
    expect(uploads()).toEqual([]);
  });

  it("실패하면 임시 메시지를 남기고 failed 상태로 두며, 재전송은 같은 clientMessageId를 쓴다", async () => {
    const hook = await setup();
    const error = new ApiError(500, "X", "boom");
    send.mockRejectedValueOnce(error);

    await act(async () => hook.result.current.sendText("hi"));

    await settle(() => uploads()[0]?.phase === "failed");
    const temp = items(hook.client)[0];
    expect(temp.messageId).toBeLessThan(0);
    expect(hook.onError).toHaveBeenCalledWith(error);

    send.mockResolvedValue(serverMessage(2, { content: "hi" }));
    await act(async () => uploads()[0].retry());

    await settle(() => items(hook.client)[0]?.messageId === 2);
    expect(items(hook.client).map((item) => item.messageId)).toEqual([2, 1]);
    expect(send).toHaveBeenLastCalledWith(
      ROOM_ID,
      expect.objectContaining({ clientMessageId: temp.clientMessageId }),
    );
    expect(uploads()).toEqual([]);
  });

  it("실패한 메시지를 지우면 임시 메시지와 저장소 항목이 없어진다", async () => {
    const hook = await setup();
    send.mockRejectedValue(new ApiError(500, "X", "boom"));

    await act(async () => hook.result.current.sendText("hi"));

    await settle(() => uploads()[0]?.phase === "failed");
    await act(async () => uploads()[0].cancel());

    expect(items(hook.client).map((item) => item.messageId)).toEqual([1]);
    expect(uploads()).toEqual([]);
  });
});

describe("useSendMessage 사진", () => {
  it("업로드 중엔 uploading이 켜지고 끝나면 응답으로 바뀐다", async () => {
    const hook = await setup();
    let finishUpload: (key: string) => void = () => undefined;
    uploadPhoto.mockReturnValue(
      new Promise((resolve) => {
        finishUpload = resolve;
      }),
    );
    send.mockResolvedValue(serverMessage(2, { type: "PHOTO", content: null }));

    await act(async () => hook.result.current.sendPhotos([asset]));

    await waitFor(() => expect(hook.result.current.uploading).toBe(true));
    expect(items(hook.client)[0]?.type).toBe("PHOTO");
    expect(items(hook.client)[0]?.messageId).toBeLessThan(0);
    expect(uploads()[0]?.phase).toBe("uploading");

    await act(async () => finishUpload("photo-key"));

    await settle(() => hook.result.current.uploading === false);
    expect(items(hook.client)[0]).toEqual(
      expect.objectContaining({ messageId: 2, imageUrl: asset.uri }),
    );
    expect(uploads()).toHaveLength(0);
    expect(hook.invalidate).toHaveBeenCalledWith({ queryKey: CHAT_ROOMS_KEY });
  });

  it("실패하면 임시 메시지를 남기고 failed 상태로 두며, 재전송은 변환본을 다시 쓴다", async () => {
    const hook = await setup();
    uploadPhoto.mockRejectedValueOnce(new Error("network"));
    send.mockResolvedValue(serverMessage(2, { type: "PHOTO", content: null }));

    await act(async () => hook.result.current.sendPhotos([asset]));

    await waitFor(() => expect(uploads()[0]?.phase).toBe("failed"));
    expect(items(hook.client)[0]?.messageId).toBeLessThan(0);
    expect(hook.onError).toHaveBeenCalledWith(expect.any(ApiError));

    await act(async () => uploads()[0].retry());

    await settle(() => items(hook.client)[0]?.messageId === 2);
    expect(toJpeg).toHaveBeenCalledTimes(1);
    expect(uploadPhoto).toHaveBeenCalledTimes(2);
    expect(uploads()).toHaveLength(0);
  });

  it("취소하면 임시 메시지를 지우고 오류를 알리지 않는다", async () => {
    const hook = await setup();
    uploadPhoto.mockImplementation(
      (_uri, _progress, signal) =>
        new Promise((_resolve, reject) =>
          signal?.addEventListener("abort", () => reject(uploadCancelled())),
        ),
    );

    await act(async () => hook.result.current.sendPhotos([asset]));

    await waitFor(() => expect(uploads()).toHaveLength(1));

    await act(async () => uploads()[0].cancel());

    await settle(() => hook.result.current.uploading === false);
    expect(items(hook.client).map((item) => item.messageId)).toEqual([1]);
    expect(uploads()).toHaveLength(0);
    expect(hook.onError).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("여러 장은 차례로 보낸다", async () => {
    const hook = await setup();
    send
      .mockResolvedValueOnce(serverMessage(2, { type: "PHOTO", content: null }))
      .mockResolvedValueOnce(
        serverMessage(3, { type: "PHOTO", content: null }),
      );

    await act(async () =>
      hook.result.current.sendPhotos([
        asset,
        { ...asset, uri: "file:///b.jpg" },
      ]),
    );

    await settle(() => items(hook.client)[0]?.messageId === 3);
    expect(items(hook.client).map((item) => item.messageId)).toEqual([3, 2, 1]);
  });
});

describe("useSendMessage 동영상", () => {
  it("연결이 없으면 압축도 업로드도 않고, 연결된 뒤 재전송하면 보낸다", async () => {
    const hook = await setup();
    onlineManager.setOnline(false);

    await act(async () => hook.result.current.sendVideos([asset]));

    await waitFor(() => expect(uploads()[0]?.phase).toBe("failed"));
    expect(compress).not.toHaveBeenCalled();
    expect(uploadVideo).not.toHaveBeenCalled();
    expect(hook.onError).toHaveBeenCalled();

    onlineManager.setOnline(true);
    send.mockResolvedValue(serverMessage(2, { type: "VIDEO", content: null }));

    await act(async () => uploads()[0].retry());

    await settle(() => items(hook.client)[0]?.messageId === 2);
    expect(compress).toHaveBeenCalledTimes(1);
  });

  it("압축 후 업로드하고, 재전송 땐 압축을 건너뛴다", async () => {
    const hook = await setup();
    uploadVideo.mockRejectedValueOnce(new Error("network"));
    send.mockResolvedValue(serverMessage(2, { type: "VIDEO", content: null }));

    await act(async () => hook.result.current.sendVideos([asset]));

    await waitFor(() => expect(uploads()[0]?.phase).toBe("failed"));
    expect(items(hook.client)[0]).toEqual(
      expect.objectContaining({
        type: "VIDEO",
        thumbnailUrl: "file:///thumb.jpg",
        durationSeconds: 7,
      }),
    );

    await act(async () => uploads()[0].retry());

    await settle(() => items(hook.client)[0]?.messageId === 2);
    expect(compress).toHaveBeenCalledTimes(1);
    expect(uploadVideo).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledWith(
      ROOM_ID,
      expect.objectContaining({
        type: "VIDEO",
        objectKey: "v",
        thumbnailKey: "t",
        durationSeconds: 7,
      }),
    );
    expect(items(hook.client)[0]).toEqual(
      expect.objectContaining({
        messageId: 2,
        videoUrl: "file:///small.mp4",
        thumbnailUrl: "file:///thumb.jpg",
      }),
    );
  });

  it("썸네일을 못 만들면 임시 메시지 없이 오류만 알린다", async () => {
    const hook = await setup();
    thumbnail.mockRejectedValue(new Error("no thumbnail"));

    await act(async () => hook.result.current.sendVideos([asset]));

    await settle(() => hook.onError.mock.calls.length > 0);
    expect(items(hook.client).map((item) => item.messageId)).toEqual([1]);
    expect(hook.result.current.uploading).toBe(false);
  });
});

describe("useSendMessage 안드로이드 안내", () => {
  it("전송을 시작하면 앱을 켜 두라는 토스트를 띄운다", async () => {
    jest.replaceProperty(
      jest.requireActual("react-native").Platform,
      "OS",
      "android",
    );
    const hook = await setup();
    send.mockResolvedValue(serverMessage(2, { type: "PHOTO", content: null }));

    await act(async () => hook.result.current.sendPhotos([asset]));

    await settle(() => items(hook.client)[0]?.messageId === 2);
    expect(showToast).toHaveBeenCalledWith(
      "info",
      expect.stringContaining("켜"),
    );
  });
});
