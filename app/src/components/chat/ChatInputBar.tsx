import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { type ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput } from "react-native";
import { Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { ReplyPreviewThumbnail } from "@/components/chat/ReplyPreviewThumbnail";
import type { ChatMessageResponse } from "@/lib/api";
import { replySummary, toReply } from "@/lib/chat";
import { useChatDraftStore } from "@/lib/chat/draft-store";
import {
  FLOATING_BUTTON_SIZE,
  INPUT_RADIUS,
  PILL_RADIUS,
  PRESS_OPACITY,
} from "@/lib/design";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/validation";

const ICON_SIZE = 22;
const CANCEL_ICON_SIZE = 18;

// iOS 26 키보드는 프레임 위쪽에 투명한 여백이 있어 그 틈으로 메시지가 비친다.
// 입력창 배경을 그만큼 아래로 더 깔아 가린다.
const KEYBOARD_TOP_GAP = 16;

const BAR_PADDING_X = 12;
const BAR_PADDING_Y = 8;
const BAR_GAP = 8;

const BUTTON_SIZE = FLOATING_BUTTON_SIZE;
const FONT_SIZE = 16;
const LINE_HEIGHT = 22;
const MAX_LINES = 7;
const INPUT_PADDING_X = 16;
// 한 줄일 때 입력칸이 양옆 원형 버튼과 같은 높이여야 나란히 선다. 버튼 크기가 바뀌면 따라간다.
const VERTICAL_PADDING = (BUTTON_SIZE - LINE_HEIGHT) / 2;

function CircleButton({
  label,
  bg,
  pressBg,
  onPress,
  children,
}: {
  label: string;
  bg: "$grey100" | "$blue500";
  pressBg?: "$grey200" | "$blue600";
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <XStack
      width={BUTTON_SIZE}
      height={BUTTON_SIZE}
      rounded={PILL_RADIUS}
      bg={bg}
      items="center"
      justify="center"
      pressStyle={onPress && pressBg ? { bg: pressBg } : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      {children}
    </XStack>
  );
}

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
        <XStack
          mx={BAR_PADDING_X}
          mt={BAR_PADDING_Y}
          pl="$3.5"
          pr="$1.5"
          py="$2.5"
          gap="$2.5"
          rounded={INPUT_RADIUS}
          bg="$grey100"
          items="center"
        >
          {/* ChatMessageResponse에는 previewUrl이 없어 그대로 넘기면 늘 비어 보인다. */}
          <ReplyPreviewThumbnail reply={toReply(reply)} />

          <YStack flex={1} gap={2}>
            <Text fontSize="$1" fontWeight="600" color="$grey800">
              {t("component.replyTo", { name: replyName })}
            </Text>

            <Text fontSize="$1" color="$grey600" numberOfLines={1}>
              {replySummary(reply)}
            </Text>
          </YStack>

          <XStack
            p="$2"
            pressStyle={{ opacity: PRESS_OPACITY }}
            accessibilityRole="button"
            accessibilityLabel={t("a11y.cancelReply")}
            onPress={onCancelReply}
          >
            <XIcon size={CANCEL_ICON_SIZE} color={theme.grey500.val} />
          </XStack>
        </XStack>
      )}

      <XStack
        items="flex-end"
        gap={BAR_GAP}
        px={BAR_PADDING_X}
        py={BAR_PADDING_Y}
      >
        <CircleButton
          label={t("a11y.attach")}
          bg="$grey100"
          pressBg="$grey200"
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

        <XStack flex={1} rounded={BUTTON_SIZE / 2} bg="$grey100">
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder={t("component.messagePlaceholder")}
            placeholderTextColor={theme.grey500.val}
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            multiline
            style={[styles.input, { color: theme.grey900.val }]}
          />
        </XStack>

        <CircleButton
          label={t("a11y.send")}
          bg={sendable ? "$blue500" : "$grey100"}
          pressBg={sendable ? "$blue600" : undefined}
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

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    paddingTop: VERTICAL_PADDING,
    paddingBottom: VERTICAL_PADDING,
    paddingHorizontal: INPUT_PADDING_X,
    maxHeight: LINE_HEIGHT * MAX_LINES + VERTICAL_PADDING * 2,
  },
});
