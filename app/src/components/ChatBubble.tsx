import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Text, useTheme, XStack, YStack } from "tamagui";

import type { ChatMessageResponse, ReplyMessageResponse } from "@/lib/api";
import { replySummary } from "@/lib/chat";
import { formatClockTime } from "@/lib/date";
import { PHOTO_PRESS_OPACITY, PRESS_OPACITY } from "@/lib/design";

const QUOTE_TEXT_ON_BLUE = "rgba(255, 255, 255, 0.7)";
const QUOTE_LINE_ON_BLUE = "rgba(255, 255, 255, 0.35)";

const PHOTO_SIZE = 200;
const PHOTO_TRANSITION = 200;

const MIN_HEIGHT = 36;

const H_PADDING = 10;
const FONT_SIZE = 16;

const V_PADDING = 5;

// 답장 인용과 본문을 가르는 구분선의 위아래 간격
const SECTION_GAP = 6;

function BubbleFrame({
  mine,
  children,
}: {
  mine: boolean;
  children: ReactNode;
}) {
  return (
    <YStack
      shrink={1}
      bg={mine ? "$blue10" : "$color1"}
      borderWidth={2}
      borderColor="$color12"
      minH={MIN_HEIGHT}
      justify="center"
    >
      {children}
    </YStack>
  );
}

function BodyText({ mine, content }: { mine: boolean; content: string }) {
  return (
    <Text fontSize={FONT_SIZE} color={mine ? "white" : "$color12"}>
      {content}
    </Text>
  );
}

function PhotoMessage({
  url,
  cacheKey,
  onPress,
}: {
  url: string;
  cacheKey: string;
  onPress: (url: string) => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
      onPress={() => onPress(url)}
    >
      <Image
        source={{ uri: url, cacheKey }}
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
}

function TextMessage({ mine, content }: { mine: boolean; content: string }) {
  return (
    <BubbleFrame mine={mine}>
      <YStack px={H_PADDING} py={V_PADDING}>
        <BodyText mine={mine} content={content} />
      </YStack>
    </BubbleFrame>
  );
}

function ReplyMessage({
  mine,
  replyName,
  reply,
  content,
  onPressReply,
}: {
  mine: boolean;
  replyName: string;
  reply: ReplyMessageResponse;
  content: string;
  onPressReply: (messageId: number) => void;
}) {
  return (
    <BubbleFrame mine={mine}>
      <YStack px={H_PADDING} py={V_PADDING} gap={SECTION_GAP}>
        <YStack
          gap={2}
          pressStyle={{ opacity: PRESS_OPACITY }}
          onPress={() => onPressReply(reply.messageId)}
        >
          <Text
            fontSize="$1"
            fontWeight="600"
            color={mine ? "white" : "$color12"}
            numberOfLines={1}
          >
            {replyName}
          </Text>

          <Text
            fontSize="$2"
            color={mine ? QUOTE_TEXT_ON_BLUE : "$color11"}
            numberOfLines={2}
          >
            {replySummary(reply)}
          </Text>
        </YStack>

        <YStack height={1} bg={mine ? QUOTE_LINE_ON_BLUE : "$color8"} />

        <BodyText mine={mine} content={content} />
      </YStack>
    </BubbleFrame>
  );
}

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
  onPressReply: (messageId: number) => void;
}) {
  const time = showTime && (
    <Text shrink={0} fontSize="$1" color="$color11" mb={2}>
      {formatClockTime(new Date(message.createdAt))}
    </Text>
  );

  return (
    <XStack shrink={1} items="flex-end" gap="$1.5">
      {mine && time}

      {message.imageUrl ? (
        <PhotoMessage
          url={message.imageUrl}
          cacheKey={message.clientMessageId ?? String(message.messageId)}
          onPress={onPressPhoto}
        />
      ) : message.replyMessage ? (
        <ReplyMessage
          mine={mine}
          replyName={replyName}
          reply={message.replyMessage}
          content={message.content ?? ""}
          onPressReply={onPressReply}
        />
      ) : (
        <TextMessage mine={mine} content={message.content ?? ""} />
      )}

      {!mine && time}
    </XStack>
  );
}
