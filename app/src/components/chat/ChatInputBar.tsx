import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TextInput } from "react-native";
import { Spinner, useTheme, XStack, YStack } from "tamagui";

import { ReplyPreviewThumbnail } from "@/components/chat/ReplyPreviewThumbnail";
import { CircleButton } from "@/components/ui/CircleButton";
import { PillInput } from "@/components/ui/PillInput";
import { ReplyPreviewBox } from "@/components/ui/ReplyPreviewBox";
import type { ChatMessageResponse } from "@/lib/api";
import { replySummary, toReply } from "@/lib/chat";
import { useChatDraftStore } from "@/lib/chat/draft-store";
import {
  INPUT_BAR_GAP,
  INPUT_BAR_PADDING_X,
  INPUT_BAR_PADDING_Y,
} from "@/lib/design";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/validation";

const ICON_SIZE = 22;

// iOS 26 키보드는 프레임 위쪽에 투명한 여백이 있어 그 틈으로 메시지가 비친다.
// 입력창 배경을 그만큼 아래로 더 깔아 가린다.
const KEYBOARD_TOP_GAP = 16;

export function ChatInputBar({
  roomId,
  uploading,
  reply,
  replyName,
  onSend,
  onAttach,
  onCancelReply,
}: {
  roomId: number;
  uploading: boolean;
  reply: ChatMessageResponse | null;
  replyName: string;
  onSend: (content: string) => void;
  onAttach: () => void;
  onCancelReply: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  // 쓰던 글은 방별로 남겨 두어 나갔다 돌아와도 이어서 쓴다.
  const text = useChatDraftStore((state) => state.drafts[roomId] ?? "");
  const setDraft = useChatDraftStore((state) => state.set);
  const setText = (value: string) => setDraft(roomId, value);
  const trimmed = text.trim();
  // 응답을 기다리지 않고 연달아 보낸다. 순서는 서버 id가 정하고 실패는 말풍선에 남는다.
  const sendable = trimmed.length > 0;

  useEffect(() => {
    if (reply) {
      inputRef.current?.focus();
    }
  }, [reply]);

  const send = () => {
    onSend(trimmed);
    inputRef.current?.clear();
    setText("");
  };

  return (
    <YStack bg="$background">
      {reply && (
        <ReplyPreviewBox
          title={t("component.replyTo", { name: replyName })}
          summary={replySummary(reply)}
          // ChatMessageResponse에는 previewUrl이 없어 그대로 넘기면 늘 비어 보인다.
          thumbnail={<ReplyPreviewThumbnail reply={toReply(reply)} />}
          onCancel={onCancelReply}
        />
      )}

      <XStack
        items="flex-end"
        gap={INPUT_BAR_GAP}
        px={INPUT_BAR_PADDING_X}
        py={INPUT_BAR_PADDING_Y}
      >
        <CircleButton
          label={t("a11y.attach")}
          tone="grey"
          onPress={uploading ? undefined : onAttach}
        >
          {uploading ? (
            <Spinner size="small" color="$grey500" />
          ) : (
            <PlusIcon
              size={ICON_SIZE}
              weight="bold"
              color={theme.grey700.val}
            />
          )}
        </CircleButton>

        <PillInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={t("component.messagePlaceholder")}
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          multiline
        />

        <CircleButton
          label={t("a11y.send")}
          tone={sendable ? "blue" : "grey"}
          onPress={sendable ? send : undefined}
        >
          <PaperPlaneRightIcon
            size={ICON_SIZE}
            weight="fill"
            color={sendable ? theme.onFill.val : theme.grey400.val}
          />
        </CircleButton>
      </XStack>

      <YStack
        position="absolute"
        t="100%"
        l={0}
        r={0}
        height={KEYBOARD_TOP_GAP}
        bg="$background"
      />
    </YStack>
  );
}
