import { Image } from "expo-image";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { memo } from "react";
import { Text, useTheme, XStack, YStack } from "tamagui";

import type { ChatMessageResponse } from "@/lib/api";
import { mediaSummary } from "@/lib/chat";
import {
  IMAGE_TRANSITION,
  OVERLAY_BG,
  PHOTO_PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import { formatDuration } from "@/lib/video";

const PLAY_ICON_SIZE = 28;
const DURATION_INSET = 4;

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
      pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
      accessibilityRole="imagebutton"
      accessibilityLabel={mediaSummary(message.type)}
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
          borderWidth: RETRO_BORDER_WIDTH,
          borderColor: theme.gray12.val,
          backgroundColor: theme.gray12.val,
        }}
      />

      {video && (
        <>
          <YStack fullscreen items="center" justify="center">
            <PlayIcon size={PLAY_ICON_SIZE} weight="fill" color="white" />
          </YStack>

          {message.durationSeconds != null && (
            <XStack
              position="absolute"
              b={DURATION_INSET}
              r={DURATION_INSET}
              px="$1"
              py={1}
              bg={OVERLAY_BG}
            >
              <Text fontSize="$1" color="white" fontWeight="600">
                {formatDuration(message.durationSeconds)}
              </Text>
            </XStack>
          )}
        </>
      )}
    </YStack>
  );
});
