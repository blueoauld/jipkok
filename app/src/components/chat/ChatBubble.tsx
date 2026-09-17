import { type ReactNode, useRef } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text, type TextProps, useTheme, XStack, YStack } from "tamagui";

import { PhotoMessage, VideoMessage } from "@/components/chat/ChatMediaMessage";
import { ReactionChips } from "@/components/chat/ChatReactionChips";
import { ReplyPreviewThumbnail } from "@/components/chat/ReplyPreviewThumbnail";
import { Button } from "@/components/ui/Button";
import type { ChatMessageResponse, ReplyMessageResponse } from "@/lib/api";
import { isSingleEmoji, replySummary } from "@/lib/chat";
import { splitLinks } from "@/lib/chat/links";
import type { MessageFrame } from "@/lib/chat/overlay-layout";
import { useUploadState } from "@/lib/chat/upload-store";
import { formatClockTime } from "@/lib/date";
import { CHAT_BUBBLE_RADIUS, PRESS_OPACITY } from "@/lib/design";
import i18n from "@/lib/i18n";
import { openWebPage } from "@/lib/support";
import { showToast } from "@/lib/toast/store";

const QUOTE_TEXT_ON_BLUE = "rgba(255, 255, 255, 0.7)";
const QUOTE_LINE_ON_BLUE = "rgba(255, 255, 255, 0.35)";

// TDS Bubble에서 잰 값이다. TDS는 꼬리를 아래 모서리에 달지만, 상대 사진과 이름 쪽을 가리키도록 위아래를
// 뒤집어 위 모서리에 단다. 꼬리는 모서리에서 바깥으로 5만큼 나간다.
const PADDING_X = 14;
const PADDING_Y = 12;
const FONT_SIZE = 16;
const LINE_HEIGHT = 24;
const EMOJI_FONT_SIZE = 40;
const TAIL_WIDTH = 13;
const TAIL_HEIGHT = 17;
export const BUBBLE_TAIL_OVERHANG = 5;
const TAIL_PATH =
  "M11.992 17c1.102.007 1.404-1.512.383-1.926-2.652-1.078-4.503-3.718-4.521-6.63V0h-2v.892C5.854 5.405 3.8 9.56.386 12.206c-.559.433-.504 1.293.105 1.652C3.898 15.865 7.922 16.974 11.992 17z";

const SECTION_GAP = 8;

const TIME_GAP = 4;

function BubbleFrame({
  mine,
  tail,
  children,
  onLongPress,
}: {
  mine: boolean;
  tail: boolean;
  children: ReactNode;
  onLongPress: () => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      shrink={1}
      rounded={CHAT_BUBBLE_RADIUS}
      bg={mine ? "$blue500" : "$grey200"}
      justify="center"
      onLongPress={onLongPress}
    >
      {children}

      {tail && (
        <Svg
          width={TAIL_WIDTH}
          height={TAIL_HEIGHT}
          viewBox={`0 0 ${TAIL_WIDTH} ${TAIL_HEIGHT}`}
          style={
            mine
              ? {
                  position: "absolute",
                  top: 0,
                  right: -BUBBLE_TAIL_OVERHANG,
                  transform: [{ scaleY: -1 }],
                }
              : {
                  position: "absolute",
                  top: 0,
                  left: -BUBBLE_TAIL_OVERHANG,
                  transform: [{ scaleX: -1 }, { scaleY: -1 }],
                }
          }
        >
          <Path
            d={TAIL_PATH}
            fill={mine ? theme.blue500.val : theme.grey200.val}
          />
        </Svg>
      )}
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
  const color = mine ? "$onFill" : "$grey800";

  return (
    <Text
      fontSize={large ? EMOJI_FONT_SIZE : FONT_SIZE}
      lineHeight={large ? undefined : LINE_HEIGHT}
      color={color}
    >
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
  onPressReply,
  onLongPress,
}: {
  mine: boolean;
  tail: boolean;
  replyName: string;
  reply: ReplyMessageResponse;
  content: string;
  onPressReply: (messageId: number) => void;
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
          onPress={() => onPressReply(reply.messageId)}
          onLongPress={onLongPress}
        >
          <ReplyPreviewThumbnail reply={reply} />

          <YStack shrink={1} gap={2}>
            <Text
              fontSize="$1"
              fontWeight="600"
              color={mine ? "$onFill" : "$grey800"}
              numberOfLines={1}
            >
              {i18n.t("component.replyTo", { name: replyName })}
            </Text>

            <Text
              fontSize="$1"
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

export function ChatBubbleContent({
  message,
  mine,
  tail,
  replyName,
  onPressPhoto,
  onPressVideo,
  onPressReply,
  onLongPress,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  tail: boolean;
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
        tail={tail}
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
  onPressReply,
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
      fontSize="$1"
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
          mt="$1.5"
        >
          <Text fontSize="$1" color="$red500" fontWeight="600">
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
