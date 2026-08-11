import { Image } from "expo-image";
import type { BubbleProps, IMessage } from "react-native-gifted-chat";
import { Text, XStack, YStack } from "tamagui";

import { formatMessageTime } from "@/lib/date";
import { DISABLED_OPACITY, PHOTO_PRESS_OPACITY } from "@/lib/design";

const PHOTO_SIZE = 200;
const PHOTO_TRANSITION = 200;

export const CHAT_BUBBLE_MIN_HEIGHT = 41;

export function ChatBubble({
  currentMessage,
  position,
  onPressPhoto,
}: BubbleProps<IMessage> & { onPressPhoto: (url: string) => void }) {
  const mine = position === "right";
  const photo = currentMessage.image;

  const time = (
    <Text shrink={0} fontSize="$1" color="$color11" mb={2}>
      {formatMessageTime(new Date(currentMessage.createdAt))}
    </Text>
  );

  return (
    <XStack items="flex-end" gap="$1.5">
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
        opacity={currentMessage.pending ? DISABLED_OPACITY : 1}
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
            {currentMessage.text}
          </Text>
        )}
      </YStack>

      {!mine && time}
    </XStack>
  );
}
