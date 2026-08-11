import { Image } from "expo-image";
import { Text, XStack, YStack } from "tamagui";

import type { ChatMessageResponse } from "@/lib/api";
import { formatMessageTime } from "@/lib/date";
import { PHOTO_PRESS_OPACITY } from "@/lib/design";

const PHOTO_SIZE = 200;
const PHOTO_TRANSITION = 200;

export const CHAT_BUBBLE_MIN_HEIGHT = 41;

export function ChatBubble({
  message,
  mine,
  onPressPhoto,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  onPressPhoto: (url: string) => void;
}) {
  const photo = message.imageUrl;

  const time = (
    <Text shrink={0} fontSize="$1" color="$color11" mb={2}>
      {formatMessageTime(new Date(message.createdAt))}
    </Text>
  );

  return (
    <XStack shrink={1} items="flex-end" gap="$1.5">
      {mine && time}

      <YStack
        shrink={1}
        minH={CHAT_BUBBLE_MIN_HEIGHT}
        justify="center"
        borderWidth={2}
        borderColor="$color12"
        rounded={0}
        overflow="hidden"
        bg={mine && !photo ? "$blue10" : "$color1"}
      >
        {photo ? (
          <YStack
            pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
            onPress={() => onPressPhoto(photo)}
          >
            <Image
              source={photo}
              contentFit="cover"
              transition={PHOTO_TRANSITION}
              style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
            />
          </YStack>
        ) : (
          <Text
            px="$3"
            py="$2"
            fontSize="$4"
            color={mine ? "white" : "$color12"}
          >
            {message.content}
          </Text>
        )}
      </YStack>

      {!mine && time}
    </XStack>
  );
}
