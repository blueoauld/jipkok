import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";

import { useChatFeedCache } from "@/hooks/useChatFeedCache";
import { useSendChatMedia } from "@/hooks/useSendChatMedia";
import {
  api,
  type ChatMessageResponse,
  type ReplyMessageResponse,
} from "@/lib/api";
import { createTemp } from "@/lib/chat/outgoing";

export function useSendMessage(
  roomId: number,
  senderId: number,
  onError: (error: unknown) => void,
  onTextFailed: (content: string, replyTo: ReplyMessageResponse | null) => void,
) {
  const feed = useChatFeedCache(roomId);
  const { prepend, replace, discard, refreshRooms } = feed;
  const media = useSendChatMedia(roomId, senderId, feed, onError);
  const failedText = useRef<{
    clientMessageId: string;
    content: string;
  } | null>(null);

  const sendText = useMutation({
    mutationFn: ({
      content,
      replyToMessageId,
      temp,
    }: {
      content: string;
      replyToMessageId: number | null;
      temp: ChatMessageResponse;
    }) =>
      api.chats.send(roomId, {
        type: "TEXT",
        content,
        replyToMessageId,
        clientMessageId: temp.clientMessageId,
      }),
    onMutate: ({ temp }) => prepend(temp),
    onSuccess: (message, { temp }) => replace(temp, message),
    onError: (error, { content, temp }) => {
      if (temp.clientMessageId) {
        failedText.current = { clientMessageId: temp.clientMessageId, content };
      }
      discard([temp.messageId]);
      onTextFailed(content, temp.replyMessage);
      onError(error);
    },
    onSettled: refreshRooms,
  });

  return {
    sendText: (
      content: string,
      replyTo: ReplyMessageResponse | null = null,
    ) => {
      const failed = failedText.current;
      failedText.current = null;

      sendText.mutate({
        content,
        replyToMessageId: replyTo?.messageId ?? null,
        temp: createTemp(
          senderId,
          {
            type: "TEXT",
            content,
            imageUrl: null,
            replyMessage: replyTo,
          },
          failed?.content === content ? failed.clientMessageId : undefined,
        ),
      });
    },

    ...media,
    sending: sendText.isPending,
  };
}
