import { PaperPlaneRightIcon, PlusIcon } from "phosphor-react-native";
import { StyleSheet } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import {
  InputToolbar,
  type ActionsProps,
  type ComposerProps,
  type IMessage,
  type InputToolbarProps,
  type SendProps,
} from "react-native-gifted-chat";
import { useTheme, XStack, YStack } from "tamagui";

const INPUT_HEIGHT = 40;

const COMPOSER_LINE_HEIGHT = 20;
const COMPOSER_MAX_HEIGHT = 120;

const ACTION_ICON_SIZE = 20;
const SEND_ICON_SIZE = 18;

export function ChatInputToolbar(props: InputToolbarProps<IMessage>) {
  const theme = useTheme();

  return (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: theme.background.val,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.borderColor.val,
      }}
      primaryStyle={{
        alignItems: "flex-end",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    />
  );
}

export function ChatActions({ onPressActionButton }: ActionsProps) {
  const theme = useTheme();

  return (
    <XStack
      width={INPUT_HEIGHT}
      height={INPUT_HEIGHT}
      rounded={9999}
      bg="$gray4"
      items="center"
      justify="center"
      pressStyle={{ opacity: 0.6 }}
      onPress={onPressActionButton}
    >
      <PlusIcon
        size={ACTION_ICON_SIZE}
        weight="bold"
        color={theme.color10.val}
      />
    </XStack>
  );
}

export function ChatComposer({ text = "", textInputProps }: ComposerProps) {
  const theme = useTheme();

  return (
    <YStack flex={1} bg="$gray4" rounded="$7" px="$3">
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
      width={INPUT_HEIGHT}
      height={INPUT_HEIGHT}
      rounded={9999}
      bg={disabled ? "$gray7" : "$blue10"}
      items="center"
      justify="center"
      pressStyle={{ opacity: 0.6 }}
      onPress={disabled ? undefined : () => onSend?.({ text: trimmed }, true)}
    >
      <PaperPlaneRightIcon size={SEND_ICON_SIZE} weight="fill" color="white" />
    </XStack>
  );
}

const styles = StyleSheet.create({
  composer: {
    minHeight: INPUT_HEIGHT,
    maxHeight: COMPOSER_MAX_HEIGHT,
    paddingVertical: (INPUT_HEIGHT - COMPOSER_LINE_HEIGHT) / 2,
    fontSize: 16,
    lineHeight: COMPOSER_LINE_HEIGHT,
  },
});
