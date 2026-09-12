import { type ReactNode, useRef } from "react";
import { View } from "react-native";
import { Text, type TextProps, XStack, YStack } from "tamagui";

import { PhotoMessage, VideoMessage } from "@/components/chat/ChatMediaMessage";
import { ReactionChips } from "@/components/chat/ChatReactionChips";
import { ReplyPreviewThumbnail } from "@/components/chat/ReplyPreviewThumbnail";
import type { ChatMessageResponse, ReplyMessageResponse } from "@/lib/api";
import { isSingleEmoji, replySummary } from "@/lib/chat";
import { splitLinks } from "@/lib/chat/links";
import type { MessageFrame } from "@/lib/chat/overlay-layout";
import { useUploadState } from "@/lib/chat/upload-store";
import { formatClockTime } from "@/lib/date";
import { PRESS_OPACITY, RETRO_BORDER_WIDTH } from "@/lib/design";
import i18n from "@/lib/i18n";
import { openWebPage } from "@/lib/support";
import { useAccentToken } from "@/lib/theme/accent";
import { showToast } from "@/lib/toast/store";

const QUOTE_TEXT_ON_BLUE = "rgba(255, 255, 255, 0.7)";
const QUOTE_LINE_ON_BLUE = "rgba(255, 255, 255, 0.35)";

const MIN_HEIGHT = 36;

const H_PADDING = 10;
const FONT_SIZE = 16;
const EMOJI_FONT_SIZE = 40;

const SECTION_GAP = 6;

function BubbleFrame({
  mine,
  children,
  onLongPress,
}: {
  mine: boolean;
  children: ReactNode;
  onLongPress: () => void;
}) {
  const accent = useAccentToken();

  return (
    <YStack
      shrink={1}
      bg={mine ? accent : "$color1"}
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      minH={MIN_HEIGHT}
      justify="center"
      onLongPress={onLongPress}
    >
      {children}
    </YStack>
  );
}

const openLink = (url: string) =>
  openWebPage(url, (_variant, message) => showToast("error", message));

// 링크 위에서 길게 눌러도 말풍선 메뉴가 떠야 하므로 onLongPress를 같이 받는다.
// Tamagui Text는 중첩돼도 부모 색을 물려받지 않아 색을 따로 준다.
function LinkText({
  url,
  color,
  children,
  onLongPress,
}: {
  url: string;
  color: TextProps["color"];
  children: string;
  onLongPress: () => void;
}) {
  return (
    <Text
      color={color}
      textDecorationLine="underline"
      accessibilityRole="link"
      onPress={() => openLink(url)}
      onLongPress={onLongPress}
    >
      {children}
    </Text>
  );
}

function BodyText({
  mine,
  content,
  large = false,
  onLongPress,
}: {
  mine: boolean;
  content: string;
  large?: boolean;
  onLongPress: () => void;
}) {
  const color = mine ? "$onFill" : "$color12";

  return (
    <Text fontSize={large ? EMOJI_FONT_SIZE : FONT_SIZE} color={color}>
      {splitLinks(content).map((segment, index) =>
        segment.url ? (
          <LinkText
            key={index}
            url={segment.url}
            color={color}
            onLongPress={onLongPress}
          >
            {segment.text}
          </LinkText>
        ) : (
          segment.text
        ),
      )}
    </Text>
  );
}

function TextMessage({
  mine,
  content,
  onLongPress,
}: {
  mine: boolean;
  content: string;
  onLongPress: () => void;
}) {
  return (
    <BubbleFrame mine={mine} onLongPress={onLongPress}>
      <YStack px={H_PADDING} py={H_PADDING}>
        <BodyText
          mine={mine}
          content={content}
          large={isSingleEmoji(content)}
          onLongPress={onLongPress}
        />
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
  onLongPress,
}: {
  mine: boolean;
  replyName: string;
  reply: ReplyMessageResponse;
  content: string;
  onPressReply: (messageId: number) => void;
  onLongPress: () => void;
}) {
  return (
    <BubbleFrame mine={mine} onLongPress={onLongPress}>
      <YStack px={H_PADDING} py={10} gap={SECTION_GAP}>
        <XStack
          items="flex-start"
          gap="$2.5"
          pressStyle={{ opacity: PRESS_OPACITY }}
          onPress={() => onPressReply(reply.messageId)}
        >
          <ReplyPreviewThumbnail reply={reply} />

          <YStack shrink={1} gap={2}>
            <Text
              fontSize="$2"
              fontWeight="600"
              color={mine ? "$onFill" : "$color12"}
              numberOfLines={1}
            >
              {i18n.t("component.replyTo", { name: replyName })}
            </Text>

            <Text
              fontSize="$2"
              color={mine ? QUOTE_TEXT_ON_BLUE : "$color11"}
              numberOfLines={2}
            >
              {replySummary(reply)}
            </Text>
          </YStack>
        </XStack>

        <YStack height={1} bg={mine ? QUOTE_LINE_ON_BLUE : "$color8"} />

        <BodyText mine={mine} content={content} onLongPress={onLongPress} />
      </YStack>
    </BubbleFrame>
  );
}

export function ChatBubbleContent({
  message,
  mine,
  replyName,
  onPressPhoto,
  onPressVideo,
  onPressReply,
  onLongPress,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  replyName: string;
  onPressPhoto: (message: ChatMessageResponse) => void;
  onPressVideo: (message: ChatMessageResponse) => void;
  onPressReply: (messageId: number) => void;
  onLongPress: () => void;
}) {
  if (message.type === "VIDEO") {
    return (
      <VideoMessage
        message={message}
        onPress={onPressVideo}
        onLongPress={onLongPress}
      />
    );
  }

  if (message.imageUrl) {
    return (
      <PhotoMessage
        message={message}
        url={message.imageUrl}
        onPress={onPressPhoto}
        onLongPress={onLongPress}
      />
    );
  }

  if (message.replyMessage) {
    return (
      <ReplyMessage
        mine={mine}
        replyName={replyName}
        reply={message.replyMessage}
        content={message.content ?? ""}
        onPressReply={onPressReply}
        onLongPress={onLongPress}
      />
    );
  }

  return (
    <TextMessage
      mine={mine}
      content={message.content ?? ""}
      onLongPress={onLongPress}
    />
  );
}

export function ChatBubble({
  message,
  mine,
  showTime,
  replyName,
  myMemberId,
  onPressPhoto,
  onPressVideo,
  onPressReply,
  onOpenActions,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  showTime: boolean;
  replyName: string;
  myMemberId: number;
  onPressPhoto: (message: ChatMessageResponse) => void;
  onPressVideo: (message: ChatMessageResponse) => void;
  onPressReply: (messageId: number) => void;
  onOpenActions: (message: ChatMessageResponse, frame: MessageFrame) => void;
}) {
  const bubbleRef = useRef<View>(null);
  const upload = useUploadState(message.clientMessageId);
  // 사진과 동영상은 자기 오버레이에 실패를 그리므로 글만 여기서 다룬다.
  const failed = upload?.phase === "failed" && message.type === "TEXT";
  const openActions = () =>
    bubbleRef.current?.measureInWindow((x, y, width, height) =>
      onOpenActions(message, { x, y, width, height }),
    );
  // 시간이 없는 메시지에도 같은 자리를 비워 두어야 묶음 안의 말풍선 너비가 같다.
  const time = (
    <Text
      shrink={0}
      fontSize="$2"
      color="$color11"
      mb={2}
      opacity={showTime ? 1 : 0}
      accessibilityElementsHidden={!showTime}
      importantForAccessibility={showTime ? "auto" : "no-hide-descendants"}
    >
      {formatClockTime(new Date(message.createdAt))}
    </Text>
  );

  return (
    <YStack shrink={1}>
      {/* 실패 줄이 말풍선보다 넓으면 컨테이너가 그 폭이 되므로 말풍선 줄도 제자리에 붙인다. */}
      <XStack
        shrink={1}
        self={mine ? "flex-end" : "flex-start"}
        items="flex-end"
        gap="$1.5"
      >
        {mine && time}

        <View ref={bubbleRef} collapsable={false} style={{ flexShrink: 1 }}>
          <ChatBubbleContent
            message={message}
            mine={mine}
            replyName={replyName}
            onPressPhoto={onPressPhoto}
            onPressVideo={onPressVideo}
            onPressReply={onPressReply}
            onLongPress={openActions}
          />
        </View>

        {!mine && time}
      </XStack>

      {message.reactions.length > 0 && (
        <ReactionChips
          reactions={message.reactions}
          mine={mine}
          myMemberId={myMemberId}
          onPress={openActions}
        />
      )}

      {failed && upload && (
        <XStack
          self={mine ? "flex-end" : "flex-start"}
          items="center"
          gap="$2"
          mt="$1"
        >
          <Text fontSize="$2" color="$red10" fontWeight="600">
            {i18n.t("component.sendFailed")}
          </Text>
          <FailedAction
            label={i18n.t("component.resend")}
            onPress={upload.retry}
          />
          <FailedAction
            label={i18n.t("action.delete")}
            onPress={upload.cancel}
          />
        </XStack>
      )}
    </YStack>
  );
}

function FailedAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <XStack
      px="$2"
      py={2}
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      pressStyle={{ opacity: PRESS_OPACITY }}
      accessibilityRole="button"
      onPress={onPress}
    >
      <Text fontSize="$2" fontWeight="600" color="$color12">
        {label}
      </Text>
    </XStack>
  );
}
