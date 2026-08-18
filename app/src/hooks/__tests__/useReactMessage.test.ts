import { type InfiniteData, QueryClient } from "@tanstack/react-query";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { setMessageReactions } from "@/hooks/useReactMessage";
import type { ChatMessagePage, ChatMessageResponse } from "@/lib/api";

function message(messageId: number): ChatMessageResponse {
  return {
    messageId,
    roomId: 1,
    senderId: 1,
    type: "TEXT",
    content: "hi",
    createdAt: "2026-08-18T00:00:00Z",
    replyMessage: null,
    reactions: [],
  };
}

describe("setMessageReactions", () => {
  it("모든 페이지에서 해당 메시지의 반응만 바꾼다", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { gcTime: 0 } },
    });
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
