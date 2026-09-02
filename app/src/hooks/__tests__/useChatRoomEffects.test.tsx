import { type InfiniteData, onlineManager } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import { useChatRoomEffects } from "@/hooks/useChatRoomEffects";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { CHAT_UNREAD_COUNT_KEY } from "@/hooks/useChatUnreadCount";
import { chatMessage, chatRoom } from "@/lib/__tests__/chat-fixtures";
import {
  api,
  type ChatMessageResponse,
  type ChatRoomPage,
  type ChatRoomResponse,
} from "@/lib/api";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  api: { chats: { markRead: jest.fn() } },
}));
jest.mock("@/lib/push/notifications", () => ({
  setBadgeCount: jest.fn(),
  dismissRoomNotifications: jest.fn(() => Promise.resolve()),
}));
jest.mock("@/lib/review/store", () => ({
  maybeRequestReview: jest.fn(() => Promise.resolve()),
}));

const markRead = api.chats.markRead as unknown as jest.Mock;

const ROOM_ID = 1;
const PARTNER_ID = 2;

const roomsKey = [...CHAT_ROOMS_KEY, false];

function message(messageId: number) {
  return chatMessage(messageId, { roomId: ROOM_ID, senderId: PARTNER_ID });
}

function room(roomId: number, extra: Partial<ChatRoomResponse> = {}) {
  return chatRoom(roomId, { memberId: PARTNER_ID, unreadCount: 3, ...extra });
}

function seed(
  client: ReturnType<typeof createTestQueryClient>,
  rooms: ChatRoomResponse[],
  totalUnread: number,
) {
  const data: InfiniteData<ChatRoomPage> = {
    pages: [{ items: rooms, nextCursor: null }],
    pageParams: [undefined],
  };
  client.setQueryData(roomsKey, data);
  client.setQueryData(CHAT_UNREAD_COUNT_KEY, totalUnread);
}

function rooms(client: ReturnType<typeof createTestQueryClient>) {
  return (
    client.getQueryData<InfiniteData<ChatRoomPage>>(roomsKey)?.pages[0].items ??
    []
  );
}

let mounted: { unmount: () => Promise<void> } | null = null;

async function setup(
  client: ReturnType<typeof createTestQueryClient>,
  messages: ChatMessageResponse[],
) {
  const hook = await renderHook(
    () => useChatRoomEffects(ROOM_ID, messages, PARTNER_ID),
    { wrapper: withQueryClient(client) },
  );

  mounted = hook;

  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  // 테스트가 끝난 뒤 도착하는 뮤테이션 상태 알림의 act 경고를 막는다.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  onlineManager.setOnline(true);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe("useChatRoomEffects 읽음 처리", () => {
  it("들어가면 서버 응답 전에 방 배지와 전체 안읽음 수를 지운다", async () => {
    const client = createTestQueryClient();
    seed(client, [room(ROOM_ID), room(9, { unreadCount: 2 })], 5);
    markRead.mockReturnValue(new Promise(() => undefined));

    await setup(client, [message(10)]);

    await waitFor(() => expect(rooms(client)[0]?.unreadCount).toBe(0));
    expect(rooms(client)[1]?.unreadCount).toBe(2);
    expect(client.getQueryData(CHAT_UNREAD_COUNT_KEY)).toBe(2);
    expect(markRead).toHaveBeenCalledWith(ROOM_ID, 10);
  });

  it("배지가 이미 없으면 전체 안읽음 수를 건드리지 않는다", async () => {
    const client = createTestQueryClient();
    seed(client, [room(ROOM_ID, { unreadCount: 0 })], 5);
    markRead.mockReturnValue(new Promise(() => undefined));

    await setup(client, [message(10)]);

    await waitFor(() => expect(markRead).toHaveBeenCalled());
    expect(client.getQueryData(CHAT_UNREAD_COUNT_KEY)).toBe(5);
  });

  it("성공하면 목록을 다시 받게 한다", async () => {
    const client = createTestQueryClient();
    seed(client, [room(ROOM_ID)], 3);
    const invalidate = jest.spyOn(client, "invalidateQueries");
    markRead.mockResolvedValue(undefined);

    await setup(client, [message(10)]);

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: CHAT_ROOMS_KEY }),
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: CHAT_UNREAD_COUNT_KEY,
    });
  });

  it("메시지가 없으면 읽음 처리를 하지 않는다", async () => {
    const client = createTestQueryClient();
    seed(client, [room(ROOM_ID)], 3);

    await setup(client, []);

    expect(markRead).not.toHaveBeenCalled();
    expect(rooms(client)[0]?.unreadCount).toBe(3);
  });
});
