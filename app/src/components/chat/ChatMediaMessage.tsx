import { Image } from "expo-image";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import type { ChatMessageResponse } from "@/lib/api";
import { isPending, mediaSummary } from "@/lib/chat";
import { type UploadState, useUploadState } from "@/lib/chat/upload-store";
import {
  CHAT_BUBBLE_RADIUS,
  IMAGE_TRANSITION,
  OVERLAY_BG,
  OVERLAY_INK,
  PHOTO_PRESS_OPACITY,
  PILL_RADIUS,
  PRESS_OPACITY,
} from "@/lib/design";
import i18n from "@/lib/i18n";
import { formatDuration } from "@/lib/video";

const PHOTO_SIZE = 200;
const PLAY_ICON_SIZE = 40;
const DURATION_INSET = 8;
const OVERLAY_ACTION_BORDER_WIDTH = 1;

export function VideoMessage({
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
      rounded={CHAT_BUBBLE_RADIUS}
      overflow="hidden"
      pressStyle={busy ? undefined : { opacity: PHOTO_PRESS_OPACITY }}
      accessible={!busy}
      accessibilityRole={busy ? undefined : "imagebutton"}
      accessibilityLabel={[
        mediaSummary(message.type),
        message.durationSeconds != null &&
          formatDuration(message.durationSeconds),
      ]
        .filter(Boolean)
        .join(" ")}
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
          backgroundColor: theme.grey100.val,
        }}
      />

      {upload ? (
        <UploadOverlay upload={upload} showPhase />
      ) : isPending(message) ? (
        <YStack fullscreen bg={OVERLAY_BG} items="center" justify="center">
          <Spinner size="small" color={OVERLAY_INK} />
        </YStack>
      ) : (
        <>
          <YStack fullscreen items="center" justify="center">
            <PlayIcon size={PLAY_ICON_SIZE} weight="fill" color={OVERLAY_INK} />
          </YStack>

          {message.durationSeconds != null && (
            <XStack
              position="absolute"
              b={DURATION_INSET}
              r={DURATION_INSET}
              px="$2"
              py={2}
              rounded={PILL_RADIUS}
              bg={OVERLAY_BG}
            >
              <Text fontSize="$2" color={OVERLAY_INK} fontWeight="600">
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
  const label = showPhase
    ? i18n.t(
        upload.phase === "compressing"
          ? "component.compressProgress"
          : "component.uploadProgress",
        { percent },
      )
    : percent;

  return (
    <YStack fullscreen bg={OVERLAY_BG} items="center" justify="center" gap="$2">
      {upload.phase === "failed" ? (
        <>
          <Text fontSize="$4" color={OVERLAY_INK} fontWeight="600">
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
          <Text fontSize="$4" color={OVERLAY_INK} fontWeight="600">
            {label}
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
      rounded={PILL_RADIUS}
      borderWidth={OVERLAY_ACTION_BORDER_WIDTH}
      borderColor={OVERLAY_INK}
      pressStyle={{ opacity: PRESS_OPACITY }}
      accessible
      accessibilityRole="button"
      onPress={onPress}
    >
      <Text fontSize="$2" color={OVERLAY_INK} fontWeight="600">
        {label}
      </Text>
    </XStack>
  );
}

export function PhotoMessage({
  message,
  url,
  onPress,
  onLongPress,
}: {
  message: ChatMessageResponse;
  url: string;
  onPress: (message: ChatMessageResponse) => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const upload = useUploadState(message.clientMessageId);
  const cacheKey = message.clientMessageId ?? String(message.messageId);
  const busy = upload !== undefined || isPending(message);

  return (
    <YStack
      rounded={CHAT_BUBBLE_RADIUS}
      overflow="hidden"
      pressStyle={busy ? undefined : { opacity: PHOTO_PRESS_OPACITY }}
      accessible={!busy}
      accessibilityRole={busy ? undefined : "imagebutton"}
      accessibilityLabel={mediaSummary(message.type)}
      onPress={busy ? undefined : () => onPress(message)}
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
          backgroundColor: theme.grey100.val,
        }}
      />

      {upload ? (
        <UploadOverlay upload={upload} />
      ) : (
        isPending(message) && (
          <YStack fullscreen bg={OVERLAY_BG} items="center" justify="center">
            <Spinner size="small" color={OVERLAY_INK} />
          </YStack>
        )
      )}
    </YStack>
  );
}
