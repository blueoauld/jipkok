import { useMutation } from "@tanstack/react-query";

import { useChatFeedCache } from "@/hooks/useChatFeedCache";
import { useSendChatMedia } from "@/hooks/useSendChatMedia";
import {
  api,
  type ChatMessageResponse,
  type ReplyMessageResponse,
} from "@/lib/api";
import { createTemp } from "@/lib/chat/outgoing";
import { useUploadStore } from "@/lib/chat/upload-store";

type TextSend = {
  content: string;
  replyToMessageId: number | null;
  temp: ChatMessageResponse;
};

// createTemp가 항상 채우지만 응답 타입에서는 선택 필드다.
const idOf = (temp: ChatMessageResponse) => temp.clientMessageId ?? "";

export function useSendMessage(
  roomId: number,
  senderId: number,
  onError: (error: unknown) => void,
) {
  const feed = useChatFeedCache(roomId);
  const { prepend, replace, discard, refreshRooms } = feed;
  const media = useSendChatMedia(roomId, senderId, feed, onError);
  const uploads = useUploadStore.getState;

  // 실패한 말풍선은 사진처럼 남겨 두고 재전송이나 삭제를 고른다. 재전송은 같은 임시
  // 메시지와 clientMessageId를 다시 쓰므로 서버가 중복을 걸러 준다.
  const sendText = useMutation({
    mutationFn: ({ content, replyToMessageId, temp }: TextSend) =>
      api.chats.send(roomId, {
        type: "TEXT",
        content,
        replyToMessageId,
        clientMessageId: temp.clientMessageId,
      }),
    onSuccess: (message, { temp }) => {
      uploads().remove(idOf(temp));
      replace(temp, message);
    },
    onError: (error, variables) => {
      const { temp } = variables;
      const id = idOf(temp);

      uploads().set(id, {
        phase: "failed",
        progress: 0,
        cancel: () => {
          uploads().remove(id);
          discard([temp.messageId]);
          refreshRooms();
        },
        retry: () => start(variables),
      });
      onError(error);
    },
    onSettled: refreshRooms,
  });

  const start = (variables: TextSend) => {
    const { temp } = variables;
    const id = idOf(temp);

    uploads().set(id, {
      phase: "sending",
      progress: 0,
      cancel: () => {
        uploads().remove(id);
        discard([temp.messageId]);
      },
      retry: () => undefined,
    });
    sendText.mutate(variables);
  };

  return {
    sendText: (
      content: string,
      replyTo: ReplyMessageResponse | null = null,
    ) => {
      const temp = createTemp(senderId, {
        type: "TEXT",
        content,
        imageUrl: null,
        replyMessage: replyTo,
      });

      prepend(temp);
      start({ content, replyToMessageId: replyTo?.messageId ?? null, temp });
    },

    ...media,
  };
}
