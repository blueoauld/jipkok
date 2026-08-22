import { Image } from "expo-image";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { type ReactNode, useRef } from "react";
import { View } from "react-native";
import { Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { ReplyPreviewThumbnail } from "@/components/chat/ReplyPreviewThumbnail";
import type {
  ChatMessageResponse,
  ChatReactionResponse,
  ReplyMessageResponse,
} from "@/lib/api";
import {
  groupReactions,
  isPending,
  isSingleEmoji,
  replySummary,
} from "@/lib/chat";
import type { MessageFrame } from "@/lib/chat/overlay-layout";
import { type UploadState, useUploadState } from "@/lib/chat/upload-store";
import { formatClockTime } from "@/lib/date";
import {
  IMAGE_TRANSITION,
  OVERLAY_BG,
  PHOTO_PRESS_OPACITY,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import i18n from "@/lib/i18n";
import { useAccentToken } from "@/lib/theme/accent";
import { formatDuration } from "@/lib/video";

const QUOTE_TEXT_ON_BLUE = "rgba(255, 255, 255, 0.7)";
const QUOTE_LINE_ON_BLUE = "rgba(255, 255, 255, 0.35)";

const PHOTO_SIZE = 200;
const PLAY_ICON_SIZE = 40;
const DURATION_INSET = 6;

const MIN_HEIGHT = 36;

const H_PADDING = 10;
const FONT_SIZE = 16;
const EMOJI_FONT_SIZE = 40;

const SECTION_GAP = 6;

const CHIP_GAP = 2;
const CHIP_FONT_SIZE = 12;
const CHIP_SIZE = 24;

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

function BodyText({
  mine,
  content,
  large = false,
}: {
  mine: boolean;
  content: string;
  large?: boolean;
}) {
  return (
    <Text
      fontSize={large ? EMOJI_FONT_SIZE : FONT_SIZE}
      color={mine ? "white" : "$color12"}
    >
      {content}
    </Text>
  );
}

function VideoMessage({
  message,
  onPress,
  onLongPress,
}: {
  message: ChatMessageResponse;
  onPress: (message: ChatMessageResponse) => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const upload = useUploadState(message.clientMessageId);
  const cacheKey = message.clientMessageId ?? String(message.messageId);
  const busy = upload !== undefined || isPending(message);

  return (
    <YStack
      pressStyle={busy ? undefined : { opacity: PHOTO_PRESS_OPACITY }}
      onPress={busy ? undefined : () => onPress(message)}
      onLongPress={busy ? undefined : onLongPress}
    >
      <Image
        source={{ uri: message.thumbnailUrl ?? undefined, cacheKey }}
        recyclingKey={cacheKey}
        contentFit="cover"
        transition={IMAGE_TRANSITION}
        style={{
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
          borderWidth: RETRO_BORDER_WIDTH,
          borderColor: theme.gray12.val,
          backgroundColor: theme.gray12.val,
        }}
      />

      {upload ? (
        <UploadOverlay upload={upload} showPhase />
      ) : isPending(message) ? (
        <YStack fullscreen bg={OVERLAY_BG} items="center" justify="center">
          <Spinner size="small" color="white" />
        </YStack>
      ) : (
        <>
          <YStack fullscreen items="center" justify="center">
            <PlayIcon size={PLAY_ICON_SIZE} weight="fill" color="white" />
          </YStack>

          {message.durationSeconds != null && (
            <XStack
              position="absolute"
              b={DURATION_INSET}
              r={DURATION_INSET}
              px="$1.5"
              py={2}
              bg={OVERLAY_BG}
            >
              <Text fontSize="$2" color="white" fontWeight="600">
                {formatDuration(message.durationSeconds)}
              </Text>
            </XStack>
          )}
        </>
      )}
    </YStack>
  );
}

function UploadOverlay({
  upload,
  showPhase = false,
}: {
  upload: UploadState;
  showPhase?: boolean;
}) {
  const percent = `${Math.round(upload.progress * 100)}%`;
  const phase =
    upload.phase === "compressing"
      ? i18n.t("component.compressing")
      : i18n.t("component.uploading");

  return (
    <YStack fullscreen bg={OVERLAY_BG} items="center" justify="center" gap="$2">
      {upload.phase === "failed" ? (
        <>
          <Text fontSize="$3" color="white" fontWeight="600">
            {i18n.t("component.sendFailed")}
          </Text>

          <XStack gap="$2">
            <OverlayAction
              label={i18n.t("component.resend")}
              onPress={upload.retry}
            />
            <OverlayAction
              label={i18n.t("action.delete")}
              onPress={upload.cancel}
            />
          </XStack>
        </>
      ) : (
        <>
          <Text fontSize="$3" color="white" fontWeight="600">
            {showPhase ? phase + percent : percent}
          </Text>

          <OverlayAction
            label={i18n.t("component.cancel")}
            onPress={upload.cancel}
          />
        </>
      )}
    </YStack>
  );
}

function OverlayAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <XStack
      px="$3"
      py="$1.5"
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="white"
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={onPress}
    >
      <Text fontSize="$2" color="white" fontWeight="600">
        {label}
      </Text>
    </XStack>
  );
}

function PhotoMessage({
  message,
  url,
  onPress,
  onLongPress,
}: {
  message: ChatMessageResponse;
  url: string;
  onPress: (url: string) => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const upload = useUploadState(message.clientMessageId);
  const cacheKey = message.clientMessageId ?? String(message.messageId);
  const busy = upload !== undefined || isPending(message);

  return (
    <YStack
      pressStyle={busy ? undefined : { opacity: PHOTO_PRESS_OPACITY }}
      onPress={busy ? undefined : () => onPress(url)}
      onLongPress={busy ? undefined : onLongPress}
    >
      <Image
        source={{ uri: url, cacheKey }}
        recyclingKey={cacheKey}
        contentFit="cover"
        transition={IMAGE_TRANSITION}
        style={{
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
          borderWidth: RETRO_BORDER_WIDTH,
          borderColor: theme.gray12.val,
          backgroundColor: theme.gray12.val,
        }}
      />

      {upload ? (
        <UploadOverlay upload={upload} />
      ) : (
        isPending(message) && (
          <YStack fullscreen bg={OVERLAY_BG} items="center" justify="center">
            <Spinner size="small" color="white" />
          </YStack>
        )
      )}
    </YStack>
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
              color={mine ? "white" : "$color12"}
              numberOfLines={1}
            >
              {i18n.t("component.replyTo", { name: replyName })}
            </Text>

            <Text
              fontSize={14}
              color={mine ? QUOTE_TEXT_ON_BLUE : "$color11"}
              numberOfLines={2}
            >
              {replySummary(reply)}
            </Text>
          </YStack>
        </XStack>

        <YStack height={1} bg={mine ? QUOTE_LINE_ON_BLUE : "$color8"} />

        <BodyText mine={mine} content={content} />
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
  onPressPhoto: (url: string) => void;
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

function ReactionChip({
  emoji,
  count,
  reacted,
  onPress,
}: {
  emoji: string;
  count: number;
  reacted: boolean;
  onPress: () => void;
}) {
  const accent = useAccentToken();

  return (
    <XStack
      height={CHIP_SIZE}
      width={count === 1 ? CHIP_SIZE : undefined}
      px={count === 1 ? 0 : "$1.5"}
      items="center"
      justify="center"
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      bg={reacted ? accent : "$color1"}
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={onPress}
    >
      <Text fontSize={CHIP_FONT_SIZE} color={reacted ? "white" : "$color12"}>
        {count === 1 ? emoji : `${emoji} ${count}`}
      </Text>
    </XStack>
  );
}

function ReactionChips({
  reactions,
  mine,
  myMemberId,
  onPress,
}: {
  reactions: ChatReactionResponse[];
  mine: boolean;
  myMemberId: number;
  onPress: () => void;
}) {
  const groups = groupReactions(reactions, myMemberId);

  return (
    <XStack
      self={mine ? "flex-end" : "flex-start"}
      mt={CHIP_GAP}
      gap={CHIP_GAP}
    >
      {groups.map(({ emoji, count, reacted }) => (
        <ReactionChip
          key={emoji}
          emoji={emoji}
          count={count}
          reacted={reacted}
          onPress={onPress}
        />
      ))}
    </XStack>
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
  onPressPhoto: (url: string) => void;
  onPressVideo: (message: ChatMessageResponse) => void;
  onPressReply: (messageId: number) => void;
  onOpenActions: (message: ChatMessageResponse, frame: MessageFrame) => void;
}) {
  const bubbleRef = useRef<View>(null);
  const openActions = () =>
    bubbleRef.current?.measureInWindow((x, y, width, height) =>
      onOpenActions(message, { x, y, width, height }),
    );
  const time = showTime && (
    <Text shrink={0} fontSize="$1" color="$color11" mb={2}>
      {formatClockTime(new Date(message.createdAt))}
    </Text>
  );

  return (
    <YStack shrink={1}>
      <XStack shrink={1} items="flex-end" gap="$1.5">
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
    </YStack>
  );
}
