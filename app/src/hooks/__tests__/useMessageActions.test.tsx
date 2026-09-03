import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useMessageActions } from "@/hooks/useMessageActions";
import { chatMessage } from "@/lib/__tests__/chat-fixtures";
import { api, type ChatMessageResponse } from "@/lib/api";
import { copyMessage, saveMedia } from "@/lib/chat/media";
import type { MessageFrame } from "@/lib/chat/overlay-layout";
import i18n from "@/lib/i18n";
import { showToast } from "@/lib/toast/store";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  api: { chats: { react: jest.fn(), unreact: jest.fn(), videoUrl: jest.fn() } },
}));
jest.mock("@/lib/chat/media", () => ({
  copyMessage: jest.fn(),
  saveMedia: jest.fn(),
}));
jest.mock("@/lib/toast/store", () => ({ showToast: jest.fn() }));

const chats = api.chats as unknown as {
  react: jest.Mock;
  unreact: jest.Mock;
  videoUrl: jest.Mock;
};

const ROOM_ID = 1;
const ME = 10;
const PARTNER = 20;

const frame: MessageFrame = { x: 0, y: 0, width: 100, height: 40 };

function message(messageId: number, extra: Partial<ChatMessageResponse> = {}) {
  return chatMessage(messageId, {
    roomId: ROOM_ID,
    senderId: PARTNER,
    ...extra,
  });
}

type Setup = Awaited<
  ReturnType<typeof renderHook<ReturnType<typeof useMessageActions>, void>>
> & {
  client: ReturnType<typeof createTestQueryClient>;
  onError: jest.Mock;
  onReply: jest.Mock;
};

let mounted: Setup | null = null;

async function setup(): Promise<Setup> {
  const client = createTestQueryClient();
  const onError = jest.fn();
  const onReply = jest.fn();
  const hook = await renderHook(
    () => useMessageActions(ROOM_ID, ME, onError, onReply),
    { wrapper: withQueryClient(client) },
  );

  mounted = { client, onError, onReply, ...hook };

  return mounted;
}

async function open(hook: Setup, target: ChatMessageResponse) {
  await act(async () => hook.result.current.open(target, frame));
}

beforeEach(() => jest.clearAllMocks());

afterEach(async () => {
  await mounted?.unmount();
  mounted?.client.clear();
  mounted = null;
});

describe("열기와 닫기", () => {
  it("아직 안 보낸 메시지는 열리지 않는다", async () => {
    const hook = await setup();

    await open(hook, message(-1));

    expect(hook.result.current.target).toBeNull();
  });

  it("내 메시지인지 함께 담아 연다", async () => {
    const hook = await setup();

    await open(hook, message(5, { senderId: ME }));

    expect(hook.result.current.target).toEqual(
      expect.objectContaining({ mine: true, frame }),
    );

    await act(async () => hook.result.current.close());

    expect(hook.result.current.target).toBeNull();
  });
});

describe("selectReaction", () => {
  it("새 반응을 고르면 오버레이를 닫고 반응을 보낸다", async () => {
    const hook = await setup();
    chats.react.mockResolvedValue({ messageId: 5, reactions: [] });

    await open(hook, message(5));
    await act(async () => hook.result.current.selectReaction("HEART"));

    expect(hook.result.current.target).toBeNull();
    await waitFor(() =>
      expect(chats.react).toHaveBeenCalledWith(ROOM_ID, 5, "HEART"),
    );
  });

  it("이미 한 반응을 다시 고르면 해제한다", async () => {
    const hook = await setup();
    chats.unreact.mockResolvedValue({ messageId: 5, reactions: [] });

    await open(
      hook,
      message(5, { reactions: [{ memberId: ME, type: "HEART" }] }),
    );

    expect(hook.result.current.myReaction).toBe("HEART");

    await act(async () => hook.result.current.selectReaction("HEART"));

    await waitFor(() => expect(chats.unreact).toHaveBeenCalledWith(ROOM_ID, 5));
    expect(chats.react).not.toHaveBeenCalled();
  });
});

describe("actions", () => {
  it("어떤 메시지든 마지막 항목은 답장이고 누르면 닫히며 넘겨준다", async () => {
    const hook = await setup();
    const target = message(5, { content: "안녕" });
    await open(hook, target);

    const reply = hook.result.current.actions.at(-1);
    expect(reply?.label).toBe(i18n.t("action.reply"));

    await act(async () => reply?.onPress());

    expect(hook.onReply).toHaveBeenCalledWith(target);
    expect(hook.result.current.target).toBeNull();
  });

  it("영상 메시지는 재생 URL을 받아 저장한다", async () => {
    const hook = await setup();
    chats.videoUrl.mockResolvedValue({ url: "https://cdn/v.mp4" });

    await open(hook, message(5, { type: "VIDEO", content: null }));

    const [save] = hook.result.current.actions;
    expect(save.label).toBe(i18n.t("action.save"));

    await act(async () => save.onPress());

    expect(hook.result.current.target).toBeNull();
    await waitFor(() =>
      expect(saveMedia).toHaveBeenCalledWith("https://cdn/v.mp4", "video"),
    );
    expect(chats.videoUrl).toHaveBeenCalledWith(ROOM_ID, 5);
  });

  it("영상 URL을 못 받으면 실패 토스트를 띄운다", async () => {
    const hook = await setup();
    chats.videoUrl.mockRejectedValue(new Error("boom"));

    await open(hook, message(5, { type: "VIDEO", content: null }));
    await act(async () => hook.result.current.actions[0].onPress());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "error",
        i18n.t("media.videoSaveFailed"),
      ),
    );
    expect(saveMedia).not.toHaveBeenCalled();
  });

  it("사진 메시지는 이미지를 저장한다", async () => {
    const hook = await setup();

    await open(
      hook,
      message(5, { type: "PHOTO", content: null, imageUrl: "https://cdn/p" }),
    );
    await act(async () => hook.result.current.actions[0].onPress());

    expect(saveMedia).toHaveBeenCalledWith("https://cdn/p", "photo");
  });

  it("텍스트 메시지는 내용을 복사한다", async () => {
    const hook = await setup();

    await open(hook, message(5, { content: "안녕" }));

    const [copy] = hook.result.current.actions;
    expect(copy.label).toBe(i18n.t("action.copy"));

    await act(async () => copy.onPress());

    expect(copyMessage).toHaveBeenCalledWith("안녕");
  });
});
