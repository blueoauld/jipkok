import "@bacons/text-decoder/install";

import { Client } from "@stomp/stompjs";

import { type ChatMessageResponse, getAccessToken } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api/config";

const ENDPOINT = "/ws";
const DESTINATION = "/user/queue/chat";

const RECONNECT_DELAY = 5_000;
const HEARTBEAT_INTERVAL = 10_000;

export type ChatEvent =
  | { type: "MESSAGE"; roomId: number; message: ChatMessageResponse }
  | { type: "ROOM_DELETED"; roomId: number };

function toSocketUrl() {
  return `${API_BASE_URL.replace(/^http/, "ws")}${ENDPOINT}`;
}

export function createChatSocket(onEvent: (event: ChatEvent) => void) {
  const client = new Client({
    brokerURL: toSocketUrl(),
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
    reconnectDelay: RECONNECT_DELAY,
    heartbeatIncoming: HEARTBEAT_INTERVAL,
    heartbeatOutgoing: HEARTBEAT_INTERVAL,
    // 토큰이 갱신될 수 있어 연결 직전에 헤더를 다시 만든다.
    beforeConnect: () => {
      client.connectHeaders = { Authorization: `Bearer ${getAccessToken()}` };
    },
    onConnect: () => {
      client.subscribe(DESTINATION, (message) =>
        onEvent(JSON.parse(message.body)),
      );
    },
    onStompError: (frame) =>
      console.error(`[chat] ${frame.headers.message} ${frame.body}`),
  });

  return client;
}
