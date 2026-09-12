import { Image } from "expo-image";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import type { ChatMessageResponse } from "@/lib/api";
import { isPending } from "@/lib/chat";
import { type UploadState, useUploadState } from "@/lib/chat/upload-store";
import {
  IMAGE_TRANSITION,
  OVERLAY_BG,
  OVERLAY_INK,
  PHOTO_PRESS_OPACITY,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import i18n from "@/lib/i18n";
import { formatDuration } from "@/lib/video";

const PHOTO_SIZE = 200;
const PLAY_ICON_SIZE = 40;
const DURATION_INSET = 6;

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
              px="$1.5"
              py={2}
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
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor={OVERLAY_INK}
      pressStyle={{ opacity: PRESS_OPACITY }}
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
      pressStyle={busy ? undefined : { opacity: PHOTO_PRESS_OPACITY }}
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
            <Spinner size="small" color={OVERLAY_INK} />
          </YStack>
        )
      )}
    </YStack>
  );
}
