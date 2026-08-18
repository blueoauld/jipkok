import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";

import type {
  MessageAction,
  MessageActionTarget,
} from "@/components/chat/MessageActionOverlay";
import { useReactMessage } from "@/hooks/useReactMessage";
import {
  api,
  type ChatMessageResponse,
  type ChatReactionType,
} from "@/lib/api";
import { isPending } from "@/lib/chat";
import { copyMessage, saveMedia } from "@/lib/chat/media";
import type { MessageFrame } from "@/lib/chat/overlay-layout";
import { showToast } from "@/lib/toast/store";

const VIDEO_SAVE_FAILED_MESSAGE = "동영상을 저장하지 못했습니다.";

export function useMessageActions(
  roomId: number,
  myMemberId: number,
  onError: (error: unknown) => void,
) {
  const [target, setTarget] = useState<MessageActionTarget | null>(null);
  const { mutate: react } = useReactMessage(roomId, myMemberId, onError);

  const open = useCallback(
    (message: ChatMessageResponse, frame: MessageFrame) => {
      if (!isPending(message)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTarget({ message, mine: message.senderId === myMemberId, frame });
      }
    },
    [myMemberId],
  );

  const close = () => setTarget(null);

  const message = target?.message;
  const myReaction =
    message?.reactions.find((item) => item.memberId === myMemberId)?.type ??
    null;

  const selectReaction = (type: ChatReactionType) => {
    if (message) {
      close();
      react({
        messageId: message.messageId,
        type: type === myReaction ? null : type,
      });
    }
  };

  const saveVideo = async (messageId: number) => {
    try {
      const { url } = await api.chats.videoUrl(roomId, messageId);
      await saveMedia(url, "video");
    } catch {
      showToast("error", VIDEO_SAVE_FAILED_MESSAGE);
    }
  };

  const action = (label: string, run: () => void): MessageAction => ({
    label,
    onPress: () => {
      close();
      run();
    },
  });

  const imageUrl = message?.imageUrl;
  const actions: MessageAction[] = !message
    ? []
    : message.type === "VIDEO"
      ? [action("저장", () => saveVideo(message.messageId))]
      : imageUrl
        ? [action("저장", () => saveMedia(imageUrl, "photo"))]
        : [action("복사", () => copyMessage(message.content ?? ""))];

  return { target, message, open, close, myReaction, selectReaction, actions };
}
