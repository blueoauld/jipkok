import { PaperPlaneRightIcon, PlusIcon } from "phosphor-react-native";
import { StyleSheet } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import {
  type ActionsProps,
  type ComposerProps,
  type IMessage,
  InputToolbar,
  type InputToolbarProps,
  type SendProps,
} from "react-native-gifted-chat";
import { Spinner, useTheme, XStack, YStack } from "tamagui";

import { PRESS_OPACITY } from "@/lib/design";

import { GlassSurface } from "./GlassSurface";

const PILL_PADDING = 6;
const BUTTON_SIZE = 36;
const PILL_HEIGHT = BUTTON_SIZE + PILL_PADDING * 2;

const COMPOSER_LINE_HEIGHT = 20;
const COMPOSER_MAX_HEIGHT = 120;

const ACTION_ICON_SIZE = 20;
const SEND_ICON_SIZE = 18;
const TOOLBAR_MARGIN = 12;

export function ChatInputToolbar(props: InputToolbarProps<IMessage>) {
  const theme = useTheme();

  return (
    <YStack px={TOOLBAR_MARGIN} pt={TOOLBAR_MARGIN} pb={TOOLBAR_MARGIN}>
      <GlassSurface
        tintColor={theme.gray3.val}
        style={{
          borderRadius: PILL_HEIGHT / 2,
          overflow: "hidden",
        }}
      >
        <InputToolbar
          {...props}
          containerStyle={{
            backgroundColor: "transparent",
            borderTopWidth: 0,
          }}
          primaryStyle={{
            alignItems: "flex-end",
            gap: 4,
            padding: PILL_PADDING,
          }}
        />
      </GlassSurface>
    </YStack>
  );
}

export function ChatActions({
  onPressActionButton,
  uploading,
}: ActionsProps & { uploading?: boolean }) {
  const theme = useTheme();

  return (
    <XStack
      width={BUTTON_SIZE}
      height={BUTTON_SIZE}
      rounded={9999}
      bg="$gray2"
      items="center"
      justify="center"
      pressStyle={uploading ? undefined : { opacity: PRESS_OPACITY }}
      onPress={uploading ? undefined : onPressActionButton}
    >
      {uploading ? (
        <Spinner size="small" />
      ) : (
        <PlusIcon
          size={ACTION_ICON_SIZE}
          weight="bold"
          color={theme.color10.val}
        />
      )}
    </XStack>
  );
}

export function ChatComposer({ text = "", textInputProps }: ComposerProps) {
  const theme = useTheme();

  return (
    <YStack flex={1}>
      <TextInput
        value={text}
        multiline
        underlineColorAndroid="transparent"
        {...textInputProps}
        style={[styles.composer, { color: theme.color.val }]}
      />
    </YStack>
  );
}

export function ChatSend({ text, onSend }: SendProps<IMessage>) {
  const trimmed = text?.trim() ?? "";
  const disabled = trimmed.length === 0;

  return (
    <XStack
      width={BUTTON_SIZE}
      height={BUTTON_SIZE}
      rounded={9999}
      bg={disabled ? "$gray7" : "$blue10"}
      items="center"
      justify="center"
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={disabled ? undefined : () => onSend?.({ text: trimmed }, true)}
    >
      <PaperPlaneRightIcon size={SEND_ICON_SIZE} weight="fill" color="white" />
    </XStack>
  );
}

const styles = StyleSheet.create({
  composer: {
    minHeight: BUTTON_SIZE,
    maxHeight: COMPOSER_MAX_HEIGHT,
    paddingVertical: (BUTTON_SIZE - COMPOSER_LINE_HEIGHT) / 2,
    paddingHorizontal: 4,
    fontSize: 16,
    lineHeight: COMPOSER_LINE_HEIGHT,
  },
});
