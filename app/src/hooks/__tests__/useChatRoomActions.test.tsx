import type { InfiniteData } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatRoomKey } from "@/hooks/useChatRoom";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { chatRoom } from "@/lib/__tests__/chat-fixtures";
import { api, type ChatRoomPage, type ChatRoomResponse } from "@/lib/api";
import { LEAVE_DESCRIPTION, LEAVE_SELECTED_DESCRIPTION } from "@/lib/chat";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  api: {
    chats: {
      updateNotification: jest.fn(),
      updatePin: jest.fn(),
      leave: jest.fn(),
      leaveAll: jest.fn(),
      markAllRead: jest.fn(),
    },
  },
}));
// useChatRooms가 거쳐 부르는 expo-notifications의 임포트 부작용을 막는다.
jest.mock("@/lib/push/notifications", () => ({ setBadgeCount: jest.fn() }));

const chats = api.chats as unknown as {
  updateNotification: jest.Mock;
  updatePin: jest.Mock;
  leave: jest.Mock;
  leaveAll: jest.Mock;
  markAllRead: jest.Mock;
};

function room(roomId: number, extra: Partial<ChatRoomResponse> = {}) {
  return chatRoom(roomId, { unreadCount: 3, ...extra });
}

function items(client: ReturnType<typeof createTestQueryClient>) {
  return (
    client.getQueryData<InfiniteData<ChatRoomPage>>([...CHAT_ROOMS_KEY, false])
      ?.pages[0].items ?? []
  );
}

type Setup = Awaited<
  ReturnType<typeof renderHook<ReturnType<typeof useChatRoomActions>, void>>
> & {
  client: ReturnType<typeof createTestQueryClient>;
  invalidate: jest.SpyInstance;
  remove: jest.SpyInstance;
  confirm: jest.Mock;
  showApiError: jest.Mock;
};

let mounted: Setup | null = null;

async function setup(rooms: ChatRoomResponse[]): Promise<Setup> {
  const client = createTestQueryClient();

  client.setQueryData<InfiniteData<ChatRoomPage>>([...CHAT_ROOMS_KEY, false], {
    pages: [{ items: rooms, nextCursor: null }],
    pageParams: [undefined],
  });

  const invalidate = jest.spyOn(client, "invalidateQueries");
  const remove = jest.spyOn(client, "removeQueries");
  const confirm = jest.fn();
  const showApiError = jest.fn();
  const hook = await renderHook(
    () => useChatRoomActions({ show: jest.fn(), confirm, showApiError }),
    { wrapper: withQueryClient(client) },
  );

  mounted = { client, invalidate, remove, confirm, showApiError, ...hook };

  return mounted;
}

function confirmedWith(confirm: jest.Mock) {
  return confirm.mock.calls[0][0] as {
    message: string;
    destructive: boolean;
    onConfirm: () => void;
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // 테스트가 끝난 뒤 도착하는 뮤테이션 상태 알림의 act 경고를 막는다.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted?.client.clear();
  mounted = null;
});

describe("toggleNotification", () => {
  it("낙관적으로 알림 상태를 뒤집고 성공하면 방 상세를 갱신한다", async () => {
    const hook = await setup([room(1), room(2)]);
    chats.updateNotification.mockResolvedValue(undefined);

    await act(async () => hook.result.current.toggleNotification(room(1)));

    await waitFor(() =>
      expect(items(hook.client)[0]?.notificationEnabled).toBe(false),
    );
    expect(items(hook.client)[1]?.notificationEnabled).toBe(true);
    expect(chats.updateNotification).toHaveBeenCalledWith(1, false);
    await waitFor(() =>
      expect(hook.invalidate).toHaveBeenCalledWith({
        queryKey: chatRoomKey(1),
      }),
    );
  });

  it("실패하면 목록을 다시 받게 하고 오류를 알린다", async () => {
    const hook = await setup([room(1)]);
    const error = new Error("boom");
    chats.updateNotification.mockRejectedValue(error);

    await act(async () => hook.result.current.toggleNotification(room(1)));

    await waitFor(() => expect(hook.showApiError).toHaveBeenCalledWith(error));
    expect(hook.invalidate).toHaveBeenCalledWith({ queryKey: CHAT_ROOMS_KEY });
  });
});

describe("togglePin", () => {
  it("현재 상태의 반대로 고정을 요청하고 성공하면 목록을 갱신한다", async () => {
    const hook = await setup([room(1)]);
    chats.updatePin.mockResolvedValue(undefined);

    await act(async () => hook.result.current.togglePin(room(1)));

    expect(chats.updatePin).toHaveBeenCalledWith(1, true);
    await waitFor(() =>
      expect(hook.invalidate).toHaveBeenCalledWith({
        queryKey: CHAT_ROOMS_KEY,
      }),
    );
    expect(hook.invalidate).toHaveBeenCalledWith({ queryKey: chatRoomKey(1) });
  });

  it("고정된 방이면 해제를 요청한다", async () => {
    const hook = await setup([room(1, { pinned: true })]);
    chats.updatePin.mockResolvedValue(undefined);

    await act(async () =>
      hook.result.current.togglePin(room(1, { pinned: true })),
    );

    expect(chats.updatePin).toHaveBeenCalledWith(1, false);
  });

  it("실패하면 오류를 알린다", async () => {
    const hook = await setup([room(1)]);
    const error = new Error("boom");
    chats.updatePin.mockRejectedValue(error);

    await act(async () => hook.result.current.togglePin(room(1)));

    await waitFor(() =>
      expect(hook.showApiError.mock.calls[0]?.[0]).toBe(error),
    );
  });
});

describe("confirmLeave", () => {
  it("확인을 받은 뒤 낙관적으로 방을 지우고 성공하면 캐시를 정리한다", async () => {
    const hook = await setup([room(1), room(2)]);
    let resolve: (value: unknown) => void = () => undefined;
    chats.leave.mockReturnValue(new Promise((r) => (resolve = r)));
    const onLeft = jest.fn();

    hook.result.current.confirmLeave(room(1), onLeft);

    const options = confirmedWith(hook.confirm);
    expect(options.message).toBe(LEAVE_DESCRIPTION);
    expect(options.destructive).toBe(true);
    expect(chats.leave).not.toHaveBeenCalled();

    await act(async () => options.onConfirm());

    await waitFor(() =>
      expect(items(hook.client).map((item) => item.roomId)).toEqual([2]),
    );

    await act(async () => resolve(undefined));

    await waitFor(() => expect(onLeft).toHaveBeenCalled());
    expect(hook.remove).toHaveBeenCalledWith({ queryKey: chatRoomKey(1) });
    expect(hook.remove).toHaveBeenCalledWith({ queryKey: chatMessagesKey(1) });
  });

  it("실패하면 지웠던 방을 되돌리고 오류를 알린다", async () => {
    const hook = await setup([room(1), room(2)]);
    const error = new Error("boom");
    chats.leave.mockRejectedValue(error);

    hook.result.current.confirmLeave(room(1));

    await act(async () => confirmedWith(hook.confirm).onConfirm());

    await waitFor(() => expect(hook.showApiError).toHaveBeenCalledWith(error));
    expect(items(hook.client).map((item) => item.roomId)).toEqual([1, 2]);
  });
});

describe("markRoomRead", () => {
  it("낙관적으로 안 읽음을 지우고 서버에 알린다", async () => {
    const hook = await setup([room(1), room(2)]);
    chats.markAllRead.mockResolvedValue(undefined);

    await act(async () => hook.result.current.markRoomRead(room(1)));

    await waitFor(() => expect(items(hook.client)[0]?.unreadCount).toBe(0));
    expect(items(hook.client)[1]?.unreadCount).toBe(3);
    expect(chats.markAllRead).toHaveBeenCalledWith([1]);
  });

  it("실패하면 안 읽음 수를 되돌리고 오류를 알린다", async () => {
    const hook = await setup([room(1)]);
    const error = new Error("boom");
    chats.markAllRead.mockRejectedValue(error);

    await act(async () => hook.result.current.markRoomRead(room(1)));

    await waitFor(() => expect(hook.showApiError).toHaveBeenCalledWith(error));
    expect(items(hook.client)[0]?.unreadCount).toBe(3);
  });
});

describe("일괄 처리", () => {
  const MANY_ROOM_IDS = Array.from({ length: 501 }, (_, index) => index + 1);

  it("읽음 처리는 상한 단위로 끊어 차례로 보낸다", async () => {
    const hook = await setup([]);
    chats.markAllRead.mockResolvedValue(undefined);
    const onDone = jest.fn();

    await act(async () =>
      hook.result.current.markRoomsRead(MANY_ROOM_IDS, onDone),
    );

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(chats.markAllRead).toHaveBeenCalledTimes(2);
    expect(chats.markAllRead.mock.calls[0][0]).toHaveLength(500);
    expect(chats.markAllRead.mock.calls[1][0]).toEqual([501]);
  });

  it("선택한 방 나가기는 확인을 받고 끊어 보낸 뒤 캐시를 정리한다", async () => {
    const hook = await setup([room(1), room(2)]);
    chats.leaveAll.mockResolvedValue(undefined);
    const onDone = jest.fn();

    hook.result.current.confirmLeaveRooms([1, 2], onDone);

    const options = confirmedWith(hook.confirm);
    expect(options.message).toBe(LEAVE_SELECTED_DESCRIPTION);

    await act(async () => options.onConfirm());

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(chats.leaveAll).toHaveBeenCalledWith([1, 2]);
    expect(hook.remove).toHaveBeenCalledWith({ queryKey: chatRoomKey(1) });
    expect(hook.remove).toHaveBeenCalledWith({ queryKey: chatMessagesKey(2) });
  });
});
