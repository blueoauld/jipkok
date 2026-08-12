import { Image } from "expo-image";
import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { type ReactNode, type RefObject, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import type { ReplyMessageResponse } from "@/lib/api";
import {
  DISABLED_OPACITY,
  FLOATING_BUTTON_SIZE,
  PRESS_OPACITY,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";

const ICON_SIZE = 20;

const TOOLBAR_PADDING = getTokens().space.$3.val;
const TOOLBAR_H_PADDING = getTokens().space.$4.val;

const PLACEHOLDER = "메시지 입력";
const MAX_LENGTH = 1000;

const COMPOSER_FONT_SIZE = 16;
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

const PREVIEW_PHOTO_SIZE = 40;
const PREVIEW_CLOSE_ICON_SIZE = 18;

function ChatReplyPreview({
  name,
  reply,
  onClear,
}: {
  name: string;
  reply: ReplyMessageResponse;
  onClear: () => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      theme="gray"
      ml={TOOLBAR_H_PADDING}
      mr={TOOLBAR_H_PADDING - RETRO_SHADOW_OFFSET}
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
        pl="$2"
        pr="$3"
        py="$2"
        gap="$2.5"
      >
        {reply.imageUrl && (
          <Image
            source={reply.imageUrl}
            contentFit="cover"
            style={{ width: PREVIEW_PHOTO_SIZE, height: PREVIEW_PHOTO_SIZE }}
          />
        )}

        <YStack flex={1} gap="$1">
          <Text fontSize="$2" fontWeight="600" color="$color12">
            {name}에게 답장
          </Text>

          <Text fontSize="$3" color="$color11" numberOfLines={1}>
            {reply.content || "사진"}
          </Text>
        </YStack>

        <XStack
          py="$2"
          pressStyle={{ opacity: PRESS_OPACITY }}
          onPress={onClear}
        >
          <XIcon size={PREVIEW_CLOSE_ICON_SIZE} color={theme.color11.val} />
        </XStack>
      </XStack>
    </YStack>
  );
}

function ChatActions({
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

export function ChatInputBar({
  textInputRef,
  uploading,
  reply,
  replyName,
  onClearReply,
  onPickPhotos,
  onSendText,
}: {
  textInputRef: RefObject<TextInput>;
  uploading: boolean;
  reply: ReplyMessageResponse | null;
  replyName: string;
  onClearReply: () => void;
  onPickPhotos: () => void;
  onSendText: (text: string) => void;
}) {
  const theme = useTheme();
  const [text, setText] = useState("");
  const trimmed = text.trim();

  const send = () => {
    if (!trimmed) {
      return;
    }

    onSendText(trimmed);
    setText("");
  };

  return (
    <YStack>
      {reply && (
        <ChatReplyPreview name={replyName} reply={reply} onClear={onClearReply} />
      )}

      <XStack items="flex-end" gap={TOOLBAR_PADDING} style={styles.primary}>
        <ChatActions uploading={uploading} onPress={onPickPhotos} />

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
              ref={textInputRef}
              value={text}
              onChangeText={setText}
              placeholder={PLACEHOLDER}
              placeholderTextColor={theme.color11.val}
              maxLength={MAX_LENGTH}
              multiline
              style={[styles.composerText, { color: theme.color12.val }]}
            />
          </XStack>
        </XStack>

        <YStack
          opacity={trimmed ? 1 : DISABLED_OPACITY}
          pressStyle={trimmed ? { opacity: PRESS_OPACITY } : undefined}
          onPress={trimmed ? send : undefined}
        >
          <RetroBox theme="blue" bg="$color10">
            <PaperPlaneRightIcon size={ICON_SIZE} weight="fill" color="white" />
          </RetroBox>
        </YStack>
      </XStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  primary: {
    paddingLeft: TOOLBAR_H_PADDING,
    paddingTop: TOOLBAR_PADDING,
    paddingRight: TOOLBAR_H_PADDING - RETRO_SHADOW_OFFSET,
    paddingBottom: TOOLBAR_PADDING - RETRO_SHADOW_OFFSET,
  },
  // 상하 7이면 한 줄 높이가 버튼(40)과 같아지고, 좌우 10은 버블 텍스트의 안쪽 여백과 같다.
  composerText: {
    flex: 1,
    fontSize: COMPOSER_FONT_SIZE,
    lineHeight: COMPOSER_LINE_HEIGHT,
    paddingTop: COMPOSER_VERTICAL_PADDING,
    paddingBottom: COMPOSER_VERTICAL_PADDING,
    paddingHorizontal: 10,
    maxHeight:
      COMPOSER_LINE_HEIGHT * COMPOSER_MAX_LINES + COMPOSER_VERTICAL_PADDING * 2,
  },
});
