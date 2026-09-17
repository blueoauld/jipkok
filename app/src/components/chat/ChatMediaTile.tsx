import { Image } from "expo-image";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { memo } from "react";
import { Text, useTheme, XStack, YStack } from "tamagui";

import type { ChatMessageResponse } from "@/lib/api";
import { mediaSummary } from "@/lib/chat";
import {
  IMAGE_TRANSITION,
  OVERLAY_BG,
  OVERLAY_INK,
  PHOTO_PRESS_OPACITY,
  PILL_RADIUS,
} from "@/lib/design";
import { formatDuration } from "@/lib/video";

// 프로필 사진 격자 칸과 같은 모서리다.
const TILE_RADIUS = 12;
const PLAY_ICON_SIZE = 28;
const DURATION_INSET = 6;

export const ChatMediaTile = memo(function ChatMediaTile({
  message,
  size,
  onPress,
}: {
  message: ChatMessageResponse;
  size: number;
  onPress: (message: ChatMessageResponse) => void;
}) {
  const theme = useTheme();
  const video = message.type === "VIDEO";
  const url = video ? message.thumbnailUrl : message.imageUrl;
  const cacheKey = String(message.messageId);

  return (
    <YStack
      width={size}
      height={size}
      rounded={TILE_RADIUS}
      overflow="hidden"
      pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
      accessible
      accessibilityRole="imagebutton"
      accessibilityLabel={[
        mediaSummary(message.type),
        message.durationSeconds != null &&
          formatDuration(message.durationSeconds),
      ]
        .filter(Boolean)
        .join(" ")}
      onPress={() => onPress(message)}
    >
      <Image
        source={{ uri: url ?? undefined, cacheKey }}
        recyclingKey={cacheKey}
        contentFit="cover"
        transition={IMAGE_TRANSITION}
        style={{
          width: size,
          height: size,
          backgroundColor: theme.grey100.val,
        }}
      />

      {video && (
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
              py={1}
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
});
