import { Image } from "expo-image";
import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import type { ReactNode } from "react";
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
import type { ReplyPreviewProps } from "react-native-gifted-chat/lib/components/ReplyPreview";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import {
  DISABLED_OPACITY,
  FLOATING_BUTTON_SIZE,
  PRESS_OPACITY,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";

const ICON_SIZE = 20;

const PREVIEW_PHOTO_SIZE = 40;
const PREVIEW_CLOSE_ICON_SIZE = 18;
const PREVIEW_PHOTO_TEXT = "사진";

const COMPOSER_FONT_SIZE = 15;
const COMPOSER_LINE_HEIGHT = 20;
const COMPOSER_MAX_HEIGHT = 120;

const TOOLBAR_PADDING = getTokens().space.$3.val;

function ToolbarButton({
  theme,
  bg,
  pressBg,
  disabled,
  onPress,
  children,
}: {
  theme: "gray" | "blue";
  bg: "$color1" | "$color10";
  pressBg: "$color3" | "$color11";
  disabled?: boolean;
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <YStack theme={theme} opacity={disabled ? DISABLED_OPACITY : 1}>
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
        pressStyle={
          disabled
            ? undefined
            : { x: RETRO_SHADOW_OFFSET, y: RETRO_SHADOW_OFFSET, bg: pressBg }
        }
        onPress={disabled ? undefined : onPress}
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

export function ChatReplyPreview({
  name,
  replyMessage,
  onClearReply,
}: ReplyPreviewProps & { name: string }) {
  const theme = useTheme();

  return (
    <YStack
      theme="gray"
      ml={TOOLBAR_PADDING}
      mr={TOOLBAR_PADDING - RETRO_SHADOW_OFFSET}
      mt={TOOLBAR_PADDING}
    >
      <YStack
        position="absolute"
        t={RETRO_SHADOW_OFFSET}
        b={-RETRO_SHADOW_OFFSET}
        l={RETRO_SHADOW_OFFSET}
        r={-RETRO_SHADOW_OFFSET}
        bg="$gray12"
      />
      <XStack
        borderWidth={2}
        borderColor="$gray12"
        bg="$color1"
        items="center"
        px="$3"
        py="$2"
        gap="$2.5"
      >
        {replyMessage.image && (
          <Image
            source={replyMessage.image}
            contentFit="cover"
            style={{ width: PREVIEW_PHOTO_SIZE, height: PREVIEW_PHOTO_SIZE }}
          />
        )}

        <YStack flex={1} gap="$1">
          <Text fontSize="$2" fontWeight="600" color="$color12">
            {name}에게 답장
          </Text>

          <Text fontSize="$3" color="$color11" numberOfLines={1}>
            {replyMessage.text || PREVIEW_PHOTO_TEXT}
          </Text>
        </YStack>

        <XStack
          py="$2"
          pressStyle={{ opacity: PRESS_OPACITY }}
          onPress={onClearReply}
        >
          <XIcon size={PREVIEW_CLOSE_ICON_SIZE} color={theme.color11.val} />
        </XStack>
      </XStack>
    </YStack>
  );
}

export function ChatActions({
  onPressActionButton,
  uploading,
}: ActionsProps & { uploading?: boolean }) {
  const theme = useTheme();

  return (
    <ToolbarButton
      theme="gray"
      bg="$color1"
      pressBg="$color3"
      disabled={uploading}
      onPress={onPressActionButton}
    >
      {uploading ? (
        <Spinner size="small" />
      ) : (
        <PlusIcon size={ICON_SIZE} weight="bold" color={theme.color12.val} />
      )}
    </ToolbarButton>
  );
}

export function ChatComposer({ text = "", textInputProps }: ComposerProps) {
  const theme = useTheme();

  return (
    <YStack flex={1} theme="gray">
      <YStack
        position="absolute"
        t={RETRO_SHADOW_OFFSET}
        b={-RETRO_SHADOW_OFFSET}
        l={RETRO_SHADOW_OFFSET}
        r={-RETRO_SHADOW_OFFSET}
        bg="$gray12"
      />
      <YStack borderWidth={2} borderColor="$gray12" bg="$color1">
        <TextInput
          value={text}
          multiline
          underlineColorAndroid="transparent"
          placeholderTextColor={theme.color11.val}
          {...textInputProps}
          style={[styles.composer, { color: theme.color12.val }]}
        />
      </YStack>
    </YStack>
  );
}

export function ChatSend({ text, onSend }: SendProps<IMessage>) {
  const trimmed = text?.trim() ?? "";
  const disabled = trimmed.length === 0;

  return (
    <ToolbarButton
      theme="blue"
      bg="$color10"
      pressBg="$color11"
      disabled={disabled}
      onPress={() => onSend?.({ text: trimmed }, true)}
    >
      <PaperPlaneRightIcon size={ICON_SIZE} weight="fill" color="white" />
    </ToolbarButton>
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
  composer: {
    minHeight: FLOATING_BUTTON_SIZE - 4,
    maxHeight: COMPOSER_MAX_HEIGHT,
    paddingVertical: (FLOATING_BUTTON_SIZE - 4 - COMPOSER_LINE_HEIGHT) / 2,
    paddingHorizontal: TOOLBAR_PADDING - 2,
    fontSize: COMPOSER_FONT_SIZE,
    lineHeight: COMPOSER_LINE_HEIGHT,
  },
});
