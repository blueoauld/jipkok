import type { InfiniteData } from "@tanstack/react-query";

import { keepUploadingMessages } from "@/hooks/useChatMessages";
import type { ChatMessagePage, ChatMessageResponse } from "@/lib/api";
import { useUploadStore } from "@/lib/chat/upload-store";

type Feed = InfiniteData<ChatMessagePage>;

function message(
  messageId: number,
  clientMessageId: string | null,
): ChatMessageResponse {
  return {
    messageId,
    roomId: 1,
    senderId: 10,
    type: "TEXT",
    content: "안녕",
    imageUrl: null,
    replyMessage: null,
    createdAt: "2026-08-20T00:00:00Z",
    clientMessageId,
    reactions: [],
  };
}

function feed(items: ChatMessageResponse[]): Feed {
  return {
    pages: [{ items, nextCursor: null }],
    pageParams: [undefined],
  };
}

function registerUpload(clientMessageId: string) {
  useUploadStore.getState().set(clientMessageId, {
    phase: "uploading",
    progress: 0.5,
    cancel: () => undefined,
    retry: () => undefined,
  });
}

describe("keepUploadingMessages", () => {
  afterEach(() => {
    useUploadStore.getState().clear();
  });

  it("업로드 중인 낙관적 메시지를 새 데이터 앞에 남긴다", () => {
    // given
    registerUpload("temp-1");
    const previous = feed([message(-1, "temp-1"), message(100, "real-1")]);
    const next = feed([message(101, "real-2"), message(100, "real-1")]);

    // when
    const merged = keepUploadingMessages(previous, next) as Feed;

    // then
    expect(merged.pages[0].items.map((item) => item.messageId)).toEqual([
      -1, 101, 100,
    ]);
  });

  it("서버 응답에 같은 clientMessageId가 있으면 임시 메시지를 버린다", () => {
    // given
    registerUpload("temp-1");
    const previous = feed([message(-1, "temp-1")]);
    const next = feed([message(101, "temp-1")]);

    // when
    const merged = keepUploadingMessages(previous, next) as Feed;

    // then
    expect(merged.pages[0].items.map((item) => item.messageId)).toEqual([101]);
  });

  it("업로드 항목이 없는 임시 메시지는 남기지 않는다", () => {
    // given
    const previous = feed([message(-1, "temp-1")]);
    const next = feed([message(101, "real-1")]);

    // when
    const merged = keepUploadingMessages(previous, next) as Feed;

    // then
    expect(merged.pages[0].items.map((item) => item.messageId)).toEqual([101]);
  });

  it("내용이 같으면 이전 데이터의 참조를 유지한다", () => {
    // given
    const previous = feed([message(101, "real-1")]);
    const next = feed([message(101, "real-1")]);

    // when
    const merged = keepUploadingMessages(previous, next);

    // then
    expect(merged).toBe(previous);
  });

  it("이전 데이터가 없으면 새 데이터를 그대로 쓴다", () => {
    // given
    const next = feed([message(101, "real-1")]);

    // when
    const merged = keepUploadingMessages(undefined, next);

    // then
    expect(merged).toBe(next);
  });
});
