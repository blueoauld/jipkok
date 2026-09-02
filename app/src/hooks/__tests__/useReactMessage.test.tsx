import type { InfiniteData } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { setMessageReactions, useReactMessage } from "@/hooks/useReactMessage";
import { chatMessage } from "@/lib/__tests__/chat-fixtures";
import {
  api,
  type ChatMessagePage,
  type ChatReactionResponse,
} from "@/lib/api";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  api: { chats: { react: jest.fn(), unreact: jest.fn() } },
}));

const chats = api.chats as unknown as {
  react: jest.Mock;
  unreact: jest.Mock;
};

function message(messageId: number, reactions: ChatReactionResponse[] = []) {
  return chatMessage(messageId, { reactions });
}

function reactionsOf(
  client: ReturnType<typeof createTestQueryClient>,
  id: number,
) {
  return client
    .getQueryData<InfiniteData<ChatMessagePage>>(chatMessagesKey(1))
    ?.pages.flatMap((page) => page.items)
    .find((item) => item.messageId === id)?.reactions;
}

describe("setMessageReactions", () => {
  it("모든 페이지에서 해당 메시지의 반응만 바꾼다", () => {
    const client = createTestQueryClient();
    const data: InfiniteData<ChatMessagePage> = {
      pages: [
        { items: [message(3), message(2)], nextCursor: 2 },
        { items: [message(1)], nextCursor: null },
      ],
      pageParams: [undefined, 2],
    };
    client.setQueryData(chatMessagesKey(1), data);

    setMessageReactions(client, 1, {
      messageId: 1,
      reactions: [{ memberId: 9, type: "HEART" }],
    });

    const updated = client.getQueryData<InfiniteData<ChatMessagePage>>(
      chatMessagesKey(1),
    );

    expect(updated?.pages[1].items[0].reactions).toEqual([
      { memberId: 9, type: "HEART" },
    ]);
    expect(updated?.pages[0]).toBe(data.pages[0]);

    client.clear();
  });
});

describe("useReactMessage", () => {
  const ME = 1;
  const PARTNER = 2;

  function seed(reactions: ChatReactionResponse[]) {
    const client = createTestQueryClient();

    client.setQueryData<InfiniteData<ChatMessagePage>>(chatMessagesKey(1), {
      pages: [{ items: [message(10, reactions)], nextCursor: null }],
      pageParams: [undefined],
    });

    return client;
  }

  beforeEach(() => jest.clearAllMocks());

  it("내 반응만 낙관적으로 바꾸고 상대 반응은 그대로 둔다", async () => {
    const client = seed([{ memberId: PARTNER, type: "LIKE" }]);
    let resolve: (value: unknown) => void = () => undefined;
    chats.react.mockReturnValue(new Promise((r) => (resolve = r)));
    const onError = jest.fn();
    const { result } = await renderHook(() => useReactMessage(1, ME, onError), {
      wrapper: withQueryClient(client),
    });

    await act(async () => {
      result.current.mutate({ messageId: 10, type: "HEART" });
    });

    await waitFor(() =>
      expect(reactionsOf(client, 10)).toEqual([
        { memberId: PARTNER, type: "LIKE" },
        { memberId: ME, type: "HEART" },
      ]),
    );

    await act(async () => {
      resolve({
        messageId: 10,
        reactions: [
          { memberId: PARTNER, type: "LIKE" },
          { memberId: ME, type: "HEART" },
        ],
      });
    });
    expect(onError).not.toHaveBeenCalled();
    client.clear();
  });

  it("type이 null이면 취소 API를 부르고 내 반응을 지운다", async () => {
    const client = seed([
      { memberId: ME, type: "HEART" },
      { memberId: PARTNER, type: "LIKE" },
    ]);
    chats.unreact.mockResolvedValue({
      messageId: 10,
      reactions: [{ memberId: PARTNER, type: "LIKE" }],
    });
    const { result } = await renderHook(
      () => useReactMessage(1, ME, jest.fn()),
      {
        wrapper: withQueryClient(client),
      },
    );

    await act(async () => {
      result.current.mutate({ messageId: 10, type: null });
    });

    await waitFor(() =>
      expect(reactionsOf(client, 10)).toEqual([
        { memberId: PARTNER, type: "LIKE" },
      ]),
    );
    expect(chats.unreact).toHaveBeenCalledWith(1, 10);
    expect(chats.react).not.toHaveBeenCalled();
    client.clear();
  });

  it("실패하면 이전 반응으로 되돌리고 onError를 부른다", async () => {
    const client = seed([{ memberId: ME, type: "HEART" }]);
    const failure = new Error("boom");
    chats.react.mockRejectedValue(failure);
    const onError = jest.fn();
    const { result } = await renderHook(() => useReactMessage(1, ME, onError), {
      wrapper: withQueryClient(client),
    });

    await act(async () => {
      result.current.mutate({ messageId: 10, type: "LAUGH" });
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    expect(reactionsOf(client, 10)).toEqual([{ memberId: ME, type: "HEART" }]);
    client.clear();
  });
});
