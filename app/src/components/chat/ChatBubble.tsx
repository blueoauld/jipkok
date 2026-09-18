import { useRef } from "react";
import { View } from "react-native";
import { XStack, YStack } from "tamagui";

import { BubbleFrame } from "@/components/chat/ChatBubbleFrame";
import { BodyText } from "@/components/chat/ChatBubbleText";
import { PhotoMessage, VideoMessage } from "@/components/chat/ChatMediaMessage";
import { ReactionChips } from "@/components/chat/ChatReactionChips";
import { ReplyPreviewThumbnail } from "@/components/chat/ReplyPreviewThumbnail";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import type { ChatMessageResponse, ReplyMessageResponse } from "@/lib/api";
import { isSingleEmoji, replySummary } from "@/lib/chat";
import type { MessageFrame } from "@/lib/chat/overlay-layout";
import { useUploadState } from "@/lib/chat/upload-store";
import { formatClockTime } from "@/lib/date";
import { PRESS_OPACITY } from "@/lib/design";
import i18n from "@/lib/i18n";

const QUOTE_TEXT_ON_BLUE = "rgba(255, 255, 255, 0.7)";
const QUOTE_LINE_ON_BLUE = "rgba(255, 255, 255, 0.35)";

// TDS Bubble에서 잰 값이다. TDS는 꼬리를 아래 모서리에 달지만, 상대 사진과 이름 쪽을 가리키도록 위아래를
// 뒤집어 위 모서리에 단다. 꼬리는 모서리에서 바깥으로 5만큼 나간다.
const PADDING_X = 14;
const PADDING_Y = 12;

const SECTION_GAP = 8;

const TIME_GAP = 4;

function TextMessage({
  mine,
  tail,
  content,
  onLongPress,
}: {
  mine: boolean;
  tail: boolean;
  content: string;
  onLongPress: () => void;
}) {
  return (
    <BubbleFrame mine={mine} tail={tail} onLongPress={onLongPress}>
      <YStack px={PADDING_X} py={PADDING_Y}>
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
  tail,
  replyName,
  reply,
  content,
  onPressQuote,
  onLongPress,
}: {
  mine: boolean;
  tail: boolean;
  replyName: string;
  reply: ReplyMessageResponse;
  content: string;
  onPressQuote: (messageId: number) => void;
  onLongPress: () => void;
}) {
  return (
    <BubbleFrame mine={mine} tail={tail} onLongPress={onLongPress}>
      <YStack px={PADDING_X} py={PADDING_Y} gap={SECTION_GAP}>
        {/* 인용부에도 길게 누르기를 달아야 액션 메뉴가 열린다. 없으면 원문으로 튄다. */}
        <XStack
          items="flex-start"
          gap="$2.5"
          pressStyle={{ opacity: PRESS_OPACITY }}
          accessible
          accessibilityRole="button"
          onPress={() => onPressQuote(reply.messageId)}
          onLongPress={onLongPress}
        >
          <ReplyPreviewThumbnail reply={reply} />

          <YStack shrink={1} gap={2}>
            <Text
              preset="captionStrong"
              color={mine ? "$onFill" : "$grey800"}
              numberOfLines={1}
            >
              {i18n.t("component.replyTo", { name: replyName })}
            </Text>

            <Text
              preset="note"
              color={mine ? QUOTE_TEXT_ON_BLUE : "$grey600"}
              numberOfLines={2}
            >
              {replySummary(reply)}
            </Text>
          </YStack>
        </XStack>

        <YStack height={1} bg={mine ? QUOTE_LINE_ON_BLUE : "$greyOpacity200"} />

        <BodyText mine={mine} content={content} onLongPress={onLongPress} />
      </YStack>
    </BubbleFrame>
  );
}

function ChatBubbleContent({
  message,
  mine,
  tail,
  replyName,
  onPressPhoto,
  onPressVideo,
  onPressQuote,
  onLongPress,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  tail: boolean;
  replyName: string;
  onPressPhoto: (message: ChatMessageResponse) => void;
  onPressVideo: (message: ChatMessageResponse) => void;
  onPressQuote: (messageId: number) => void;
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
        tail={tail}
        replyName={replyName}
        reply={message.replyMessage}
        content={message.content ?? ""}
        onPressQuote={onPressQuote}
        onLongPress={onLongPress}
      />
    );
  }

  return (
    <TextMessage
      mine={mine}
      tail={tail}
      content={message.content ?? ""}
      onLongPress={onLongPress}
    />
  );
}

export function ChatBubble({
  message,
  mine,
  tail,
  showTime,
  replyName,
  myMemberId,
  onPressPhoto,
  onPressVideo,
  onPressQuote,
  onOpenActions,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  tail: boolean;
  showTime: boolean;
  replyName: string;
  myMemberId: number;
  onPressPhoto: (message: ChatMessageResponse) => void;
  onPressVideo: (message: ChatMessageResponse) => void;
  onPressQuote: (messageId: number) => void;
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
      preset="caption"
      shrink={0}
      color="$grey500"
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
        gap={TIME_GAP}
      >
        {mine && time}

        <View ref={bubbleRef} collapsable={false} style={{ flexShrink: 1 }}>
          <ChatBubbleContent
            message={message}
            mine={mine}
            tail={tail}
            replyName={replyName}
            onPressPhoto={onPressPhoto}
            onPressVideo={onPressVideo}
            onPressQuote={onPressQuote}
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
          mt="$1.5"
        >
          <Text preset="captionStrong" color="$red500">
            {i18n.t("component.sendFailed")}
          </Text>
          <Button size="small" variant="secondary" onPress={upload.retry}>
            {i18n.t("component.resend")}
          </Button>
          <Button size="small" variant="secondary" onPress={upload.cancel}>
            {i18n.t("action.delete")}
          </Button>
        </XStack>
      )}
    </YStack>
  );
}
