import { Image } from "expo-image";
import { Text, useTheme, XStack, YStack } from "tamagui";

import type { ChatMessageResponse } from "@/lib/api";
import { formatClockTime } from "@/lib/date";
import { PHOTO_PRESS_OPACITY } from "@/lib/design";

const PHOTO_SIZE = 200;
const PHOTO_TRANSITION = 200;

const MIN_HEIGHT = 36;

const TEXT_H_PADDING = 10;
const TEXT_V_PADDING = 5;
const TEXT_FONT_SIZE = 16;
const TEXT_LINE_HEIGHT = 20;

export function ChatBubble({
  message,
  mine,
  showTime,
  onPressPhoto,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  showTime: boolean;
  onPressPhoto: (url: string) => void;
}) {
  const theme = useTheme();

  const time = showTime && (
    <Text shrink={0} fontSize="$1" color="$color11" mb={2}>
      {formatClockTime(new Date(message.createdAt))}
    </Text>
  );

  return (
    <XStack shrink={1} items="flex-end" gap="$1.5">
      {mine && time}

      {message.imageUrl ? (
        <YStack
          pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
          onPress={() => onPressPhoto(message.imageUrl!)}
        >
          <Image
            source={{
              uri: message.imageUrl,
              cacheKey: String(message.messageId),
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
      ) : (
        <YStack
          shrink={1}
          bg={mine ? "$blue10" : "$color1"}
          borderWidth={2}
          borderColor="$color12"
          minH={MIN_HEIGHT}
          justify="center"
        >
          <Text
            px={TEXT_H_PADDING}
            py={TEXT_V_PADDING}
            fontSize={TEXT_FONT_SIZE}
            lineHeight={TEXT_LINE_HEIGHT}
            color={mine ? "white" : "$color12"}
          >
            {message.content}
          </Text>
        </YStack>
      )}

      {!mine && time}
    </XStack>
  );
}
