import { Image } from "expo-image";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { ChatMessageReply } from "@/components/ChatMessageReply";
import type { ChatMessageResponse, ReplyMessageResponse } from "@/lib/api";
import { formatMessageTime } from "@/lib/date";
import { PHOTO_PRESS_OPACITY } from "@/lib/design";

const PHOTO_SIZE = 200;

const MIN_HEIGHT = 36;

const TEXT_H_PADDING = 10;
const TEXT_V_PADDING = 5;
const TEXT_FONT_SIZE = 16;
const TEXT_LINE_HEIGHT = 20;

export function displayMinute(createdAt: string | number | Date) {
  return Math.floor(new Date(createdAt).getTime() / 60_000);
}

const PHOTO_TRANSITION = 200;

export function ChatBubble({
  message,
  mine,
  showTime,
  replyName,
  onPressPhoto,
  onPressReply,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  showTime: boolean;
  replyName: string;
  onPressPhoto: (url: string) => void;
  onPressReply: (reply: ReplyMessageResponse) => void;
}) {
  const theme = useTheme();
  const photoOnly = !!message.imageUrl && !message.content;

  const time = showTime && (
    <Text shrink={0} fontSize="$1" color="$color11" mb={2}>
      {formatMessageTime(new Date(message.createdAt))}
    </Text>
  );

  const photo = message.imageUrl && (
    <YStack
      pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
      onPress={() => onPressPhoto(message.imageUrl!)}
    >
      <Image
        source={{
          uri: message.imageUrl,
          // 서명 URL은 매번 달라져서 메시지 id를 캐시 키로 쓴다.
          cacheKey: message.clientMessageId ?? String(message.messageId),
        }}
        contentFit="cover"
        transition={PHOTO_TRANSITION}
        style={{
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
          borderWidth: 2,
          borderColor: theme.color12.val,
        }}
      />
    </YStack>
  );

  return (
    <XStack shrink={1} items="flex-end" gap="$1.5">
      {mine && time}

      {photoOnly ? (
        photo
      ) : (
        <YStack
          shrink={1}
          bg={mine ? "$blue10" : "$color1"}
          borderWidth={2}
          borderColor="$color12"
          minH={MIN_HEIGHT}
          justify="center"
        >
          {message.replyMessage && (
            <ChatMessageReply
              name={replyName}
              mine={mine}
              reply={message.replyMessage}
              onPress={onPressReply}
            />
          )}

          {photo}

          {!!message.content && (
            <Text
              px={TEXT_H_PADDING}
              py={TEXT_V_PADDING}
              fontSize={TEXT_FONT_SIZE}
              lineHeight={TEXT_LINE_HEIGHT}
              color={mine ? "white" : "$color12"}
            >
              {message.content}
            </Text>
          )}
        </YStack>
      )}

      {!mine && time}
    </XStack>
  );
}
