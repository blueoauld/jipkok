import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput } from "react-native";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { ReplyPreviewThumbnail } from "@/components/chat/ReplyPreviewThumbnail";
import { RetroPressable } from "@/components/ui/RetroPressable";
import { RetroShadow } from "@/components/ui/RetroShadow";
import type { ChatMessageResponse } from "@/lib/api";
import { replySummary } from "@/lib/chat";
import {
  FLOATING_BUTTON_SIZE,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";
import { useAccent } from "@/lib/theme/accent";

const ICON_SIZE = 20;
const CANCEL_ICON_SIZE = 18;

const MAX_LENGTH = 1000;

const FONT_SIZE = 16;
const LINE_HEIGHT = 22;
const MAX_LINES = 7;
// 한 줄일 때 입력 칸이 양옆 버튼과 같은 높이여야 나란히 선다. 버튼 크기가 바뀌면 따라간다.
const VERTICAL_PADDING =
  (FLOATING_BUTTON_SIZE - RETRO_BORDER_WIDTH * 2 - LINE_HEIGHT) / 2;

export type ChatInputBarHandle = {
  restore: (text: string) => void;
};

export function ChatInputBar({
  ref,
  sending,
  uploading,
  reply,
  replyName,
  onSend,
  onAttach,
  onCancelReply,
}: {
  ref?: Ref<ChatInputBarHandle>;
  sending: boolean;
  uploading: boolean;
  reply: ChatMessageResponse | null;
  replyName: string;
  onSend: (content: string) => void;
  onAttach: () => void;
  onCancelReply: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const accent = useAccent();
  const space = getTokens().space;
  const barPadding = space.$3.val;
  const barHPadding = space.$4.val;
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const sendable = trimmed.length > 0 && !sending;

  useEffect(() => {
    if (reply) {
      inputRef.current?.focus();
    }
  }, [reply]);

  useImperativeHandle(ref, () => ({
    restore: (value) => {
      setText(value);
      inputRef.current?.focus();
    },
  }));

  const send = () => {
    onSend(trimmed);
    inputRef.current?.clear();
    setText("");
  };

  return (
    <YStack>
      {reply && (
        <YStack
          theme="gray"
          ml={barHPadding}
          mr={barHPadding - RETRO_SHADOW_OFFSET}
          mt={barPadding}
        >
          <RetroShadow color="$gray12" />
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

              <Text fontSize="$3" color="$color11" numberOfLines={1}>
                {replySummary(reply)}
              </Text>
            </YStack>

            <XStack
              p="$2"
              pressStyle={{ opacity: PRESS_OPACITY }}
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
          theme="gray"
          width={FLOATING_BUTTON_SIZE}
          height={FLOATING_BUTTON_SIZE}
          bg={uploading ? "$gray8" : "$yellow9"}
          pressBg="$yellow10"
          items="center"
          justify="center"
          onPress={uploading ? undefined : onAttach}
        >
          {uploading ? (
            <Spinner size="small" color="white" />
          ) : (
            <PlusIcon size={ICON_SIZE} weight="bold" color="black" />
          )}
        </RetroPressable>

        <XStack flex={1} theme="gray">
          <RetroShadow color="$gray12" />
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
              maxLength={MAX_LENGTH}
              multiline
              style={[styles.input, { color: theme.color12.val }]}
            />
          </XStack>
        </XStack>

        <RetroPressable
          theme={accent}
          width={FLOATING_BUTTON_SIZE}
          height={FLOATING_BUTTON_SIZE}
          bg={sendable ? "$color10" : "$gray8"}
          pressBg="$color11"
          items="center"
          justify="center"
          onPress={sendable ? send : undefined}
        >
          <PaperPlaneRightIcon size={ICON_SIZE} weight="fill" color="white" />
        </RetroPressable>
      </XStack>
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
