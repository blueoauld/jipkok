import type { InfiniteData } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatRoomKey } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { useChatSocket } from "@/hooks/useChatSocket";
import { CHAT_UNREAD_COUNT_KEY } from "@/hooks/useChatUnreadCount";
import type { ChatMessagePage, ChatMessageResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";
import { type ChatEvent, createChatSocket } from "@/lib/chat/socket";
import { useDeletedRoomStore } from "@/lib/chat/store";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/chat/socket", () => ({ createChatSocket: jest.fn() }));

const socket = { activate: jest.fn(), deactivate: jest.fn() };
let handle: (event: ChatEvent) => void = () => undefined;
let reconnect: () => void = () => undefined;

function message(messageId: number, roomId = 1): ChatMessageResponse {
  return {
    messageId,
    roomId,
    senderId: 2,
    type: "TEXT",
    content: "hi",
    createdAt: "2026-08-18T00:00:00Z",
    replyMessage: null,
    reactions: [],
  };
}

function seedRoom(
  client: ReturnType<typeof createTestQueryClient>,
  roomId: number,
) {
  client.setQueryData<InfiniteData<ChatMessagePage>>(chatMessagesKey(roomId), {
    pages: [
      { items: [message(2, roomId)], nextCursor: 1 },
      { items: [message(1, roomId)], nextCursor: null },
    ],
    pageParams: [undefined, 1],
  });
  client.setQueryData(chatRoomKey(roomId), { roomId });
  client.setQueryData(CHAT_ROOMS_KEY, []);
  client.setQueryData(CHAT_UNREAD_COUNT_KEY, 0);
}

function messagesOf(
  client: ReturnType<typeof createTestQueryClient>,
  roomId: number,
) {
  return client
    .getQueryData<InfiniteData<ChatMessagePage>>(chatMessagesKey(roomId))
    ?.pages.map((page) => page.items.map((item) => item.messageId));
}

describe("useChatSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createChatSocket).mockImplementation((onEvent, onReconnect) => {
      handle = onEvent;
      reconnect = onReconnect;

      return socket as never;
    });
    useAuthStore.setState({ status: "authenticated" });
    useDeletedRoomStore.getState().clear();
  });

  it("로그인 상태에서만 소켓을 연다", async () => {
    useAuthStore.setState({ status: "unauthenticated" });
    const client = createTestQueryClient();

    await renderHook(() => useChatSocket(), {
      wrapper: withQueryClient(client),
    });

    expect(createChatSocket).not.toHaveBeenCalled();
    client.clear();
  });

  it("MESSAGE는 첫 페이지 맨 앞에 넣고 목록과 안 읽음 수를 다시 받는다", async () => {
    const client = createTestQueryClient();
    seedRoom(client, 1);
    await renderHook(() => useChatSocket(), {
      wrapper: withQueryClient(client),
    });

    expect(socket.activate).toHaveBeenCalled();

    await act(async () =>
      handle({ type: "MESSAGE", roomId: 1, message: message(3) }),
    );

    expect(messagesOf(client, 1)).toEqual([[3, 2], [1]]);
    expect(client.getQueryState(CHAT_ROOMS_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(CHAT_UNREAD_COUNT_KEY)?.isInvalidated).toBe(
      true,
    );
    client.clear();
  });

  it("REACTION은 해당 메시지의 반응만 바꾸고 목록은 건드리지 않는다", async () => {
    const client = createTestQueryClient();
    seedRoom(client, 1);
    await renderHook(() => useChatSocket(), {
      wrapper: withQueryClient(client),
    });

    await act(async () =>
      handle({
        type: "REACTION",
        roomId: 1,
        reaction: { messageId: 1, reactions: [{ memberId: 2, type: "HEART" }] },
      }),
    );

    const pages = client.getQueryData<InfiniteData<ChatMessagePage>>(
      chatMessagesKey(1),
    )?.pages;

    expect(pages?.[1].items[0].reactions).toEqual([
      { memberId: 2, type: "HEART" },
    ]);
    expect(client.getQueryState(CHAT_ROOMS_KEY)?.isInvalidated).toBe(false);
    client.clear();
  });

  it("ROOM_DELETED는 방을 지운 것으로 표시하고 방 캐시를 없앤다", async () => {
    const client = createTestQueryClient();
    seedRoom(client, 1);
    await renderHook(() => useChatSocket(), {
      wrapper: withQueryClient(client),
    });

    await act(async () => handle({ type: "ROOM_DELETED", roomId: 1 }));

    expect(useDeletedRoomStore.getState().roomId).toBe(1);
    expect(client.getQueryData(chatRoomKey(1))).toBeUndefined();
    expect(client.getQueryData(chatMessagesKey(1))).toBeUndefined();
    expect(client.getQueryState(CHAT_ROOMS_KEY)?.isInvalidated).toBe(true);
    client.clear();
  });

  it("끊겼다 다시 붙으면 채팅 캐시를 통째로 다시 받는다", async () => {
    const client = createTestQueryClient();
    seedRoom(client, 1);
    const spy = jest.spyOn(client, "invalidateQueries");
    await renderHook(() => useChatSocket(), {
      wrapper: withQueryClient(client),
    });

    await act(async () => reconnect());

    expect(spy).toHaveBeenCalledWith({ queryKey: ["chats"] });
    client.clear();
  });

  it("언마운트하면 소켓을 닫는다", async () => {
    const client = createTestQueryClient();
    const { unmount } = await renderHook(() => useChatSocket(), {
      wrapper: withQueryClient(client),
    });

    await unmount();

    expect(socket.deactivate).toHaveBeenCalled();
    client.clear();
  });
});
