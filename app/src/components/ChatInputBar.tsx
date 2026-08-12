import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useRef, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import type { ChatMessageResponse } from "@/lib/api";
import {
  DISABLED_OPACITY,
  FLOATING_BUTTON_SIZE,
  PRESS_OPACITY,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";

const ICON_SIZE = 20;
const CANCEL_ICON_SIZE = 18;

const PHOTO_SUMMARY = "사진";

const BAR_PADDING = getTokens().space.$3.val;
const BAR_H_PADDING = getTokens().space.$4.val;

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
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const sendable = trimmed.length > 0 && !sending;

  // 값만 비우면 iOS가 높이를 다시 재지 않아 여러 줄 높이가 남는다.
  const send = () => {
    onSend(trimmed);
    inputRef.current?.clear();
    setText("");
  };

  return (
    <YStack>
      {reply && (
        <XStack
          items="center"
          gap="$2.5"
          px={BAR_H_PADDING}
          pt={BAR_PADDING}
          theme="gray"
        >
          <YStack flex={1} gap={2}>
            <Text fontSize="$2" fontWeight="600" color="$color12">
              {replyName}에게 답장
            </Text>

            <Text fontSize="$3" color="$color11" numberOfLines={1}>
              {reply.content || PHOTO_SUMMARY}
            </Text>
          </YStack>

          <XStack
            py="$2"
            pressStyle={{ opacity: PRESS_OPACITY }}
            onPress={onCancelReply}
          >
            <XIcon size={CANCEL_ICON_SIZE} color={theme.color11.val} />
          </XStack>
        </XStack>
      )}

      <XStack items="flex-end" gap={BAR_PADDING} style={styles.bar}>
        <YStack theme="gray" opacity={uploading ? DISABLED_OPACITY : 1}>
          <YStack
            position="absolute"
            t={RETRO_SHADOW_OFFSET}
            b={-RETRO_SHADOW_OFFSET}
            l={RETRO_SHADOW_OFFSET}
            r={-RETRO_SHADOW_OFFSET}
            bg="$gray12"
          />
          <XStack
            width={FLOATING_BUTTON_SIZE}
            height={FLOATING_BUTTON_SIZE}
            borderWidth={2}
            borderColor="$gray12"
            bg="$yellow9"
            items="center"
            justify="center"
            pressStyle={
              uploading
                ? undefined
                : {
                    x: RETRO_SHADOW_OFFSET,
                    y: RETRO_SHADOW_OFFSET,
                    bg: "$yellow10",
                  }
            }
            onPress={uploading ? undefined : onPickPhotos}
          >
            {uploading ? (
              <Spinner size="small" color="black" />
            ) : (
              <PlusIcon size={ICON_SIZE} weight="bold" color="black" />
            )}
          </XStack>
        </YStack>

        <XStack flex={1} theme="gray">
          <YStack
            position="absolute"
            t={RETRO_SHADOW_OFFSET}
            b={-RETRO_SHADOW_OFFSET}
            l={RETRO_SHADOW_OFFSET}
            r={-RETRO_SHADOW_OFFSET}
            bg="$gray12"
          />
          <XStack flex={1} borderWidth={2} borderColor="$gray12" bg="$color1">
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

        <YStack theme="blue" opacity={sendable ? 1 : DISABLED_OPACITY}>
          <YStack
            position="absolute"
            t={RETRO_SHADOW_OFFSET}
            b={-RETRO_SHADOW_OFFSET}
            l={RETRO_SHADOW_OFFSET}
            r={-RETRO_SHADOW_OFFSET}
            bg="$gray12"
          />
          <XStack
            width={FLOATING_BUTTON_SIZE}
            height={FLOATING_BUTTON_SIZE}
            borderWidth={2}
            borderColor="$gray12"
            bg="$color10"
            items="center"
            justify="center"
            pressStyle={
              sendable
                ? {
                    x: RETRO_SHADOW_OFFSET,
                    y: RETRO_SHADOW_OFFSET,
                    bg: "$color11",
                  }
                : undefined
            }
            onPress={sendable ? send : undefined}
          >
            <PaperPlaneRightIcon size={ICON_SIZE} weight="fill" color="white" />
          </XStack>
        </YStack>
      </XStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingLeft: BAR_H_PADDING,
    paddingTop: BAR_PADDING,
    paddingRight: BAR_H_PADDING - RETRO_SHADOW_OFFSET,
    paddingBottom: BAR_H_PADDING - RETRO_SHADOW_OFFSET,
  },
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
