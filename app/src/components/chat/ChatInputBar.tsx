import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

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

const PLACEHOLDER = "메시지 입력";
const MAX_LENGTH = 1000;

const FONT_SIZE = 16;
const LINE_HEIGHT = 22;
const MAX_LINES = 7;
const VERTICAL_PADDING = 7;

export function ChatInputBar({
  sending,
  uploading,
  reply,
  replyName,
  onSend,
  onPickPhotos,
  onCancelReply,
}: {
  sending: boolean;
  uploading: boolean;
  reply: ChatMessageResponse | null;
  replyName: string;
  onSend: (content: string) => void;
  onPickPhotos: () => void;
  onCancelReply: () => void;
}) {
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
            <YStack flex={1} gap={2}>
              <Text fontSize="$2" fontWeight="600" color="$color12">
                {replyName}에게 답장
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
          onPress={uploading ? undefined : onPickPhotos}
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
              placeholder={PLACEHOLDER}
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
