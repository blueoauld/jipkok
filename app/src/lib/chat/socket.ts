import "@bacons/text-decoder/install";

import { Client } from "@stomp/stompjs";

import {
  type ChatMessageResponse,
  type ChatReactionsResponse,
  getAccessToken,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/api/config";

const ENDPOINT = "/ws";
const DESTINATION = "/user/queue/chat";

const RECONNECT_DELAY = 5_000;
const HEARTBEAT_INTERVAL = 10_000;

export type ChatEvent =
  | { type: "MESSAGE"; roomId: number; message: ChatMessageResponse }
  | { type: "REACTION"; roomId: number; reaction: ChatReactionsResponse }
  | { type: "ROOM_DELETED"; roomId: number };

function toSocketUrl() {
  return `${API_BASE_URL.replace(/^http/, "ws")}${ENDPOINT}`;
}

// 끊긴 동안 온 이벤트는 다시 받을 수 없어서, 활성 상태에서 끊겼다 붙으면 알려 준다.
// deactivate()로 끊은 경우는 앱 복귀 때 따로 새로고침하므로 제외한다.
export function createChatSocket(
  onEvent: (event: ChatEvent) => void,
  onReconnect: () => void,
) {
  let dropped = false;

  const client = new Client({
    brokerURL: toSocketUrl(),
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
    reconnectDelay: RECONNECT_DELAY,
    heartbeatIncoming: HEARTBEAT_INTERVAL,
    heartbeatOutgoing: HEARTBEAT_INTERVAL,
    beforeConnect: () => {
      client.connectHeaders = { Authorization: `Bearer ${getAccessToken()}` };
    },
    onConnect: () => {
      client.subscribe(DESTINATION, (message) =>
        onEvent(JSON.parse(message.body)),
      );

      if (dropped) {
        dropped = false;
        onReconnect();
      }
    },
    onWebSocketClose: () => {
      if (client.active) {
        dropped = true;
      }
    },
    onStompError: (frame) =>
      console.error(`[chat] ${frame.headers.message} ${frame.body}`),
  });

  return client;
}
