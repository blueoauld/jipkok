import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import {
  Composer,
  type ComposerProps,
  type IMessage,
  InputToolbar,
  type InputToolbarProps,
  Send,
  type SendProps,
} from "react-native-gifted-chat";
import { getTokens, Spinner, useTheme, XStack, YStack } from "tamagui";

import {
  DISABLED_OPACITY,
  FLOATING_BUTTON_SIZE,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";

const ICON_SIZE = 20;

const TOOLBAR_PADDING = getTokens().space.$3.val;

// 22는 gifted Composer의 기본 줄높이다.
const COMPOSER_LINE_HEIGHT = 22;
const COMPOSER_MAX_LINES = 7;
const COMPOSER_VERTICAL_PADDING = 7;

function RetroBox({
  theme,
  bg,
  children,
}: {
  theme: "gray" | "blue";
  bg: "$color1" | "$color10";
  children: ReactNode;
}) {
  return (
    <YStack theme={theme}>
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
        bg={bg}
        items="center"
        justify="center"
      >
        {children}
      </XStack>
    </YStack>
  );
}

export function ChatInputToolbar(props: InputToolbarProps<IMessage>) {
  return (
    <InputToolbar
      {...props}
      containerStyle={styles.toolbar}
      primaryStyle={styles.primary}
    />
  );
}

export function ChatComposer(props: ComposerProps) {
  return (
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
        <Composer
          {...props}
          textInputProps={{
            ...props.textInputProps,
            style: [styles.composerText, props.textInputProps?.style],
          }}
        />
      </XStack>
    </XStack>
  );
}

export function ChatSend(props: SendProps<IMessage>) {
  const disabled = !props.text?.trim();

  return (
    <Send {...props} isSendButtonAlwaysVisible containerStyle={styles.send}>
      <YStack opacity={disabled ? DISABLED_OPACITY : 1}>
        <RetroBox theme="blue" bg="$color10">
          <PaperPlaneRightIcon size={ICON_SIZE} weight="fill" color="white" />
        </RetroBox>
      </YStack>
    </Send>
  );
}

export function ChatActions({
  uploading,
  onPress,
}: {
  uploading: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      opacity={uploading ? DISABLED_OPACITY : 1}
      pressStyle={uploading ? undefined : { opacity: DISABLED_OPACITY }}
      onPress={uploading ? undefined : onPress}
    >
      <RetroBox theme="gray" bg="$color1">
        {uploading ? (
          <Spinner size="small" />
        ) : (
          <PlusIcon size={ICON_SIZE} weight="bold" color={theme.color12.val} />
        )}
      </RetroBox>
    </YStack>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
  },
  primary: {
    alignItems: "flex-end",
    gap: TOOLBAR_PADDING,
    paddingLeft: TOOLBAR_PADDING,
    paddingTop: TOOLBAR_PADDING,
    paddingRight: TOOLBAR_PADDING - RETRO_SHADOW_OFFSET,
    paddingBottom: TOOLBAR_PADDING - RETRO_SHADOW_OFFSET,
  },
  send: {
    justifyContent: "flex-end",
  },
  // 상하 7이면 한 줄 높이가 버튼(40)과 같아지고, 좌우 10은 버블 텍스트의 안쪽 여백과 같다.
  composerText: {
    paddingTop: COMPOSER_VERTICAL_PADDING,
    paddingBottom: COMPOSER_VERTICAL_PADDING,
    paddingHorizontal: 10,
    maxHeight:
      COMPOSER_LINE_HEIGHT * COMPOSER_MAX_LINES + COMPOSER_VERTICAL_PADDING * 2,
  },
});
