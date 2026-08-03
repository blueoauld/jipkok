import "@bacons/text-decoder/install";

import { Client } from "@stomp/stompjs";

import { getAccessToken } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api/config";

const ENDPOINT = "/ws";
const DESTINATION = "/user/queue/chat";

const RECONNECT_DELAY = 5_000;
const HEARTBEAT_INTERVAL = 10_000;

function toSocketUrl() {
  return `${API_BASE_URL.replace(/^http/, "ws")}${ENDPOINT}`;
}

export function createChatSocket({
  onEvent,
  onConnect,
}: {
  onEvent: (event: unknown) => void;
  onConnect: () => void;
}) {
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
      onConnect();
    },
    onStompError: (frame) =>
      console.error(`[chat] ${frame.headers.message} ${frame.body}`),
  });

  return client;
}
