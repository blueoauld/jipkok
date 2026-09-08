import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput } from "react-native";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { ReplyPreviewThumbnail } from "@/components/chat/ReplyPreviewThumbnail";
import { RetroPressable } from "@/components/ui/RetroPressable";
import { RetroShadow } from "@/components/ui/RetroShadow";
import type { ChatMessageResponse } from "@/lib/api";
import { replySummary } from "@/lib/chat";
import { useChatDraftStore } from "@/lib/chat/draft-store";
import {
  FLOATING_BUTTON_SIZE,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";
import { useAccent, useThemeBackground } from "@/lib/theme/accent";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/validation";

const ICON_SIZE = 22;
const CANCEL_ICON_SIZE = 18;

// iOS 26 키보드는 프레임 위쪽에 투명한 여백이 있어 그 틈으로 메시지가 비친다.
// 입력창 배경을 그만큼 아래로 더 깔아 가린다.
const KEYBOARD_TOP_GAP = 16;

const FONT_SIZE = 16;
const LINE_HEIGHT = 22;
const MAX_LINES = 7;
// 한 줄일 때 입력 칸이 양옆 버튼과 같은 높이여야 나란히 선다. 버튼 크기가 바뀌면 따라간다.
const VERTICAL_PADDING =
  (FLOATING_BUTTON_SIZE - RETRO_BORDER_WIDTH * 2 - LINE_HEIGHT) / 2;

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
  const background = useThemeBackground();
  const accent = useAccent();
  const space = getTokens().space;
  const barPadding = space.$3.val;
  const barHPadding = space.$4.val;
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
    <YStack bg={background}>
      {reply && (
        <YStack
          theme="gray"
          ml={barHPadding}
          mr={barHPadding - RETRO_SHADOW_OFFSET}
          mt={barPadding}
        >
          <RetroShadow color="$gray8" />
          <XStack
            borderWidth={RETRO_BORDER_WIDTH}
            borderColor="$gray12"
            bg="$color1"
            items="center"
            pl="$3"
            pr="$2"
            py="$2"
            gap="$2.5"
          >
            <ReplyPreviewThumbnail reply={reply} />

            <YStack flex={1} gap={2}>
              <Text fontSize="$2" fontWeight="600" color="$color12">
                {t("component.replyTo", { name: replyName })}
              </Text>

              <Text fontSize="$2" color="$color11" numberOfLines={1}>
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
              <XIcon size={CANCEL_ICON_SIZE} color={theme.color12.val} />
            </XStack>
          </XStack>
        </YStack>
      )}

      <XStack
        items="flex-end"
        gap={barPadding}
        pl={barHPadding}
        pt={barPadding}
        pr={barHPadding - RETRO_SHADOW_OFFSET}
        pb={barHPadding - RETRO_SHADOW_OFFSET}
      >
        <RetroPressable
          shadow="$gray8"
          theme="gray"
          width={FLOATING_BUTTON_SIZE}
          height={FLOATING_BUTTON_SIZE}
          bg={uploading ? "$gray8" : "$yellow9"}
          pressBg="$yellow10"
          items="center"
          justify="center"
          accessibilityRole="button"
          accessibilityLabel={t("a11y.attach")}
          onPress={uploading ? undefined : onAttach}
        >
          {uploading ? (
            <Spinner size="small" color="white" />
          ) : (
            <PlusIcon size={ICON_SIZE} weight="bold" color="black" />
          )}
        </RetroPressable>

        <XStack flex={1} theme="gray">
          <RetroShadow color="$gray8" />
          <XStack
            flex={1}
            borderWidth={RETRO_BORDER_WIDTH}
            borderColor="$gray12"
            bg="$color1"
          >
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder={t("component.messagePlaceholder")}
              placeholderTextColor={theme.color11.val}
              maxLength={CHAT_MESSAGE_MAX_LENGTH}
              multiline
              style={[styles.input, { color: theme.color12.val }]}
            />
          </XStack>
        </XStack>

        <RetroPressable
          shadow="$gray8"
          theme={accent}
          width={FLOATING_BUTTON_SIZE}
          height={FLOATING_BUTTON_SIZE}
          bg={sendable ? "$color10" : "$gray8"}
          pressBg="$color11"
          items="center"
          justify="center"
          accessibilityRole="button"
          accessibilityLabel={t("a11y.send")}
          onPress={sendable ? send : undefined}
        >
          <PaperPlaneRightIcon size={ICON_SIZE} weight="fill" color="white" />
        </RetroPressable>
      </XStack>

      <YStack
        position="absolute"
        t="100%"
        l={0}
        r={0}
        height={KEYBOARD_TOP_GAP}
        bg={background}
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
    paddingHorizontal: 10,
    maxHeight: LINE_HEIGHT * MAX_LINES + VERTICAL_PADDING * 2,
  },
});
