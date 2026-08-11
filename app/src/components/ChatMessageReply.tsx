import { Image } from "expo-image";
import type { IMessage } from "react-native-gifted-chat";
import type { MessageReplyProps } from "react-native-gifted-chat/lib/components/MessageReply";
import { Text, YStack } from "tamagui";

import { PRESS_OPACITY } from "@/lib/design";

const PHOTO_SIZE = 40;
const PHOTO_TEXT = "사진";

export function ChatMessageReply({
  name,
  replyMessage,
  position,
  onPress,
}: MessageReplyProps<IMessage> & { name: string }) {
  const blue = position === "right";

  return (
    <YStack
      px="$3"
      pt="$2"
      gap="$1"
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={() => onPress?.(replyMessage)}
    >
      <Text
        fontSize="$2"
        fontWeight="600"
        color={blue ? "white" : "$color12"}
        numberOfLines={1}
      >
        {name}에게 답장
      </Text>

      {replyMessage.image ? (
        <Image
          source={replyMessage.image}
          contentFit="cover"
          style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
        />
      ) : (
        <Text
          fontSize="$2"
          color={blue ? "rgba(255, 255, 255, 0.7)" : "$color11"}
          numberOfLines={2}
        >
          {replyMessage.text || PHOTO_TEXT}
        </Text>
      )}

      <YStack
        height={1}
        mt="$1"
        bg={blue ? "rgba(255, 255, 255, 0.35)" : "$color8"}
      />
    </YStack>
  );
}
