import { Image } from "expo-image";
import { Text, YStack } from "tamagui";

import type { ReplyMessageResponse } from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";

const PHOTO_SIZE = 40;
const PHOTO_TEXT = "사진";

export function ChatMessageReply({
  name,
  mine,
  reply,
  onPress,
}: {
  name: string;
  mine: boolean;
  reply: ReplyMessageResponse;
  onPress: (reply: ReplyMessageResponse) => void;
}) {
  return (
    <YStack
      px="$3"
      pt="$2"
      gap="$1"
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={() => onPress(reply)}
    >
      <Text
        fontSize="$2"
        fontWeight="600"
        color={mine ? "white" : "$color12"}
        numberOfLines={1}
      >
        {name}에게 답장
      </Text>

      {reply.imageUrl ? (
        <Image
          source={reply.imageUrl}
          contentFit="cover"
          style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
        />
      ) : (
        <Text
          fontSize="$2"
          color={mine ? "rgba(255, 255, 255, 0.7)" : "$color11"}
          numberOfLines={2}
        >
          {reply.content || PHOTO_TEXT}
        </Text>
      )}

      <YStack
        height={1}
        mt="$1"
        bg={mine ? "rgba(255, 255, 255, 0.35)" : "$color8"}
      />
    </YStack>
  );
}
