import type { StompConfig } from "@stomp/stompjs";

import { getAccessToken, restoreSession } from "@/lib/api";
import { createChatSocket } from "@/lib/chat/socket";

jest.mock("@bacons/text-decoder/install", () => ({}));
jest.mock("@/lib/api/config", () => ({
  API_BASE_URL: "https://api.example.com",
}));
jest.mock("@/lib/api", () => ({
  getAccessToken: jest.fn(),
  restoreSession: jest.fn(),
}));

let config: StompConfig & { active: boolean; subscribe: jest.Mock };

jest.mock("@stomp/stompjs", () => ({
  Client: class {
    active = false;
    subscribe = jest.fn();
    connectHeaders = {};

    constructor(options: StompConfig) {
      config = Object.assign(this, options);
    }
  },
}));

const token = jest.mocked(getAccessToken);
const restore = jest.mocked(restoreSession);

function setup() {
  const onEvent = jest.fn();
  const onReconnect = jest.fn();
  const client = createChatSocket(onEvent, onReconnect);

  return { client, onEvent, onReconnect };
}

function subscriber() {
  return config.subscribe.mock.calls[0][1] as (message: {
    body: string;
  }) => void;
}

beforeEach(() => {
  jest.clearAllMocks();
  restore.mockResolvedValue(true);
});

describe("createChatSocket", () => {
  it("API 주소를 웹소켓 주소로 바꿔 /ws에 붙는다", () => {
    setup();

    expect(config.brokerURL).toBe("wss://api.example.com/ws");
  });

  it("연결 직전마다 현재 액세스 토큰을 헤더에 넣는다", () => {
    const { client } = setup();
    token.mockReturnValueOnce("first").mockReturnValueOnce("second");

    config.beforeConnect?.(client);
    expect(client.connectHeaders).toEqual({ Authorization: "Bearer first" });

    config.beforeConnect?.(client);
    expect(client.connectHeaders).toEqual({ Authorization: "Bearer second" });
  });

  it("연결되면 내 큐를 구독하고 받은 이벤트를 파싱해 넘긴다", () => {
    const { onEvent } = setup();

    config.onConnect?.({} as never);

    expect(config.subscribe).toHaveBeenCalledWith(
      "/user/queue/chat",
      expect.any(Function),
    );

    subscriber()({ body: JSON.stringify({ type: "ROOM_DELETED", roomId: 3 }) });

    expect(onEvent).toHaveBeenCalledWith({ type: "ROOM_DELETED", roomId: 3 });
  });

  it("첫 연결에는 재연결 알림을 보내지 않는다", () => {
    const { onReconnect } = setup();

    config.onConnect?.({} as never);

    expect(onReconnect).not.toHaveBeenCalled();
  });

  it("활성 상태에서 끊겼다 다시 붙으면 한 번 알린다", () => {
    const { onReconnect } = setup();
    config.active = true;

    config.onConnect?.({} as never);
    config.onWebSocketClose?.({} as never);
    config.onConnect?.({} as never);
    config.onConnect?.({} as never);

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it("deactivate로 끊은 뒤 다시 붙는 건 재연결로 치지 않는다", () => {
    const { onReconnect } = setup();
    config.active = false;

    config.onConnect?.({} as never);
    config.onWebSocketClose?.({} as never);
    config.onConnect?.({} as never);

    expect(onReconnect).not.toHaveBeenCalled();
  });

  it("STOMP 오류가 오면 세션 재발급을 시도한다", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    setup();

    config.onStompError?.({
      headers: { message: "Unauthorized" },
      body: "",
    } as never);

    expect(restore).toHaveBeenCalledTimes(1);
  });
});
