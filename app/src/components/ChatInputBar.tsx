import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { getTokens, useTheme, XStack, YStack } from "tamagui";

import {
  DISABLED_OPACITY,
  FLOATING_BUTTON_SIZE,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";

const ICON_SIZE = 20;

const BAR_PADDING = getTokens().space.$3.val;
const BAR_H_PADDING = getTokens().space.$4.val;

const PLACEHOLDER = "메시지 입력";
const MAX_LENGTH = 1000;

const FONT_SIZE = 16;
const LINE_HEIGHT = 22;
const MAX_LINES = 7;
const VERTICAL_PADDING = 7;

export function ChatInputBar() {
  const theme = useTheme();
  const [text, setText] = useState("");
  const sendable = text.trim().length > 0;

  return (
    <XStack items="flex-end" gap={BAR_PADDING} style={styles.bar}>
      <YStack theme="gray">
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
          pressStyle={{
            x: RETRO_SHADOW_OFFSET,
            y: RETRO_SHADOW_OFFSET,
            bg: "$yellow10",
          }}
        >
          <PlusIcon size={ICON_SIZE} weight="bold" color="black" />
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
        >
          <PaperPlaneRightIcon size={ICON_SIZE} weight="fill" color="white" />
        </XStack>
      </YStack>
    </XStack>
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
